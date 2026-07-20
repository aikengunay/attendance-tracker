# Attendance Tracker

Web app to capture class attendance **without interrupting teaching**: students scan a **rotating classroom QR**; late codes `1–4` and absences `0` are assigned automatically from server time.

Built for CTADWEBL sections (INF231 / INF232). Export fills the same gradebook workbooks as `.cursor/references/complete-attendance-tracker/`.

## Status

**M7 / v0.1.0-mvp** — INF231+INF232 dry-run passed; classroom-ready MVP tagged.

## Quick start (local)

```bash
cp .env.example .env   # set TEACHER_PIN
mkdir -p data
npm install
npx prisma migrate dev
npm run dev
```

- App: `http://localhost:3000` (bound to `0.0.0.0`)
- Teacher: `/teacher` → PIN → import classlist → start session → projector
- Student: scan QR or open `/join`
- Export: section → **Export gradebook** → filled `midterms`/`finals`/`all`/`summary` workbook

```bash
npm test                 # includes INF231/INF232 dry-run
npm run build
npm run start            # then: npm run smoke:http
```

Dry-run notes: [`.cursor/references/16-mvp-dryrun-notes.md`](.cursor/references/16-mvp-dryrun-notes.md).

## Quick start (Docker / classroom)

```bash
cp .env.example .env
mkdir -p data
docker compose up --build
```

Phones on the teacher AP: `http://<laptop-lan-ip>:3000`  
SQLite persists in `./data`.

### Classroom AP checklist

1. Power AP → SSID e.g. `CTADWEBL-ATTEND` (write password on board).
2. Connect laptop to AP; note LAN IP (`ipconfig getifaddr en0` on macOS).
3. `docker compose up --build` (or `npm run start` after build).
4. Laptop + a phone on same SSID must open `http://<IP>:3000`.
5. If phones fail: disable AP / guest isolation.
6. Teacher: login → section → **Start session** → **Projector QR** (fullscreen).
7. Optional: enable **Announce names** (TTS, off by default).
8. **End session** → missing → `0` → **Export gradebook** when convenient.

Full detail: [`.cursor/references/10-classroom-runbook.md`](.cursor/references/10-classroom-runbook.md).

## Env

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `file:./data/dev.db` | SQLite file |
| `TEACHER_PIN` | (required) | Teacher gate |
| `QR_ROTATE_SECONDS` | `20` | Projector QR rotation |
| `EARLY_CHECKIN_MINUTES` | `15` | Early check-in window |
| `TZ` | `Asia/Manila` | Local class time |

## Gradebook templates

| Section | Template |
|---------|----------|
| INF231* | `attendance-inf231.xlsx` |
| INF232* | `attendance-inf232.xlsx` |
| other | `attendance-template.xlsx` |

Path: [`.cursor/references/complete-attendance-tracker/`](.cursor/references/complete-attendance-tracker/).

## Product docs

See [`.cursor/references/`](.cursor/references/) and [`AGENTS.md`](AGENTS.md).  
Plan: [`.cursor/plans/attendance_tracker_mvp_b38f6d11.plan.md`](.cursor/plans/attendance_tracker_mvp_b38f6d11.plan.md).

## Stack

Next.js (App Router) + TypeScript + Tailwind · Prisma 7 + SQLite · Docker Compose for classroom AP runs
