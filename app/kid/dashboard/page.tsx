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

  const handleOpenCustomize = () => {
    setSelectedAvatar(child?.avatar || "bear");
    setIsCustomizing(true);
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
              <div style={{ position: "relative", display: "inline-block" }}>
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
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span className="kid-avatar-customize-text">Customize</span>
                </button>
              </div>

              <div>
                <p className="kid-dashboard-kicker">Kid Dashboard</p>
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

          {goals.length === 0 ? (
            <div className="kid-empty-card">
              <p>No goal set yet. Complete Module 1 to set your first goal!</p>
            </div>
          ) : (
            <div className="kid-goals-grid">
              {goals.slice(0, 1).map((goal) => (
                <div key={goal.id} className="kid-goal-card">
                  <div className="kid-goal-top">
                    <div>
                      <p className="kid-goal-label">Current Goal</p>
                      <h3>{goal.item}</h3>
                    </div>

                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="kid-goal-edit-button"
                      type="button"
                      title="Edit goal"
                    >
                      ✏️
                    </button>
                  </div>

                  <p className="kid-goal-progress-text">
                    {Math.min(child?.coinBalance || 0, goal.cost)} / {goal.cost}{" "}
                    Coins
                  </p>

                  <div className="kid-goal-progress-track">
                    <div
                      className="kid-goal-progress-fill"
                      style={{
                        width: `${Math.min(
                          ((child?.coinBalance || 0) / goal.cost) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="kid-dashboard-section">
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#2f241f",
            }}
          >
            Task List
          </h2>

          {!child.modulesCompleted.includes("module-1") ? (
            <div className="kid-empty-card">
              <p>
                📚 Complete "Module 1: Needs vs Wants" first to unlock chores!
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#7a675d",
                  marginTop: "8px",
                }}
              >
                Head to the Learn section and finish the module to get started.
              </p>
            </div>
          ) : chores.length === 0 ? (
            <div className="kid-empty-card">
              <p>No chores assigned yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {chores.map((chore, index) => {
                const completion = latestCompletionByChore.get(chore.id);
                const isFirst = index === 0;

                return (
                  <div
                    key={chore.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: isFirst ? "12px" : "12px",
                      padding: isFirst ? "20px" : "16px",
                      border: "2px solid #e8dcc8",
                      boxShadow: isFirst
                        ? "0 2px 8px rgba(47, 36, 31, 0.08)"
                        : "0 2px 8px rgba(47, 36, 31, 0.06)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: isFirst ? "16px" : "0",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.15rem",
                          fontWeight: 600,
                          color: "#2f241f",
                          flex: 1,
                        }}
                      >
                        {chore.title}
                      </h3>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          border: "2px solid #fcdd9d",
                          background: "#fffaf5",
                          color: "#8a6d2e",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          whiteSpace: "nowrap",
                          marginLeft: "16px",
                          flexShrink: 0,
                        }}
                      >
                        <span>💰</span> +{chore.reward}
                      </span>
                    </div>

                    {isFirst && (
                      <>
                        {completion?.status === "pending" && (
                          <p
                            style={{
                              margin: "0 0 12px",
                              fontSize: "0.85rem",
                              color: "#9c5b24",
                              fontWeight: 600,
                            }}
                          >
                            ⏳ Waiting for parent approval
                          </p>
                        )}

                        {completion?.status === "approved" && (
                          <p
                            style={{
                              margin: "0 0 12px",
                              fontSize: "0.85rem",
                              color: "#2d7a4b",
                              fontWeight: 600,
                            }}
                          >
                            ✅ Approved
                          </p>
                        )}

                        {completion?.status === "rejected" && (
                          <p
                            style={{
                              margin: "0 0 12px",
                              fontSize: "0.85rem",
                              color: "#b0462b",
                              fontWeight: 600,
                            }}
                          >
                            ❌ Rejected — try again
                          </p>
                        )}

                        {(completion?.status === undefined ||
                          completion?.status === "rejected") && (
                          <button
                            onClick={() => handleMarkDone(chore)}
                            disabled={actionLoadingId === chore.id}
                            style={{
                              width: "100%",
                              padding: "14px",
                              background: "#f1642e",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              fontWeight: 700,
                              fontSize: "1rem",
                              cursor:
                                actionLoadingId === chore.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: actionLoadingId === chore.id ? 0.7 : 1,
                              transition: "all 0.2s ease",
                            }}
                            type="button"
                          >
                            {actionLoadingId === chore.id
                              ? "Submitting..."
                              : "Done"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
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
            <h2 style={{ marginBottom: 20, marginTop: 0 }}>Edit Your Goal</h2>

            <input
              type="text"
              value={editGoalItem}
              onChange={(e) => setEditGoalItem(e.target.value)}
              placeholder="What do you want to save for?"
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "16px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />

            <input
              type="number"
              value={editGoalCost}
              onChange={(e) => setEditGoalCost(e.target.value)}
              placeholder="How many coins needed?"
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "24px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 12,
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={handleCloseEditGoal}
                disabled={savingGoal}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  background: "white",
                  color: "#333",
                  fontWeight: 600,
                  cursor: savingGoal ? "not-allowed" : "pointer",
                  opacity: savingGoal ? 0.7 : 1,
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveGoal}
                disabled={savingGoal}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  border: "none",
                  background: "#f1642e",
                  color: "white",
                  fontWeight: 600,
                  cursor: savingGoal ? "not-allowed" : "pointer",
                  opacity: savingGoal ? 0.7 : 1,
                }}
              >
                {savingGoal ? "Saving..." : "Save"}
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
            <h2 style={{ marginBottom: 20 }}>Pick your avatar</h2>

            <div
              style={{
                width: 180,
                height: 180,
                marginBottom: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={getAvatarPath(selectedAvatar)}
                alt="Selected avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/BearIcon.svg";
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
                marginBottom: 40,
                width: "100%",
                justifyItems: "center",
              }}
            >
              {avatars.map((avatar) => (
                <button
                  key={avatar.key}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.key)}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    border:
                      selectedAvatar === avatar.key
                        ? "3px solid #f1642e"
                        : "3px solid transparent",
                    background: "#ddd",
                    overflow: "hidden",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <img
                    src={avatar.src}
                    alt={avatar.label}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={handleCloseCustomize}
                disabled={savingAvatar}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  background: "white",
                  color: "#333",
                  fontWeight: 600,
                  cursor: savingAvatar ? "not-allowed" : "pointer",
                  opacity: savingAvatar ? 0.7 : 1,
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={savingAvatar}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  border: "none",
                  background: "#f1642e",
                  color: "white",
                  fontWeight: 600,
                  cursor: savingAvatar ? "not-allowed" : "pointer",
                  opacity: savingAvatar ? 0.7 : 1,
                }}
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
