# Presentation / video script (3–5 minutes)

Use this for the LMS demo video. Speak clearly. Keep both terminals running before you start recording.

**Before recording**

1. Backend: `cd backend && npm start`
2. Frontend: `cd frontend && npm run dev`
3. Browser: http://localhost:5173
4. Optional: delete `backend/smartfarm.db` and restart backend so you start with only Tomato, Lettuce, Wheat (no Maize)

Target length: **about 4 minutes**.

---

## 0:00–0:30 — Intro + initial load

**Say:**
> This is my SmartFarm Crop IoT Dashboard for Assignment 2. The backend is Express with SQLite for Crop Cards, and a read-only JSON file for sensor readings. The React frontend joins them by exact crop name.

**Do:**
- Show the page loading
- Point to Overall Status, crop card count, and last sensor refresh
- Point briefly at Tomato Dry, Lettuce Healthy, Wheat Too Wet

**Say:**
> On load we fetch Crop Cards from SQLite and readings from GET /api/readings. Tomato is Dry with a high-temperature alert, Lettuce is Healthy, and Wheat is Too Wet with rain detected. Overall status is Watch.

---

## 0:30–1:15 — Create Maize

**Say:**
> Maize is deliberately not seeded, so I can demonstrate Create. The dropdown only lists crop names that exist in the sensor JSON and do not already have a card.

**Do:**
- Click **Add Crop Card**
- Select **Maize**
- Enter: location `South Field`, target min `50`, max `70`, normal water `600`
- Click **Save**

**Say:**
> Maize is saved to SQLite and matched to its latest JSON reading. That latest reading is Faulty, so the condition is Sensor Problem, recommended water is N/A, and Overall Farm Status becomes Critical.

---

## 1:15–1:50 — Latest matching + Edit

**Say:**
> Matching uses an exact, case-sensitive crop_name. Tomato only matches Tomato. For each card we select the greatest timestamp, not the last object in the JSON array, because the readings are deliberately mixed.

**Do:**
- Click **Edit** on Tomato (or Wheat)
- Change location or a target value
- Save
- Show the card recalculate immediately

**Say:**
> Edit updates SQLite and recalculates the card using the current sensor state. Crop name stays read-only and cannot be changed.

---

## 1:50–2:30 — Delete and re-create

**Do:**
- Click **Delete** on Maize
- Show Maize gone and Overall Status back to Watch
- Open **Add Crop Card** again — Maize is back in the dropdown
- Create Maize again with the same settings

**Say:**
> Delete removes only the Crop Card. The sensor JSON is unchanged. When I recreate Maize, it matches the same read-only Faulty reading again.

---

## 2:30–3:10 — Refresh + history / Invalid Data

**Do:**
- Click **Refresh Sensor Data** — show last refresh time update
- On **Wheat**, click **View Sensor History**
- Point to the newest Too Wet reading, then the older Invalid Data reading (moisture 120)

**Say:**
> Refresh calls GET /api/readings again and recalculates every card. Sensor History shows all five Wheat readings, newest first, using the same analyseCrop function. The older reading with moisture 120 is structurally valid, so the backend returns it, but React labels it Invalid Data.

---

## 3:10–3:45 — Conditions recap + close

**Do:**
- Scroll the cards quickly: Dry, Healthy, Too Wet, Sensor Problem (Maize)

**Say:**
> To summarise: Crop Cards live in SQLite, sensors live in a read-only JSON file, and the dashboard joins them by one exact crop_name key and the latest timestamp. Decision priority is Sensor Problem first, then Invalid Data, then Dry, Healthy, or Too Wet. That completes the demo.

**Stop recording** around 3:45–4:30. Do not go past 5:00.

---

## Short backup lines (if you forget)

| Topic | One sentence |
| --- | --- |
| Data ownership | Users edit Crop Cards; sensor JSON is read-only. |
| Matching | Exact case-sensitive `crop_name` only. |
| Latest time | Greatest timestamp wins; array order does not matter. |
| Priority | Faulty/Offline beats Invalid Data and moisture checks. |
| Refresh fail | (optional) Keep previous readings and show an error banner. |

## Optional failed-refresh demo (only if you have time)

1. Stop the backend (`Ctrl+C`)
2. Click **Refresh Sensor Data**
3. Show error banner and that cards / last refresh stay the same
4. Start backend again

Skip this if you are already near 4 minutes.
