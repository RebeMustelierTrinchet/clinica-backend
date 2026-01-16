const express = require("express");
const pool = require("../db"); // Tu conexión PostgreSQL
const router = express.Router();

// --- Obtener todo el inventario ---
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM inventory ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Obtener item por ID ---
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query("SELECT * FROM inventory WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Item no encontrado" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Crear producto ---
router.post("/", async (req, res) => {
  const { name, type = "", unit = "", stock = 0, costPerUnit = 0, salary = 0 } = req.body;

  if (!name || typeof name !== "string") return res.status(400).json({ error: "Nombre válido requerido" });
  if (typeof stock !== "number" || stock < 0) return res.status(400).json({ error: "Stock válido requerido" });
  if (typeof costPerUnit !== "number" || costPerUnit < 0) return res.status(400).json({ error: "Costo válido requerido" });

  try {
    const result = await pool.query(
      `INSERT INTO inventory (name, type, unit, stock, cost_per_unit, salary)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, type, unit, stock, costPerUnit, salary]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Actualizar producto ---
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const { name, type = "", unit = "", stock = 0, costPerUnit = 0, salary = 0 } = req.body;

  if (!name || typeof name !== "string") return res.status(400).json({ error: "Nombre válido requerido" });
  if (typeof stock !== "number" || stock < 0) return res.status(400).json({ error: "Stock válido requerido" });
  if (typeof costPerUnit !== "number" || costPerUnit < 0) return res.status(400).json({ error: "Costo válido requerido" });

  try {
    const updateResult = await pool.query(
      `UPDATE inventory
       SET name=$1, type=$2, unit=$3, stock=$4, cost_per_unit=$5, salary=$6
       WHERE id=$7
       RETURNING *`,
      [name, type, unit, stock, costPerUnit, salary, id]
    );

    if (updateResult.rows.length === 0) return res.status(404).json({ error: "Item no encontrado" });

    res.json(updateResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Eliminar producto ---
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const deleteResult = await pool.query("DELETE FROM inventory WHERE id = $1 RETURNING *", [id]);
    if (deleteResult.rows.length === 0) return res.status(404).json({ error: "Item no encontrado" });
    res.json({ message: "Item eliminado", deleted: deleteResult.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
