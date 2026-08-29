# Presentation / video script (3–5 minutes)

Use this for your LMS demo video. Read the **Say** parts in your own words — you do not need to memorise every line. The **Do** parts tell you what to click and what the marker should see.

**Before you record**

1. Open **two terminals** (or two tabs):
   - Terminal 1: `cd backend` → `npm start` (should say port 3001)
   - Terminal 2: `cd frontend` → `npm run dev` (should say port 5173)
2. Open browser: **http://localhost:5173**
3. **Recommended:** delete `backend/smartfarm.db` and restart the backend so you start with **only 3 cards** (Tomato, Lettuce, Wheat). Maize should **not** be on the dashboard yet — you will create it live.
4. Close extra tabs and notifications so the recording looks clean.

**Target length:** about **4 minutes**. Stop before 5:00.

---

## 0:00–0:35 — Introduction and first load

**Do:**
- Start on the dashboard after a fresh page load (you may briefly see the loading spinner).
- Point at the **title** and the three summary boxes at the top.
- Slowly point at each crop card: Tomato, Lettuce, Wheat.

**Say (example):**
> Hi, this is my SmartFarm Crop IoT Dashboard for Assignment 2.  
>  
> The app has two separate data sources. **Crop Cards** are stored in **SQLite** on the backend — things like location, target moisture range, and how much water to use normally. **Sensor readings** come from a **read-only JSON file** that simulates an IoT feed.  
>  
> When the page loads, React calls **GET /api/crops** and **GET /api/readings**. You can see the last sensor refresh time update — that means the sensor request succeeded.  
>  
> Right now I have three seeded cards: Tomato, Lettuce, and Wheat. Maize is not in the database yet — I will create that in a moment.

**Point out on screen:**
- **Tomato** — condition badge **Dry**, moisture **42%** (below target 55–75), alert **High temperature** (38°C), action **Water crop**
- **Lettuce** — **Healthy**, moisture **70%** inside target 60–80
- **Wheat** — **Too Wet**, moisture **60%** above target max 55, alert **Rain detected** (5 mm)
- **Overall status: Watch** — because Tomato is Dry and Wheat is Too Wet (and Tomato has high temperature). Rain alone does not change farm status.

---

## 0:35–1:20 — Create Maize (CRUD + matching)

**Do:**
- Click **Add Crop Card**
- Point at the **crop dropdown** — only **Maize** should appear (Tomato, Lettuce, Wheat already have cards)
- Fill in:
  - Crop: **Maize**
  - Location: **South Field**
  - Target min: **50**, max: **70**
  - Normal water: **600**
  - Notes: (optional, can leave blank)
- Click **Save crop card**
- Point at the new Maize card and the **Overall status** changing to **Critical**

**Say (example):**
> To create a card, I pick a crop name from the dropdown. This list is built from unique names in the sensor JSON, **minus** crops that already have a card.  
>  
> When I save, the backend runs **POST /api/crops** and stores the settings in SQLite. The frontend does **not** write to the sensor file.  
>  
> After create, the dashboard **matches** Maize to readings where **crop_name** equals Maize — exact spelling, case-sensitive. It then picks the reading with the **greatest timestamp**, not the last item in the JSON array.  
>  
> Maize’s latest reading has **sensor_status Faulty**, so the condition is **Sensor Problem**, recommended water is **N/A**, and the action is **Check sensor**. Because at least one card is Sensor Problem, **Overall Farm Status becomes Critical**.

**If asked mentally “why Critical?”** — Any Sensor Problem or Invalid Data on any card → Critical. Maize triggered it.

---

## 1:20–1:55 — Edit (immutable crop_name + recalculate)

**Do:**
- Click **Edit** on **Tomato** (or Wheat)
- Point at **“Crop name (read-only)”** — you cannot change it
- Change **location** (e.g. `Greenhouse A Updated`) or change **target min** slightly
- Click **Save changes**
- Show the card text update immediately (and condition may change if you changed targets)

**Say (example):**
> Edit uses **PUT /api/crops/:id**. Only location, targets, normal water, and notes can change. **crop_name is immutable** — if I tried to send a different name, the API returns **400** with “crop_name cannot be changed”.  
>  
> After a successful edit, the app refetches the crop list and **recalculates** the dashboard using the **same sensor readings** already in memory. Analysis is done in React in **analyseCrop** — not stored in the database.

---

## 1:55–2:35 — Delete and re-create (data ownership)

**Do:**
- Click **Delete** on **Maize**
- Confirm the card disappears, count goes back to **3**, status returns to **Watch**
- Click **Add Crop Card** again — **Maize** is back in the dropdown
- Create Maize again with the same values
- Show it matches the **same Faulty** reading again

