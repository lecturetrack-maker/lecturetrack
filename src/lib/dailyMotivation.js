// Daily motivation for the Home banner: one short quote + one smiling emoji per day,
// changing automatically at midnight (local time). Same all day, new tomorrow.

const QUOTES = [
  "Every class you teach plants a seed.",
  "Small steps daily, big results soon.",
  "You shape futures, one hour at a time.",
  "Great teachers make hard things simple.",
  "Consistency beats intensity. Keep going!",
  "One more lecture, one more mind lit up.",
  "Progress, not perfection.",
  "Teach with heart, the rest follows.",
  "Today's effort is tomorrow's pride.",
  "You make physics feel possible.",
  "Showing up is half the victory.",
  "Your patience changes lives.",
  "A good lesson today, a topper tomorrow.",
  "Your students notice your effort.",
];

const EMOJIS = ["😊", "😄", "🙂", "😁", "🤗", "😃", "😌","😇"];

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
  return {
    quote: QUOTES[n % QUOTES.length],
    emoji: EMOJIS[n % EMOJIS.length],
    background: palette[n % palette.length],
  };
}
