const express = require("express");
const db = require("../db"); // Tu conexión SQLite
const router = express.Router();

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

// Clock In
// router.post("/clock-in", (req, res) => {
//   const { userId, checkIn } = req.body;
//   const today = new Date().toISOString().split("T")[0];

//   db.get(`SELECT * FROM times WHERE userId = ? AND DATE(checkIn) = ?`, [userId, today], (err, row) => {
//     if (err) return res.status(500).json({ error: err.message });
//     if (row) return res.status(400).json({ msg: "Ya marcaste entrada hoy" });

//     db.run(`INSERT INTO times (userId, checkIn) VALUES (?, ?)`, [userId, checkIn], function(err) {
//       if (err) return res.status(500).json({ error: err.message });
//       res.json({ msg: "Entrada registrada", id: this.lastID });
//     });
//   });
// });

// Clock In mejorado
router.post("/clock-in", (req, res) => {
  const { userId, checkIn } = req.body;
  const today = new Date().toISOString().split("T")[0];

  // Primero, buscar cualquier registro pendiente (sin checkout)
  db.get(
    `SELECT * FROM times 
     WHERE userId = ? 
     AND checkOut IS NULL`,
    [userId],
    (err, pendingRow) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Si ya hay un registro pendiente, NO permitir nuevo check-in
      if (pendingRow) {
        return res.status(400).json({ 
          success: false,
          msg: "Ya tienes un turno en curso. Debes hacer check-out primero.",
          pendingRecord: pendingRow
        });
      }
      
      // Verificar si ya hizo check-in hoy
      db.get(
        `SELECT * FROM times 
         WHERE userId = ? 
         AND DATE(checkIn) = ?`,
        [userId, today],
        (err2, todayRow) => {
          if (err2) return res.status(500).json({ error: err2.message });
          
          if (todayRow) {
            return res.status(400).json({ 
              success: false,
              msg: "Ya registraste entrada hoy. Si necesitas un nuevo turno, contacta al administrador.",
              existingRecord: todayRow
            });
          }
          
          // Insertar nuevo registro
          db.run(
            `INSERT INTO times (userId, checkIn) VALUES (?, ?)`,
            [userId, checkIn],
            function(err3) {
              if (err3) return res.status(500).json({ error: err3.message });
              res.json({ 
                success: true,
                msg: "Entrada registrada", 
                id: this.lastID,
                checkIn: checkIn
              });
            }
          );
        }
      );
    }
  );
});

// Clock Out
router.post("/clock-out", (req, res) => {
  const { userId, checkOut } = req.body;
  db.run(`UPDATE times SET checkOut = ? WHERE userId = ? AND checkOut IS NULL`, [checkOut, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ msg: "No se encontró entrada pendiente" });
    res.json({ msg: "Salida registrada" });
  });
});

// Estado de hoy
router.get("/status/:userId", (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split("T")[0];

  db.get(`SELECT * FROM times WHERE userId = ? AND DATE(checkIn) = ?`, [userId, today], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.json({ status: "none", canClockIn: true, canClockOut: false });
    res.json({
      status: row.checkOut ? "completed" : "clock-in",
      entryTime: row.checkIn,
      exitTime: row.checkOut || null,
      canClockIn: false,
      canClockOut: !row.checkOut
    });
  });
});

// Historial completo (admin)
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

// Historial por usuario
router.get("/user/:userId", (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT t.id, t.userId, u.name, u.username, t.checkIn, t.checkOut,
           ROUND((julianday(t.checkOut) - julianday(t.checkIn)) * 24, 2) AS hours,
           ROUND(((julianday(t.checkOut) - julianday(t.checkIn)) * 24) * u.salary, 2) AS totalPay
    FROM times t
    LEFT JOIN users u ON t.userId = u.id
    WHERE t.userId = ?
    ORDER BY t.checkIn DESC
  `;
  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });

  // En tu archivo de rutas /hours
router.get("/user-weekly/:userId", (req, res) => {
  const { userId } = req.params;
  
  const query = `
    WITH RECURSIVE dates AS (
      SELECT 
        t.id,
        t.userId,
        u.name,
        u.username,
        u.salary,
        t.checkIn,
        t.checkOut,
        -- Calcular horas trabajadas
        CASE 
          WHEN t.checkOut IS NOT NULL 
          THEN ROUND((julianday(t.checkOut) - julianday(t.checkIn)) * 24, 2)
          ELSE 0 
        END as hours,
        -- Calcular fecha sin hora (para agrupar por día)
        DATE(t.checkIn) as workDate,
        -- Calcular inicio de semana (lunes)
        DATE(t.checkIn, 'weekday 1') as weekStart
      FROM times t
      LEFT JOIN users u ON t.userId = u.id
      WHERE t.userId = ? AND t.checkOut IS NOT NULL
      ORDER BY t.checkIn DESC
    )
    SELECT 
      weekStart,
      -- Formatear semana como "Lun DD/MM - Dom DD/MM"
      weekStart || ' - ' || DATE(weekStart, '+6 days') as weekRange,
      -- Agrupar por días dentro de la semana
      GROUP_CONCAT(
        workDate || ': ' || hours || ' horas',
        ' | '
      ) as dailyHours,
      -- Sumar total de horas de la semana
      ROUND(SUM(hours), 2) as totalHours,
      -- Calcular pago total de la semana
      ROUND(SUM(hours) * MIN(salary), 2) as totalPay,
      -- Contar días trabajados
      COUNT(DISTINCT workDate) as daysWorked
    FROM dates
    GROUP BY weekStart
    ORDER BY weekStart DESC;
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Si también quieres los registros diarios detallados
    const detailedQuery = `
      SELECT 
        t.id,
        DATE(t.checkIn) as date,
        strftime('%Y-%m-%d', t.checkIn) as formattedDate,
        strftime('%A', t.checkIn) as dayName,
        t.checkIn,
        t.checkOut,
        ROUND((julianday(t.checkOut) - julianday(t.checkIn)) * 24, 2) as hours,
        ROUND(((julianday(t.checkOut) - julianday(t.checkIn)) * 24) * u.salary, 2) as dailyPay,
        DATE(t.checkIn, 'weekday 1') as weekStart
      FROM times t
      LEFT JOIN users u ON t.userId = u.id
      WHERE t.userId = ? AND t.checkOut IS NOT NULL
      ORDER BY t.checkIn DESC
    `;

    db.all(detailedQuery, [userId], (err2, dailyRecords) => {
      if (err2) return res.status(500).json({ error: err2.message });
      
      // Organizar registros diarios por semana
      const weeklyData = rows.map(week => {
        const weekDailyRecords = dailyRecords.filter(record => 
          record.weekStart === week.weekStart
        );
        
        return {
          ...week,
          dailyRecords: weekDailyRecords,
          weekStartDate: week.weekStart,
          weekEndDate: new Date(new Date(week.weekStart).getTime() + 6 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0]
        };
      });

      res.json({
        userId,
        weeklySummary: weeklyData,
        dailyRecords, // Todos los registros diarios
        totals: {
          totalHours: weeklyData.reduce((sum, week) => sum + week.totalHours, 0),
          totalPay: weeklyData.reduce((sum, week) => sum + week.totalPay, 0),
          totalWeeks: weeklyData.length
        }
      });
    });
  });
});
});

module.exports = router;
