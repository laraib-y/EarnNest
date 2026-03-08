"use client";

import { useState } from "react";
import { signInWithPopup, User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { auth, db, googleProvider } from "@/lib/firebase-client";

type ParentAuthProps = {
  className?: string;
  children?: React.ReactNode;
};

async function getParentDestination(user: User): Promise<Route> {
  const childSnap = await getDocs(
    query(collection(db, "children"), where("parentUid", "==", user.uid))
  );

  return childSnap.empty
    ? ("/parent/add-child" as Route)
    : ("/parent/dashboard" as Route);
}

export default function ParentAuth({ className, children }: ParentAuthProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleParentClick = async () => {
    try {
      setLoading(true);

      const existingUser = auth.currentUser;

      if (existingUser) {
        const destination = await getParentDestination(existingUser);
        router.push(destination);
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const destination = await getParentDestination(result.user);
      router.push(destination);
    } catch (error: any) {
      console.error("Firebase sign-in error:", error?.code, error?.message);
      alert(error?.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleParentClick}
      disabled={loading}
      className={className}
    >
      {children ? children : <span>{loading ? "SIGNING IN..." : "PARENT"}</span>}
    </button>
  );
}