"use client";

import { FormEvent, useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase-client";
import "./change-pin.css";

export default function KidChangePinPage() {
  const router = useRouter();
  const [childId, setChildId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedChildId = localStorage.getItem("kidChildId");

    if (!storedChildId) {
      router.push("/kid");
      return;
    }

    setChildId(storedChildId);
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!childId) return;

    if (!newPin.match(/^\d{4}$/)) {
      alert("PIN must be exactly 4 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      alert("PINs do not match.");
      return;
    }

    try {
      setLoading(true);

      await updateDoc(doc(db, "children", childId), {
        pin: newPin,
        mustChangePin: false,
      });

      router.push("/kid/dashboard");
    } catch (error) {
      console.error(error);
      alert("Could not update PIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="change-pin-page">
      <div className="change-pin-shell">
        <section className="change-pin-card">
          <p className="change-pin-kicker">First Login</p>

          <h1>Create your own PIN</h1>

          <form onSubmit={handleSubmit} className="change-pin-form">
            <input
              placeholder="New PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              maxLength={4}
            />

            <input
              placeholder="Confirm PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              maxLength={4}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save PIN"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}