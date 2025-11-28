const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Importar rutas
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const hoursRoutes = require("./routes/hours");

// Usar rutas
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/hours", hoursRoutes);


app.get("/", (req, res) => {
  res.send("Servidor Express funcionando!");
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
