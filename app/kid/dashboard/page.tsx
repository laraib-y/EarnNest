"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { db } from "@/lib/firebase-client";
import KidBottomNav from "@/components/KidBottomNav";
import "./kid-dashboard.css";

type ChildProfile = {
  id: string;
  parentUid: string;
  name: string;
  displayName: string;
  avatar: string;
  coinBalance: number;
  streak: number;
  completedChores: number;
  modulesCompleted: string[];
};

type ChoreItem = {
  id: string;
  title: string;
  description: string;
  reward: number;
  frequency: string;
  status: string;
};

type CompletionItem = {
  id: string;
  choreId: string;
  status: "pending" | "approved" | "rejected";
  reward: number;
  createdAt?: unknown;
};

type GoalItem = {
  id: string;
  item: string;
  cost: number;
  createdAt?: unknown;
};

type GoalCoachReply = {
  title: string;
  message: string;
  actionTip: string;
  generalTip: string;
};

type SpendCoachReply = {
  title: string;
  message: string;
  recommendation: "buy" | "save";
  reason: string;
  encouragement: string;
};

const avatars = [
  { key: "bear", src: "/assets/BearIcon.svg", label: "Bear" },
  { key: "cat", src: "/assets/CatIcon.svg", label: "Cat" },
  { key: "dog", src: "/assets/DogIcon.svg", label: "Dog" },
  { key: "snake", src: "/assets/SnakeIcon.svg", label: "Snake" },
  { key: "capybara", src: "/assets/CapybaraIcon.svg", label: "Capybara" },
  { key: "bunny", src: "/assets/BunnyIcon.svg", label: "Bunny" },
];

