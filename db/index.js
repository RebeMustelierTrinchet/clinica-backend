const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error abriendo DB:', err);
  else console.log('Conectado a SQLite');
});

// db.run("DROP TABLE IF EXISTS inventory", (err) => {
//   if (err) console.error(err);
//   else console.log("🗑️ Tabla inventory eliminada");
// });
// Crear tablas si no existen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    username TEXT UNIQUE,
    password TEXT,
    salary REAL,
    role TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    unit TEXT,
    stock INTEGER,
    costPerUnit REAL,
    salary REAL NOT NULL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clinical_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientName TEXT,
    worker TEXT NOT NULL,
    dateTime TEXT,
    service TEXT,
    totalCharged REAL,
    itemsUsed TEXT,  -- guardamos JSON string
    FOREIGN KEY(workerId) REFERENCES users(id)
  )`);

  
  db.run(`CREATE TABLE IF NOT EXISTS time_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  type TEXT,        -- 'checkin' o 'checkout'
  dateTime TEXT,
  FOREIGN KEY(userId) REFERENCES users(id)
  )`);
  // Crear tabla de marcaje de horas
db.run(`
  CREATE TABLE IF NOT EXISTS times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    checkIn TEXT,
    checkOut TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

// db.run(`
//   CREATE TABLE IF NOT EXISTS inventory (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   name TEXT NOT NULL,
//   type TEXT,
//   unit TEXT,
//   stock INTEGER NOT NULL DEFAULT 0,
//   costPerUnit REAL NOT NULL
// )
// `);

});

module.exports = db;
