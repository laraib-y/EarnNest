import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getFamilyId, verifyParentFromRequest } from "@/lib/auth";

type ReportChild = {
  id: string;
  displayName?: string;
  balance?: number;
  streak?: number;
  totalCoinsEarned?: number;
  totalChoresCompleted?: number;
  saveCoins?: number;
  spendCoins?: number;
  shareCoins?: number;
  quizPerformance?: unknown;
  learningProgress?: unknown[];
};

export async function GET(request: Request) {
  try {
    const decoded = await verifyParentFromRequest(request);
    const familyId = await getFamilyId(decoded.uid);

    const familyRef = adminDb.collection("families").doc(familyId);
    const childSnapshot = await familyRef.collection("children").get();

    const children: ReportChild[] = childSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ReportChild, "id">),
    }));

    const totals = children.reduce(
      (acc, child) => {
        acc.totalCoinsEarned += child.totalCoinsEarned ?? 0;
        acc.totalChoresCompleted += child.totalChoresCompleted ?? 0;
        acc.saveCoins += child.saveCoins ?? 0;
        acc.spendCoins += child.spendCoins ?? 0;
        acc.shareCoins += child.shareCoins ?? 0;
        acc.bestStreak = Math.max(acc.bestStreak, child.streak ?? 0);
        return acc;
      },
      {
        totalCoinsEarned: 0,
        totalChoresCompleted: 0,
        saveCoins: 0,
        spendCoins: 0,
        shareCoins: 0,
        bestStreak: 0,
      }
    );

    return NextResponse.json({
      familyId,
      totals,
      children: children.map((child) => ({
        id: child.id,
        displayName: child.displayName ?? "Child",
        balance: child.balance ?? 0,
        streak: child.streak ?? 0,
        totalCoinsEarned: child.totalCoinsEarned ?? 0,
        totalChoresCompleted: child.totalChoresCompleted ?? 0,
        quizPerformance: child.quizPerformance ?? null,
        learningProgress: child.learningProgress ?? [],
      })),
      prompt: children.length
        ? `Ask ${children[0].displayName ?? "your child"} what they are saving for and why that goal matters to them.`
        : "Ask your child what they want to save for next.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load reports";

    return NextResponse.json({ error: message }, { status: 401 });
  }
}