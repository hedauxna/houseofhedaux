import { DEFAULT_BALANCE, DISCOVERY_PACE_FIELDS } from "./pit-wall-balance.js";

export const PRACTICE_DURATION = 60 * 60 * 1000;
export const SPRINT_QUALIFYING_DURATION = 15 * 60 * 1000;
export const MINIMUM_LAPS = 3;

export const TYRES = DEFAULT_BALANCE.tyres;

function traitPace(traits, trait) {
  if (trait === "None") return 0;
  if (!Object.hasOwn(traits, trait)) throw new Error(`Unregistered balance trait: ${trait}`);
  return traits[trait];
}

function baseLapTarget(session) {
  const { driver, team, upgrades, circuitLength, random, balance } = session;
  const { lap, vehicleStats, driverTraits, teamTraits, discoveries } = balance;
  const baseGain = Object.values(vehicleStats).reduce((total, stat) =>
    total + (stat.lapGainMs || 0) * Math.min(stat.base, lap.statPointCap), 0);
  const upgradeGain = upgrades.reduce((total, upgrade) => {
    if (upgrade.stat && !Object.hasOwn(vehicleStats, upgrade.stat)) {
      throw new Error(`Unregistered balance stat: ${upgrade.stat}`);
    }
    const stat = vehicleStats[upgrade.stat];
    if (stat && stat.lapGainMs) {
      return total + Math.min(upgrade.amount, lap.statPointCap) * stat.lapGainMs;
    }
    if (Object.hasOwn(DISCOVERY_PACE_FIELDS, upgrade.id)) {
      const pacePerLevel = discoveries[DISCOVERY_PACE_FIELDS[upgrade.id]];
      if (!Number.isFinite(pacePerLevel)) throw new Error(`Unregistered discovery pace: ${upgrade.id}`);
      return total + (upgrade.level || 1) * pacePerLevel;
    }
    return total;
  }, baseGain);
  const driverGain = driver.strengths.reduce((total, trait) => total + traitPace(driverTraits, trait), 0);
  const weaknessPenalty = traitPace(driverTraits, driver.weakness);
  const teamGain = traitPace(teamTraits, team.bonus);
  const teamPenalty = traitPace(teamTraits, team.weakness);
  const base = lap.baseTimeMs * (circuitLength / lap.referenceLengthKm);
  const reliability = upgrades.filter((upgrade) => upgrade.stat === "Reliability")
    .reduce((total, upgrade) => total + Math.min(upgrade.amount, lap.statPointCap),
      Math.min(vehicleStats.Reliability.base, lap.statPointCap));
  const variation = (random() - .5) * lap.variationMs
    / (1 + reliability * vehicleStats.Reliability.variationReductionPerPoint);
  const result = base + variation - Math.min(upgradeGain, lap.maxUpgradeGainMs) - driverGain + weaknessPenalty - teamGain + teamPenalty;
  return Math.max(base - lap.baseClampMs, Math.min(base + lap.baseClampMs, result));
}

export function updateLapTarget(session) {
  const { lap, tyres, modes } = session.balance;
  session.lapTargetBeforeMode = session.baseLapTarget + tyres[session.tyre].pace
    + session.tyreWear * lap.tyreWearMsPerPercent - (100 - session.fuel) * lap.fuelSavingMsPerPercent
    + session.programPaceMs;
  session.lapTarget = Math.max(lap.minimumLapMs, Math.round(session.lapTargetBeforeMode + modes[session.mode].pace));
}

function startLap(session) {
  session.baseLapTarget = baseLapTarget(session);
  updateLapTarget(session);
}

export function fuelPerLap(balance, mode, upgrades, circuitLength) {
  if (!Number.isFinite(circuitLength) || circuitLength <= 0) throw new Error("Circuit length must be positive");
  const efficiency = upgrades.filter((upgrade) => upgrade.id === "fuel-mapping")
    .reduce((total, upgrade) => total + balance.discoveries.fuelEfficiencyPerLevel * (upgrade.level || 1), 0);
  return balance.lap.fuelPerLap * (circuitLength / balance.lap.referenceLengthKm)
    * balance.modes[mode].fuel / (1 + efficiency);
}

export function createPracticeSession(driver, team, upgrades, circuitLength, random = Math.random,
  setup = { tyre: "Medium", fuel: 100 }, balance = DEFAULT_BALANCE, programPaceMs = 0, qualifying = false) {
  if (!Object.hasOwn(balance.tyres, setup.tyre)) throw new Error(`Unknown tyre compound: ${setup.tyre}`);
  if (!Number.isFinite(setup.fuel) || setup.fuel < (qualifying ? .1 : 10) || setup.fuel > 100) {
    throw new Error(`Invalid starting fuel: ${setup.fuel}`);
  }
  const session = {
    driver, team, upgrades, circuitLength, random, balance, programPaceMs, qualifying,
    duration: qualifying ? SPRINT_QUALIFYING_DURATION : PRACTICE_DURATION,
    elapsed: 0,
    lapElapsed: 0,
    lapProgress: 0,
    lapTimes: [],
    lapTyres: [],
    completedLaps: 0,
    outLap: qualifying,
    lapValid: true,
    invalidLaps: 0,
    speed: 1,
    tyre: setup.tyre,
    tyreWear: 0,
    fuel: setup.fuel,
    mode: "Balanced",
    pitState: "none",
    pitRemaining: 0,
  };
  startLap(session);
  return session;
}

