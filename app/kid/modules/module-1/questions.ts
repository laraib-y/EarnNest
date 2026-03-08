export type Question = {
  id: number
  text: string
  correct: "need" | "want"
}

export const questions: Question[] = [
  {
    id: 1,
    text: "Food",
    correct: "need"
  },
  {
    id: 2,
    text: "Toy",
    correct: "want"
  },
  {
    id: 3,
    text: "Water",
    correct: "need"
  },
  {
    id: 4,
    text: "Video Game",
    correct: "want"
  }
]