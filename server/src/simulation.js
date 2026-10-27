export const ROADS = Object.freeze(["North", "South", "East", "West"]);
export const MIN_GREEN_TIME = 5;
export const MAX_GREEN_TIME = 30;
export const YELLOW_TIME = 3;
export const ALL_RED_GAP = 1;
export const DEFAULT_WEIGHTS = Object.freeze({
  vehicle_count: 1,
  waiting_time: 0.5,
  pedestrian: 2,
});

const DEFAULT_COUNTS = Object.freeze({ North: 10, South: 6, East: 18, West: 8 });

export function clampVehicleCount(count) {
  return Math.max(0, Math.min(count, 100));
}

export function calculateGreenTime(vehicleCount) {
  const boundedCount = clampVehicleCount(vehicleCount);
  return Math.max(MIN_GREEN_TIME, Math.min(MIN_GREEN_TIME + Math.floor(boundedCount / 2), MAX_GREEN_TIME));
}

export function calculatePriorityScore(state, weights = DEFAULT_WEIGHTS) {
  return (
    (weights.vehicle_count ?? 1) * state.vehicleCount +
    (weights.waiting_time ?? 0) * state.waitCycles +
    (weights.pedestrian ?? 0) * Number(state.pedestrianRequest)
  );
}

export function chooseRoad(states, weights = DEFAULT_WEIGHTS, maxWaitCycles = 3) {
  const roads = Object.keys(states);
  if (roads.length === 0) return null;

  const emergencyRoad = roads.find((road) => states[road].emergency);
  if (emergencyRoad) return emergencyRoad;

  const starvedRoad = roads.find((road) => states[road].waitCycles > maxWaitCycles);
  if (starvedRoad) return starvedRoad;

  return roads.reduce((bestRoad, road) => {
    if (calculatePriorityScore(states[road], weights) > calculatePriorityScore(states[bestRoad], weights)) {
      return road;
    }
    return bestRoad;
  }, roads[0]);
}

export function updateStarvationCounters(states, selectedRoad) {
  for (const [road, state] of Object.entries(states)) {
    if (road === selectedRoad) {
      state.waitCycles = 0;
      state.pedestrianRequest = false;
      state.emergency = false;
    } else {
      state.waitCycles += 1;
    }
  }
}

export function fixedTimeChoice(roads, lastIndex = -1) {
  if (!Array.isArray(roads) || roads.length === 0) {
    throw new TypeError("At least one road is required for fixed-time scheduling.");
  }
  return roads[(lastIndex + 1) % roads.length];
}

function validateInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("A simulation configuration is required.");
  }

  const { initialCounts = DEFAULT_COUNTS, cycles = 4, mode = "adaptive" } = input;
  if (!["adaptive", "fixed"].includes(mode)) {
    throw new TypeError("Mode must be adaptive or fixed.");
  }
  if (!Number.isInteger(cycles) || cycles < 1 || cycles > 10) {
    throw new RangeError("Cycle count must be an integer from 1 to 10.");
  }
  if (!initialCounts || typeof initialCounts !== "object" || Array.isArray(initialCounts)) {
    throw new TypeError("Traffic counts must be provided for all four roads.");
  }
  for (const road of ROADS) {
    if (!Number.isInteger(initialCounts[road]) || initialCounts[road] < 0 || initialCounts[road] > 100) {
      throw new RangeError(`${road} road traffic must be an integer from 0 to 100.`);
    }
  }

  const pedestrianRoads = input.pedestrianRoads ?? [];
  if (!Array.isArray(pedestrianRoads) || pedestrianRoads.some((road) => !ROADS.includes(road))) {
    throw new TypeError("Pedestrian requests must reference valid roads.");
  }
  const emergencyRoad = input.emergencyRoad ?? null;
  if (emergencyRoad !== null && !ROADS.includes(emergencyRoad)) {
    throw new TypeError("Emergency override must reference a valid road.");
  }

  const weights = input.weights ?? DEFAULT_WEIGHTS;
  if (!weights || typeof weights !== "object" || Array.isArray(weights)) {
    throw new TypeError("Priority weights must be provided as an object.");
  }
  for (const key of ["vehicle_count", "waiting_time", "pedestrian"]) {
    if (!Number.isFinite(weights[key] ?? DEFAULT_WEIGHTS[key]) || (weights[key] ?? DEFAULT_WEIGHTS[key]) < 0) {
      throw new RangeError(`Priority weight "${key}" must be a non-negative number.`);
    }
  }
  const maxWaitCycles = input.maxWaitCycles ?? 3;
  if (!Number.isInteger(maxWaitCycles) || maxWaitCycles < 1 || maxWaitCycles > 20) {
    throw new RangeError("Starvation threshold must be an integer from 1 to 20.");
  }

  return { initialCounts, cycles, mode, pedestrianRoads, emergencyRoad, weights, maxWaitCycles };
}

export function runSimulation(input, random = Math.random) {
  const config = validateInput(input);
  const { initialCounts, cycles, mode, pedestrianRoads, emergencyRoad, weights, maxWaitCycles } = config;
  const states = Object.fromEntries(
    ROADS.map((road) => [
      road,
      {
        vehicleCount: initialCounts[road],
        waitCycles: 0,
        pedestrianRequest: pedestrianRoads.includes(road),
        emergency: emergencyRoad === road,
      },
    ]),
  );

  let lastFixedIndex = -1;
  let totalVehiclesPrioritized = 0;
  let totalGreenTimeSeconds = 0;
  const cycleLog = [];

  for (let cycle = 1; cycle <= cycles; cycle += 1) {
    const selectedRoad = ROADS.some((road) => states[road].emergency)
      ? ROADS.find((road) => states[road].emergency)
      : mode === "fixed"
        ? fixedTimeChoice(ROADS, lastFixedIndex)
        : chooseRoad(states, weights, maxWaitCycles);
    lastFixedIndex = ROADS.indexOf(selectedRoad);

    const trafficCounts = Object.fromEntries(ROADS.map((road) => [road, states[road].vehicleCount]));
    const pedestrianRequests = ROADS.filter((road) => states[road].pedestrianRequest);
    const activeEmergency = ROADS.find((road) => states[road].emergency) ?? null;
    const vehiclesOnSelectedRoad = states[selectedRoad].vehicleCount;
    const greenTimeSeconds = calculateGreenTime(vehiclesOnSelectedRoad);
    const waitCyclesBeforeService = states[selectedRoad].waitCycles;

    cycleLog.push({
      cycle,
      selectedRoad,
      vehiclesOnSelectedRoad,
      greenTimeSeconds,
      waitCyclesBeforeService,
      counts: trafficCounts,
      pedestrianRoads: pedestrianRequests,
      emergencyRoad: activeEmergency,
    });

    totalVehiclesPrioritized += vehiclesOnSelectedRoad;
    totalGreenTimeSeconds += greenTimeSeconds;
    updateStarvationCounters(states, selectedRoad);

    if (cycle < cycles) {
      for (const road of ROADS) {
        states[road].vehicleCount = Math.floor(random() * 41);
      }
    }
  }

  const totalSignalTimeSeconds = totalGreenTimeSeconds + cycles * (YELLOW_TIME + ALL_RED_GAP);
  return {
    mode,
    initialCounts: Object.fromEntries(ROADS.map((road) => [road, initialCounts[road]])),
    cycles: cycleLog,
    summary: {
      totalVehiclesPrioritized,
      averageGreenTimeSeconds: Number((totalGreenTimeSeconds / cycles).toFixed(1)),
      totalSignalTimeSeconds,
    },
  };
}
