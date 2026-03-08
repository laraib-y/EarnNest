"use client";

import { useEffect, useState } from "react";
import { signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { auth, googleProvider } from "@/lib/firebase-client";

type ParentAuthProps = {
  className?: string;
  children?: React.ReactNode;
};

export default function ParentAuth({ className, children }: ParentAuthProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        router.push("/parent/dashboard" as Route);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const signIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      router.push("/parent/dashboard" as Route);
    } catch (error: any) {
      console.error("Firebase sign-in error:", error.code, error.message);
      alert(error.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={signIn} disabled={loading} className={className}>
      {children ? (
        children
      ) : (
        <span>{loading ? "SIGNING IN..." : "PARENT"}</span>
      )}
    </button>
  );
}