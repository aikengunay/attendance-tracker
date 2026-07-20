---
name: Attendance Tracker v0.2
overview: "v0.2 overhaul: public HTTPS host (Cloudflare + domain), no classroom AP/offline; tripod station where teacher phone scans student personal QR. Remove projector self-scan, LAN/mkcert/AP packaging, and related dead code."
todos:
  - id: p0-product-pivot-docs
    content: "P0: Rewrite product refs for cloud host + tripod teacher-scan; retire AP/LAN/projector-self-scan; document remove/overhaul inventory"
    status: completed
  - id: p1-cloud-host
    content: "P1: Domain + Cloudflare HTTPS; migrate off laptop-only SQLite to cloud DB; env/deploy docs; drop AP as runtime dependency"
    status: in_progress
  - id: p2-teacher-verify-checkin
    content: "P2: Student personal QR + teacher continuous Scan (tripod); remove projector self-scan + student board camera; source=teacher_scan"
    status: pending
  - id: p3-session-ux
    content: "P3: Today’s meeting highlight, cancel without auto-0, demo label, end→roster/export"
    status: pending
  - id: p4-export-roster
    content: "P4: Export Student ID match / late-add; INF231+INF232 Excel smoke"
    status: pending
  - id: p5-live-room
    content: "P5: Presence board only (no check-in QR); roster polish; TTS optional off"
    status: pending
  - id: p6-rehearsal-tag
    content: "P6: Live classroom rehearsal on public URL + tripod station; notes; tag v0.2.0"
    status: pending
  - id: superseded-ap-lan-mkcert
    content: "SUPERSEDED: Classroom AP + LAN IP + mkcert for phones as primary runtime"
    status: cancelled
  - id: superseded-projector-self-scan
    content: "SUPERSEDED: Student scans rotating projector QR / in-app board camera"
    status: cancelled
isProject: true
---

# Attendance Tracker v0.2 — Cloud host + tripod station

Synced with Cursor plan `attendance_tracker_v0.2_df7c3cc1`.

**Locks:** Public HTTPS at **`https://presentpo.com`** (Cloudflare); internet required; no classroom AP/offline; tripod teacher-scan of student personal QR.

## Target

```mermaid
flowchart TB
  subgraph cloud [Public HTTPS]
    App[Next.js]
    DB[(Cloud DB)]
  end
  Stud[Student shows QR] --> App
  Tripod[Tripod Scan] --> App
```

## Milestones

| ID | Focus |
|----|--------|
| P0 | Product refs + remove/overhaul inventory |
| P1 | Domain + Cloudflare + cloud DB; drop AP runtime |
| P2 | Personal QR + teacher Scan; **delete** old check-in gate |
| P3 | Session UX |
| P4 | Export / roster |
| P5 | Presence board only |
| P6 | Live rehearsal on public URL + tag `v0.2.0` |

## Remove (delete)

- Student `join-qr-scanner` / board camera on `/join`
- Projector **check-in** QR page + `/api/sessions/.../qr` as gate + join board-token path
- Typed projector fallback code
- AP / LAN / same-SSID runbook and README checklist
- mkcert classroom path (`certs:setup`, `start-https`, rootCA-on-phones) as required ops
- `dev-with-qr.js` LAN classroom entry as product
- Refs that ban teacher-scan or require AP

## Overhaul

- Host behind Cloudflare + domain (HTTPS); pick Tunnel+VPS or Node host in P1 (prefer not full Workers rewrite unless chosen)
- Prisma: laptop SQLite file → **cloud DB**
- `/join`: show personal QR; wait for station scan
- Teacher CTA: **Open station Scan** (not Projector QR)
- Only teacher session can finalize scan
- Projector → presence board (names/counts only)
- Runbook: public URL → session → tripod → end → export

## Keep

PIN, import, roster, session lifecycle, late codes, manual mark, Excel export, demo INF191, tests (adapt smoke base URL).

## Abandoned

AP network, no-internet mode, class-wide mkcert, student→projector QR primary.

## Hosting default for P1

Cloudflare for DNS/HTTPS; run Next on a small always-on host (Tunnel or direct) + cloud Postgres/SQLite-on-server—unless explicitly choosing Workers+D1.
