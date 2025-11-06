import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { connectToDatabase, setupGlobalMongoose } from "./config/db";
import authRoutes from "./routes/auth";
import screenRoutes from "./routes/screens";
import playlistRoutes from "./routes/playlists";
import { seedAll } from "./seed/seedAdmin";
import { requestLogger, errorLogger } from "./middleware/logger";
import logger from "./utils/logger";

dotenv.config();
setupGlobalMongoose();

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/screens", screenRoutes);
app.use("/playlists", playlistRoutes);

const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI || "";

async function start() {
  try {
    await connectToDatabase(MONGODB_URI);
    const db = await mongoose.connection.getClient().db();
    await db.admin().command({ ping: 1 });
    await seedAll();
    app.listen(PORT, () => {
      logger.info("Server listening on http://localhost:%d", PORT);
    });
  } catch (err) {
    logger.error("Failed to start server: %o", err);
    process.exit(1);
  }
}

void start();

// error logger should be last in the chain, after routes and other handlers
app.use(errorLogger);
