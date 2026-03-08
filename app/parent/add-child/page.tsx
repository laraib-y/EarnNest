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
        avatar: "bird",
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
        <section className="add-child-top">
          <h1 className="add-child-title">Add your child</h1>
        </section>

        <section className="add-child-form-card">
          <form onSubmit={handleSubmit} className="add-child-form">
            <div className="add-child-field">
              <label htmlFor="childName">Name</label>
              <input
                id="childName"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
            </div>

            <div className="add-child-field">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div className="add-child-field">
              <label htmlFor="pin">Pin</label>
              <input
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                inputMode="numeric"
              />
            </div>

            <div className="add-child-button-row">
              <button type="submit" disabled={loading} className="add-child-primary-button">
                <span className="add-child-plus">＋</span>
                {loading ? "Adding..." : "Add Child"}
              </button>
            </div>
          </form>
        </section>

        <section className="add-child-empty-state">
          {createdChild ? (
            <>
              <p className="add-child-empty-title">
                {createdChild.name} added successfully!
              </p>
              <div className="add-child-access-code">
                Access code: <strong>{createdChild.accessCode}</strong>
              </div>
              <p className="add-child-empty-subtitle">
                Use this code on the child&apos;s device to join the account.
              </p>
            </>
          ) : (
            <>
              <p className="add-child-empty-title">No Account Added Yet...</p>

              <div className="add-child-bird">
                <Image
                  src="/assets/Parent.svg"
                  alt="Bird"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>

              <p className="add-child-empty-subtitle">Add child to get started!</p>
            </>
          )}
        </section>

        <section className="add-child-pager" aria-label="carousel navigation">
          <button
            type="button"
            className="add-child-arrow"
            onClick={() => router.push("/parent/dashboard")}
            aria-label="Back to dashboard"
          >
            ‹
          </button>

          <div className="add-child-dots">
            <span className="add-child-dot active" />
            <span className="add-child-dot" />
            <span className="add-child-dot" />
          </div>

          <button
            type="button"
            className="add-child-arrow"
            onClick={() => router.push("/parent/dashboard")}
            aria-label="Next"
          >
            ›
          </button>
        </section>
      </div>
    </main>
  );
}