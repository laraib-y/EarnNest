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

  return (
    <main className="kid-modules-page">
      <div className="kid-modules-shell">
        <section className="kid-modules-hero">
          <div className="kid-corner-stats">
            <div className="kid-pill kid-pill-coins">
              <img
                src="/assets/CoinIcon.svg"
                alt="Coin"
                className="kid-pill-icon"
              />
              {child.coinBalance} Coins
            </div>

            <div className="kid-pill kid-pill-streak">
              <img
                src="/assets/FireIcon.svg"
                alt="Streak"
                className="kid-pill-icon"
              />
              {child.streak} {child.streak === 1 ? "day" : "days"}
            </div>
          </div>

          <div>
            <p className="kid-modules-kicker">Learning</p>
            <h1 className="kid-modules-title">Build Your Money Skills</h1>
            <p className="kid-modules-subtitle">
              Complete modules to learn about money, saving, and financial literacy.
            </p>
          </div>
        </section>

        <section className="kid-modules-content">
          <div className="kid-modules-grid">
            <article className="kid-module-card">
              <div className="kid-module-top">
                <div>
                  <p className="kid-module-tag">Module 1</p>
                  <h3>Needs vs Wants</h3>
                </div>
                <span className="kid-module-status">
                  {child.modulesCompleted.includes("module-1")
                    ? "Completed"
                    : "Ready"}
                </span>
              </div>

              <p className="kid-module-description">
                Learn the difference between things you need and things you want.
              </p>

              <button
                className="kid-primary-button"
                onClick={() => router.push("/kid/modules/module-1" as Route)}
                type="button"
              >
                {child.modulesCompleted.includes("module-1")
                  ? "Play Again"
                  : "Start Module 1"}
              </button>
            </article>

            <article className="kid-module-card">
              <div className="kid-module-top">
                <div>
                  <p className="kid-module-tag">Module 2</p>
                  <h3>Saving & Budgeting</h3>
                </div>
                <span className="kid-module-status">
                  {!child.modulesCompleted.includes("module-1")
                    ? "🔒 Locked"
                    : child.modulesCompleted.includes("module-2")
                    ? "Completed"
                    : "Ready"}
                </span>
              </div>

              <p className="kid-module-description">
                Practice saving coins and making smart budgeting choices to reach
                a goal.
              </p>

              <button
                className="kid-primary-button"
                onClick={() => {
                  if (child.modulesCompleted.includes("module-1")) {
                    router.push("/kid/modules/module-2" as Route);
                  }
                }}
                disabled={!child.modulesCompleted.includes("module-1")}
                type="button"
                style={
                  !child.modulesCompleted.includes("module-1")
                    ? { opacity: 0.5, cursor: "not-allowed" }
                    : {}
                }
              >
                {!child.modulesCompleted.includes("module-1")
                  ? "Complete Module 1 First"
                  : child.modulesCompleted.includes("module-2")
                  ? "Play Again"
                  : "Start Module 2"}
              </button>
            </article>
          </div>
        </section>
      </div>

      <KidBottomNav />
    </main>
  );
}