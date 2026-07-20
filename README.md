# Present Po (attendance-tracker)

Class attendance for CTADWEBL without mid-lecture Excel. **v0.2 direction:** public site at **[presentpo.com](https://presentpo.com)**; teacher tripod station scans student personal QR (see plan).

## Status

- **v0.1.0-mvp** tagged (projector self-scan + local AP era)
- **v0.2 P0** docs pivoted; **P1** = PostgreSQL + cloud deploy for `presentpo.com`

## Quick start (local)

Needs Docker for Postgres:

```bash
cp .env.example .env   # set TEACHER_PIN
docker compose up -d db
npm install
npx prisma migrate deploy
npm run db:seed-demo   # optional INF191 demo
npm run dev
```

- App: `http://localhost:3000`
- Teacher: `/teacher` → PIN
- Students (eventually): `/join` on **https://presentpo.com**

Deploy: [`docs/deploy-presentpo.md`](docs/deploy-presentpo.md).

```bash
npm test
npm run build
npm run start
```

## Production (presentpo.com)

1. Host Next.js + Postgres (Railway recommended).
2. Point Cloudflare DNS for `presentpo.com` at the host.
3. Set `DATABASE_URL`, `TEACHER_PIN`, `PUBLIC_APP_URL=https://presentpo.com`.

Full steps: [`docs/deploy-presentpo.md`](docs/deploy-presentpo.md).  
Class-day runbook: [`.cursor/references/10-classroom-runbook.md`](.cursor/references/10-classroom-runbook.md).

## Env

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `TEACHER_PIN` | Teacher gate |
| `PUBLIC_APP_URL` | Canonical HTTPS origin (`https://presentpo.com`) |
| `EARLY_CHECKIN_MINUTES` | Early check-in window (default 15) |
| `TZ` | `Asia/Manila` |

## Product docs

[`.cursor/references/`](.cursor/references/) · [v0.2 plan](.cursor/plans/attendance_tracker_v0.2_complete.plan.md) · [`AGENTS.md`](AGENTS.md)

## Stack

Next.js App Router + TypeScript + Tailwind · Prisma 7 + **PostgreSQL** · Cloudflare DNS · Docker Compose for local DB
