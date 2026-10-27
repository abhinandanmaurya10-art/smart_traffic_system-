import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import simulationRoutes from "./routes/simulations.js";

const app = express();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientBuildDirectory = path.resolve(currentDirectory, "../../client/dist");

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_request, response) => {
  const connected = mongoose.connection.readyState === 1;
  response.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "unavailable",
    database: connected ? "connected" : "disconnected",
  });
});

app.use("/api/simulations", simulationRoutes);

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "API endpoint not found." });
});

app.use(express.static(clientBuildDirectory));
app.get("*", (_request, response) => {
  response.sendFile(path.join(clientBuildDirectory, "index.html"), (error) => {
    if (error) {
      response.status(404).json({ error: "Frontend build not found. Run npm run build first." });
    }
  });
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({ error: "Request body must be valid JSON." });
  }
  console.error("API request failed:", error.message);
  return response.status(500).json({ error: "The server could not complete the request." });
});

export default app;
