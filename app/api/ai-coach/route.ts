import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

type GoalCoachRequest = {
  mode: "goal-coach";
  childName: string;
  coinBalance: number;
  goalTitle: string;
  goalCost: number;
  chores: { title: string; reward: number }[];
  streak?: number;
  modulesCompleted?: number;
};

type SpendOrSaveRequest = {
  mode: "spend-or-save";
  childName: string;
  coinBalance: number;
  itemName: string;
  itemCost: number;
  goalTitle?: string;
  goalCost?: number;
};

type CoachRequest = GoalCoachRequest | SpendOrSaveRequest;

function calculateGoalProgress(
  current: number,
  total: number
): { percentage: number; choresNeeded: number; daysEstimate: number } {
  const percentage = Math.round((current / total) * 100);
  const remaining = Math.max(total - current, 0);
  const avgChoreReward = 25; // reasonable estimate
  const choresNeeded = Math.ceil(remaining / avgChoreReward);
  const daysEstimate = Math.max(Math.ceil(choresNeeded / 2), 1); // assuming 2 chores per day

  return { percentage, choresNeeded, daysEstimate };
}

function analyzePurchaseImpact(
  itemCost: number,
  coinBalance: number,
  goalCost: number,
  goalRemaining: number | null
): {
  canAfford: boolean;
  delaySeriousness: "minimal" | "moderate" | "severe";
  percentOfGoal: number;
} {
  const canAfford = itemCost <= coinBalance;
  const percentOfGoal = goalCost > 0 ? (itemCost / goalCost) * 100 : 0;

  let delaySeriousness: "minimal" | "moderate" | "severe" = "minimal";
  if (goalRemaining !== null && goalRemaining > 0) {
    const percentOfRemaining = (itemCost / goalRemaining) * 100;
    if (percentOfRemaining > 75) delaySeriousness = "severe";
    else if (percentOfRemaining > 40) delaySeriousness = "moderate";
  }

  return { canAfford, delaySeriousness, percentOfGoal };
}

function buildGoalCoachPrompt(body: GoalCoachRequest): string {
  const remaining = Math.max(body.goalCost - body.coinBalance, 0);
  const progress = calculateGoalProgress(body.coinBalance, body.goalCost);
  const isClose = progress.percentage > 75;

  const bestChore = body.chores.reduce((a, b) =>
    b.reward > a.reward ? b : a
  );

  return `
You are a cool money coach helping a kid reach their goal. Keep it SHORT—like texting a friend.

${body.childName}'s goal: ${body.goalTitle} ($${body.goalCost})
Progress: ${progress.percentage}% done (${body.coinBalance}/${body.goalCost})
Coins left: ${remaining}
Top chore: ${bestChore.title} (+${bestChore.reward} coins)
Available chores: ${body.chores.length}

Return ONLY valid JSON with:
{
  "title": "2-4 words max, catchy",
  "message": "ONE sentence celebrating progress or building momentum",
  "actionTip": "ONE specific thing they should do right now (mention a chore or habit)",
  "generalTip": "ONE cool money tip that applies to ANY goal (e.g., 'Do hard chores first', 'Bundle small tasks together', 'Track your wins')"
}

RULES:
- message should match their progress (celebrate if close, pump them up if early)
- actionTip should name a specific chore or pattern from their list
- generalTip should be universal advice that works for saving toward anything
- Sound like a friend giving real talk, not a textbook
- NO percentages or numbers in the actual response
  `;
}

function buildSpendCoachPrompt(body: SpendOrSaveRequest): string {
  const goalRemaining =
    body.goalCost != null
      ? Math.max(body.goalCost - body.coinBalance, 0)
      : null;

  const impact = analyzePurchaseImpact(
    body.itemCost,
    body.coinBalance,
    body.goalCost ?? 0,
    goalRemaining
  );

  const hasGoal = body.goalTitle && body.goalTitle !== "None";

  return `
You are a cool, supportive money coach helping a kid decide if they should buy something. Be motivating and real—like a friend who believes in them.

Item: ${body.itemName} (costs ${body.itemCost} coins)
They have: ${body.coinBalance} coins
Can afford? ${impact.canAfford ? "YES" : "NO"}
${hasGoal ? `Goal: ${body.goalTitle} (need ${goalRemaining} more coins)` : "No goal yet"}

Return ONLY valid JSON with:
{
  "title": "2-4 words, fun energy",
  "message": "ONE short sentence about the choice (be real but positive)",
  "recommendation": "ONLY 'buy' or 'save'",
  "reason": "ONE sentence explaining why (supportive, not preachy)",
  "encouragement": "One upbeat, motivating sentence that validates their feeling"
}

RULES:
- Sound like a friend who gets it, not a teacher
- If they can't afford it, be direct and KIND—offer hope ("You're getting closer!")
- If saving helps the goal, explain why it's worth it (but acknowledge the cool thing they want)
- If buying won't hurt much, say 'buy'—it's okay to enjoy things sometimes
- ALWAYS end with something that motivates them, never makes them feel bad
- Use their name energy ("You got this", "This is smart", etc.)
  `;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as CoachRequest;

    // Input validation
    if (!body.childName || body.coinBalance < 0) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    let prompt = "";

    if (body.mode === "goal-coach") {
      prompt = buildGoalCoachPrompt(body);
    } else if (body.mode === "spend-or-save") {
      prompt = buildSpendCoachPrompt(body);
    }

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContent(prompt);

    const text = response.response.text();

    // Strip markdown code fences if present
    const cleanedText = text
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);

      // Validate spend-or-save recommendation
      if (
        body.mode === "spend-or-save" &&
        !["buy", "save"].includes(parsed.recommendation)
      ) {
        parsed.recommendation = "save"; // Default to safe option
      }
    } catch {
      parsed = {
        title: "Money Coach",
        message: cleanedText || "Keep going. You're making progress.",
        recommendation:
          body.mode === "spend-or-save"
            ? "save"
            : "Try one more chore this week.",
        encouragement: "Nice work!",
      };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI coach error:", error);
    return NextResponse.json(
      { error: "Failed to get coaching response." },
      { status: 500 }
    );
  }
}