# Excel export compatibility

Canonical gradebook templates live in:

`.cursor/references/complete-attendance-tracker/`

- `attendance-inf231.xlsx` — INF231MWA
- `attendance-inf232.xlsx` — INF232MWA
- `attendance-template.xlsx` — fallback for other section codes

Sheets: `midterms` (weeks 1–7), `finals` (weeks 8–14), `all` (rollup), `summary` (analytics).

Also mirrored historically under `teaching/attendance/` outside this repo.

## MVP export (implemented)

**Primary download = filled gradebook template** (same format as the perfect attendance workbooks).

Flow:

1. Clone the section’s template xlsx.
2. Clear prior mark cells on `midterms` / `finals` date columns (C–P).
3. For each **opened** session, map calendar date → column header (`Wednesday, July 15, 2026` style).
4. Match students by **normalized name** (column B on `midterms`).
5. Write codes `0–4` only; leave `all` / `summary` formulas untouched.
6. Unopened dates stay **blank** (not `0`).
7. Unmatched names/dates are listed on an `_export_notes` sheet.

API: `GET /api/sections/[sectionId]/export`  
UI: `/teacher/sections/[sectionId]/export`

Filename: `attendance-{SECTION}-{YYYYMMDD}.xlsx`

## Mapping rules

- Only meetings with a Session are exported.
- Multiple sessions on the same date: latest mark wins.
- Roster order follows the template (not re-sorted by the app).
- Late adds present in the app but missing from the xlsx → `_export_notes` (not silent drop without notice).

## Out of scope (for now)

- Rewriting `summary` logic in the app
- Matching by Student ID column (templates are name-keyed today)
- Auto-appending new student rows with full formula plumbing
