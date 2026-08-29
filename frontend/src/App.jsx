import { useEffect, useState } from "react";
import { getCrops, getReadings, createCrop, updateCrop, deleteCrop } from "./services/api";
import {
  getLatestReading,
  analyseCrop,
  calculateFarmStatus,
  getAvailableCropNames,
} from "./utils/analysis";
import "./App.css";

function statusBadgeClass(status) {
  const key = status.toLowerCase().replace(/\s+/g, "-");
  return `badge badge-${key}`;
}

function conditionBadgeClass(condition) {
  if (condition === "N/A") return "badge badge-na";
  const key = condition.toLowerCase().replace(/\s+/g, "-");
  return `badge badge-${key}`;
}

function CropFormFields({ form, setForm, showCropSelect, availableNames }) {
  return (
    <div className="form-grid">
      {showCropSelect ? (
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
      ) : (
        <p className="readonly-field full-width">
          Crop name (read-only): <strong>{form.crop_name}</strong>
        </p>
      )}
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
        Target min (%)
        <input
          required
          type="number"
          value={form.target_min}
          onChange={(e) => setForm({ ...form, target_min: e.target.value })}
        />
      </label>
      <label>
        Target max (%)
        <input
          required
          type="number"
          value={form.target_max}
          onChange={(e) => setForm({ ...form, target_max: e.target.value })}
        />
      </label>
      <label>
        Normal water (L)
        <input
          required
          type="number"
          value={form.normal_water}
          onChange={(e) => setForm({ ...form, normal_water: e.target.value })}
        />
      </label>
      <label className="full-width">
        Notes
        <input
          maxLength={500}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </label>
    </div>
  );
}

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
      setMessage("Sensor data refreshed.");
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
    setShowCreate(false);
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
    return (
      <main className="app">
        <div className="loading-state">
          <div className="spinner" />
          Loading dashboard…
        </div>
      </main>
    );
  }

  if (cropsError) {
    return (
      <main className="app">
        <div className="panel">
          <p className="banner banner-error">{cropsError}</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="dashboard-header">
        <h1>SmartFarm Crop Dashboard</h1>
        <p className="subtitle">GreenFields Farm — crop cards + live sensor feed</p>
      </header>

      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Overall status</span>
          <span className={statusBadgeClass(farmStatus)}>{farmStatus}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Crop cards</span>
          <span className="stat-value">{crops.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Last sensor refresh</span>
          <span className="stat-value">{lastRefresh}</span>
        </div>
      </section>

      <div className="toolbar">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!sensorAvailable || availableNames.length === 0}
          onClick={() => {
            setShowCreate(!showCreate);
            setEditingId(null);
          }}
        >
          {showCreate ? "Cancel" : "Add Crop Card"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleRefresh}>
          Refresh Sensor Data
        </button>
      </div>

      {sensorError && <p className="banner banner-error">{sensorError}</p>}
      {message && <p className="banner banner-success">{message}</p>}

      {showCreate && (
        <form onSubmit={handleCreate} className="panel">
          <h2>Add Crop Card</h2>
          {formError && <p className="banner banner-error">{formError}</p>}
          <CropFormFields
            form={form}
            setForm={setForm}
            showCropSelect
            availableNames={availableNames}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save crop card</button>
          </div>
        </form>
      )}

      {crops.length === 0 ? (
        <div className="empty-state panel">
          <p>No crop cards yet. Add a crop when the sensor feed is available.</p>
        </div>
      ) : (
        <section className="card-grid">
          {results.map((result) => (
            <article key={result.crop.id} className="crop-card">
              <div className="crop-card-header">
                <div>
                  <h2>{result.crop.crop_name}</h2>
                  <p className="location">{result.crop.location}</p>
                </div>
                <span className={conditionBadgeClass(result.condition)}>{result.condition}</span>
              </div>

              <div className="crop-card-body">
                <div className="detail-row">
                  <span className="detail-label">Target moisture</span>
                  <span className="detail-value">
                    {result.crop.target_min}–{result.crop.target_max}%
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Normal water</span>
                  <span className="detail-value">{result.crop.normal_water} L</span>
                </div>

                {result.latest_reading ? (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Latest reading</span>
                      <span className="detail-value">{result.latest_reading.timestamp}</span>
                    </div>
                    <div className="sensor-grid">
                      <div className="sensor-stat">
                        <span className="value">{result.latest_reading.soil_moisture}%</span>
                        <span className="unit-label">Moisture</span>
                      </div>
                      <div className="sensor-stat">
                        <span className="value">{result.latest_reading.temperature}°C</span>
                        <span className="unit-label">Temp</span>
                      </div>
                      <div className="sensor-stat">
                        <span className="value">{result.latest_reading.rainfall} mm</span>
                        <span className="unit-label">Rain</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="detail-label">Sensor data unavailable</p>
                )}

                <div className="detail-row">
                  <span className="detail-label">Recommended</span>
                  <span className="detail-value">{result.recommended_water}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Alerts</span>
                  <span className="detail-value">
                    {result.alerts.length ? result.alerts.join(", ") : "None"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Action</span>
                  <span className="detail-value">{result.action}</span>
                </div>
              </div>

              <div className="crop-card-footer">
                <button type="button" className="btn btn-secondary" onClick={() => startEdit(result.crop)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger" onClick={() => handleDelete(result.crop.id)}>
                  Delete
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setHistoryCrop(result.crop)}>
                  Sensor History
                </button>
              </div>

              {editingId === result.crop.id && (
                <form onSubmit={handleUpdate} className="edit-form crop-card-body">
                  {formError && <p className="banner banner-error">{formError}</p>}
                  <CropFormFields form={form} setForm={setForm} showCropSelect={false} />
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">Save changes</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </section>
      )}

      {historyCrop && (
        <section className="panel">
          <div className="panel-header">
            <h2>Sensor History — {historyCrop.crop_name}</h2>
            <button type="button" className="btn btn-ghost" onClick={() => setHistoryCrop(null)}>
              Close
            </button>
          </div>
          <ul className="history-list">
            {readings
              .filter((r) => r.crop_name === historyCrop.crop_name)
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
              .map((reading) => {
                const analysed = analyseCrop(historyCrop, reading);
                return (
                  <li key={reading.timestamp} className="history-item">
                    <div>
                      <strong>{reading.timestamp}</strong>
                      <div className="history-meta">
                        Moisture {reading.soil_moisture}% · {reading.temperature}°C · {reading.rainfall} mm · {reading.sensor_status}
                      </div>
                    </div>
                    <span className={conditionBadgeClass(analysed.condition)}>{analysed.condition}</span>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </main>
  );
}

export default App;
