# Smart Traffic System — MERN

A full-stack JavaScript traffic-signal simulator built with MongoDB, Express, React, and Node.js. The dashboard lets you simulate adaptive or fixed-time signal control, configure traffic and priority weights, request pedestrian crossings, and flag emergency vehicles. Simulation runs are saved to MongoDB.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MongoDB Community Server or a MongoDB Atlas connection string

## Run locally

1. Install the project dependencies from the repository root:

   ```powershell
   npm install
   ```

2. Create the backend environment file:

   ```powershell
   Copy-Item server\.env.example server\.env
   ```

   Set `MONGODB_URI` in `server\.env` to your local MongoDB URI or Atlas connection string.

3. Start the frontend and API together:

   ```powershell
   npm run dev
   ```

4. Open the Vite URL printed in the terminal (normally `http://localhost:5173`).

## Commands

Run these from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the React development server and Express API |
| `npm run build` | Create the production frontend build |
| `npm test` | Run the Node.js traffic-logic tests |
| `npm start` | Start the production Express API |

For production, build the client with `npm run build`, set the environment variables, and run `npm start` from the root. The API serves the built client when `client/dist` exists.

## Simulation behavior

- Adaptive mode scores each road using vehicle count, waiting cycles, and pedestrian requests. Emergency flags take precedence; roads beyond the starvation threshold are served before ordinary score comparisons.
- Fixed-time mode cycles through North, South, East, and West in order unless an emergency override is active.
- Green duration is bounded between 5 and 30 seconds; each cycle includes a 3-second yellow phase and a 1-second all-red safety gap.
- Traffic for subsequent cycles is randomized between 0 and 40 vehicles. Initial road counts can be set from 0 to 100.
- Each run, including its cycle log and summary, is stored in MongoDB.

## Project layout

```text
client/                 React + Vite dashboard
server/
  src/
    models/             Mongoose persistence model
    routes/             Express API routes
    simulation.js       Reusable traffic scheduling logic
  tests/                Node.js built-in test runner
```

The original Python/Streamlit entrypoints, Python dependencies, and pytest tests have been replaced by JavaScript equivalents.
