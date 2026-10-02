const Database = require("better-sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "carekey.db");

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('DOCTOR', 'ADMIN')),
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    dob TEXT,
    gender TEXT,
    blood_group TEXT,
    phone TEXT,
    email TEXT,
    allergies TEXT,
    medical_history TEXT,
    medications TEXT,
    embedding TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id TEXT UNIQUE NOT NULL,
    doctor_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    similarity REAL,
    access_type TEXT NOT NULL,
    access_status TEXT NOT NULL,
    read_only INTEGER NOT NULL DEFAULT 1,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
  );

  CREATE INDEX IF NOT EXISTS idx_patients_patient_id
  ON patients(patient_id);

  CREATE INDEX IF NOT EXISTS idx_patients_full_name
  ON patients(full_name);

  CREATE INDEX IF NOT EXISTS idx_audit_doctor_id
  ON audit_logs(doctor_id);

  CREATE INDEX IF NOT EXISTS idx_audit_patient_id
  ON audit_logs(patient_id);

  CREATE INDEX IF NOT EXISTS idx_audit_timestamp
  ON audit_logs(timestamp);
`);

module.exports = db;