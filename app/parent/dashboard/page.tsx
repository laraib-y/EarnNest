"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { auth, db } from "@/lib/firebase-client";

type ParentProfile = {
  uid: string;
  name: string;
  email: string;
  createdAt?: unknown;
};

export default function ParentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/" as Route);
        return;
      }

      setUser(firebaseUser);

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

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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
    <main style={{ padding: 40 }}>
      <h1>Parent Dashboard</h1>
      <p>Welcome, {user?.displayName || "Parent"}.</p>
      <p>Email: {user?.email}</p>

      <div style={{ marginTop: 24 }}>
        <button onClick={() => router.push("/parent/add-child" as Route)}>
          Add Child
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </main>
  );
}