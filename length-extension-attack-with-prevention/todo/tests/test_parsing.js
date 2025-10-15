import { parseBodyWithBinaryPadding } from "../server/auth.js"

// Simulate the forged body structure
const original = "user_id=1&action=view_profile";
const padding = Buffer.from([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xa8]);
const appended = "&command=make_admin";

const forgedBody = Buffer.concat([
  Buffer.from(original),
  padding,
  Buffer.from(appended)
]);

console.log("=== TEST BODY PARSING ===\n");
console.log("Forged body structure:");
console.log(`  Original: "${original}"`);
console.log(`  Padding:  ${padding.toString('hex')} (${padding.length} bytes)`);
console.log(`  Appended: "${appended}"`);
console.log();

const parsed = parseBodyWithBinaryPadding(forgedBody);

console.log("\n=== PARSED RESULT ===");
console.log(JSON.stringify(parsed, null, 2));
console.log();

if (parsed.command === 'make_admin') {
  console.log("✅ SUCCESS! The command parameter was extracted correctly!");
} else {
  console.log("❌ FAILURE! The command parameter was not extracted.");
  console.log(`   Expected: command=make_admin`);
  console.log(`   Got: ${JSON.stringify(parsed)}`);
}