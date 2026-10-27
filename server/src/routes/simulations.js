import { Router } from "express";
import Simulation from "../models/Simulation.js";
import { runSimulation } from "../simulation.js";

const router = Router();

router.get("/", async (_request, response, next) => {
  try {
    const simulations = await Simulation.find().sort({ createdAt: -1 }).limit(10).lean();
    return response.json(simulations);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (request, response, next) => {
  try {
    const simulation = await Simulation.findById(request.params.id).lean();
    if (!simulation) {
      return response.status(404).json({ error: "Simulation not found." });
    }
    return response.json(simulation);
  } catch (error) {
    if (error.name === "CastError") {
      return response.status(400).json({ error: "Simulation id is invalid." });
    }
    return next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const result = runSimulation(request.body);
    const simulation = await Simulation.create(result);
    return response.status(201).json(simulation);
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return response.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

export default router;
