const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Importar rutas
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const hoursRoutes = require("./routes/hours");
const inventoryRouter = require("./routes/inventory");
const clinicalRoutes = require("./routes/clinicalHistory"); 
const timeRoutes = require("./routes/time");

// Usar rutas
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/hours", hoursRoutes);
app.use("/clinical", clinicalRoutes);
app.use("/inventory", inventoryRouter);
app.use("/time", timeRoutes);



app.get("/", (req, res) => {
  res.send("Servidor Express funcionando!");
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor funcionando en http://localhost:${PORT}`);
  console.log(`📊 Rutas disponibles:`);
  console.log(`   GET  /test`);
  console.log(`   GET  /hours/test/:userId`);
  console.log(`   GET  /hours/user-weekly/:userId`);
  console.log(`   GET  /hours/history`);
  console.log(`   GET  /hours/status/:userId`);
  console.log(`   POST /hours/clock-in`);
  console.log(`   POST /hours/clock-out`);
});