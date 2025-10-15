import express from "express";
import { db } from "../database.js";
import { log } from "../logger.js";

export const signupRouter = express.Router();

signupRouter.post("/signup", (req, res) => {
  const { email, phone, isAdmin } = req.body;
  if (!email || !phone) {
    log.warn("Signup attempt with missing email or phone.");
    return res.status(400).json({ error: "Email and phone are required." });
  }
  db.run("INSERT INTO users (email, phone, isAdmin) VALUES (?, ?, ?)",
    [email, phone || null, isAdmin || 0], function(err) {
      if (err) {
        log.error("Failed to create user:", err.message);
        return res.status(500).json({ error: "Failed to create user." });
      }
      log.success(`New user created with ID: ${this.lastID}`);
      res.status(201).json({ id: this.lastID, email, phone });
    }
  );
});