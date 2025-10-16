import express from 'express';
import http from 'http';
import cors from 'cors';

// --- A simple, dependency-free colored logger ---
const createLogger = (name, color) => {
  const reset = '\x1b[0m';
  return {
    log: (message) => console.log(`${color}[${name}]${reset} ${message}`),
  };
};

const logger = createLogger('VULNERABLE SERVER', '\x1b[34m'); // Blue for the main app

// --- Server Configuration ---
const PORT = 8080;
const HOST = 'localhost';

const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(cors()); // Necessary for communication with the Vite dev server
app.use(express.json()); // To parse JSON request bodies

// --- Routes ---
app.post('/api/update-profile-picture', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  logger.log(`Received request to fetch profile picture from: ${url}`);

  try {
    // --- !!! THE VULNERABILITY IS HERE !!! ---
    // The server blindly trusts the user-provided URL and makes a request to it.
    // An attacker can provide an internal URL like 'http://localhost:8081/...'
    // to make the server attack itself or other services on the local network.
    const response = await fetch(url);
    // --- !!! END OF VULNERABLE CODE !!! ---

    if (!response.ok) {
      throw new Error(`Failed to fetch: Server responded with status ${response.status}`);
    }

    // In a real app, we would process the image here. For the demo, we just confirm success.
    logger.log(`Successfully fetched resource from: ${url}`);
    res.status(200).json({ success: true, message: 'Profile picture updated successfully.' });
  } catch (error) {
    logger.log(`Error fetching URL: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch the provided URL.' });
  }
});

// --- Server Startup ---
server.listen(PORT, HOST, () => {
  logger.log(`Server is online and listening at http://${HOST}:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.log(`Error: Port ${PORT} is already in use.`);
  } else {
    logger.log(`An unexpected error occurred: ${error.message}`);
  }
  process.exit(1);
});