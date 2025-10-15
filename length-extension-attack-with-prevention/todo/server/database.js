import sqlite3 from "sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { log } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, "database.db");

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    log.error(`Error connecting to the database: ${err.message}`);
    return;
  }

  log.info("Connected to the SQLite database.");

  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (err) {
      log.error(`Error checking for users table: ${err.message}`);
      return;
    }

    if (row) {
      log.info("Users table already exists. Skipping initialization.");
      return;
    }

    log.info("Users table not found. Initializing schema and data.");
    db.serialize(() => {
      db.run(
        `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          phone TEXT,
          isAdmin INTEGER DEFAULT 0
        );
      `,
        (createErr) => {
          if (createErr) {
            log.error(`Error creating users table: ${createErr.message}`);
            return;
          }
          log.success("Users table created successfully.");
          
          const stmt = db.prepare(
            "INSERT INTO users (email, phone, isAdmin) VALUES (?, ?, ?)"
          );
          stmt.run("user1@example.com", "1234567890", 0);
          stmt.run("user2@example.com", "0987654321", 1);
          stmt.finalize();
          log.success("Default users inserted.");
        }
      );
    });
  });
});