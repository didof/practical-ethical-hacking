# Length Extension Attack Demonstration

This project demonstrates a **length extension attack** against a vulnerable SHA-256 implementation and shows why HMAC should be used instead.

## 🚨 The Vulnerability

When using `hash(secret + message)` for authentication:
- An attacker can extend a valid message without knowing the secret
- They can compute a valid signature for the extended message
- This is possible because hash functions like SHA-256 process data in blocks

## ✅ The Solution

Using HMAC (Hash-based Message Authentication Code):
- Prevents length extension attacks
- Provides proper message authentication
- Industry standard for this purpose

## 📁 Project Structure

```
.
├── package.json
├── .env
├── app.js                    # Main server
├── config.js                 # Configuration
├── database.js               # Database setup
├── database.debug.js         # View database contents
├── logger.js                 # Logging utilities
├── auth.js                   # Vulnerable and secure auth
├── attack.js                 # Length extension attack logic
├── run_attack.js             # Interactive attack demo
├── helpers.js                # Helper functions
└── routes/
    ├── vulnerable.js         # Vulnerable endpoint
    ├── secure.js             # Secure endpoint (HMAC)
    ├── api.js                # Profile API
    └── signup.js             # User signup
```

## 🛠️ Setup

### 1. Create the routes directory
```bash
mkdir routes
```

### 2. Move route files
Move the following files into the `routes/` directory:
- `vulnerable.js` → `routes/vulnerable.js`
- `secure.js` → `routes/secure.js`
- `api.js` → `routes/api.js`
- `signup.js` → `routes/signup.js`

### 3. Install dependencies
```bash
pnpm install
```

### 4. Set up the secret key
The `.env` file should contain:
```
SECRET_KEY=your-super-secret-key
```

The secret key is **23 bytes** long (including the hyphen characters).

## 🚀 Running the Demo

### Option 1: Full Automated Demo (Recommended)

```bash
# Terminal 1: Start the server
node app.js

# Terminal 2: Run the complete demonstration
node full_demo.js
```

This will automatically:
- Show the user's admin status BEFORE the attack
- Attack the vulnerable endpoint (succeeds)
- Update the database with admin privileges
- Attack the secure HMAC endpoint (fails)
- Show the user's admin status AFTER the attack
- Display a summary comparison

### Option 2: Interactive Attack

```bash
# Terminal 1: Start the server
node app.js

# Terminal 2: Run the interactive attack
node run_attack.js
```

Follow the interactive prompts:

1. **Payload to append**: Enter `&command=make_admin`
2. **Key length guess**: Enter `23` (the actual length of the secret key)

The script will walk you through:
- Step 1: Getting a valid signature
- Step 2: Calculating the glue padding
- Step 3: Assembling the forged request
- Step 4: Computing the extended signature
- Step 5: Launching the attack

### Option 3: Manual Verification

Test the attack logic without making requests:

```bash
node test_signature.js
```

This verifies the cryptographic implementation is correct.

## 📊 View Database Contents

To see the users in the database:
```bash
node database.debug.js
```

## 🎯 Attack Flow

### What happens:

1. **Legitimate request**: Get a signature for `user_id=10&action=view_profile`
2. **Forge request**: Extend it to `user_id=10&action=view_profile<padding>&command=make_admin`
3. **Attack**: Send the forged request with a computed valid signature
4. **Success**: The vulnerable endpoint accepts it! 🔥

### Why it works:

The vulnerable signature is computed as:
```
SHA-256(SECRET_KEY + message)
```

Since SHA-256 processes data in blocks, we can:
1. Use the original hash as the internal state
2. Continue hashing with our appended data
3. Produce a valid signature for the extended message

### Why HMAC prevents this:

HMAC is computed as:
```
HMAC(key, message) = SHA-256((key ⊕ opad) || SHA-256((key ⊕ ipad) || message))
```

The nested structure and XOR operations prevent length extension attacks.

## 🔍 Testing Both Endpoints

### Vulnerable endpoint (will succeed):
```bash
node run_attack.js
# Follow prompts with: &command=make_admin and key length 23
```

### Secure endpoint (will fail):
Try the same attack against `/webhook_secure` - it won't work because HMAC prevents length extension attacks.

## 🐛 Troubleshooting

### "Cannot connect to server"
Make sure `node app.js` is running in another terminal.

### Attack fails with wrong signature
- Verify the secret key length is 23 bytes
- Check that `.env` has `SECRET_KEY=your-super-secret-key`
- The secret key length includes all characters (23 total)

### Routes not found
Make sure all route files are in the `routes/` subdirectory and properly named.

## 📚 Key Takeaways

1. **Never use** `hash(secret + message)` for authentication
2. **Always use** HMAC for message authentication codes
3. Length extension attacks are real and exploitable
4. Understanding the vulnerability helps appreciate the solution

## 🔐 Security Lessons

- **Vulnerable pattern**: `SHA256(secret || message)`
- **Secure pattern**: `HMAC-SHA256(secret, message)`
- **Real-world impact**: API authentication, webhooks, signed URLs
- **Prevention**: Use standard cryptographic libraries (crypto.createHmac)

---

**Educational purposes only!** This demonstrates a real vulnerability pattern to understand why proper cryptographic constructions matter.