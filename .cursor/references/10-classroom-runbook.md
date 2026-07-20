# Classroom runbook — AP + IP + QR

For the **2-day / local MVP** test. App runs on the teacher laptop; students join the teacher’s access point.

## Gear

- Teacher laptop (app running)
- Portable **access point** (teacher-owned)
- Projector or large screen (QR + live check-in feed)
- Optional: spare phone for teacher manual override

## Network setup (before class)

1. Power on AP. Set a clear SSID, e.g. `CTADWEBL-ATTEND` (and a simple password you can write on the board).
2. Connect **laptop** to that AP (Ethernet to AP LAN if possible; Wi‑Fi is fine).
3. On the laptop, note LAN IP:
   - macOS: `ipconfig getifaddr en0` (or the AP interface) / System Settings → Network
   - Example: `192.168.4.1` or `192.168.1.10`
4. Start the app bound to all interfaces, e.g. `next start -H 0.0.0.0 -p 3000` (or `next dev -H 0.0.0.0`).
5. From the laptop browser, open `http://<LAPTOP_IP>:3000` and confirm teacher UI loads.
6. From a phone on the **same SSID**, open the same URL and confirm it loads.  
   If it fails: AP client isolation is on — disable “AP isolation / guest isolation”.

**Do not rely on school Wi‑Fi** unless you have already verified phones can reach the laptop IP.

## Class start (2 minutes)

1. Board: SSID + password + short URL `http://<LAPTOP_IP>:3000`
2. Teacher: log in → select section → **Start session**
3. Open **Projector QR** page (fullscreen)
4. Optional: open **Live feed** on a second window (names as they check in)
5. Teach. Do not manage Excel.

## During class

- Students join AP → open site → **Open camera** (in-app) or use phone Camera on the projector QR → enter Student ID → confirm
- Typed **fallback code** under the projector QR still works if camera scan fails
- Live feed shows each successful check-in (see announcement feature)
- Late arrivals keep scanning; codes auto-map to `1–4`
- Dead phone / can’t scan → teacher **manual mark** later or quietly

### In-app camera on classroom HTTP (important)

Browsers treat `http://<LAN-IP>:3000` as a **non-secure context**. Many phones (especially **iOS Safari**) block `getUserMedia` there, so **Open camera** on `/join` may fail with a clear caption.

**What still works on HTTP LAN:**

1. Phone **Camera** app → scan projector QR → opens `/join?token=&sectionCode=`
2. Type section + Student ID + the **fallback code** shown under the QR

**When in-app scan works:** `http://localhost` on the laptop, or any **HTTPS** host. Trusted local HTTPS / production host can be added later if you want in-app scan on every student phone over the AP.

## Class end (1 minute)

1. **End session** → missing students become `0`
2. Spot-check overrides (excused, wrong mark)
3. Export when convenient (after class is fine)

## Failure cheat-sheet

| Symptom | Fix |
|---------|-----|
| Phones can’t open URL | Same SSID? Isolation off? Correct IP? App on `0.0.0.0`? |
| In-app Open camera fails | Expected on many phones over HTTP LAN — use OS Camera or typed fallback code |
| QR says expired | Normal if slow; wait for next rotate and rescan |
| Already checked in | One check-in per student; use override if needed |
| Laptop sleeps | Disable sleep while session is open |
| AP overload | Cap is usually fine for ~40; move AP centrally |

## Security note (classroom LAN)

This MVP assumes a **trusted classroom AP**. Anyone on the SSID can hit the app. Teacher PIN protects admin; student identity is weaker by design in MVP (see `11-anti-cheat-and-identity.md`). Do not expose the laptop port to the public internet during the test.
