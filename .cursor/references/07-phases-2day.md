# Phases — 2-day testable MVP

Clock starts when implementation begins. Goal: usable in a real or dry-run class by end of Day 2.

## Day 0 (setup — today)

- [x] Product references written under `.cursor/references/`
- [x] Cursor rules + stack + phases established
- [x] Sample classlists in `fixtures/classlists/`
- [x] Scaffold Next.js + Prisma + SQLite

## Day 1 — Capture path works

**Theme:** Import → Start session → Rotating QR → Student check-in → Codes saved

### Morning

1. Scaffold app (`create-next-app`, Prisma, SQLite schema)
2. Models: `Section`, `MeetingTemplate`, `Student`, `Session`, `Attendance`, `QrToken`
3. Classlist TSV import + preview UI
4. Seed/import INF231 + INF232 fixtures

### Afternoon

5. Teacher login (PIN)
6. Start / end session
7. Full-screen rotating QR page (20s token)
8. Student identify + scan/check-in API
9. Late scoring function + unit tests
10. Session roster live list (codes updating)

### Day 1 exit criteria

- [x] Import both classlists without manual typing
- [x] Start INF231 session, show QR
- [x] Check in 2–3 test students at different offsets → codes `1/2/3/4`
- [x] End session → unchecked students become `0`
- [x] Blanks: meetings never opened do not create `0`s

## Day 2 — Teachability + export

**Theme:** Overrides, polish, Excel export, dry-run rehearsal

### Morning

1. Teacher override + note
2. Manual mark (no-phone path)
3. Cancel session without auto-absent
4. Export attendance grid (section × dates × codes) to `.xlsx`
5. Smoke-fit against `teaching/attendance/` column layout (Wed/Sat dates)

### Afternoon

6. Mobile check-in UX pass (large tap targets, clear confirmation)
7. Projector QR page (huge QR, countdown to next rotate)
8. Live check-in feed (large names); optional TTS toggle (off by default)
9. Edge-case pass (wrong section, duplicate scan, expired token)
10. README + AP runbook dry run (`10-classroom-runbook.md`)
11. Dry run: simulate full INF232 Saturday block

### Day 2 exit criteria

- [x] Teacher can run a session without touching Excel mid-class
- [x] Export opens; codes readable for paste/merge into attendance workbook
- [x] Documented runbook: import → start → QR → end → export
- [x] Known limitations listed (auth, proxy, hosting)

## Phase 3+ (after test — not in 2-day scope)

- Real auth (school Google / magic link)
- Deploy (Vercel + hosted DB)
- Direct sync into existing attendance xlsx sheets
- Geofence / stronger anti-proxy
- Teams announcement hooks

## Definition of done (MVP)

A teacher can, on a laptop + phone:

1. Import Registrar classlist  
2. Start class  
3. Students self check-in via rotating QR  
4. End class → absences filled  
5. Export codes for the term so far  

…in under 5 minutes of teacher UI time (excluding teaching).
