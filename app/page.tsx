import Link from "next/link";
import ParentAuth from "@/components/ParentAuth";

export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>EarnNest</h1>
      <p>Financial literacy for kids, connected to real family habits.</p>

      <div style={{ marginTop: 24 }}>
        <h2>Parent</h2>
        <ParentAuth />
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>Kid</h2>
        <Link href="/kid">Join my parent&apos;s account</Link>
      </div>
    </main>
  );
}