const express = require("express");
const pool = require("../db/index");
const router = express.Router();

// ========================
// POST /hours/clock-in
// ========================
router.post("/clock-in", async (req, res) => {
  try {
    const { userId, checkIn } = req.body;
    if (!userId || !checkIn)
      return res.status(400).json({ success: false, msg: "Faltan datos" });

    const today = new Date().toISOString().split("T")[0];

    // Turno abierto
    const openShift = await pool.query(
      `SELECT * FROM times WHERE user_id = $1 AND check_out IS NULL`,
      [userId]
    );

    if (openShift.rows.length > 0) {
      return res.status(400).json({
        success: false,
        msg: "Tienes un turno en curso",
        record: openShift.rows[0]
      });
    }

    // Entrada hoy
    const todayShift = await pool.query(
      `SELECT * FROM times WHERE user_id = $1 AND DATE(check_in) = $2`,
      [userId, today]
    );

    if (todayShift.rows.length > 0) {
      return res.status(400).json({
        success: false,
        msg: "Ya registraste entrada hoy",
        record: todayShift.rows[0]
      });
    }

    // Insert
    const { rows } = await pool.query(
      `INSERT INTO times (user_id, check_in)
       VALUES ($1, $2) RETURNING *`,
      [userId, checkIn]
    );

    res.json({
      success: true,
      msg: "Entrada registrada",
      record: rows[0]
    });
  } catch (err) {
    console.error("❌ clock-in:", err);
    res.status(500).json({ success: false, msg: "Error del servidor" });
  }
});

// ========================
// POST /hours/clock-out
// ========================
router.post("/clock-out", async (req, res) => {
  try {
    const { userId, checkOut } = req.body;
    if (!userId || !checkOut)
      return res.status(400).json({ success: false, msg: "Faltan datos" });

    const { rows } = await pool.query(
      `UPDATE times
       SET check_out = $1
       WHERE user_id = $2 AND check_out IS NULL
       RETURNING *`,
      [checkOut, userId]
    );

    if (rows.length === 0)
      return res.status(404).json({
        success: false,
        msg: "No hay turno activo"
      });

    res.json({
      success: true,
      msg: "Salida registrada",
      record: rows[0]
    });
  } catch (err) {
    console.error("❌ clock-out:", err);
    res.status(500).json({ success: false, msg: "Error del servidor" });
  }
});

// ========================
// GET /hours/status/:userId
// ========================
router.get("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const { rows } = await pool.query(
      `SELECT * FROM times WHERE user_id = $1 AND DATE(check_in) = $2`,
      [userId, today]
    );

    if (rows.length === 0) {
      return res.json({
        status: "none",
        canClockIn: true,
        canClockOut: false
      });
    }

    const row = rows[0];

    res.json({
      status: row.check_out ? "completed" : "clock-in",
      entryTime: row.check_in,
      exitTime: row.check_out,
      canClockIn: false,
      canClockOut: !row.check_out
    });
  } catch (err) {
    console.error("❌ status:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// ========================
// GET /hours/history (admin)
// ========================
router.get("/history", async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id,
        t.userid AS "userId",
        u.name,
        u.username,
        u.salary,
        t.checkin  AS "checkIn",
        t.checkout AS "checkOut",
        CAST(
          EXTRACT(EPOCH FROM (t.checkout - t.checkin)) / 3600
          AS NUMERIC(10,2)
        ) AS hours,
        CAST(
          (EXTRACT(EPOCH FROM (t.checkout - t.checkin)) / 3600) * u.salary
          AS NUMERIC(10,2)
        ) AS "totalPay"
      FROM times t
      JOIN users u ON u.id = t.userid
      WHERE t.checkout IS NOT NULL
      ORDER BY t.checkin DESC
    `;

    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("❌ history:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// ========================
// GET /hours/user/:userId
// ========================
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { rows } = await pool.query(`
      SELECT 
        t.id,
        t.check_in,
        t.check_out,
        ROUND(EXTRACT(EPOCH FROM (t.check_out - t.check_in))/3600, 2) AS hours
      FROM times t
      WHERE t.user_id = $1
      ORDER BY t.check_in DESC
    `, [userId]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Error del servidor" });
  }
});

module.exports = router;
