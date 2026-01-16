// routes/clinicalHistory.js
const express = require("express");
const router = express.Router();
const pool = require("../db/index"); // tu pool PostgreSQL

// GET - historial completo
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clinical_history ORDER BY dateTime DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener historial clínico" });
  }
});

// POST - agregar registro clínico
router.post("/", async (req, res) => {
  const { patientName, worker, dateTime, itemsUsed, service, totalCharged } = req.body;

  try {
    let serviceSalary = 0;

    // 1️⃣ Validar items y stock
    for (let used of itemsUsed) {
      const itemResult = await pool.query("SELECT * FROM inventory WHERE id = $1", [used.itemId]);
      const item = itemResult.rows[0];

      if (!item) return res.status(400).json({ error: `Item con id ${used.itemId} no existe` });
      if (item.stock < used.qty)
        return res.status(400).json({ error: `Stock insuficiente para ${item.name}. Disponible: ${item.stock}` });

      serviceSalary += used.qty * (item.salary || 0);
    }

    // 2️⃣ Restar stock
    for (let used of itemsUsed) {
      await pool.query("UPDATE inventory SET stock = stock - $1 WHERE id = $2", [used.qty, used.itemId]);
    }

    // 3️⃣ Crear registro clínico
    const newRecordQuery = `
      INSERT INTO clinical_history
      (patientName, worker, dateTime, service, totalCharged, itemsUsed)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const newRecordResult = await pool.query(newRecordQuery, [
      patientName,
      worker,
      dateTime || new Date(),
      service,
      totalCharged,
      JSON.stringify(itemsUsed)
    ]);

    const newRecord = newRecordResult.rows[0];

    res.json({
      message: "Registro clínico creado correctamente",
      record: { ...newRecord, serviceSalary },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al crear registro clínico" });
  }
});

module.exports = router;
