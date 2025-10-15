# Practical Ethical Hacking: A Collection of Hands-On Demos

[🇮🇹](/docs/ita.md)

Welcome to the **Practical Ethical Hacking** repository\! This project is founded on the belief that the best way to learn how to build secure applications is to understand how they can be broken. This is a curated collection of runnable, hands-on demonstrations of common (and not-so-common) cybersecurity vulnerabilities.

Each demo is a self-contained project designed to be run locally, allowing you to play the role of an attacker in a safe and controlled environment. Our goal is not just to show that a vulnerability exists, but to provide a step-by-step narrative that reveals how it can be exploited and, most importantly, how to prevent it.

## 🚀 Available Demos

This collection is actively growing. Here are the currently available demonstrations:

| Demo                                                       | Description                                                                                             | Status     |
| :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :--------- |
| `host-header-injection`                                    | A full account takeover scenario demonstrating how trusting the `Host` header can be exploited.           | ✅ Runnable |
| `length-extension-attack-with-prevention`                  | A cryptographic attack showing how a naive MAC signature using `SHA256(key + data)` can be forged.        | ✅ Runnable |

## 🛠️ Getting Started

Every demo in this repository is designed to be run independently. The general workflow is simple:

1.  **Clone the Repository**:

    ```bash
    git clone https://github.com/didof/practical-ethical-hacking.git
    cd practical-ethical-hacking
    ```

2.  **Navigate to a Demo**:
    Choose a vulnerability you want to explore and `cd` into its directory.

    ```bash
    # Example for the Host Header Injection demo
    cd host-header-injection
    ```

3.  **Follow the Local README**:
    Each demo directory contains its own `README.md` file with detailed, step-by-step instructions on how to set up the environment, run the simulation, and understand the attack flow.

## ⚠️ Disclaimer

The contents of this repository are for educational and ethical research purposes only. The demonstrations are performed in a controlled, local environment. Do not attempt to use these techniques on any system for which you do not have explicit, written permission. Unauthorized access to computer systems is illegal. The author is not responsible for any misuse of the information provided.

## 🔬 Demos Overview

Here's a little more about each scenario.

### 🛡️ Host Header Injection

  * **Vulnerability**: A web application constructs URLs for critical functions (like password resets) using the user-controllable `Host` header from the HTTP request.
  * **Impact**: This demo walks you through a full account takeover. You will trick the server into generating a password reset link that points to a server you control, allowing you to intercept the secret reset token and change the victim's password.
  * **[Explore the Demo](/host-header-injection/)**

### ⛓️ Length Extension Attack (SHA256)

  * **Vulnerability**: A cryptographic flaw in systems that create message authentication codes (MACs) by simply hashing a secret key concatenated with data (`SHA256(secret + message)`).
  * **Impact**: This demo shows how an attacker, without knowing the secret key, can take an existing valid signature and message, append their own malicious data, and forge a new valid signature for the combined message. This breaks the integrity of the authenticated data. The demo also includes a secure implementation using HMAC for comparison.
  * **[Explore the Demo](/length-extension-attack-with-prevention/)**

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.