export function setDriverMode(session, mode) {
  if (!Object.hasOwn(session.balance.modes, mode)) throw new Error(`Unknown driver mode: ${mode}`);
  const pace = session.balance.modes[mode].pace;
  session.lapTarget = Math.max(session.balance.lap.minimumLapMs, Math.round(session.lapTargetBeforeMode + pace));
  session.mode = mode;
}

export function callToPit(session) {
  if (session.pitState !== "none") return false;
  session.pitState = "called";
  return true;
}

export function cancelPitCall(session) {
  if (session.pitState !== "called") return false;
  session.pitState = "none";
  return true;
}

export function parkPracticeSession(session) {
  session.pitState = "stopped";
}

export function sendPracticeOut(session, setup) {
  if (!Object.hasOwn(session.balance.tyres, setup.tyre)) throw new Error(`Unknown tyre compound: ${setup.tyre}`);
  if (!Number.isFinite(setup.fuel) || setup.fuel < (session.qualifying ? .1 : 10) || setup.fuel > 100) {
    throw new Error(`Invalid starting fuel: ${setup.fuel}`);
  }
  if (session.pitState !== "stopped") return false;
  session.tyre = setup.tyre;
  session.fuel = setup.fuel;
  session.tyreWear = 0;
  session.lapElapsed = 0;
  session.lapProgress = 0;
  session.outLap = session.qualifying;
  session.lapValid = true;
  session.pitState = "none";
  startLap(session);
  return true;
}

export function serviceRacePit(session, tyre) {
  if (!Object.hasOwn(session.balance.tyres, tyre)) throw new Error(`Unknown tyre compound: ${tyre}`);
  if (session.pitState !== "stopped") return false;
  session.tyre = tyre;
  session.tyreWear = 0;
  session.pitState = "none";
  startLap(session);
  return true;
}

export function advancePracticeSession(session, simulatedMilliseconds) {
  let remaining = Math.min(Math.max(0, simulatedMilliseconds), session.duration - session.elapsed);
  session.elapsed += remaining;
  while (remaining > 0) {
    if (session.pitState === "stopped") break;
    if (session.pitState === "entering") {
      const pitTime = Math.min(remaining, session.pitRemaining);
      session.pitRemaining -= pitTime;
      remaining -= pitTime;
      if (session.pitRemaining <= 0) session.pitState = "stopped";
      continue;
    }
    const untilLap = (1 - session.lapProgress) * session.lapTarget;
    const time = Math.min(remaining, untilLap);
    const distance = time / session.lapTarget;
    session.lapProgress = time >= untilLap ? 1 : session.lapProgress + distance;
    session.lapElapsed += time;
    const { lap, tyres, modes, discoveries, vehicleStats } = session.balance;
    const tyreLife = session.upgrades.filter((upgrade) => upgrade.id === "tyre-insight")
      .reduce((total, upgrade) => total + discoveries.tyreLifePerLevel * (upgrade.level || 1), 0);
    session.tyreWear = Math.min(100, session.tyreWear + distance * tyres[session.tyre].wear * modes[session.mode].wear / (1 + tyreLife));
    const fuelUsed = distance * fuelPerLap(session.balance, session.mode, session.upgrades, session.circuitLength);
    if (session.qualifying && fuelUsed > session.fuel + 1e-9) session.lapValid = false;
    session.fuel = Math.max(0, session.fuel - fuelUsed);
    remaining -= time;
    if (session.lapProgress < 1) break;
    session.completedLaps += 1;
    if (session.outLap) session.outLap = false;
    else if (session.lapValid) {
      session.lapTimes.push(Math.round(session.lapElapsed));
      session.lapTyres.push(session.tyre);
    } else session.invalidLaps += 1;
    session.lapValid = true;
    session.lapElapsed = 0;
    session.lapProgress = 0;
    startLap(session);
    if (session.pitState === "called") {
      const efficiency = session.upgrades.filter((upgrade) => upgrade.stat === "Pit Efficiency")
        .reduce((total, upgrade) => total + upgrade.amount, vehicleStats["Pit Efficiency"].base);
      session.pitRemaining = Math.max(lap.pitMinimumMs, lap.pitBaseMs - efficiency * vehicleStats["Pit Efficiency"].pitGainMs);
      session.pitState = "entering";
    }
  }
}

export function formatSessionTime(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatLapTime(milliseconds) {
  if (milliseconds == null) return "—";
  const time = Math.round(milliseconds);
  return `${Math.floor(time / 60000)}:${String(Math.floor(time % 60000 / 1000)).padStart(2, "0")}.${String(time % 1000).padStart(3, "0")}`;
}
