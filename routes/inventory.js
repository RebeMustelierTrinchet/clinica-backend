const express = require("express");
const router = express.Router();
const db = require("../db/index");

// --- Obtener todo el inventario ---
router.get("/", async (req, res) => {
  try {
    db.all("SELECT * FROM inventory", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Obtener item por ID ---
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    db.get("SELECT * FROM inventory WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Item no encontrado" });
      res.json(row);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Crear producto ---
router.post("/", async (req, res) => {
  console.log("📦 Recibiendo solicitud POST:", req.body);
  const { 
    name, 
    type = "", 
    unit = "", 
    stock = 0, 
    costPerUnit = 0,
    salary = 0
  } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Nombre válido requerido" });
  }

  if (typeof stock !== "number" || stock < 0) {
    return res.status(400).json({ error: "Stock válido requerido" });
  }

  if (typeof costPerUnit !== "number" || costPerUnit < 0) {
    return res.status(400).json({ error: "Costo válido requerido" });
  }

  try {
    db.run(
      "INSERT INTO inventory (name, type, unit, stock, costPerUnit, salary) VALUES (?, ?, ?, ?, ?, ?)", // 6 placeholders
      [name, type, unit, stock, costPerUnit, salary], // 6 valores
      function (err) {
        if (err) {
          console.error("❌ Error en INSERT:", err.message);
          return res.status(500).json({ error: err.message });
        }
        console.log("✅ Item creado con ID:", this.lastID);
        res.status(201).json({
          id: this.lastID,
          name,
          type,
          unit,
          stock,
          costPerUnit,
          salary
        });
      }
    );
  } catch (error) {
    console.error("❌ Error catch:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Actualizar producto ---
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const { 
    name, 
    type = "", 
    unit = "", 
    stock = 0,
    costPerUnit = 0,
    salary = 0
  } = req.body;

  // Validación
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Nombre válido requerido" });
  }
  if (typeof stock !== "number" || stock < 0) {
    return res.status(400).json({ error: "Stock válido requerido" });
  }
  if (typeof costPerUnit !== "number" || costPerUnit < 0) {
    return res.status(400).json({ error: "Costo válido requerido" });
  }

  try {
    db.run(
      "UPDATE inventory SET name=?, type=?, unit=?, stock=?, costPerUnit=?,salary=? WHERE id=?", // Sin coma extra
      [name, type, unit, stock, costPerUnit, salary, id],
      function (err) {
        if (err) {
          console.error("❌ Error en UPDATE:", err.message);
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: "Item no encontrado" });
        }
        
        // Obtener y devolver el item actualizado
        db.get("SELECT * FROM inventory WHERE id = ?", [id], (err, row) => {
          if (err) {
            console.error("❌ Error obteniendo item actualizado:", err.message);
            return res.status(500).json({ error: err.message });
          }
          console.log("✅ Item actualizado:", row);
          res.json(row);
        });
      }
    );
  } catch (error) {
    console.error("❌ Error catch:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Eliminar producto ---
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    db.run("DELETE FROM inventory WHERE id = ?", [id], function (err) {
      if (err) {
        console.error("❌ Error en DELETE:", err.message);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Item no encontrado" });
      }
      console.log("✅ Item eliminado ID:", id);
      res.json({ 
        message: "Item eliminado",
        id: id
      });
    });
  } catch (error) {
    console.error("❌ Error catch:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;