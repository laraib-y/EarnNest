"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import "./parent-dashboard.css";

type ParentProfile = {
  uid: string;
  name: string;
  email: string;
  createdAt?: unknown;
};

type ChildItem = {
  id: string;
  name: string;
  displayName: string;
  accessCode: string;
  coinBalance: number;
  modulesCompleted: string[];
  completedChores: number;
  avatar?: string;
};

type PendingCompletion = {
  id: string;
  childId: string;
  choreId: string;
  choreTitle: string;
  reward: number;
  status: "pending" | "approved" | "rejected";
  childName: string;
  createdAt?: Timestamp | null;
};

type CompletionItem = {
  id: string;
  childId: string;
  choreId: string;
  choreTitle: string;
  reward: number;
  status: "pending" | "approved" | "rejected";
  createdAt?: Timestamp | null;
};

type ActiveChore = {
  id: string;
  childId: string;
  title: string;
  reward: number;
  status: string;
};

function getAvatarSrc(avatar?: string) {
  switch (avatar) {
    case "bear":
      return "/assets/BearIcon.svg";
    case "cat":
      return "/assets/CatIcon.svg";
    case "dog":
      return "/assets/DogIcon.svg";
    case "snake":
      return "/assets/SnakeIcon.svg";
    case "capybara":
      return "/assets/CapybaraIcon.svg";
    case "bunny":
      return "/assets/BunnyIcon.svg";
    default:
      return "/assets/BearIcon.svg";
  }
}

function getTimestampMillis(value?: Timestamp | null) {
  if (!value) return 0;
  try {
    return value.toMillis();
  } catch {
    return 0;
  }
}

