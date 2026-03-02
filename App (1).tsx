import { useState, useEffect, useRef, useCallback } from "react";

// ── Supabase Config ───────────────────────────────────────────────
const SUPABASE_URL = "https://ddfmkfkvvadzlihiulnj.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZm1rZmt2dmFkemxpaGl1bG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MzUwOTEsImV4cCI6MjA4ODAxMTA5MX0.2SsoVouiV4_U57-yEMU3e0OBQLWcbcLTYh1_3878KiM";

const db = {
  async load(teacherCode) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/chapters?teacher_code=eq.${encodeURIComponent(
        teacherCode
      )}&order=created_at`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.map((r) => ({
      id: r.id,
      batchCode: r.batch_code,
      name: r.name,
      totalHours: r.total_hours,
      completedHours: r.completed_hours,
      extraHours: r.extra_hours,
      topics: r.topics || [],
      notes: r.notes || "",
      lastCompletedTopic: r.last_completed_topic,
    }));
  },
  async upsert(teacherCode, chapter) {
    const body = {
      id: chapter.id,
      teacher_code: teacherCode,
      batch_code: chapter.batchCode,
      name: chapter.name,
      total_hours: chapter.totalHours,
      completed_hours: chapter.completedHours,
      extra_hours: chapter.extraHours || 0,
      topics: chapter.topics || [],
      notes: chapter.notes || "",
      last_completed_topic: chapter.lastCompletedTopic || null,
      updated_at: new Date().toISOString(),
    };
    await fetch(`${SUPABASE_URL}/rest/v1/chapters`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(body),
    });
  },
  async remove(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/chapters?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
  },
};

// ── Helpers ───────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function getStatus(completed, total) {
  if (!total) return "none";
  const p = (completed / total) * 100;
  if (p > 100) return "exceeded";
  if (p >= 80) return "warning";
  return "ok";
}

const STATUS = {
  ok: { color: "#10b981", label: "On Track" },
  warning: { color: "#f59e0b", label: "Near Limit" },
  exceeded: { color: "#ef4444", label: "Exceeded" },
  none: { color: "#94a3b8", label: "Not Started" },
};

const BATCH_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

function buildCSV(chapters) {
  const rows = [
    [
      "Batch",
      "Chapter",
      "Allotted Hours",
      "Taken Hours",
      "Extra Hours",
      "Remaining Hours",
      "Progress %",
    ],
  ];
  chapters.forEach((c) => {
    const rem = Math.max(0, c.totalHours - c.completedHours).toFixed(1);
    const pct =
      c.totalHours > 0
        ? ((c.completedHours / c.totalHours) * 100).toFixed(1) + "%"
        : "0%";
    rows.push([
      c.batchCode,
      c.name,
      c.totalHours,
      c.completedHours,
      c.extraHours || 0,
      rem,
      pct,
    ]);
  });
  return rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
}

// ── UI Components ─────────────────────────────────────────────────
function PBar({ pct }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.25)",
        borderRadius: 99,
        height: 7,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(pct, 100)}%`,
          height: "100%",
          background: "#fff",
          borderRadius: 99,
          transition: "width .6s",
        }}
      />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.55)",
        backdropFilter: "blur(4px)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 26,
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            {title}
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: 99,
                width: 32,
                height: 32,
                cursor: "pointer",
                fontSize: 18,
                color: "#64748b",
              }}
            >
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function TInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "#475569",
            marginBottom: 5,
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        style={{
          width: "100%",
          padding: "10px 14px",
          border: "1.5px solid #e2e8f0",
          borderRadius: 12,
          fontSize: 15,
          fontFamily: "inherit",
          outline: "none",
          background: "#f8fafc",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,.05)",
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function SyncBadge({ status }) {
  const cfg =
    {
      saving: { bg: "#eef2ff", color: "#6366f1", text: "⏳ Saving..." },
      saved: { bg: "#dcfce7", color: "#16a34a", text: "☁️ Saved to Cloud" },
      error: { bg: "#fee2e2", color: "#dc2626", text: "❌ Save failed" },
      offline: {
        bg: "#fef9c3",
        color: "#92400e",
        text: "📶 Offline — saved locally",
      },
    }[status] || null;
  if (!cfg) return null;
  return (
    <div
      style={{
        background: cfg.bg,
        color: cfg.color,
        fontSize: 12,
        fontWeight: 700,
        padding: "4px 12px",
        borderRadius: 99,
        display: "inline-block",
        marginBottom: 10,
      }}
    >
      {cfg.text}
    </div>
  );
}

// ── Onboarding ────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [gender, setGender] = useState("male");
  const [loading, setLoading] = useState(false);
  const sal = gender === "male" ? "Sir" : "Ma'am";
  const h = new Date().getHours();
  const gw =
    h < 12
      ? "Good Morning ☀️"
      : h < 17
      ? "Good Afternoon 🌤️"
      : "Good Evening 🌙";

  const handleStart = async () => {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    onDone({ name: name.trim(), code: code.trim().toUpperCase(), gender });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#6366f1,#4338ca)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: 32,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 24px 60px rgba(0,0,0,.2)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>👨‍🏫</div>
          <h2
            style={{
              margin: "10px 0 4px",
              fontSize: 24,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            LectureTrack
          </h2>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
            Physics · NEET / JEE
          </p>
          <div
            style={{
              marginTop: 8,
              background: "#dcfce7",
              borderRadius: 99,
              padding: "4px 14px",
              display: "inline-block",
              fontSize: 12,
              color: "#16a34a",
              fontWeight: 700,
            }}
          >
            ☁️ Cloud Powered — Data Never Lost
          </div>
        </div>
        <TInput
          label="Your Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. P M Krishna"
        />
        <TInput
          label="Short Code (used to identify your data)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. PMK"
        />
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
              marginBottom: 6,
            }}
          >
            Gender
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {["male", "female"].map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 12,
                  border: `2px solid ${gender === g ? "#6366f1" : "#e2e8f0"}`,
                  background: gender === g ? "#eef2ff" : "#f8fafc",
                  fontWeight: 700,
                  cursor: "pointer",
                  color: gender === g ? "#6366f1" : "#64748b",
                  fontFamily: "inherit",
                  fontSize: 13,
                }}
              >
                {g === "male" ? "👨 Male" : "👩 Female"}
              </button>
            ))}
          </div>
        </div>
        {name && code && (
          <div
            style={{
              background: "#eef2ff",
              borderRadius: 12,
              padding: "11px 14px",
              marginBottom: 16,
              fontSize: 14,
              color: "#4f46e5",
              fontWeight: 700,
            }}
          >
            {gw}, {code} {sal}!
          </div>
        )}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 12,
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          💡 Your data is saved to the cloud using your Short Code. Use the same
          code on any device to access your data.
        </div>
        <button
          onClick={handleStart}
          disabled={loading}
          style={{
            width: "100%",
            padding: 13,
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Loading your data..." : "Get Started →"}
        </button>
      </div>
    </div>
  );
}

