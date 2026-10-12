# Salesforce PD1 Practice Arena

Static site (HTML + CSS + vanilla JS). No build step, no server, no API keys. Works on phones, tablets and desktops.

## Use on any device via GitHub Pages
1. Create a GitHub repo and upload everything in this folder (keep the `.nojekyll` file).
2. Repo **Settings → Pages → Build from branch → `main` / root → Save**.
3. Open `https://<your-username>.github.io/<repo>/` on any device.

Progress, bookmarks and history are saved per browser/device (localStorage); they do not sync between devices.

## Run locally
Open `index.html` in a browser.

## Files
- `data/questions.json` – editable question bank (`questions.js` is the same data for file:// use; keep both in sync).
- `test.js` – data/shuffle/scoring checks (`node test.js`). `smoke.js` – click-through test (`npm i jsdom && node smoke.js`).
- Questions flagged `excluded` are held back (incomplete in the source, or duplicates); see the dashboard footnote.
