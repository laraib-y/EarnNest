"use client"

import { useState } from "react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import Quiz from "./Quiz"

export default function ModuleOnePage() {

  const [step, setStep] = useState("lesson")
  const [goalItem, setGoalItem] = useState("")
  const [goalCost, setGoalCost] = useState("")

  const saveGoal = async () => {

    const childId = localStorage.getItem("kidChildId")

    if (!childId) {
      alert("Child not found")
      return
    }

    await addDoc(collection(db, "goals"), {
      childId,
      item: goalItem,
      cost: Number(goalCost),
      createdAt: serverTimestamp()
    })

    setStep("done")
  }

  if (step === "lesson") {
    return (
      <main>

        <h1>Module 1: Needs vs Wants</h1>

        <p>A need is something you must have to live.</p>
        <p>Food, water, clothing.</p>

        <p>A want is something nice but not necessary.</p>
        <p>Toys, games, candy.</p>

        <button onClick={() => setStep("quiz")}>
          Start Quiz
        </button>

      </main>
    )
  }

  if (step === "quiz") {
    return <Quiz onFinish={() => setStep("goal")} />
  }

  if (step === "goal") {
    return (
      <main>

        <h1>Set Your Goal</h1>

        <input
          placeholder="Item you want"
          value={goalItem}
          onChange={(e) => setGoalItem(e.target.value)}
        />

        <input
          placeholder="Cost"
          value={goalCost}
          onChange={(e) => setGoalCost(e.target.value)}
        />

        <button onClick={saveGoal}>
          Save Goal
        </button>

      </main>
    )
  }

  return (
    <main>
      <h1>Module Complete</h1>
      <p>Your goal was saved.</p>
    </main>
  )
}