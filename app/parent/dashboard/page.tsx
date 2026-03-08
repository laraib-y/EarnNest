"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
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

export default function ParentDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<PendingCompletion[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
          };
        });

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

        if (!cancelled) {
          setChildren(childList);
          setPendingCompletions(pendingList);
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
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

    const childSnap = await getDocs(
      query(collection(db, "children"), where("parentUid", "==", user.uid))
    );

    const childList: ChildItem[] = childSnap.docs.map((childDoc) => {
      const data = childDoc.data();
      return {
        id: childDoc.id,
        name: data.name || "",
        displayName: data.displayName || data.name || "",
        accessCode: data.accessCode || "",
        coinBalance: Number(data.coinBalance || 0),
      };
    });

    const childNameMap = new Map(childList.map((child) => [child.id, child.displayName]));

    const completionSnap = await getDocs(
      query(collection(db, "completions"), where("parentUid", "==", user.uid))
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

    setChildren(childList);
    setPendingCompletions(pendingList);
    setActiveChildIndex((prev) => {
      if (childList.length === 0) return 0;
      return Math.min(prev, childList.length - 1);
    });
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
          <h1 className="parent-dashboard-title">
            Hi {user?.displayName?.split(" ")[0] || "parent"}! 👋
          </h1>

          <div className="parent-dashboard-top-actions">
            <Link href={"/parent/add-child" as Route} className="parent-primary-button">
              <span className="parent-plus">＋</span> Add Child
            </Link>
          </div>
        </section>

        {children.length === 0 ? (
          <section className="parent-empty-state-card">
            <Link href={"/parent/add-child" as Route} className="parent-primary-button parent-primary-button-full">
              <span className="parent-plus">＋</span> Add Child
            </Link>

            <div className="parent-empty-panel">
              <p>No Account Added Yet</p>
            </div>
          </section>
        ) : (
          <>
            <section className="parent-child-panel">
              <article className="parent-child-focus-card">
                <div className="parent-child-header">
                  <div className="parent-child-avatar" aria-hidden="true" />
                  <div className="parent-child-meta">
                    <h2>{activeChild?.displayName}</h2>
                    <p>lvl 1</p>
                    <span>🪙 {activeChild?.coinBalance} Coins</span>
                  </div>
                </div>

                <Link
                  href={`/parent/assign-chore/${activeChild?.id}` as Route}
                  className="parent-task-button"
                >
                  <span className="parent-plus">＋</span> Add New Task
                </Link>

                <div className="parent-activity-list">
                  {activeChildPending.length === 0 ? (
                    <div className="parent-activity-empty">No recent activities yet.</div>
                  ) : (
                    activeChildPending.map((completion) => (
                      <article key={completion.id} className="parent-activity-card">
                        <div className="parent-activity-copy">
                          <p className="parent-activity-label">Complete</p>
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
              </article>
            </section>

            {children.length > 1 && (
              <section className="parent-child-nav">
                <button
                  type="button"
                  className="parent-nav-arrow"
                  onClick={() =>
                    setActiveChildIndex((prev) =>
                      prev === 0 ? children.length - 1 : prev - 1
                    )
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
                      className={`parent-nav-dot ${
                        index === activeChildIndex ? "is-active" : ""
                      }`}
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

            <section className="parent-dashboard-footer">
              <button onClick={handleLogout} className="parent-secondary-button">
                Log out
              </button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}