export default function KidDashboardPage() {
  const router = useRouter();

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isCustomizingClosing, setIsCustomizingClosing] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("bear");
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isEditingGoalClosing, setIsEditingGoalClosing] = useState(false);
  const [editGoalItem, setEditGoalItem] = useState("");
  const [editGoalCost, setEditGoalCost] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingGoalClosing, setIsAddingGoalClosing] = useState(false);
  const [newGoalItem, setNewGoalItem] = useState("");
  const [newGoalCost, setNewGoalCost] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);
  const [goalCoachLoading, setGoalCoachLoading] = useState(false);
  const [goalCoachReply, setGoalCoachReply] = useState<GoalCoachReply | null>(null);

  const [isSpendCoachOpen, setIsSpendCoachOpen] = useState(false);
  const [spendCoachLoading, setSpendCoachLoading] = useState(false);
  const [spendItemName, setSpendItemName] = useState("");
  const [spendItemCost, setSpendItemCost] = useState("");
  const [spendCoachReply, setSpendCoachReply] = useState<SpendCoachReply | null>(null);

  const getAvatarPath = (avatar: string) => {
    if (!avatar) return "/assets/BearIcon.svg";

    if (avatar.startsWith("/assets/")) return avatar;
    if (avatar.startsWith("assets/")) return `/${avatar}`;

    const avatarMap: Record<string, string> = {
      bear: "/assets/BearIcon.svg",
      cat: "/assets/CatIcon.svg",
      dog: "/assets/DogIcon.svg",
      snake: "/assets/SnakeIcon.svg",
      capybara: "/assets/CapybaraIcon.svg",
      bunny: "/assets/BunnyIcon.svg",
      fox: "/assets/DogIcon.svg",
      rabbit: "/assets/BunnyIcon.svg",
    };

    return avatarMap[avatar.toLowerCase()] || "/assets/BearIcon.svg";
  };

  const latestCompletionByChore = useMemo(() => {
    const map = new Map<string, CompletionItem>();

    for (const completion of completions) {
      map.set(completion.choreId, completion);
    }

    return map;
  }, [completions]);

  const currentGoal = goals[0] || null;
  const currentGoalProgress =
    currentGoal && currentGoal.cost > 0
      ? Math.min(((child?.coinBalance || 0) / currentGoal.cost) * 100, 100)
      : 0;

  const handleOpenCustomize = () => {
    setSelectedAvatar(child?.avatar || "bear");
    setIsCustomizing(true);
  };

  const handleOpenAddGoal = () => {
    setNewGoalItem("");
    setNewGoalCost("");
    setIsAddingGoal(true);
  };

  const handleCloseAddGoal = () => {
    setIsAddingGoalClosing(true);
  };

  const handleAddGoalAnimationEnd = () => {
    if (isAddingGoalClosing) {
      setIsAddingGoal(false);
      setIsAddingGoalClosing(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!child || !newGoalItem.trim() || !newGoalCost) return;

    const numericCost = Number(newGoalCost);
    if (!Number.isFinite(numericCost) || numericCost <= 0) {
      alert("Please enter a valid goal cost.");
      return;
    }

    try {
      setAddingGoal(true);

      await addDoc(collection(db, "goals"), {
        childId: child.id,
        item: newGoalItem.trim(),
        cost: numericCost,
        createdAt: serverTimestamp(),
      });

      setIsAddingGoalClosing(true);
    } catch (error) {
      console.error(error);
      alert("Could not create goal.");
    } finally {
      setAddingGoal(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!child || !selectedAvatar) return;

    try {
      setSavingAvatar(true);

      await updateDoc(doc(db, "children", child.id), {
        avatar: selectedAvatar,
      });

      setIsCustomizingClosing(true);
    } catch (error) {
      console.error(error);
      alert("Could not update avatar.");
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleCloseEditGoal = () => {
    setIsEditingGoalClosing(true);
  };

  const handleCloseCustomize = () => {
    setIsCustomizingClosing(true);
  };

  const handleEditGoalAnimationEnd = () => {
    if (isEditingGoalClosing) {
      setIsEditingGoal(false);
      setIsEditingGoalClosing(false);
    }
  };

  const handleCustomizeAnimationEnd = () => {
    if (isCustomizingClosing) {
      setIsCustomizing(false);
      setIsCustomizingClosing(false);
    }
  };

  useEffect(() => {
    const storedChildId = localStorage.getItem("kidChildId");

    if (!storedChildId) {
      router.push("/kid" as Route);
      return;
    }

    let childUnsub: (() => void) | null = null;
    let choresUnsub: (() => void) | null = null;
    let completionsUnsub: (() => void) | null = null;
    let goalsUnsub: (() => void) | null = null;

    try {
      childUnsub = onSnapshot(
        doc(db, "children", storedChildId),
        (childSnap) => {
          if (!childSnap.exists()) {
            router.push("/kid" as Route);
            return;
          }

          const childData = childSnap.data();

          const childProfile: ChildProfile = {
            id: childSnap.id,
            parentUid: childData.parentUid || "",
            name: childData.name || "",
            displayName: childData.displayName || childData.name || "",
            avatar: childData.avatar || "bear",
            coinBalance: Number(childData.coinBalance || 0),
            streak: Number(childData.streak || 0),
            completedChores: Number(childData.completedChores || 0),
            modulesCompleted: Array.isArray(childData.modulesCompleted)
              ? childData.modulesCompleted
              : [],
          };

          setChild(childProfile);
          setLoading(false);
        },
      );

      choresUnsub = onSnapshot(
        query(collection(db, "chores"), where("childId", "==", storedChildId)),
        (choreSnap) => {
          const choreList: ChoreItem[] = choreSnap.docs
            .map((choreDoc) => {
              const data = choreDoc.data();
              return {
                id: choreDoc.id,
                title: data.title || "",
                description: data.description || "",
                reward: Number(data.reward || 0),
                frequency: data.frequency || "one-time",
                status: data.status || "active",
              };
            })
            .filter((chore) => chore.status === "active");

          setChores(choreList);
        },
      );

      completionsUnsub = onSnapshot(
        query(
          collection(db, "completions"),
          where("childId", "==", storedChildId),
        ),
        (completionSnap) => {
          const completionList: CompletionItem[] = completionSnap.docs.map(
            (completionDoc) => {
              const data = completionDoc.data();
              return {
                id: completionDoc.id,
                choreId: data.choreId || "",
                status: data.status || "pending",
                reward: Number(data.reward || 0),
                createdAt: data.createdAt || null,
              };
            },
          );

          setCompletions(completionList);
        },
      );

      goalsUnsub = onSnapshot(
        query(collection(db, "goals"), where("childId", "==", storedChildId)),
        (goalSnap) => {
          const goalList: GoalItem[] = goalSnap.docs.map((goalDoc) => {
            const data = goalDoc.data();
            return {
              id: goalDoc.id,
              item: data.item || "",
              cost: Number(data.cost || 0),
              createdAt: data.createdAt || null,
            };
          });

          setGoals(goalList);
        },
      );
    } catch (error) {
      console.error(error);
      router.push("/kid" as Route);
    }

    return () => {
      childUnsub?.();
      choresUnsub?.();
      completionsUnsub?.();
      goalsUnsub?.();
    };
  }, [router]);

  const handleMarkDone = async (chore: ChoreItem) => {
    if (!child) return;

    const existing = latestCompletionByChore.get(chore.id);

    if (existing?.status === "pending") {
      alert("This chore is already waiting for parent approval.");
      return;
    }

    try {
      setActionLoadingId(chore.id);

      await addDoc(collection(db, "completions"), {
        parentUid: child.parentUid,
        childId: child.id,
        choreId: chore.id,
        choreTitle: chore.title,
        reward: chore.reward,
        status: "pending",
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        reviewedAt: null,
      });

      alert("Nice work! Ask your parent to approve your chore.");
    } catch (error) {
      console.error(error);
      alert("Could not mark chore as done.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEditGoal = (goal: GoalItem) => {
    setEditGoalItem(goal.item);
    setEditGoalCost(String(goal.cost));
    setIsEditingGoal(true);
  };

  const handleSaveGoal = async () => {
    if (!goals.length || !editGoalItem || !editGoalCost) return;

    try {
      setSavingGoal(true);

      await updateDoc(doc(db, "goals", goals[0].id), {
        item: editGoalItem,
        cost: Number(editGoalCost),
      });

      setIsEditingGoalClosing(true);
    } catch (error) {
      console.error(error);
      alert("Could not update goal.");
    } finally {
      setSavingGoal(false);
    }
  };

    const handleAskGoalCoach = async () => {
    if (!child || !currentGoal) return;

    try {
      setGoalCoachLoading(true);
      setGoalCoachReply(null);

      const response = await fetch("/api/ai-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "goal-coach",
          childName: child.displayName || child.name,
          coinBalance: child.coinBalance,
          goalTitle: currentGoal.item,
          goalCost: currentGoal.cost,
          chores: chores.map((chore) => ({
            title: chore.title,
            reward: chore.reward,
          })),
          streak: child.streak,
          modulesCompleted: child.modulesCompleted.length,
        }),
      });

      const data: GoalCoachReply | { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(("error" in data && data.error) || "Could not get goal coach advice.");
      }

      setGoalCoachReply(data as GoalCoachReply);

    } catch (error) {
      console.error(error);
      alert("Could not get goal coach advice.");
    } finally {
      setGoalCoachLoading(false);
    }
  };

  const handleAskSpendCoach = async () => {
    if (!child || !spendItemName.trim() || !spendItemCost) return;

    const numericCost = Number(spendItemCost);

    if (!Number.isFinite(numericCost) || numericCost <= 0) {
      alert("Please enter a valid item cost.");
      return;
    }

    try {
      setSpendCoachLoading(true);
      setSpendCoachReply(null);

      const response = await fetch("/api/ai-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "spend-or-save",
          childName: child.displayName || child.name,
          coinBalance: child.coinBalance,
          itemName: spendItemName.trim(),
          itemCost: numericCost,
          goalTitle: currentGoal?.item || "",
          goalCost: currentGoal?.cost || 0,
        }),
      });

      const data: SpendCoachReply | { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(("error" in data && data.error) || "Could not get spend or save advice.");
      }

      setSpendCoachReply(data as SpendCoachReply);

    } catch (error) {
      console.error(error);
      alert("Could not get spend or save advice.");
    } finally {
      setSpendCoachLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="kid-dashboard-page">
        <div className="kid-dashboard-shell">
          <p className="kid-dashboard-loading">Loading kid dashboard...</p>
        </div>
      </main>
    );
  }

  if (!child) return null;

  return (
    <main className="kid-dashboard-page">
      <div className="kid-dashboard-shell">
        <section className="kid-dashboard-hero">
          <div className="kid-corner-stats">
            <div className="kid-pill kid-pill-coins">
              <img
                src="/assets/CoinIcon.svg"
                alt="Coin"
                className="kid-pill-icon"
              />
              {child.coinBalance} Coins
            </div>

            <div className="kid-pill kid-pill-streak">
              <img
                src="/assets/FireIcon.svg"
                alt="Streak"
                className="kid-pill-icon"
              />
              {child.streak} {child.streak === 1 ? "day" : "days"}
            </div>
          </div>

          <div className="kid-hero-main">
            <div className="kid-hero-name-row">
              <div className="kid-avatar-wrap">
                <div className="kid-avatar-badge">
                  <img
                    src={getAvatarPath(child.avatar)}
                    alt="Your avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/assets/BearIcon.svg";
                    }}
                  />
                </div>

                <button
                  onClick={handleOpenCustomize}
                  className="kid-avatar-customize-btn"
                  title="Customize"
                  type="button"
                  aria-label="Customize avatar"
                >
                  <svg
                    className="kid-avatar-edit-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14.06 4.94 17.81 8.69"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="kid-avatar-customize-text">Customize</span>
                </button>
              </div>

              <div>
                <p className="kid-dashboard-kicker"></p>
                <h1 className="kid-dashboard-title">
                  Hi, {child.displayName || child.name}!
                </h1>
              </div>
            </div>

            <p className="kid-dashboard-subtitle">
              Finish chores, earn coins, and grow your money skills.
            </p>
          </div>
        </section>

        <section className="kid-dashboard-section">
          <div className="kid-section-header kid-section-header-goals">
            <h2>Goals</h2>

            <button
              type="button"
              className="kid-add-goal-button"
              onClick={handleOpenAddGoal}
              aria-label="Add new goal"
            >
              <svg
                className="kid-add-goal-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>

              <span className="kid-add-goal-text">Goal</span>
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="kid-empty-card">
              <p>No goal set yet. Complete Module 1 to set your first goal!</p>
            </div>
          ) : (
            <div className="kid-goals-grid">
              {goals.map((goal, index) => {
                const progress =
                  goal.cost > 0
                    ? Math.min(
                        ((child.coinBalance || 0) / goal.cost) * 100,
                        100,
                      )
                    : 0;

                return (
                  <div
                    key={goal.id}
                    className={`kid-goal-card ${index === 0 ? "is-primary" : "is-secondary"}`}
                  >
                    <div className="kid-goal-top">
                      <div className="kid-goal-copy">
                        <p className="kid-goal-label">
                          {index === 0 ? "Current Goal" : "Next Goal"}
                        </p>

                        <div className="kid-goal-title-row">
                          <h3>{goal.item}</h3>

                          <button
                            onClick={() => handleEditGoal(goal)}
                            className="kid-goal-edit-button"
                            type="button"
                            title="Edit goal"
                            aria-label="Edit goal"
                          >
                            <svg
                              className="kid-goal-edit-icon"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                            >
                              <svg
                                className="kid-goal-edit-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                              >
                                <path
                                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M14.06 4.94 17.81 8.69"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>

                          <p className="kid-goal-progress-text">
                            <strong>{Math.min(child.coinBalance, goal.cost)}</strong> / {goal.cost} Coins
                          </p>
                        </div>
                      </div>

                        <p className="kid-goal-progress-text">
                          <strong>
                            {Math.min(child.coinBalance, goal.cost)}
                          </strong>{" "}
                          / {goal.cost} Coins
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {currentGoal && (
                <div className="kid-ai-card">
                  <div className="kid-ai-card-header">
                    <div>
                      <p className="kid-ai-kicker">AI Coach</p>
                      <h3 className="kid-ai-title">Goal Coach</h3>
                    </div>
                  </div>

                    {goalCoachReply && (
                      <div className="kid-ai-response">
                        <div className="kid-ai-response-avatar">
                          <img
                            src={getAvatarPath(child.avatar)}
                            alt="Coach"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/assets/BearIcon.svg";
                            }}
                          />
                        </div>
                        <div className="kid-ai-response-content">
                          <h4>{goalCoachReply.title}</h4>
                          <p>{goalCoachReply.message}</p>
                          <p>
                            <strong>Right now:</strong> {goalCoachReply.actionTip}
                          </p>
                          <p>
                            <strong>Money tip:</strong> {goalCoachReply.generalTip}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="kid-ai-response-close"
                          onClick={() => setGoalCoachReply(null)}
                          aria-label="Close coach message"
                          title="Close"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                  <div className="kid-ai-button-group">
                    <button
                      type="button"
                      className="kid-ai-action-button"
                      onClick={handleAskGoalCoach}
                      disabled={goalCoachLoading}
                    >
                      {goalCoachLoading ? "Thinking..." : "How can I reach my goal faster?"}
                    </button>

                    <button
                      type="button"
                      className="kid-ai-action-button kid-ai-action-button-secondary"
                      onClick={() => {
                        setIsSpendCoachOpen(true);
                        setSpendCoachReply(null);
                        setSpendItemName("");
                        setSpendItemCost("");
                      }}
                    >
                      Should I buy this now?
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className="kid-dashboard-section">
          <div className="kid-section-header">
            <h2>Task List</h2>
          </div>

          {!child.modulesCompleted.includes("module-1") ? (
            <div className="kid-empty-card">
              <div className="kid-empty-inline">
                <svg
                  className="kid-empty-inline-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M5 4.5C5 3.67 5.67 3 6.5 3H19v16H6.5C5.67 19 5 19.67 5 20.5V4.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 18.5C5 17.67 5.67 17 6.5 17H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
                <p>
                  Complete “Module 1: Needs vs Wants” first to unlock chores.
                </p>
              </div>
              <p className="kid-empty-subtext">
                Head to the Learn section and finish the module to get started.
              </p>
            </div>
          ) : chores.length === 0 ? (
            <div className="kid-empty-card">
              <p>No chores assigned yet.</p>
            </div>
          ) : (
            <div className="kid-task-list">
              {chores.map((chore) => {
                const completion = latestCompletionByChore.get(chore.id);

                return (
                  <article key={chore.id} className="kid-task-card">
                    <div className="kid-task-top">
                      <div className="kid-task-copy">
                        <div className="kid-task-title-row">
                          <h3>{chore.title}</h3>

                          <div className="kid-task-reward-pill">
                            <img
                              src="/assets/CoinIcon.svg"
                              alt=""
                              className="kid-task-reward-icon"
                            />
                            +{chore.reward}
                          </div>
                        </div>

                        {chore.description ? (
                          <p className="kid-task-description">
                            {chore.description}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {completion?.status === "pending" && (
                      <div className="kid-task-status kid-task-status-pending">
                        <svg
                          className="kid-task-status-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M12 7v5l3 2"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        Waiting for parent approval
                      </div>
                    )}

                    {completion?.status === "approved" && (
                      <div className="kid-task-status kid-task-status-approved">
                        <svg
                          className="kid-task-status-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M20 6L9 17l-5-5"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Approved
                      </div>
                    )}

                    {completion?.status === "rejected" && (
                      <div className="kid-task-status kid-task-status-rejected">
                        <svg
                          className="kid-task-status-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                        Rejected — try again
                      </div>
                    )}

                    {(completion?.status === undefined ||
                      completion?.status === "rejected") && (
                      <button
                        onClick={() => handleMarkDone(chore)}
                        disabled={actionLoadingId === chore.id}
                        className="kid-primary-button kid-task-done-button"
                        type="button"
                      >
                        {actionLoadingId === chore.id
                          ? "Submitting..."
                          : "Mark as Done"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {isEditingGoal && (
        <div
          className={`kid-modal-overlay ${isEditingGoalClosing ? "closing" : ""}`}
          onClick={() => !savingGoal && handleCloseEditGoal()}
          onAnimationEnd={handleEditGoalAnimationEnd}
        >
          <div
            className={`kid-modal-card ${isEditingGoalClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="kid-modal-title">Edit Your Goal</h2>

            <input
              type="text"
              value={editGoalItem}
              onChange={(e) => setEditGoalItem(e.target.value)}
              placeholder="What do you want to save for?"
              className="kid-modal-input"
            />

            <input
              type="number"
              value={editGoalCost}
              onChange={(e) => setEditGoalCost(e.target.value)}
              placeholder="How many coins needed?"
              className="kid-modal-input"
            />

            <div className="kid-modal-actions">
              <button
                type="button"
                onClick={handleCloseEditGoal}
                disabled={savingGoal}
                className="kid-modal-secondary-button"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveGoal}
                disabled={savingGoal}
                className="kid-modal-primary-button"
              >
                {savingGoal ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingGoal && (
        <div
          className={`kid-modal-overlay ${isAddingGoalClosing ? "closing" : ""}`}
          onClick={() => !addingGoal && handleCloseAddGoal()}
          onAnimationEnd={handleAddGoalAnimationEnd}
        >
          <div
            className={`kid-modal-card ${isAddingGoalClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="kid-modal-title">Add New Goal</h2>

            <input
              type="text"
              value={newGoalItem}
              onChange={(e) => setNewGoalItem(e.target.value)}
              placeholder="What do you want to save for?"
              className="kid-modal-input"
            />

            <input
              type="number"
              value={newGoalCost}
              onChange={(e) => setNewGoalCost(e.target.value)}
              placeholder="How many coins needed?"
              className="kid-modal-input"
            />

            <div className="kid-modal-actions">
              <button
                type="button"
                onClick={handleCloseAddGoal}
                disabled={addingGoal}
                className="kid-modal-secondary-button"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateGoal}
                disabled={addingGoal}
                className="kid-modal-primary-button"
              >
                {addingGoal ? "Saving..." : "Add Goal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSpendCoachOpen && (
        <div
          className="kid-modal-overlay"
          onClick={() => {
            if (!spendCoachLoading) {
              setIsSpendCoachOpen(false);
            }
          }}
        >
          <div
            className="kid-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="kid-modal-title">Spend or Save Coach</h2>

            <input
              type="text"
              value={spendItemName}
              onChange={(e) => setSpendItemName(e.target.value)}
              placeholder="What do you want to buy?"
              className="kid-modal-input"
            />

            <input
              type="number"
              value={spendItemCost}
              onChange={(e) => setSpendItemCost(e.target.value)}
              placeholder="How many coins does it cost?"
              className="kid-modal-input"
            />

            {spendCoachReply && (
              <div className="kid-ai-response kid-ai-response-modal">
                <div className="kid-ai-response-content">
                  <h4>{spendCoachReply.title}</h4>
                  <p>{spendCoachReply.message}</p>
                  <p>
                    <strong>
                      {spendCoachReply.recommendation === "buy" ? "Buy it" : "Save it"}
                    </strong>
                  </p>
                  <p>{spendCoachReply.reason}</p>
                  <p>{spendCoachReply.encouragement}</p>
                </div>
              </div>
            )}

            <div className="kid-modal-actions">
              <button
                type="button"
                onClick={() => setIsSpendCoachOpen(false)}
                disabled={spendCoachLoading}
                className="kid-modal-secondary-button"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAskSpendCoach}
                disabled={spendCoachLoading}
                className="kid-modal-primary-button"
              >
                {spendCoachLoading ? "Thinking..." : "Ask Coach"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCustomizing && (
        <div
          className={`kid-modal-overlay ${isCustomizingClosing ? "closing" : ""}`}
          onClick={() => !savingAvatar && handleCloseCustomize()}
          onAnimationEnd={handleCustomizeAnimationEnd}
        >
          <div
            className={`kid-modal-card ${isCustomizingClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="kid-modal-title">Pick your avatar</h2>

            <div className="kid-modal-avatar-preview">
              <img
                src={getAvatarPath(selectedAvatar)}
                alt="Selected avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/BearIcon.svg";
                }}
              />
            </div>

            <div className="kid-avatar-grid">
              {avatars.map((avatar) => (
                <button
                  key={avatar.key}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.key)}
                  className={`kid-avatar-option ${
                    selectedAvatar === avatar.key ? "is-selected" : ""
                  }`}
                >
                  <img src={avatar.src} alt={avatar.label} />
                </button>
              ))}
            </div>

            <div className="kid-modal-actions">
              <button
                type="button"
                onClick={handleCloseCustomize}
                disabled={savingAvatar}
                className="kid-modal-secondary-button"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={savingAvatar}
                className="kid-modal-primary-button"
              >
                {savingAvatar ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <KidBottomNav />
    </main>
  );
}
