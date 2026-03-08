"use client"

import { useState } from "react"
import { questions } from "./questions"

type Props = {
  onFinish: () => void
}

export default function Quiz({ onFinish }: Props) {

  const [index, setIndex] = useState(0)

  const current = questions[index]

  const answer = () => {

    const next = index + 1

    if (next >= questions.length) {
      onFinish()
      return
    }

    setIndex(next)
  }

  return (
    <main>

      <h1>Quiz</h1>

      <p>{current.text}</p>

      <button onClick={answer}>
        Need
      </button>

      <button onClick={answer}>
        Want
      </button>

    </main>
  )
}