// ── Chapter Form ──────────────────────────────────────────────────
function ChapterFormModal({ chapter, onSave, onClose }) {
  const [name, setName] = useState(chapter?.name || "");
  const [batch, setBatch] = useState(chapter?.batchCode || "");
  const [hours, setHours] = useState(chapter?.totalHours || "");
  return (
    <Modal title={chapter ? "Edit Chapter" : "Add Chapter"} onClose={onClose}>
      <TInput
        label="Batch Code"
        value={batch}
        onChange={(e) => setBatch(e.target.value.toUpperCase())}
        placeholder="e.g. X1, R2, A3"
      />
      <TInput
        label="Chapter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Rotational Motion"
      />
      <TInput
        label="Total Allotted Hours"
        type="number"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        placeholder="e.g. 12"
        min={0}
      />
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          marginTop: 6,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "#f1f5f9",
            color: "#475569",
            border: "none",
            borderRadius: 12,
            padding: "10px 20px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (name.trim() && batch.trim() && hours)
              onSave({
                name: name.trim(),
                batchCode: batch.trim().toUpperCase(),
                totalHours: parseFloat(hours),
              });
          }}
          style={{
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "10px 20px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

// ── Export Modal ──────────────────────────────────────────────────
function ExportModal({ chapters, onClose }) {
  const csv = buildCSV(chapters);
  const [copied, setCopied] = useState(false);
  return (
    <Modal title="📊 Export Data" onClose={onClose}>
      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          border: "1.5px solid #e2e8f0",
          marginBottom: 16,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 11,
            fontFamily: "inherit",
            minWidth: 400,
          }}
        >
          <thead>
            <tr style={{ background: "#6366f1", color: "#fff" }}>
              {[
                "Batch",
                "Chapter",
                "Allotted",
                "Taken",
                "Extra",
                "Remaining",
                "Progress%",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chapters.map((c, i) => {
              const rem = Math.max(0, c.totalHours - c.completedHours).toFixed(
                1
              );
              const pct =
                c.totalHours > 0
                  ? ((c.completedHours / c.totalHours) * 100).toFixed(0) + "%"
                  : "0%";
              return (
                <tr
                  key={c.id}
                  style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}
                >
                  <td
                    style={{
                      padding: "7px 8px",
                      fontWeight: 800,
                      color: "#6366f1",
                    }}
                  >
                    {c.batchCode}
                  </td>
                  <td style={{ padding: "7px 8px" }}>{c.name}</td>
                  <td style={{ padding: "7px 8px" }}>{c.totalHours}h</td>
                  <td
                    style={{
                      padding: "7px 8px",
                      color: "#10b981",
                      fontWeight: 700,
                    }}
                  >
                    {c.completedHours}h
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      color: "#f59e0b",
                      fontWeight: 700,
                    }}
                  >
                    {c.extraHours || 0}h
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      color: "#ef4444",
                      fontWeight: 700,
                    }}
                  >
                    {rem}h
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      color: "#6366f1",
                      fontWeight: 700,
                    }}
                  >
                    {pct}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
            a.download = `LectureTrack_${new Date()
              .toLocaleDateString("en-IN")
              .replace(/\//g, "-")}.csv`;
            a.click();
          }}
          style={{
            padding: 12,
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ⬇️ Download CSV for Google Drive
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(csv);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{
            padding: 12,
            background: "#f1f5f9",
            color: "#475569",
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {copied ? "✅ Copied!" : "📋 Copy to Clipboard"}
        </button>
      </div>
      <div
        style={{
          marginTop: 14,
          background: "#f0fdf4",
          borderRadius: 12,
          padding: "12px 14px",
          fontSize: 13,
          color: "#166534",
          lineHeight: 1.8,
        }}
      >
        <strong>Note:</strong> Your data is already safely stored in the cloud!
        This export is for sharing with your institution or keeping a local
        backup.
      </div>
    </Modal>
  );
}

// ── Chapter Card ──────────────────────────────────────────────────
function ChapterCard({ chapter, color, onClick, onEdit, onDelete }) {
  const pct =
    chapter.totalHours > 0
      ? (chapter.completedHours / chapter.totalHours) * 100
      : 0;
  const remaining = Math.max(0, chapter.totalHours - chapter.completedHours);
  const status = getStatus(chapter.completedHours, chapter.totalHours);
  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg,${color},${color}cc)`,
        borderRadius: 18,
        padding: 20,
        color: "#fff",
        cursor: "pointer",
        boxShadow: `0 4px 20px ${color}44`,
        transition: "transform .2s,box-shadow .2s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 10px 32px ${color}66`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = `0 4px 20px ${color}44`;
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -20,
          top: -20,
          width: 100,
          height: 100,
          background: "rgba(255,255,255,.08)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: "-.5px",
            lineHeight: 1,
          }}
        >
          {chapter.batchCode}
        </div>
        <div
          style={{ display: "flex", gap: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            style={{
              background: "rgba(255,255,255,.2)",
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            style={{
              background: "rgba(255,255,255,.2)",
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🗑️
          </button>
        </div>
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 14,
          opacity: 0.95,
        }}
      >
        {chapter.name}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Allotted", val: chapter.totalHours + "h" },
          { label: "Taken", val: chapter.completedHours + "h" },
          { label: "Extra", val: (chapter.extraHours || 0) + "h" },
          { label: "Remaining", val: remaining + "h" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: "rgba(255,255,255,.18)",
              borderRadius: 10,
              padding: "7px 4px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800 }}>{s.val}</div>
            <div
              style={{
                fontSize: 9,
                opacity: 0.8,
                fontWeight: 600,
                marginTop: 1,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <PBar pct={pct} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontSize: 12,
          opacity: 0.9,
        }}
      >
        <span style={{ fontWeight: 700 }}>{pct.toFixed(0)}% complete</span>
        <span
          style={{
            background: "rgba(255,255,255,.2)",
            padding: "1px 8px",
            borderRadius: 99,
            fontWeight: 700,
          }}
        >
          {STATUS[status].label}
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, opacity: 0.5 }}>
        Tap to open →
      </div>
    </div>
  );
}

// ── Detail Page ───────────────────────────────────────────────────
function DetailPage({ chapter, color, onUpdate, onBack, syncStatus }) {
  const [logH, setLogH] = useState("");
  const [extraH, setExtraH] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [notes, setNotes] = useState(chapter.notes || "");
  const ntRef = useRef(null);
  const pct =
    chapter.totalHours > 0
      ? (chapter.completedHours / chapter.totalHours) * 100
      : 0;
  const remaining = Math.max(0, chapter.totalHours - chapter.completedHours);
  const status = getStatus(chapter.completedHours, chapter.totalHours);

  const logHours = () => {
    const h = parseFloat(logH);
    if (isNaN(h) || h <= 0) return;
    onUpdate({
      ...chapter,
      completedHours: +(chapter.completedHours + h).toFixed(1),
    });
    setLogH("");
  };
  const logExtra = () => {
    const h = parseFloat(extraH);
    if (isNaN(h) || h <= 0) return;
    onUpdate({
      ...chapter,
      completedHours: +(chapter.completedHours + h).toFixed(1),
      extraHours: +((chapter.extraHours || 0) + h).toFixed(1),
    });
    setExtraH("");
  };
  const toggleTopic = (id) => {
    const topics = (chapter.topics || []).map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    onUpdate({ ...chapter, topics });
  };
  const markLast = (id) =>
    onUpdate({
      ...chapter,
      lastCompletedTopic: chapter.lastCompletedTopic === id ? null : id,
    });
  const deleteTopic = (id) =>
    onUpdate({
      ...chapter,
      topics: (chapter.topics || []).filter((t) => t.id !== id),
    });
  const addTopic = () => {
    if (!newTopic.trim()) return;
    onUpdate({
      ...chapter,
      topics: [
        ...(chapter.topics || []),
        { id: uid(), name: newTopic.trim(), done: false },
      ],
    });
    setNewTopic("");
  };
  const handleNotes = (v) => {
    setNotes(v);
    clearTimeout(ntRef.current);
    ntRef.current = setTimeout(() => onUpdate({ ...chapter, notes: v }), 700);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'Sora',sans-serif",
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg,${color},${color}bb)`,
          padding: "24px 20px 28px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -30,
            top: -30,
            width: 140,
            height: 140,
            background: "rgba(255,255,255,.07)",
            borderRadius: "50%",
          }}
        />
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,.2)",
            border: "none",
            borderRadius: 10,
            padding: "7px 14px",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          ← Back
        </button>
        <div style={{ marginBottom: 8 }}>
          <SyncBadge status={syncStatus} />
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          {chapter.batchCode}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginTop: 4,
            marginBottom: 16,
          }}
        >
          {chapter.name}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Allotted", val: chapter.totalHours + "h" },
            { label: "Taken", val: chapter.completedHours + "h" },
            { label: "Extra", val: (chapter.extraHours || 0) + "h" },
            { label: "Remaining", val: remaining + "h" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: "rgba(255,255,255,.2)",
                borderRadius: 12,
                padding: "10px 4px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800 }}>{s.val}</div>
              <div
                style={{
                  fontSize: 9,
                  opacity: 0.8,
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <PBar pct={pct} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 5,
              fontSize: 13,
              fontWeight: 700,
              opacity: 0.9,
            }}
          >
            <span>{pct.toFixed(0)}% complete</span>
            <span>{STATUS[status].label}</span>
          </div>
        </div>
        {status === "exceeded" && (
          <div
            style={{
              marginTop: 10,
              background: "rgba(239,68,68,.3)",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            ⚠️ Exceeded allotted by{" "}
            {(chapter.completedHours - chapter.totalHours).toFixed(1)}h
          </div>
        )}
      </div>

      <div
        style={{ padding: "20px 16px 60px", maxWidth: 560, margin: "0 auto" }}
      >
        <Section title="📅 Log Class Hours">
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="number"
              min={0}
              step={0.5}
              value={logH}
              onChange={(e) => setLogH(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && logHours()}
              placeholder="Hours taken in class..."
              style={{
                flex: 1,
                padding: "11px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 12,
                fontSize: 15,
                fontFamily: "inherit",
                outline: "none",
                background: "#fff",
              }}
            />
            <button
              onClick={logHours}
              style={{
                background: color,
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "0 20px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 15,
              }}
            >
              + Log
            </button>
          </div>
          <div
            style={{
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#92400e",
                marginBottom: 8,
              }}
            >
              ➕ Extra Hours (Beyond Allotted)
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="number"
                min={0}
                step={0.5}
                value={extraH}
                onChange={(e) => setExtraH(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && logExtra()}
                placeholder="Extra hours beyond plan..."
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1.5px solid #fde68a",
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: "inherit",
                  outline: "none",
                  background: "#fffef5",
                }}
              />
              <button
                onClick={logExtra}
                style={{
                  background: "#f59e0b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "0 18px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 14,
                }}
              >
                + Add
              </button>
            </div>
            <div style={{ fontSize: 12, color: "#92400e" }}>
              Tracked separately and saved to cloud
            </div>
          </div>
        </Section>

        <Section title="📋 Topics">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {(chapter.topics || []).length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  color: "#94a3b8",
                  fontSize: 14,
                }}
              >
                No topics yet. Add one below!
              </div>
            )}
            {(chapter.topics || []).map((t, i) => {
              const isLast = chapter.lastCompletedTopic === t.id;
              return (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 14px",
                    borderRadius: 12,
                    background: isLast
                      ? "#eef2ff"
                      : t.done
                      ? "#f0fdf4"
                      : "#fff",
                    border: `1.5px solid ${
                      isLast ? "#c7d2fe" : t.done ? "#bbf7d0" : "#e2e8f0"
                    }`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggleTopic(t.id)}
                    style={{
                      width: 17,
                      height: 17,
                      accentColor: color,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: t.done ? "#64748b" : "#1e293b",
                      textDecoration: t.done ? "line-through" : "none",
                    }}
                  >
                    {i + 1}. {t.name}
                  </span>
                  {isLast && (
                    <span
                      style={{
                        background: color,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                        flexShrink: 0,
                      }}
                    >
                      Last Done
                    </span>
                  )}
                  <button
                    onClick={() => markLast(t.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 15,
                      opacity: 0.5,
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    📍
                  </button>
                  <button
                    onClick={() => deleteTopic(t.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 16,
                      color: "#ef4444",
                      opacity: 0.5,
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTopic();
              }}
              placeholder="Add a topic..."
              style={{
                flex: 1,
                padding: "10px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 12,
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                background: "#fff",
              }}
            />
            <button
              onClick={addTopic}
              style={{
                background: color,
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "0 18px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 14,
              }}
            >
              + Add
            </button>
          </div>
        </Section>

        <Section title="📝 Notes">
          <textarea
            value={notes}
            onChange={(e) => handleNotes(e.target.value)}
            placeholder="Add notes, derivations, student doubts, important formulas..."
            style={{
              width: "100%",
              minHeight: 120,
              padding: "14px",
              border: "1.5px solid #e2e8f0",
              borderRadius: 14,
              fontSize: 14,
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              background: "#fff",
              lineHeight: 1.7,
              boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            ☁️ Auto-saved to cloud
          </div>
        </Section>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────
function DashBar({ chapters, profile }) {
  const total = chapters.reduce((s, c) => s + c.totalHours, 0);
  const done = chapters.reduce((s, c) => s + c.completedHours, 0);
  const pct = total > 0 ? (done / total) * 100 : 0;
  const batches = [...new Set(chapters.map((c) => c.batchCode))];
  const h = new Date().getHours();
  const gw =
    h < 12
      ? "Good Morning ☀️"
      : h < 17
      ? "Good Afternoon 🌤️"
      : "Good Evening 🌙";
  const sal = profile.gender === "male" ? "Sir" : "Ma'am";
  return (
    <div
      style={{
        background: "linear-gradient(135deg,#6366f1,#4338ca)",
        borderRadius: 20,
        padding: "20px 20px 22px",
        color: "#fff",
        marginBottom: 22,
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.8 }}>{gw},</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>
        {profile.code} {sal} 👋
      </div>
      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 14 }}>
        {profile.name}
      </div>
      {batches.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          {batches.map((b) => (
            <span
              key={b}
              style={{
                background: "rgba(255,255,255,.2)",
                borderRadius: 99,
                padding: "3px 12px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {b}
            </span>
          ))}
        </div>
      )}
      <div
        style={{
          background: "rgba(255,255,255,.2)",
          borderRadius: 99,
          height: 7,
        }}
      >
        <div
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: "100%",
            background: "#fff",
            borderRadius: 99,
            transition: "width .8s",
          }}
        />
      </div>
      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
        {pct.toFixed(0)}% overall · {chapters.length} chapters ·{" "}
        {batches.length} batches
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState(() => {
    try {
      const s = localStorage.getItem("lt_profile");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editChapter, setEditChapter] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState(null);

  // Load from cloud on login
  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    db.load(profile.code)
      .then((data) => {
        if (data) setChapters(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [profile]);

  const saveProfile = (p) => {
    localStorage.setItem("lt_profile", JSON.stringify(p));
    setProfile(p);
  };

  const syncChapter = useCallback(async (chapter, teacherCode) => {
    setSyncStatus("saving");
    try {
      await db.upsert(teacherCode, chapter);
      setSyncStatus("saved");
      setTimeout(() => setSyncStatus(null), 2000);
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus(null), 3000);
    }
  }, []);

  const updateChapter = useCallback(
    (updated) => {
      setChapters((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      syncChapter(updated, profile.code);
    },
    [profile, syncChapter]
  );

  const addChapter = async (data) => {
    const chapter = {
      id: uid(),
      ...data,
      completedHours: 0,
      extraHours: 0,
      topics: [],
      notes: "",
      lastCompletedTopic: null,
    };
    setChapters((prev) => [...prev, chapter]);
    setSyncStatus("saving");
    try {
      await db.upsert(profile.code, chapter);
      setSyncStatus("saved");
      setTimeout(() => setSyncStatus(null), 2000);
    } catch {
      setSyncStatus("error");
    }
    setAddOpen(false);
  };

  const deleteChapter = async (id) => {
    if (!window.confirm("Delete this chapter? This cannot be undone.")) return;
    setChapters((prev) => prev.filter((c) => c.id !== id));
    await db.remove(id);
  };

  const editAndSave = async (data) => {
    const updated = { ...editChapter, ...data };
    setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    await db.upsert(profile.code, updated);
    setEditChapter(null);
  };

  if (!profile) return <Onboarding onDone={saveProfile} />;

  const batches = [...new Set(chapters.map((c) => c.batchCode))].sort();
  const getBatchColor = (b) =>
    BATCH_COLORS[batches.indexOf(b) % BATCH_COLORS.length];

  const detailChapter = chapters.find((c) => c.id === detailId);
  if (detailChapter)
    return (
      <DetailPage
        chapter={detailChapter}
        color={getBatchColor(detailChapter.batchCode)}
        onUpdate={updateChapter}
        onBack={() => setDetailId(null)}
        syncStatus={syncStatus}
      />
    );

  const filtered = chapters
    .filter((c) => !batchFilter || c.batchCode === batchFilter)
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.batchCode.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;} body{margin:0;font-family:'Sora',sans-serif;background:#f8fafc;}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-thumb{background:#dde;border-radius:99px;}
      `}</style>
      <div
        style={{ maxWidth: 560, margin: "0 auto", padding: "22px 15px 70px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
              LectureTrack
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              Physics · NEET / JEE
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {syncStatus && <SyncBadge status={syncStatus} />}
            <button
              onClick={() => setExportOpen(true)}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: 10,
                width: 36,
                height: 36,
                cursor: "pointer",
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              📊
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("lt_profile");
                setProfile(null);
                setChapters([]);
              }}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: 10,
                width: 36,
                height: 36,
                cursor: "pointer",
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              👤
            </button>
            <button
              onClick={() => setAddOpen(true)}
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "0 14px",
                height: 36,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              + Add
            </button>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#6366f1",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>☁️</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Loading your data from cloud...
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>
              Please wait
            </div>
          </div>
        ) : (
          <>
            <DashBar chapters={chapters} profile={profile} />

            {batches.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 4,
                  marginBottom: 14,
                  scrollbarWidth: "none",
                }}
              >
                {["All", ...batches].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBatchFilter(b === "All" ? null : b)}
                    style={{
                      flexShrink: 0,
                      padding: "6px 16px",
                      borderRadius: 99,
                      border: "none",
                      cursor: "pointer",
                      background:
                        (!batchFilter && b === "All") || batchFilter === b
                          ? b === "All"
                            ? "#0f172a"
                            : getBatchColor(b)
                          : "#f1f5f9",
                      color:
                        (!batchFilter && b === "All") || batchFilter === b
                          ? "#fff"
                          : "#475569",
                      fontWeight: 700,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍  Search chapter or batch..."
              style={{
                width: "100%",
                padding: "11px 16px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 14,
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                background: "#fff",
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filtered.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "50px 20px",
                    color: "#94a3b8",
                  }}
                >
                  <div style={{ fontSize: 44 }}>📭</div>
                  <div style={{ fontWeight: 700, marginTop: 12, fontSize: 16 }}>
                    No chapters yet
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    Tap "+ Add" to get started
                  </div>
                </div>
              )}
              {filtered.map((c) => (
                <ChapterCard
                  key={c.id}
                  chapter={c}
                  color={getBatchColor(c.batchCode)}
                  onClick={() => setDetailId(c.id)}
                  onEdit={(e) => {
                    e.stopPropagation();
                    setEditChapter(c);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    deleteChapter(c.id);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {addOpen && (
        <ChapterFormModal
          onSave={addChapter}
          onClose={() => setAddOpen(false)}
        />
      )}
      {editChapter && (
        <ChapterFormModal
          chapter={editChapter}
          onSave={editAndSave}
          onClose={() => setEditChapter(null)}
        />
      )}
      {exportOpen && (
        <ExportModal chapters={chapters} onClose={() => setExportOpen(false)} />
      )}
    </>
  );
}
