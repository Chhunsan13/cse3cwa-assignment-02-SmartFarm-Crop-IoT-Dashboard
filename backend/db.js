const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "smartfarm.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Could not open database", err.message);
  } else {
    console.log("Connected to SQLite");
  }
});

function initDb() {
    const sql = `
      CREATE TABLE IF NOT EXISTS crops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_name TEXT NOT NULL UNIQUE
          CHECK (crop_name IN ('Tomato','Lettuce','Wheat','Maize')),
        location TEXT NOT NULL,
        target_min REAL NOT NULL CHECK (target_min >= 0 AND target_min <= 100),
        target_max REAL NOT NULL CHECK (target_max >= 0 AND target_max <= 100),
        normal_water REAL NOT NULL CHECK (normal_water > 0 AND normal_water <= 10000),
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK (target_min < target_max)
      )
    `;
  
    db.run(sql, (err) => {
      if (err) {
        console.error("Could not create table", err.message);
        return;
      }
  
      console.log("crops table is ready");
  
      db.get("SELECT COUNT(*) AS count FROM crops", (countErr, row) => {
        if (countErr) {
          console.error("Could not count crops", countErr.message);
          return;
        }
  
        if (row.count > 0) {
          console.log("Seed skipped; crops already exist");
          return;
        }
  
        const insert = `
          INSERT INTO crops (crop_name, location, target_min, target_max, normal_water, notes)
          VALUES
            ('Tomato', 'Greenhouse A', 55, 75, 500, ''),
            ('Lettuce', 'Greenhouse B', 60, 80, 400, ''),
            ('Wheat', 'North Field', 35, 55, 300, '')
        `;
  
        db.run(insert, (insertErr) => {
          if (insertErr) {
            console.error("Could not seed crops", insertErr.message);
          } else {
            console.log("Seeded Tomato, Lettuce, Wheat");
          }
        });
      });
    });
  }
  
  module.exports = { db, initDb };