import { practiceTyres } from "./practice-classification.js";
import {
  advancePracticeSession, callToPit, createPracticeSession, fuelPerLap, serviceRacePit, setDriverMode, updateLapTarget,
} from "./practice-session.js";

export const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];
export const GRAND_PRIX_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

function between(random, min, max) {
  return Math.min(min, max) + random() * Math.abs(max - min);
}

export function createSprintRace(grid, circuitLength, weather, trackCondition, setup, upgrades, balance, random = Math.random, options = {}) {
  const laps = options.laps ?? Math.ceil(100 / circuitLength);
  if (!Number.isInteger(laps) || laps < 1) throw new Error("Race lap count must be a positive integer");
  const grandPrix = Boolean(options.grandPrix);
  const settings = balance.sprintRace;
  const tyres = practiceTyres(weather, trackCondition);
  const modes = Object.keys(balance.modes);
  const entries = grid.map((entry, index) => {
    const mode = entry.player ? "Balanced" : modes[Math.floor(random() * modes.length)];
    const tyre = entry.player ? setup.tyre : tyres[Math.floor(random() * tyres.length)];
    const minFuel = Math.min(settings.aiFuelMinFactor, settings.aiFuelMaxFactor);
    const maxFuel = Math.max(settings.aiFuelMinFactor, settings.aiFuelMaxFactor);
    const fuel = entry.player ? setup.fuel : Math.max(10, Math.min(100,
      laps * fuelPerLap(balance, grandPrix ? "Balanced" : mode, [], circuitLength) * (minFuel + random() * (maxFuel - minFuel))));
    const session = createPracticeSession(entry.driver, entry.team, entry.player ? upgrades : [],
      circuitLength, random, { tyre, fuel }, balance);
    session.duration = Infinity;
    setDriverMode(session, mode);
    session.lapProgress = -index * settings.gridGapMs / session.lapTarget;
    const earliest = Math.min(settings.aiPitEarliestFraction, settings.aiPitLatestFraction);
    const latest = Math.max(settings.aiPitEarliestFraction, settings.aiPitLatestFraction);
    const pitLap = !grandPrix && !entry.player && random() < settings.aiPitChance
      ? Math.max(1, Math.min(laps - 1, Math.round(laps * (earliest + random() * (latest - earliest))))) : null;
    const nextTyres = tyres.filter((compound) => compound !== tyre);
    return {
      driver: entry.driver, team: entry.team, player: entry.player, gridPosition: index + 1,
      session, pitLap, pitTyre: nextTyres.length ? nextTyres[Math.floor(random() * nextTyres.length)] : tyre,
      finishedAt: null, retired: false, bestLap: null, pitStops: 0, tyreHistory: [tyre],
      preferredMode: mode, strategyLap: -1,
      pitWear: grandPrix && !entry.player ? between(random, balance.grandPrix.aiPitWearMin, balance.grandPrix.aiPitWearMax) : null,
      fuelReserve: grandPrix && !entry.player ? between(random, balance.grandPrix.aiFuelReserveMin, balance.grandPrix.aiFuelReserveMax) : 0,
    };
  });
  if (!entries.some((entry) => entry.player)) throw new Error("Sprint grid has no player");
  return { entries, laps, elapsed: 0, flagTime: null, grandPrix, random, tyres, balance };
}

export function setRaceStartingSetup(race, setup) {
  if (race.started) throw new Error("Cannot change starting setup after lights out");
  if (!Object.hasOwn(race.balance.tyres, setup.tyre)) throw new Error(`Unknown tyre compound: ${setup.tyre}`);
  if (!Number.isFinite(setup.fuel) || setup.fuel < 10 || setup.fuel > 100) {
    throw new Error(`Invalid starting fuel: ${setup.fuel}`);
  }
  const player = race.entries.find((entry) => entry.player);
  if (!player) throw new Error("Race grid has no player");
  player.session.tyre = setup.tyre;
  player.session.fuel = setup.fuel;
  player.tyreHistory[0] = setup.tyre;
  updateLapTarget(player.session);
  player.session.lapProgress = -(player.gridPosition - 1) * race.balance.sprintRace.gridGapMs / player.session.lapTarget;
}

