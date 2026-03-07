"use client";

import { FormEvent, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase-client";

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
    <main style={{ padding: 40, maxWidth: 420 }}>
      <h1>Kid Login</h1>
      <p>Join your parent&apos;s account.</p>

      <form onSubmit={handleJoin} style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <input
          placeholder="Access code"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
        />
        <input
          placeholder="4-digit PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={4}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Joining..." : "Join Parent Account"}
        </button>
      </form>
    </main>
  );
}