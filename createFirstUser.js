const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

// Archivo donde guardas los usuarios
const usersFile = path.join(__dirname, "users.txt"); // Cambia si tu archivo tiene otro nombre

async function createFirstUser() {
  let data = "";

  // Leer archivo si existe
  if (fs.existsSync(usersFile)) {
    data = fs.readFileSync(usersFile, "utf8");

    // Revisar si ya existe el user 'admin'
    if (data.includes("admin")) {
      console.log("⚠️ El usuario 'admin' ya existe");
      return;
    }
  }

  // Crear hash de contraseña
  const hashedPassword = await bcrypt.hash("12345678", 10); // Contraseña inicial

  // Determinar el siguiente id
  let nextId = 1;
  if (data.trim() !== "") {
    const lines = data.trim().split("\n");
    const lastLine = lines[lines.length - 1];
    nextId = parseInt(lastLine.split("|")[0]) + 1;
  }

  // Formato de usuario: id|user|password|role
  const newUser = `${nextId}|admin|${hashedPassword}|admin\n`;

  // Guardar en el archivo
  fs.appendFileSync(usersFile, newUser, "utf8");

  console.log("✅ Primer user 'admin' creado con éxito");
}

createFirstUser();

