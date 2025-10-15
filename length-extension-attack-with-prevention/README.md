# Length Extension Attack Demonstration

> **Warning:**
>
> [DISCLAIMER] This project is for educational purposes only and is intended to demonstrate a cryptographic vulnerability. It is not intended for malicious use. The author is not responsible for any misuse of this information or the provided code.

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

## 🛠️ Setup

Install dependencies.

```bash
pnpm install
```

Set up the secret key. The `.env` file should be a copy of `.env.example`.

```bash
cp .env.example .env
```

Then, update the `.env` file with your own secret key, for example:

```
SECRET_KEY=your-super-secret-key
```

> Keep in mind the length of your secret!

## 🚀 Running the Demo

```bash
# Terminal 1: Start the server
node app.js

# Terminal 2: Run the interactive attack
node run_attack.js
```

Follow the interactive prompts:

1.  **Payload to append**: Enter `&command=make_admin`
2.  **Key length guess**: Enter `23` (the actual length of the secret key)

The script will walk you through:

  - Step 1: Getting a valid signature
  - Step 2: Calculating the glue padding
  - Step 3: Assembling the forged request
  - Step 4: Computing the extended signature
  - Step 5: Launching the attack

## 📊 View Database Contents

To see the users in the database:

```bash
node database.debug.js
```

This verifies the cryptographic implementation is correct.

## 🎯 Attack Flow

### What happens:

1.  **Legitimate request**: Get a signature for `user_id=10&action=view_profile`
2.  **Forge request**: Extend it to `user_id=10&action=view_profile<padding>&command=make_admin`
3.  **Attack**: Send the forged request with a computed valid signature
4.  **Success**: The vulnerable endpoint accepts it\! 🔥

### Why it works:

The vulnerable signature is computed as:

```
SHA-256(SECRET_KEY + message)
```

Since SHA-256 processes data in blocks, we can:

1.  Use the original hash as the internal state
2.  Continue hashing with our appended data
3.  Produce a valid signature for the extended message

### Why HMAC prevents this:

HMAC is computed as:

```
HMAC(key, message) = SHA-256((key ⊕ opad) || SHA-256((key ⊕ ipad) || message))
```

The nested structure and XOR operations prevent length extension attacks.

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

1.  **Never use** `hash(secret + message)` for authentication
2.  **Always use** HMAC for message authentication codes
3.  Length extension attacks are real and exploitable
4.  Understanding the vulnerability helps appreciate the solution

## 🔐 Security Lessons

  - **Vulnerable pattern**: `SHA256(secret || message)`
  - **Secure pattern**: `HMAC-SHA256(secret, message)`
  - **Real-world impact**: API authentication, webhooks, signed URLs
  - **Prevention**: Use standard cryptographic libraries (crypto.createHmac)

-----

> **Warning:**
>
> [DISCLAIMER] This project is for educational purposes only and is intended to demonstrate a cryptographic vulnerability. It is not intended for malicious use. The author is not responsible for any misuse of this information or the provided code.