import crypto from 'crypto';
import { generateExtendedSignature } from '../attacker/attack.js';

const SECRET_KEY = "your-super-secret-key";

console.log("=== MANUAL SIGNATURE VERIFICATION TEST ===\n");

// Test 1: Verify we can generate the same signature as the server
const original_data = "user_id=1&action=view_profile";
const original_message = Buffer.concat([Buffer.from(SECRET_KEY), Buffer.from(original_data)]);
const original_signature = crypto.createHash('sha256').update(original_message).digest('hex');

console.log("TEST 1: Original Signature Generation");
console.log(`Secret: "${SECRET_KEY}" (${SECRET_KEY.length} bytes)`);
console.log(`Data: "${original_data}" (${original_data.length} bytes)`);
console.log(`Combined length: ${original_message.length} bytes`);
console.log(`Original signature: ${original_signature}`);
console.log();

// Test 2: Manually verify SHA-256 padding
console.log("TEST 2: Verify SHA-256 Padding");
const msg_len = SECRET_KEY.length + original_data.length; // 23 + 30 = 53
console.log(`Message length: ${msg_len} bytes`);
const msg_len_bits = msg_len * 8; // 424 bits
console.log(`Message length in bits: ${msg_len_bits}`);

// SHA-256 padding: message + 0x80 + k zero bytes + 64-bit length
// We need: (53 + 1 + k + 8) % 64 === 0
// So: (62 + k) % 64 === 0
// k = 2
const k = (56 - (msg_len + 1) % 64 + 64) % 64;
console.log(`Zero bytes needed (k): ${k}`);
console.log(`Total padding length: ${1 + k + 8} bytes`);
console.log(`Total after padding: ${msg_len + 1 + k + 8} bytes (should be 64: ${msg_len + 1 + k + 8})`);
console.log();

// Test 3: Generate extended signature
console.log("TEST 3: Length Extension Attack");
const data_to_append = "&command=make_admin";
const key_length = SECRET_KEY.length;

console.log(`\nGenerating extended signature...`);
const result = generateExtendedSignature(
  original_signature,
  key_length,
  Buffer.from(original_data),
  Buffer.from(data_to_append)
);

console.log("\nRESULT:");
console.log(`Forged body length: ${result.forged_body.length} bytes`);
console.log(`Glue padding length: ${result.glue_padding.length} bytes`);
console.log(`Forged signature: ${result.forged_signature_hex}`);
console.log();

// Test 4: Verify the forged signature against what the server would compute
console.log("TEST 4: Verify Forged Signature Matches Server Computation");
const server_would_compute = Buffer.concat([Buffer.from(SECRET_KEY), result.forged_body]);
const server_signature = crypto.createHash('sha256').update(server_would_compute).digest('hex');

console.log(`Server input length: ${server_would_compute.length} bytes`);
console.log(`What server computes: ${server_signature}`);
console.log(`Our forged signature: ${result.forged_signature_hex}`);
console.log(`Match: ${server_signature === result.forged_signature_hex ? '✅ YES - ATTACK WORKS!' : '❌ NO - ATTACK BROKEN'}`);
console.log();

if (server_signature !== result.forged_signature_hex) {
  console.log("❌ SIGNATURES DON'T MATCH - DEBUGGING INFO:");
  console.log(`\nServer computation breakdown:`);
  console.log(`  Secret: ${SECRET_KEY.length} bytes`);
  console.log(`  Forged body: ${result.forged_body.length} bytes`);
  console.log(`  Total: ${server_would_compute.length} bytes`);
  
  // Show first few bytes
  console.log(`\nFirst 100 bytes of server input (hex):`);
  console.log(server_would_compute.toString('hex').substring(0, 200));
  
  // Compare the hashes byte by byte
  const ourSig = Buffer.from(result.forged_signature_hex, 'hex');
  const serverSig = Buffer.from(server_signature, 'hex');
  console.log(`\nByte-by-byte comparison:`);
  for (let i = 0; i < 32; i++) {
    if (ourSig[i] !== serverSig[i]) {
      console.log(`  Byte ${i}: ours=${ourSig[i].toString(16).padStart(2, '0')} server=${serverSig[i].toString(16).padStart(2, '0')} ❌`);
    }
  }
} else {
  console.log("✅ SUCCESS! The attack implementation is correct!");
}

// Test 5: Show the forged body structure
console.log("\nTEST 5: Forged Body Structure");
console.log(`Total length: ${result.forged_body.length} bytes`);
console.log(`Hex (first 200 chars): ${result.forged_body.toString('hex').substring(0, 200)}...`);
console.log();

// Try to parse it
try {
  const bodyStr = result.forged_body.toString('utf-8', 0, Math.min(200, result.forged_body.length));
  console.log(`UTF-8 (first 200 chars): ${JSON.stringify(bodyStr)}`);
  
  // Show where each part is
  const originalLen = Buffer.from(original_data).length;
  const paddingLen = result.glue_padding.length;
  console.log(`\nParts breakdown:`);
  console.log(`  [0-${originalLen}] Original data: "${result.forged_body.slice(0, originalLen).toString('utf-8')}"`);
  console.log(`  [${originalLen}-${originalLen + paddingLen}] Glue padding: ${result.glue_padding.toString('hex')}`);
  console.log(`  [${originalLen + paddingLen}-${result.forged_body.length}] Appended data: "${result.forged_body.slice(originalLen + paddingLen).toString('utf-8')}"`);
  
  // Try to parse the whole thing
  console.log(`\nAttempt to parse as URLSearchParams:`);
  const parsed = Object.fromEntries(new URLSearchParams(result.forged_body.toString('utf-8')));
  console.log(`  Parsed: ${JSON.stringify(parsed)}`);
} catch (e) {
  console.log(`  Error: ${e.message}`);
}