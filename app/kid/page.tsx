"use client";

import { FormEvent, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase-client";
import "./kid-join.css";

export default function KidJoinPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const q = query(
        collection(db, "children"),
        where("accessCode", "==", accessCode.toUpperCase()),
        where("pin", "==", pin)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        alert("Invalid access code or PIN.");
        return;
      }

      const childDoc = snap.docs[0];
      localStorage.setItem("kidChildId", childDoc.id);
      router.push("/kid/dashboard");
    } catch (error) {
      console.error(error);
      alert("Could not log in child.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="kid-join-page">
      <div className="kid-join-shell">
        <section className="kid-join-card">
          <p className="kid-join-kicker">EarnNest</p>
          <h1 className="kid-join-title">Kid Login</h1>
          <p className="kid-join-subtitle">Join your parent&apos;s account and start earning coins.</p>

          <form onSubmit={handleJoin} className="kid-join-form">
            <div className="kid-join-field">
              <label htmlFor="accessCode">Access code</label>
              <input
                id="accessCode"
                placeholder="XRG457"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              />
            </div>

            <div className="kid-join-field">
              <label htmlFor="pin">4-digit PIN</label>
              <input
                id="pin"
                placeholder="1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
              />
            </div>

            <button type="submit" disabled={loading} className="kid-join-button">
              {loading ? "Joining..." : "Join Parent Account"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}