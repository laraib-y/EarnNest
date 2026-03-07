"use client";

import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase-client";

type ChildProfile = {
  name: string;
  displayName: string;
  avatar: string;
  coinBalance: number;
  streak: number;
  completedChores: number;
};

export default function KidDashboardPage() {
  const router = useRouter();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedChildId = localStorage.getItem("kidChildId");

    if (!storedChildId) {
      router.push("/kid");
      return;
    }

    async function loadChild(childId: string) {
      try {
        const ref = doc(db, "children", childId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          router.push("/kid");
          return;
        }

        setChild(snap.data() as ChildProfile);
      } catch (error) {
        console.error(error);
        router.push("/kid");
      } finally {
        setLoading(false);
      }
    }

    loadChild(storedChildId);
  }, [router]);

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        <p>Loading kid dashboard...</p>
      </main>
    );
  }

  if (!child) return null;

  return (
    <main style={{ padding: 40 }}>
      <h1>Kid Dashboard</h1>
      <p>Hi, {child.displayName || child.name}!</p>
      <p>Coins: {child.coinBalance}</p>
      <p>Streak: {child.streak}</p>
      <p>Completed chores: {child.completedChores}</p>
    </main>
  );
}