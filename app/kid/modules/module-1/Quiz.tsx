"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { questions } from "./questions";

type Props = {
  onFinish: () => void;
};

type AnswerChoice = "need" | "want";

const SWIPE_THRESHOLD = 90;
const FLY_AWAY_DISTANCE = 420;
const FEEDBACK_DELAY_MS = 1100;

export default function Quiz({ onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlyingOut, setIsFlyingOut] = useState(false);
  const [flyDirection, setFlyDirection] = useState<AnswerChoice | null>(null);
  const [feedback, setFeedback] = useState<null | {
    type: "correct" | "incorrect";
    text: string;
  }>(null);

  const pointerStartX = useRef(0);
  const pointerStartY = useRef(0);
  const isPointerActive = useRef(false);

  const current = questions[index];

  const rotation = dragX / 16;

  const cardStyle = useMemo(() => {
    if (isFlyingOut && flyDirection) {
      const flyX = flyDirection === "need" ? FLY_AWAY_DISTANCE : -FLY_AWAY_DISTANCE;
      return {
        transform: `translate(${flyX}px, ${dragY - 20}px) rotate(${flyDirection === "need" ? 18 : -18}deg)`,
        transition:
          "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease",
        opacity: 0,
      };
    }

    return {
      transform: `translate(${dragX}px, ${dragY}px) rotate(${rotation}deg)`,
      transition: isDragging
        ? "none"
        : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease",
      opacity: 1,
    };
  }, [dragX, dragY, isDragging, isFlyingOut, flyDirection, rotation]);

  const resetCardPosition = () => {
    setDragX(0);
    setDragY(0);
    setIsDragging(false);
  };

  const submitAnswer = (choice: AnswerChoice) => {
    if (!current || isFlyingOut) return;

    const isCorrect = choice === current.correct;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setFeedback({
        type: "correct",
        text: `Correct! ${current.text} is a ${current.correct}.`,
      });
    } else {
      setFeedback({
        type: "incorrect",
        text: `Oops! ${current.text} is a ${current.correct}, not a ${choice}.`,
      });
    }

    setIsFlyingOut(true);
    setFlyDirection(choice);

    window.setTimeout(() => {
      const nextIndex = index + 1;

      if (nextIndex >= questions.length) {
        window.setTimeout(() => {
          onFinish();
        }, FEEDBACK_DELAY_MS);
        return;
      }

      window.setTimeout(() => {
        setIndex(nextIndex);
        setDragX(0);
        setDragY(0);
        setIsDragging(false);
        setIsFlyingOut(false);
        setFlyDirection(null);
        setFeedback(null);
      }, FEEDBACK_DELAY_MS);
    }, 360);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isFlyingOut) return;

    isPointerActive.current = true;
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    setIsDragging(true);

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerActive.current || isFlyingOut) return;

    const deltaX = e.clientX - pointerStartX.current;
    const deltaY = e.clientY - pointerStartY.current;

    setDragX(deltaX);
    setDragY(deltaY * 0.35);
  };

  const handlePointerEnd = () => {
    if (!isPointerActive.current || isFlyingOut) return;

    isPointerActive.current = false;

    if (dragX > SWIPE_THRESHOLD) {
      submitAnswer("need");
      return;
    }

    if (dragX < -SWIPE_THRESHOLD) {
      submitAnswer("want");
      return;
    }

    resetCardPosition();
  };

  const leftActive = dragX < -32;
  const rightActive = dragX > 32;

  return (
    <main className="module-one-page">
      <div className="module-one-shell module-one-quiz-shell">
        <section className="module-one-quiz-header">
          <p className="module-one-card-kicker">Mini Game</p>
          <h1 className="module-one-simple-title">Need or Want?</h1>
          <p className="module-one-simple-text">
            Swipe left for <strong>want</strong> and right for <strong>need</strong>.
          </p>
        </section>

        <section className="module-one-quiz-progress">
          <div className="module-one-quiz-dots">
            {questions.map((question, questionIndex) => (
              <span
                key={question.id}
                className={`module-one-quiz-dot ${
                  questionIndex === index ? "is-active" : ""
                } ${questionIndex < index ? "is-done" : ""}`}
              />
            ))}
          </div>

          <p className="module-one-quiz-score">
            Score: {score} / {questions.length}
          </p>
        </section>

        <section className="module-one-swipe-stage">
          <div
            className={`module-one-swipe-label module-one-swipe-label-left ${
              leftActive ? "is-active" : ""
            }`}
          >
            Want
          </div>

          <div
            className={`module-one-swipe-label module-one-swipe-label-right ${
              rightActive ? "is-active" : ""
            }`}
          >
            Need
          </div>

          <div
            className="module-one-swipe-card"
            style={cardStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          >
            <div className="module-one-swipe-image-wrap">
              <Image
                src={current.image}
                alt={current.text}
                fill
                sizes="280px"
                style={{ objectFit: "contain" }}
              />
            </div>

            <div className="module-one-swipe-card-body">
              <p className="module-one-swipe-card-kicker">Swipe to decide</p>
              <h2>{current.text}</h2>
            </div>
          </div>
        </section>

        <section className="module-one-quiz-actions">
          <button
            type="button"
            className="module-one-quiz-button module-one-quiz-button-want"
            onClick={() => submitAnswer("want")}
            disabled={isFlyingOut}
          >
            ← Want
          </button>

          <button
            type="button"
            className="module-one-quiz-button module-one-quiz-button-need"
            onClick={() => submitAnswer("need")}
            disabled={isFlyingOut}
          >
            Need →
          </button>
        </section>

        <section className="module-one-quiz-feedback-slot">
          {feedback ? (
            <div
              className={`module-one-quiz-feedback ${
                feedback.type === "correct" ? "is-correct" : "is-incorrect"
              }`}
            >
              {feedback.text}
            </div>
          ) : (
            <div className="module-one-quiz-tip">
              Drag the card or tap a button below.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}