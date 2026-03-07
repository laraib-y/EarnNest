"use client";

import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";

function generateAccessCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function AddChildPage() {
  const router = useRouter();

  const [parentUid, setParentUid] = useState("");
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState("");
  const [avatar, setAvatar] = useState("bear");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdChild, setCreatedChild] = useState<null | {
    name: string;
    accessCode: string;
  }>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const parentRef = doc(db, "parents", user.uid);
      const parentSnap = await getDoc(parentRef);

      if (!parentSnap.exists()) {
        router.push("/parent/dashboard");
        return;
      }

      setParentUid(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!childName.trim()) {
      alert("Please enter the child's name.");
      return;
    }

    if (!pin.match(/^\d{4}$/)) {
      alert("PIN must be exactly 4 digits.");
      return;
    }

    setLoading(true);

    try {
      const accessCode = generateAccessCode();

      await addDoc(collection(db, "children"), {
        parentUid,
        name: childName.trim(),
        displayName: childName.trim(),
        age: Number(age) || null,
        avatar,
        tempPin: pin,
        pin,
        accessCode,
        coinBalance: 0,
        streak: 0,
        saveCoins: 0,
        spendCoins: 0,
        shareCoins: 0,
        completedChores: 0,
        modulesCompleted: [],
        createdAt: serverTimestamp(),
      });

      setCreatedChild({
        name: childName.trim(),
        accessCode,
      });

      setChildName("");
      setAge("");
      setAvatar("bear");
      setPin("");
    } catch (error) {
      console.error(error);
      alert("Failed to create child profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 40, maxWidth: 520 }}>
      <h1>Add Child</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <input
          placeholder="Child name"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
        />

        <input
          placeholder="Age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />

        <select value={avatar} onChange={(e) => setAvatar(e.target.value)}>
          <option value="bear">Bear</option>
          <option value="cat">Cat</option>
          <option value="fox">Fox</option>
          <option value="rabbit">Rabbit</option>
        </select>

        <input
          placeholder="Temporary 4-digit PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={4}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Child Profile"}
        </button>
      </form>

      {createdChild && (
        <div style={{ marginTop: 24, padding: 16, border: "1px solid #ccc", borderRadius: 12 }}>
          <h3>Child Created</h3>
          <p>Name: {createdChild.name}</p>
          <p>Access Code: <strong>{createdChild.accessCode}</strong></p>
          <p>Use this code on the kid's device to join the parent account.</p>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button onClick={() => router.push("/parent/dashboard")}>Back to Dashboard</button>
      </div>
    </main>
  );
}