const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/user/:username", (req, res) => {
  const { username } = req.params;

  console.log(`📊 Buscando reporte para usuario: ${username}`);

  const sql = `
    SELECT 
      ch.id as clinicalId,
      ch.dateTime,
      ch.patientName,
      ch.service,
      ch.totalCharged,
      ch.itemsUsed,
      u.id as userId,
      u.name,
      u.username,
      u.salary as hourlySalary,
      t.checkIn,
      t.checkOut
    FROM clinical_history ch
    JOIN users u ON u.username = ch.worker
    LEFT JOIN times t 
      ON t.userId = u.id AND DATE(t.checkIn) = DATE(ch.dateTime)
    WHERE u.username = ?
    ORDER BY ch.dateTime DESC
  `;

  db.all(sql, [username], (err, rows) => {
    if (err) {
      console.error("❌ Error en query:", err);
      return res.status(500).json({ error: err.message });
    }

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
      const date = r.dateTime.split('T')[0]; // Solo la fecha
      
      if (!daysMap[date]) {
        daysMap[date] = {
          date: date,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          clinicalRecords: [],
          totalHours: 0,
          totalCharged: 0,
          totalCommission: 0,
          hourlySalary: r.hourlySalary || 0
        };
      }
      
      // Agregar registro clínico
      let itemsUsed = [];
      try {
        itemsUsed = JSON.parse(r.itemsUsed || "[]");
      } catch (e) {
        console.warn("Error parsing itemsUsed:", e);
      }
      
      const clinicalRecord = {
        id: r.clinicalId,
        patientName: r.patientName,
        service: r.service,
        totalCharged: parseFloat(r.totalCharged) || 0,
        itemsUsed: itemsUsed,
        dateTime: r.dateTime
      };
      
      daysMap[date].clinicalRecords.push(clinicalRecord);
      daysMap[date].totalCharged += parseFloat(r.totalCharged) || 0;
      
      // Calcular comisión (10% del totalCharged)
      const commission = (parseFloat(r.totalCharged) || 0) * 0.1;
      daysMap[date].totalCommission += commission;
    });

    // Calcular horas trabajadas y pago por hora
    Object.values(daysMap).forEach(day => {
      if (day.checkIn && day.checkOut) {
        const checkInTime = new Date(day.checkIn);
        const checkOutTime = new Date(day.checkOut);
        const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        day.totalHours = parseFloat(hours.toFixed(2));
      } else {
        day.totalHours = 0;
      }
      
      // Pago por horas trabajadas
      day.hoursPay = parseFloat((day.totalHours * day.hourlySalary).toFixed(2));
    });

    // Convertir a array y calcular totales
    const dailyRecords = Object.values(daysMap).map(day => ({
      date: day.date,
      checkIn: day.checkIn,
      checkOut: day.checkOut,
      hours: day.totalHours,
      hoursPay: day.hoursPay || 0,
      commission: parseFloat(day.totalCommission.toFixed(2)),
      clinicalRecords: day.clinicalRecords,
      clinicalCount: day.clinicalRecords.length,
      totalDaily: parseFloat(((day.hoursPay || 0) + day.totalCommission).toFixed(2))
    }));

    // Calcular totales generales
    const totals = dailyRecords.reduce((acc, day) => ({
      hours: acc.hours + (day.hours || 0),
      payment: acc.payment + (day.hoursPay || 0),
      commission: acc.commission + (day.commission || 0),
      clinicalCount: acc.clinicalCount + (day.clinicalCount || 0)
    }), { hours: 0, payment: 0, commission: 0, clinicalCount: 0 });

    // Redondear totales
    totals.hours = parseFloat(totals.hours.toFixed(2));
    totals.payment = parseFloat(totals.payment.toFixed(2));
    totals.commission = parseFloat(totals.commission.toFixed(2));

    // Organizar por semanas
    const weeklyData = organizeByWeeks(dailyRecords);

    console.log(`📈 Totales para ${username}:`, {
      days: dailyRecords.length,
      totalHours: totals.hours,
      totalPayment: totals.payment,
      totalCommission: totals.commission,
      clinicalRecords: totals.clinicalCount
    });

    res.json({
      success: true,
      username: username,
      user: {
        id: rows[0].userId,
        name: rows[0].name,
        username: rows[0].username,
        hourlySalary: rows[0].hourlySalary
      },
      dailyRecords: dailyRecords,
      weeklyData: weeklyData,
      totals: totals
    });
  });
});

// Función para organizar por semanas
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
  
  // Calcular totales por semana
  Object.values(weeksMap).forEach(week => {
    week.dailyRecords.forEach(day => {
      week.totalHours += day.hours || 0;
      week.totalPay += day.hoursPay || 0;
      week.totalCommission += day.commission || 0;
      week.clinicalCount += day.clinicalCount || 0;
    });
    
    // Redondear
    week.totalHours = parseFloat(week.totalHours.toFixed(2));
    week.totalPay = parseFloat(week.totalPay.toFixed(2));
    week.totalCommission = parseFloat(week.totalCommission.toFixed(2));
  });
  
  return Object.values(weeksMap);
}

function getWeekStart(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Lunes como inicio de semana
  const weekStart = new Date(date);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

module.exports = router;