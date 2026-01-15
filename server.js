require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// Importar rutas
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const hoursRoutes = require("./routes/hours");
const inventoryRouter = require("./routes/inventory");
const clinicalRoutes = require("./routes/clinicalHistory"); 
const timeRoutes = require("./routes/time");
const reportsRoutes = require("./routes/reports");

// Usar rutas
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/hours", hoursRoutes);
app.use("/clinical", clinicalRoutes);
app.use("/inventory", inventoryRouter);
app.use("/time", timeRoutes);
app.use("/reports", reportsRoutes);

app.get("/", (req, res) => {
  res.send("Servidor Express funcionando!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Servidor funcionando en el puerto ${PORT}`);
});
