import express from "express";
import bodyParser from "body-parser";
import { log } from "./logger.js";
import { vulnerableRouter } from "./routes/vulnerable.js";
import { secureRouter } from "./routes/secure.js";
import { signupRouter } from "./routes/signup.js";
import { apiRouter } from "./routes/api.js";

const app = express();

app.use(bodyParser.raw({ type: '*/*' }));

app.use(vulnerableRouter);
app.use(secureRouter);
app.use(signupRouter);
app.use(apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
});