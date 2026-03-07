"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
              choreTitle: data.choreTitle || "Chore",
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
          choreTitle: data.choreTitle || "Chore",
          reward: Number(data.reward || 0),
          status: data.status || "pending",
          childName: childNameMap.get(data.childId || "") || "Child",
        } as PendingCompletion;
      })
      .filter((item) => item.status === "pending");

    setChildren(childList);
    setPendingCompletions(pendingList);
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
      alert(error.message || "Could not approve chore.");
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
      alert("Could not reject chore.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/" as Route);
  };

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, maxWidth: 900 }}>
      <h1>Parent Dashboard</h1>
      <p>Welcome, {user?.displayName || "Parent"}.</p>
      <p>Email: {user?.email}</p>

      <div style={{ marginTop: 24 }}>
        <Link href={"/parent/add-child" as Route}>Add Child</Link>
      </div>

      <section style={{ marginTop: 32 }}>
        <h2>Your Children</h2>

        {children.length === 0 ? (
          <p>No child profiles yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
            {children.map((child) => (
              <div
                key={child.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <h3 style={{ margin: 0 }}>{child.displayName}</h3>
                <p style={{ margin: "8px 0" }}>Access Code: {child.accessCode}</p>
                <p style={{ margin: "8px 0" }}>Coins: {child.coinBalance}</p>
                <Link href={`/parent/assign-chore/${child.id}` as Route}>
                  Assign Chore
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Pending Approvals</h2>

        {pendingCompletions.length === 0 ? (
          <p>No chores waiting for approval.</p>
        ) : (
          <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
            {pendingCompletions.map((completion) => (
              <div
                key={completion.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <h3 style={{ margin: 0 }}>{completion.choreTitle}</h3>
                <p style={{ margin: "8px 0" }}>Child: {completion.childName}</p>
                <p style={{ margin: "8px 0" }}>Reward: {completion.reward} coins</p>

                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <button
                    onClick={() => handleApprove(completion.id)}
                    disabled={actionLoadingId === completion.id}
                  >
                    {actionLoadingId === completion.id ? "Working..." : "Approve"}
                  </button>

                  <button
                    onClick={() => handleReject(completion.id)}
                    disabled={actionLoadingId === completion.id}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ marginTop: 32 }}>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </main>
  );
}