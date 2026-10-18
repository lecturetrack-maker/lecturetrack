// Daily motivation for the Home banner: one short quote + one smiling emoji per day,
// changing automatically at midnight (local time). Same all day, new tomorrow.

const QUOTES = [
  "Every class you teach plants a seed.",
  "You inspire more minds than you know.",
  "Great teachers light the way for others.",
  "Small steps daily, big results soon.",
  "Your words can change a student's future.",
  "Consistency beats intensity. Keep going!",
  "One more lecture, one more mind lit up.",
  "Teach with heart, the rest follows.",
  "Today's effort is tomorrow's pride.",
  "Showing up is half the victory.",
  "Your patience changes lives.",
  "You make hard things feel possible.",
  "A good lesson today, a proud student tomorrow.",
  "Your students notice your effort.",
  "Believe in them, and they will rise.",
  "You are building futures, one hour at a time.",
];

// Malayalam quotes (shown on alternate days, in a Malayalam font)
const QUOTES_ML = [
  "ഓരോ ക്ലാസും ഒരു വിത്താണ്.",
  "നിങ്ങളുടെ വാക്കുകൾ ഭാവി മാറ്റും.",
  "നല്ല അധ്യാപകർ വഴിവിളക്കുകളാണ്.",
  "ചെറിയ ചുവടുകൾ, വലിയ വിജയങ്ങൾ.",
  "സ്നേഹത്തോടെ പഠിപ്പിക്കൂ, ബാക്കി പിന്നാലെ.",
  "ഇന്നത്തെ പരിശ്രമം നാളത്തെ അഭിമാനം.",
  "നിങ്ങളുടെ ക്ഷമ ജീവിതം മാറ്റുന്നു.",
  "വിശ്വസിക്കൂ, അവർ ഉയരങ്ങളിലെത്തും.",
  "നിങ്ങൾ പ്രചോദിപ്പിക്കുന്നത് അനേകം മനസ്സുകളെ.",
  "ഓരോ മണിക്കൂറും ഒരു ഭാവി പണിയുന്നു.",
  "ക്ലാസിൽ എത്തുന്നതുതന്നെ ഒരു വിജയം.",
  "പുഞ്ചിരിയോടെ തുടങ്ങൂ, നല്ലൊരു ദിനം!",
];

export const MALAYALAM_FONT = "'Noto Sans Malayalam','Malayalam Sangam MN','Kartika',sans-serif";

// Loads the Malayalam web font once (phones without Malayalam fonts still render it correctly)
export function loadMalayalamFont() {
  if (typeof document === "undefined" || document.getElementById("lt-ml-font")) return;
  const l = document.createElement("link");
  l.id = "lt-ml-font";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@600;800&display=swap";
  document.head.appendChild(l);
}

const EMOJIS = ["😊", "😄", "🙂", "😁", "🤗", "😃", "😌"];

// Tile colours, chosen so the tile always contrasts with the banner theme (0 indigo, 1 teal, 2 rose/orange)
const TILE_COLORS = [
  ["linear-gradient(135deg,#f59e0b,#f97316)", "linear-gradient(135deg,#ec4899,#db2777)", "linear-gradient(135deg,#06b6d4,#0891b2)"],
  ["linear-gradient(135deg,#ec4899,#db2777)", "linear-gradient(135deg,#f59e0b,#d97706)", "linear-gradient(135deg,#8b5cf6,#7c3aed)"],
  ["linear-gradient(135deg,#6366f1,#4338ca)", "linear-gradient(135deg,#0d9488,#0f766e)", "linear-gradient(135deg,#8b5cf6,#6d28d9)"],
];

function dayNumber(d = new Date()) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

export function getDailyMotivation(bannerTheme = 0, d = new Date()) {
  const n = dayNumber(d);
  const palette = TILE_COLORS[bannerTheme] || TILE_COLORS[0];
  // Even days: English quote. Odd days: Malayalam quote.
  const isMl = n % 2 === 1;
  const idx = Math.floor(n / 2);
  return {
    quote: isMl ? QUOTES_ML[idx % QUOTES_ML.length] : QUOTES[idx % QUOTES.length],
    lang: isMl ? "ml" : "en",
    emoji: EMOJIS[n % EMOJIS.length],
    background: palette[n % palette.length],
  };
}