**Say (example):**
> Delete runs **DELETE /api/crops/:id** and removes **only** the SQLite record. The sensor JSON file is **not** modified — there are still five Maize readings in the file.  
>  
> After delete, Maize becomes available in the create dropdown again. When I recreate the card, it joins to the **same read-only sensor data** as before. That proves the two data sources stay independent.

---

## 2:35–3:20 — Refresh + Sensor History + Invalid Data

**Do:**
- Click **Refresh Sensor Data**
- Point at **last sensor refresh** time updating
- On **Wheat**, click **Sensor History**
- Scroll the list — **5 readings**, **newest first**
- Point at the **top** reading: Too Wet, rain 5 mm
- Point at an **older** reading with moisture **120**: badge **Invalid Data**

**Say (example):**
> Refresh calls **GET /api/readings** again. The backend **re-reads the file from disk** every time — no caching. All cards and Overall status are recalculated.  
>  
> Sensor History shows every reading for that crop, sorted newest first. Importantly, it uses the **same analyseCrop function** as the main cards — I did not copy the rules twice.  
>  
> One older Wheat reading has **soil_moisture 120**. The backend still returns it because the file is **structurally valid**. React applies the decision table and labels it **Invalid Data** — that is an Online reading with a value outside 0–100. Recommended water is N/A and the action is **Check reading**.

**Optional one-liner on priority:**
> If a reading were both Faulty and out of range, **Sensor Problem wins** — we check sensor status before Invalid Data.

---

## 3:20–3:50 — Decision table recap + close

**Do:**
- Scroll past all cards one more time
- Optionally mention the green success banner after create/edit/delete

**Say (example):**
> To summarise the decision logic for the latest reading:  
> first **Offline or Faulty** → Sensor Problem;  
> then **out-of-range numbers** on an Online reading → Invalid Data;  
> then compare moisture to the card’s target range → **Dry**, **Healthy**, or **Too Wet**.  
> Extra alerts like high temperature and rain are added only for valid Online readings.  
>  
> Overall Farm Status is: No Crops, then Sensor Feed Unavailable, then Critical, then Watch, then Normal.  
>  
> The key idea is one join key — **exact crop_name** — and the **latest timestamp** per crop. Thank you.

**Stop recording** around 3:45–4:30.

---

## What the marker expects to see (checklist)

Use this before you submit the video:

- [ ] Initial load — 3 seeded cards, sensor refresh works
- [ ] Create Maize — 4th card, Sensor Problem, Critical
- [ ] Edit — crop name read-only, card recalculates
- [ ] Delete Maize — card gone, JSON unchanged
- [ ] Re-create Maize — same sensor match
- [ ] Refresh — last refresh updates
- [ ] At least one **Dry**, **Healthy**, **Too Wet** visible
- [ ] **Sensor Problem** or **Invalid Data** shown (Maize + Wheat history)
- [ ] You **explain** crop_name matching and latest timestamp in your own words

---

## Backup lines (if you forget mid-recording)

| Topic | What to say |
| --- | --- |
| **Two data sources** | “Crop Cards are in SQLite; sensor readings are a read-only JSON file.” |
| **Matching** | “We join on exact, case-sensitive crop_name — Tomato does not match tomato.” |
| **Latest reading** | “We sort by timestamp and take the greatest — not the last row in the file.” |
| **Why Critical** | “Any Sensor Problem or Invalid Data on any card makes the farm Critical.” |
| **Why Watch** | “Dry, Too Wet, or high temperature on any card — but not rain alone.” |
| **Invalid vs structural error** | “Bad file → API 500. One bad number in a valid object → Invalid Data in the UI.” |
| **Refresh failure** | “If refresh fails, we keep the last good readings and show an error banner.” |
| **AI use** | “I used Cursor for setup and debugging; I tested matching, priorities, and CRUD myself.” |

---

## Optional: failed refresh demo (+30 seconds)

Only if you are under 4 minutes and want extra marks for loading behaviour:

1. In the backend terminal, press **Ctrl+C** to stop the server
2. In the browser, click **Refresh Sensor Data**
3. Show the **red error banner** — cards and values should **stay** as they were; last refresh time should **not** change
4. Restart backend: `npm start`
5. Refresh again — should work

**Say:**
> If the sensor request fails after we already had data, the dashboard keeps the previous readings and shows an error. It does not wipe the screen.

---

## Ubuntu note (if you record on Linux)

Same steps — from the project folder:

```bash
cd backend && npm install && npm start
# new terminal
cd frontend && npm install && npm run dev
```

Open http://localhost:5173. If `sqlite3` fails to install, run `sudo apt install build-essential python3` and `npm install` again in `backend`.
