const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const users = require("../models/user");

const router = express.Router();
const SECRET = "clave-secreta"; // cambiar a env variable en producción

// POST /auth/login
router.post("/login", (req, res) => {
  console.log("BODY RECIBIDO:", req.body); // <- aquí vemos si llega algo
  const { email, password } = req.body;
  console.log("Email:", email, "Password:", password);

  const user = users.find(u => u.email === email);
  console.log("Usuario encontrado:", user);

  if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

  const isMatch = bcrypt.compareSync(password, user.password);
  console.log("Contraseña correcta?", isMatch);

  if (!isMatch) return res.status(400).json({ msg: "Contraseña incorrecta" });

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
  res.json({ token, user });
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  // opcional: manejar token invalidado o solo front-end
  res.json({ msg: "Logout exitoso" });
});

module.exports = router;
