# Online Assessment Portal

A static, GitHub-Pages-hosted MCQ test platform with webcam proctoring.

## What's inside
```
index.html          Student flow: login → instructions → proctored test → result
admin.html           Faculty tool: CSV → data files, and result CSVs → rank list
css/style.css
js/app.js             Student-side logic (login, proctoring, scoring, CSV export)
js/admin.js           Admin-side logic (CSV parsing, file generation)
data/students-data.js Login list the site actually reads (edit via admin.html)
data/questions-data.js Question bank the site actually reads (edit via admin.html)
data/sample-*.csv     Example CSVs in the exact column format admin.html expects
```

## Deploying
1. Push this folder to a GitHub repo.
2. Settings → Pages → deploy from the `main` branch, root folder.
3. Your site is live at `https://<username>.github.io/<repo>/`.

## Updating students or questions
GitHub Pages only serves files — there's no server to accept a live upload. So:
1. Open `admin.html` **locally** (just double-click it, or serve the folder).
2. Upload your CSV (see `data/sample-students.csv` / `data/sample-questions.csv` for the exact columns).
3. Click **Download students-data.js** / **questions-data.js**.
4. Replace the matching file in `data/` and commit + push. The live site updates immediately.

## Collecting results / building the rank list — automatic, via your Google Drive
Every submission now gets sent straight to a Google Sheet in your Drive, so you see the whole class's results and rank order live — no manual collecting or merging needed.

**One-time setup (~5 minutes):**
1. Go to [sheets.google.com](https://sheets.google.com) → create a new blank spreadsheet. Name it something like "Exam Results".
2. In that sheet, go to **Extensions → Apps Script**.
3. Delete whatever's in the editor, and paste in the entire contents of `google-apps-script/Code.gs` from this project.
4. Save (Ctrl+S / Cmd+S).
5. From the function dropdown at the top, select **setupRankListSheet**, then click **Run**. The first time, Google will ask you to authorize the script — approve it (it's your own script, running only on your own sheet). This creates a self-updating "Rank List" tab.
6. Click **Deploy → New deployment**. For "Select type," choose **Web app**. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy**, authorize again if asked, then **copy the Web App URL** it gives you (ends in `/exec`).
8. Open `js/config.js` in this project, paste that URL into `window.RESULTS_ENDPOINT = "...";`, save, then commit and push it (same `git add` / `git commit` / `git push` steps as any other file).

**From then on:** every time a student submits, a new row appears in the **Results** tab of your Sheet, and the **Rank List** tab re-sorts itself automatically — highest score first, fastest completion time as the tiebreaker. Just open the Sheet any time to see where things stand; nothing to download or merge.

**If you ever need to redeploy the script** (e.g. you edit `Code.gs` later): Deploy → Manage deployments → pencil icon → Version: New version → Deploy. This keeps the same URL, so you won't need to update `config.js` again.

**Offline fallback:** each student's browser still auto-downloads a `result_<username>.csv` receipt as a backup — useful if their internet drops mid-submit, or you're testing without Drive set up yet. `admin.html`'s "Build the rank list" tool still works if you ever need to merge those manually.

## Proctoring
- The right-side circular preview uses `getUserMedia` for the live camera feed.
- Face presence is checked ~every second with [face-api.js](https://github.com/vladmandic/face-api)'s tiny face detector (loaded from a CDN, no install needed). No face for >2.5s → red ring + warning + a logged violation. More than one face → also flagged (possible second person).
- Switching tabs or minimizing the window is logged as a violation too.
- If the face-detection model can't load (offline network, CDN blocked), the camera preview still runs but the ring stays neutral — the test isn't blocked, you just lose automatic flagging for that session.

## A note on the Drive integration
The Web App URL in `js/config.js` is public once you push it to a public GitHub repo — anyone who finds it could POST fake rows into your Results sheet (they can't read your Sheet or anything else in your Drive through it, only add rows). For a classroom setting this is usually an acceptable risk, but if you want to tighten it, you can add a simple shared-secret check at the top of `doPost` in `Code.gs` (e.g. reject the request unless `data.secretKey` matches a value only your site and script know) — ask me if you'd like that added.

## Important limitation — please read before using this for graded/high-stakes exams
This is a **fully static site**: there is no backend, database, or server-side scoring. That has one real consequence:

**The correct answers live in the browser** (inside `questions-data.js`, loaded into the page). A student who opens their browser's developer tools during the test can see the answer key. There's no way to fully prevent this without a real backend that scores answers server-side and never ships the key to the client.

For low/medium-stakes quizzes, practice tests, or classes where this risk is acceptable, this platform works well as-is. If you need tamper-proof scoring for a high-stakes exam, the next step up would be adding a small backend (e.g., a free-tier service like Supabase, Firebase, or a Google Apps Script Web App) that stores the answer key server-side and only returns a score — happy to help wire that up if you want to go that route later.

## Customizing
- Colors/typography: `css/style.css` (top of file has the palette as CSS variables).
- Number of questions, question text: `data/questions-data.js` or re-upload via `admin.html`.
- Proctoring sensitivity (how long a missing face is tolerated before flagging, detection frequency): the `2500` (ms) and `900` (ms) values near the top of the proctoring section in `js/app.js`.
