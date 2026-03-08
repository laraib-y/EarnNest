"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { db } from "@/lib/firebase-client";
import KidBottomNav from "@/components/KidBottomNav";
import "./kid-modules.css";

type ChildProfile = {
  id: string;
  displayName: string;
  name: string;
  modulesCompleted: string[];
  coinBalance: number;
  streak: number;
};

export default function KidModulesPage() {
  const router = useRouter();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedChildId = localStorage.getItem("kidChildId");

    if (!storedChildId) {
      router.push("/kid" as Route);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "children", storedChildId), (childSnap) => {
      if (!childSnap.exists()) {
        router.push("/kid" as Route);
        return;
      }

      const childData = childSnap.data();

      setChild({
        id: childSnap.id,
        displayName: childData.displayName || childData.name || "",
        name: childData.name || "",
        modulesCompleted: Array.isArray(childData.modulesCompleted)
          ? childData.modulesCompleted
          : [],
        coinBalance: Number(childData.coinBalance || 0),
        streak: Number(childData.streak || 0),
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <main className="kid-modules-page">
        <div className="kid-modules-shell">
          <p className="kid-modules-loading">Loading modules...</p>
        </div>
      </main>
    );
  }

  if (!child) return null;

  const module1Complete = child.modulesCompleted.includes("module-1");
  const module2Complete = child.modulesCompleted.includes("module-2");
  const module2Unlocked = module1Complete;

  return (
    <main className="kid-modules-page">
      <div className="kid-modules-shell">
        <section className="kid-modules-hero">
          <div className="kid-corner-stats">
            <div className="kid-pill kid-pill-coins">
              <img src="/assets/CoinIcon.svg" alt="Coin" className="kid-pill-icon" />
              {child.coinBalance} Coins
            </div>

            <div className="kid-pill kid-pill-streak">
              <img src="/assets/FireIcon.svg" alt="Streak" className="kid-pill-icon" />
              {child.streak} {child.streak === 1 ? "day" : "days"}
            </div>
          </div>

          <div>
            <h1 className="kid-modules-title">Build Your Money Skills</h1>
            <p className="kid-modules-subtitle">
              Complete modules to learn about money, saving, and financial literacy.
            </p>
          </div>
        </section>

        <section className="kid-modules-content">
          <div className="kid-modules-grid">
            <article className="kid-module-card">
              <div className="kid-module-image">
                <img
                  src="/assets/NeedsWants.svg"
                  alt="Needs and wants"
                  className="kid-module-image-asset"
                />
              </div>

              <div className="kid-module-top">
                <div className="kid-module-header-left">
                  <p className="kid-module-tag">MODULE 1</p>
                  <h3>Needs vs Wants</h3>
                </div>
              </div>

              <p className="kid-module-description">
                Learn the difference between things you need and things you want.
              </p>

              <button
                className="kid-module-button is-primary"
                onClick={() => router.push("/kid/modules/module-1" as Route)}
                type="button"
              >
                {module1Complete ? "Play Again" : "Start Module"}
              </button>
            </article>

            <article className="kid-module-card">
              <div className="kid-module-image">
                <img
                  src="/assets/Saving.svg"
                  alt="Saving and budgeting"
                  className="kid-module-image-asset"
                />
              </div>

              <div className="kid-module-top">
                <div className="kid-module-header-left">
                  <p className="kid-module-tag">MODULE 2</p>
                  <h3>Saving &amp; Budgeting</h3>
                </div>
              </div>

              <p className="kid-module-description">
                Practice saving coins and making smart budgeting choices to reach a goal.
              </p>

              <button
                className={`kid-module-button ${module2Unlocked ? "is-primary" : "is-locked"}`}
                onClick={() => {
                  if (module2Unlocked) {
                    router.push("/kid/modules/module-2" as Route);
                  }
                }}
                disabled={!module2Unlocked}
                type="button"
              >
                {module2Unlocked ? (
                  module2Complete ? (
                    "Play Again"
                  ) : (
                    "Start Module"
                  )
                ) : (
                  <span className="kid-module-button-label">
                    <svg
                      className="kid-module-lock-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M8 10V7.5C8 5.57 9.57 4 11.5 4C13.43 4 15 5.57 15 7.5V10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <rect
                        x="5"
                        y="10"
                        width="13"
                        height="10"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    Locked - Do Module 1 First
                  </span>
                )}
              </button>
            </article>
          </div>
        </section>
      </div>

      <KidBottomNav />
    </main>
  );
}