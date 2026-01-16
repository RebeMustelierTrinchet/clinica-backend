const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db/index");

const router = express.Router();

// GET /users
router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, name, username, role, salary FROM users ORDER BY id"
  );
  res.json(rows);
});

// GET /users/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(
    "SELECT id, name, username, role, salary FROM users WHERE id = $1",
    [id]
  );

  if (rows.length === 0)
    return res.status(404).json({ msg: "Usuario no encontrado" });

  res.json(rows[0]);
});

// POST /users  ✅ (ESTA ES LA QUE TE FALTABA)
router.post("/", async (req, res) => {
  const { name, username, password, role, salary } = req.body;

  if (!name || !username || !password)
    return res.status(400).json({ msg: "Faltan datos" });

  const hash = bcrypt.hashSync(password, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, username, password, role, salary)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, username, role`,
      [name, username, hash, role || "worker", salary || 0]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505")
      return res.status(400).json({ msg: "Usuario ya existe" });

    res.status(500).json({ msg: "Error del servidor" });
  }
});
// DELETE /users/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json({
      success: true,
      msg: "Usuario eliminado",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Error DELETE /users/:id", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});


module.exports = router;
