"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { module2Meta, module2Scenarios } from "../questions";
import "../module-2.css";

export default function Module2QuizPage() {
  const [childId, setChildId] = useState<string | null>(null);
  const [loadingChild, setLoadingChild] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedCoins, setSavedCoins] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [moduleRewarded, setModuleRewarded] = useState(false);

  const currentScenario = module2Scenarios[currentIndex];
  const isLastScenario = currentIndex === module2Scenarios.length - 1;
  const progressPercent = Math.min(
    100,
    Math.round((savedCoins / module2Meta.savingGoal) * 100)
  );

  const hasWon = useMemo(() => {
    return savedCoins >= module2Meta.savingGoal;
  }, [savedCoins]);

  useEffect(() => {
    const storedChildId = localStorage.getItem("kidChildId");
    if (!storedChildId) {
      setLoadingChild(false);
      return;
    }
    setChildId(storedChildId);
    setLoadingChild(false);
  }, []);

  const handleChoice = (optionId: string) => {
    if (isRevealed) return;

    const option = currentScenario.options.find((item) => item.id === optionId);
    if (!option) return;

    setSelectedOptionId(optionId);
    setSavedCoins((prev) => prev + option.saveAmount);
    setFeedback(option.message);
    setIsRevealed(true);
  };

  const handleNext = async () => {
    if (!isRevealed) return;

    if (isLastScenario) {
      if (hasWon && childId && !moduleRewarded) {
        try {
          setFinishing(true);

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

            const alreadyCompleted = modulesCompleted.includes(module2Meta.id);

            if (!alreadyCompleted) {
              transaction.update(childRef, {
                modulesCompleted: [...modulesCompleted, module2Meta.id],
                coinBalance: Number(childData.coinBalance || 0) + module2Meta.rewardCoins,
                updatedAt: serverTimestamp(),
              });
            }
          });

          setModuleRewarded(true);
        } catch (error) {
          console.error(error);
          alert("Could not save your module progress.");
        } finally {
          setFinishing(false);
        }
      }

      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOptionId(null);
    setFeedback("");
    setIsRevealed(false);
  };

  if (loadingChild) {
    return (
      <main className="module2-page">
        <div className="module2-shell">
          <p className="module2-loading">Loading game...</p>
        </div>
      </main>
    );
  }

  if (!childId) {
    return (
      <main className="module2-page">
        <div className="module2-shell">
          <div className="module2-empty-state">
            <h1>Not signed in</h1>
            <p>Please return to the kid login page first.</p>
            <Link href={"/kid" as Route} className="module2-primary-button">
              Go to Kid Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isLastScenario && isRevealed) {
    return (
      <main className="module2-page">
        <div className="module2-shell">
          <section className="module2-game-card module2-result-card">
            <p className="module2-kicker">Module Complete</p>
            <h1 className="module2-title result-title">
              {hasWon ? "You reached your saving goal! 🎉" : "Good try — play again! 💪"}
            </h1>

            <div className="module2-goal-panel">
              <div className="module2-goal-top">
                <span>Saved</span>
                <strong>
                  {savedCoins} / {module2Meta.savingGoal} coins
                </strong>
              </div>
              <div className="module2-progress-track">
                <div
                  className="module2-progress-fill"
                  style={{ width: `${Math.min(100, (savedCoins / module2Meta.savingGoal) * 100)}%` }}
                />
              </div>
            </div>

            <p className="module2-result-text">
              {hasWon
                ? `Amazing job! You planned your coins well and earned ${module2Meta.rewardCoins} bonus coins.`
                : "You made some good choices, but your budget can get even stronger. Try again and save more coins."}
            </p>

            <div className="module2-result-actions">
              <Link href={"/kid/dashboard" as Route} className="module2-primary-button">
                Back to Dashboard
              </Link>

              {!hasWon && (
                <Link href={"/kid/modules/module-2" as Route} className="module2-secondary-button">
                  Try Module Again
                </Link>
              )}

              {hasWon && finishing && (
                <span className="module2-saving-text">Saving your progress...</span>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="module2-page">
      <div className="module2-shell">
        <section className="module2-game-card">
          <div className="module2-game-topbar">
            <p className="module2-kicker">Saving Game</p>
            <span className="module2-round-pill">
              Round {currentIndex + 1} / {module2Scenarios.length}
            </span>
          </div>

          <div className="module2-goal-panel">
            <div className="module2-goal-top">
              <span>Saving Goal</span>
              <strong>
                {savedCoins} / {module2Meta.savingGoal} coins
              </strong>
            </div>

            <div className="module2-progress-track">
              <div
                className="module2-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="module2-scenario-card">
            <div className="module2-scenario-coins">+{currentScenario.coinAmount} possible coins</div>
            <h1 className="module2-scenario-title">{currentScenario.title}</h1>
            <p className="module2-scenario-story">{currentScenario.story}</p>
          </div>

          <div className="module2-options-grid">
            {currentScenario.options.map((option) => {
              const isSelected = selectedOptionId === option.id;

              return (
                <button
                  key={option.id}
                  className={`module2-option-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => handleChoice(option.id)}
                  disabled={isRevealed}
                >
                  <span className="module2-option-save">Save {option.saveAmount}</span>
                  <span className="module2-option-label">{option.label}</span>
                </button>
              );
            })}
          </div>

          {isRevealed && (
            <div className="module2-feedback-box">
              <p>{feedback}</p>
              <button
                onClick={handleNext}
                className="module2-primary-button"
                disabled={finishing}
              >
                {isLastScenario ? "See Results" : "Next Round"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}