# Deploy presentpo.com (P1)

**Domain:** `presentpo.com` (Cloudflare DNS + HTTPS)  
**App:** Next.js on an always-on host  
**DB:** PostgreSQL (managed or Compose)

Class day does **not** use a teacher AP or laptop SQLite.

## Recommended path: Railway + Cloudflare

### 1. PostgreSQL + app on Railway

1. Create a [Railway](https://railway.app) project.
2. Add **PostgreSQL** plugin → copy the `DATABASE_URL`.
3. Deploy this repo (GitHub connect or `railway up`):
   - Root = this project
   - Build: `npx prisma migrate deploy && npm run build` (Nixpacks already runs `npm ci`; do not re-run it)
   - Start: `npm run start`
   - Prefer Nixpacks (default via `railway.toml`). No app Dockerfile required.
4. Set env vars on the service:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | From Railway Postgres |
| `TEACHER_PASSWORD` | Strong teacher password (Apple Passwords / managers OK) |
| `PUBLIC_APP_URL` | `https://presentpo.com` |
| `TZ` | `Asia/Manila` |
| `EARLY_CHECKIN_MINUTES` | `15` |

`TEACHER_PIN` still works as a fallback until you remove it. After deploy: set `TEACHER_PASSWORD` to the same value, confirm login, then delete `TEACHER_PIN`.

Passkeys: after password login, use **Add passkey** on the teacher home Security panel. WebAuthn `rpID` comes from `PUBLIC_APP_URL` host (`presentpo.com`) — enroll on the custom domain, not the Railway `*.up.railway.app` URL.

Login rate limits and WebAuthn challenges are stored **in-memory on each app instance** (reset on restart; not shared across multiple replicas). Fine for a single Railway service; use Redis if you scale out.

5. Note the Railway public URL (e.g. `xxx.up.railway.app`).

### 2. Cloudflare DNS for `presentpo.com`

In the Cloudflare dashboard for **presentpo.com**:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | `xxx.up.railway.app` | Proxied (orange) |
| CNAME | `www` | `presentpo.com` or same target | Proxied |

If Cloudflare rejects CNAME on `@`, use their **CNAME flattening** (default on CF) or an A/AAAA from Railway’s docs.

SSL/TLS mode: **Full (strict)** once Railway serves HTTPS (their default).

### 3. Verify

```bash
curl -fsS https://presentpo.com/ | head
SMOKE_BASE=https://presentpo.com TEACHER_PASSWORD='…' npm run smoke:http
```

Teacher: `https://presentpo.com/teacher/login` — password and optional passkey. Tripod camera needs HTTPS after Station Scan lands.

## Local development (Postgres)

```bash
cp .env.example .env   # set TEACHER_PASSWORD
npm install
```

**Option A — Docker Compose DB**

```bash
docker compose up -d db
npx prisma migrate deploy
npm run db:seed-demo   # optional
npm run dev
```

**Option B — Homebrew Postgres** (if Docker Hub is slow)

```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s presentpo   # once
psql -d postgres -c "ALTER USER presentpo WITH PASSWORD 'presentpo';"
createdb -O presentpo presentpo
npx prisma migrate deploy
npm run dev
```

`DATABASE_URL` in `.env.example` matches either path (`presentpo` / `presentpo` @ `127.0.0.1:5432`).

Compose in this repo is **Postgres only** (`docker compose up -d db`). Run the Next app with `npm run dev` locally or via Railway in production.

## Alternatives (same shape)

| Host | Notes |
|------|--------|
| **Fly.io** | `fly launch` + Fly Postgres; CF CNAME to Fly app |
| **Render** | Web service + Postgres; CF CNAME |
| **VPS + Cloudflare Tunnel** | Run Node + Postgres on a VPS; tunnel hostname `presentpo.com` — no open origin ports |

Do **not** rely on the teacher laptop + AP for production.

## Abandoned

- Classroom AP / LAN IP URLs  
- mkcert / `certs:setup` as a class-day requirement  
- SQLite `file:./data/dev.db` in production  
