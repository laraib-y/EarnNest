"use client";

import { FormEvent, useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase-client";
import "./finish-setup.css";

export default function KidFinishSetupPage() {
  const router = useRouter();
  const [childId, setChildId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const storedChildId = localStorage.getItem("kidChildId");

    if (!storedChildId) {
      router.push("/kid/join");
      return;
    }

    const loadChild = async () => {
      try {
        const childRef = doc(db, "children", storedChildId);
        const childSnap = await getDoc(childRef);

        if (!childSnap.exists()) {
          router.push("/kid/join");
          return;
        }

        const data = childSnap.data();

        if (!data.mustChangePin) {
          router.push("/kid/dashboard");
          return;
        }

        setChildId(storedChildId);
        setDisplayName(data.displayName || data.name || "");
      } catch (error) {
        console.error(error);
        router.push("/kid/join");
      } finally {
        setChecking(false);
      }
    };

    loadChild();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!childId) return;

    if (!username.trim()) {
      alert("Please choose a username.");
      return;
    }

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
        username: username.trim().toLowerCase(),
        displayName: displayName.trim() || username.trim(),
        pin: newPin,
        mustChangePin: false,
      });

      router.push("/kid/dashboard");
    } catch (error) {
      console.error(error);
      alert("Could not finish setup.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="finish-setup-page">
        <div className="finish-setup-shell">
          <p className="finish-setup-loading">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="finish-setup-page">
      <div className="finish-setup-shell">
        <section className="finish-setup-card">
          <p className="finish-setup-kicker">First Time Setup</p>
          <h1 className="finish-setup-title">Make it yours</h1>
          <p className="finish-setup-subtitle">
            Choose a cool username and your new PIN.
          </p>

          <form onSubmit={handleSubmit} className="finish-setup-form">
            <div className="finish-setup-field">
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                placeholder="Star Fox"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="finish-setup-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                placeholder="starfox"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="finish-setup-field">
              <label htmlFor="newPin">New 4-digit PIN</label>
              <input
                id="newPin"
                placeholder="1234"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength={4}
              />
            </div>

            <div className="finish-setup-field">
              <label htmlFor="confirmPin">Confirm PIN</label>
              <input
                id="confirmPin"
                placeholder="1234"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                maxLength={4}
              />
            </div>

            <button type="submit" disabled={loading} className="finish-setup-button">
              {loading ? "Saving..." : "Finish Setup"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}