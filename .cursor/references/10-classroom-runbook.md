# Classroom runbook — public URL + tripod station

v0.2 runtime: app on **public HTTPS** at **`https://presentpo.com`** (Cloudflare). **No teacher AP**, no LAN IP on the board, no mkcert on student phones. Internet required.

## Gear

- Teacher laptop (browser for teacher UI / optional presence board) — does **not** need to host the app during class
- Teacher phone + **tripod** (Station Scan)
- Table under the camera for students to place phones
- Optional: projector/TV for presence board (names only)
- Students’ phones with internet (school Wi‑Fi or mobile data)

## Before term / once

1. Deploy app behind Cloudflare + domain (see plan P1 / deploy docs).
2. Set `TEACHER_PIN` and cloud DB in production env.
3. Import INF231 / INF232 classlists (or seed demo INF191 for practice).
4. On **teacher phone only**: open `https://<domain>/teacher` once; allow camera for Station Scan when prompted.

## Class start (~2 minutes)

1. Board (optional): short URL `https://presentpo.com/join` (or QR to that URL — **entry** QR, not check-in token).
2. Teacher laptop: log in → section → **Start session**.
3. Teacher phone (tripod): open **Station Scan** for that session; leave screen on; camera facing table.
4. Optional: presence board on second display.
5. Students: open `/join` → section + Student ID → confirm → show personal QR → place phone on table in camera frame.
6. Glance name on Scan UI ↔ person; confirm (or use chosen auto-accept). Teach.

## During class

- Late arrivals use the **same station** while session is open.
- Dead phone / can’t show QR → **manual mark** on roster.
- Do not require students to install certificates or join a special SSID.

## Class end (~1 minute)

1. **End session** → missing → `0`
2. Spot-check overrides
3. Export when convenient

## Failure cheat-sheet

| Symptom | Fix |
|---------|-----|
| Site won’t load | Internet? DNS/Cloudflare? Deploy healthy? |
| Station camera blocked | Must be `https://` on the domain; allow camera permission on teacher phone |
| QR expired | Student refreshes personal QR on `/join`; rescan |
| Already checked in | One per session; override if wrong |
| Wrong person | Reject on Scan UI; do not confirm |
| Teacher phone sleep | Disable auto-lock while scanning |

## Security note

The app is on the public internet. Teacher PIN protects admin and scan finalize. Student pages are intentionally low-friction. Do not expose a public endpoint that marks attendance from a token alone without teacher auth.

## Retired (do not use)

- Portable AP / “same SSID as laptop”
- `http://<LAN-IP>:3000` as class URL
- mkcert / `rootCA.pem` on student phones
- Students scanning a rotating **projector check-in** QR
