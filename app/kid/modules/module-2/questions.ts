export type Module2LessonCard = {
  title: string;
  text: string;
  emoji: string;
};

export type Module2ScenarioOption = {
  id: string;
  label: string;
  saveAmount: number;
  message: string;
};

export type Module2Scenario = {
  id: string;
  title: string;
  story: string;
  coinAmount: number;
  options: Module2ScenarioOption[];
};

export const module2Meta = {
  id: "module-2",
  title: "Saving & Budgeting",
  subtitle: "Learn how to make a plan for your coins.",
  rewardCoins: 25,
  savingGoal: 20,
};

export const module2LessonCards: Module2LessonCard[] = [
  {
    emoji: "💰",
    title: "What is saving?",
    text: "Saving means keeping some coins for later instead of spending everything right away.",
  },
  {
    emoji: "📝",
    title: "What is a budget?",
    text: "A budget is a simple plan for how much you want to save, spend, or share.",
  },
  {
    emoji: "🎯",
    title: "Why make a plan?",
    text: "A good plan helps you reach big goals, like buying something special in the future.",
  },
];

export const module2Tips = [
  "Save a little each time you earn coins.",
  "Think before spending all your coins at once.",
  "A budget helps you choose what matters most.",
  "Big goals are easier when you save step by step.",
];

export const module2Scenarios: Module2Scenario[] = [
  {
    id: "snack-shop",
    title: "After-school coins",
    story:
      "You earned 6 coins for helping clean up. You want to save for something bigger later.",
    coinAmount: 6,
    options: [
      {
        id: "save-most",
        label: "Save 5 coins and spend 1",
        saveAmount: 5,
        message: "Great budgeting! You saved most of your coins and still enjoyed a little.",
      },
      {
        id: "split-even",
        label: "Save 3 coins and spend 3",
        saveAmount: 3,
        message: "Nice balance. You saved some and spent some.",
      },
      {
        id: "spend-all",
        label: "Spend all 6 coins now",
        saveAmount: 0,
        message: "That was fun now, but it did not help your saving goal.",
      },
    ],
  },
  {
    id: "toy-choice",
    title: "At the toy shelf",
    story:
      "You have 8 coins in your pocket and see a tiny toy today, but you also want a bigger toy later.",
    coinAmount: 8,
    options: [
      {
        id: "save-all",
        label: "Save all 8 coins for the bigger goal",
        saveAmount: 8,
        message: "Amazing patience! That really helps your budget.",
      },
      {
        id: "save-half",
        label: "Save 4 coins and spend 4",
        saveAmount: 4,
        message: "A fair choice. You made progress and still had some fun.",
      },
      {
        id: "small-toy",
        label: "Spend 7 coins and save 1",
        saveAmount: 1,
        message: "You still saved a little, but the bigger goal will take longer now.",
      },
    ],
  },
  {
    id: "gift-money",
    title: "Gift coins",
    story:
      "A family member gives you 10 coins. This is a great chance to follow your budget plan.",
    coinAmount: 10,
    options: [
      {
        id: "budget-smart",
        label: "Save 7 coins, spend 2, share 1",
        saveAmount: 7,
        message: "Fantastic budgeting! You saved, spent, and shared wisely.",
      },
      {
        id: "save-some",
        label: "Save 5 coins and keep the rest for later",
        saveAmount: 5,
        message: "Good job. You made solid progress toward your goal.",
      },
      {
        id: "spend-most",
        label: "Spend 8 coins and save 2",
        saveAmount: 2,
        message: "You saved a little, but a stronger budget would help more.",
      },
    ],
  },
  {
    id: "weekend-plan",
    title: "Weekend plan",
    story:
      "You earned 7 more coins from chores. Your goal is getting close, so your choices matter a lot.",
    coinAmount: 7,
    options: [
      {
        id: "finish-strong",
        label: "Save all 7 coins",
        saveAmount: 7,
        message: "Strong finish! Saving now gets you much closer to your goal.",
      },
      {
        id: "save-most",
        label: "Save 5 coins and spend 2",
        saveAmount: 5,
        message: "Smart choice. You kept your goal in mind.",
      },
      {
        id: "save-little",
        label: "Save 2 coins and spend 5",
        saveAmount: 2,
        message: "You saved something, but your goal will take longer.",
      },
    ],
  },
];