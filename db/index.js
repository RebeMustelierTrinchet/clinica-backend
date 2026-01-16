const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "clinic",
  ssl: false // no usar SSL en local
});

async function initDB() {
  try {
    // Probar conexión
    await pool.query("SELECT NOW()");
    console.log("✅ Conectado a PostgreSQL");

    // =======================
    // Crear tablas si no existen
    // =======================

    // USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        username TEXT UNIQUE,
        password TEXT,
        salary REAL,
        role TEXT
      )
    `);

    // INVENTORY
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        name TEXT,
        type TEXT,
        unit TEXT,
        stock INTEGER,
        costPerUnit REAL,
        salary REAL DEFAULT 0
      )
    `);

    // CLINICAL HISTORY
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clinical_history (
        id SERIAL PRIMARY KEY,
        patientName TEXT,
        worker TEXT NOT NULL,
        dateTime TIMESTAMP,
        service TEXT,
        totalCharged REAL,
        itemsUsed JSONB,
        workerId INTEGER REFERENCES users(id)
      )
    `);

    // TIME LOGS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_logs (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id),
        type TEXT,
        dateTime TIMESTAMP
      )
    `);

    // TIMES (checkIn / checkOut)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS times (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id),
        checkIn TIMESTAMP,
        checkOut TIMESTAMP
      )
    `);

    console.log("✅ Tablas inicializadas correctamente en PostgreSQL");
  } catch (err) {
    console.error("❌ Error inicializando DB:", err);
  }
}

// Ejecutar inicialización automáticamente
initDB();

module.exports = pool;
