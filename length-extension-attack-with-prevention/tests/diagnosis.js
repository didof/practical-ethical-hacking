import crypto from 'crypto';
import { generateExtendedSignature, generateSha256Padding } from '../attacker/attack.js';

console.log("=== DIAGNOSIS SCRIPT ===\n");

const SECRET_KEY = "your-super-secret-key";
const original_data = "user_id=1&action=view_profile";

console.log("Step 1: Test basic SHA-256");
console.log("=".repeat(50));
const test1 = Buffer.concat([Buffer.from(SECRET_KEY), Buffer.from(original_data)]);
const hash1 = crypto.createHash('sha256').update(test1).digest('hex');
console.log(`Input: SECRET + "${original_data}"`);
console.log(`Length: ${test1.length} bytes`);
console.log(`Hash: ${hash1}`);
console.log();

console.log("Step 2: Calculate padding for original message");
console.log("=".repeat(50));
const orig_len = SECRET_KEY.length + original_data.length;
console.log(`Original message length: ${orig_len} bytes (${SECRET_KEY.length} + ${original_data.length})`);
const padding = generateSha256Padding(orig_len);
console.log(`Padding length: ${padding.length} bytes`);
console.log(`Padding (hex): ${padding.toString('hex')}`);
console.log(`Message + padding length: ${orig_len + padding.length} bytes (${(orig_len + padding.length) % 64 === 0 ? 'OK - multiple of 64' : 'ERROR'})`);
console.log();

console.log("Step 3: Perform length extension");
console.log("=".repeat(50));
const data_to_append = "&command=make_admin";
console.log(`Appending: "${data_to_append}"`);

const result = generateExtendedSignature(
  hash1,
  SECRET_KEY.length,
  Buffer.from(original_data),
  Buffer.from(data_to_append)
);

console.log(`Forged body length: ${result.forged_body.length} bytes`);
console.log(`Forged signature: ${result.forged_signature_hex}`);
console.log();

console.log("Step 4: Verify - what would server compute?");
console.log("=".repeat(50));
const server_input = Buffer.concat([Buffer.from(SECRET_KEY), result.forged_body]);
const server_hash = crypto.createHash('sha256').update(server_input).digest('hex');

console.log(`Server would hash: SECRET + forged_body`);
console.log(`Server input length: ${server_input.length} bytes`);
console.log(`Server would compute: ${server_hash}`);
console.log(`Our forged signature: ${result.forged_signature_hex}`);
console.log();

if (server_hash === result.forged_signature_hex) {
  console.log("✅✅✅ SUCCESS! Signatures match! ✅✅✅");
  console.log("The length extension attack will work!");
  console.log();
  console.log("If the attack still fails, the problem is likely:");
  console.log("  1. Server not running (node app.js)");
  console.log("  2. Network/connection issue");
  console.log("  3. Request not being sent correctly");
} else {
  console.log("❌❌❌ FAILURE! Signatures don't match! ❌❌❌");
  console.log("The length extension implementation has a bug.");
  console.log();
  
  // More detailed debugging
  console.log("Detailed comparison:");
  const ours = Buffer.from(result.forged_signature_hex, 'hex');
  const theirs = Buffer.from(server_hash, 'hex');
  
  for (let i = 0; i < 32; i++) {
    const match = ours[i] === theirs[i] ? '✓' : '✗';
    console.log(`  Byte ${i.toString().padStart(2)}: ours=${ours[i].toString(16).padStart(2,'0')} server=${theirs[i].toString(16).padStart(2,'0')} ${match}`);
  }
  
  console.log();
  console.log("Debugging info:");
  console.log(`  Original data length: ${original_data.length}`);
  console.log(`  Glue padding length: ${result.glue_padding.length}`);
  console.log(`  Appended data length: ${data_to_append.length}`);
  console.log(`  Forged body length: ${result.forged_body.length}`);
  console.log(`  Expected: ${original_data.length} + ${result.glue_padding.length} + ${data_to_append.length} = ${original_data.length + result.glue_padding.length + data_to_append.length}`);
}

console.log();
console.log("Step 5: Check body structure");
console.log("=".repeat(50));
console.log("Forged body breakdown:");
console.log(`  Original: "${result.forged_body.slice(0, original_data.length).toString()}"`);
console.log(`  Padding:  ${result.forged_body.slice(original_data.length, original_data.length + result.glue_padding.length).toString('hex')}`);
console.log(`  Appended: "${result.forged_body.slice(original_data.length + result.glue_padding.length).toString()}"`);