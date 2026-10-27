import mongoose from "mongoose";

const cycleSchema = new mongoose.Schema(
  {
    cycle: { type: Number, required: true },
    selectedRoad: { type: String, required: true },
    vehiclesOnSelectedRoad: { type: Number, required: true },
    greenTimeSeconds: { type: Number, required: true },
    waitCyclesBeforeService: { type: Number, required: true },
    counts: { type: mongoose.Schema.Types.Mixed, required: true },
    pedestrianRoads: { type: [String], default: [] },
    emergencyRoad: { type: String, default: null },
  },
  { _id: false },
);

const simulationSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ["adaptive", "fixed"], required: true },
    initialCounts: { type: mongoose.Schema.Types.Mixed, required: true },
    cycles: { type: [cycleSchema], required: true },
    summary: {
      totalVehiclesPrioritized: { type: Number, required: true },
      averageGreenTimeSeconds: { type: Number, required: true },
      totalSignalTimeSeconds: { type: Number, required: true },
    },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.models.Simulation || mongoose.model("Simulation", simulationSchema);
