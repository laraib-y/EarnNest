"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import type { Route } from "next";
import { auth, db } from "@/lib/firebase-client";

type ChildInfo = {
  id: string;
  displayName: string;
  parentUid: string;
};

export default function AssignChorePage() {
  const params = useParams<{ childId: string }>();
  const router = useRouter();

  const rawChildId = params?.childId;
  const childId = Array.isArray(rawChildId) ? rawChildId[0] : rawChildId;

  const [parentUid, setParentUid] = useState("");
  const [child, setChild] = useState<ChildInfo | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("20");
  const [frequency, setFrequency] = useState("one-time");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/" as Route);
        return;
      }

      try {
        const childRef = doc(db, "children", childId);
        const childSnap = await getDoc(childRef);

        if (!childSnap.exists()) {
          alert("Child not found.");
          router.push("/parent/dashboard" as Route);
          return;
        }

        const childData = childSnap.data();

        if (childData.parentUid !== user.uid) {
          alert("You do not have access to this child.");
          router.push("/parent/dashboard" as Route);
          return;
        }

        if (!cancelled) {
          setParentUid(user.uid);
          setChild({
            id: childSnap.id,
            displayName: childData.displayName || childData.name || "Child",
            parentUid: childData.parentUid,
          });
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [childId, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!childId) {
      alert("Missing child ID.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a task title.");
      return;
    }

    const numericReward = Number(reward);

    if (!Number.isFinite(numericReward) || numericReward <= 0) {
      alert("Please enter a valid coin reward.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "chores"), {
        parentUid,
        childId,
        title: title.trim(),
        description: description.trim(),
        reward: numericReward,
        frequency,
        status: "active",
        createdAt: serverTimestamp(),
      });

      router.push("/parent/dashboard" as Route);
    } catch (error) {
      console.error(error);
      alert("Failed to create task.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>
          <p style={smallTextStyle}>Loading...</p>
        </div>
      </main>
    );
  }

  if (!childId) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>
          <p style={smallTextStyle}>Missing child route parameter.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <h1 style={titleStyle}>Assign Task</h1>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldStyle}>
            <label htmlFor="title" style={labelStyle}>
              Task
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="reward" style={labelStyle}>
              Coin amount
            </label>
            <input
              id="reward"
              type="number"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="description" style={labelStyle}>
              Details/Instructions
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={textareaStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="frequency" style={labelStyle}>
              Frequency
            </label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              style={inputStyle}
            >
              <option value="one-time">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <button type="submit" disabled={saving} style={buttonStyle}>
            <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>＋</span>
            {saving ? "Adding..." : "Add Task"}
          </button>
        </form>

        <p style={childTextStyle}>Assigning to: {child?.displayName || "Child"}</p>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f4f4f4",
  padding: "24px 12px",
  fontFamily: '"Rubik", sans-serif',
};

const shellStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "390px",
  margin: "0 auto",
  background: "#f9f9f9",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 8px 24px rgba(66, 59, 73, 0.10)",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "2rem",
  lineHeight: 1.05,
  color: "#111111",
  textAlign: "center",
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: "14px",
  marginTop: "10px",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#242424",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "38px",
  border: "1px solid #d8d8d8",
  background: "#f2f2f2",
  borderRadius: "8px",
  padding: "0 10px",
  fontSize: "1rem",
  color: "#1f1f1f",
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d8d8d8",
  background: "#f2f2f2",
  borderRadius: "8px",
  padding: "10px",
  fontSize: "1rem",
  color: "#1f1f1f",
  outline: "none",
  boxSizing: "border-box",
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "4px",
  minHeight: "44px",
  border: "none",
  borderRadius: "10px",
  background: "#686491",
  color: "#ffffff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontFamily: '"Rubik", sans-serif',
  fontSize: "1rem",
  fontWeight: 500,
  cursor: "pointer",
};

const childTextStyle: React.CSSProperties = {
  margin: "14px 0 0",
  fontSize: "0.9rem",
  color: "#666666",
};

const smallTextStyle: React.CSSProperties = {
  fontSize: "1rem",
  color: "#666666",
};