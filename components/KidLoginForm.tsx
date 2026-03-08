"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
export function KidLoginForm() {
  const [accessCode, setAccessCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await apiFetch("/api/kid/login", {
        method: "POST",
        body: JSON.stringify({ accessCode, pin }),
      });
      window.location.href = "/Customization";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kid sign-in failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handle} className="card stack">
      <h2>Join my parent&apos;s account</h2>
      <div>
        <label className="label">Kid access code</label>
        <input
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
          placeholder="XRG457"
        />
      </div>
      <div>
        <label className="label">4-digit PIN</label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="1234"
          maxLength={4}
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Connecting..." : "Continue"}
      </button>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </form>
  );
}
