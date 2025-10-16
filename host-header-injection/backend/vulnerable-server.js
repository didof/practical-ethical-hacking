import express from 'express';
import crypto from 'crypto';
import cors from 'cors';


// --- Helper Functions ---
const logger = {
    info: (msg) => console.log(`\x1b[34m[VULNERABLE SERVER]\x1b[0m ${msg}`),
    warn: (msg) => console.log(`\x1b[33m[VULNERABLE SERVER]\x1b[0m ${msg}`),
    error: (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`)
};

/**
 * Generates a cryptographically secure random token.
 * This is abstracted away as its implementation is not relevant to the vulnerability.
 * @returns {string} A 40-character hex token.
 */
function generateSecureToken() {
    return crypto.randomBytes(20).toString('hex');
}

/**
 * Simulates the dispatch of a password reset email by logging a formatted block to the console.
 * This is abstracted away to keep the route handler clean.
 * @param {string} recipientEmail - The email address of the recipient.
 * @param {string} resetLink - The password reset link to be included in the email.
 */
function logEmailDispatch(recipientEmail, resetLink) {
    const emailBox = [
        `\n\x1b[34m┌───────────────────────────────────────────────────────────┐\x1b[0m`,
        `\x1b[34m│\x1b[0m \x1b[1mNew Email Dispatched\x1b[0m                                      \x1b[34m│\x1b[0m`,
        `\x1b[34m├───────────────────────────────────────────────────────────┤\x1b[0m`,
        `\x1b[34m│\x1b[0m \x1b[90mFrom:\x1b[0m no-reply@vulnerableapp.com                          \x1b[34m│\x1b[0m`,
        `\x1b[34m│\x1b[0m \x1b[90mTo:\x1b[0m     ${recipientEmail.padEnd(50, ' ')}\x1b[34m│\x1b[0m`,
        `\x1b[34m│\x1b[0m \x1b[90mSubj:\x1b[0m Your Password Reset Link                            \x1b[34m│\x1b[0m`,
        `\x1b[34m│\x1b[0m                                                           \x1b[34m│\x1b[0m`,
        `\x1b[34m│\x1b[0m   A request was made to reset your password. Click here:  \x1b[34m│\x1b[0m`,
        `\x1b[34m│\x1b[0m   \x1b[33m${resetLink}\x1b[0m \x1b[34m\x1b[0m`,
        `\x1b[34m└───────────────────────────────────────────────────────────┘\x1b[0m\n`
    ];
    console.log(emailBox.join('\n'));
}

// --- Express App Setup ---
const vulnerableApp = express();
const VULNERABLE_PORT = 3000;
const activeTokens = new Set();

vulnerableApp.use(cors());
vulnerableApp.use(express.json());

vulnerableApp.post('/request-password-reset', (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is missing' });
    }

    const token = generateSecureToken();
    activeTokens.add(token);

    // -----------------------------------------------------------------
    // !!! THE VULNERABILITY IS HERE !!!
    // The application blindly trusts the user-controlled 'Host' header
    // to construct a critical URL.
    const host = req.headers.host;
    const resetLink = `http://${host}/reset-password?token=${token}`;
    // -----------------------------------------------------------------

    logEmailDispatch(email, resetLink);

    res.json({ message: 'Password reset request received.' });
});

vulnerableApp.post('/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (activeTokens.has(token)) {
        activeTokens.delete(token);
        logger.warn(`ACCOUNT TAKEOVER! Password for user with token "${token.slice(0, 10)}..." has been changed to "${newPassword}"!`);
        return res.status(200).json({ message: 'Password has been successfully reset.' });
    } else {
        return res.status(400).json({ error: 'Invalid or expired token.' });
    }
});

// --- Server Startup ---
vulnerableApp.listen(VULNERABLE_PORT, () => {
    logger.info(`Listening on http://localhost:${VULNERABLE_PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${VULNERABLE_PORT} is already in use.`);
    } else {
        logger.error(err);
    }
    process.exit(1);
});