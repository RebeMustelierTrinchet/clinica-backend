const express = require("express");
const bcrypt = require("bcryptjs");
const users = require("../models/user");

const router = express.Router();

// GET /users → listar usuarios
router.get("/", (req, res) => {
  res.json(users);
});

// POST /users → crear usuario
router.post("/", (req, res) => {
  const { username, password, name, salary, role } = req.body;
  const hashed = bcrypt.hashSync(password, 8);
  const newUser = { id: Date.now(), username, password: hashed, name, salary, role };
  users.push(newUser);
  res.json(newUser);
});

// PUT /users/:id → actualizar usuario
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, salary, password } = req.body;
  const user = users.find(u => u.id == id);
  if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

  if (name) user.name = name;
  if (salary) user.salary = salary;
  if (password) user.password = bcrypt.hashSync(password, 8);

  res.json(user);
});

// DELETE /users/:id → eliminar usuario
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id == id);
  if (index === -1) return res.status(404).json({ msg: "Usuario no encontrado" });
  users.splice(index, 1);
  res.json({ msg: "Usuario eliminado" });
});

module.exports = router;
