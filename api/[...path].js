import app from "../server/src/app.js";
import { connectToDatabase } from "../server/src/database.js";

export default async function handler(request, response) {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    return response.status(503).json({ error: "Database connection is unavailable." });
  }

  return app(request, response);
}
