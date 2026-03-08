"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import Quiz from "./Quiz";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import "./module-1.css";

type ChildProfile = {
  id: string;
  coinBalance: number;
  streak: number;
  modulesCompleted: string[];
};

type CardState = "current" | "entering" | "settled-past";

type AnimatedCard = {
  id: string;
  content: React.ReactNode;
  state: CardState;
};

const lessonCards = [
  {
    id: "intro",
    content: (
      <>
        When you spend money, it helps
        <br />
        to know the difference between
        <br />
        <strong>needs</strong> and <strong>wants</strong>.
      </>
    ),
  },
  {
    id: "needs-definition",
    content: (
      <>
        <strong>Needs</strong> are things you must have
        <br />
        to live safely and stay healthy.
        <br />
        Examples of needs are:
      </>
    ),
  },
  {
    id: "needs-examples",
    content: (
      <>
        🏠 A place to live
        <br />
        🍎 Food to eat
        <br />
        👕 Clothes to wear
        <br />
        🩺 Medicine when you&apos;re sick
      </>
    ),
  },
  {
    id: "wants-definition",
    content: (
      <>
        <strong>Wants</strong> are things that are nice
        <br />
        and fun to have, but you can still
        <br />
        be okay without them.
      </>
    ),
  },
  {
    id: "wants-label",
    content: <>Examples of wants are:</>,
  },
  {
    id: "wants-examples",
    content: (
      <>
        🎮 Video games
        <br />
        🍦 Ice cream
        <br />
        🧸 Toys
        <br />
        🎧 Cool headphones
      </>
    ),
  },
];

const CARD_TRANSITION_MS = 480;

