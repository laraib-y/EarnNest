"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { db } from "@/lib/firebase-client";

type ChildProfile = {
  id: string;
  parentUid: string;
  name: string;
  displayName: string;
  avatar: string;
  coinBalance: number;
  streak: number;
  completedChores: number;
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
};

export default function KidDashboardPage() {
  const router = useRouter();

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const latestCompletionByChore = useMemo(() => {
    const map = new Map<string, CompletionItem>();
    for (const completion of completions) {
      map.set(completion.choreId, completion);
    }
    return map;
  }, [completions]);

  useEffect(() => {
    const storedChildId = localStorage.getItem("kidChildId");

    if (!storedChildId) {
      router.push("/kid" as Route);
      return;
    }

    const loadData = async (childId: string) => {
      try {
        const childRef = doc(db, "children", childId);
        const childSnap = await getDoc(childRef);

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
          avatar: childData.avatar || "",
          coinBalance: Number(childData.coinBalance || 0),
          streak: Number(childData.streak || 0),
          completedChores: Number(childData.completedChores || 0),
        };

        const choreSnap = await getDocs(
          query(collection(db, "chores"), where("childId", "==", childId))
        );

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

        const completionSnap = await getDocs(
          query(collection(db, "completions"), where("childId", "==", childId))
        );

        const completionList: CompletionItem[] = completionSnap.docs.map((completionDoc) => {
          const data = completionDoc.data();
          return {
            id: completionDoc.id,
            choreId: data.choreId || "",
            status: data.status || "pending",
            reward: Number(data.reward || 0),
          };
        });

        setChild(childProfile);
        setChores(choreList);
        setCompletions(completionList);
      } catch (error) {
        console.error(error);
        router.push("/kid" as Route);
      } finally {
        setLoading(false);
      }
    };

    loadData(storedChildId);
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
        completedAt: serverTimestamp(),
        reviewedAt: null,
      });

      setCompletions((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          choreId: chore.id,
          status: "pending",
          reward: chore.reward,
        },
      ]);

      alert("Nice work! Ask your parent to approve your chore.");
    } catch (error) {
      console.error(error);
      alert("Could not mark chore as done.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        <p>Loading kid dashboard...</p>
      </main>
    );
  }

  if (!child) return null;

  return (
    <main style={{ padding: 40, maxWidth: 800 }}>
      <h1>Kid Dashboard</h1>
      <p>Hi, {child.displayName || child.name}!</p>
      <p>Coins: {child.coinBalance}</p>
      <p>Streak: {child.streak}</p>
      <p>Completed chores: {child.completedChores}</p>

      <section style={{ marginTop: 32 }}>
        <h2>Your Chores</h2>

        {chores.length === 0 ? (
          <p>No chores assigned yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
            {chores.map((chore) => {
              const completion = latestCompletionByChore.get(chore.id);

              return (
                <div
                  key={chore.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <h3 style={{ margin: 0 }}>{chore.title}</h3>

                  {chore.description ? (
                    <p style={{ margin: "8px 0" }}>{chore.description}</p>
                  ) : null}

                  <p style={{ margin: "8px 0" }}>Reward: {chore.reward} coins</p>
                  <p style={{ margin: "8px 0" }}>Frequency: {chore.frequency}</p>

                  {completion?.status === "pending" && (
                    <p style={{ margin: "8px 0" }}>Waiting for parent approval</p>
                  )}

                  {completion?.status === "approved" && (
                    <p style={{ margin: "8px 0" }}>Approved ✅</p>
                  )}

                  {completion?.status === "rejected" && (
                    <p style={{ margin: "8px 0" }}>Rejected — you can try again</p>
                  )}

                  {(completion?.status === undefined || completion?.status === "rejected") && (
                    <button
                      onClick={() => handleMarkDone(chore)}
                      disabled={actionLoadingId === chore.id}
                    >
                      {actionLoadingId === chore.id ? "Submitting..." : "Mark as Done"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}