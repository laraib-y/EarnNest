"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import "./module-2.css";

type ChildProfile = {
  id: string;
  coinBalance: number;
  streak: number;
};

type LessonCard = {
  id: string;
  content: React.ReactNode;
};

type AnimatedCard = LessonCard & {
  state: "current" | "entering" | "settled-past";
};

const lessonCards: LessonCard[] = [
  {
    id: "intro",
    content: (
      <>
        When you get money, it&apos;s a good
        <br />
        idea to make a plan for how to use
        <br />
        it. That plan is called a <strong>budget</strong>.
      </>
    ),
  },
  {
    id: "budget-helps",
    content: (
      <>
        A budget helps you decide:
        <br />• How much money to <strong>spend</strong>
        <br />• How much money to <strong>save</strong>
        <br />• What you want to use your
        <br />
        money for
      </>
    ),
  },
  {
    id: "saving-definition",
    content: (
      <>
        <strong>Saving</strong> means putting some of
        <br />
        your money aside now so you can
        <br />
        use it later.
      </>
    ),
  },
  {
    id: "saving-future",
    content: (
      <>
        Saving takes patience, but it
        <br />
        helps you buy bigger things in the
        <br />
        <strong>future</strong>.
      </>
    ),
  },
  {
    id: "use-money-wisely",
    content: (
      <>
        To use your money wisely, you
        <br />
        should:
        <br />
        1. Spend a little
        <br />
        2. Save some for later
      </>
    ),
  },
];

const CARD_TRANSITION_MS = 480;

export default function Module2Page() {
  const router = useRouter();

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loadingChild, setLoadingChild] = useState(true);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [progressIndex, setProgressIndex] = useState(0);
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
      router.push("/kid/modules/module-2/quiz" as Route);
      return;
    }

    const currentCard = lessonCards[lessonIndex];
    const nextCard = lessonCards[lessonIndex + 1];

    setIsAnimating(true);
    setProgressIndex(lessonIndex + 1);

    // Step 1: mount next card in entering state
    setDisplayCards([
      { ...currentCard, state: "current" },
      { ...nextCard, state: "entering" },
    ]);

    // Step 2: trigger transitions
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDisplayCards([
          { ...currentCard, state: "settled-past" },
          { ...nextCard, state: "current" },
        ]);
      });
    });

    // Step 3: clean up old card after transition
    window.setTimeout(() => {
      setLessonIndex((prev) => prev + 1);
      setDisplayCards([{ ...nextCard, state: "current" }]);
      setIsAnimating(false);
    }, CARD_TRANSITION_MS + 60);
  };

  const lessonProgress = ((progressIndex + 1) / lessonCards.length) * 100;

  if (loadingChild) {
    return (
      <main className="module-two-page">
        <div className="module-two-shell">
          <p className="module-two-loading">Loading lesson...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="module-two-page">
      <div className="module-two-shell">
        <section className="module-two-topbar">
          <button
            type="button"
            className="module-two-back"
            onClick={() => router.push("/kid/dashboard" as Route)}
            aria-label="Back to dashboard"
          >
            ‹
          </button>

          <div className="module-two-topbar-pills">
            <div className="module-two-pill module-two-pill-coins">
              <Image
                src="/assets/CoinIcon.svg"
                alt=""
                width={18}
                height={18}
                className="module-two-pill-icon"
              />
              <span>{child?.coinBalance ?? 0} Coins</span>
            </div>

            <div className="module-two-pill module-two-pill-streak">
              <Image
                src="/assets/FireIcon.svg"
                alt=""
                width={18}
                height={18}
                className="module-two-pill-icon"
              />
              <span>
                {child?.streak ?? 0}{" "}
                {(child?.streak ?? 0) === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        </section>

        {/* Progress bar */}
        <section className="module-two-progress">
          <div className="module-two-progress-track">
            <div
              className="module-two-progress-fill"
              style={{ width: `${lessonProgress}%` }}
            />
          </div>
        </section>

        <section className="module-two-illustration-card">
          <div className="module-two-illustration-inner">
            <Image
              src="/assets/Saving.svg"
              alt="Saving and budgeting illustration"
              fill
              priority
              style={{ objectFit: "contain" }}
            />
          </div>
        </section>

        <section className="module-two-lesson-stage" aria-live="polite">
          {displayCards.map((card) => (
            <article
              key={card.id}
              className={`module-two-text-card module-two-text-card--${card.state}`}
            >
              <p>{card.content}</p>
            </article>
          ))}
        </section>

        <section className="module-two-footer">
          <button
            type="button"
            className="module-two-primary-button"
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
