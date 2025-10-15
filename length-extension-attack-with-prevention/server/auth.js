import crypto from "crypto";
import { SECRET_KEY } from "./config.js";
import { log } from "./logger.js";

/**
 * VULNERABLE: Generates signature using SHA256(secret + message)
 * This is vulnerable to length extension attacks!
 */
export const generateVulnerableSha256 = (secret, message) => {
  const combined = Buffer.concat([Buffer.from(secret), message]);
  const hash = crypto.createHash('sha256')
               .update(combined)
               .digest('hex');
  
  log.info(`[generateVulnerableSha256] Secret length: ${secret.length}`);
  log.info(`[generateVulnerableSha256] Message length: ${message.length}`);
  log.info(`[generateVulnerableSha256] Combined length: ${combined.length}`);
  log.info(`[generateVulnerableSha256] Hash: ${hash}`);
  
  return hash;
};

/**
 * SECURE: Generates HMAC-SHA256
 * This is NOT vulnerable to length extension attacks!
 */
export const generateHmacSha256 = (secret, message) => {
  const hmac = crypto.createHmac('sha256', secret)
                     .update(message)
                     .digest('hex');
  
  log.info(`[generateHmacSha256] HMAC: ${hmac}`);
  
  return hmac;
};

/**
 * Parse body that may contain binary padding from length extension attack
 * This is required to allow the demonstration with such a simple use-case.
 */
export function parseBodyWithBinaryPadding(buffer) {
  const str = buffer.toString('utf-8');
  
  log.info(`[parseBodyWithBinaryPadding] Full string length: ${str.length}`);
  log.info(`[parseBodyWithBinaryPadding] First 100 chars: ${JSON.stringify(str.substring(0, 100))}`);
  
  const params = {};
  
  // Find ALL occurrences of key=value patterns in the string
  // This handles both normal parameters and parameters after binary padding
  const pattern = /([a-zA-Z_][a-zA-Z0-9_]*)=([^&]*)/g;
  
  let match;
  while ((match = pattern.exec(str)) !== null) {
    const key = match[1];
    let value = match[2];
    
    // Clean the value - remove any trailing binary/control characters
    value = value.replace(/[\x00-\x1F\x7F-\xFF]+$/, '');
    
    log.info(`[parseBodyWithBinaryPadding] Found: ${key}=${value}`);
    params[key] = value;
  }
  
  return params;
}

/**
 * VULNERABLE AUTHENTICATION MIDDLEWARE
 * Uses SHA256(secret + message) - susceptible to length extension attacks
 */
export const authenticateVulnerableSha256 = (req, res, next) => {
  log.title("AUTHENTICATING WITH VULNERABLE SHA256");
  
  const providedSignature = req.header('X-Signature');
  const message = req.body;
  
  if (!providedSignature || !message) {
    log.error("Missing signature or body");
    return res.status(401).json({ error: "Unauthorized: Missing signature or body." });
  }

  log.info(`Provided signature: ${providedSignature}`);
  log.info(`Message buffer length: ${message.length} bytes`);
  
  // Compute what the signature SHOULD be using the vulnerable method
  const computedSignature = generateVulnerableSha256(SECRET_KEY, message);
  
  log.info(`Computed signature: ${computedSignature}`);
  log.info(`Signatures match: ${providedSignature === computedSignature}`);

  try {
    const providedSignatureBuffer = Buffer.from(providedSignature, 'hex');
    const computedSignatureBuffer = Buffer.from(computedSignature, 'hex');

    // Use timing-safe comparison
    if (crypto.timingSafeEqual(computedSignatureBuffer, providedSignatureBuffer)) {
      log.success("✅ Signatures match! Authentication successful.");
      
      // Parse the body, handling binary padding from length extension attacks
      const parsedBody = parseBodyWithBinaryPadding(message);
      log.info(`Parsed body: ${JSON.stringify(parsedBody)}`);
      
      req.body = parsedBody;
      next();
    } else {
      log.error("❌ Signatures do NOT match! Authentication failed.");
      return res.status(403).json({ error: "Forbidden: Invalid signature." });
    }
  } catch (e) {
    log.error(`Error during signature verification: ${e.message}`);
    return res.status(403).json({ error: "Forbidden: Invalid signature format." });
  }
};

/**
 * SECURE AUTHENTICATION MIDDLEWARE
 * Uses HMAC-SHA256 - immune to length extension attacks
 */
export const authenticateHmacSha256 = (req, res, next) => {
  log.title("AUTHENTICATING WITH SECURE HMAC-SHA256");
  
  const providedSignature = req.header('X-Signature');
  const message = req.body;
  
  if (!providedSignature || !message) {
    log.error("Missing signature or body");
    return res.status(401).json({ error: "Unauthorized: Missing signature or body." });
  }

  log.info(`Provided signature: ${providedSignature}`);
  log.info(`Message buffer length: ${message.length} bytes`);
  
  // Compute what the HMAC SHOULD be
  const computedSignature = generateHmacSha256(SECRET_KEY, message);
  
  log.info(`Computed HMAC: ${computedSignature}`);
  log.info(`Signatures match: ${providedSignature === computedSignature}`);

  try {
    const providedSignatureBuffer = Buffer.from(providedSignature, 'hex');
    const computedSignatureBuffer = Buffer.from(computedSignature, 'hex');

    // Use timing-safe comparison
    if (crypto.timingSafeEqual(computedSignatureBuffer, providedSignatureBuffer)) {
      log.success("✅ HMAC valid! Authentication successful.");
      
      // Parse body normally (no length extension possible with HMAC)
      try {
        const decodedBody = message.toString('utf-8');
        req.body = Object.fromEntries(new URLSearchParams(decodedBody));
        log.info(`Parsed body: ${JSON.stringify(req.body)}`);
      } catch (e) {
        log.warn(`Could not parse as URLSearchParams: ${e.message}`);
        req.body = message.toString('utf-8');
      }
      
      next();
    } else {
      log.error("❌ HMAC invalid! Authentication failed.");
      log.success("🛡️ HMAC successfully blocked an invalid/forged signature!");
      return res.status(403).json({ 
        error: "Forbidden: Invalid HMAC signature.",
        message: "HMAC-SHA256 prevents length extension attacks!"
      });
    }
  } catch (e) {
    log.error(`Error during HMAC verification: ${e.message}`);
    return res.status(403).json({ error: "Forbidden: Invalid signature format." });
  }
};