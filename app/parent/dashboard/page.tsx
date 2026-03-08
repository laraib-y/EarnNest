"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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
};

type PendingCompletion = {
  id: string;
  childId: string;
  choreId: string;
  choreTitle: string;
  reward: number;
  status: "pending" | "approved" | "rejected";
  childName: string;
};

type ActiveChore = {
  id: string;
  childId: string;
  title: string;
  reward: number;
  status: string;
};

export default function ParentDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<PendingCompletion[]>([]);
  const [activeChores, setActiveChores] = useState<ActiveChore[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [showChoreModal, setShowChoreModal] = useState(false);
  const [choreTitle, setChoreTitle] = useState("");
  const [choreDescription, setChoreDescription] = useState("");
  const [choreReward, setChoreReward] = useState("20");
  const [choreFrequency, setChoreFrequency] = useState("one-time");
  const [choreSaving, setChhoreSaving] = useState(false);

  const loadDashboard = async (firebaseUser: User) => {
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

    const childSnap = await getDocs(
      query(collection(db, "children"), where("parentUid", "==", firebaseUser.uid))
    );

    const childList: ChildItem[] = childSnap.docs.map((childDoc) => {
      const data = childDoc.data();
      return {
        id: childDoc.id,
        name: data.name || "",
        displayName: data.displayName || data.name || "",
        accessCode: data.accessCode || "",
        coinBalance: Number(data.coinBalance || 0),
        modulesCompleted: Array.isArray(data.modulesCompleted) ? data.modulesCompleted : [],
        completedChores: Number(data.completedChores || 0),
      };
    });

    if (childList.length === 0) {
      router.push("/parent/add-child" as Route);
      return;
    }

    const childNameMap = new Map(childList.map((child) => [child.id, child.displayName]));

    const completionSnap = await getDocs(
      query(collection(db, "completions"), where("parentUid", "==", firebaseUser.uid))
    );

    const pendingList: PendingCompletion[] = completionSnap.docs
      .map((completionDoc) => {
        const data = completionDoc.data();
        return {
          id: completionDoc.id,
          childId: data.childId || "",
          choreId: data.choreId || "",
          choreTitle: data.choreTitle || "Task",
          reward: Number(data.reward || 0),
          status: data.status || "pending",
          childName: childNameMap.get(data.childId || "") || "Child",
        } as PendingCompletion;
      })
      .filter((item) => item.status === "pending");

    const choreSnap = await getDocs(
      query(collection(db, "chores"), where("parentUid", "==", firebaseUser.uid))
    );

    const choreList: ActiveChore[] = choreSnap.docs
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

    setChildren(childList);
    setPendingCompletions(pendingList);
    setActiveChores(choreList);
    setActiveChildIndex((prev) => Math.min(prev, childList.length - 1));
  };

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/" as Route);
        return;
      }

      setUser(firebaseUser);

      try {
        await loadDashboard(firebaseUser);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  const refreshDashboard = async () => {
    if (!user) return;
    await loadDashboard(user);
  };

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

      await refreshDashboard();
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

      await refreshDashboard();
    } catch (error) {
      console.error(error);
      alert("Could not reject task.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();

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
        childId: activeChild?.id,
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
      await refreshDashboard();
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

  const activeChild = useMemo(() => {
    if (children.length === 0) return null;
    return children[activeChildIndex] || children[0];
  }, [children, activeChildIndex]);

  const activeChildPending = useMemo(() => {
    if (!activeChild) return [];
    return pendingCompletions.filter((item) => item.childId === activeChild.id);
  }, [pendingCompletions, activeChild]);

  const activeChildChores = useMemo(() => {
    if (!activeChild) return [];
    return activeChores.filter((item) => item.childId === activeChild.id);
  }, [activeChores, activeChild]);

  const completedModulesCount = activeChild?.modulesCompleted.length || 0;
  const totalModules = 2;

  if (loading) {
    return (
      <main className="parent-dashboard-page">
        <div className="parent-dashboard-shell">
          <p className="parent-dashboard-loading">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (!activeChild) return null;

  return (
    <main className="parent-dashboard-page">
      <div className="parent-dashboard-shell">
        <section className="parent-dashboard-topbar">
          <h1 className="parent-dashboard-title">
            Hi {user?.displayName?.split(" ")[0] || "parent"}! 👋
          </h1>
          <button onClick={handleLogout} className="parent-secondary-button">
            Log out
          </button>
        </section>

        <section className="parent-child-panel">
          <article className="parent-child-focus-card">
            <div className="parent-child-header">
              <div className="parent-child-avatar" aria-hidden="true" />
              <div className="parent-child-meta">
                <h2>{activeChild.displayName}</h2>
                <p>lvl 1</p>
                <span>🪙 {activeChild.coinBalance} Coins</span>
                <span style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px", display: "block" }}>
                  Access Code: <strong>{activeChild.accessCode}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowChoreModal(true)}
              className="parent-task-button"
            >
              <span className="parent-plus">＋</span> Add New Task
            </button>

            <div className="parent-summary-grid">
              <div className="parent-summary-pill">
                <span>Active Tasks</span>
                <strong>{activeChildChores.length}</strong>
              </div>
              <div className="parent-summary-pill">
                <span>Pending</span>
                <strong>{activeChildPending.length}</strong>
              </div>
              <div className="parent-summary-pill">
                <span>Modules</span>
                <strong>
                  {completedModulesCount}/{totalModules}
                </strong>
              </div>
            </div>

            <div className="parent-activity-section">
              <p className="parent-activity-heading">Recent Activities</p>

              <div className="parent-activity-list">
                {activeChildPending.length === 0 ? (
                  <div className="parent-activity-empty">No recent activities yet.</div>
                ) : (
                  activeChildPending.map((completion) => (
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
                            ? "New Goal"
                            : "Complete"}
                        </p>
                        <h3>{completion.choreTitle}</h3>
                      </div>

                      <div className="parent-activity-actions">
                        <button
                          onClick={() => handleReject(completion.id)}
                          disabled={actionLoadingId === completion.id}
                          className="parent-icon-button parent-icon-button-muted"
                          aria-label="Reject task"
                        >
                          ✕
                        </button>

                        <button
                          onClick={() => handleApprove(completion.id)}
                          disabled={actionLoadingId === completion.id}
                          className="parent-icon-button parent-icon-button-primary"
                          aria-label="Approve task"
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
        </section>

        <section className="parent-fab-row">
          <button
            onClick={() => router.push("/parent/add-child" as Route)}
            className="parent-fab"
            aria-label="Add child"
          >
            ＋ Child
          </button>
        </section>

        {children.length > 1 && (
          <section className="parent-child-nav">
            <button
              type="button"
              className="parent-nav-arrow"
              onClick={() =>
                setActiveChildIndex((prev) => (prev === 0 ? children.length - 1 : prev - 1))
              }
              aria-label="Previous child"
            >
              ‹
            </button>

            <div className="parent-nav-dots">
              {children.map((child, index) => (
                <button
                  key={child.id}
                  type="button"
                  className={`parent-nav-dot ${index === activeChildIndex ? "is-active" : ""}`}
                  onClick={() => setActiveChildIndex(index)}
                  aria-label={`Go to ${child.displayName}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="parent-nav-arrow"
              onClick={() =>
                setActiveChildIndex((prev) =>
                  prev === children.length - 1 ? 0 : prev + 1
                )
              }
              aria-label="Next child"
            >
              ›
            </button>
          </section>
        )}
      </div>

      {/* Bottom Sheet Modal */}
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
                <label htmlFor="chore-description">Details/Instructions</label>
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