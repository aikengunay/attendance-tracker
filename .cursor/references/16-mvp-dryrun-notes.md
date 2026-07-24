# MVP dry-run notes (M7)

Date: 2026-07-20

## Automated coverage

`npm test` includes `lib/smoke/mvp-dryrun.test.ts`:

| Path | Result |
|------|--------|
| Import INF231 (40) + INF232 (22) | Pass |
| Start session + QR check-in → code `1` | Pass |
| Manual codes `2/3/4` + feed counts | Pass |
| End session → auto-absent `0` | Pass |
| Unopened dates stay blank in export | Pass |
| Gradebook templates INF231/INF232 | Pass |
| Duplicate check-in rejected | Pass |
| Cross-section token rejected | Pass |

HTTP smoke (server must be running):

```bash
npm run build && npm run start
# other terminal
npm run smoke:http
```

## Classroom AP sanity (manual)

See `10-classroom-runbook.md`. Checklist:

1. `docker compose up -d db` then `npm run dev` (or production: `https://presentpo.com`)
2. Laptop + phone on teacher AP reach `http://<LAN-IP>:3000`
3. Import both classlists once
4. Start INF231 → projector QR → 2–3 phone check-ins
5. Live roster override for no-phone
6. End → export gradebook → open in Excel; confirm `summary` formulas still work

## Demo section (walkthroughs)

```bash
npm run db:seed-demo
```

| Field | Value |
|-------|--------|
| Section | `INF191` |
| Student ID | `2019-100265` |
| Name | GUNAY, AIKEN JOAQUIN E. |

Separate from INF231/INF232. Fixture: `fixtures/classlists/inf191-demo.xls`.

## Known MVP limits

- Student match in export is by **name** (template has no Student ID column)
- Late adds missing from xlsx appear on `_export_notes`
- TTS announce is optional; off by default
- Trusted classroom LAN only — not public internet

## Tag

`v0.1.0-mvp` marks the 2-day testable milestone on `main`.
