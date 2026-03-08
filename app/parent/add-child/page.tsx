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
import Image from "next/image";
import type { Route } from "next";
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
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [createdChild, setCreatedChild] = useState<null | {
    name: string;
    accessCode: string;
  }>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/" as Route);
        return;
      }

      try {
        const parentRef = doc(db, "parents", user.uid);
        const parentSnap = await getDoc(parentRef);

        if (!parentSnap.exists()) {
          router.push("/parent/dashboard" as Route);
          return;
        }

        setParentUid(user.uid);
      } catch (error) {
        console.error(error);
        router.push("/parent/dashboard" as Route);
      } finally {
        setChecking(false);
      }
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

    if (!parentUid) {
      alert("Parent account not ready yet. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const trimmedName = childName.trim();
      const accessCode = generateAccessCode();

      await addDoc(collection(db, "children"), {
        parentUid,
        name: trimmedName,
        displayName: trimmedName,
        username: "",
        age: Number(age) || null,
        avatar: "bear",
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
        name: trimmedName,
        accessCode,
      });

      setChildName("");
      setAge("");
      setPin("");
    } catch (error) {
      console.error(error);
      alert("Failed to create child profile.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="add-child-page">
        <div className="add-child-shell">
          <p className="add-child-loading">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="add-child-page">
      <div className="add-child-shell">
        <section className="add-child-top">
          <p className="add-child-kicker">Parent Dashboard</p>
          <h1 className="add-child-title">Add Child</h1>
          <p className="add-child-subtitle">
            Create a child profile and generate a kid access code.
          </p>
        </section>

        <section className="add-child-form-card">
          <form onSubmit={handleSubmit} className="add-child-form">
            <div className="add-child-field">
              <label htmlFor="childName">Name</label>
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
                type="number"
                placeholder="Enter age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div className="add-child-field">
              <label htmlFor="pin">Temporary 4-digit PIN</label>
              <input
                id="pin"
                placeholder="1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                inputMode="numeric"
              />
            </div>

            <div className="add-child-button-row">
              <button
                type="submit"
                disabled={loading}
                className="add-child-primary-button"
              >
                <span className="add-child-plus">＋</span>
                {loading ? "Creating..." : "Add Child"}
              </button>
            </div>
          </form>
        </section>

        {createdChild ? (
          <section className="add-child-success-card">
            <p className="add-child-success-kicker">Child Created</p>
            <h3>{createdChild.name}</h3>
            <p>
              Access Code: <strong>{createdChild.accessCode}</strong>
            </p>
            <p>
              Use this code on the kid&apos;s device to join the parent account.
            </p>
          </section>
        ) : (
          <section className="add-child-empty-state">
            <p className="add-child-empty-title">No Account Added Yet...</p>

            <div className="add-child-bird">
              <Image
                src="/assets/Child_gray.svg"
                alt="Mascot"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>

            <p className="add-child-empty-subtitle">
              Add a child to get started!
            </p>
          </section>
        )}

        <section className="add-child-footer">
          <button
            type="button"
            onClick={() => router.push("/parent/dashboard" as Route)}
            className="add-child-secondary-button"
          >
            Back to Dashboard
          </button>
        </section>
      </div>
    </main>
  );
}