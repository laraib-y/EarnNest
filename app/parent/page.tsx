import ParentAuth from "@/components/ParentAuth";

export default function ParentPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f5ede3",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          display: "grid",
          gap: "16px",
          textAlign: "center",
          fontFamily: '"Rubik", sans-serif',
        }}
      >
        <h1 style={{ margin: 0, color: "#423B49" }}>Parent Sign In</h1>
        <ParentAuth
          className="parent-entry-button"
        >
          <span
            style={{
              minHeight: "52px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              background: "#fefffc",
              borderRadius: "16px",
              borderBottom: "6px solid #504e76",
              color: "#111111",
              fontWeight: 700,
            }}
          >
            PARENT
          </span>
        </ParentAuth>
      </div>
    </main>
  );
}