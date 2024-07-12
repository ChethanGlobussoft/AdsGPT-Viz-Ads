import cluster from "cluster";
import os from "os";
import express from "express";
import { config } from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import ioredis from "ioredis";
import routes from "./resources/routes/main.routes.js";
import { sendInternalServerErrorResponse } from "./utils/responseHandler.js";
import logger from "./resources/logs/logger.js";

// To access environment variables
config();

export const pub = new ioredis.Redis({
  host: process.env.PUB_SUB_HOST,
  port: process.env.PUB_SUB_PORT,
  username: process.env.PUB_SUB_USERNAME,
  password: process.env.PUB_SUB_PASSWORD,
});

const PORT = process.env.PORT || 7001;

if (cluster.isPrimary) {
  // Get the number of CPU cores
  const numCPUs = os.cpus().length;

  console.log(`Master ${process.pid} is running`);
  logger.info(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    logger.info(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Fork a new worker when one dies
  });
} else {
  const app = express();

  // Middlewares
  app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
  app.use(helmet());
  app.use(express.json());
  app.use(morgan("dev"));

  // Routes
  app.use("/api", routes);

  // Error handling
  app.use((req, res) => sendInternalServerErrorResponse(res));

  // App listening to PORT
  app.listen(PORT, () => {
    logger.info(`Worker ${process.pid} running on port ${PORT}`);
    console.log(`Worker ${process.pid} running on port ${PORT}`);
  });
}
