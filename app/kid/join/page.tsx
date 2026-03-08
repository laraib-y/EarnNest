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
        where("pin", "==", pin)
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

        <img src="/assets/Child.svg" alt="Child" className="kid-join-mascot" />

        <h2 className="welcome-font">Join Family</h2>
        <h3 className="login-font">
          Use your access code and temporary PIN!
        </h3>

        <form onSubmit={handleJoin} className="kid-join-form">
          <div className="kid-join-field">
            <label htmlFor="accessCode">Access Code</label>
            <input
              id="accessCode"
              placeholder="Enter family access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            />
          </div>

          <div className="kid-join-field">
            <label htmlFor="pin">Temporary PIN</label>
            <input
              id="pin"
              placeholder="Enter temporary PIN"
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
            {loading ? "Joining..." : "Join Family"}
          </button>
        </form>

        <div className="kid-join-footer">
          <p>Already set up?</p>
          <Link href="/kid" className="kid-join-link">
            Log in with Username
          </Link>
        </div>

      </div>
    </main>
  );
}