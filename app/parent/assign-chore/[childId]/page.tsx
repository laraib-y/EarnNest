"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import type { Route } from "next";
import { auth, db } from "@/lib/firebase-client";

type ChildInfo = {
  id: string;
  displayName: string;
  parentUid: string;
};

export default function AssignChorePage() {
  const params = useParams<{ childId: string }>();
  const router = useRouter();

  const rawChildId = params?.childId;
  const childId = Array.isArray(rawChildId) ? rawChildId[0] : rawChildId;

  const [parentUid, setParentUid] = useState("");
  const [child, setChild] = useState<ChildInfo | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("20");
  const [frequency, setFrequency] = useState("one-time");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/" as Route);
        return;
      }

      try {
        const childRef = doc(db, "children", childId);
        const childSnap = await getDoc(childRef);

        if (!childSnap.exists()) {
          alert("Child not found.");
          router.push("/parent/dashboard" as Route);
          return;
        }

        const childData = childSnap.data();

        if (childData.parentUid !== user.uid) {
          alert("You do not have access to this child.");
          router.push("/parent/dashboard" as Route);
          return;
        }

        if (!cancelled) {
          setParentUid(user.uid);
          setChild({
            id: childSnap.id,
            displayName: childData.displayName || childData.name || "Child",
            parentUid: childData.parentUid,
          });
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
  }, [childId, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!childId) {
      alert("Missing child ID.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a chore title.");
      return;
    }

    const numericReward = Number(reward);

    if (!Number.isFinite(numericReward) || numericReward <= 0) {
      alert("Please enter a valid coin reward.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "chores"), {
        parentUid,
        childId,
        title: title.trim(),
        description: description.trim(),
        reward: numericReward,
        frequency,
        status: "active",
        createdAt: serverTimestamp(),
      });

      alert("Chore created.");
      router.push("/parent/dashboard" as Route);
    } catch (error) {
      console.error(error);
      alert("Failed to create chore.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (!childId) {
    return (
      <main style={{ padding: 40 }}>
        <p>Missing child route parameter.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, maxWidth: 560 }}>
      <h1>Assign Chore</h1>
      <p>Assigning to: {child?.displayName || "Child"}</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <input
          placeholder="Chore title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        <input
          type="number"
          placeholder="Coin reward"
          value={reward}
          onChange={(e) => setReward(e.target.value)}
        />

        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="one-time">One-time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Create Chore"}
        </button>
      </form>
    </main>
  );
}