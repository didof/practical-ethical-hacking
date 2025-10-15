/**
 * DISCLAIMER
 * 
 * This project is for educational purposes only and is intended to demonstrate a cryptographic vulnerability.
 * It is not intended for malicious use. The author is not responsible for any misuse of this information or the provided code.
 */


import express from "express";
import { authenticateVulnerableSha256 } from "../auth.js";
import { log } from "../logger.js";
import { SECRET_KEY } from "../config.js";
import { db } from "../database.js";

export const vulnerableRouter = express.Router();

vulnerableRouter.post("/webhook_vulnerable", (req, res, next) => {
  log.title("WEBHOOK VULNERABLE - RAW REQUEST RECEIVED");
  log.info(`Raw body type: ${req.body.constructor.name}`);
  log.info(`Raw body length: ${req.body.length} bytes`);
  log.info(`Raw body (hex): ${req.body.toString('hex')}`);
  log.info(`Raw body (utf8): ${req.body.toString('utf8')}`);
  log.info(`X-Signature header: ${req.header('X-Signature')}`);
  log.info(`Secret key: "${SECRET_KEY}" (${SECRET_KEY.length} bytes)`);
  
  // Try to parse the body to see what parameters are present
  try {
    const bodyStr = req.body.toString('utf-8');
    const params = Object.fromEntries(new URLSearchParams(bodyStr));
    log.info(`Parsed parameters: ${JSON.stringify(params)}`);
  } catch (e) {
    log.warn(`Could not parse body as URLSearchParams: ${e.message}`);
  }
  
  next();
}, authenticateVulnerableSha256, (req, res) => {
  log.title("WEBHOOK VULNERABLE - AUTHENTICATION PASSED!");
  log.success(`Parsed Request Body: ${JSON.stringify(req.body)}`);
  
  // Log all keys in the body
  log.info(`Body keys: ${Object.keys(req.body).join(', ')}`);
  
  if (req.body.command === 'make_admin') {
    const userId = req.body.user_id;
    
    if (!userId) {
      log.error("make_admin command received but no user_id found!");
      return res.status(400).json({
        status: "error",
        message: "user_id is required for make_admin command"
      });
    }
    
    log.critical(`!! EXECUTING MALICIOUS COMMAND: Making user ${userId} an admin !!`);
    
    // Update the user in the database
    db.run(
      "UPDATE users SET isAdmin = 1 WHERE id = ?",
      [userId],
      function(err) {
        if (err) {
          log.error(`Failed to update user ${userId}: ${err.message}`);
          return res.status(500).json({
            status: "error",
            message: "Database error",
            error: err.message
          });
        }
        
        if (this.changes === 0) {
          log.warn(`User ${userId} not found in database`);
          return res.status(404).json({
            status: "error",
            message: `User with id ${userId} not found`
          });
        }
        
        log.critical(`!! SUCCESS: User ${userId} is now an admin! !!`);
        log.critical("!! THE LENGTH EXTENSION ATTACK WORKED !!");
        log.warn("!! Run 'node server/database.debug.js' to see the updated database !!");
        
        // Fetch and return the updated user
        db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
          if (err) {
            log.error(`Error fetching updated user: ${err.message}`);
          } else {
            log.success(`Updated user: ${JSON.stringify(user)}`);
          }
          
          return res.status(200).json({ 
            status: "success", 
            message: "User privileges escalated.",
            attack_successful: true,
            user_id: userId,
            admin_status: true
          });
        });
      }
    );
    
    return; // Important: return here to prevent the code below from executing
  }
  
  log.success("Valid request received (no malicious command detected).");
  res.status(200).json({ 
    status: "success", 
    message: "Valid request received.",
    body_received: req.body
  });
});