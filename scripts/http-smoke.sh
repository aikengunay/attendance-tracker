#!/usr/bin/env bash
# M7 HTTP smoke against a running server (default http://127.0.0.1:3000)
set -euo pipefail
BASE="${SMOKE_BASE:-http://127.0.0.1:3000}"
PIN="${TEACHER_PIN:-1234}"
COOKIE_JAR="$(mktemp)"
cleanup() { rm -f "$COOKIE_JAR"; }
trap cleanup EXIT

echo "== health / =="
curl -fsS "$BASE/" >/dev/null

echo "== teacher login =="
curl -fsS -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"pin\":\"$PIN\"}" \
  "$BASE/api/teacher/login" | grep -q '"ok":true'

echo "== sections list =="
curl -fsS -b "$COOKIE_JAR" "$BASE/api/sections" | grep -q 'sections'

echo "== teacher UI =="
code=$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" "$BASE/teacher")
test "$code" = "200"

echo "== join UI =="
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/join")
test "$code" = "200"

echo "HTTP smoke OK against $BASE"
