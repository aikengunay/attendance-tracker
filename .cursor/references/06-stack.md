# Stack

Optimize for: testable product, teacher familiarity, then **public HTTPS** for the tripod station camera.

## Chosen stack (evolution)

| Layer | Choice | Why |
|-------|--------|-----|
| App | **Next.js** (App Router) + **TypeScript** | One repo, API + UI |
| UI | React + Tailwind | Teacher / student / station screens |
| DB | **PostgreSQL** via Prisma + `@prisma/adapter-pg` | Local Compose + cloud (Railway/Neon/etc.) |
| Prod URL | **https://presentpo.com** | Cloudflare DNS + HTTPS |
| Auth | Teacher PIN in env; student ID + confirm | Fast; SSO later |
| Student QR | `qrcode` + short-lived personal token in DB | Display only on student phone |
| Station scan | Camera + QR decode on **teacher** Scan page (`html5-qrcode` or similar) | Needs public HTTPS |
| Import | Registrar TSV `.xls` parser | Real classlists |
| Export | `exceljs` → gradebook templates | Existing Excel workflow |
| Hosting (v0.2) | **presentpo.com** via Cloudflare DNS → Railway (or Fly/Render/VPS) | See `docs/deploy-presentpo.md` |

## Run paths

1. **Production:** `https://presentpo.com` — Cloudflare + always-on host + Postgres (`docs/deploy-presentpo.md`).
2. **Local:** `docker compose up -d db` + `npm run dev`.
3. Class day: `10-classroom-runbook.md` (tripod + public `/join`).

## Abandoned as product path

- Classroom AP / LAN IP entry
- mkcert for class phones
- SQLite `file:` database in production
- Offline-only operation

## Repo layout

```
attendance-tracker/
  .cursor/
    references/     # product truth
    rules/          # agent rules
    plans/          # phase checklists
  app/              # Next.js routes
  components/
  lib/
  prisma/
  scripts/          # dev/deploy helpers (no AP-required ops)
```
