# Presentation / video script (3–5 minutes)

Use this for your LMS demo video. The script below follows the **exact order the assignment requires**. Tick each item as you record.

---

## Required video items (assignment checklist)

| # | Must show in video | When in this script | What marker should see |
| --- | --- | --- | --- |
| 1 | **Initial load** | Step 1 (0:00) | 3 cards load, last refresh updates, Tomato/Lettuce/Wheat visible |
| 2 | **Create Maize** | Step 2 (0:35) | Add form, save, 4th card appears |
| 3 | **Latest Maize matching** | Step 3 (1:05) | Maize card shows latest timestamp `2026-08-06T09:00:00`, Faulty, Sensor Problem |
| 4 | **One Edit** | Step 4 (1:25) | Edit a card, save, values update |
| 5 | **Delete and re-create** | Step 5 (1:50) | Delete Maize → recreate Maize → same sensor data |
| 6 | **Refresh Sensor Data** | Step 6 (2:25) | Click refresh, last refresh time changes |
| 7 | **Dry / Healthy / Too Wet** | Step 1 + Step 7 recap | Tomato Dry, Lettuce Healthy, Wheat Too Wet on screen |
| 8 | **Sensor Problem or Invalid Data** | Step 3 + Step 6 | Maize Sensor Problem; Wheat history Invalid Data |
| 9 | **Explain crop_name + latest timestamp** | Step 8 (3:00) | You speak this clearly in your own words |

**Before you record**

1. Terminal 1: `cd backend` → `npm start`
2. Terminal 2: `cd frontend` → `npm run dev`
3. Browser: http://localhost:5173
4. **Delete `backend/smartfarm.db`** and restart backend → start with **3 cards only** (no Maize yet)
5. Close notifications; zoom browser so cards are readable

**Target length:** ~4 minutes (max 5:00)

---

## Step 1 — Initial load (required ✓)

**Time:** 0:00–0:35

