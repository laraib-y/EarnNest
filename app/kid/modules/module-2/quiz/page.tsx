"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { module2QuizTitle, module2Scenes } from "../questions";
import "../module-2.css";

type ChildProfile = {
  id: string;
  coinBalance: number;
  streak: number;
  modulesCompleted: string[];
};

export default function Module2QuizPage() {
  const router = useRouter();

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSceneId, setCurrentSceneId] = useState("intro");
  const [coinsLeft, setCoinsLeft] = useState(10);
  const [savingProgress, setSavingProgress] = useState(false);

  const currentScene = module2Scenes[currentSceneId];

  useEffect(() => {
    const loadChild = async () => {
      const childId = localStorage.getItem("kidChildId");

      if (!childId) {
        router.push("/kid" as Route);
        return;
      }

      try {
        const childRef = doc(db, "children", childId);
        const childSnap = await getDoc(childRef);

        if (!childSnap.exists()) {
          router.push("/kid" as Route);
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
        router.push("/kid" as Route);
      } finally {
        setLoading(false);
      }
    };

    loadChild();
  }, [router]);

  const handleChoice = (choiceId: string) => {
    if (!currentScene.choices) return;

    const choice = currentScene.choices.find((item) => item.id === choiceId);
    if (!choice) return;

    const cost = Number(choice.cost || 0);

    if (cost > coinsLeft) return;

    setCoinsLeft((prev) => Math.max(0, prev - cost));
    setCurrentSceneId(choice.nextSceneId);
  };

  const handleProceed = async () => {
    if (currentScene.final) {
      if (!child) return;

      try {
        setSavingProgress(true);

        await runTransaction(db, async (transaction) => {
          const childRef = doc(db, "children", child.id);
          const childSnap = await transaction.get(childRef);

          if (!childSnap.exists()) {
            throw new Error("Child profile not found.");
          }

          const childData = childSnap.data();
          const modulesCompleted = Array.isArray(childData.modulesCompleted)
            ? childData.modulesCompleted
            : [];

          const alreadyCompleted = modulesCompleted.includes("module-2");

          if (!alreadyCompleted) {
            transaction.update(childRef, {
              modulesCompleted: [...modulesCompleted, "module-2"],
              streak: Number(childData.streak || 0) + 1,
              updatedAt: serverTimestamp(),
            });
          }
        });

        router.push("/kid/dashboard" as Route);
      } catch (error) {
        console.error(error);
        alert("Could not save module progress.");
      } finally {
        setSavingProgress(false);
      }

      return;
    }

    if (currentScene.id === "rain-no-coins") {
      setCurrentSceneId("wet-ending");
      return;
    }

    if (currentScene.id === "rain-have-coins") {
      setCurrentSceneId("wet-ending");
      return;
    }

    if (currentScene.autoNext) {
      setCurrentSceneId(currentScene.autoNext);
    }
  };

  if (loading) {
    return (
      <main className="module-two-page">
        <div className="module-two-shell">
          <p className="module-two-loading">Loading game...</p>
        </div>
      </main>
    );
  }

  if (!child) return null;

  const showChoices =
    !!currentScene.choices &&
    currentScene.choices.length > 0 &&
    currentScene.id !== "rain-no-coins";

  const showProceed = true;

  return (
    <main className="module-two-page">
      <div className="module-two-shell module-two-quiz-shell">
        <section className="module-two-topbar module-two-quiz-topbar">
          <button
            type="button"
            className="module-two-back"
            onClick={() => router.push("/kid/modules/module-2" as Route)}
            aria-label="Go back"
          >
            ‹
          </button>

          <div className="module-two-topbar-pills">
            <div className="module-two-pill module-two-pill-coins">
              <Image
                src="/assets/CoinIcon.svg"
                alt=""
                width={14}
                height={14}
                className="module-two-pill-icon"
              />
              <span>{coinsLeft} Coins</span>
            </div>

            <div className="module-two-pill module-two-pill-streak">
              <Image
                src="/assets/FireIcon.svg"
                alt=""
                width={14}
                height={14}
                className="module-two-pill-icon"
              />
              <span>
                {child.streak} {child.streak === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        </section>

        <h1 className="module-two-quiz-title">{module2QuizTitle}</h1>

        <section className="module-two-scene-card">
          <div className="module-two-scene-image-wrap">
            <Image
              src={currentScene.image}
              alt={module2QuizTitle}
              fill
              priority
              className="module-two-scene-image"
            />
          </div>

          <div
            className={`module-two-scene-coin-pill ${
              coinsLeft === 0 ? "is-zero" : ""
            }`}
          >
            <Image
              src="/assets/CoinIcon.svg"
              alt=""
              width={16}
              height={16}
              className="module-two-scene-coin-icon"
            />
            <span>{coinsLeft}</span>
          </div>
        </section>

        <section className="module-two-scene-text-card">
          <p>{currentScene.text}</p>
        </section>

        {currentScene.id === "rain-no-coins" && (
          <section className="module-two-no-coins-block">
            <p className="module-two-no-coins-text">You’re out of coins!</p>
            <button
              type="button"
              className="module-two-choice-button is-disabled"
              disabled
            >
              Buy umbrella for 5 coins
            </button>
          </section>
        )}

        {showChoices && (
          <section className="module-two-choice-list">
            {currentScene.choices!.map((choice) => {
              const cost = Number(choice.cost || 0);
              const disabled = cost > coinsLeft;

              return (
                <button
                  key={choice.id}
                  type="button"
                  className={`module-two-choice-button ${
                    disabled ? "is-disabled" : ""
                  }`}
                  onClick={() => handleChoice(choice.id)}
                  disabled={disabled}
                >
                  {choice.label}
                </button>
              );
            })}
          </section>
        )}

        {showProceed && (
          <section className="module-two-footer">
            <button
              type="button"
              className="module-two-primary-button"
              onClick={handleProceed}
              disabled={savingProgress}
            >
              {savingProgress ? "Saving..." : "Proceed"}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}