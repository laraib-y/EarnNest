export type Question = {
  id: number;
  text: string;
  image: string;
  correct: "need" | "want";
};

export const questions: Question[] = [
  {
    id: 1,
    text: "New Game",
    image: "/assets/NewGame.svg",
    correct: "want",
  },
  {
    id: 2,
    text: "School Lunch",
    image: "/assets/SchoolLunch.svg",
    correct: "need",
  },
  {
    id: 3,
    text: "Ice Cream",
    image: "/assets/IceCream.svg",
    correct: "want",
  },
  {
    id: 4,
    text: "Winter Jacket",
    image: "/assets/WinterJacket.svg",
    correct: "need",
  },
];