"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { db } from "@/lib/firebase-client";
import "./kid-dashboard.css";

type ChildProfile = {
  id: string;
  parentUid: string;
  name: string;
  displayName: string;
  avatar: string;
  coinBalance: number;
  streak: number;
  completedChores: number;
  modulesCompleted: string[];
};

type ChoreItem = {
  id: string;
  title: string;
  description: string;
  reward: number;
  frequency: string;
  status: string;
};

type CompletionItem = {
  id: string;
  choreId: string;
  status: "pending" | "approved" | "rejected";
  reward: number;
};

const avatars = [
  "assets/BearIcon.svg",
  "assets/CatIcon.svg",
  "assets/DogIcon.svg",
  "assets/SnakeIcon.svg",
  "assets/CapybaraIcon.svg",
  "assets/BunnyIcon.svg",
];

export default function KidDashboardPage() {
  const router = useRouter();

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);

  const getAvatarPath = (avatar: string) => {
    if (!avatar) return "/assets/BearIcon.svg";
    if (avatar.startsWith("assets/")) return `/${avatar}`;
    
    const avatarMap: { [key: string]: string } = {
      bear: "/assets/BearIcon.svg",
      cat: "/assets/CatIcon.svg",
      dog: "/assets/DogIcon.svg",
      snake: "/assets/SnakeIcon.svg",
      capybara: "/assets/CapybaraIcon.svg",
      bunny: "/assets/BunnyIcon.svg",
      fox: "/assets/DogIcon.svg",
      rabbit: "/assets/BunnyIcon.svg",
    };
    return avatarMap[avatar.toLowerCase()] || "/assets/BearIcon.svg";
  };

  const handleOpenCustomize = () => {
    setSelectedAvatar(child?.avatar || "");
    setIsCustomizing(true);
  };

  const handleSaveAvatar = async () => {
    if (!child || !selectedAvatar) return;

    try {
      setSavingAvatar(true);
      await updateDoc(doc(db, "children", child.id), {
        avatar: selectedAvatar,
      });

      setChild({ ...child, avatar: selectedAvatar });
      setIsCustomizing(false);
    } catch (error) {
      console.error(error);
      alert("Could not update avatar.");
    } finally {
      setSavingAvatar(false);
    }
  };

  const latestCompletionByChore = useMemo(() => {
    const map = new Map<string, CompletionItem>();
    for (const completion of completions) {
      map.set(completion.choreId, completion);
    }
    return map;
  }, [completions]);

  useEffect(() => {
    const storedChildId = localStorage.getItem("kidChildId");

    if (!storedChildId) {
      router.push("/kid" as Route);
      return;
    }

    const loadData = async (childId: string) => {
      try {
        const childRef = doc(db, "children", childId);
        const childSnap = await getDoc(childRef);

        if (!childSnap.exists()) {
          router.push("/kid" as Route);
          return;
        }

        const childData = childSnap.data();

        const childProfile: ChildProfile = {
          id: childSnap.id,
          parentUid: childData.parentUid || "",
          name: childData.name || "",
          displayName: childData.displayName || childData.name || "",
          avatar: childData.avatar || "",
          coinBalance: Number(childData.coinBalance || 0),
          streak: Number(childData.streak || 0),
          completedChores: Number(childData.completedChores || 0),
          modulesCompleted: Array.isArray(childData.modulesCompleted)
            ? childData.modulesCompleted
            : [],
        };

        const choreSnap = await getDocs(
          query(collection(db, "chores"), where("childId", "==", childId))
        );

        const choreList: ChoreItem[] = choreSnap.docs
          .map((choreDoc) => {
            const data = choreDoc.data();
            return {
              id: choreDoc.id,
              title: data.title || "",
              description: data.description || "",
              reward: Number(data.reward || 0),
              frequency: data.frequency || "one-time",
              status: data.status || "active",
            };
          })
          .filter((chore) => chore.status === "active");

        const completionSnap = await getDocs(
          query(collection(db, "completions"), where("childId", "==", childId))
        );

        const completionList: CompletionItem[] = completionSnap.docs.map((completionDoc) => {
          const data = completionDoc.data();
          return {
            id: completionDoc.id,
            choreId: data.choreId || "",
            status: data.status || "pending",
            reward: Number(data.reward || 0),
          };
        });

        setChild(childProfile);
        setChores(choreList);
        setCompletions(completionList);
      } catch (error) {
        console.error(error);
        router.push("/kid" as Route);
      } finally {
        setLoading(false);
      }
    };

    loadData(storedChildId);
  }, [router]);

  const handleMarkDone = async (chore: ChoreItem) => {
    if (!child) return;

    const existing = latestCompletionByChore.get(chore.id);

    if (existing?.status === "pending") {
      alert("This chore is already waiting for parent approval.");
      return;
    }

    try {
      setActionLoadingId(chore.id);

      await addDoc(collection(db, "completions"), {
        parentUid: child.parentUid,
        childId: child.id,
        choreId: chore.id,
        choreTitle: chore.title,
        reward: chore.reward,
        status: "pending",
        completedAt: serverTimestamp(),
        reviewedAt: null,
      });

      setCompletions((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          choreId: chore.id,
          status: "pending",
          reward: chore.reward,
        },
      ]);

      alert("Nice work! Ask your parent to approve your chore.");
    } catch (error) {
      console.error(error);
      alert("Could not mark chore as done.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <main className="kid-dashboard-page">
        <div className="kid-dashboard-shell">
          <p className="kid-dashboard-loading">Loading kid dashboard...</p>
        </div>
      </main>
    );
  }

  if (!child) return null;

  return (
    <main className="kid-dashboard-page">
      <div className="kid-dashboard-shell">
        <section className="kid-dashboard-hero">
          <div>
            <p className="kid-dashboard-kicker">Kid Dashboard</p>
            <h1 className="kid-dashboard-title">
              Hi, {child.displayName || child.name}!
            </h1>
            <p className="kid-dashboard-subtitle">
              Finish chores, earn coins, and grow your money skills.
            </p>
          </div>

          <div style={{ position: "relative", display: "inline-block" }}>
            <div className="kid-avatar-badge">
              <img
                src={getAvatarPath(child.avatar)}
                alt="Your avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/BearIcon.svg";
                }}
              />
            </div>
            <button
              onClick={handleOpenCustomize}
              className="kid-avatar-customize-btn"
              title="Customize"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span className="kid-avatar-customize-text">Customize</span>
            </button>
          </div>
        </section>

        <section className="kid-stats-grid">
          <article className="kid-stat-card">
            <p className="kid-stat-label">Coins</p>
            <h2>{child.coinBalance}</h2>
          </article>

          <article className="kid-stat-card">
            <p className="kid-stat-label">Streak</p>
            <h2>{child.streak}</h2>
          </article>

          <article className="kid-stat-card">
            <p className="kid-stat-label">Completed</p>
            <h2>{child.completedChores}</h2>
          </article>
        </section>

        <section className="kid-dashboard-section">
          <div className="kid-section-header">
            <h2>Learning Modules</h2>
            <span>Build your money skills</span>
          </div>

          <div className="kid-modules-grid">
            <article className="kid-module-card">
              <div className="kid-module-top">
                <div>
                  <p className="kid-module-tag">Module 1</p>
                  <h3>Needs vs Wants</h3>
                </div>
                <span className="kid-module-status">
                  {child.modulesCompleted.includes("module-1") ? "Completed" : "Ready"}
                </span>
              </div>

              <p className="kid-module-description">
                Learn the difference between things you need and things you want.
              </p>

              <button
                className="kid-primary-button"
                onClick={() => router.push("/kid/modules/module-1" as Route)}
              >
                {child.modulesCompleted.includes("module-1")
                  ? "Play Again"
                  : "Start Module 1"}
              </button>
            </article>

            <article className="kid-module-card">
              <div className="kid-module-top">
                <div>
                  <p className="kid-module-tag">Module 2</p>
                  <h3>Saving & Budgeting</h3>
                </div>
                <span className="kid-module-status">
                  {child.modulesCompleted.includes("module-2") ? "Completed" : "Ready"}
                </span>
              </div>

              <p className="kid-module-description">
                Practice saving coins and making smart budgeting choices to reach a goal.
              </p>

              <button
                className="kid-primary-button"
                onClick={() => router.push("/kid/modules/module-2" as Route)}
              >
                {child.modulesCompleted.includes("module-2")
                  ? "Play Again"
                  : "Start Module 2"}
              </button>
            </article>
          </div>
        </section>

        <section className="kid-dashboard-section">
          <div className="kid-section-header">
            <h2>Your Chores</h2>
            <span>{chores.length} task{chores.length === 1 ? "" : "s"}</span>
          </div>

          {chores.length === 0 ? (
            <div className="kid-empty-card">
              <p>No chores assigned yet.</p>
            </div>
          ) : (
            <div className="kid-chores-grid">
              {chores.map((chore) => {
                const completion = latestCompletionByChore.get(chore.id);

                return (
                  <article key={chore.id} className="kid-chore-card">
                    <div className="kid-chore-top">
                      <h3>{chore.title}</h3>
                      <span className="kid-reward-pill">{chore.reward} coins</span>
                    </div>

                    {chore.description ? (
                      <p className="kid-chore-description">{chore.description}</p>
                    ) : null}

                    <p className="kid-chore-frequency">Frequency: {chore.frequency}</p>

                    {completion?.status === "pending" && (
                      <p className="kid-status kid-status-pending">
                        Waiting for parent approval
                      </p>
                    )}

                    {completion?.status === "approved" && (
                      <p className="kid-status kid-status-approved">Approved ✅</p>
                    )}

                    {completion?.status === "rejected" && (
                      <p className="kid-status kid-status-rejected">
                        Rejected — you can try again
                      </p>
                    )}

                    {(completion?.status === undefined || completion?.status === "rejected") && (
                      <button
                        onClick={() => handleMarkDone(chore)}
                        disabled={actionLoadingId === chore.id}
                        className="kid-primary-button"
                      >
                        {actionLoadingId === chore.id ? "Submitting..." : "Mark as Done"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {isCustomizing && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "24px",
            }}
            onClick={() => !savingAvatar && setIsCustomizing(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "40px 24px",
                maxWidth: "390px",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: 20 }}>Pick your avatar</h2>

              <div
                style={{
                  width: 180,
                  height: 180,
                  marginBottom: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={getAvatarPath(selectedAvatar)}
                  alt="Selected avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/BearIcon.svg";
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 20,
                  marginBottom: 40,
                  width: "100%",
                }}
              >
                {avatars.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      border:
                        selectedAvatar === avatar
                          ? "3px solid #f1642e"
                          : "3px solid transparent",
                      background: "#ddd",
                      overflow: "hidden",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <img
                      src={`/${avatar}`}
                      alt="Avatar option"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </button>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  width: "100%",
                }}
              >
                <button
                  onClick={() => setIsCustomizing(false)}
                  disabled={savingAvatar}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid #ccc",
                    background: "white",
                    color: "#333",
                    fontWeight: 600,
                    cursor: savingAvatar ? "not-allowed" : "pointer",
                    opacity: savingAvatar ? 0.7 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAvatar}
                  disabled={savingAvatar}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 12,
                    border: "none",
                    background: "#f1642e",
                    color: "white",
                    fontWeight: 600,
                    cursor: savingAvatar ? "not-allowed" : "pointer",
                    opacity: savingAvatar ? 0.7 : 1,
                  }}
                >
                  {savingAvatar ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}