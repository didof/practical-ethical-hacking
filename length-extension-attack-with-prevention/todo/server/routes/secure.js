import express from "express";
import { authenticateHmacSha256 } from "../auth.js";
import { log } from "../logger.js";

export const secureRouter = express.Router();

secureRouter.post("/webhook_secure", authenticateHmacSha256, (req, res) => {
  log.title("WEBHOOK SECURE RECEIVED A REQUEST!");
  log.info(`Parsed Request Body: ${JSON.stringify(req.body)}`);
  log.info(`Body keys: ${Object.keys(req.body).join(', ')}`);
  
  // Check if this is an attempt to execute the make_admin command
  if (req.body.command === 'make_admin') {
    log.error("!! MALICIOUS COMMAND DETECTED: make_admin !!");
    log.critical("!! BUT THIS REQUEST SHOULD NEVER GET HERE WITH A FORGED SIGNATURE !!");
    log.success("!! IF YOU SEE THIS, HMAC VALIDATION FAILED (which shouldn't happen) !!");
    
    // Even if somehow we got here (which we shouldn't with HMAC),
    // let's not execute the command
    return res.status(403).json({ 
      status: "failure", 
      message: "Nice try! But this endpoint is protected with HMAC.",
      attack_blocked: true
    });
  }
  
  // For legitimate requests
  log.success("Valid authenticated request received.");
  res.status(200).json({ 
    status: "success", 
    message: "Valid request received and authenticated with HMAC.",
    body_received: req.body,
    security: "HMAC-SHA256 protected"
  });
});