import { MapPin, Pencil, BarChart3, FileSpreadsheet, Calculator, Smile, RefreshCw } from "lucide-react";

// In-app messages shown behind the bell icon on Home.
// TO ADD A NEW MESSAGE: put a new object at the TOP of this list with a NEW unique `id`.
// Every teacher then sees it as unread (small red number on the bell) until they open it.
//   id    – unique, never reuse an old one
//   date  – shown under the title
//   title – short heading
//   text  – one-line summary
//   items – optional list of {Icon, title, text} shown when the message is opened
export const NOTIFICATIONS = [
  {
    id: "completed-sync-v3",
    date: "17 Oct 2026",
    title: "Completed batches now sync",
    text: "When you mark a batch Completed or Running, it now updates on all your devices (phone, tablet, laptop).",
    items: [
      { Icon: RefreshCw, title: "Same batches everywhere", text: "Marking a batch as Completed or Running on one device now shows on every device you use. Batches you had already marked completed on your phone are moved over automatically." },
    ],
  },
  {
    id: "centre-edit-reports-v2",
    date: "17 Oct 2026",
    title: "LectureTrack just got better",
    text: "Centre & year grouping, Edit Batch, weekly/monthly/yearly reports, Excel report and corrected hours.",
    items: [
      { Icon: MapPin, title: "Batches grouped by centre & year", text: "Home now groups your batches by centre (branch), then by year. Older batches show under “No Centre” until you set one." },
      { Icon: Pencil, title: "Edit your batches", text: "Open a batch and tap Edit. Batch name, teacher, category, chapters and allotted hours are all filled in. You only need to choose the centre." },
      { Icon: BarChart3, title: "Weekly, monthly & yearly reports", text: "Profile → hours graphs: switch between days of the week, weeks of a month, and months of a year." },
      { Icon: FileSpreadsheet, title: "Excel report", text: "Profile → Download Excel Report: date-wise, monthly and yearly hours by batch and centre." },
      { Icon: Calculator, title: "Hours fixed", text: "Taken, extra and remaining hours are recalculated chapter by chapter. Totals above 24 hours (like 214:50) now show correctly." },
      { Icon: Smile, title: "Daily motivation", text: "A fresh quote and smile on your Home banner every day." },
    ],
  },
];

const key = code => `lt_notif_read_${code || "guest"}`;
export function loadReadIds(code) {
  try { return JSON.parse(localStorage.getItem(key(code)) || "[]"); } catch { return []; }
}
export function saveReadIds(code, ids) {
  try { localStorage.setItem(key(code), JSON.stringify(ids)); } catch {}
}
