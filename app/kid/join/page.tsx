"use client";

import { FormEvent, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase-client";
import "./join.css";

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
        where("pin", "==", pin),
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        alert("Invalid access code or PIN.");
        return;
      }

      const childDoc = snap.docs[0];
      const childData = childDoc.data();

      localStorage.setItem("kidChildId", childDoc.id);

      if (childData.mustChangePin) {
        router.push("/kid/finish-setup");
      } else if (!childData.avatar) {
        router.push("/customization");
      } else {
        router.push("/kid/dashboard");
      }
    } catch (error) {
      console.error(error);
      alert("Could not join account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="kid-join-page">
      <div className="kid-join-shell">
        <section className="kid-join-card">
          <p className="kid-join-kicker">EarnNest</p>
          <h1 className="kid-join-title">First time here?</h1>
          <p className="kid-join-subtitle">
            Use your access code and temporary PIN from your parent.
          </p>

          <form onSubmit={handleJoin} className="kid-join-form">
            <div className="kid-join-field">
              <label htmlFor="accessCode">Access Code</label>
              <input
                id="accessCode"
                placeholder="ABC123"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              />
            </div>

            <div className="kid-join-field">
              <label htmlFor="pin">Temporary 4-digit PIN</label>
              <input
                id="pin"
                placeholder="1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="kid-join-button"
            >
              {loading ? "Joining..." : "Join Parent Account"}
            </button>
          </form>

          <div className="kid-join-divider" />

          <div className="kid-join-footer">
            <p>Already set up?</p>
            <Link href="/kid" className="kid-join-link">
              Log in with Username
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
