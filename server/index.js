import "dotenv/config";
import app from "./src/app.js";
import { connectToDatabase } from "./src/database.js";

const port = Number(process.env.PORT) || 5000;

try {
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`Traffic API listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error("Unable to start the API:", error.message);
  process.exit(1);
}
