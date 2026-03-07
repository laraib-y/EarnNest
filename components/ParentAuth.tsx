"use client";

import { useEffect, useState } from "react";
import { signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase-client";

export default function ParentAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        router.push("/parent/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const signIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      router.push("/parent/dashboard");
    } catch (error: any) {
      console.error("Firebase sign-in error:", error.code, error.message);
      alert(error.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={signIn}
      disabled={loading}
      style={{
        padding: "12px 20px",
        background: "#4285F4",
        color: "white",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "Signing in..." : "Sign in with Google"}
    </button>
  );
}