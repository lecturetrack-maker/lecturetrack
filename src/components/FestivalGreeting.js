import { useState } from "react";

const GREETING_ID = "vijayadashami-2026";
// Stops showing automatically after Oct 21
const SHOW_UNTIL = new Date("2026-10-22T00:00:00");

export default function FestivalGreeting() {
  const [open, setOpen] = useState(() => {
    try {
      if (new Date() >= SHOW_UNTIL) return false;
      return localStorage.getItem("greeting_seen") !== GREETING_ID;
    } catch (e) {
      return true;
    }
  });

  const close = () => {
    try {
      localStorage.setItem("greeting_seen", GREETING_ID);
    } catch (e) {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", maxWidth: "92vw" }}
      >
        <button
          onClick={close}
          aria-label="Close"
          style={{
            position: "absolute",
            top: -14,
            right: -6,
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            background: "#fff",
            color: "#222",
            fontSize: 20,
            fontWeight: 700,
            lineHeight: "36px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
        <img
          src={process.env.PUBLIC_URL + "/vijayadashami.png"}
          alt="Vijayadashami greetings"
          style={{
            display: "block",
            maxWidth: "92vw",
            maxHeight: "82vh",
            borderRadius: 16,
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        />
      </div>
    </div>
  );
}