**Do:**
- Refresh the page (or open http://localhost:5173 fresh)
- Wait for loading spinner to finish
- Point at: Overall status, crop count **3**, last sensor refresh (not “Never”)

**Say:**
> This is my SmartFarm Crop IoT Dashboard. On initial load the app calls GET /api/crops and GET /api/readings.  
>  
> I have three seeded Crop Cards from SQLite: Tomato, Lettuce, and Wheat. Maize is not seeded — I will create it next.

**Show Dry / Healthy / Too Wet (required ✓)** — point at each card:

| Card | Condition | Evidence on screen |
| --- | --- | --- |
| **Tomato** | **Dry** | Moisture 42% &lt; target 55–75, action Water crop |
| **Lettuce** | **Healthy** | Moisture 70% in range 60–80, action Monitor |
| **Wheat** | **Too Wet** | Moisture 60% &gt; max 55, action Stop watering |

> Tomato is Dry with a high-temperature alert. Lettuce is Healthy. Wheat is Too Wet with rain detected. Overall status is Watch.

---

## Step 2 — Create Maize (required ✓)

**Time:** 0:35–1:05

**Do:**
- Click **Add Crop Card**
- Show dropdown — only **Maize** available
- Enter: **South Field**, min **50**, max **70**, water **600**
- Click **Save crop card**
- Count becomes **4**

**Say:**
> I create Maize through the UI. The dropdown only shows crop names from the sensor JSON that do not already have a card. POST /api/crops saves this to SQLite only — not the JSON file.

---

## Step 3 — Latest Maize matching (required ✓)

**Time:** 1:05–1:25

**Do:**
- Point at the **Maize card** specifically:
  - **Latest reading:** `2026-08-06T09:00:00`
  - **Condition:** Sensor Problem (badge)
  - **Status:** Faulty sensor in the data
  - Overall status → **Critical**

**Say:**
> This is latest Maize matching. The app filters readings where crop_name exactly equals Maize, then selects the greatest timestamp — 2026-08-06T09:00:00 — not the last Maize row in the JSON file.  
>  
> That reading is Faulty, so the condition is **Sensor Problem** — recommended water N/A, action Check sensor. That also makes Overall Farm Status **Critical**.

**Sensor Problem example (required ✓)** — Maize covers this requirement.

---

## Step 4 — One Edit (required ✓)

**Time:** 1:25–1:50

**Do:**
- Click **Edit** on **Tomato**
- Point at **crop name read-only**
- Change **location** (e.g. `Greenhouse A Updated`)
- Click **Save changes**
- Card updates immediately

**Say:**
> Edit uses PUT /api/crops/:id. crop_name cannot be changed. After save, the card recalculates with the current sensor readings.

---

## Step 5 — Delete and re-create Maize (required ✓)

**Time:** 1:50–2:25

**Do:**
- Click **Delete** on **Maize** → card gone, count **3**
- Click **Add Crop Card** → Maize in dropdown again
- Create Maize with same settings
- Point at Maize card again: same timestamp `2026-08-06T09:00:00`, same Sensor Problem

**Say:**
> Delete removes only the SQLite card. The sensor JSON is unchanged. When I recreate Maize, it matches the same read-only Faulty reading again.

---

## Step 6 — Refresh Sensor Data + Invalid Data (required ✓)

**Time:** 2:25–3:00

**Do:**
- Click **Refresh Sensor Data**
- Point at **last sensor refresh** time changing
- On **Wheat**, click **Sensor History**
- Point at newest: Too Wet
- Point at older reading: moisture **120** → **Invalid Data** badge

**Say:**
> Refresh calls GET /api/readings again and recalculates all cards.  
>  
> In Sensor History, an older Wheat reading has soil_moisture 120. The backend returns it because the file is structurally valid, but React labels it **Invalid Data** — that is my Invalid Data example.

**Invalid Data example (required ✓)** — Wheat history covers this (Maize already showed Sensor Problem).

---

## Step 7 — Quick recap of conditions (required ✓)

**Time:** 3:00–3:15

**Do:**
- Scroll cards: point at **Dry** (Tomato), **Healthy** (Lettuce), **Too Wet** (Wheat), **Sensor Problem** (Maize)

**Say:**
> So on one screen I have Dry, Healthy, Too Wet, and Sensor Problem — all from the same analyseCrop decision table.

---

## Step 8 — Explain crop_name matching and latest timestamp (required ✓)

**Time:** 3:15–3:45

**Do:**
- Stay on dashboard (no need to open code unless you want to)
- Speak clearly — this is the **brief explanation** the marker listens for

**Say (learn this in your own words):**
> To join Crop Cards and sensor data, I use one key: **crop_name**. Matching is **exact and case-sensitive** — Tomato matches Tomato, but not tomato.  
>  
> For each card I filter all readings with the same crop_name, then pick the reading with the **greatest timestamp**. I do not assume the last object in the JSON array is the latest — the file is deliberately mixed. Timestamps are in YYYY-MM-DDTHH:mm:ss format, so I can compare them as strings and take the newest.  
>  
> That is how Maize links to its Faulty reading at 2026-08-06T09:00:00, and how Tomato shows Dry from its latest reading at 2026-08-05T09:00:00.

**Say to close:**
> Crop Cards live in SQLite, sensors are read-only JSON, and the dashboard combines them with exact crop_name and latest timestamp. Thank you.

**Stop recording** — aim to finish by 4:30.

---

## One-page recording order (print this)

1. Load page → 3 cards, Dry + Healthy + Too Wet  
2. Add Maize → save  
3. Point at Maize latest time + Sensor Problem  
4. Edit Tomato → save  
5. Delete Maize → recreate Maize  
6. Refresh → time updates  
7. Wheat Sensor History → Invalid Data  
8. **Speak:** crop_name exact match + greatest timestamp  
9. End

---

## Backup lines

| If you forget… | Say this |
| --- | --- |
| crop_name | “Exact, case-sensitive match only.” |
| Latest timestamp | “Greatest timestamp wins — not last in the file.” |
| Why Critical | “Maize Sensor Problem triggers Critical.” |
| Why Watch (before Maize) | “Tomato Dry and Wheat Too Wet.” |
| Invalid Data | “Valid JSON object, but moisture 120 is out of range.” |

---

## Ubuntu (if recording on Linux)

```bash
cd backend && npm install && npm start
# new terminal
cd frontend && npm install && npm run dev
```

Open http://localhost:5173
