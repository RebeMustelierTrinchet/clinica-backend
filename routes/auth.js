const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db/index");
const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ msg: "Error servidor" });
    if (!user) return res.status(400).json({ msg: "Usuario no encontrado" });

    const validPass = bcrypt.compareSync(password, user.password);
    if (!validPass) return res.status(400).json({ msg: "Contraseña incorrecta" });

    // =============================
    // 1. ADMIN → ACCESO SIN HORAS
    // =============================
    if (user.role === "admin") {
      return res.json({
        token: "fakeToken",
        user,
        message: "Bienvenido administrador",
      });
    }

    // =============================
    // 2. TRABAJADOR → horas auto
    // =============================

    db.get(
      "SELECT * FROM times WHERE userId = ? AND checkOut IS NULL",
      [user.id],
      (err, openEntry) => {
        if (err) return res.status(500).json({ msg: "Error al buscar hora abierta" });

        // CASE A: NO HA HECHO CHECK-IN
        if (!openEntry) {
          db.run(
            "INSERT INTO times (userId, checkIn) VALUES (?, datetime('now'))",
            [user.id],
            function (err) {
              if (err) return res.status(500).json({ msg: "Error creando check-in" });

              return res.json({
                token: "fakeToken",
                user,
                message: `CHECK-IN registrado a las ${new Date().toLocaleString()}`,
              });
            }
          );
        } 
        // CASE B: YA TIENE CHECK-IN → hacer salida
        else {
          db.run(
            "UPDATE times SET checkOut = datetime('now') WHERE id = ?",
            [openEntry.id],
            function (err) {
              if (err) return res.status(500).json({ msg: "Error creando check-out" });

              db.get(
                `SELECT 
                    (julianday(checkOut) - julianday(checkIn)) * 24 AS hours
                 FROM times WHERE id = ?`,
                [openEntry.id],
                (err, row) => {
                  const hours = row.hours.toFixed(2);
                  const pay = (row.hours * user.salary).toFixed(2);

                  return res.json({
                    token: "fakeToken",
                    user,
                    message: `CHECK-OUT registrado. Horas: ${hours}h — Pago: $${pay}`
                  });
                }
              );
            }
          );
        }
      }
    );
  });
});

module.exports = router;
