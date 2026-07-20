# Attendance Tracker

Web app to capture class attendance **without interrupting teaching**: students scan a **rotating classroom QR**; late codes `1–4` and absences `0` are assigned automatically from server time.

Built for CTADWEBL sections (INF231 / INF232) and designed to export into the existing Excel attendance workflow.

## Status

**M4** — Session start/end, rotating QR projector, student check-in, auto-absent `0`.

## Quick start (local)

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

App: `http://localhost:3000` (bound to `0.0.0.0` for LAN phones).

```bash
npm test          # scoring unit tests
npm run build
```

## Quick start (Docker / classroom)

```bash
cp .env.example .env   # set TEACHER_PIN
mkdir -p data
docker compose up --build
```

Phones on the teacher AP: `http://<laptop-lan-ip>:3000`  
SQLite persists in `./data`. See [`.cursor/references/10-classroom-runbook.md`](.cursor/references/10-classroom-runbook.md).

## Env

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `file:./data/dev.db` | SQLite file |
| `TEACHER_PIN` | (required) | Teacher gate |
| `QR_ROTATE_SECONDS` | `20` | Projector QR rotation |
| `EARLY_CHECKIN_MINUTES` | `15` | Early check-in window |
| `TZ` | `Asia/Manila` | Local class time |

## Product docs

All decisions live in [`.cursor/references/`](.cursor/references/). Agent entry: [`AGENTS.md`](AGENTS.md). Plan: [`.cursor/plans/attendance_tracker_mvp_b38f6d11.plan.md`](.cursor/plans/attendance_tracker_mvp_b38f6d11.plan.md).

## Stack

- Next.js (App Router) + TypeScript + Tailwind  
- Prisma 7 + SQLite (`better-sqlite3` adapter)  
- Docker Compose for classroom AP runs  
