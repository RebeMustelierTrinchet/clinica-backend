const express = require("express");
const hours = require("../models/hour");

const router = express.Router();

// POST /hours/clock-in → registrar entrada
router.post("/clock-in", (req, res) => {
  const { userId, date, clockIn } = req.body;

  hours.push({
    id: Date.now(),
    userId,
    date,
    clockIn,
    clockOut: null
  });

  res.json({ msg: "Entrada registrada" });
});

// POST /hours/clock-out → registrar salida
router.post("/clock-out", (req, res) => {
  const { userId, date, clockOut } = req.body;

  const entry = hours.find(h => h.userId === userId && h.date === date);

  if (!entry) return res.status(404).json({ msg: "No se encontró entrada" });

  entry.clockOut = clockOut;

  res.json({ msg: "Salida registrada" });
});


// ⭐⭐⭐ NUEVA RUTA IMPORTANTE ⭐⭐⭐
// GET /hours/status/:userId → saber si el usuario ya marcó hoy
router.get("/status/:userId", (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const record = hours.find(h => h.userId == userId && h.date === today);

  if (!record) {
    return res.json({
      status: "none",       // no ha marcado entrada
      canClockIn: true,
      canClockOut: false
    });
  }

  return res.json({
    status: record.clockOut ? "completed" : "clock-in", 
    entryTime: record.clockIn,
    exitTime: record.clockOut || null,
    canClockIn: false,
    canClockOut: !record.clockOut
  });
});


// GET /hours → ver todas las horas (admin)
router.get("/", (req, res) => {
  res.json(hours);
});

module.exports = router;
