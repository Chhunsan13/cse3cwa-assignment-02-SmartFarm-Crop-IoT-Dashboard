const express = require('express');
const cors = require('cors');
const { db, initDb } = require('./db');

const app = express();
const PORT =3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({status: "ok"});
});

app.get("/api/crops", (req, res) => {
    db.all("SELECT * FROM crops ORDER BY id", (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json(rows);
    });
  });
  app.get("/api/crops/:id", (req, res) => {
    db.get("SELECT * FROM crops WHERE id = ?", [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      if (!row) {
        return res.status(404).json({ error: "Crop card not found" });
      }
      res.json(row);
    });
  });
  app.post("/api/crops", (req, res) => {
    const { crop_name, location, target_min, target_max, normal_water, notes } = req.body;
  
    if (!crop_name) {
      return res.status(400).json({ error: "crop_name is required" });
    }
    if (!location || typeof location !== "string" || location.length < 1 || location.length > 100) {
      return res.status(400).json({ error: "location is required" });
    }
    if (typeof target_min !== "number" || typeof target_max !== "number" || typeof normal_water !== "number") {
      return res.status(400).json({ error: "target_min, target_max and normal_water must be numbers" });
    }
    if (target_min < 0 || target_min > 100 || target_max < 0 || target_max > 100 || target_min >= target_max) {
      return res.status(400).json({ error: "invalid target range" });
    }
    if (normal_water <= 0 || normal_water > 10000) {
      return res.status(400).json({ error: "normal_water must be greater than 0 and at most 10000" });
    }
  
    const allowed = ["Tomato", "Lettuce", "Wheat", "Maize"];
    if (!allowed.includes(crop_name)) {
      return res.status(400).json({ error: "crop_name does not exist in sensor data" });
    }
  
    const noteText = notes == null ? "" : String(notes);
    if (noteText.length > 500) {
      return res.status(400).json({ error: "notes must be at most 500 characters" });
    }
  
    const sql = `
      INSERT INTO crops (crop_name, location, target_min, target_max, normal_water, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
  
    db.run(sql, [crop_name, location, target_min, target_max, normal_water, noteText], function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(409).json({ error: "crop_name already exists" });
        }
        return res.status(500).json({ error: "Internal server error" });
      }
  
      db.get("SELECT * FROM crops WHERE id = ?", [this.lastID], (getErr, row) => {
        if (getErr) {
          return res.status(500).json({ error: "Internal server error" });
        }
        res.status(201).json(row);
      });
    });
  });
  

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
    initDb();
});

module.exports = app;
