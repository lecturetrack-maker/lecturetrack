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
  "ഓരോ പാഠവും ഒരു പുതിയ തുടക്കമാണ്.",
  "നിങ്ങൾ പകരുന്ന അറിവ് ഒരിക്കലും മായില്ല.",
  "ഒരു നല്ല അധ്യാപകൻ അനേകം സ്വപ്നങ്ങൾക്ക് ചിറകേകുന്നു.",
  "ഇന്നത്തെ ക്ലാസ് നാളത്തെ വിജയത്തിന്റെ അടിത്തറയാണ്.",
  "അറിവ് പകരുന്നതാണ് ഏറ്റവും വലിയ സമ്പത്ത്.",
  "നിങ്ങളുടെ ഓരോ വാക്കും ഒരാളുടെ ജീവിതത്തിൽ വെളിച്ചമാകാം.",
  "ക്ഷമയോടെ പഠിപ്പിക്കൂ, വിശ്വാസത്തോടെ മുന്നേറൂ.",
  "ഓരോ വിദ്യാർത്ഥിയിലും ഒരു വലിയ കഴിവുണ്ട്.",
  "നിങ്ങളുടെ അധ്വാനം ഒരുനാൾ മനോഹരമായ ഫലങ്ങൾ നൽകും.",
  "പഠിപ്പിക്കുക എന്നത് അറിവിനൊപ്പം പ്രതീക്ഷയും പകരലാണ്.",
  "നിങ്ങൾ ചെലവഴിക്കുന്ന ഓരോ മണിക്കൂറും വിലപ്പെട്ടതാണ്.",
  "ഇന്നൊരു മനസ്സിലെങ്കിലും അറിവിന്റെ വെളിച്ചം തെളിയിക്കൂ.",
  "മികച്ച അധ്യാപനം ഹൃദയങ്ങളെ സ്പർശിക്കുന്നു.",
  "വിജയത്തിലേക്കുള്ള ഓരോ ചുവടും ക്ലാസ് മുറിയിൽ തുടങ്ങാം.",
  "നിങ്ങളുടെ സമർപ്പണമാണ് നിങ്ങളുടെ യഥാർത്ഥ ശക്തി.",
  "ഒരു വിദ്യാർത്ഥിയുടെ വിജയം അധ്യാപകന്റെ അഭിമാനമാണ്.",
  "അറിവ് പങ്കുവെക്കുമ്പോൾ വളരുന്നത് ഒരു തലമുറയാണ്.",
  "ഓരോ ദിവസവും മികച്ച അധ്യാപകനാകാനുള്ള അവസരമാണ്.",
  "നിങ്ങൾ വിതയ്ക്കുന്ന അറിവ് നാളെയുടെ ലോകത്തെ മാറ്റും.",
  "ആത്മവിശ്വാസത്തോടെ പഠിപ്പിക്കൂ, സന്തോഷത്തോടെ മുന്നേറൂ.",
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
