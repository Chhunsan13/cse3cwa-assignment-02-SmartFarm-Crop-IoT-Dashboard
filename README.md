# SmartFarm Crop IoT Dashboard

CSE3CWA Assignment 2 — GreenFields Farm crop dashboard. Staff manage Crop Cards in SQLite. A read-only JSON file simulates an IoT sensor feed. The React app joins the two sources by exact `crop_name` and shows each crop’s current condition.

## URLs (development)

| App | URL |
| --- | --- |
| Frontend (React / Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:3001 |

Vite proxies `/api` to the backend, so the browser can call `/api/crops` and `/api/readings` from the frontend origin.

## Installation and run

Requires **Node.js 18+**. Works on **Windows and Ubuntu/Linux**. Paths use Node’s `path.join`, so the same code runs on both.

### Ubuntu quick setup

```bash
# Install Node if needed (example with NodeSource or nvm)
node -v   # should be 18+
npm -v

git clone <your-repo-url>
cd cse3cwa-assignment-02-SmartFarm-Crop-IoT-Dashboard

# Backend terminal
cd backend
npm install
npm start

# Frontend terminal (new window/tab)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Backend: http://localhost:3001.

If `sqlite3` fails to install on Ubuntu, install build tools once, then reinstall:

```bash
sudo apt update
sudo apt install -y build-essential python3
cd backend
rm -rf node_modules
npm install
```

### Windows (same idea)

```bash
cd backend
npm install
npm start
```

```bash
cd frontend
npm install
npm run dev
```

### Reset database

Delete `backend/smartfarm.db` and restart the backend:

- Ubuntu: `rm backend/smartfarm.db`
- Windows: delete the file in File Explorer, or `del backend\smartfarm.db`

The table is created again and seeded with Tomato, Lettuce, and Wheat only. Maize is not seeded. The SQLite file is gitignored.

### Presentation / video script

See **[PRESENTATION_SCRIPT.md](PRESENTATION_SCRIPT.md)** for a timed 3–5 minute demo script (what to click and what to say).

## Database

SQLite stores Crop Cards only (`backend/smartfarm.db`, created on first start).

On startup, `db.js` creates the `crops` table if it does not exist, counts rows, and inserts Tomato, Lettuce, and Wheat **only when the table is empty**. Restarting the server does not duplicate rows.

Analysis results (condition, recommended water, alerts, Overall Farm Status, last refresh) are **not** stored in SQLite. They are calculated in React.

## API routes and error format

Failed responses always use JSON: `{ "error": "message" }`.

| Method | Route | Success |
| --- | --- | --- |
| GET | `/api/crops` | 200 + array of Crop Cards |
| GET | `/api/crops/:id` | 200 + one Crop Card |
| POST | `/api/crops` | 201 + created Crop Card |
| PUT | `/api/crops/:id` | 200 + updated Crop Card (`crop_name` cannot change) |
| DELETE | `/api/crops/:id` | 200 + `{ "deleted": true, "id": number }` |
| GET | `/api/readings` | 200 + raw 20-reading array (re-read from disk every request) |

Example errors: 400 invalid fields, 400 `crop_name cannot be changed`, 400 `crop_name does not exist in sensor data`, 409 `crop_name already exists`, 404 `Crop card not found`, 500 `Sensor data file is invalid`, 500 `Internal server error`.

There are no POST/PUT/DELETE routes for sensor readings.

## Data ownership

| Data | Where it lives | Who may change it |
| --- | --- | --- |
| Crop Cards | SQLite `crops` table | User through CRUD |
| Sensor readings | `backend/data/sensor-readings.json` | Read-only in the app |
| Dashboard results | React state | Calculated after each successful load/CRUD |

## Matching and latest timestamp

`crop_name` is the only join key. Matching is exact and case-sensitive (`Tomato` matches `Tomato`, not `tomato`).

For each Crop Card, the app filters readings with the same `crop_name`, then selects the **greatest timestamp**. Array order is ignored. Timestamps use `YYYY-MM-DDTHH:mm:ss`, so they can be compared as strings with `localeCompare`.

## Dashboard decision priority

For a latest reading, checks run top to bottom. The first match wins:

1. `Offline` or `Faulty` → **Sensor Problem** (water N/A, action Check sensor)
2. Online but moisture/temperature/rainfall outside 0–100 / 0–50 / 0–50 → **Invalid Data**
3. moisture &lt; target_min → **Dry** (recommended water = `normal_water`)
4. moisture between min and max inclusive → **Healthy** (0 L)
5. moisture &gt; target_max → **Too Wet** (0 L)

Extra alerts (valid Online only): temperature &gt; 35 → High temperature; rainfall &gt;= 5 → Rain detected. These do not change recommended water.

Overall Farm Status: No Crops (empty list) → Sensor Feed Unavailable (cards exist but no successful sensor load) → Critical (any Sensor Problem or Invalid Data) → Watch (Dry, Too Wet, or High temperature) → otherwise Normal. Rain detected alone does not change farm status.

## Sensor JSON — AI prompt and checks

The file `backend/data/sensor-readings.json` was generated from the assignment prompt, then checked and corrected by hand.

**Prompt used:**

```
Generate a valid JSON array containing exactly 20 simulated SmartFarm sensor readings.
Use these crop_name values exactly and create exactly 5 readings for each:
Tomato, Lettuce, Wheat, Maize.
Every object must contain exactly these fields:
crop_name, timestamp, soil_moisture, temperature, rainfall, sensor_status, notes.
Use timestamps in YYYY-MM-DDTHH:mm:ss format. Timestamps must be distinct
within each crop. The same timestamp may be used by different crops. Mix the
array order so the latest reading is not always the last object.
Use sensor_status only as Online, Offline or Faulty. Most numeric values must
be realistic: soil_moisture 0-100, temperature 0-50, rainfall 0-50. Include
exactly one structurally valid older reading with one deliberately out-of-range
numeric value. That invalid reading must not be the latest reading for its crop.
Make the latest readings produce these cases with the default Crop Card settings:
- latest Tomato: Online, Dry, temperature above 35 C;
- latest Lettuce: Online and Healthy;
- latest Wheat: Online, Too Wet, rainfall at least 5 mm;
- latest Maize: sensor_status Faulty.
Return only the JSON array. Do not use Markdown or explanation.
```

**Checks / corrections:**

- Confirmed 20 objects and five readings per crop.
- Mixed array order so the latest reading is not the last item.
- Latest Tomato / Lettuce / Wheat / Maize match the four required dashboard cases.
- One older Wheat reading has `soil_moisture: 120` (Invalid Data in Sensor History, not the latest Wheat reading).
- Filenames: the first save used `sensor-reading.json` (missing “s”). It was renamed to `sensor-readings.json` so `GET /api/readings` could find it.

**How uniqueness and matching were verified:** create Maize once (success), create Maize again (HTTP 409). Matching uses `===` on `crop_name`.

**How latest timestamps were verified:** readings for each crop are unsorted in the file; the UI still shows the greatest timestamp (for example Tomato `2026-08-05T09:00:00`, not the last Tomato object in the array).

## AI use

- **Tools:** Cursor (Composer) for project setup, Express routes, SQLite seeding, React dashboard wiring, CSS, and debugging.
- **What I checked / implemented:** Crop Card validation and error status codes, sensor file counts and latest-case values, decision-table order, and the Create / Edit / Delete / Refresh flow in the browser.
- **Decision I made:** keep analysis only in `frontend/src/utils/analysis.js` so Crop Cards, Sensor History, and Overall Farm Status share one rule set, and keep sensor JSON read-only on the backend.

## Project limitation

The sensor feed is a static JSON file, not live hardware. Refresh re-reads the same file from disk. Failed later refreshes keep the last successful readings; they do not pull new live IoT data.

A 3–5 minute demo video is submitted separately via the LMS.
