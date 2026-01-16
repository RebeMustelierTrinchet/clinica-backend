// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db/index");

const router = express.Router();


router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // 🔒 Validación básica (evita 400 confusos)
  if (!username || !password) {
    return res.status(400).json({ msg: "Username y password son requeridos" });
  }

  try {
    // 🔍 Buscar usuario
    const userResult = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ msg: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];

    // 🔑 Validar contraseña
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      return res.status(400).json({ msg: "Contraseña incorrecta" });
    }

    // 🛡️ ADMIN → acceso directo
    if (user.role === "admin") {
      return res.json({
        token: "fakeToken",
        user,
        message: "Bienvenido administrador",
      });
    }

    // ⏱️ TRABAJADOR → check-in / check-out
    const openEntryResult = await pool.query(
      "SELECT * FROM times WHERE userid = $1 AND checkout IS NULL",
      [user.id]
    );

    const openEntry = openEntryResult.rows[0];

    // 🟢 CASE A: NO ha hecho check-in
    if (!openEntry) {
      await pool.query(
        "INSERT INTO times (userid, checkin) VALUES ($1, NOW())",
        [user.id]
      );

      return res.json({
        token: "fakeToken",
        user,
        message: `CHECK-IN registrado a las ${new Date().toLocaleString()}`,
      });
    }

    // 🔴 CASE B: ya tiene check-in → hacer check-out
    await pool.query(
      "UPDATE times SET checkout = NOW() WHERE id = $1",
      [openEntry.id]
    );

    const hoursResult = await pool.query(
      `
      SELECT EXTRACT(EPOCH FROM (checkout - checkin)) / 3600 AS hours
      FROM times WHERE id = $1
      `,
      [openEntry.id]
    );

    const hours = Number(hoursResult.rows[0].hours).toFixed(2);
    const pay = Number(hours * user.salary).toFixed(2);

    return res.json({
      token: "fakeToken",
      user,
      message: `CHECK-OUT registrado. Horas: ${hours}h — Pago: $${pay}`,
    });
  } catch (err) {
    console.error("❌ Error en /auth/login:", err);
    return res.status(500).json({ msg: "Error en el servidor" });
  }
});

module.exports = router;
