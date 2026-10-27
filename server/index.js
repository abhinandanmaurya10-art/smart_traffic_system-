import "dotenv/config";
import mongoose from "mongoose";
import app from "./src/app.js";

const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is not configured. Copy server/.env.example to server/.env and set the connection URI.");
  process.exit(1);
}

try {
  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`Traffic API listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error("Unable to connect to MongoDB:", error.message);
  process.exit(1);
}
