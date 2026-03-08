"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  module2LessonCards,
  module2Meta,
  module2Tips,
} from "./questions";
import "./module-2.css";

export default function Module2Page() {
  return (
    <main className="module2-page">
      <div className="module2-shell">
        <section className="module2-hero">
          <div className="module2-hero-copy">
            <p className="module2-kicker">Module 2</p>
            <h1 className="module2-title">{module2Meta.title}</h1>
            <p className="module2-subtitle">{module2Meta.subtitle}</p>

            <div className="module2-hero-badges">
              <span className="module2-badge">+{module2Meta.rewardCoins} bonus coins</span>
              <span className="module2-badge module2-badge-soft">
                Goal: Save {module2Meta.savingGoal} coins
              </span>
            </div>

            <Link
              href={"/kid/modules/module-2/quiz" as Route}
              className="module2-primary-button"
            >
              Play Saving Game
            </Link>
          </div>

          <div className="module2-hero-visual">
            <div className="module2-coin-stack">
              <span>🪙</span>
              <span>🪙</span>
              <span>🪙</span>
            </div>
            <p>Build your budget and reach your goal!</p>
          </div>
        </section>

        <section className="module2-section">
          <div className="module2-section-header">
            <h2>What you’ll learn</h2>
          </div>

          <div className="module2-card-grid">
            {module2LessonCards.map((card) => (
              <article key={card.title} className="module2-info-card">
                <div className="module2-card-emoji">{card.emoji}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="module2-section">
          <div className="module2-section-header">
            <h2>Easy budgeting idea</h2>
          </div>

          <div className="module2-budget-board">
            <div className="module2-budget-board-card">
              <h3>Save</h3>
              <p>Keep some coins for your future goal.</p>
            </div>
            <div className="module2-budget-board-card">
              <h3>Spend</h3>
              <p>Use a small part for something fun now.</p>
            </div>
            <div className="module2-budget-board-card">
              <h3>Plan</h3>
              <p>Choose before you spend so your coins last longer.</p>
            </div>
          </div>
        </section>

        <section className="module2-section">
          <div className="module2-section-header">
            <h2>Pro tips</h2>
          </div>

          <div className="module2-tips-list">
            {module2Tips.map((tip) => (
              <div key={tip} className="module2-tip-item">
                <span className="module2-tip-icon">★</span>
                <p>{tip}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="module2-section">
          <div className="module2-ready-card">
            <div>
              <p className="module2-ready-kicker">Ready to play?</p>
              <h2>Fill your saving bar to win</h2>
              <p>
                In the next activity, you’ll make coin choices and try to reach
                your saving goal.
              </p>
            </div>

            <Link
              href={"/kid/modules/module-2/quiz" as Route}
              className="module2-primary-button"
            >
              Start Module Game
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}