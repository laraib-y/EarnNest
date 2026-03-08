"use client";

import "./customizationPage.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

const avatars = [
  "assets/BearIcon.svg",
  "assets/CatIcon.svg",
  "assets/DogIcon.svg",
  "assets/SnakeIcon.svg",
  "assets/CapybaraIcon.svg",
  "assets/BunnyIcon.svg",
];

export default function CustomizationPage() {
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState("assets/BearIcon.svg");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const childId = localStorage.getItem("kidChildId");
    if (!childId) {
      router.push("/kid/join");
    }
  }, [router]);

  const handleContinue = async () => {
    const childId = localStorage.getItem("kidChildId");
    if (!childId) {
      alert("Child ID not found. Please join an account first.");
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, "children", childId), {
        avatar: selectedAvatar,
      });

      localStorage.setItem("kidAvatar", selectedAvatar);
      router.push("/kid/dashboard");
    } catch (error) {
      console.error(error);
      alert("Could not save avatar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f6f3",
        display: "flex",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "390px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h2 style={{ marginBottom: 20 }}>Pick your avatar</h2>

        {/* Preview */}
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
            src={selectedAvatar}
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

        {/* Avatar grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            marginBottom: 40,
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
              }}
            >
              <img
                src={avatar}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={loading}
          style={{
            width: "100%",
            maxWidth: 240,
            height: 48,
            borderRadius: 12,
            border: "none",
            background: "#f1642e",
            color: "white",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Saving..." : "Ready!"}
        </button>
      </div>
    </main>
  );
}
