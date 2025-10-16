# SSRF: A Demo of Misplaced Trust

> **Warning:**
>
> This project is for educational purposes only. It is designed to run safely on your local machine to demonstrate a Server-Side Request Forgery (SSRF) vulnerability. Do not use these techniques for any malicious activities.

[🇮🇹](/server-side-request-forgery/docs/ita.md)

Welcome to the SSRF Lab\! This interactive demo will guide you through a classic **Server-Side Request Forgery** attack. You'll see how a seemingly harmless feature—fetching a profile picture from a URL—can be exploited to attack and shut down an internal, protected server.

We'll play the role of a regular user and then an attacker to understand how trusting user input can lead to critical infrastructure compromises.

## 🚀 The Scenario

Our demo environment consists of three locally-running parts that simulate a real-world application architecture:

1.  **The Vulnerable Application (`vulnerable-app`)**: A Node.js server with a feature to update a user's profile picture from a URL. Its critical flaw is that it blindly trusts any URL it's given, making a request to it from the server itself. We'll see its logs in **blue** 🔵.
2.  **The Internal API (`internal-api`)**: A simulated private, back-office service that should *never* be exposed to the public internet. It contains a dangerous "shutdown" endpoint.
3.  **The Frontend UI (`vulnerable-app/frontend`)**: A simple, clean web page that provides the user interface for interacting with the vulnerable application.

## ✅ Prerequisites

Before you start, make sure you have the following installed:

  * Node.js (v18 or higher)
  * An `npm`-compatible package manager (e.g., `npm`, `pnpm`, `yarn`)

## 🛠️ Setup

First, let's get all the project dependencies installed. Open a terminal at the root of the project.

1.  **Install `internal-api` Dependencies**:

    ```bash
    cd internal-api
    npm install
    ```

2.  **Install `vulnerable-app` Backend Dependencies**:

    ```bash
    cd ../vulnerable-app/backend
    npm install
    ```

3.  **Install `vulnerable-app` Frontend Dependencies**:

    ```bash
    cd ../frontend
    npm install
    ```

## 🎬 Running the Demo: A 3-Act Play

Now that everything is installed, let's run the simulation. You will need **three separate terminal windows** for this.

### Act I: The Happy Path

First, let's see how the application is designed to work correctly.

1.  **Start the Internal API (Terminal 1)**:
    Navigate to the `internal-api` directory and start the server.

    ```bash
    # In the /internal-api directory
    npm start
    ```

    You should see the **yellow** 🟡 `[INTERNAL API]` log confirming it's running on port 8081.

2.  **Start the Vulnerable Backend (Terminal 2)**:
    Navigate to the `vulnerable-app/backend` directory and start the main application server.

    ```bash
    # In the /vulnerable-app/backend directory
    npm start
    ```

    You should see the **blue** 🔵 `[VULNERABLE SERVER]` log confirming it's running on port 8080.

3.  **Start the Frontend (Terminal 3)**:
    Navigate to the `vulnerable-app/frontend` directory and start the Vite development server.

    ```bash
    # In the /vulnerable-app/frontend directory
    npm run dev
    ```

    Vite will give you a local URL (usually `http://localhost:5173`). Open this URL in your browser.

4.  **Perform a Legitimate Action**:
    In the browser UI, enter a URL to a real image. For example: `https://images.pexels.com/photos/2071873/pexels-photo-2071873.jpeg`. Click **"Update Profile Picture"**.

5.  **Check the Logs**:
    Look at your **Terminal 2**. The **blue** 🔵 `[VULNERABLE SERVER]` log will show that it successfully received and fetched the image URL. The `[INTERNAL API]` terminal remains silent. Everything is working as expected.

### Act II: The Attack

Now, let's exploit the misplaced trust. We'll use the same UI, but provide a malicious, internal-facing URL.

1.  **Craft the Malicious Input**:
    Go back to the browser UI. This time, enter the URL for our internal server's dangerous endpoint:

    ```
    http://localhost:8081/api/v1/system/shutdown
    ```

2.  **Launch the Attack**:
    Click the **"Update Profile Picture"** button. The UI might show an error (which is expected), but the real damage has already been done on the server side.

### Act III: The Impact

The vulnerable server received our malicious URL and dutifully made a request to it.

1.  **Witness the Compromise**:
    Immediately check your terminals.

      * **Terminal 2 (Vulnerable Server)**: The **blue** 🔵 log shows it attempted to fetch from `http://localhost:8081/...`.
      * **Terminal 1 (Internal API)**: This is the "Aha\!" moment. The **yellow** 🟡 server, which was previously silent, will print a large, dramatic **red** box warning: `!!! SHUTDOWN SIGNAL RECEIVED !!!`.

2.  **Confirm the Shutdown**:
    The `internal-api` server's process will terminate immediately after logging the message. You've successfully used the public-facing server as a proxy to attack and shut down a protected internal service.

The attack is complete.

## 💥 The Broader Impact: More Than Just a Shutdown

For the sake of a clear demo, our malicious payload just shuts the internal server down. In the real world, an SSRF vulnerability can be used for a plethora of devastating attacks:

  * **Internal Network Scanning**: An attacker can use the vulnerable server as a pivot to scan the internal network, discovering other machines and services (e.g., `http://10.0.0.5`, `http://localhost:9200` for Elasticsearch).
  * **Cloud Credential Theft**: On cloud platforms like AWS, GCP, or Azure, attackers can request metadata URLs (like `http://169.254.169.254/`) to steal secret keys, tokens, and environment variables, leading to a full cloud account takeover.
  * **Data Exfiltration**: By targeting internal databases, file servers, or admin panels that may lack authentication, an attacker can read sensitive files (`file:///etc/passwd`) or exfiltrate customer data.

## 🛡️ The Solution: Zero Trust for User Input

How do we prevent this? The fix is rooted in a core security principle: **Never blindly trust user-controllable input for server-side operations.**

The server must validate that the requested URL belongs to a trusted, external domain. The best practice is to use an **allowlist**.

**The Vulnerable Code (`vulnerable-app/backend/server.js`):**

```javascript
// The server blindly trusts the user-controlled URL.
const { url } = req.body;
const response = await fetch(url); // This is the dangerous part.
```

**The Secure Code:**

```javascript
import { URL } from 'url'; // Native Node.js module

const { url } = req.body;

// 1. Define an allowlist of trusted domains.
const ALLOWED_DOMAINS = [
  'images.pexels.com',
  'unsplash.com',
  'i.imgur.com'
];

// 2. Parse the URL and validate its hostname.
const parsedUrl = new URL(url);
if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
  // 3. If the domain is not in the list, reject the request.
  return res.status(400).json({ error: 'Untrusted domain.' });
}

// 4. Only proceed if the domain is trusted.
const response = await fetch(url);
```

By implementing a strict allowlist, the server can no longer be tricked into making requests to internal or unauthorized domains, effectively neutralizing the SSRF threat.