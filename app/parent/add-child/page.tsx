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
import "./add-child.css";

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
  const [avatar, setAvatar] = useState("");
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
        username: "",
        age: Number(age) || null,
        avatar,
        tempPin: pin,
        pin,
        mustChangePin: true,
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
      setAvatar("");
      setPin("");
    } catch (error) {
      console.error(error);
      alert("Failed to create child profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="add-child-page">
      <div className="add-child-shell">
        <section className="add-child-hero">
          <div>
            <p className="add-child-kicker">Parent Dashboard</p>
            <h1 className="add-child-title">Add Child</h1>
            <p className="add-child-subtitle">
              Create a child profile, choose an avatar, and generate a kid access code.
            </p>
          </div>
        </section>

        <section className="add-child-card">
          <form onSubmit={handleSubmit} className="add-child-form">
            <div className="add-child-field">
              <label htmlFor="childName">Child name</label>
              <input
                id="childName"
                placeholder="Enter child name"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
            </div>

            <div className="add-child-field">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                placeholder="Enter age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div className="add-child-field">
              <label htmlFor="avatar">Choose avatar</label>
              <select
                id="avatar"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              >
                <option value="">Let child choose</option>
                <option value="bear">Bear</option>
                <option value="cat">Cat</option>
                <option value="fox">Fox</option>
                <option value="rabbit">Rabbit</option>
              </select>
            </div>

            <div className="add-child-field">
              <label htmlFor="pin">Temporary 4-digit PIN</label>
              <input
                id="pin"
                placeholder="1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
              />
            </div>

            <button type="submit" disabled={loading} className="add-child-primary-button">
              {loading ? "Creating..." : "Create Child Profile"}
            </button>
          </form>
        </section>

        {createdChild && (
          <section className="add-child-success-card">
            <p className="add-child-success-kicker">Child Created</p>
            <h3>{createdChild.name}</h3>
            <p>
              Access Code: <strong>{createdChild.accessCode}</strong>
            </p>
            <p>Use this code on the kid&apos;s device to join the parent account.</p>
          </section>
        )}

        <section className="add-child-footer">
          <button
            onClick={() => router.push("/parent/dashboard")}
            className="add-child-secondary-button"
          >
            Back to Dashboard
          </button>
        </section>
      </div>
    </main>
  );
}