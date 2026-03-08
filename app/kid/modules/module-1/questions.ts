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
    image: "/assets/NewGame.png",
    correct: "want",
  },
  {
    id: 2,
    text: "School Lunch",
    image: "/assets/SchoolLunch.png",
    correct: "need",
  },
  {
    id: 3,
    text: "Ice Cream",
    image: "/assets/IceCream.png",
    correct: "want",
  },
  {
    id: 4,
    text: "Winter Jacket",
    image: "/assets/WinterJacket.png",
    correct: "need",
  },
];