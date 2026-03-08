export type Module2SceneChoice = {
  id: string;
  label: string;
  cost?: number;
  nextSceneId: string;
};

export type Module2Scene = {
  id: string;
  image: string;
  text: string;
  coinsShown: number;
  choices?: Module2SceneChoice[];
  autoNext?: string;
  final?: boolean;
};

export const module2QuizTitle = "A Day in the Park";

export const module2Scenes: Record<string, Module2Scene> = {
  intro: {
    id: "intro",
    image: "/assets/Park.svg",
    coinsShown: 10,
    text: "Today is a lovely day, you decide to head over to the park for some fun.",
    autoNext: "snack-shop",
  },

  "snack-shop": {
    id: "snack-shop",
    image: "/assets/Choose.svg",
    coinsShown: 10,
    text: "At the park, you pass by a shop that sells snacks.",
    choices: [
      {
        id: "buy-candy",
        label: "Buy some Candy for 10 coins",
        cost: 10,
        nextSceneId: "rain-no-coins",
      },
      {
        id: "buy-boba",
        label: "Buy Boba Tea for 10 coins",
        cost: 10,
        nextSceneId: "rain-no-coins",
      },
      {
        id: "walk-away",
        label: "Walk away",
        cost: 0,
        nextSceneId: "rain-have-coins",
      },
    ],
  },

  "rain-no-coins": {
    id: "rain-no-coins",
    image: "/assets/ParkRainy.svg",
    coinsShown: 0,
    text: "Out of nowhere, clouds start to gather and it looks like it’s about to rain! You’ll need to buy an umbrella.",
  },

  "rain-have-coins": {
    id: "rain-have-coins",
    image: "/assets/ParkRainy.svg",
    coinsShown: 10,
    text: "Out of nowhere, clouds start to gather and it looks like it’s about to rain! You’ll need to buy an umbrella.",
    choices: [
      {
        id: "buy-umbrella",
        label: "Buy umbrella for 5 coins",
        cost: 5,
        nextSceneId: "dry-ending",
      },
    ],
  },

  "wet-ending": {
    id: "wet-ending",
    image: "/assets/NoUmbrella.svg",
    coinsShown: 0,
    text: "Because you bought snacks earlier with your coins, you have to walk home soaking wet!",
    autoNext: "lesson-end",
  },

  "dry-ending": {
    id: "dry-ending",
    image: "/assets/Umbrella.svg",
    coinsShown: 5,
    text: "You stay dry and comfortable on the way home!",
    autoNext: "lesson-end",
  },

  "lesson-end": {
    id: "lesson-end",
    image: "/assets/Saving.svg",
    coinsShown: 5,
    text: "Use your money wisely... Saving some money can help you be ready for unexpected problems.",
    final: true,
  },
};