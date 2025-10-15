import sqlite3 from "sqlite3";
import Table from "cli-table3";
import chalk from "chalk";
import { log } from "./logger.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, "database.db");

const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READONLY,
  (err) => {
    if (err) {
      log.error(`Error connecting to the database: ${err.message}`);
      return;
    }
    log.info("Connected to the SQLite database.");
  }
);

const table = new Table({
  head: [
    chalk.white.bold("ID"),
    chalk.white.bold("Email"),
    chalk.white.bold("Phone"),
    chalk.white.bold("Is Admin"),
  ],
  colWidths: [5, 30, 20, 15],
});

const sql = `SELECT id, email, phone, isAdmin FROM users`;

db.all(sql, [], (err, rows) => {
  if (err) {
    log.error(`Error running SQL query: ${err.message}`);
    db.close();
    return;
  }

  if (rows.length === 0) {
    log.warn("No users found in the database.");
  } else {
    rows.forEach((row) => {
      table.push([
        row.id,
        row.email,
        row.phone,
        row.isAdmin === 1 ? chalk.green("true") : chalk.gray("false"),
      ]);
    });
    log.info("User table:");
    console.log(table.toString());
  }

  db.close((closeErr) => {
    if (closeErr) {
      log.error(`Error closing the database: ${closeErr.message}`);
    }
    log.info("Database connection closed.");
  });
});