export default function ModuleOnePage() {
  const router = useRouter();

  const [step, setStep] = useState<"lesson" | "quiz" | "goal" | "done">("lesson");
  const [goalItem, setGoalItem] = useState("");
  const [goalCost, setGoalCost] = useState("");
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [progressIndex, setProgressIndex] = useState(0);
  const [loadingChild, setLoadingChild] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [displayCards, setDisplayCards] = useState<AnimatedCard[]>([
    {
      ...lessonCards[0],
      state: "current",
    },
  ]);

  useEffect(() => {
    const loadChild = async () => {
      const childId = localStorage.getItem("kidChildId");

      if (!childId) {
        router.push("/kid/dashboard" as Route);
        return;
      }

      try {
        const childRef = doc(db, "children", childId);
        const childSnap = await getDoc(childRef);

        if (!childSnap.exists()) {
          router.push("/kid/dashboard" as Route);
          return;
        }

        const data = childSnap.data();

        setChild({
          id: childSnap.id,
          coinBalance: Number(data.coinBalance || 0),
          streak: Number(data.streak || 0),
          modulesCompleted: Array.isArray(data.modulesCompleted)
            ? data.modulesCompleted
            : [],
        });
      } catch (error) {
        console.error(error);
        router.push("/kid/dashboard" as Route);
      } finally {
        setLoadingChild(false);
      }
    };

    loadChild();
  }, [router]);

  const handleProceedLesson = () => {
    if (isAnimating) return;

    if (lessonIndex >= lessonCards.length - 1) {
      setStep("quiz");
      return;
    }

    const currentCard = lessonCards[lessonIndex];
    const nextCard = lessonCards[lessonIndex + 1];

    setIsAnimating(true);
    setProgressIndex(lessonIndex + 1);

    // Step 1: Mount next card in "entering" state (below + invisible)
    // Keep current card as "current"
    setDisplayCards([
      { ...currentCard, state: "current" },
      { ...nextCard, state: "entering" },
    ]);

    // Step 2: One frame later, trigger transitions:
    //   - current → settled-past (floats up and fades out)
    //   - entering → current (slides up into view)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDisplayCards([
          { ...currentCard, state: "settled-past" },
          { ...nextCard, state: "current" },
        ]);
      });
    });

    // Step 3: After transition completes, clean up the old card
    window.setTimeout(() => {
      setLessonIndex((prev) => prev + 1);
      setDisplayCards([{ ...nextCard, state: "current" }]);
      setIsAnimating(false);
    }, CARD_TRANSITION_MS + 60); // small buffer so transition fully completes
  };

  const handleQuizFinish = () => {
    setStep("goal");
  };

  const saveGoal = async () => {
    const childId = child?.id || localStorage.getItem("kidChildId");

    if (!childId) {
      alert("Child not found.");
      return;
    }

    if (!goalItem.trim()) {
      alert("Please enter something you want to save for.");
      return;
    }

    const numericCost = Number(goalCost);
    if (!Number.isFinite(numericCost) || numericCost <= 0) {
      alert("Please enter a valid cost.");
      return;
    }

    try {
      setSavingGoal(true);

      await runTransaction(db, async (transaction) => {
        const childRef = doc(db, "children", childId);
        const childSnap = await transaction.get(childRef);

        if (!childSnap.exists()) {
          throw new Error("Child profile not found.");
        }

        const childData = childSnap.data();
        const modulesCompleted = Array.isArray(childData.modulesCompleted)
          ? childData.modulesCompleted
          : [];

        const alreadyCompleted = modulesCompleted.includes("module-1");

        if (!alreadyCompleted) {
          transaction.update(childRef, {
            modulesCompleted: [...modulesCompleted, "module-1"],
            streak: Number(childData.streak || 0) + 1,
            updatedAt: serverTimestamp(),
          });
        }
      });

      await addDoc(collection(db, "goals"), {
        childId,
        item: goalItem.trim(),
        cost: numericCost,
        createdAt: serverTimestamp(),
      });

      setChild((prev) =>
        prev
          ? {
              ...prev,
              streak: prev.modulesCompleted.includes("module-1")
                ? prev.streak
                : prev.streak + 1,
              modulesCompleted: prev.modulesCompleted.includes("module-1")
                ? prev.modulesCompleted
                : [...prev.modulesCompleted, "module-1"],
            }
          : prev
      );

      setStep("done");
    } catch (error) {
      console.error(error);
      alert("Could not save your progress");
    } finally {
      setSavingGoal(false);
    }
  };

  const lessonProgress = useMemo(() => {
    return ((progressIndex + 1) / lessonCards.length) * 100;
  }, [progressIndex]);

  if (loadingChild) {
    return (
      <main className="module-one-page">
        <div className="module-one-shell">
          <p className="module-one-loading">Loading lesson...</p>
        </div>
      </main>
    );
  }

  if (step === "lesson") {
    return (
      <main className="module-one-page">
        <div className="module-one-shell">
          <section className="module-one-topbar">
            <button
              type="button"
              className="module-one-back"
              onClick={() => router.push("/kid/dashboard" as Route)}
              aria-label="Back to dashboard"
            >
              ‹
            </button>

            <div className="module-one-topbar-pills">
              <div className="module-one-pill module-one-pill-coins">
                <Image
                  src="/assets/CoinIcon.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="module-one-pill-icon"
                />
                <span>{child?.coinBalance ?? 0} Coins</span>
              </div>

              <div className="module-one-pill module-one-pill-streak">
                <Image
                  src="/assets/FireIcon.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="module-one-pill-icon"
                />
                <span>
                  {child?.streak ?? 0} {(child?.streak ?? 0) === 1 ? "day" : "days"}
                </span>
              </div>
            </div>
          </section>

          <section className="module-one-progress">
            <div className="module-one-progress-track">
              <div
                className="module-one-progress-fill"
                style={{ width: `${lessonProgress}%` }}
              />
            </div>
          </section>

          <section className="module-one-illustration-card">
            <div className="module-one-illustration-inner">
              <Image
                src="/assets/NeedsWants.svg"
                alt="Needs and wants illustration"
                fill
                priority
                style={{ objectFit: "contain" }}
              />
            </div>
          </section>

          <section className="module-one-lesson-stage" aria-live="polite">
            {displayCards.map((card) => (
              <article
                key={card.id}
                className={`module-one-text-card module-one-text-card--${card.state}`}
              >
                <p>{card.content}</p>
              </article>
            ))}
          </section>

          <section className="module-one-footer">
            <button
              type="button"
              className="module-one-primary-button"
              onClick={handleProceedLesson}
              disabled={isAnimating}
            >
              {lessonIndex === lessonCards.length - 1 ? "Start Mini Game" : "Proceed"}
            </button>
          </section>
        </div>
      </main>
    );
  }

  if (step === "quiz") {
    return <Quiz onFinish={handleQuizFinish} />;
  }

  if (step === "goal") {
    return (
      <main className="module-one-page">
        <div className="module-one-shell module-one-centered-shell">
          <section className="module-one-simple-card">
            <p className="module-one-card-kicker">Saving Goal</p>
            <h1 className="module-one-simple-title">Pick a Want to Save For</h1>
            <p className="module-one-simple-text">
              Great job. Now choose one fun thing you want, and set a goal for it.
            </p>

            <div className="module-one-field">
              <label htmlFor="goal-item">What do you want?</label>
              <input
                id="goal-item"
                placeholder="Example: Toy car"
                value={goalItem}
                onChange={(e) => setGoalItem(e.target.value)}
              />
            </div>

            <div className="module-one-field">
              <label htmlFor="goal-cost">How much does it cost?</label>
              <input
                id="goal-cost"
                type="number"
                placeholder="Example: 20"
                value={goalCost}
                onChange={(e) => setGoalCost(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="module-one-primary-button"
              onClick={saveGoal}
              disabled={savingGoal}
            >
              {savingGoal ? "Saving..." : "Save Goal"}
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="module-one-page">
      <div className="module-one-shell module-one-centered-shell">
        <section className="module-one-simple-card">
          <p className="module-one-card-kicker">Completed</p>
          <h1 className="module-one-simple-title">Module Complete!</h1>
          <p className="module-one-simple-text">
            Amazing work. You finished Module 1 and saved your first goal.
          </p>

          <button
            type="button"
            className="module-one-primary-button"
            onClick={() => router.push("/kid/dashboard" as Route)}
          >
            Return to Dashboard
          </button>
        </section>
      </div>
    </main>
  );
}
