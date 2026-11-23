import { DEFAULT_BALANCE, DISCOVERY_PACE_FIELDS } from "./pit-wall-balance.js";

export const PRACTICE_DURATION = 60 * 60 * 1000;
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

function updateLapTarget(session) {
  const { lap, tyres, modes } = session.balance;
  session.lapTargetBeforeMode = session.baseLapTarget + tyres[session.tyre].pace
    + session.tyreWear * lap.tyreWearMsPerPercent - (100 - session.fuel) * lap.fuelSavingMsPerPercent;
  session.lapTarget = Math.max(lap.minimumLapMs, Math.round(session.lapTargetBeforeMode + modes[session.mode].pace));
}

function startLap(session) {
  session.baseLapTarget = baseLapTarget(session);
  updateLapTarget(session);
}

function finishPitStop(session) {
  if (session.pitRemaining > 0 || !session.nextTyre) return;
  session.tyre = session.nextTyre;
  session.tyreWear = 0;
  session.nextTyre = null;
  session.pitState = "none";
  updateLapTarget(session);
}

export function createPracticeSession(driver, team, upgrades, circuitLength, random = Math.random,
  setup = { tyre: "Medium", fuel: 100 }, balance = DEFAULT_BALANCE) {
  if (!Object.hasOwn(balance.tyres, setup.tyre)) throw new Error(`Unknown tyre compound: ${setup.tyre}`);
  if (!Number.isFinite(setup.fuel) || setup.fuel < 10 || setup.fuel > 100) {
    throw new Error(`Invalid starting fuel: ${setup.fuel}`);
  }
  const session = {
    driver, team, upgrades, circuitLength, random, balance,
    elapsed: 0,
    lapElapsed: 0,
    lapProgress: 0,
    lapTimes: [],
    speed: 1,
    tyre: setup.tyre,
    tyreWear: 0,
    fuel: setup.fuel,
    mode: "Balanced",
    pitState: "none",
    pitRemaining: 0,
    nextTyre: null,
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

export function selectPitTyre(session, tyre) {
  if (!Object.hasOwn(session.balance.tyres, tyre)) throw new Error(`Unknown tyre compound: ${tyre}`);
  if (session.pitState !== "stopped") return false;
  session.nextTyre = tyre;
  finishPitStop(session);
  return true;
}

export function advancePracticeSession(session, simulatedMilliseconds) {
  let remaining = Math.min(Math.max(0, simulatedMilliseconds), PRACTICE_DURATION - session.elapsed);
  session.elapsed += remaining;
  while (remaining > 0) {
    if (session.pitState === "stopped") {
      const pitTime = session.nextTyre ? Math.min(remaining, session.pitRemaining) : remaining;
      session.pitRemaining = Math.max(0, session.pitRemaining - pitTime);
      session.lapElapsed += pitTime;
      remaining -= pitTime;
      finishPitStop(session);
      if (session.pitState === "stopped") break;
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
    const fuelEfficiency = session.upgrades.filter((upgrade) => upgrade.id === "fuel-mapping")
      .reduce((total, upgrade) => total + discoveries.fuelEfficiencyPerLevel * (upgrade.level || 1), 0);
    session.tyreWear = Math.min(100, session.tyreWear + distance * tyres[session.tyre].wear * modes[session.mode].wear / (1 + tyreLife));
    session.fuel = Math.max(0, session.fuel - distance * lap.fuelPerLap * modes[session.mode].fuel / (1 + fuelEfficiency));
    remaining -= time;
    if (session.lapProgress < 1) break;
    session.lapTimes.push(Math.round(session.lapElapsed));
    session.lapElapsed = 0;
    session.lapProgress = 0;
    startLap(session);
    if (session.pitState === "called") {
      const efficiency = session.upgrades.filter((upgrade) => upgrade.stat === "Pit Efficiency")
        .reduce((total, upgrade) => total + upgrade.amount, vehicleStats["Pit Efficiency"].base);
      session.pitRemaining = Math.max(lap.pitMinimumMs, lap.pitBaseMs - efficiency * vehicleStats["Pit Efficiency"].pitGainMs);
      session.pitState = "stopped";
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
