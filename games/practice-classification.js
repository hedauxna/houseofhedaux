import { advancePracticeSession, createPracticeSession, fuelPerLap, setDriverMode } from "./practice-session.js";

function between(random, min, max) {
  return Math.min(min, max) + random() * Math.abs(max - min);
}

function duration(random, min, max) {
  return Math.max(1000, between(random, min, max));
}

export function practiceTyres(weather, trackCondition) {
  const rain = String(weather || "").toLowerCase();
  const track = String(trackCondition || "").toLowerCase();
  if (rain.includes("heavy rain") && track.includes("standing water")) return ["Wet"];
  if (rain.includes("drizz") && track.includes("wet")) return ["Intermediate"];
  return ["Soft", "Medium", "Hard"];
}

export function createPracticeClassification(driver, team, opponents, circuitLength, weather, trackCondition, balance, random = Math.random, qualifying = false) {
  const settings = qualifying ? balance.qualifyingAI : balance.practiceAI;
  return {
    driver, team, circuitLength, weather, trackCondition, balance, random, qualifying,
    opponents: opponents.map((entry) => ({
      ...entry,
      bestLap: null,
      bestLapTyre: null,
      session: null,
      garageRemaining: duration(random, settings.initialDelayMinMs, settings.initialDelayMaxMs),
      modeRemaining: 0,
      stintLaps: 0,
    })),
  };
}

function startStint(classification, entry) {
  const { random, balance, circuitLength, weather, trackCondition, qualifying } = classification;
  const settings = qualifying ? balance.qualifyingAI : balance.practiceAI;
  const tyres = practiceTyres(weather, trackCondition);
  if (qualifying) {
    const minLaps = Math.max(1, Math.ceil(Math.min(settings.flyingLapsMin, settings.flyingLapsMax)));
    const maxLaps = Math.max(minLaps, Math.floor(Math.max(settings.flyingLapsMin, settings.flyingLapsMax)));
    entry.stintLaps = 1 + minLaps + Math.floor(random() * (maxLaps - minLaps + 1));
    let tyre = tyres[0];
    if (tyres.length > 1) {
      const weights = [settings.softWeight, settings.mediumWeight, settings.hardWeight];
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      if (total <= 0) throw new Error("Qualifying tyre weights must have a positive total");
      const roll = random() * total;
      tyre = tyres[roll < weights[0] ? 0 : roll < weights[0] + weights[1] ? 1 : 2];
    }
    const fuel = Math.max(.1, Math.min(100, Math.ceil((entry.stintLaps * fuelPerLap(balance, "Push", [])
      + settings.fuelReservePercent) * 10) / 10));
    entry.session = createPracticeSession(entry.driver, entry.team, [], circuitLength, random, { tyre, fuel }, balance, 0, true);
    setDriverMode(entry.session, "Push");
    entry.modeRemaining = Infinity;
  } else {
    const tyre = tyres[Math.floor(random() * tyres.length)];
    const fuel = Math.max(10, Math.min(100, between(random, settings.fuelMinPercent, settings.fuelMaxPercent)));
    const programme = between(random, -settings.engineVariationMs, settings.engineVariationMs)
      + between(random, -settings.testingVariationMs, settings.testingVariationMs);
    entry.session = createPracticeSession(entry.driver, entry.team, [], circuitLength, random, { tyre, fuel }, balance, programme);
    const minLaps = Math.max(1, Math.ceil(Math.min(settings.stintMinLaps, settings.stintMaxLaps)));
    const maxLaps = Math.max(minLaps, Math.floor(Math.max(settings.stintMinLaps, settings.stintMaxLaps)));
    entry.stintLaps = minLaps + Math.floor(random() * (maxLaps - minLaps + 1));
    entry.modeRemaining = 0;
  }
  entry.session.duration = Infinity;
}

export function advancePracticeClassification(classification, milliseconds) {
  const { random, balance, qualifying } = classification;
  const settings = qualifying ? balance.qualifyingAI : balance.practiceAI;
  for (const entry of classification.opponents) {
    let remaining = Math.max(0, milliseconds);
    while (remaining > 0) {
      if (!entry.session) {
        const time = Math.min(remaining, entry.garageRemaining);
        remaining -= time;
        entry.garageRemaining -= time;
        if (entry.garageRemaining > 0) break;
        startStint(classification, entry);
      }
      if (entry.modeRemaining <= 0) {
        const modes = Object.keys(balance.modes);
        setDriverMode(entry.session, modes[Math.floor(random() * modes.length)]);
        entry.modeRemaining = duration(random, balance.practiceAI.modeChangeMinMs, balance.practiceAI.modeChangeMaxMs);
      }
      const session = entry.session;
      const untilLap = (1 - session.lapProgress) * session.lapTarget;
      const time = Math.min(remaining, entry.modeRemaining, untilLap);
      const laps = session.lapTimes.length;
      const completed = session.completedLaps;
      advancePracticeSession(session, time);
      remaining -= time;
      entry.modeRemaining -= time;
      if (session.lapTimes.length > laps) {
        const lap = session.lapTimes[session.lapTimes.length - 1];
        if (entry.bestLap === null || lap < entry.bestLap) {
          entry.bestLap = lap;
          entry.bestLapTyre = session.tyre;
        }
      }
      if (session.completedLaps > completed && session.completedLaps >= entry.stintLaps) {
        entry.session = null;
        entry.garageRemaining = duration(random, settings.garageMinMs, settings.garageMaxMs);
      }
    }
  }
}

export function practiceClassification(classification, practice) {
  const laps = practice.lapTimes;
  const bestLap = laps.length ? Math.min(...laps) : null;
  return [
    { driver: classification.driver, team: classification.team, bestLap,
      bestLapTyre: bestLap === null ? null : practice.lapTyres[laps.indexOf(bestLap)],
      inPit: practice.pitState === "stopped" || practice.pitState === "entering", player: true },
    ...classification.opponents.map((entry) => ({
      driver: entry.driver, team: entry.team, bestLap: entry.bestLap, bestLapTyre: entry.bestLapTyre,
      inPit: !entry.session, player: false,
    })),
  ].sort((a, b) => (a.bestLap ?? Infinity) - (b.bestLap ?? Infinity));
}