export default function ParentDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [children, setChildren] = useState<ChildItem[]>([]);
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [activeChores, setActiveChores] = useState<ActiveChore[]>([]);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showChoreModal, setShowChoreModal] = useState(false);

  const [selectedChildId, setSelectedChildId] = useState("");
  const [choreTitle, setChoreTitle] = useState("");
  const [choreDescription, setChoreDescription] = useState("");
  const [choreReward, setChoreReward] = useState("20");
  const [choreFrequency, setChoreFrequency] = useState("one-time");
  const [choreSaving, setChhoreSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let childrenUnsub: (() => void) | null = null;
    let completionsUnsub: (() => void) | null = null;
    let choresUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/" as Route);
        return;
      }

      setUser(firebaseUser);

      try {
        const parentRef = doc(db, "parents", firebaseUser.uid);
        const parentSnap = await getDoc(parentRef);

        if (!parentSnap.exists()) {
          const parentProfile: ParentProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "Parent",
            email: firebaseUser.email || "",
            createdAt: serverTimestamp(),
          };

          await setDoc(parentRef, parentProfile);
        }

        childrenUnsub = onSnapshot(
          query(collection(db, "children"), where("parentUid", "==", firebaseUser.uid)),
          (snapshot) => {
            const childList: ChildItem[] = snapshot.docs.map((childDoc) => {
              const data = childDoc.data();
              return {
                id: childDoc.id,
                name: data.name || "",
                displayName: data.displayName || data.name || "",
                accessCode: data.accessCode || "",
                coinBalance: Number(data.coinBalance || 0),
                modulesCompleted: Array.isArray(data.modulesCompleted)
                  ? data.modulesCompleted
                  : [],
                completedChores: Number(data.completedChores || 0),
                avatar: data.avatar || "bear",
              };
            });

            setChildren(childList);

            if (childList.length > 0 && !selectedChildId) {
              setSelectedChildId(childList[0].id);
            }

            if (childList.length === 0) {
              router.push("/parent/add-child" as Route);
            }
          }
        );

        completionsUnsub = onSnapshot(
          query(collection(db, "completions"), where("parentUid", "==", firebaseUser.uid)),
          (snapshot) => {
            const list: CompletionItem[] = snapshot.docs.map((completionDoc) => {
              const data = completionDoc.data();
              return {
                id: completionDoc.id,
                childId: data.childId || "",
                choreId: data.choreId || "",
                choreTitle: data.choreTitle || "Task",
                reward: Number(data.reward || 0),
                status: data.status || "pending",
                createdAt: data.createdAt || null,
              };
            });

            setCompletions(list);
          }
        );

        choresUnsub = onSnapshot(
          query(collection(db, "chores"), where("parentUid", "==", firebaseUser.uid)),
          (snapshot) => {
            const choreList: ActiveChore[] = snapshot.docs
              .map((choreDoc) => {
                const data = choreDoc.data();
                return {
                  id: choreDoc.id,
                  childId: data.childId || "",
                  title: data.title || "",
                  reward: Number(data.reward || 0),
                  status: data.status || "active",
                };
              })
              .filter((chore) => chore.status === "active");

            setActiveChores(choreList);
          }
        );
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authUnsub();
      childrenUnsub?.();
      completionsUnsub?.();
      choresUnsub?.();
    };
  }, [router, selectedChildId]);

  const pendingCompletions = useMemo(() => {
    const childNameMap = new Map(children.map((child) => [child.id, child.displayName]));

    return completions
      .filter((item) => item.status === "pending")
      .map((item) => ({
        ...item,
        childName: childNameMap.get(item.childId) || "Child",
      })) as PendingCompletion[];
  }, [completions, children]);

  const latestCompletionByChild = useMemo(() => {
    const map = new Map<string, number>();

    for (const completion of completions) {
      const ts = getTimestampMillis(completion.createdAt);
      const prev = map.get(completion.childId) || 0;
      if (ts > prev) {
        map.set(completion.childId, ts);
      }
    }

    return map;
  }, [completions]);

  const sortedChildren = useMemo(() => {
    return [...children].sort((a, b) => {
      const aLatest = latestCompletionByChild.get(a.id) || 0;
      const bLatest = latestCompletionByChild.get(b.id) || 0;

      if (bLatest !== aLatest) {
        return bLatest - aLatest;
      }

      return a.displayName.localeCompare(b.displayName);
    });
  }, [children, latestCompletionByChild]);

  useEffect(() => {
    if (!selectedChildId && sortedChildren.length > 0) {
      setSelectedChildId(sortedChildren[0].id);
      return;
    }

    const stillExists = sortedChildren.some((child) => child.id === selectedChildId);
    if (!stillExists && sortedChildren.length > 0) {
      setSelectedChildId(sortedChildren[0].id);
    }
  }, [sortedChildren, selectedChildId]);

  const handleApprove = async (completionId: string) => {
    try {
      setActionLoadingId(completionId);

      await runTransaction(db, async (transaction) => {
        const completionRef = doc(db, "completions", completionId);
        const completionSnap = await transaction.get(completionRef);

        if (!completionSnap.exists()) {
          throw new Error("Completion not found.");
        }

        const completionData = completionSnap.data();

        if (completionData.status !== "pending") {
          throw new Error("Completion already reviewed.");
        }

        const childRef = doc(db, "children", completionData.childId);
        const childSnap = await transaction.get(childRef);

        if (!childSnap.exists()) {
          throw new Error("Child not found.");
        }

        const childData = childSnap.data();
        const currentCoins = Number(childData.coinBalance || 0);
        const currentCompleted = Number(childData.completedChores || 0);
        const reward = Number(completionData.reward || 0);

        transaction.update(childRef, {
          coinBalance: currentCoins + reward,
          completedChores: currentCompleted + 1,
        });

        transaction.update(completionRef, {
          status: "approved",
          reviewedAt: serverTimestamp(),
        });
      });
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Could not approve task.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (completionId: string) => {
    try {
      setActionLoadingId(completionId);

      await updateDoc(doc(db, "completions", completionId), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
      alert("Could not reject task.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChildId) {
      alert("Please select a child first.");
      return;
    }

    if (!choreTitle.trim()) {
      alert("Please enter a task title.");
      return;
    }

    const numericReward = Number(choreReward);
    if (!Number.isFinite(numericReward) || numericReward <= 0) {
      alert("Please enter a valid coin reward.");
      return;
    }

    try {
      setChhoreSaving(true);

      await addDoc(collection(db, "chores"), {
        parentUid: user?.uid,
        childId: selectedChildId,
        title: choreTitle.trim(),
        description: choreDescription.trim(),
        reward: numericReward,
        frequency: choreFrequency,
        status: "active",
        createdAt: serverTimestamp(),
      });

      setChoreTitle("");
      setChoreDescription("");
      setChoreReward("20");
      setChoreFrequency("one-time");
      setShowChoreModal(false);
    } catch (error) {
      console.error(error);
      alert("Failed to create task.");
    } finally {
      setChhoreSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/" as Route);
  };

  if (loading) {
    return (
      <main className="parent-dashboard-page">
        <div className="parent-dashboard-shell">
          <p className="parent-dashboard-loading">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="parent-dashboard-page">
      <div className="parent-dashboard-shell">
        <section className="parent-dashboard-topbar">
          <div className="parent-dashboard-heading">
            <p className="parent-dashboard-kicker">Parent Dashboard</p>
            <h1 className="parent-dashboard-title">
              Hi {user?.displayName?.split(" ")[0] || "parent"}! 👋
            </h1>
          </div>

          <button onClick={handleLogout} className="parent-secondary-button" type="button">
            Log out
          </button>
        </section>

        <section className="parent-children-list">
          {sortedChildren.map((child) => {
            const childPending = pendingCompletions.filter((item) => item.childId === child.id);
            const childActiveChores = activeChores.filter((item) => item.childId === child.id);
            const completedModulesCount = child.modulesCompleted.length || 0;
            const totalModules = 2;
            const isSelected = selectedChildId === child.id;

            return (
              <article
                key={child.id}
                className={`parent-child-focus-card ${isSelected ? "is-selected" : ""}`}
              >
                <div className="parent-child-header">
                  <div className="parent-child-avatar">
                    <Image
                      src={getAvatarSrc(child.avatar)}
                      alt={`${child.displayName} avatar`}
                      fill
                      sizes="72px"
                      style={{ objectFit: "contain" }}
                    />
                  </div>

                  <div className="parent-child-meta">
                    <h2>{child.displayName}</h2>
                    <p>Level 1</p>
                    <span className="parent-child-coins">
                      <span className="parent-child-coins-icon" aria-hidden="true">
                        <Image
                          src="/assets/CoinIcon.svg"
                          alt=""
                          fill
                          sizes="18px"
                          style={{ objectFit: "contain" }}
                        />
                      </span>
                      {child.coinBalance} Coins
                    </span>
                    <span className="parent-child-code">
                      Access Code: <strong>{child.accessCode}</strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedChildId(child.id);
                    setShowChoreModal(true);
                  }}
                  className="parent-task-button"
                  type="button"
                >
                  <span className="parent-plus">＋</span>
                  Add New Task
                </button>

                <div className="parent-summary-grid">
                  <div className="parent-summary-pill">
                    <span>Active Tasks</span>
                    <strong>{childActiveChores.length}</strong>
                  </div>
                  <div className="parent-summary-pill">
                    <span>Pending</span>
                    <strong>{childPending.length}</strong>
                  </div>
                  <div className="parent-summary-pill">
                    <span>Modules</span>
                    <strong>
                      {completedModulesCount}/{totalModules}
                    </strong>
                  </div>
                </div>

                <div className="parent-activity-section">
                  <div className="parent-section-header">
                    <p className="parent-activity-heading">Pending Reviews</p>
                  </div>

                  <div className="parent-activity-list">
                    {childPending.length === 0 ? (
                      <div className="parent-activity-empty">No pending task reviews yet.</div>
                    ) : (
                      childPending.map((completion) => (
                        <article
                          key={completion.id}
                          className={`parent-activity-card ${
                            completion.choreTitle.toLowerCase().includes("goal")
                              ? "goal-card"
                              : ""
                          }`}
                        >
                          <div className="parent-activity-copy">
                            <p className="parent-activity-label">
                              {completion.choreTitle.toLowerCase().includes("goal")
                                ? "Goal"
                                : "Task Completed"}
                            </p>
                            <h3>{completion.choreTitle}</h3>
                            <span className="parent-activity-reward">
                              Reward:
                              <span className="parent-activity-reward-icon" aria-hidden="true">
                                <Image
                                  src="/assets/CoinIcon.svg"
                                  alt=""
                                  fill
                                  sizes="16px"
                                  style={{ objectFit: "contain" }}
                                />
                              </span>
                              {completion.reward}
                            </span>
                          </div>

                          <div className="parent-activity-actions">
                            <button
                              onClick={() => handleReject(completion.id)}
                              disabled={actionLoadingId === completion.id}
                              className="parent-icon-button parent-icon-button-muted"
                              aria-label="Reject task"
                              type="button"
                            >
                              ✕
                            </button>

                            <button
                              onClick={() => handleApprove(completion.id)}
                              disabled={actionLoadingId === completion.id}
                              className="parent-icon-button parent-icon-button-primary"
                              aria-label="Approve task"
                              type="button"
                            >
                              {actionLoadingId === completion.id ? "…" : "✓"}
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="parent-fab-row">
          <button
            onClick={() => router.push("/parent/add-child" as Route)}
            className="parent-fab"
            aria-label="Add child"
            type="button"
          >
            ＋ Child
          </button>
        </section>
      </div>

      {showChoreModal && (
        <>
          <div
            className="parent-modal-overlay"
            onClick={() => setShowChoreModal(false)}
          />
          <div className="parent-modal-sheet">
            <div className="parent-modal-handle" />
            <h2 className="parent-modal-title">Assign Task</h2>

            <form onSubmit={handleAddChore} className="parent-modal-form">
              <div className="parent-modal-field">
                <label htmlFor="child-select">Child</label>
                <select
                  id="child-select"
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                >
                  {sortedChildren.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="parent-modal-field">
                <label htmlFor="chore-title">Task</label>
                <input
                  id="chore-title"
                  value={choreTitle}
                  onChange={(e) => setChoreTitle(e.target.value)}
                  placeholder="Enter task name"
                />
              </div>

              <div className="parent-modal-field">
                <label htmlFor="chore-reward">Coin amount</label>
                <input
                  id="chore-reward"
                  type="number"
                  value={choreReward}
                  onChange={(e) => setChoreReward(e.target.value)}
                />
              </div>

              <div className="parent-modal-field">
                <label htmlFor="chore-description">Details / Instructions</label>
                <textarea
                  id="chore-description"
                  value={choreDescription}
                  onChange={(e) => setChoreDescription(e.target.value)}
                  rows={3}
                  placeholder="Add details..."
                />
              </div>

              <div className="parent-modal-field">
                <label htmlFor="chore-frequency">Frequency</label>
                <select
                  id="chore-frequency"
                  value={choreFrequency}
                  onChange={(e) => setChoreFrequency(e.target.value)}
                >
                  <option value="one-time">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={choreSaving}
                className="parent-modal-submit"
              >
                <span>＋</span> {choreSaving ? "Adding..." : "Add Task"}
              </button>
            </form>
          </div>
        </>
      )}
    </main>
  );
}