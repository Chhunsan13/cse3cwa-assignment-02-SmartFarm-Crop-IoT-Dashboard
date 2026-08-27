import { useEffect, useState } from "react";
import { getCrops, getReadings, createCrop, updateCrop, deleteCrop } from "./services/api";
import {
  getLatestReading,
  analyseCrop,
  calculateFarmStatus,
  getAvailableCropNames,
} from "./utils/analysis";
import "./App.css";

function App() {
  const [crops, setCrops] = useState([]);
  const [readings, setReadings] = useState([]);
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const [lastRefresh, setLastRefresh] = useState("Never");
  const [loading, setLoading] = useState(true);
  const [cropsError, setCropsError] = useState("");
  const [sensorError, setSensorError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [historyCrop, setHistoryCrop] = useState(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
  crop_name: "",
  location: "",
  target_min: "",
  target_max: "",
  normal_water: "",
  notes: "",
});

  async function loadCrops() {
    const data = await getCrops();
    setCrops(data);
    setCropsError("");
  }

  async function loadReadings() {
    const data = await getReadings();
    setReadings(data);
    setSensorAvailable(true);
    setLastRefresh(new Date().toLocaleTimeString());
    setSensorError("");
  }
  async function handleRefresh() {
    try {
      await loadReadings();
    } catch {
      setSensorError("Refresh failed. Previous sensor data is still shown.");
    }
  }
  
  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");

    try {
      await createCrop({
        crop_name: form.crop_name,
        location: form.location,
        target_min: Number(form.target_min),
        target_max: Number(form.target_max),
        normal_water: Number(form.normal_water),
        notes: form.notes,
      });
      await loadCrops();
      setShowCreate(false);
      setForm({
        crop_name: "",
        location: "",
        target_min: "",
        target_max: "",
        normal_water: "",
        notes: "",
      });
      setMessage("Crop card created.");
    } catch (err) {
      setFormError(err.message);
    }
  }

  function startEdit(crop) {
    setEditingId(crop.id);
    setFormError("");
    setForm({
      crop_name: crop.crop_name,
      location: crop.location,
      target_min: String(crop.target_min),
      target_max: String(crop.target_max),
      normal_water: String(crop.normal_water),
      notes: crop.notes || "",
    });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setFormError("");

    try {
      await updateCrop(editingId, {
        location: form.location,
        target_min: Number(form.target_min),
        target_max: Number(form.target_max),
        normal_water: Number(form.normal_water),
        notes: form.notes,
      });
      await loadCrops();
      setEditingId(null);
      setMessage("Crop card updated.");
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCrop(id);
      await loadCrops();
      if (historyCrop && historyCrop.id === id) {
        setHistoryCrop(null);
      }
      setMessage("Crop card deleted.");
    } catch (err) {
      setFormError(err.message);
    }
  }

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        await loadCrops();
      } catch {
        setCropsError("Could not load crop cards.");
        setLoading(false);
        return;
      }

      try {
        await loadReadings();
      } catch {
        setSensorAvailable(false);
        setLastRefresh("Never");
        setSensorError("Sensor feed unavailable.");
      }

      setLoading(false);
    }

    loadAll();
  }, []);

  const results = crops.map((crop) =>
    analyseCrop(crop, sensorAvailable ? getLatestReading(crop.crop_name, readings) : null)
  );
  const farmStatus = calculateFarmStatus(results, sensorAvailable);
  const availableNames = getAvailableCropNames(readings, crops);

  if (loading) {
    return <main className="app"><p>Loading...</p></main>;
  }

  if (cropsError) {
    return (
      <main className="app">
        <p className="error">{cropsError}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="app">
      <h1>SmartFarm Crop Dashboard</h1>
      <p>
        Overall Status: <strong>{farmStatus}</strong> · Crop cards: {crops.length} · Last sensor refresh: {lastRefresh}
      </p>
      <p>
        <button
          type="button"
          disabled={!sensorAvailable || availableNames.length === 0}
          onClick={() => setShowCreate(!showCreate)}
        >
          Add Crop Card
        </button>{" "}
        <button type="button" onClick={handleRefresh}>
          Refresh Sensor Data
        </button>
      </p>

      {showCreate && (
        <form onSubmit={handleCreate} className="card">
          <h2>Add Crop Card</h2>
          {formError && <p className="error">{formError}</p>}
          <label>
            Crop
            <select
              required
              value={form.crop_name}
              onChange={(e) => setForm({ ...form, crop_name: e.target.value })}
            >
              <option value="">Select a crop</option>
              {availableNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input
              required
              maxLength={100}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>
          <label>
            Target min
            <input
              required
              type="number"
              value={form.target_min}
              onChange={(e) => setForm({ ...form, target_min: e.target.value })}
            />
          </label>
          <label>
            Target max
            <input
              required
              type="number"
              value={form.target_max}
              onChange={(e) => setForm({ ...form, target_max: e.target.value })}
            />
          </label>
          <label>
            Normal water
            <input
              required
              type="number"
              value={form.normal_water}
              onChange={(e) => setForm({ ...form, normal_water: e.target.value })}
            />
          </label>
          <label>
            Notes
            <input
              maxLength={500}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <button type="submit">Save</button>
        </form>
      )}
      {sensorError && <p className="error">{sensorError}</p>}
      {message && <p>{message}</p>}

      {crops.length === 0 ? (
        <p>No crop cards yet.</p>
      ) : (
        <section className="card-grid">
          {results.map((result) => (
            <article key={result.crop.id} className="card">
              <h2>
                {result.crop.crop_name} — {result.crop.location}
              </h2>
              <p>Target: {result.crop.target_min}–{result.crop.target_max}% · Normal water: {result.crop.normal_water} L</p>
              {result.latest_reading ? (
                <>
                  <p>Latest: {result.latest_reading.timestamp}</p>
                  <p>
                    Moisture: {result.latest_reading.soil_moisture}% · Temperature: {result.latest_reading.temperature} C · Rainfall: {result.latest_reading.rainfall} mm
                  </p>
                </>
              ) : (
                <p>Sensor: N/A</p>
              )}
              <p>Condition: {result.condition}</p>
              <p>Recommended: {result.recommended_water}</p>
              <p>Alert: {result.alerts.length ? result.alerts.join(", ") : "None"}</p>
              <p>Action: {result.action}</p>
              <p>
                <button type="button" onClick={() => startEdit(result.crop)}>Edit</button>{" "}
                <button type="button" onClick={() => handleDelete(result.crop.id)}>Delete</button>{" "}
                <button type="button" onClick={() => setHistoryCrop(result.crop)}>View Sensor History</button>
              </p>

              {editingId === result.crop.id && (
                <form onSubmit={handleUpdate}>
                  {formError && <p className="error">{formError}</p>}
                  <p>Crop name (read-only): {result.crop.crop_name}</p>
                  <label>
                    Location
                    <input
                      required
                      maxLength={100}
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </label>
                  <label>
                    Target min
                    <input
                      required
                      type="number"
                      value={form.target_min}
                      onChange={(e) => setForm({ ...form, target_min: e.target.value })}
                    />
                  </label>
                  <label>
                    Target max
                    <input
                      required
                      type="number"
                      value={form.target_max}
                      onChange={(e) => setForm({ ...form, target_max: e.target.value })}
                    />
                  </label>
                  <label>
                    Normal water
                    <input
                      required
                      type="number"
                      value={form.normal_water}
                      onChange={(e) => setForm({ ...form, normal_water: e.target.value })}
                    />
                  </label>
                  <label>
                    Notes
                    <input
                      maxLength={500}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </label>
                  <button type="submit">Save changes</button>
                  <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </form>
              )}
            </article>
          ))}
        </section>
      )}
          {historyCrop && (
        <section className="card">
          <h2>Sensor History — {historyCrop.crop_name}</h2>
          <button type="button" onClick={() => setHistoryCrop(null)}>Close</button>
          {readings
            .filter((r) => r.crop_name === historyCrop.crop_name)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            .map((reading) => {
              const analysed = analyseCrop(historyCrop, reading);
              return (
                <p key={reading.timestamp}>
                  {reading.timestamp} · Moisture {reading.soil_moisture}% · {reading.sensor_status} · {analysed.condition} · {analysed.action}
                </p>
              );
            })}
        </section>
      )}
    </main>
  );
}

export default App;