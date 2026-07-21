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
   - Prefer Nixpacks (default via `railway.toml`). Local Docker image lives at `docker/Dockerfile`.
4. Set env vars on the service:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | From Railway Postgres |
| `TEACHER_PIN` | Strong PIN |
| `PUBLIC_APP_URL` | `https://presentpo.com` |
| `TZ` | `Asia/Manila` |
| `EARLY_CHECKIN_MINUTES` | `15` |

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
SMOKE_BASE=https://presentpo.com TEACHER_PIN='…' npm run smoke:http
```

Teacher phone (tripod): open `https://presentpo.com/teacher` — camera will work on real HTTPS after P2 Station Scan lands.

## Local development (Postgres)

```bash
cp .env.example .env   # set TEACHER_PIN
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

Full stack via Compose:

```bash
docker compose up --build
```

## Alternatives (same shape)

| Host | Notes |
|------|--------|
| **Fly.io** | `fly launch` + Fly Postgres; CF CNAME to Fly app |
| **Render** | Web service + Postgres; CF CNAME |
| **VPS + Cloudflare Tunnel** | Run Docker Compose on a VPS; tunnel hostname `presentpo.com` — no open origin ports |

Do **not** rely on the teacher laptop + AP for production.

## Abandoned

- Classroom AP / LAN IP URLs  
- mkcert / `certs:setup` as a class-day requirement  
- SQLite `file:./data/dev.db` in production  
