import express from "express";
import { generateVulnerableSha256 } from "../auth.js";
import { log } from "../logger.js";
import { SECRET_KEY } from "../config.js";

export const apiRouter = express.Router();

apiRouter.get("/profile", (req, res) => {
  const user_id = req.query.id;
  if (!user_id) {
    log.warn("API call for profile without a user ID.");
    return res.status(400).json({ error: "Missing user ID." });
  }

  const original_data = `user_id=${user_id}&action=view_profile`;
  const signature = generateVulnerableSha256(SECRET_KEY, Buffer.from(original_data));

  log.info(`Generating a signed payload for user: ${user_id}`);
  res.status(200).json({
    message: "User profile data retrieved.",
    payload: original_data,
    signature: signature
  });
});