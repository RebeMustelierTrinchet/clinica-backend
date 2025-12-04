// const express = require("express");
// const router = express.Router();
// const db = require("../db/index");

// // ========================
// // POST /time → check in / check out
// // ========================
// router.post("/", (req, res) => {
//   const { userId } = req.body;
//   if (!userId) return res.status(400).json({ error: "Falta userId" });

//   const now = new Date().toISOString();

//   db.get(
//     "SELECT * FROM time_logs WHERE userId = ? ORDER BY id DESC LIMIT 1",
//     [userId],
//     (err, lastLog) => {
//       if (err) return res.status(500).json({ error: err.message });

//       let type = "checkin";
//       if (lastLog && lastLog.type === "checkin") type = "checkout";

//       const stmt =
//         "INSERT INTO time_logs (userId, type, dateTime) VALUES (?, ?, ?)";

//       db.run(stmt, [userId, type, now], function (err) {
//         if (err) return res.status(500).json({ error: err.message });

//         res.json({
//           message: `Usuario ${type} a las ${now}`,
//           type,
//           dateTime: now,
//           logId: this.lastID,
//         });
//       });
//     }
//   );
// });

// // ========================
// // GET /time/summary/:userId → resumen de horas trabajadas
// // ========================
// router.get("/summary/:userId", (req, res) => {
//   const userId = req.params.userId;

//   db.all(
//     "SELECT * FROM time_logs WHERE userId = ? ORDER BY dateTime ASC",
//     [userId],
//     (err, rows) => {
//       if (err) return res.status(500).json({ error: err.message });

//       if (!rows.length) {
//         return res.json({ totalHours: 0, totalPay: 0 });
//       }

//       let totalMs = 0;

//       for (let i = 0; i < rows.length; i += 2) {
//         if (rows[i + 1]) {
//           const start = new Date(rows[i].dateTime);
//           const end = new Date(rows[i + 1].dateTime);
//           totalMs += end - start;
//         }
//       }

//       const totalHours = totalMs / (1000 * 60 * 60);

//       db.get("SELECT salary FROM users WHERE id = ?", [userId], (err, user) => {
//         if (err) return res.status(500).json({ error: err.message });

//         const totalPay = user ? totalHours * user.salary : 0;

//         res.json({
//           totalHours,
//           totalPay,
//         });
//       });
//     }
//   );
// });

// // ========================
// // GET /time/summary-all → horas trabajadas de TODOS los usuarios
// // ========================
// router.get("/summary-all", (req, res) => {
//   // 1. Obtener todos los usuarios
//   db.all("SELECT id, name, salary FROM users", [], (err, users) => {
//     if (err) return res.status(500).json({ error: err.message });

//     // 2. Obtener todos los logs de tiempo
//     db.all("SELECT * FROM time_logs ORDER BY dateTime ASC", [], (err, logs) => {
//       if (err) return res.status(500).json({ error: err.message });

//       const summaries = [];

//       users.forEach(user => {
//         const userLogs = logs.filter(l => l.userId === user.id);
//         let totalMs = 0;

//         for (let i = 0; i < userLogs.length; i += 2) {
//           if (userLogs[i + 1]) {
//             const start = new Date(userLogs[i].dateTime);
//             const end = new Date(userLogs[i + 1].dateTime);
//             totalMs += end - start;
//           }
//         }

//         const totalHours = totalMs / (1000 * 60 * 60);
//         const totalPay = totalHours * (user.salary || 0);

//         // Último movimiento
//         const lastLog = userLogs[userLogs.length - 1] || null;

//         summaries.push({
//           userId: user.id,
//           name: user.name,
//           salary: user.salary,
//           totalHours: Number(totalHours.toFixed(2)),
//           totalPay: Number(totalPay.toFixed(2)),
//           lastMovement: lastLog ? {
//             type: lastLog.type,
//             dateTime: lastLog.dateTime
//           } : null
//         });
//       });

//       res.json(summaries);
//     });
//   });
// });


const express = require("express");
const router = express.Router();
const db = require("../db/index");

// ===============================
// GET /time/history → historial de TODOS
// ===============================
router.get("/history", (req, res) => {
  const query = `
    SELECT 
      t.id,
      t.userId,
      u.name,
      u.username,
      u.salary,
      t.checkIn,
      t.checkOut,
      ROUND((julianday(t.checkOut) - julianday(t.checkIn)) * 24, 2) AS hours,
      ROUND(((julianday(t.checkOut) - julianday(t.checkIn)) * 24) * u.salary, 2) AS totalPay
    FROM times t
    LEFT JOIN users u ON t.userId = u.id
    ORDER BY t.checkIn DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    console.log("📌 /time/history returned:", rows); // <── AQUI EL LOG

    res.json(rows); // importante: mandar array directamente
  });
});

module.exports = router;
