import { Buffer } from "buffer";

// SHA-256 Constants
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function right_rotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

function process_block(chunk, h_vals) {
  let W = new Uint32Array(64);
  
  // Prepare message schedule
  for (let i = 0; i < 16; i++) {
    W[i] = chunk.readUInt32BE(i * 4);
  }
  
  for (let i = 16; i < 64; i++) {
    const s0 = right_rotate(W[i - 15], 7) ^ right_rotate(W[i - 15], 18) ^ (W[i - 15] >>> 3);
    const s1 = right_rotate(W[i - 2], 17) ^ right_rotate(W[i - 2], 19) ^ (W[i - 2] >>> 10);
    W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
  }

  let [a, b, c, d, e, f, g, h] = [...h_vals];

  // Main compression loop
  for (let i = 0; i < 64; i++) {
    const S1 = right_rotate(e, 6) ^ right_rotate(e, 11) ^ right_rotate(e, 25);
    const ch = (e & f) ^ ((~e) & g);
    const temp1 = (h + S1 + ch + K[i] + W[i]) | 0;
    const S0 = right_rotate(a, 2) ^ right_rotate(a, 13) ^ right_rotate(a, 22);
    const maj = (a & b) ^ (a & c) ^ (b & c);
    const temp2 = (S0 + maj) | 0;

    h = g;
    g = f;
    f = e;
    e = (d + temp1) | 0;
    d = c;
    c = b;
    b = a;
    a = (temp1 + temp2) | 0;
  }

  return [
    (h_vals[0] + a) | 0,
    (h_vals[1] + b) | 0,
    (h_vals[2] + c) | 0,
    (h_vals[3] + d) | 0,
    (h_vals[4] + e) | 0,
    (h_vals[5] + f) | 0,
    (h_vals[6] + g) | 0,
    (h_vals[7] + h) | 0
  ];
}

export function generateSha256Padding(message_length_bytes) {
  // Calculate the number of zero bytes needed
  // SHA-256 padding: message + 0x80 + zeros + 64-bit length
  const message_length_bits = BigInt(message_length_bytes) * 8n;
  
  // We need to pad so that (message_length + 1 + padding + 8) % 64 === 0
  const k = (56 - (message_length_bytes + 1) % 64 + 64) % 64;
  
  // Create padding: 0x80 byte + k zero bytes + 8-byte length
  const padding = Buffer.alloc(1 + k + 8);
  padding[0] = 0x80;
  
  // Write the length as a 64-bit big-endian integer at the end
  padding.writeBigUInt64BE(message_length_bits, 1 + k);
  
  return padding;
}

export function generateExtendedSignature(original_signature_hex, key_length, original_data, data_to_append) {
  // Step 1: Calculate the length of the original message (key + data)
  const original_message_length = key_length + original_data.length;
  
  // Step 2: Generate the glue padding that was used in the original hash
  const glue_padding = generateSha256Padding(original_message_length);
  
  // Step 3: The forged body is: original_data + glue_padding + data_to_append
  const forged_body = Buffer.concat([original_data, glue_padding, data_to_append]);
  
  // Step 4: Parse the original signature to get the internal state
  const original_state = [];
  for (let i = 0; i < 8; i++) {
    const hex_chunk = original_signature_hex.substring(i * 8, i * 8 + 8);
    original_state.push(parseInt(hex_chunk, 16));
  }
  
  // Step 5: Calculate the new total length for the final padding
  // This is: original_message_length + glue_padding + data_to_append
  const new_message_length = original_message_length + glue_padding.length + data_to_append.length;
  
  // Step 6: Generate padding for the extended message
  const final_padding = generateSha256Padding(new_message_length);
  
  // Step 7: Process the appended data + final padding
  const data_to_hash = Buffer.concat([data_to_append, final_padding]);
  
  // Step 8: Process blocks starting from the original state
  let new_state = [...original_state];
  for (let i = 0; i < data_to_hash.length; i += 64) {
    const block = data_to_hash.slice(i, i + 64);
    if (block.length === 64) {  // Only process complete blocks
      new_state = process_block(block, new_state);
    }
  }
  
  // Step 9: Convert the final state to hex
  const forged_signature_hex = new_state
    .map(h => {
      const hex = (h >>> 0).toString(16);
      return hex.padStart(8, '0');
    })
    .join('');
  
  return { 
    forged_body, 
    forged_signature_hex, 
    glue_padding 
  };
}