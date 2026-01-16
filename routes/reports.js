const express = require("express");
const router = express.Router();
const pool = require("../db"); // Tu conexión PostgreSQL

router.get("/user/:username", async (req, res) => {
  const { username } = req.params;

  console.log(`📊 Buscando reporte para usuario: ${username}`);

const sql = `
  SELECT 
    ch.id AS "clinicalId",
    ch.datetime,
    ch.patientname,
    ch.service,
    ch.totalcharged,
    ch.itemsused,
    u.id AS "userId",
    u.name,
    u.username,
    u.salary AS "hourlySalary",
    t.checkin,
    t.checkout
  FROM clinical_history ch
  JOIN users u ON u.id = ch.workerid
  LEFT JOIN times t 
    ON t.userid = u.id 
   AND DATE(t.checkin) = DATE(ch.datetime)
  WHERE u.username = $1
  ORDER BY ch.datetime DESC
`;


  try {
    const result = await pool.query(sql, [username]);
    const rows = result.rows;

    console.log(`✅ Encontrados ${rows.length} registros para ${username}`);

    if (rows.length === 0) {
      return res.json({ 
        success: true,
        username: username,
        dailyRecords: [],
        totals: { hours: 0, payment: 0, commission: 0, clinicalCount: 0 }
      });
    }

    // Agrupar por día
    const daysMap = {};
    rows.forEach(r => {
      const date = r.date_time.toISOString().split('T')[0];

      if (!daysMap[date]) {
        daysMap[date] = {
          date,
          checkIn: r.check_in,
          checkOut: r.check_out,
          clinicalRecords: [],
          totalHours: 0,
          totalCharged: 0,
          totalCommission: 0,
          hourlySalary: r.hourlysalary || 0
        };
      }

      // Parsear items usados
      let itemsUsed = [];
      try { itemsUsed = JSON.parse(r.items_used || "[]"); } 
      catch (e) { console.warn("Error parsing itemsUsed:", e); }

      const clinicalRecord = {
        id: r.clinicalid,
        patientName: r.patient_name,
        service: r.service,
        totalCharged: parseFloat(r.total_charged) || 0,
        itemsUsed,
        dateTime: r.date_time
      };

      daysMap[date].clinicalRecords.push(clinicalRecord);
      daysMap[date].totalCharged += parseFloat(r.total_charged) || 0;

      // Comisión 10%
      const commission = (parseFloat(r.total_charged) || 0) * 0.1;
      daysMap[date].totalCommission += commission;
    });

    // Calcular horas y pago por día
    Object.values(daysMap).forEach(day => {
      if (day.checkIn && day.checkOut) {
        const hours = (new Date(day.checkOut) - new Date(day.checkIn)) / (1000 * 60 * 60);
        day.totalHours = parseFloat(hours.toFixed(2));
      } else {
        day.totalHours = 0;
      }
      day.hoursPay = parseFloat((day.totalHours * day.hourlySalary).toFixed(2));
    });

    // Array de registros diarios
    const dailyRecords = Object.values(daysMap).map(day => ({
      date: day.date,
      checkIn: day.checkIn,
      checkOut: day.checkOut,
      hours: day.totalHours,
      hoursPay: day.hoursPay,
      commission: parseFloat(day.totalCommission.toFixed(2)),
      clinicalRecords: day.clinicalRecords,
      clinicalCount: day.clinicalRecords.length,
      totalDaily: parseFloat(((day.hoursPay || 0) + day.totalCommission).toFixed(2))
    }));

    // Totales generales
    const totals = dailyRecords.reduce((acc, day) => ({
      hours: acc.hours + (day.hours || 0),
      payment: acc.payment + (day.hoursPay || 0),
      commission: acc.commission + (day.commission || 0),
      clinicalCount: acc.clinicalCount + (day.clinicalCount || 0)
    }), { hours: 0, payment: 0, commission: 0, clinicalCount: 0 });

    totals.hours = parseFloat(totals.hours.toFixed(2));
    totals.payment = parseFloat(totals.payment.toFixed(2));
    totals.commission = parseFloat(totals.commission.toFixed(2));

    // Organizar por semanas
    const weeklyData = organizeByWeeks(dailyRecords);

    res.json({
      success: true,
      username: username,
      user: {
        id: rows[0].userid,
        name: rows[0].name,
        username: rows[0].username,
        hourlySalary: rows[0].hourlysalary
      },
      dailyRecords,
      weeklyData,
      totals
    });

  } catch (err) {
    console.error("❌ Error en query:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Funciones auxiliares ---
function organizeByWeeks(dailyRecords) {
  const weeksMap = {};
  dailyRecords.forEach(day => {
    const date = new Date(day.date);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeksMap[weekKey]) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weeksMap[weekKey] = {
        weekStart: weekKey,
        weekEndDate: weekEnd.toISOString().split('T')[0],
        dailyRecords: [],
        totalHours: 0,
        totalPay: 0,
        totalCommission: 0,
        clinicalCount: 0
      };
    }

    weeksMap[weekKey].dailyRecords.push(day);
  });

  Object.values(weeksMap).forEach(week => {
    week.dailyRecords.forEach(day => {
      week.totalHours += day.hours || 0;
      week.totalPay += day.hoursPay || 0;
      week.totalCommission += day.commission || 0;
      week.clinicalCount += day.clinicalCount || 0;
    });

    week.totalHours = parseFloat(week.totalHours.toFixed(2));
    week.totalPay = parseFloat(week.totalPay.toFixed(2));
    week.totalCommission = parseFloat(week.totalCommission.toFixed(2));
  });

  return Object.values(weeksMap);
}

function getWeekStart(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(date);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

module.exports = router;
