const express = require("express");
const router = express.Router();
const pool = require("../db/index"); // Conexión pg

// ===============================
// GET /time/history → historial de TODOS
// ===============================
router.get("/history", async (req, res) => {
  const query = `
    SELECT 
      t.id,
      t.userid AS "userId",
      u.name,
      u.username,
      u.salary,
      t.checkin AS "checkIn",
      t.checkout AS "checkOut",
      ROUND(
        (EXTRACT(EPOCH FROM (t.checkout - t.checkin)) / 3600)::numeric,
        2
      ) AS hours,
      ROUND(
        ((EXTRACT(EPOCH FROM (t.checkout - t.checkin)) / 3600) * u.salary)::numeric,
        2
      ) AS "totalPay"
    FROM times t
    LEFT JOIN users u ON t.userid = u.id
    WHERE t.checkout IS NOT NULL
    ORDER BY t.checkin DESC;
  `;

  try {
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error en /time/history:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
