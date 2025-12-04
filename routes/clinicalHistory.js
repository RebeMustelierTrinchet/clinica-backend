const express = require("express");
const router = express.Router();

let clinicalHistory = require("../models/clinicalHistory");
let items = require("../models/items");

// GET - ver historial completo
router.get("/", (req, res) => {
  res.json(clinicalHistory);
});

// POST - agregar registro clínico
router.post("/", (req, res) => {
  const { patientName, workerId, dateTime, itemsUsed, service, totalCharged } = req.body;

  // Validar que los items existan en el inventario
  for (let used of itemsUsed) {
    const item = items.find(i => i.id === used.itemId);
    if (!item) return res.status(400).json({ error: `Item con id ${used.itemId} no existe` });

    if (item.stock < used.qty) {
      return res.status(400).json({
        error: `Stock insuficiente para ${item.name}. Disponible: ${item.stock}`
      });
    }
  }

  // Restar del inventario
  for (let used of itemsUsed) {
    const item = items.find(i => i.id === used.itemId);
    item.stock -= used.qty;
  }

  const newRecord = {
    id: clinicalHistory.length + 1,
    patientName,
    workerId,
    dateTime,
    itemsUsed,
    service,
    totalCharged
  };

  clinicalHistory.push(newRecord);

  res.json({
    message: "Registro clínico creado correctamente",
    record: newRecord,
    updatedInventory: items
  });
});

module.exports = router;
