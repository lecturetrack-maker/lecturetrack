// Special-day greetings shown in the Home banner's motivation tile on the exact date.
// Fixed dates (Teachers' Day, Christmas...) work every year automatically.
// Festivals whose date changes every year (Onam, Vishu, Eid, Diwali, Vijayadashami) are listed
// per year in MOVABLE below. Easter is calculated automatically.
//
// EACH YEAR: add the new year's movable dates to MOVABLE (copy a line, change the date).
// Eid dates depend on the moon sighting, so both possible days are listed.

const G = {
  gold:   "linear-gradient(135deg,#f59e0b,#d97706)",
  red:    "linear-gradient(135deg,#ef4444,#b91c1c)",
  green:  "linear-gradient(135deg,#10b981,#047857)",
  indigo: "linear-gradient(135deg,#6366f1,#4338ca)",
  pink:   "linear-gradient(135deg,#ec4899,#be185d)",
  teal:   "linear-gradient(135deg,#14b8a6,#0f766e)",
  saffron:"linear-gradient(135deg,#f97316,#c2410c)",
  purple: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
};

const S = {
  teachers:   { text: "Happy Teachers' Day!", sub: "അധ്യാപക ദിനാശംസകൾ", emoji: "🎓", background: G.indigo },
  worldTeach: { text: "Happy World Teachers' Day!", sub: "ലോക അധ്യാപക ദിനാശംസകൾ", emoji: "🍎", background: G.red },
  newYear:    { text: "Happy New Year!", sub: "പുതുവത്സരാശംസകൾ", emoji: "🎆", background: G.purple },
  republic:   { text: "Happy Republic Day!", sub: "റിപ്പബ്ലിക് ദിനാശംസകൾ", emoji: "🇮🇳", background: G.saffron },
  women:      { text: "Happy Women's Day!", sub: "വനിതാ ദിനാശംസകൾ", emoji: "🌸", background: G.pink },
  independence:{ text: "Happy Independence Day!", sub: "സ്വാതന്ത്ര്യദിനാശംസകൾ", emoji: "🇮🇳", background: G.saffron },
  gandhi:     { text: "Gandhi Jayanti: be the change.", sub: "ഗാന്ധി ജയന്തി", emoji: "🕊️", background: G.teal },
  piravi:     { text: "Happy Kerala Piravi!", sub: "കേരളപ്പിറവി ആശംസകൾ", emoji: "🌴", background: G.green },
  children:   { text: "Happy Children's Day!", sub: "ശിശുദിനാശംസകൾ", emoji: "🎈", background: G.pink },
  christmas:  { text: "Merry Christmas!", sub: "ക്രിസ്മസ് ആശംസകൾ", emoji: "🎄", background: G.red },
  easter:     { text: "Happy Easter!", sub: "ഈസ്റ്റർ ആശംസകൾ", emoji: "🐣", background: G.gold },
  onam:       { text: "Happy Onam!", sub: "ഓണാശംസകൾ", emoji: "🌼", background: G.gold },
  vishu:      { text: "Happy Vishu!", sub: "വിഷു ആശംസകൾ", emoji: "🌻", background: G.gold },
  diwali:     { text: "Happy Diwali!", sub: "ദീപാവലി ആശംസകൾ", emoji: "🪔", background: G.saffron },
  vijaya:     { text: "Happy Vijayadashami!", sub: "വിജയദശമി ആശംസകൾ", emoji: "📚", background: G.purple },
  eidFitr:    { text: "Eid Mubarak!", sub: "ചെറിയ പെരുന്നാൾ ആശംസകൾ", emoji: "🌙", background: G.green },
  eidAdha:    { text: "Eid Mubarak!", sub: "ബലി പെരുന്നാൾ ആശംസകൾ", emoji: "🌙", background: G.teal },
};

// month-day (no leading zeros), same every year
const FIXED = {
  "1-1": S.newYear, "1-26": S.republic, "3-8": S.women, "8-15": S.independence,
  "9-5": S.teachers, "10-2": S.gandhi, "10-5": S.worldTeach, "11-1": S.piravi,
  "11-14": S.children, "12-24": S.christmas, "12-25": S.christmas,
};

// Dates that move every year (YYYY-MM-DD). Verified for 2026-2027; add new years here.
const MOVABLE = {
  // 2026
  "2026-10-20": S.vijaya, "2026-10-21": S.vijaya,
  "2026-11-08": S.diwali,
  // 2027
  "2027-03-09": S.eidFitr, "2027-03-10": S.eidFitr,   // Eid al-Fitr (moon sighting: 9th or 10th)
  "2027-04-15": S.vishu,
  "2027-05-16": S.eidAdha, "2027-05-17": S.eidAdha,   // Eid al-Adha / Bakrid
  "2027-09-12": S.onam,                                // Thiruvonam
  "2027-10-09": S.vijaya,
  "2027-10-29": S.diwali,
};

// Easter Sunday (Western), calculated for any year
function easterDate(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

const pad = n => String(n).padStart(2, "0");

export function getSpecialDay(d = new Date()) {
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  const iso = `${y}-${pad(m)}-${pad(day)}`;
  if (MOVABLE[iso]) return MOVABLE[iso];
  const easter = easterDate(y);
  if (easter.month === m && easter.day === day) return S.easter;
  return FIXED[`${m}-${day}`] || null;
}
