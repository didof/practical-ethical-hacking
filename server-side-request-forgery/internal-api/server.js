import express from 'express';
import http from 'http';

// --- A simple, dependency-free colored logger ---
const createLogger = (name, color) => {
  const reset = '\x1b[0m';
  const log = (message) => console.log(`${color}[${name}]${reset} ${message}`);
  
  return {
    log,
    box: (message) => {
      const horizontalLine = '═'.repeat(message.length + 4);
      const padding = ' '.repeat(message.length + 4);
      log(`\x1b[31m
      ╔${horizontalLine}╗
      ║  ${padding}  ║
      ║  ${message}  ║
      ║  ${padding}  ║
      ╚${horizontalLine}╝
      ${reset}`);
    },
  };
};

const logger = createLogger('INTERNAL API', '\x1b[33m'); // Yellow for internal services

// --- Server Configuration ---
const PORT = 8081;
const HOST = 'localhost';

const app = express();
const server = http.createServer(app);

// --- Routes ---

// The "dangerous" endpoint that should not be exposed publicly.
app.get('/api/v1/system/shutdown', (req, res) => {
  logger.box('!!! SHUTDOWN SIGNAL RECEIVED FROM UNEXPECTED SOURCE !!!');
  res.status(200).json({ status: 'ok', message: 'Shutdown initiated.' });

  setTimeout(() => {
    process.exit(1); // Exit with a non-zero code to indicate an error/forced shutdown.
  }, 500);
});

// A catch-all for any other requests to make the API feel more real.
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// --- Server Startup ---
server.listen(PORT, HOST, () => {
  logger.log(`Server is online and listening at http://${HOST}:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.log(`Error: Port ${PORT} is already in use. Is another server running?`);
    process.exit(1);
  } else {
    logger.log(`An unexpected error occurred: ${error.message}`);
    process.exit(1);
  }
});