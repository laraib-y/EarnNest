"use client";

import { FormEvent, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase-client";
import "./kid-login.css";

export default function KidLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const q = query(
        collection(db, "children"),
        where("username", "==", username.trim().toLowerCase()),
        where("pin", "==", pin)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        alert("Invalid username or PIN.");
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
    <main className="kid-login-page">
      <div className="kid-login-shell">
        <img src="/assets/Child.svg" alt="Child" className="kid-login-mascot" />
        <h2 className = "welcome-font">Welcome!</h2>
        <h3 className = "login-font">Log in with your username and pin!</h3>
        <form onSubmit={handleLogin} className="kid-login-form">
          <div className="kid-login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="kid-login-field">
            <label htmlFor="pin">Pin</label>
            <input
              id="pin"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
            />
          </div>

          <button type="submit" disabled={loading} className="kid-login-button">
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="kid-login-footer">
          <p>New here?</p>
          <Link href="/kid/join" className="kid-login-link">
            Use Access Code
          </Link>
        </div>
      </div>
    </main>
  );
}