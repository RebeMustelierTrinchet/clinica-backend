// hours.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // Asegúrate de que la ruta sea correcta

// Crear tabla times si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    checkIn TEXT,
    checkOut TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

// ========================
// POST /hours/clock-in → registrar entrada
// ========================
router.post("/clock-in", (req, res) => {
  const { userId, checkIn } = req.body;
  
  // Revisar si ya hay entrada hoy
  const today = new Date().toISOString().split("T")[0];
  const checkQuery = `SELECT * FROM times WHERE userId = ? AND DATE(checkIn) = ?`;
  db.get(checkQuery, [userId, today], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ msg: "Ya marcaste entrada hoy" });

    // Insertar entrada
    const query = `INSERT INTO times (userId, checkIn, checkOut) VALUES (?, ?, NULL)`;
    db.run(query, [userId, checkIn], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ msg: "Entrada registrada", id: this.lastID });
    });
  });
});

// ========================
// POST /hours/clock-out → registrar salida
// ========================
router.post("/clock-out", (req, res) => {
  const { userId, checkOut } = req.body;

  const query = `
    UPDATE times 
    SET checkOut = ? 
    WHERE userId = ? AND checkOut IS NULL
  `;

  db.run(query, [checkOut, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ msg: "No se encontró entrada pendiente" });
    res.json({ msg: "Salida registrada" });
  });
});

// ========================
// GET /hours/status/:userId → saber si el usuario ya marcó hoy
// ========================
router.get("/status/:userId", (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split("T")[0];

  const query = `SELECT * FROM times WHERE userId = ? AND DATE(checkIn) = ?`;
  db.get(query, [userId, today], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row) {
      return res.json({
        status: "none",       // no ha marcado entrada
        canClockIn: true,
        canClockOut: false
      });
    }

    res.json({
      status: row.checkOut ? "completed" : "clock-in",
      entryTime: row.checkIn,
      exitTime: row.checkOut || null,
      canClockIn: false,
      canClockOut: !row.checkOut
    });
  });
});

// ========================
// GET /hours → ver todas las horas (admin)
// ========================
router.get("/", (req, res) => {
  const query = `
    SELECT t.id, t.userId, u.name, u.username, t.checkIn, t.checkOut
    FROM times t
    LEFT JOIN users u ON t.userId = u.id
    ORDER BY t.checkIn DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ========================
// GET /hours/history → ver historial con horas y pago
// ========================
router.get("/history", (req, res) => {
  const query = `
    SELECT t.id, t.userId, u.name, u.username, t.checkIn, t.checkOut,
           ROUND((julianday(t.checkOut) - julianday(t.checkIn)) * 24, 2) AS hours,
           ROUND(((julianday(t.checkOut) - julianday(t.checkIn)) * 24) * u.salary, 2) AS totalPay
    FROM times t
    LEFT JOIN users u ON t.userId = u.id
    ORDER BY t.checkIn DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
