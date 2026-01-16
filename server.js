require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();


// Configuración de CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Parseo JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// Importar rutas
// ========================
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const hoursRoutes = require("./routes/hours");
const inventoryRoutes = require("./routes/inventory");
const clinicalRoutes = require("./routes/clinicalHistory"); 
const timeRoutes = require("./routes/time");
const reportsRoutes = require("./routes/reports");

// ========================
// Usar rutas
// ========================
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/hours", hoursRoutes);
app.use("/clinical", clinicalRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/time", timeRoutes);
app.use("/reports", reportsRoutes);

// Ruta raíz
app.get("/", (req, res) => {
  res.send("✅ Servidor Express funcionando!");
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
