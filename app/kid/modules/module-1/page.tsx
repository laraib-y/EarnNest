"use client"

import { useState } from "react"
import { addDoc, collection, serverTimestamp, doc, runTransaction } from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import Quiz from "./Quiz"
import { useRouter } from "next/navigation"
import type { Route } from "next"

export default function ModuleOnePage() {

  const router = useRouter()

  const [step, setStep] = useState("lesson")
  const [goalItem, setGoalItem] = useState("")
  const [goalCost, setGoalCost] = useState("")
  const [saving, setSaving] = useState(false)

  const saveGoal = async () => {

    const childId = localStorage.getItem("kidChildId")

    if (!childId) {
      alert("Child not found")
      return
    }

    try {
      setSaving(true)

      await runTransaction(db, async (transaction) => {
        const childRef = doc(db, "children", childId)
        const childSnap = await transaction.get(childRef)

        if (!childSnap.exists()) {
          throw new Error("Child profile not found.")
        }

        const childData = childSnap.data()
        const modulesCompleted = Array.isArray(childData.modulesCompleted)
          ? childData.modulesCompleted
          : []

        const alreadyCompleted = modulesCompleted.includes("module-1")

        if (!alreadyCompleted) {
          transaction.update(childRef, {
            modulesCompleted: [...modulesCompleted, "module-1"],
            streak: (childData.streak || 0) + 1,
            updatedAt: serverTimestamp(),
          })
        }
      })

      await addDoc(collection(db, "goals"), {
        childId,
        item: goalItem,
        cost: Number(goalCost),
        createdAt: serverTimestamp()
      })

      setStep("done")
    } catch (error) {
      console.error(error)
      alert("Could not save your progress")
    } finally {
      setSaving(false)
    }
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
    <p>Your goal was saved!</p>

    <button onClick={() => router.push("/kid/dashboard" as Route)}>
      Return to Dashboard
    </button>
  </main>
  )
}