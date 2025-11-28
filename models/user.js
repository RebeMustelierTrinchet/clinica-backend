// Estructura de un usuario
// Para simplificar, se puede usar un array en memoria o JSON en producción real
const users = [
  {
    id: 1,
    email: "admin@example.com",
    password: "$2b$10$.s2cEcD0h7oQtNX9SGMh0u2YOlOeEMUWZI6.aQyvKPxOKR.GIoQkS",
    role: "admin"
  },

  // 👷 Worker 1 (123456)
  {
    id: 2,
    email: "worker1@example.com",
    password: "$2b$10$.s2cEcD0h7oQtNX9SGMh0u2YOlOeEMUWZI6.aQyvKPxOKR.GIoQkS",
    role: "worker",
    salary: 1200
  },

  // 👷 Worker 2 (123456)
  {
    id: 3,
    email: "worker2@example.com",
    password: "$2b$10$.s2cEcD0h7oQtNX9SGMh0u2YOlOeEMUWZI6.aQyvKPxOKR.GIoQkS",
    role: "worker",
    salary: 1500
  },

  // 👷 Worker 3 (123456)
  {
    id: 4,
    email: "worker3@example.com",
    password: "$2b$10$.s2cEcD0h7oQtNX9SGMh0u2YOlOeEMUWZI6.aQyvKPxOKR.GIoQkS",
    role: "worker",
    salary: 1800
  }

];

module.exports = users;
