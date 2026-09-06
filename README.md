# LectureTrack — file structure

This is your original single-file `App.js` split into normal React
files. Nothing about the app's behavior changed — every function,
component, and bug fix from the original file is preserved exactly;
only *where* the code lives changed.

Drop this whole `src/` (and `public/`, `package.json`) into your
GitHub repo, replacing what's there now. Since you edit directly in
GitHub's browser editor, from now on you'll open one small file at a
time instead of one 2,700-line file.

## Folder map

```
lecturetrack/
├── package.json
├── public/
│   ├── index.html
│   └── manifest.json          ← add your icon-192.png / icon-512.png here
└── src/
    ├── index.js                 entry point (was implicit before)
    ├── App.jsx                  ← THE MAIN FILE: routing/state/Supabase wiring
    ├── lib/
    │   ├── supabaseClient.js     Supabase connection (URL + key)
    │   ├── constants.js          CHAPTER_DB, BATCH_COLORS, categories, quotes, etc.
    │   ├── helpers.js            all pure functions: hours math, CSV builders, date helpers, row mappers
    │   └── shareImages.js        the 3 canvas-based "share as PNG" builders
    ├── components/                (reusable pieces / modals — not full screens)
    │   ├── SubjectIcon.jsx
    │   ├── SplashScreen.jsx
    │   ├── CongratsScreen.jsx
    │   ├── ChapterAutocomplete.jsx
    │   ├── Modal.jsx
    │   ├── SyncBadge.jsx
    │   ├── PBar.jsx
    │   ├── CircularProgress.jsx
    │   ├── UnitToggle.jsx
    │   ├── PresetChips.jsx
    │   ├── Sec.jsx
    │   ├── BottomNav.jsx
    │   ├── BatchRowInput.jsx
    │   ├── BatchFormModal.jsx
    │   ├── ChapterMasterModal.jsx
    │   ├── AddChapterMasterModal.jsx
    │   ├── BatchHistorySection.jsx
    │   ├── BatchChapterCard.jsx
    │   ├── TravelEntryModal.jsx
    │   ├── WhatsNewModal.jsx
    │   └── EditChapterForm.jsx
    └── pages/                     (full screens — what App.jsx switches between)
        ├── Onboarding.jsx         Login / Register screen
        ├── HomeTab.jsx            Home tab (bottom nav)
        ├── ChaptersTab.jsx        Chapters tab — master library
        ├── BatchesTab.jsx         Batches tab — list of all batches
        ├── ProfileTab.jsx         Profile tab — stats, CSV export, logout
        ├── TravelPage.jsx         Travel Details screen
        ├── BatchPage.jsx          Single batch screen (opened by tapping a batch)
        └── DetailPage.jsx         Single chapter screen — log hours/topics/notes
```

## Which file is "which page"

| Screen you see in the app                  | File |
|---|---|
| Splash screen on launch                     | `components/SplashScreen.jsx` |
| Login / Register                            | `pages/Onboarding.jsx` |
| Home tab                                    | `pages/HomeTab.jsx` |
| Batches tab                                 | `pages/BatchesTab.jsx` |
| Chapters tab (master library)                | `pages/ChaptersTab.jsx` |
| Profile tab                                  | `pages/ProfileTab.jsx` |
| Tapping a batch → batch screen               | `pages/BatchPage.jsx` (+ `components/BatchHistorySection.jsx`, `components/BatchChapterCard.jsx`) |
| Tapping "Open Chapter" → chapter detail screen | `pages/DetailPage.jsx` |
| Travel Details screen                        | `pages/TravelPage.jsx` (+ `components/TravelEntryModal.jsx`) |
| "Add Batch" popup                            | `components/BatchFormModal.jsx` (+ `components/BatchRowInput.jsx`) |
| "Add Chapter" / "Edit Topics" popups          | `components/AddChapterMasterModal.jsx`, `components/ChapterMasterModal.jsx` |
| "What's New" popup                           | `components/WhatsNewModal.jsx` |
| 100-hour congrats screen                     | `components/CongratsScreen.jsx` |
| Bottom nav bar                               | `components/BottomNav.jsx` |

Everything else (`lib/`) is logic with no visible screen of its own —
hours math, CSV/PNG export, and the Supabase client — shared by
whichever page needs it.

## How to edit something now

1. Figure out which screen has the bug/feature using the table above.
2. Open that one file in GitHub.
3. If it imports a helper (e.g. `fmtHours` from `../lib/helpers`) and
   you need to change the *math*, that's the file to edit instead —
   changing it there fixes every screen that uses it at once (this is
   how the Extra/Remaining hours bug was originally fixed).

## Pushing this to GitHub

**Option A — GitHub web UI (matches your current workflow):**
1. Open your repo on github.com.
2. Delete the old `src/App.js` (or whatever the single file was called).
3. Use "Add file → Upload files" and drag in this whole `src/`,
   `public/`, and `package.json` — GitHub preserves the folder
   structure from drag-and-drop.
4. Commit directly to `main` (or open a PR if you want to review the diff first).
5. Vercel will auto-redeploy since it's watching the repo.

**Option B — git command line, if you ever set it up:**
```bash
git clone <your-repo-url>
cd <your-repo>
# copy the contents of this lecturetrack/ folder in, overwriting src/ and public/
git add -A
git commit -m "Split App.js into per-page files"
git push
```

## Notes

- All files use `.jsx` — Create React App (via `react-scripts`)
  resolves `.jsx` automatically, so no config changes needed. If your
  repo's build ever complains about extensions, rename to `.js` — the
  content works either way.
- The Supabase URL/key live in `src/lib/supabaseClient.js` only now
  (previously duplicated nowhere, but now there's exactly one place to
  rotate the key if you ever need to).
- `roundRect` (canvas helper) lives in `lib/helpers.js` since it's a
  tiny utility, even though it's only used by `lib/shareImages.js`.