function updateGrandPrixStrategy(race, entry) {
  const session = entry.session;
  if (!race.grandPrix || entry.player || entry.strategyLap === session.completedLaps) return;
  entry.strategyLap = session.completedLaps;
  const remaining = Math.max(0, race.laps - session.completedLaps - session.lapProgress);
  const affordable = (mode) => session.fuel >= remaining * fuelPerLap(race.balance, mode, [], session.circuitLength)
    * (1 + entry.fuelReserve / 100);
  const mode = affordable(entry.preferredMode) ? entry.preferredMode : affordable("Balanced") ? "Balanced" : "Manage";
  setDriverMode(session, mode);
  if (session.tyreWear >= entry.pitWear && race.laps - session.completedLaps > 1 && session.pitState === "none") {
    const choices = race.tyres.filter((tyre) => tyre !== session.tyre);
    entry.pitTyre = choices.length ? choices[Math.floor(race.random() * choices.length)] : session.tyre;
    callToPit(session);
  }
}

export function sprintClassification(race) {
  const distance = (entry) => entry.session.completedLaps + entry.session.lapProgress;
  return [...race.entries].sort((a, b) => {
    if (a.retired !== b.retired) return a.retired ? 1 : -1;
    return distance(b) - distance(a)
      || (a.finishedAt ?? Infinity) - (b.finishedAt ?? Infinity)
      || a.gridPosition - b.gridPosition;
  });
}

export function advanceSprintRace(race, milliseconds, playerTyre) {
  let remaining = Math.max(0, milliseconds);
  while (remaining > 0) {
    const active = race.entries.filter((entry) => !entry.retired && entry.finishedAt === null);
    if (!active.length) break;
    for (const entry of active) {
      const session = entry.session;
      updateGrandPrixStrategy(race, entry);
      if (entry.pitLap !== null && session.completedLaps >= entry.pitLap - 1 && session.pitState === "none") {
        callToPit(session);
        entry.pitLap = null;
      }
      if (session.pitState === "entering" && session.pitRemaining <= 0) session.pitState = "stopped";
      if (session.pitState === "stopped") {
        const tyre = entry.player ? playerTyre : entry.pitTyre;
        serviceRacePit(session, tyre);
        entry.pitStops += 1;
        entry.tyreHistory.push(tyre);
        if (race.grandPrix && !entry.player) {
          entry.pitWear = between(race.random, race.balance.grandPrix.aiPitWearMin, race.balance.grandPrix.aiPitWearMax);
        }
      }
      const rate = fuelPerLap(session.balance, session.mode, session.upgrades, session.circuitLength);
      if (session.pitState !== "entering" && rate > 0 && session.fuel <= 1e-9) {
        entry.retired = true;
      }
    }
    const running = active.filter((entry) => !entry.retired);
    if (!running.length) break;
    const time = Math.min(remaining, ...running.map(({ session }) => {
      if (session.pitState === "entering") return session.pitRemaining;
      const rate = fuelPerLap(session.balance, session.mode, session.upgrades, session.circuitLength);
      return Math.min((1 - session.lapProgress) * session.lapTarget,
        rate > 0 ? session.fuel / rate * session.lapTarget : Infinity);
    }));
    const crossed = [];
    for (const entry of running) {
      const session = entry.session;
      const laps = session.completedLaps;
      advancePracticeSession(session, time);
      if (session.completedLaps > laps) {
        crossed.push(entry);
        const lap = session.lapTimes[session.lapTimes.length - 1];
        if (lap != null && (entry.bestLap === null || lap < entry.bestLap)) entry.bestLap = lap;
      }
    }
    race.elapsed += time;
    remaining -= time;
    if (race.flagTime === null && crossed.some((entry) => entry.session.completedLaps >= race.laps)) {
      race.flagTime = race.elapsed;
    }
    if (race.flagTime !== null) {
      crossed.forEach((entry) => { entry.finishedAt = race.elapsed; });
    }
    for (const entry of running) {
      const session = entry.session;
      if (entry.finishedAt === null && session.pitState !== "entering"
        && fuelPerLap(session.balance, session.mode, session.upgrades, session.circuitLength) > 0 && session.fuel <= 1e-9) {
        entry.retired = true;
      }
    }
  }
  return race.entries.every((entry) => entry.retired || entry.finishedAt !== null);
}
