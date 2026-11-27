import { loadRoute, mountRouteDebug, validateRoute } from "./route-debug.js";
import { mountRouteMarkers } from "./route-marker.js";
import { DEFAULT_BALANCE, DISCOVERY_PACE_FIELDS, createBalance } from "./pit-wall-balance.js";
import { mountBalancePanel } from "./pit-wall-balance-panel.js";
import { createPracticeClassification, advancePracticeClassification, practiceClassification } from "./practice-classification.js";
import { createSprintRace, advanceSprintRace, sprintClassification, SPRINT_POINTS, GRAND_PRIX_POINTS } from "./sprint-race.js";
import {
  PRACTICE_DURATION, SPRINT_QUALIFYING_DURATION, MINIMUM_LAPS, createPracticeSession, advancePracticeSession, fuelPerLap,
  formatSessionTime, formatLapTime, setDriverMode, callToPit, cancelPitCall, parkPracticeSession, sendPracticeOut,
} from "./practice-session.js";

/**
 * Pit Wall - A roguelike race engineering simulator
 * Phase 5: Season Progression
 */

const DRIVERS = [
  { name: "Aria Vale", strengths: ["Qualifying pace", "Technical feedback"], weakness: "Tyre management" },
  { name: "Marcus Bell", strengths: ["Racecraft", "Wet conditions"], weakness: "Qualifying pace" },
  { name: "Sofia Moretti", strengths: ["Consistency", "Tyre management"], weakness: "Aggressive overtakes" },
  { name: "Kai Nakamura", strengths: ["Quick starts", "Adaptability"], weakness: "Technical feedback" },
  { name: "Amara Okafor", strengths: ["Braking", "Racecraft"], weakness: "Wet conditions" },
  { name: "Leo Andersson", strengths: ["Technical feedback", "Consistency"], weakness: "Quick starts" },
  { name: "Maya Rios", strengths: ["Wet conditions", "Adaptability"], weakness: "Tyre management" },
  { name: "Theo Laurent", strengths: ["Qualifying pace", "Braking"], weakness: "Consistency" },
  { name: "Nina Petrov", strengths: ["Tyre management", "Quick starts"], weakness: "Qualifying pace" },
  { name: "Elias Mercer", strengths: ["Aggressive overtakes", "Technical feedback"], weakness: "Braking" },
];

const TEAMS = [
  { name: "Apex Dynamics", bonus: "Qualifying pace", weakness: "Tyre wear", description: "Built for one-lap speed.", colour: "#b33535" },
  { name: "Nova Racing", bonus: "Race strategy", weakness: "Slow starts", description: "A team with a tactical edge.", colour: "#285ca7" },
  { name: "Orion Motorsport", bonus: "Consistency", weakness: "Qualifying pace", description: "Reliable through every stint.", colour: "#287361" },
  { name: "Blackline GP", bonus: "Wet conditions", weakness: "Tyre wear", description: "At home in changing weather.", colour: "#484c58" },
  { name: "Titan Velocity", bonus: "Straight-line speed", weakness: "Cornering", description: "Power is their calling card.", colour: "#9b571d" },
];

const SPRINT_SESSIONS = ["Practice 1", "Sprint Qualifying", "Sprint Race", "Qualifying", "Grand Prix"];
const STANDARD_SESSIONS = ["Practice 1", "Practice 2", "Practice 3", "Qualifying", "Grand Prix"];

const WEEKENDS = [
  {
    id: "bahrain", name: "Bahrain", country: "Bahrain", track: "Bahrain International Circuit", dates: "12-14 March 2027", sprint: true,
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable",
    circuitLength: "5.412 km", laps: 57, image: new URL("../assets/Bahrain_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "saudi-arabia", name: "Saudi Arabia", title: "Saudi Arabian Grand Prix", country: "Saudi Arabia",
    track: "Jeddah Corniche Circuit", dates: "19-21 March 2027",
    weather: "Hot Conditions", weatherIcon: "&#9728;", forecast: "Stable",
    circuitLength: "6.174 km", laps: 50, image: new URL("../assets/Saudi_Arabia_Circuit_Trimmed.png", import.meta.url).href, routeId: "saudi", mappedRoute: true,
  },
  {
    id: "australia", name: "Australia", title: "Australian Grand Prix", country: "Australia",
    track: "Albert Park Grand Prix Circuit", dates: "2-4 April 2027", sprint: true,
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "5.278 km", laps: 58, image: new URL("../assets/Australia_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "japan", name: "Japan", title: "Japanese Grand Prix", country: "Japan",
    track: "Suzuka Circuit", dates: "9-11 April 2027", sprint: true,
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "5.807 km", laps: 53, image: new URL("../assets/Japan_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "china", name: "China", title: "Chinese Grand Prix", country: "China",
    track: "Shanghai International Circuit", dates: "16-18 April 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "5.451 km", laps: 56, image: new URL("../assets/China_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "miami", name: "Miami", title: "Miami Grand Prix", country: "United States",
    track: "Miami International Autodrome", dates: "30 April-2 May 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "5.412 km", laps: 57, image: new URL("../assets/Miami_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "canada", name: "Canada", title: "Canadian Grand Prix", country: "Canada",
    track: "Circuit Gilles Villeneuve", dates: "21-23 May 2027", sprint: true,
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "4.361 km", laps: 70, image: new URL("../assets/Canada_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "monaco", name: "Monaco", country: "Monaco",
    track: "Circuit de Monaco", dates: "4-6 June 2027", sprint: true,
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "3.337 km", laps: 78, image: new URL("../assets/Monaco_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "portugal", name: "Portugal", title: "Portuguese Grand Prix", country: "Portugal",
    track: "Algarve International Circuit", dates: "18-20 June 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "4.653 km", laps: 66, image: new URL("../assets/Portuguese_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "great-britain", name: "Great Britain", title: "British Grand Prix", country: "United Kingdom",
    track: "Silverstone Circuit", dates: "2-4 July 2027", sprint: true,
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "5.891 km", laps: 52, image: new URL("../assets/Great_Britain_Circuit_Trimmed.png", import.meta.url).href,
    routeId: "greatbritain", mappedRoute: true,
  },
  {
    id: "austria", name: "Austria", title: "Austrian Grand Prix", country: "Austria",
    track: "Red Bull Ring", dates: "9-11 July 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "4.326 km", laps: 71, image: new URL("../assets/Austria_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "belgium", name: "Belgium", title: "Belgian Grand Prix", country: "Belgium",
    track: "Circuit de Spa-Francorchamps", dates: "23-25 July 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "7.004 km", laps: 44, image: new URL("../assets/Belgian_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "hungary", name: "Hungary", title: "Hungarian Grand Prix", country: "Hungary",
    track: "Hungaroring", dates: "30 July-1 August 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "4.381 km", laps: 70, image: new URL("../assets/Hungary_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "italy", name: "Italy", title: "Italian Grand Prix", country: "Italy",
    track: "Monza Circuit", dates: "3-5 September 2027", sprint: true,
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "5.793 km", laps: 53, image: new URL("../assets/Italy_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "spain", name: "Spain", title: "Madrid Grand Prix", country: "Spain",
    track: "Madring", dates: "10-12 September 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "5.414 km", laps: 57, image: new URL("../assets/Madrid_Circuit_Trimmed.png", import.meta.url).href,
    routeId: "madrid", mappedRoute: true,
  },
  {
    id: "azerbaijan", name: "Azerbaijan", country: "Azerbaijan",
    track: "Baku City Circuit", dates: "24-26 September 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "6.003 km", laps: 51, image: new URL("../assets/Azerbaijan_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "turkiye", name: "Türkiye", title: "Turkish Grand Prix", country: "Türkiye",
    track: "Istanbul Park", dates: "1-3 October 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "5.338 km", laps: 58, image: new URL("../assets/Turkey_Circuit_Trimmed.png", import.meta.url).href,
    routeId: "turkey", mappedRoute: true,
  },
  {
    id: "singapore", name: "Singapore", country: "Singapore",
    track: "Marina Bay Street Circuit", dates: "8-10 October 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "4.927 km", laps: 62, image: new URL("../assets/Singapore_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "united-states", name: "United States", country: "United States",
    track: "Circuit of the Americas", dates: "22-24 October 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "5.513 km", laps: 56, image: new URL("../assets/USA_Circuit_Trimmed.png", import.meta.url).href,
    routeId: "usa", mappedRoute: true,
  },
  {
    id: "mexico", name: "Mexico", title: "Mexico Grand Prix", country: "Mexico",
    track: "Autódromo Hermanos Rodríguez", dates: "29-31 October 2027",
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "4.304 km", laps: 71, image: new URL("../assets/Mexico_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "brazil", name: "Brazil", title: "São Paulo Grand Prix", country: "Brazil",
    track: "Interlagos", dates: "5-7 November 2027", sprint: true,
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "4.309 km", laps: 71, image: new URL("../assets/Brazil_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "las-vegas", name: "Las Vegas", title: "Las Vegas Grand Prix", country: "United States",
    track: "Las Vegas Strip Circuit", dates: "18-20 November 2027", sprint: true,
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "6.201 km", laps: 50, image: new URL("../assets/Las_Vegas_Circuit_Trimmed.png", import.meta.url).href,
    routeId: "lasvegas", mappedRoute: true,
  },
  {
    id: "qatar", name: "Qatar", title: "Qatar Grand Prix", country: "Qatar",
    track: "Lusail International Circuit", dates: "3-5 December 2027", sprint: true,
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "5.419 km", laps: 57, image: new URL("../assets/Qatar_Circuit_Trimmed.png", import.meta.url).href, mappedRoute: true,
  },
  {
    id: "abu-dhabi", name: "Abu Dhabi", title: "Abu Dhabi Grand Prix", country: "United Arab Emirates",
    track: "Yas Marina Circuit", dates: "10-12 December 2027", sprint: true,
    weather: "Sunny", weatherIcon: "&#9728;", forecast: "Stable", trackCondition: "Green",
    circuitLength: "5.281 km", laps: 58, image: new URL("../assets/Abu_Dhabi_Circuit_Trimmed.png", import.meta.url).href,
    routeId: "abudhabi", mappedRoute: true,
  },
].map((weekend, index) => ({
  ...weekend,
  round: index + 1,
  title: weekend.title || `${weekend.name} Grand Prix`,
  format: weekend.sprint ? "Sprint Weekend" : "Standard Weekend",
  sessions: weekend.sprint ? SPRINT_SESSIONS : STANDARD_SESSIONS,
}));

const DISCOVERIES = [
  { id: "wind-tunnel", name: "Wind Tunnel Upgrade", description: "Refine the car's aerodynamics.", stat: "Aero", rarity: "blue", category: "permanent", stackable: true },
  { id: "brake-cooling", name: "Brake Cooling", description: "Keep critical components cooler.", stat: "Reliability", rarity: "blue", category: "permanent", stackable: true },
  { id: "battery-optimisation", name: "Battery Optimisation", description: "Recover more energy each lap.", stat: "Energy Recovery", rarity: "blue", category: "permanent", stackable: true },
  { id: "suspension-development", name: "Suspension Development", description: "Improve the car's balance.", stat: "Handling", rarity: "blue", category: "permanent", stackable: true },
  { id: "pit-crew-training", name: "Pit Crew Training", description: "Sharpen the team's pit stops.", stat: "Pit Efficiency", rarity: "blue", category: "permanent", stackable: true },
  { id: "tyre-insight", name: "Tyre Insight", description: "Make the tyres last longer.", effect: "+10% Tyre Life", rarity: "green", category: "weekend", stackable: true },
  { id: "track-evolution", name: "Track Evolution Notes", description: "Adapt to the changing circuit.", rarity: "green", category: "weekend", stackable: true },
  { id: "braking-reference", name: "Braking Reference Data", description: "Find better braking points.", rarity: "green", category: "weekend", stackable: true },
  { id: "fuel-mapping", name: "Fuel Mapping Discovery", description: "Use fuel more efficiently.", effect: "+15% Fuel Efficiency", rarity: "green", category: "weekend", stackable: true },
  { id: "overtaking-analysis", name: "Overtaking Analysis", description: "Turn passing analysis into a pace gain.", rarity: "green", category: "weekend", stackable: true },
  { id: "aero-breakthrough", name: "Aero Breakthrough", description: "Unlock a major aerodynamic advance.", stat: "Aero", rarity: "purple", category: "permanent" },
  { id: "durability-breakthrough", name: "Durability Breakthrough", description: "Make a major reliability advance.", stat: "Reliability", rarity: "purple", category: "permanent" },
  { id: "handling-breakthrough", name: "Handling Breakthrough", description: "Transform the car's handling.", stat: "Handling", rarity: "purple", category: "permanent" },
  { id: "research-charter", name: "Research Charter", description: "Expand future discovery choices.", effect: "+1 full reroll per future session", rarity: "gold", category: "permanent" },
  { id: "design-review", name: "Design Review", description: "Refine future discovery offers.", effect: "+1 single-card reroll per future session", rarity: "gold", category: "permanent" },
  { id: "legacy-lab", name: "Legacy Lab", description: "Amplify all common upgrades.", effect: "Blue upgrades gain +1x effect", rarity: "gold", category: "permanent" },
];
for (const item of DISCOVERIES.filter((discovery) => Object.hasOwn(DISCOVERY_PACE_FIELDS, discovery.id))) {
  if (!Number.isFinite(DEFAULT_BALANCE.discoveries[DISCOVERY_PACE_FIELDS[item.id]])) {
    throw new Error(`Unregistered discovery pace: ${item.id}`);
  }
  Object.defineProperty(item, "effect", {
    enumerable: true,
    get: () => `-${DEFAULT_BALANCE.discoveries[DISCOVERY_PACE_FIELDS[item.id]]} ms / lap`,
  });
}
for (const item of DISCOVERIES.filter((discovery) => discovery.stat)) {
  if (!Object.hasOwn(DEFAULT_BALANCE.discoveries.statPoints, item.id)) {
    throw new Error(`Unregistered balance upgrade: ${item.id}`);
  }
  Object.defineProperties(item, {
    amount: { enumerable: true, get: () => DEFAULT_BALANCE.discoveries.statPoints[item.id] },
    effect: { enumerable: true, get: () => `+${DEFAULT_BALANCE.discoveries.statPoints[item.id]} ${item.stat}` },
  });
}

const SESSION_DURATION = 5000;
function eligibleDiscoveries(postGrandPrix, exclude, owned, uniqueRewards) {
  return DISCOVERIES.filter((item) => {
    if ((postGrandPrix && item.category === "weekend") || exclude.some((other) => other.id === item.id)) return false;
    const existing = owned.find((other) => other.id === item.id);
    if (!item.stackable && (existing || uniqueRewards.has(item.id))) return false;
    return item.maxLevel == null || (existing ? existing.level : 0) < item.maxLevel;
  });
}

function drawDiscovery(postGrandPrix, exclude = [], owned = [], uniqueRewards = new Set(), balance = DEFAULT_BALANCE) {
  const eligible = eligibleDiscoveries(postGrandPrix, exclude, owned, uniqueRewards);
  const weights = Object.entries(postGrandPrix ? balance.rewardWeights.afterGrandPrix : balance.rewardWeights.beforeGrandPrix);
  const available = weights.filter(([rarity, weight]) => weight > 0 && eligible.some((item) => item.rarity === rarity));
  const total = available.reduce((sum, [, weight]) => sum + weight, 0);
  if (!total) throw new Error("No eligible discoveries available");
  let roll = Math.random() * total;
  const [rarity] = available.find(([, weight]) => {
    roll -= weight;
    return roll < 0;
  });
  const candidates = eligible.filter((item) => item.rarity === rarity);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function discoveryOffer(postGrandPrix, owned, uniqueRewards, balance = DEFAULT_BALANCE) {
  const options = [];
  const weights = postGrandPrix ? balance.rewardWeights.afterGrandPrix : balance.rewardWeights.beforeGrandPrix;
  while (options.length < 3 && eligibleDiscoveries(postGrandPrix, options, owned, uniqueRewards)
    .some((item) => weights[item.rarity] > 0)) {
    options.push(drawDiscovery(postGrandPrix, options, owned, uniqueRewards, balance));
  }
  return options;
}

function rarityLabel(rarity) {
  return {
    green: "Green · Weekend Only",
    blue: "Blue · Permanent",
    purple: "Purple · Rare · Permanent",
    gold: "Gold · Legendary · Permanent",
  }[rarity];
}

function discoveryType(rarity) {
  return {
    green: "Weekend Discovery",
    blue: "Permanent Upgrade",
    purple: "Rare Breakthrough",
    gold: "Legendary Discovery",
  }[rarity];
}

const TIMING_PLACEHOLDER = `
  <div class="pit-wall-placeholder-block">
    <p class="pit-wall-placeholder-label">Timing Panel</p>
    <p class="pit-wall-placeholder-info">Live race data and statistics will appear here</p>
  </div>
`;

function shortlist(pool) {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

function portrait(driver) {
  return `<span class="pit-wall-driver-portrait" aria-hidden="true">${driverInitials(driver)}</span>`;
}

function driverInitials(driver) {
  return driver.name.split(" ").map((part) => part[0]).join("");
}

function classificationRows(entries) {
  const gap = (entry, reference) => entry.bestLap === null || !reference || entry === reference
    ? "—" : `+${((entry.bestLap - reference.bestLap) / 1000).toFixed(3)}s`;
  return entries.map((entry, index) => `
    <li class="pit-wall-classification-row${entry.player ? " is-player" : ""}" role="row">
      <span class="pit-wall-classification-position" role="cell">${entry.bestLap === null ? "–" : `P${index + 1}`}</span>
      <span class="pit-wall-classification-marker${entry.inPit ? " is-in-pit" : ""}" role="cell" style="background-color:${entry.team.colour}" aria-label="${entry.driver.name}, ${entry.team.name}${entry.inPit ? ", in pit" : ""}"${entry.inPit ? ' title="In pit"' : ""}>${driverInitials(entry.driver)}</span>
      <strong class="pit-wall-classification-driver" role="cell">${entry.driver.name}</strong>
      <span class="pit-wall-classification-team" role="cell">${entry.team.name}</span>
      <span class="pit-wall-classification-tyre" role="cell">${tyreLabel(entry.currentTyre)}</span>
      <span class="pit-wall-classification-best${index === 0 && entry.bestLap !== null ? " is-fastest" : ""}" role="cell"${index === 0 && entry.bestLap !== null ? ` aria-label="Fastest lap of the session, ${formatLapTime(entry.bestLap)}"` : ""}>${formatLapTime(entry.bestLap)}</span>
      <span class="pit-wall-classification-gap" role="cell">${gap(entry, entries[index - 1])}</span>
      <span class="pit-wall-classification-gap" role="cell">${gap(entry, entries[0])}</span>
    </li>`).join("");
}

function tyreLabel(tyre) {
  return tyre ? `<span class="pit-wall-tyre-label" data-tyre="${tyre}">${tyre}</span>` : '<span class="pit-wall-tyre-unknown" aria-label="Tyre not yet known">—</span>';
}

function raceGap(entry, leader) {
  if (entry.retired) return "DNF";
  if (entry === leader) return "—";
  const distance = leader.session.completedLaps + leader.session.lapProgress
    - entry.session.completedLaps - entry.session.lapProgress;
  const lapped = Math.floor(Math.max(0, distance));
  if (lapped) return `+${lapped}L`;
  const gap = leader.finishedAt !== null && entry.finishedAt !== null
    ? (entry.finishedAt - leader.finishedAt) / 1000 : distance * entry.session.lapTarget / 1000;
  return `+${Math.max(0, gap).toFixed(3)}s`;
}

function fastestRaceEntry(entries) {
  return entries.reduce((best, entry) =>
    entry.bestLap !== null && (!best || entry.bestLap < best.bestLap) ? entry : best, null);
}

function raceRows(entries) {
  const fastest = fastestRaceEntry(entries);
  return entries.map((entry, index) => `
    <li class="pit-wall-classification-row${entry.player ? " is-player" : ""}" data-race-driver="${entry.driver.name}" role="row">
      <span class="pit-wall-classification-position" role="cell">P${index + 1}</span>
      <span class="pit-wall-classification-marker" role="cell" style="background-color:${entry.team.colour}" aria-label="${entry.driver.name}, ${entry.team.name}">${driverInitials(entry.driver)}</span>
      <strong class="pit-wall-classification-driver" role="cell">${entry.driver.name}</strong>
      <span class="pit-wall-classification-team" role="cell">${entry.team.name}</span>
      <span class="pit-wall-classification-tyre" data-race-tyre role="cell">${tyreLabel(entry.session.tyre)}</span>
      <span class="pit-wall-classification-best${entry === fastest ? " is-fastest" : ""}" data-race-best role="cell"${entry === fastest ? ` aria-label="Fastest lap of the session, ${formatLapTime(entry.bestLap)}"` : ""}>${formatLapTime(entry.bestLap)}</span>
      <span class="pit-wall-classification-gap" data-race-ahead role="cell">${raceGap(entry, entries[Math.max(0, index - 1)])}</span>
      <span class="pit-wall-classification-gap" data-race-gap role="cell">${raceGap(entry, entries[0])}</span>
    </li>`).join("");
}

function formatRaceTime(milliseconds) {
  if (milliseconds == null) return "—";
  const time = Math.round(milliseconds);
  const hours = Math.floor(time / 3600000);
  return `${hours}:${String(Math.floor(time % 3600000 / 60000)).padStart(2, "0")}:${String(Math.floor(time % 60000 / 1000)).padStart(2, "0")}.${String(time % 1000).padStart(3, "0")}`;
}

function finalRaceTable(race) {
  const entries = sprintClassification(race);
  const fastest = fastestRaceEntry(entries);
  return `<section class="pit-wall-final-classification" aria-label="Final Classification">
    <h4 id="pit-wall-review-title" tabindex="-1">Final Classification</h4>
    <table><thead><tr><th scope="col">Pos</th><th scope="col">Driver / Team</th><th scope="col">Time / Gap</th><th scope="col">Best</th><th scope="col">Pts</th></tr></thead>
      <tbody>${entries.map((entry, index) => `<tr${entry.player ? ' class="is-player"' : ""}>
        <td>P${index + 1}</td><td><span class="pit-wall-classification-marker" style="background-color:${entry.team.colour}">${driverInitials(entry.driver)}</span> <span class="pit-wall-result-person"><strong>${entry.driver.name}</strong><span>${entry.team.name} ${tyreLabel(entry.session.tyre)}</span></span></td>
        <td>${entry.retired ? "DNF" : index === 0 ? formatRaceTime(entry.finishedAt) : raceGap(entry, entries[0])}</td>
        <td${entry === fastest ? ' class="is-fastest" aria-label="Fastest lap of the race"' : ""}>${formatLapTime(entry.bestLap)}</td><td>${entry.points}</td>
      </tr>`).join("")}</tbody></table>
  </section>`;
}

function championshipTable(championship) {
  const entries = [...championship].sort((a, b) => b.points - a.points || a.order - b.order);
  return `<section class="pit-wall-standings" aria-label="Championship Standings">
    <h4>Championship Standings</h4>
    ${entries.length ? `<table><thead><tr><th scope="col">Pos</th><th scope="col">Driver / Team</th><th scope="col">Pts</th></tr></thead>
      <tbody>${entries.map((entry, index) => `<tr${entry.player ? ' class="is-player"' : ""}>
        <td>P${index + 1}</td><td><span class="pit-wall-classification-marker" style="background-color:${entry.team.colour}">${driverInitials(entry.driver)}</span> <span class="pit-wall-result-person"><strong>${entry.driver.name}</strong><span>${entry.team.name}</span></span></td><td>${entry.points}</td>
      </tr>`).join("")}</tbody></table>` : '<p>No championship results yet.</p>'}
  </section>`;
}

function driverDetails(driver) {
  return `
    <span class="pit-wall-driver-traits-label">Strengths</span>
    <span class="pit-wall-driver-traits">${driver.strengths.join(" &bull; ")}</span>
    <span class="pit-wall-driver-traits-label">Weakness</span>
    <span class="pit-wall-driver-traits">${driver.weakness}</span>
  `;
}

function teamDetails(team, includeDescription = false) {
  return `
    <span class="pit-wall-driver-traits-label">Team Bonus</span>
    <span class="pit-wall-driver-traits">+ ${team.bonus}</span>
    <span class="pit-wall-driver-traits-label">Team Weakness</span>
    <span class="pit-wall-driver-traits">${team.weakness}</span>
    ${includeDescription ? `
      <span class="pit-wall-driver-traits-label">Description</span>
      <span class="pit-wall-driver-traits">${team.description}</span>
    ` : ""}
  `;
}

const CAREER_SAVE_KEY = "pit-wall-career-v1";

function balanceMatches(value, template) {
  if (typeof template === "number") return typeof value === "number" && Number.isFinite(value);
  if (template === null || typeof template !== "object") return typeof value === typeof template;
  if (!value || typeof value !== "object" || Array.isArray(value) !== Array.isArray(template)) return false;
  return Object.keys(template).every((key) => balanceMatches(value[key], template[key]));
}

class PitWallConsole {
  constructor(rootElement, storage) {
    this.rootElement = rootElement;
    this.storage = storage;
    this.routeDebugEnabled = new URLSearchParams(rootElement.ownerDocument.defaultView.location.search).get("pitWallDebug") === "1";
    this.routes = new Map();
    this.balance = createBalance();
  }

  mount() {
    this.clearSessionTimer();
    this.clearRouteMarker();
    this.rootElement.innerHTML = `
      <div class="pit-wall-console">
        <!-- Header -->
        <header class="pit-wall-header">
          <div class="pit-wall-header-content">
            <div class="pit-wall-title-block">
              <h2>Pit Wall</h2>
              <p class="pit-wall-subtitle">Race Engineering Command Centre</p>
            </div>
            <div class="pit-wall-championship" hidden></div>
            <div class="pit-wall-header-info">
              <span class="pit-wall-info-label">Session Status</span>
              <span class="pit-wall-info-value">Ready</span>
            </div>
            ${this.routeDebugEnabled ? '<button type="button" class="pit-wall-discovery-action" data-action="balance-toggle" aria-expanded="false" aria-controls="pit-wall-balance-panel">Balance</button>' : ""}
            <a class="pit-wall-exit" href="#games-room-start">Games Room</a>
          </div>
          <span class="pit-wall-save-feedback" role="status" aria-live="polite"></span>
        </header>

        <!-- Main Layout -->
        <div class="pit-wall-layout">
          <!-- Left Panel: Driver/Team Information -->
          <aside class="pit-wall-panel pit-wall-panel-left">
            <div class="pit-wall-panel-header">
              <h3>Driver</h3>
            </div>
            <div class="pit-wall-panel-content" aria-live="polite">
              <div class="pit-wall-placeholder-block">
                <p class="pit-wall-placeholder-label">Driver Panel</p>
                <p class="pit-wall-placeholder-info">Team information and driver profile will appear here</p>
              </div>
            </div>
          </aside>

          <!-- Centre Panel: Track Display -->
          <main class="pit-wall-panel pit-wall-panel-centre">
            <div class="pit-wall-panel-header">
              <h3>Main</h3>
            </div>
            <div class="pit-wall-panel-content pit-wall-track-display">
              <div class="pit-wall-placeholder-block pit-wall-track-placeholder">
                <p class="pit-wall-placeholder-label">Pit Wall</p>
                <p class="pit-wall-placeholder-info">Select an option to begin</p>
              </div>
            </div>
          </main>

          <!-- Right Panel: Timing and Race Data -->
          <aside class="pit-wall-panel pit-wall-panel-right">
            <div class="pit-wall-panel-header">
              <h3>Timing</h3>
            </div>
            <div class="pit-wall-panel-content">
              ${TIMING_PLACEHOLDER}
            </div>
          </aside>
        </div>

        <!-- Bottom Panel: Command Centre -->
        <footer class="pit-wall-panel pit-wall-panel-bottom">
          <div class="pit-wall-panel-header">
            <h3>Command Centre</h3>
            <div class="pit-wall-command-status"></div>
          </div>
          <div class="pit-wall-command-body" id="pit-wall-command-content">
            <div class="pit-wall-panel-content">
              <div class="pit-wall-command-controls"><div class="pit-wall-command-actions">
                <button type="button" class="pit-wall-discovery-action" data-action="continue-game">Continue</button>
                <button type="button" class="pit-wall-discovery-action" data-action="new-game">New Game</button>
              </div>
              </div>
            </div>
          </div>
          <div class="pit-wall-route-tools" hidden></div>
        </footer>
        ${this.routeDebugEnabled ? '<section id="pit-wall-balance-panel" class="pit-wall-balance-panel" aria-label="Developer balance panel" hidden></section>' : ""}
      </div>
    `;

    if (this.routeDebugEnabled) {
      mountBalancePanel(this.rootElement, this.balance, DISCOVERIES, () => {
        this.refreshBalanceUpgrades();
        if (this.driver) this.renderProfile(this.rootElement.querySelector(".pit-wall-profile-status")?.textContent);
        if (this.weekendState) this.renderSession();
      }, () => {
        if (this.sessionTimer != null && this.weekendState?.practice && this.syncPracticeClock()) this.completeSession();
      }, () => this.balanceContext());
    }
    const continueButton = this.rootElement.querySelector('[data-action="continue-game"]');
    let saved = null;
    let hasSave = false;
    try {
      const raw = this.careerStorage().getItem(CAREER_SAVE_KEY);
      hasSave = raw !== null;
      if (hasSave) saved = this.parseCareer(raw);
    } catch (error) {
      this.showSaveError("Could not read career save", error);
    }
    continueButton.disabled = !saved;
    continueButton.addEventListener("click", () => {
      if (!saved || this.weekendState?.phase === "running") return;
      try {
        this.restoreCareer(saved);
      } catch (error) {
        this.showSaveError("Could not load career save", error);
      }
    });
    this.rootElement.querySelector('[data-action="new-game"]').addEventListener("click", () => {
      if (hasSave && !this.rootElement.ownerDocument.defaultView.confirm(
        "Starting a new career will overwrite the current save. Continue?")) return;
      this.startDraft();
    });

  }

  careerStorage() {
    return this.storage || this.rootElement.ownerDocument.defaultView.localStorage;
  }

  saveFeedback(message, error = false) {
    const feedback = this.rootElement.querySelector(".pit-wall-save-feedback");
    if (!feedback) return;
    clearTimeout(this.saveFeedbackTimer);
    feedback.textContent = message;
    feedback.setAttribute("role", error ? "alert" : "status");
    if (!error) this.saveFeedbackTimer = setTimeout(() => { feedback.textContent = ""; }, 3000);
  }

  showSaveError(message, error) {
    console.error(message, error);
    this.saveFeedback(`${message}: ${error.message}`, true);
  }

  parseCareer(raw) {
    const save = JSON.parse(raw);
    const fail = () => { throw new Error("Invalid or unsupported career save"); };
    if (!save || save.version !== 1 || !Array.isArray(save.weekends) || !save.weekends.length
      || new Set(save.weekends).size !== save.weekends.length
      || !save.weekends.every((id) => WEEKENDS.some((weekend) => weekend.id === id))
      || !Number.isInteger(save.round) || save.round < 0 || save.round >= save.weekends.length
      || !Number.isInteger(save.roundsCompleted) || save.roundsCompleted < 0 || save.roundsCompleted > save.weekends.length
      || !DRIVERS.some((driver) => driver.name === save.driver)
      || !TEAMS.some((team) => team.name === save.team)
      || !balanceMatches(save.balance, createBalance())) fail();
    const weekend = WEEKENDS.find((item) => item.id === save.weekends[save.round]);
    const state = save.state;
    if (!state || !["ready", "review", "discovery", "complete"].includes(state.phase)
      || !Number.isInteger(state.sessionIndex) || state.sessionIndex < 0
      || state.sessionIndex > weekend.sessions.length
      || (state.phase === "complete") !== (state.sessionIndex === weekend.sessions.length)
      || !Array.isArray(state.sessionResults) || state.sessionResults.length !== weekend.sessions.length
      || !state.sessionResults.every((result) => ["pending", "completed", "skipped"].includes(result))
      || !state.setup || !Object.hasOwn(save.balance.tyres, state.setup.tyre)
      || !Number.isFinite(state.setup.fuel) || state.setup.fuel < .1 || state.setup.fuel > 100
      || (state.setup.mode && !Object.hasOwn(save.balance.modes, state.setup.mode))
      || !Number.isInteger(state.rerollsRemaining) || state.rerollsRemaining < 0
      || !Number.isInteger(state.replacementsRemaining) || state.replacementsRemaining < 0) fail();
    const validDiscovery = (item) => item && DISCOVERIES.some((base) => base.id === item.id)
      && (item.level === undefined || (Number.isInteger(item.level) && item.level > 0))
      && (item.amount === undefined || Number.isFinite(item.amount));
    if (![save.permanentUpgrades, save.weekendDiscoveries, state.options].every(
      (items) => Array.isArray(items) && items.every(validDiscovery))
      || !Array.isArray(save.uniqueRewards) || !save.uniqueRewards.every((id) => DISCOVERIES.some((item) => item.id === id))
      || (state.phase === "discovery" && !state.options.length)
      || !Array.isArray(save.championship)) fail();
    const canonicalEntry = (entry) => {
      if (!entry || !DRIVERS.some((driver) => driver.name === entry.driver?.name)
        || !TEAMS.some((team) => team.name === entry.team?.name) || typeof entry.player !== "boolean") fail();
      entry.driver = DRIVERS.find((driver) => driver.name === entry.driver.name);
      entry.team = TEAMS.find((team) => team.name === entry.team.name);
    };
    save.championship.forEach((entry) => {
      canonicalEntry(entry);
      if (!Number.isFinite(entry.points) || entry.points < 0 || !Number.isInteger(entry.order)) fail();
    });
    for (const grid of [state.sprintGrid, state.grandPrixGrid]) {
      if (grid !== null) {
        if (!grid || !Array.isArray(grid.entries) || !grid.entries.length) fail();
        grid.entries.forEach(canonicalEntry);
      }
    }
    const canonicalDiscovery = (item) => {
      const base = DISCOVERIES.find((discovery) => discovery.id === item.id);
      return { ...base, ...(item.level === undefined ? {} : { level: item.level }),
        ...(item.amount === undefined ? {} : { amount: item.amount }),
        ...(item.amount === undefined || !base.stat ? {} : { effect: `+${item.amount} ${base.stat}` }) };
    };
    save.permanentUpgrades = save.permanentUpgrades.map(canonicalDiscovery);
    save.weekendDiscoveries = save.weekendDiscoveries.map(canonicalDiscovery);
    state.options = state.options.map(canonicalDiscovery);
    return save;
  }

  saveCareer() {
    const state = this.weekendState;
    if (!state || state.phase === "running") return;
    const snapshot = {
      version: 1, driver: this.driver.name, team: this.team.name,
      weekends: this.seasonWeekends.map((weekend) => weekend.id), round: this.currentRoundIndex,
      roundsCompleted: this.roundsCompleted, championship: this.championship,
      permanentUpgrades: this.permanentUpgrades, weekendDiscoveries: this.weekendDiscoveries,
      uniqueRewards: [...this.uniqueRewards], balance: this.balance,
      state: {
        phase: state.phase, sessionIndex: state.sessionIndex, sessionResults: state.sessionResults,
        setup: state.setup, sprintGrid: state.sprintGrid, grandPrixGrid: state.grandPrixGrid,
        options: state.options, rerollsRemaining: state.rerollsRemaining,
        replacementsRemaining: state.replacementsRemaining,
      },
    };
    try {
      const raw = JSON.stringify(snapshot);
      this.parseCareer(raw);
      this.careerStorage().setItem(CAREER_SAVE_KEY, raw);
      this.saveFeedback("Career Saved");
    } catch (error) {
      this.showSaveError("Could not save career", error);
    }
  }

  restoreCareer(save) {
    this.clearSessionTimer();
    this.clearRouteMarker();
    this.routes.clear();
    this.driver = DRIVERS.find((driver) => driver.name === save.driver);
    this.team = TEAMS.find((team) => team.name === save.team);
    this.seasonWeekends = save.weekends.map((id) => WEEKENDS.find((weekend) => weekend.id === id));
    this.selectedWeekends = new Set(save.weekends);
    this.currentRoundIndex = save.round;
    this.roundsCompleted = save.roundsCompleted;
    this.championship = save.championship;
    this.permanentUpgrades = save.permanentUpgrades;
    this.uniqueRewards = new Set(save.uniqueRewards);
    Object.assign(this.balance, save.balance);
    this.renderWeekend(this.seasonWeekends[this.currentRoundIndex]);
    this.weekendDiscoveries = save.weekendDiscoveries;
    Object.assign(this.weekendState, save.state);
    const state = this.weekendState;
    if (state.phase === "review") {
      if (state.options.length) {
        state.phase = "discovery";
        state.discoveryPrepared = true;
      } else {
        this.advanceSession("No discovery awarded.");
        return;
      }
    } else if (state.phase === "complete") {
      if (this.currentRoundIndex < this.seasonWeekends.length - 1) {
        this.currentRoundIndex += 1;
        this.renderWeekend(this.seasonWeekends[this.currentRoundIndex]);
        this.saveCareer();
      } else {
        this.renderSeasonComplete("");
      }
      return;
    }
    this.renderProfile("Race Weekend Ready");
    this.renderSession();
  }

  startDraft() {
    this.clearSessionTimer();
    this.clearRouteMarker();
    this.routeOverlay?.remove();
    this.routeOverlay = null;
    this.routes.clear();
    this.driver = null;
    this.team = null;
    this.permanentUpgrades = [];
    this.weekendDiscoveries = [];
    this.uniqueRewards = new Set();
    this.weekendState = null;
    this.rootElement.querySelector(".pit-wall-route-tools").innerHTML = "";
    this.rootElement.querySelector(".pit-wall-route-tools").hidden = true;
    this.rootElement.querySelector(".pit-wall-championship").hidden = true;
    this.championship = [];
    this.renderCommand();
    this.seasonWeekends = [];
    this.currentRoundIndex = 0;
    this.roundsCompleted = 0;
    this.selectedWeekends = new Set(WEEKENDS.map((weekend) => weekend.id));
    const driverPanel = this.rootElement.querySelector(".pit-wall-panel-left .pit-wall-panel-content");
    const mainPanel = this.rootElement.querySelector(".pit-wall-track-display");
    mainPanel.classList.remove("pit-wall-weekend-display");
    this.rootElement.querySelector(".pit-wall-panel-right .pit-wall-panel-content").innerHTML = TIMING_PLACEHOLDER;
    this.rootElement.querySelector(".pit-wall-info-value").textContent = "Ready";
    driverPanel.innerHTML = `
      <div class="pit-wall-placeholder-block">
        <p class="pit-wall-placeholder-label">Driver Panel</p>
        <p class="pit-wall-placeholder-info">Choose a driver to join your team</p>
      </div>
    `;
    this.renderDraft("driver");
  }

  renderProfile(status) {
    const driverPanel = this.rootElement.querySelector(".pit-wall-panel-left .pit-wall-panel-content");
    const showClassification = Boolean(this.weekendState
      && (this.weekendState.classification || this.weekendState.race) && this.weekendState.practice);
    const active = [...this.weekendDiscoveries, ...this.permanentUpgrades];
    const rarityOrder = { green: 0, blue: 1, purple: 2, gold: 3 };
    const unique = active.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    const labels = { green: "Weekend discovery", blue: "Permanent upgrade", purple: "Rare breakthrough", gold: "Legendary discovery" };
    const profile = `
      <div class="pit-wall-driver-profile${this.weekendState ? " pit-wall-driver-profile-weekend" : ""}">
        ${portrait(this.driver)}
        <p class="pit-wall-driver-profile-label">Selected Driver</p>
        <p class="pit-wall-driver-name">${this.driver.name}</p>
        ${this.team ? `
          <p class="pit-wall-driver-profile-label">Selected Team</p>
          <p class="pit-wall-driver-name">${this.team.name}</p>
          <span class="pit-wall-driver-profile-label">Driver Traits</span>
        ` : ""}
        ${driverDetails(this.driver)}
        ${this.team ? `
          <span class="pit-wall-driver-profile-label">Team Traits</span>
          ${teamDetails(this.team)}
        ` : ""}
        ${status ? `<p class="pit-wall-profile-status">${status}</p>` : ""}
        ${this.weekendState ? `
          <section class="pit-wall-season-progress" aria-label="Season Progress">
            <span class="pit-wall-driver-profile-label">Season Progress</span>
            <span>Rounds Completed: ${this.roundsCompleted}</span>
          </section>
          <section class="pit-wall-active-upgrades" aria-label="Active Upgrades">
            <span class="pit-wall-driver-profile-label">Active Upgrades</span>
            ${unique.length ? `
              <ul class="pit-wall-upgrade-list">${unique.map((upgrade) => {
                const hasStat = upgrade.stat && typeof upgrade.amount === "number";
                const value = hasStat ? ` ${upgrade.effect}` : upgrade.stackable ? ` +${upgrade.level}` : "";
                const level = hasStat && upgrade.stackable && upgrade.amount !== upgrade.level ? ` (Lv ${upgrade.level})` : "";
                return `<li class="${upgrade.rarity}" aria-label="${labels[upgrade.rarity]}: ${upgrade.name}${value}${upgrade.stackable ? `, level ${upgrade.level}` : ""}">${upgrade.name}${value}${level}</li>`;
              }).join("")}</ul>
            ` : '<span class="pit-wall-upgrade-empty">None yet</span>'}
          </section>
        ` : ""}
      </div>
    `;
    if (showClassification) {
      driverPanel.innerHTML = `
        <section class="pit-wall-classification" aria-label="Practice Classification"><h4>Practice Classification</h4>
          <div role="table" aria-label="Classification">
            <div class="pit-wall-classification-columns" role="row">
              <span role="columnheader">Pos</span><span role="columnheader" aria-label="Driver initials">ID</span>
              <span class="pit-wall-classification-driver" role="columnheader">Driver</span><span class="pit-wall-classification-team" role="columnheader">Team</span><span role="columnheader">Tyre</span>
              <span role="columnheader">Best Lap</span><span role="columnheader">Gap<br>Ahead</span><span role="columnheader">Gap<br>Leader</span>
            </div>
            <ol role="rowgroup"></ol>
          </div>
        </section>
        <section class="pit-wall-driver-details${this.weekendState.phase === "running" ? " is-active" : ""}" aria-label="Driver Details" tabindex="0">
          <h4>Driver Details</h4>
          <button type="button" class="pit-wall-details-toggle" aria-expanded="${Boolean(this.weekendState.driverDetailsExpanded)}">Driver Details</button>
          <div class="pit-wall-driver-details-content">
          <p><strong>Driver</strong> ${this.driver.name}</p>
          <p><strong>Team</strong> ${this.team.name}</p>
          <p><strong>Strengths</strong> ${this.driver.strengths.join(" · ")}</p>
          <p><strong>Weakness</strong> ${this.driver.weakness}</p>
          <p><strong>Team traits</strong> +${this.team.bonus} · −${this.team.weakness}</p>
          <p><strong>Active Upgrades</strong></p>
          ${unique.length ? `<ul class="pit-wall-upgrade-list">${unique.map((upgrade) =>
    `<li class="${upgrade.rarity}" aria-label="${labels[upgrade.rarity]}: ${upgrade.name} ${upgrade.stat ? upgrade.effect : this.effectiveDiscovery(upgrade).effect || ""}${upgrade.stackable ? `, level ${upgrade.level}` : ""}">${upgrade.name} ${upgrade.stat ? upgrade.effect : this.effectiveDiscovery(upgrade).effect || ""}${upgrade.stackable ? ` (Lv ${upgrade.level})` : ""}</li>`).join("")}</ul>`
    : '<span class="pit-wall-upgrade-empty">None yet</span>'}
          </div>
        </section>`;
    } else {
      driverPanel.innerHTML = profile;
    }
    if (showClassification) {
      driverPanel.querySelector(".pit-wall-details-toggle").addEventListener("click", (event) => {
        this.weekendState.driverDetailsExpanded = !this.weekendState.driverDetailsExpanded;
        event.currentTarget.setAttribute("aria-expanded", String(this.weekendState.driverDetailsExpanded));
      });
      this.updateClassification();
    }
    if (status) this.rootElement.querySelector(".pit-wall-info-value").textContent = status;
  }

  updateClassification() {
    const state = this.weekendState;
    const list = this.rootElement.querySelector(".pit-wall-classification ol");
    if (!list || !state) return;
    if (this.isRace() && state.race) {
      const title = state.phase === "review" || state.phase === "discovery" ? "Final Classification"
        : this.isGrandPrix() ? "Grand Prix Classification" : "Sprint Race Classification";
      const section = list.closest(".pit-wall-classification");
      if (section.getAttribute("aria-label") !== title) {
        section.querySelector("h4").textContent = title;
        section.setAttribute("aria-label", title);
      }
      const entries = sprintClassification(state.race);
      const fastest = fastestRaceEntry(entries);
      const signature = JSON.stringify([title, ...entries.map((entry) =>
        [entry.driver.name, entry.session.tyre, raceGap(entry, entries[0]), raceGap(entry, entries[Math.max(0, entries.indexOf(entry) - 1)]), entry.bestLap])]);
      if (list.dataset.signature === signature) return;
      if (list.dataset.mode !== "race") {
        list.innerHTML = raceRows(entries);
      } else {
        const rows = new Map([...list.children].map((row) => [row.dataset.raceDriver, row]));
        entries.forEach((entry, index) => {
          const row = rows.get(entry.driver.name);
          if (list.children[index] !== row) list.insertBefore(row, list.children[index] || null);
          const position = row.querySelector(".pit-wall-classification-position");
          const gap = row.querySelector("[data-race-gap]");
          const ahead = row.querySelector("[data-race-ahead]");
          const best = row.querySelector("[data-race-best]");
          const tyre = row.querySelector("[data-race-tyre]");
          if (tyre.querySelector(".pit-wall-tyre-label")?.dataset.tyre !== entry.session.tyre) tyre.innerHTML = tyreLabel(entry.session.tyre);
          const gapText = raceGap(entry, entries[0]);
          const aheadText = raceGap(entry, entries[Math.max(0, index - 1)]);
          const bestText = formatLapTime(entry.bestLap);
          if (position.textContent !== `P${index + 1}`) position.textContent = `P${index + 1}`;
          if (gap.textContent !== gapText) gap.textContent = gapText;
          if (ahead.textContent !== aheadText) ahead.textContent = aheadText;
          if (best.textContent !== bestText) best.textContent = bestText;
          best.classList.toggle("is-fastest", entry === fastest);
          if (entry === fastest) best.setAttribute("aria-label", `Fastest lap of the session, ${bestText}`);
          else best.removeAttribute("aria-label");
        });
      }
      list.dataset.mode = "race";
      list.dataset.signature = signature;
      return;
    }
    if (!state.classification || !state.practice) return;
    const type = this.isSprintQualifying() ? "Sprint Qualifying" : this.isQualifying() ? "Qualifying" : "Practice";
    const title = `${state.phase === "review" ? "Final " : ""}${type} Classification`;
    const section = list.closest(".pit-wall-classification");
    if (section.getAttribute("aria-label") !== title) {
      section.querySelector("h4").textContent = title;
      section.setAttribute("aria-label", title);
    }
    const entries = practiceClassification(state.classification, state.practice);
    const signature = JSON.stringify([title, ...entries.map((entry) =>
      [entry.driver.name, entry.bestLap, entry.currentTyre, entry.inPit])]);
    if (list.dataset.signature === signature) return;
    list.innerHTML = classificationRows(entries);
    list.dataset.signature = signature;
  }

  renderDraft(kind) {
    const isDriver = kind === "driver";
    const candidates = shortlist(isDriver ? DRIVERS : TEAMS);
    const mainPanel = this.rootElement.querySelector(".pit-wall-track-display");
    mainPanel.classList.add("pit-wall-draft-display");
    mainPanel.innerHTML = `
      <section class="pit-wall-draft" aria-labelledby="pit-wall-draft-title">
        <p class="pit-wall-draft-eyebrow">Build your team</p>
        <h4 id="pit-wall-draft-title" tabindex="-1">${isDriver ? "Driver" : "Team"} Draft</h4>
        <p class="pit-wall-draft-intro">Choose one ${kind} from your shortlist.</p>
        <div class="pit-wall-draft-cards">
          ${candidates.map((candidate, index) => `
            <label class="pit-wall-driver-card" data-${kind}-index="${index}">
              <input class="pit-wall-selection-input" type="radio" name="pit-wall-${kind}-draft" value="${index}" aria-label="${candidate.name}">
              <span class="pit-wall-card-choice">
                ${isDriver ? portrait(candidate) : ""}
                <span class="pit-wall-driver-name">${candidate.name}</span>
                ${isDriver ? driverDetails(candidate) : teamDetails(candidate, true)}
              </span>
              <span class="pit-wall-card-footer"><span class="pit-wall-driver-select">Select ${kind}</span></span>
            </label>
          `).join("")}
        </div>
      </section>
    `;

    const command = this.rootElement.querySelector(".pit-wall-command-body > .pit-wall-panel-content");
    command.innerHTML = `<div class="pit-wall-command-controls"><div class="pit-wall-command-actions">
      <button type="button" class="pit-wall-discovery-action pit-wall-confirm-button" disabled>Confirm ${kind}</button>
    </div></div>`;
    const confirm = command.querySelector(".pit-wall-confirm-button");
    let selectedIndex = null;
    const cards = mainPanel.querySelectorAll(`[data-${kind}-index]`);
    cards.forEach((card, index) => {
      card.querySelector("input").addEventListener("change", () => {
        selectedIndex = index;
        confirm.disabled = false;
        confirm.setAttribute("aria-label", `Confirm ${candidates[index].name}`);
        cards.forEach((other) => {
          const selected = other === card;
          other.classList.toggle("is-selected", selected);
          other.querySelector(".pit-wall-driver-select").textContent = selected ? "Selected" : `Select ${kind}`;
        });
        if (isDriver) {
          this.driver = candidates[index];
          this.renderProfile();
        }
      });
    });
    confirm.addEventListener("click", () => {
      if (selectedIndex === null) return;
      if (isDriver) {
        this.driver = candidates[selectedIndex];
        this.renderProfile("Driver Confirmed");
        this.renderDraft("team");
      } else {
        this.team = candidates[selectedIndex];
        this.renderProfile("Ready For Season");
        this.renderSeasonSetup();
      }
      mainPanel.querySelector("#pit-wall-draft-title").focus();
    });
  }

  renderSeasonSetup() {
    const mainPanel = this.rootElement.querySelector(".pit-wall-track-display");
    mainPanel.innerHTML = `
      <section class="pit-wall-draft pit-wall-season" aria-labelledby="pit-wall-draft-title">
        <h4 id="pit-wall-draft-title" tabindex="-1">2027 Season Setup</h4>
        <div class="pit-wall-season-races"></div>
        <div class="pit-wall-season-footer">
          <span class="pit-wall-season-summary" data-season-count aria-live="polite"></span>
          <span class="pit-wall-season-warning" data-season-warning></span>
        </div>
      </section>
    `;

    const command = this.rootElement.querySelector(".pit-wall-command-body > .pit-wall-panel-content");
    command.innerHTML = '<div class="pit-wall-command-controls"><div class="pit-wall-command-actions"><button type="button" class="pit-wall-discovery-action pit-wall-season-confirm" data-action="confirm-season">Confirm Season</button></div></div>';
    const confirm = command.querySelector('[data-action="confirm-season"]');
    const renderCalendar = () => {
      const racesElement = mainPanel.querySelector(".pit-wall-season-races");
      racesElement.innerHTML = WEEKENDS.map((weekend) => `
        <label class="pit-wall-season-race" data-weekend="${weekend.id}">
          <input class="pit-wall-selection-input" type="checkbox" ${this.selectedWeekends.has(weekend.id) ? "checked" : ""}
            aria-label="Round ${weekend.round}, ${weekend.name}, ${weekend.dates}${weekend.sprint ? ", Sprint weekend" : ""}">
          <span class="pit-wall-season-round">R${weekend.round}</span>
          <span class="pit-wall-season-name">${weekend.name}</span>
          ${weekend.sprint ? '<span class="pit-wall-season-sprint">Sprint</span>' : ""}
          <span class="pit-wall-season-date">${weekend.dates.replace(/ \d{4}$/, "").replace(/\b[A-Za-z]{4,}\b/g, (month) => month.slice(0, 3))}</span>
        </label>
      `).join("");
      racesElement.querySelectorAll("[data-weekend]").forEach((card) => {
        const input = card.querySelector("input");
        input.addEventListener("change", () => {
          if (input.checked) this.selectedWeekends.add(card.dataset.weekend);
          else this.selectedWeekends.delete(card.dataset.weekend);
          updateSelection();
        });
      });
    };
    const updateSelection = () => {
      const count = this.selectedWeekends.size;
      const races = count === 1 ? "Race" : "Races";
      mainPanel.querySelector("[data-season-count]").textContent = `${count} ${races} Selected`;
      mainPanel.querySelector("[data-season-warning]").textContent = count ? "" : "Select at least one race.";
      confirm.disabled = count === 0;
    };
    confirm.addEventListener("click", () => {
      this.seasonWeekends = WEEKENDS.filter((weekend) => this.selectedWeekends.has(weekend.id));
      if (!this.seasonWeekends.length) {
        mainPanel.querySelector("[data-season-warning]").textContent = "Select at least one race.";
        return;
      }
      this.currentRoundIndex = 0;
      this.roundsCompleted = 0;
      this.renderWeekend(this.seasonWeekends[0]);
      this.saveCareer();
    });
    renderCalendar();
    updateSelection();
  }

  renderWeekend(weekend) {
    this.clearSessionTimer();
    this.clearRouteMarker();
    this.weekendDiscoveries = [];
    this.weekendState = {
      weekend,
      sessionIndex: 0,
      sessionResults: weekend.sessions.map(() => "pending"),
      phase: "ready",
      options: [],
      message: "",
      rerollsRemaining: 0,
      replacementsRemaining: 0,
      replacementMode: false,
      debugPaused: false,
      showRoute: false,
      editRoute: false,
      routeLoading: false,
      routeError: "",
      selectedWaypoint: null,
      elapsed: 0,
      markerLoading: false,
      markerError: "",
      practice: null,
      classification: null,
      sprintGrid: null,
      grandPrixGrid: null,
      race: null,
      setup: { tyre: "Medium", fuel: 100 },
    };
    const championship = this.rootElement.querySelector(".pit-wall-championship");
    championship.innerHTML = `<strong>2027 Championship</strong>
      <span>Round ${weekend.round} / ${WEEKENDS.length}</span>
      ${this.seasonWeekends.length !== WEEKENDS.length ? `<span>Selected: ${this.currentRoundIndex + 1} / ${this.seasonWeekends.length}</span>` : ""}
      <progress aria-label="Season progress" max="${this.seasonWeekends.length}" value="${this.roundsCompleted}"></progress>`;
    championship.hidden = false;
    const mainPanel = this.rootElement.querySelector(".pit-wall-track-display");
    this.renderProfile("Race Weekend Ready");
    mainPanel.classList.add("pit-wall-weekend-display");
    mainPanel.innerHTML = `
      <section class="pit-wall-weekend" aria-labelledby="pit-wall-weekend-title">
        <header class="pit-wall-weekend-banner">
          <div class="pit-wall-weekend-heading">
            <h4 id="pit-wall-weekend-title" tabindex="-1">${weekend.title}</h4>
            <span>${weekend.dates}</span>
          </div>
          <div class="pit-wall-weekend-facts">
            <span>${weekend.weatherIcon ? `<span aria-hidden="true">${weekend.weatherIcon}</span> ` : ""}${weekend.weather || "Weather: Not available"}</span>
            <span>Forecast: ${weekend.forecast || "Not available"}</span>
            <span>Track Conditions: ${weekend.trackCondition || "Green"}</span>
            <span>Circuit: ${weekend.circuitLength || "TBC"}</span>
            <span>Race Distance: ${weekend.laps ? `${weekend.laps} Laps` : "TBC"}</span>
          </div>
        </header>
        <ol class="pit-wall-session-tracker" aria-label="Weekend sessions"></ol>
        <div class="pit-wall-session-panel" aria-live="polite"></div>
        <div class="pit-wall-circuit">
          ${weekend.image ? `<img src="${weekend.image}" alt="${weekend.name} circuit map">` : `
            <div class="pit-wall-circuit-placeholder">
              <strong>Track Layout Coming Soon</strong>
              <span>${weekend.track}</span>
              <span>${weekend.country} · Round ${weekend.round}</span>
              <span>${weekend.format}</span>
              <span>Circuit Length: ${weekend.circuitLength || "TBC"} · Lap Count: ${weekend.laps || "TBC"}</span>
            </div>
          `}
        </div>
      </section>
    `;
    const image = mainPanel.querySelector(".pit-wall-circuit img");
    image?.addEventListener("error", () => {
      const message = document.createElement("p");
      message.className = "pit-wall-circuit-error";
      message.textContent = `The ${weekend.name} circuit image could not be loaded.`;
      image.replaceWith(message);
      console.error(message.textContent);
    });
    this.renderSession();
    mainPanel.querySelector("#pit-wall-weekend-title").focus();
  }

  renderTiming() {
    const state = this.weekendState;
    const timingPanel = this.rootElement.querySelector(".pit-wall-panel-right .pit-wall-panel-content");
    if (this.isTimedSession()) {
      timingPanel.innerHTML = `
        <div class="pit-wall-timing-live">
          <section class="pit-wall-telemetry" aria-label="Telemetry Summary">
            <p class="pit-wall-placeholder-label">Telemetry Summary</p>
            <dl>
              <div class="pit-wall-gauge-row"><dt>Tyre Condition</dt>
                <dd class="pit-wall-gauge" role="meter" aria-label="Tyre condition" aria-valuemin="0" aria-valuemax="100"><span></span></dd></div>
              <div class="pit-wall-gauge-row"><dt>Fuel Load</dt>
                <dd class="pit-wall-gauge" role="meter" aria-label="Fuel load" aria-valuemin="0" aria-valuemax="100"><span></span></dd></div>
              <div class="pit-wall-fuel-readout"><dt data-timing="fuel-percent"></dt><dd data-timing="fuel-range"></dd></div>
              <div><dt>${this.isRace() ? "Race Lap" : "Session Time Remaining"}</dt><dd data-timing="remaining"></dd></div>
            </dl>
          </section>
          <section class="pit-wall-lap-history" aria-label="Lap History">
            <p class="pit-wall-placeholder-label">Lap History</p>
            <ol class="pit-wall-lap-list" tabindex="0" aria-label="Lap history"></ol>
          </section>
        </div>`;
      this.updateTiming();
      return;
    }
    const weekend = state.weekend;
    timingPanel.innerHTML = `
      <div class="pit-wall-weekend-overview">
        <p class="pit-wall-placeholder-label">Weekend Overview</p>
        <dl>
          <dt>Weather</dt><dd>${weekend.weather || "Not available"}</dd>
          <dt>Circuit Length</dt><dd>${weekend.circuitLength || "TBC"}</dd>
          <dt>Lap Count</dt><dd>${weekend.laps ? `${weekend.laps} Laps` : "TBC"}</dd>
          <dt>Weekend Format</dt><dd>${weekend.format}</dd>
        </dl>
      </div>
    `;
  }

  updateTiming() {
    const timing = this.rootElement.querySelector(".pit-wall-telemetry");
    if (!timing) return;
    const practice = this.weekendState.practice;
    const useSetupFuel = !practice || (!this.isRace() && ["stopped", "entering"].includes(practice.pitState));
    const fuel = useSetupFuel ? this.weekendState.setup.fuel : practice.fuel;
    const mode = practice ? practice.mode : this.weekendState.setup.mode || "Balanced";
    const rate = fuelPerLap(this.balance, mode, practice ? practice.upgrades : this.activeDiscoveries(),
      practice ? practice.circuitLength : parseFloat(this.weekendState.weekend.circuitLength));
    const laps = practice ? practice.lapTimes : [];
    const values = {
      remaining: this.isRace() ? `${practice ? Math.min(practice.completedLaps + 1, this.weekendState.race.laps) : 1} / ${this.weekendState.race?.laps || this.raceLaps()}`
        : formatSessionTime((this.isQualifying() ? SPRINT_QUALIFYING_DURATION : PRACTICE_DURATION)
          - (practice ? practice.elapsed : 0)),
      "fuel-percent": `${Math.round(fuel * 10) / 10}%`,
      "fuel-range": rate > 0 ? `~${(fuel / rate).toFixed(1)} laps remaining` : "No fuel use",
    };
    Object.entries(values).forEach(([key, value]) => {
      const field = timing.querySelector(`[data-timing="${key}"]`);
      if (field.textContent !== String(value)) field.textContent = value;
    });
    for (const [label, value] of [
      ["Tyre condition", practice ? 100 - practice.tyreWear : 100],
      ["Fuel load", fuel],
    ]) {
      const meter = timing.querySelector(`[aria-label="${label}"]`);
      const level = Math.max(0, Math.min(100, value));
      const colour = `hsl(${level * 1.2}, 80%, 45%)`;
      meter.setAttribute("aria-valuenow", String(Math.round(level)));
      meter.style.borderColor = colour;
      meter.firstElementChild.style.width = `${level}%`;
      meter.firstElementChild.style.backgroundColor = colour;
    }
    const list = this.rootElement.querySelector(".pit-wall-lap-list");
    const running = this.weekendState.phase === "running" && practice
      && (practice.pitState === "none" || practice.pitState === "called");
    const qualifying = this.isQualifying();
    const version = `${laps.length}:${running}:${qualifying && practice?.outLap}:${qualifying && practice?.lapValid}`;
    if (list.dataset.version !== version) {
      let fastest = -1;
      laps.forEach((lap, index) => {
        if (fastest < 0 || lap <= laps[fastest]) fastest = index;
      });
      const rows = laps.map((lap, index) => `
        <li class="pit-wall-lap-entry${index === fastest ? " is-fastest" : ""}"${index === fastest ? ` aria-label="Lap ${index + 1}, ${formatLapTime(lap)}, fastest lap"` : ""}>
          <span>Lap ${index + 1}</span> <span>${formatLapTime(lap)}</span>
        </li>`).reverse();
      if (running) rows.unshift(`
        <li class="pit-wall-lap-entry is-current">
          <span>${qualifying && practice.outLap ? "Out Lap" : `Lap ${laps.length + 1}`}</span>
          <span>${qualifying ? practice.outLap ? "Warming" : !practice.lapValid ? "Low Fuel" : "Flying" : this.isRace() ? "Racing" : "In Progress"}</span>
        </li>`);
      if (!rows.length) rows.push('<li class="pit-wall-lap-empty">No laps yet</li>');
      list.innerHTML = rows.join("");
      list.dataset.version = version;
    }
    const goal = this.rootElement.querySelector("[data-practice-goal]");
    const goalText = laps.length >= MINIMUM_LAPS
      ? "Discovery goal achieved" : `Discovery data: ${laps.length} / ${MINIMUM_LAPS} laps`;
    if (goal && goal.textContent !== goalText) goal.textContent = goalText;
    const qualifyingStatus = this.rootElement.querySelector("[data-qualifying-status]");
    if (qualifyingStatus && practice) {
      qualifyingStatus.textContent = !running ? "In garage"
        : practice.outLap ? "Out Lap · Tyres Warming"
          : !practice.lapValid || practice.fuel <= 0 ? "Flying Lap · Insufficient Fuel"
            : "Flying Lap";
    }
    const raceStatus = this.rootElement.querySelector("[data-race-status]");
    if (raceStatus && this.weekendState.race) {
      const race = this.weekendState.race;
      raceStatus.textContent = race.started ? `Lap ${Math.min(practice.completedLaps + 1, race.laps)} / ${race.laps}` : "Starting lights";
    }
    this.updateCommand();
    this.updateClassification();
  }

  renderCommand() {
    const state = this.weekendState;
    const content = this.rootElement.querySelector(".pit-wall-command-body > .pit-wall-panel-content");
    let status = "";
    const practiceAvailable = state && this.isTimedSession() && (state.phase === "ready" || state.phase === "running");
    const running = practiceAvailable && state.phase === "running";
    if (state && practiceAvailable) {
      const race = this.isRace();
      status = `<strong class="pit-wall-session-name" tabindex="-1">${state.weekend.sessions[state.sessionIndex]}${!running && race ? " · Race Setup" : ""}</strong>
        ${running ? `<span class="pit-wall-session-running">${state.debugPaused ? "Paused (Route Debug)" : state.practice.speed === 0 ? "Paused" : "Running..."}</span>
          ${race ? '<span data-race-status>Starting lights</span>' : this.isQualifying() ? '<span data-qualifying-status>In garage</span>' : '<span data-practice-goal></span>'}
          <span data-pit-status role="status"></span>` : "<span>Ready</span>"}`;
    } else if (state?.phase === "complete") {
      status = this.currentRoundIndex === this.seasonWeekends.length - 1 ? "Season Complete" : "Weekend Complete";
    } else if (state?.phase === "review" || state?.phase === "discovery") {
      status = `${state.weekend.sessions[state.sessionIndex]} · ${state.phase === "review" ? "Complete" : "Engineering Discovery"}`;
    }
    this.rootElement.querySelector(".pit-wall-command-status").innerHTML = status;
    if (!practiceAvailable) {
      if (state?.phase === "review" || state?.phase === "discovery"
        || (state?.phase === "complete" && this.currentRoundIndex < this.seasonWeekends.length - 1)) {
        const review = state.phase === "review";
        const complete = state.phase === "complete";
        const enoughData = review && (this.isRace() || this.isQualifying() || state.practice.lapTimes.length >= MINIMUM_LAPS);
        const action = complete ? '<button type="button" class="pit-wall-discovery-action" data-action="next-round">Proceed To Next Round</button>'
          : review ? `<button type="button" class="pit-wall-discovery-action" data-action="continue-review">${this.isRace() || this.isQualifying() ? "Continue" : enoughData ? "Choose Engineering Discovery" : "Continue to Next Session"}</button>`
            : `${state.rerollsRemaining ? `<button type="button" class="pit-wall-discovery-action" data-action="reroll-discoveries">Reroll all (${state.rerollsRemaining})</button>` : ""}
              ${state.replacementsRemaining ? `<button type="button" class="pit-wall-discovery-action" data-action="replace-discovery" aria-pressed="${state.replacementMode}">Reroll one (${state.replacementsRemaining})</button>` : ""}`;
        content.innerHTML = `<div class="pit-wall-command-controls"><div class="pit-wall-command-operations">
          <div class="pit-wall-command-actions">${action}</div></div></div>`;
        content.querySelector('[data-action="next-round"]')?.addEventListener("click", () => {
          if (this.weekendState !== state || state.phase !== "complete") return;
          this.currentRoundIndex += 1;
          this.renderWeekend(this.seasonWeekends[this.currentRoundIndex]);
          this.saveCareer();
        });
        content.querySelector('[data-action="continue-review"]')?.addEventListener("click", () => {
          if (state.phase !== "review") return;
          if (enoughData) this.offerDiscoveries();
          else this.advanceSession("No discovery awarded: insufficient data.");
        });
        content.querySelector('[data-action="reroll-discoveries"]')?.addEventListener("click", () => this.rerollDiscoveries());
        content.querySelector('[data-action="replace-discovery"]')?.addEventListener("click", () => {
          state.replacementMode = !state.replacementMode;
          this.renderSession();
          this.rootElement.querySelector('[data-action="replace-discovery"]').focus();
        });
        return;
      }
      content.innerHTML = `<div class="pit-wall-placeholder-block">
        <p class="pit-wall-placeholder-label">Radio & Strategy Controls</p>
        <p class="pit-wall-placeholder-info">Controls are available during practice, qualifying and races.</p>
      </div>`;
      return;
    }
    const race = this.isRace();
    if (!running && !race) {
      content.innerHTML = `<div class="pit-wall-command-controls"><div class="pit-wall-command-operations">
        <div class="pit-wall-command-actions"><button type="button" class="pit-wall-discovery-action" data-action="start-session">Start Session</button></div></div></div>`;
      content.querySelector('[data-action="start-session"]').addEventListener("click", () => this.startSession());
      return;
    }
    content.innerHTML = `
      <div class="pit-wall-command-controls">
        <div class="pit-wall-command-group" role="group" aria-label="Driver mode">
          <span class="pit-wall-command-group-label">Driver Mode</span>
          <div class="pit-wall-command-group-controls">
          ${Object.keys(this.balance.modes).map((mode) =>
    `<button type="button" class="pit-wall-discovery-action" data-driver-mode="${mode}">${mode}</button>`).join("")}
          </div>
        </div>
        <div class="pit-wall-command-group" role="group" aria-label="${running ? "Next stint tyre" : "Starting tyre"}">
          <span class="pit-wall-command-group-label">${running ? "Next Tyre Choice" : "Starting Tyre"}</span>
          <div class="pit-wall-command-group-controls">
          ${Object.keys(this.balance.tyres).map((tyre) =>
    `<button type="button" class="pit-wall-discovery-action pit-wall-tyre-button" data-tyre="${tyre}" data-setup-tyre="${tyre}" aria-label="${tyre}" title="${tyre}"><span class="pit-wall-tyre-full">${tyre}</span><span class="pit-wall-tyre-short" aria-hidden="true">${tyre[0]}</span></button>`).join("")}
          </div>
        </div>
        <div class="pit-wall-command-group" role="group" aria-label="${running ? "Next fuel" : "Starting fuel"}">
          <span class="pit-wall-command-group-label">${running ? "Next Fuel" : "Starting Fuel"}</span>
          <label class="pit-wall-setup-fuel">
            <input type="range" aria-label="${running ? "Next Fuel" : "Starting Fuel"}" min="${this.isQualifying() ? ".1" : "10"}" max="100" step="${this.isQualifying() ? ".1" : "1"}" value="${state.setup.fuel}" data-setup-fuel>
            <output data-setup-fuel-value>${state.setup.fuel}%</output>${!running ? '<span data-setup-range></span>' : ""}
          </label>
        </div>
        <div class="pit-wall-command-operations">
          <div class="pit-wall-operational-controls">
          ${running ? `<div class="pit-wall-command-group" role="group" aria-label="Session speed">
            <span class="pit-wall-command-group-label">Session Speed</span>
            <div class="pit-wall-speed-buttons">
            ${[0, 1, 10, 50].map((speed) => `<button type="button" class="pit-wall-discovery-action" data-speed="${speed}" aria-pressed="${state.practice.speed === speed}"${speed === 0 ? ' aria-label="Pause"' : ""}>${speed === 0 ? "⏸" : `${speed}x`}</button>`).join("")}
            </div>
          </div>` : ""}
          <div class="pit-wall-command-actions">
          ${running ? `
          <button type="button" class="pit-wall-discovery-action" data-action="call-pit" disabled hidden>Call To Pit</button>
          <button type="button" class="pit-wall-discovery-action" data-action="send-out" disabled${race ? " hidden" : ""}>Send Out</button>
          ${race ? "" : `<button type="button" class="pit-wall-discovery-action" data-action="complete-session"${this.hasSessionRoute() && !this.routeMarker ? " disabled" : ""}>Complete Session</button>`}` : '<button type="button" class="pit-wall-discovery-action" data-action="start-session">Start Race</button>'}
          </div>
          </div>
        </div>
      </div>`;
    content.querySelector('[data-action="start-session"]')?.addEventListener("click", () => this.startSession());
    content.querySelector('[data-action="complete-session"]')?.addEventListener("click", () => this.completeSession());
    content.querySelectorAll("[data-speed]").forEach((button) => {
      button.addEventListener("click", () => this.setPracticeSpeed(Number(button.dataset.speed)));
    });
    const sync = () => {
      if (!running) return state.phase === "ready";
      if (this.sessionTimer != null && this.syncPracticeClock()) {
        this.completeSession();
        return false;
      }
      return state.phase === "running";
    };
    content.querySelectorAll("[data-driver-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!sync()) return;
        if (!running) {
          state.setup.mode = button.dataset.driverMode;
          this.updateTiming();
          this.saveCareer();
          return;
        }
        if (race && (state.race.entries.find((entry) => entry.player).retired
          || state.race.entries.find((entry) => entry.player).finishedAt !== null)) return;
        setDriverMode(state.practice, button.dataset.driverMode);
        this.updateTiming();
      });
    });
    content.querySelector('[data-action="call-pit"]')?.addEventListener("click", () => {
      if (!sync()) return;
      if (state.practice.pitState === "called") cancelPitCall(state.practice);
      else callToPit(state.practice);
      this.updateTiming();
    });
    content.querySelector('[data-action="send-out"]')?.addEventListener("click", () => {
      if (!sync()) return;
      if (sendPracticeOut(state.practice, state.setup)) {
        this.routeMarker?.update();
        this.updateTiming();
      }
    });
    content.querySelectorAll("[data-setup-tyre]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!sync()) return;
        state.setup.tyre = button.dataset.setupTyre;
        this.updateTiming();
        if (!running) this.saveCareer();
      });
    });
    content.querySelector("[data-setup-fuel]").addEventListener("input", (event) => {
      const fuel = Number(event.currentTarget.value);
      if (!sync()) return;
      if (race && running) {
        this.updateTiming();
        return;
      }
      state.setup.fuel = fuel;
      this.updateTiming();
    });
    content.querySelector("[data-setup-fuel]").addEventListener("change", () => {
      if (state.phase === "ready") this.saveCareer();
    });
    this.updateCommand();
  }

  updateCommand() {
    const state = this.weekendState;
    if (!state || !this.isTimedSession() || !["ready", "running"].includes(state.phase)) return;
    const practice = state.practice;
    const content = this.rootElement.querySelector(".pit-wall-command-body > .pit-wall-panel-content");
    if (!content.querySelector("[data-setup-fuel]")) return;
    content.querySelectorAll("[data-setup-tyre]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.setupTyre === state.setup.tyre));
    });
    content.querySelector("[data-setup-fuel]").value = String(state.setup.fuel);
    const race = this.isRace();
    content.querySelector("[data-setup-fuel]").disabled = race && state.phase === "running";
    const rate = fuelPerLap(this.balance, practice ? practice.mode : state.setup.mode || "Balanced", this.activeDiscoveries(),
      practice ? practice.circuitLength : parseFloat(state.weekend.circuitLength));
    content.querySelector("[data-setup-fuel-value]").textContent = `${state.setup.fuel}%`;
    const setupRange = content.querySelector("[data-setup-range]");
    if (setupRange) setupRange.textContent = rate > 0 ? `≈ ${(state.setup.fuel / rate).toFixed(1)} laps` : "No fuel use";
    if (!practice) {
      if (race) content.querySelectorAll("[data-driver-mode]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.driverMode === (state.setup.mode || "Balanced")));
      });
      return;
    }
    content.querySelectorAll("[data-driver-mode]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.driverMode === practice.mode));
    });
    const call = content.querySelector('[data-action="call-pit"]');
    if (!call) return;
    const racer = race ? state.race.entries.find((entry) => entry.player) : null;
    const onTrack = ["none", "called"].includes(practice.pitState)
      && (!race || (state.race.started && !racer.retired && racer.finishedAt === null));
    call.hidden = !onTrack || practice.speed === 0 || state.debugPaused;
    call.disabled = !["none", "called"].includes(practice.pitState) || (race && (!state.race.started || racer.retired || racer.finishedAt !== null));
    call.textContent = practice.pitState === "called" ? "Cancel Pit Call" : "Call To Pit";
    const send = content.querySelector('[data-action="send-out"]');
    send.hidden = race || onTrack;
    send.disabled = practice.pitState !== "stopped"
      || (this.hasSessionRoute() && !this.routeMarker);
    const status = this.rootElement.querySelector("[data-pit-status]");
    const fuelShort = race && rate > 0 && practice.fuel / rate + 1e-6
      < state.race.laps - practice.completedLaps - practice.lapProgress;
    const statusText = race && racer.retired ? "Out of fuel · retired"
      : race && racer.finishedAt !== null ? "Finished"
      : practice.pitState === "called" ? "Pit requested · awaiting lap end"
      : practice.pitState === "entering" ? `Pit entry · ${Math.ceil(practice.pitRemaining / 1000)}s`
        : practice.pitState === "stopped" ? "In garage · ready to send out"
        : fuelShort ? "Fuel short at this mode" : race && !state.race.started ? "On grid" : "On track";
    if (status && status.textContent !== statusText) status.textContent = statusText;
  }

  clearSessionTimer() {
    if (this.sessionTimer != null) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  clearRouteMarker() {
    this.routeMarkers?.forEach((marker) => marker.remove());
    this.routeMarkers = [];
    this.routeMarker = null;
    this.rootElement.querySelectorAll("[data-sprint-overlay]").forEach((element) => element.remove());
    this.rootElement.querySelector(".pit-wall-circuit")?.classList.remove("has-schematic");
  }

  hasMappedRoute() {
    return Boolean(this.weekendState.weekend.mappedRoute) && this.isTimedSession();
  }

  hasSessionRoute() {
    return this.hasMappedRoute() || this.isRace();
  }

  routeFilename(weekend) {
    return `${weekend.routeId || weekend.id}-route.json`;
  }

  async readTrackRoute(state) {
    const cached = this.routes.get(state.weekend.id);
    if (cached) return cached;
    const image = this.rootElement.querySelector(".pit-wall-circuit img");
    if (!image) throw new Error("Circuit image is unavailable");
    await image.decode();
    return loadRoute(this.routeFilename(state.weekend), image.naturalWidth, image.naturalHeight);
  }

  mountTrackRouteDebug(state, route) {
    this.routeOverlay?.remove();
    this.routeOverlay = mountRouteDebug(this.rootElement.querySelector(".pit-wall-circuit"),
      route, driverInitials(this.driver), (index, point) => {
        state.selectedWaypoint = index;
        const selected = this.rootElement.querySelector("[data-route-selected]");
        if (selected) selected.textContent = `Waypoint ${index} · ${point[0]}, ${point[1]}`;
      }, state.weekend.name);
    this.routeOverlay.setEditing(state.editRoute);
  }

  isPractice() {
    const state = this.weekendState;
    return (state.weekend.sessions[state.sessionIndex] || "").startsWith("Practice ");
  }

  isSprintQualifying() {
    const state = this.weekendState;
    return state.weekend.sessions[state.sessionIndex] === "Sprint Qualifying";
  }

  isQualifying() {
    return this.isSprintQualifying() || this.weekendState.weekend.sessions[this.weekendState.sessionIndex] === "Qualifying";
  }

  isSprintRace() {
    const state = this.weekendState;
    return state.weekend.sessions[state.sessionIndex] === "Sprint Race";
  }

  isGrandPrix() {
    return this.weekendState.weekend.sessions[this.weekendState.sessionIndex] === "Grand Prix";
  }

  isRace() {
    return this.isSprintRace() || this.isGrandPrix();
  }

  raceLaps() {
    const weekend = this.weekendState.weekend;
    return this.isGrandPrix() ? weekend.laps || Math.ceil(305 / parseFloat(weekend.circuitLength))
      : Math.ceil(100 / parseFloat(weekend.circuitLength));
  }

  isTimedSession() {
    return this.isPractice() || this.isQualifying() || this.isRace();
  }

  renderSession() {
    const state = this.weekendState;
    const tracker = this.rootElement.querySelector(".pit-wall-session-tracker");
    const panel = this.rootElement.querySelector(".pit-wall-session-panel");
    const circuit = this.rootElement.querySelector(".pit-wall-circuit");
    const tools = this.rootElement.querySelector(".pit-wall-route-tools");
    tools.innerHTML = "";
    tools.hidden = true;
    panel.hidden = false;
    circuit.hidden = state.phase === "discovery" || state.phase === "review" || state.phase === "complete";
    if (!state.showRoute || !["ready", "running"].includes(state.phase)) {
      this.routeOverlay?.remove();
      this.routeOverlay = null;
    }
    panel.classList.toggle("is-discovery", state.phase === "discovery");
    panel.classList.toggle("is-review", state.phase === "review");
    panel.classList.toggle("is-complete", state.phase === "complete");
    this.rootElement.querySelector(".pit-wall-driver-details")?.classList.toggle("is-active", state.phase === "running");
    this.renderTiming();
    this.renderCommand();
    this.updateClassification();
    tracker.innerHTML = state.weekend.sessions.map((session, index) => {
      const completed = state.sessionResults[index] !== "pending";
      const current = index === state.sessionIndex && !completed && state.phase !== "complete";
      const label = completed ? "Completed" : current ? "Current" : "Pending";
      const icon = completed ? "&#10003;" : current ? "&#9679;" : "&#183;";
      return `<li class="pit-wall-session-step ${label.toLowerCase()}" aria-label="${session}: ${label}"${current ? ' aria-current="step" tabindex="-1"' : ""}>${icon} ${session}</li>`;
    }).join("");

    if (state.phase === "complete") {
      panel.innerHTML = `
        <div class="pit-wall-session-complete" tabindex="-1">
          <strong>Weekend Complete</strong>
          ${state.message ? `<span class="pit-wall-session-notice">${state.message}</span>` : ""}
          ${championshipTable(this.championship)}
        </div>
      `;
      return;
    }

    const session = state.weekend.sessions[state.sessionIndex];
    if (state.phase === "review") {
      if (this.isRace()) {
        panel.innerHTML = `
          <section class="pit-wall-session-review is-race-review" aria-labelledby="pit-wall-review-title">
            ${finalRaceTable(state.race)}
            ${championshipTable(this.championship)}
          </section>`;
        return;
      }
      if (this.isQualifying()) {
        const grid = this.isSprintQualifying() ? state.sprintGrid : state.grandPrixGrid;
        panel.innerHTML = `
          <section class="pit-wall-session-review" aria-labelledby="pit-wall-review-title">
            <h4 id="pit-wall-review-title" tabindex="-1">${this.isSprintQualifying() ? "Sprint Qualifying Complete" : "Qualifying Complete"}</h4>
            <div class="pit-wall-review-stats">
              <dl>
                <dt>Grid Position</dt><dd>${grid.position === null ? "No qualifying time" : `P${grid.position}`}</dd>
                <dt>Pole Position Time</dt><dd>${formatLapTime(grid.poleTime)}</dd>
                <dt>Player Best Time</dt><dd>${formatLapTime(grid.playerBest)}</dd>
              </dl>
            </div>
            <div class="pit-wall-review-feedback">
              <strong>Qualifying Classification</strong>
              <p>Final classification is shown in the Driver panel.</p>
            </div>
          </section>`;
        return;
      }
      const practice = state.practice;
      const laps = practice.lapTimes;
      const enoughData = laps.length >= MINIMUM_LAPS;
      const average = laps.length ? laps.reduce((sum, lap) => sum + lap, 0) / laps.length : null;
      const feedback = !laps.length ? "Not enough running to assess the car."
        : laps.length === 1 ? "The first timed lap gives us a baseline for the car."
        : laps[laps.length - 1] - Math.min(...laps) >= 1500
          ? "The last lap was less consistent; we can work on the balance."
          : "The car feels stable through medium-speed corners.";
      panel.innerHTML = `
        <section class="pit-wall-session-review" aria-labelledby="pit-wall-review-title">
          <h4 id="pit-wall-review-title" tabindex="-1">Practice Session Complete</h4>
          <div class="pit-wall-review-stats">
            <dl>
              <dt>Laps Completed</dt><dd>${laps.length}</dd>
              <dt>Best Lap</dt><dd class="pit-wall-best-lap">${formatLapTime(laps.length ? Math.min(...laps) : null)}</dd>
              <dt>Average Lap</dt><dd>${formatLapTime(average)}</dd>
              <dt>Session Duration</dt><dd>${formatSessionTime(Math.floor(practice.elapsed / 1000) * 1000)}</dd>
              <dt>Engineering Data Collected</dt><dd>${laps.length} timed ${laps.length === 1 ? "lap" : "laps"}</dd>
            </dl>
          </div>
          <div class="pit-wall-review-feedback">
            <strong>Driver Feedback</strong>
            <p>${feedback}</p>
          </div>
          <div class="pit-wall-review-eligibility">
            ${enoughData ? "Engineering Discovery available." : `Insufficient Data Collected<br>Minimum ${MINIMUM_LAPS} laps required for Engineering Discovery.`}
          </div>
        </section>`;
      return;
    }
    if (state.phase === "discovery") {
      panel.innerHTML = `
        <div class="pit-wall-discovery-heading" tabindex="-1">
          <strong>Session Complete</strong>
          <span>Engineering Discovery Available</span>
          ${state.message ? `<span role="status">${state.message}</span>` : ""}
          ${state.replacementMode ? '<span role="status">Choose a card to reroll.</span>' : ""}
        </div>
        <div class="pit-wall-discovery-cards">
          ${state.options.map((discovery, index) => `
            <button type="button" class="pit-wall-discovery-card ${discovery.rarity}" data-discovery-index="${index}">
              <span class="pit-wall-discovery-type">${discoveryType(discovery.rarity)}</span>
              <strong class="pit-wall-discovery-name">${discovery.name}</strong>
              <span class="pit-wall-discovery-description">${discovery.description}</span>
              <span class="pit-wall-discovery-effect">${this.effectiveDiscovery(discovery).effect}</span>
              <span class="pit-wall-discovery-rarity">${rarityLabel(discovery.rarity)}</span>
            </button>
          `).join("")}
        </div>
      `;
      panel.querySelectorAll("[data-discovery-index]").forEach((button, index) => {
        button.addEventListener("click", () => {
          if (state.replacementMode) this.replaceDiscovery(index);
          else this.chooseDiscovery(index);
        });
      });
      return;
    }

    tools.innerHTML = `
      ${state.phase === "running" && state.markerLoading ? `<p class="pit-wall-session-notice" role="status">Loading ${state.weekend.name} route...</p>` : ""}
      ${state.phase === "running" && state.markerError ? `
        <div class="pit-wall-route-error" role="alert">${state.markerError}
          <button type="button" class="pit-wall-discovery-action" data-action="retry-marker">Retry Route</button>
        </div>
      ` : ""}
      ${["ready", "running"].includes(state.phase) && this.routeDebugEnabled && state.weekend.image ? `
        <div class="pit-wall-route-controls">
          <span>Developer Route Debug</span>
          <button type="button" class="pit-wall-discovery-action" data-action="toggle-route" aria-pressed="${state.showRoute}"${state.routeLoading || state.markerLoading ? " disabled" : ""}>${state.routeLoading ? "Loading Route..." : state.showRoute ? "Hide Route" : "Show Route"}</button>
          ${state.showRoute ? `
            <button type="button" class="pit-wall-discovery-action" data-action="edit-route" aria-pressed="${state.editRoute}">Edit Route</button>
            <button type="button" class="pit-wall-discovery-action" data-action="export-route">Export JSON</button>
            <button type="button" class="pit-wall-discovery-action" data-action="import-route">Import JSON</button>
            <input type="file" accept=".json,application/json" data-route-file hidden>
            <span class="pit-wall-route-selection" data-route-selected>${state.selectedWaypoint !== null ? `Waypoint ${state.selectedWaypoint} · ${this.routes.get(state.weekend.id).points[state.selectedWaypoint].join(", ")}` : ""}</span>
          ` : ""}
          ${state.phase === "running" ? `<button type="button" class="pit-wall-discovery-action" data-action="pause-route-session"${state.routeLoading ? " disabled" : ""}>${state.debugPaused ? "Resume Session" : "Pause Session"}</button>` : ""}
          ${state.routeError ? '<span class="pit-wall-route-error" role="alert" data-route-error></span>' : ""}
        </div>
      ` : ""}
    `;
    tools.hidden = !tools.children.length;
    panel.innerHTML = state.message ? `<p class="pit-wall-session-notice" role="status">${state.message}</p>` : "";
    panel.hidden = !panel.children.length;
    const routeError = tools.querySelector("[data-route-error]");
    if (routeError) routeError.textContent = state.routeError;
    this.updateTiming();
    tools.querySelector('[data-action="retry-marker"]')?.addEventListener("click", () => this.startRouteMarker());
    tools.querySelector('[data-action="toggle-route"]')?.addEventListener("click", () => this.toggleRoute());
    tools.querySelector('[data-action="edit-route"]')?.addEventListener("click", () => {
      state.editRoute = !state.editRoute;
      this.routeOverlay.setEditing(state.editRoute);
      this.renderSession();
      tools.querySelector('[data-action="edit-route"]').focus();
    });
    tools.querySelector('[data-action="export-route"]')?.addEventListener("click", () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(this.routes.get(state.weekend.id), null, 2) + "\n"], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = this.routeFilename(state.weekend);
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    tools.querySelector('[data-action="import-route"]')?.addEventListener("click", () => {
      tools.querySelector("[data-route-file]").click();
    });
    tools.querySelector("[data-route-file]")?.addEventListener("change", async (event) => {
      const file = event.currentTarget.files[0];
      if (!file) return;
      const route = this.routes.get(state.weekend.id);
      const sessionIndex = state.sessionIndex;
      const request = {};
      state.routeImportRequest = request;
      try {
        const imported = validateRoute(JSON.parse(await file.text()), route.imageWidth, route.imageHeight);
        if (this.weekendState !== state || state.sessionIndex !== sessionIndex || !state.showRoute
          || state.routeImportRequest !== request) return;
        route.points = imported.points;
        state.selectedWaypoint = null;
        state.routeError = "";
        this.mountTrackRouteDebug(state, route);
      } catch (error) {
        if (this.weekendState !== state || state.sessionIndex !== sessionIndex || !state.showRoute
          || state.routeImportRequest !== request) return;
        console.error("Could not import route.", error);
        state.routeError = `Could not import route: ${error.message}`;
      }
      this.renderSession();
    });
    tools.querySelector('[data-action="pause-route-session"]')?.addEventListener("click", () => {
      if (state.debugPaused) {
        state.showRoute = false;
        state.editRoute = false;
        state.routeLoading = false;
        state.routeImportRequest = null;
        state.debugPaused = false;
        this.renderSession();
        if (this.hasSessionRoute()) {
          if (this.routeMarker) {
            this.resumeSessionTimer();
            this.routeMarkers.forEach((marker) => marker.resume());
          }
        } else this.resumeSessionTimer();
      } else {
        this.pauseSessionTimer();
        this.renderSession();
      }
    });
  }

  startSession() {
    const state = this.weekendState;
    if (state.phase !== "ready") return;
    state.phase = "running";
    state.driverDetailsExpanded = false;
    state.message = "";
    state.elapsed = 0;
    state.debugPaused = this.routeDebugEnabled && state.weekend.id === "bahrain" && !this.isTimedSession();
    state.showRoute = false;
    state.editRoute = false;
    state.routeLoading = false;
    state.routeError = "";
    state.routeImportRequest = null;
    state.selectedWaypoint = null;
    state.markerLoading = false;
    state.markerError = "";
    state.markerRequest = null;
    if (this.isRace()) {
      const length = parseFloat(state.weekend.circuitLength);
      if (!Number.isFinite(length) || length <= 0) throw new Error("Sprint circuit length is unavailable");
      const teamSlots = TEAMS.flatMap((team) => [team, team]);
      const playerTeam = teamSlots.findIndex((team) => team.name === this.team.name);
      if (playerTeam < 0) throw new Error(`Unknown sprint team: ${this.team.name}`);
      teamSlots.splice(playerTeam, 1);
      const fallbackGrid = DRIVERS.filter((driver) => driver.name !== this.driver.name)
        .map((driver, index) => ({ driver, team: teamSlots[index], player: false }));
      fallbackGrid.push({ driver: this.driver, team: this.team, player: true });
      const grid = this.isGrandPrix() ? state.grandPrixGrid : state.sprintGrid;
      state.race = createSprintRace(grid?.entries || fallbackGrid, length,
        state.weekend.weather, state.weekend.trackCondition, state.setup, this.activeDiscoveries(), this.balance,
        Math.random, { laps: this.raceLaps(), grandPrix: this.isGrandPrix() });
      state.race.started = false;
      state.race.startElapsed = 0;
      state.race.startDuration = 3000 + 1000 + Math.random() * 1000;
      state.practice = state.race.entries.find((entry) => entry.player).session;
      setDriverMode(state.practice, state.setup.mode || "Balanced");
      for (const entry of state.race.entries) {
        if (!this.championship.some((item) => item.driver.name === entry.driver.name)) {
          this.championship.push({ driver: entry.driver, team: entry.team, player: entry.player, points: 0, order: this.championship.length });
        }
      }
      this.renderProfile();
    } else if (this.isTimedSession()) {
      const length = parseFloat(state.weekend.circuitLength);
      if (!Number.isFinite(length) || length <= 0) throw new Error("Practice circuit length is unavailable");
      state.practice = createPracticeSession(this.driver, this.team, this.activeDiscoveries(), length, Math.random,
        state.setup, this.balance, 0, this.isQualifying());
      parkPracticeSession(state.practice);
      const teamSlots = TEAMS.flatMap((team) => [team, team]);
      const playerTeam = teamSlots.findIndex((team) => team.name === this.team.name);
      if (playerTeam < 0) throw new Error(`Unknown practice team: ${this.team.name}`);
      teamSlots.splice(playerTeam, 1);
      const opponents = DRIVERS.filter((driver) => driver.name !== this.driver.name)
        .map((driver, index) => ({ driver, team: teamSlots[index] }));
      state.classification = createPracticeClassification(this.driver, this.team, opponents, length,
        state.weekend.weather, state.weekend.trackCondition, this.balance, Math.random, this.isQualifying());
      this.renderProfile();
    } else state.practice = null;
    this.renderSession();
    if (this.hasSessionRoute()) this.startRouteMarker();
    else if (!state.debugPaused) this.resumeSessionTimer();
  }

  pauseSessionTimer() {
    const state = this.weekendState;
    if (state.debugPaused) return;
    if (this.isTimedSession()) {
      if (this.sessionTimer != null && this.syncPracticeClock()) {
        this.completeSession();
        return;
      }
      this.clearSessionTimer();
      this.routeMarkers?.forEach((marker) => marker.pause());
    } else {
      state.elapsed = Math.min(SESSION_DURATION, state.elapsed + performance.now() - state.timerStartedAt);
      this.clearSessionTimer();
    }
    state.debugPaused = true;
  }

  async startRouteMarker() {
    const state = this.weekendState;
    const request = {};
    state.markerRequest = request;
    state.markerLoading = true;
    state.markerError = "";
    this.renderSession();
    let route;
    try {
      route = this.hasMappedRoute() ? await this.readTrackRoute(state)
        : { imageWidth: 600, imageHeight: 300, points: [[300, 240], [150, 240], [60, 150], [150, 60], [450, 60], [540, 150], [450, 240]] };
      if (this.weekendState !== state || state.phase !== "running" || state.markerRequest !== request) return;
      if (this.hasMappedRoute()) this.routes.set(state.weekend.id, route);
      const circuit = this.rootElement.querySelector(".pit-wall-circuit");
      this.routeMarkers = [];
      if (this.isRace()) {
        if (!this.hasMappedRoute()) {
          circuit.classList.add("has-schematic");
          circuit.insertAdjacentHTML("beforeend", '<svg data-sprint-overlay class="pit-wall-route-overlay pit-wall-schematic" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet" aria-label="Schematic circuit, not the actual layout"><path d="M 300 240 L 150 240 Q 60 240 60 150 Q 60 60 150 60 L 450 60 Q 540 60 540 150 Q 540 240 450 240 Z"></path></svg><span data-sprint-overlay class="pit-wall-schematic-label">Schematic track</span>');
        }
        circuit.insertAdjacentHTML("beforeend", `<div data-sprint-overlay class="pit-wall-start-lights" role="status" aria-label="Start lights">
          ${[1, 2, 3, 4, 5].map((light) => `<span data-start-light="${light}"></span>`).join("")}</div>
          <div data-sprint-overlay class="pit-wall-start-grid" aria-label="${this.isGrandPrix() ? "Grand Prix" : "Sprint"} starting grid">${state.race.entries.map((entry) =>
    `<span class="${entry.player ? "is-player" : ""}" title="P${entry.gridPosition} ${entry.driver.name}" data-tyre="${entry.session.tyre}" style="background-color:${entry.team.colour}">${driverInitials(entry.driver)}</span>`).join("")}</div>`);
        this.routeMarker = mountRouteMarkers(circuit, route, state.race.entries.map((entry) => ({
          initials: driverInitials(entry.driver), teamColour: entry.team.colour, player: entry.player,
          getProgress: () => this.raceProgress(entry),
          getTyre: () => entry.session.tyre,
          isVisible: () => state.race.started && !entry.retired && entry.finishedAt === null
            && ["none", "called"].includes(entry.session.pitState),
        })));
      } else {
        const drivers = [{ initials: driverInitials(this.driver), teamColour: this.team.colour, player: true,
          getProgress: () => this.practiceProgress(), getTyre: () => state.practice.tyre,
          isVisible: () => ["none", "called"].includes(state.practice.pitState) }];
        for (const entry of state.classification.opponents) drivers.push({
          initials: driverInitials(entry.driver), teamColour: entry.team.colour,
          getProgress: () => entry.session ? this.practiceProgress(entry.session) : 0,
          getTyre: () => entry.session?.tyre || null, isVisible: () => Boolean(entry.session),
        });
        this.routeMarker = mountRouteMarkers(circuit, route, drivers);
      }
      this.routeMarkers.push(this.routeMarker);
      if (!state.debugPaused) {
        this.resumeSessionTimer();
        this.routeMarkers.forEach((marker) => marker.resume());
      }
      else if (state.showRoute) this.routeMarkers.forEach((marker) => marker.pause(true));
    } catch (error) {
      console.error("Could not display session driver markers.", error);
      if (this.weekendState !== state || state.phase !== "running" || state.markerRequest !== request) return;
      this.clearSessionTimer();
      this.clearRouteMarker();
      state.markerError = this.hasMappedRoute()
        ? `Could not load the ${state.weekend.name} route. Check the browser console.`
        : "Could not load the session route. Check the browser console.";
    }
    state.markerLoading = false;
    this.renderSession();
  }

  async toggleRoute() {
    const state = this.weekendState;
    const sessionIndex = state.sessionIndex;
    const phase = state.phase;
    if (state.showRoute) {
      state.showRoute = false;
      state.editRoute = false;
      state.routeImportRequest = null;
      this.renderSession();
      return;
    }
    if (phase === "running") this.pauseSessionTimer();
    if (state.phase !== phase || !["ready", "running"].includes(phase)) return;
    state.routeError = "";
    state.routeLoading = true;
    this.renderSession();
    let route;
    try {
      route = await this.readTrackRoute(state);
    } catch (error) {
      console.error(`Could not load ${state.weekend.name} route.`, error);
      if (this.weekendState === state && state.phase === phase && state.sessionIndex === sessionIndex) {
        state.routeLoading = false;
        state.routeError = `Could not load ${state.weekend.name} route. Check the browser console.`;
        this.renderSession();
      }
      return;
    }
    if (this.weekendState !== state || state.phase !== phase || state.sessionIndex !== sessionIndex
      || (phase === "running" && !state.debugPaused)) return;
    this.routes.set(state.weekend.id, route);
    state.routeLoading = false;
    state.showRoute = true;
    this.routeMarkers?.forEach((marker) => marker.pause(true));
    this.mountTrackRouteDebug(state, route);
    this.renderSession();
    this.rootElement.querySelector('[data-action="toggle-route"]').focus();
  }

  resumeSessionTimer() {
    const state = this.weekendState;
    this.clearSessionTimer();
    if (this.isTimedSession()) {
      state.timerStartedAt = performance.now();
      this.sessionTimer = setInterval(() => {
        if (this.syncPracticeClock()) this.completeSession();
      }, 100);
      return;
    }
    const progress = this.rootElement.querySelector(".pit-wall-session-panel progress");
    state.timerStartedAt = performance.now();
    this.sessionTimer = setInterval(() => {
      const elapsed = Math.min(SESSION_DURATION, Math.max(0, state.elapsed + performance.now() - state.timerStartedAt));
      progress.value = elapsed;
      if (elapsed >= SESSION_DURATION) {
        this.completeSession();
      }
    }, 100);
  }

  syncPracticeClock() {
    const state = this.weekendState;
    const now = performance.now();
    const delta = Math.max(0, now - state.timerStartedAt);
    state.timerStartedAt = now;
    if (this.isRace()) {
      const race = state.race;
      let raceDelta = delta;
      if (!race.started) {
        const countdown = state.practice.speed === 0 ? 0 : Math.min(raceDelta, race.startDuration - race.startElapsed);
        race.startElapsed += countdown;
        raceDelta = state.practice.speed === 0 ? 0 : raceDelta - countdown;
        this.rootElement.querySelectorAll("[data-start-light]").forEach((light) => {
          light.classList.toggle("is-lit", race.startElapsed >= Number(light.dataset.startLight) * 600);
        });
        if (race.startElapsed >= race.startDuration) {
          race.started = true;
          this.rootElement.querySelector(".pit-wall-start-lights")?.remove();
          this.rootElement.querySelector(".pit-wall-start-grid")?.remove();
        }
      }
      if (race.started && raceDelta > 0) {
        race.finished = advanceSprintRace(race, raceDelta * state.practice.speed, state.setup.tyre);
      }
      this.routeMarkers?.forEach((marker) => marker.update());
      this.updateTiming();
      return Boolean(race.finished);
    }
    const before = state.practice.elapsed;
    advancePracticeSession(state.practice, delta * state.practice.speed);
    advancePracticeClassification(state.classification, state.practice.elapsed - before);
    this.routeMarkers?.forEach((marker) => marker.update());
    this.updateTiming();
    return state.practice.elapsed >= state.practice.duration;
  }

  practiceProgress(practice = this.weekendState.practice) {
    const state = this.weekendState;
    const pending = this.sessionTimer != null
      ? Math.max(0, performance.now() - state.timerStartedAt) * state.practice.speed : 0;
    return ["stopped", "entering"].includes(practice.pitState) ? 0
      : Math.min(1, practice.lapProgress + pending / practice.lapTarget);
  }

  raceProgress(entry) {
    const state = this.weekendState;
    const session = entry.session;
    const pending = state.race.started && this.sessionTimer != null && !state.debugPaused
      ? Math.max(0, performance.now() - state.timerStartedAt) * state.practice.speed : 0;
    const rate = fuelPerLap(this.balance, session.mode, session.upgrades, session.circuitLength);
    const distance = Math.min(1 - session.lapProgress, pending / session.lapTarget,
      rate > 0 ? session.fuel / rate : Infinity);
    return ((session.lapProgress + distance) % 1 + 1) % 1;
  }

  setPracticeSpeed(speed) {
    const state = this.weekendState;
    if (state.phase !== "running" || !this.isTimedSession() || ![0, 1, 10, 50].includes(speed)) return;
    if (this.sessionTimer != null && this.syncPracticeClock()) {
      this.completeSession();
      return;
    }
    state.practice.speed = speed;
    this.rootElement.querySelectorAll("[data-speed]").forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.speed) === speed));
    });
    const status = this.rootElement.querySelector(".pit-wall-session-running");
    status.textContent = state.debugPaused ? "Paused (Route Debug)" : speed === 0 ? "Paused" : "Running...";
    this.updateTiming();
  }

  completeSession() {
    const state = this.weekendState;
    if (state.phase !== "running" || (this.hasSessionRoute() && !this.routeMarker)) return;
    if (this.isTimedSession() && this.sessionTimer != null) this.syncPracticeClock();
    if (this.isRace() && !state.race.finished) return;
    this.clearSessionTimer();
    this.clearRouteMarker();
    state.sessionResults[state.sessionIndex] = "completed";
    if (this.isTimedSession()) {
      if (this.isRace()) {
        const results = sprintClassification(state.race);
        const points = this.isGrandPrix() ? GRAND_PRIX_POINTS : SPRINT_POINTS;
        results.forEach((entry, index) => {
          entry.points = entry.retired ? 0 : (points[index] || 0);
          const standing = this.championship.find((item) => item.driver.name === entry.driver.name);
          standing.points += entry.points;
        });
        const player = results.find((entry) => entry.player);
        const laps = player.session.lapTimes;
        state.raceResult = {
          position: results.indexOf(player) + 1, retired: player.retired,
          bestLap: laps.length ? Math.min(...laps) : null,
          averageLap: laps.length ? laps.reduce((sum, lap) => sum + lap, 0) / laps.length : null,
          laps: player.session.completedLaps, points: player.points,
          pitStops: player.pitStops, tyres: [...player.tyreHistory],
        };
      }
      if (this.isQualifying()) {
        const entries = practiceClassification(state.classification, state.practice);
        const playerIndex = entries.findIndex((entry) => entry.player);
        const player = entries[playerIndex];
        const grid = {
          entries: entries.map((entry) => ({ ...entry })),
          position: player.bestLap === null ? null : playerIndex + 1,
          poleTime: entries[0].bestLap,
          playerBest: player.bestLap,
        };
        if (this.isSprintQualifying()) state.sprintGrid = grid;
        else state.grandPrixGrid = grid;
      }
      state.phase = "review";
      if (this.isRace() || this.isQualifying() || state.practice.lapTimes.length >= MINIMUM_LAPS) {
        this.prepareDiscoveries();
      }
      this.renderSession();
      this.saveCareer();
      this.rootElement.querySelector("#pit-wall-review-title").focus();
      return;
    }
    this.offerDiscoveries();
  }

  prepareDiscoveries() {
    const state = this.weekendState;
    state.rerollsRemaining = this.permanentUpgrades.filter((item) => item.id === "research-charter").length * this.balance.discoveries.fullRerolls;
    state.replacementsRemaining = this.permanentUpgrades.filter((item) => item.id === "design-review").length * this.balance.discoveries.singleRerolls;
    state.replacementMode = false;
    state.options = discoveryOffer(this.isPostGrandPrix(), this.activeDiscoveries(), this.uniqueRewards, this.balance);
    state.discoveryPrepared = true;
  }

  offerDiscoveries() {
    const state = this.weekendState;
    state.phase = "discovery";
    if (!state.discoveryPrepared) this.prepareDiscoveries();
    if (!state.options.length) {
      this.advanceSession("No discoveries available.");
      return;
    }
    this.renderSession();
    this.saveCareer();
    this.rootElement.querySelector(".pit-wall-discovery-heading").focus();
  }

  skipSession() {
    const state = this.weekendState;
    if (state.phase !== "ready") return;
    this.clearSessionTimer();
    this.clearRouteMarker();
    const session = state.weekend.sessions[state.sessionIndex];
    state.sessionResults[state.sessionIndex] = "skipped";
    this.advanceSession(`${session} skipped. No discovery awarded.`);
  }

  isPostGrandPrix() {
    const state = this.weekendState;
    const index = state.weekend.sessions.indexOf("Grand Prix");
    return index !== -1 && state.sessionResults[index] !== "pending";
  }

  activeDiscoveries() {
    return [...this.permanentUpgrades, ...this.weekendDiscoveries];
  }

  balanceContext() {
    const active = this.permanentUpgrades ? this.activeDiscoveries() : [];
    const stats = Object.entries(this.balance.vehicleStats).map(([name, stat]) => {
      const points = active.filter((upgrade) => upgrade.stat === name)
        .reduce((total, upgrade) => total + upgrade.amount, stat.base);
      return `${name} ${points}`;
    }).join(", ");
    const driver = this.driver
      ? `${this.driver.name}: ${this.driver.strengths.map((trait) => `${trait} -${this.balance.driverTraits[trait]} ms`).join(", ")}, ${this.driver.weakness} +${this.balance.driverTraits[this.driver.weakness]} ms`
      : "not selected";
    const team = this.team
      ? `${this.team.name}: ${this.team.bonus} -${this.balance.teamTraits[this.team.bonus]} ms, ${this.team.weakness} +${this.balance.teamTraits[this.team.weakness]} ms`
      : "not selected";
    const upgrades = active.map((upgrade) => {
      const effect = upgrade.stat ? `${upgrade.amount} ${upgrade.stat}` : this.effectiveDiscovery(upgrade).effect;
      return `${upgrade.name} (${effect}${upgrade.stackable ? `, level ${upgrade.level}` : ""})`;
    }).join("; ") || "none";
    const practice = this.weekendState?.practice;
    return `Current vehicle points: ${stats}. Driver: ${driver}. Team: ${team}. Active upgrades: ${upgrades}.`
      + (practice ? ` Current tyre: ${practice.tyre}. Driver mode: ${practice.mode}.` : "");
  }

  rerollDiscoveries() {
    const state = this.weekendState;
    if (state.phase !== "discovery" || !state.rerollsRemaining) return;
    const options = discoveryOffer(this.isPostGrandPrix(), this.activeDiscoveries(), this.uniqueRewards, this.balance);
    if (!options.length) {
      state.message = "No eligible discoveries available to reroll.";
      this.renderSession();
      return;
    }
    state.rerollsRemaining -= 1;
    state.replacementMode = false;
    state.message = "";
    state.options = options;
    this.renderSession();
    this.saveCareer();
    this.rootElement.querySelector(".pit-wall-discovery-heading").focus();
  }

  replaceDiscovery(index) {
    const state = this.weekendState;
    if (state.phase !== "discovery" || !state.replacementMode || !state.replacementsRemaining || !state.options[index]) return;
    const excluded = state.options.filter((_, optionIndex) => optionIndex !== index);
    const weights = this.isPostGrandPrix() ? this.balance.rewardWeights.afterGrandPrix : this.balance.rewardWeights.beforeGrandPrix;
    if (!eligibleDiscoveries(this.isPostGrandPrix(), excluded, this.activeDiscoveries(), this.uniqueRewards)
      .some((item) => weights[item.rarity] > 0)) {
      state.replacementMode = false;
      state.message = "No eligible discoveries available to reroll.";
      this.renderSession();
      return;
    }
    state.options[index] = drawDiscovery(this.isPostGrandPrix(),
      excluded, this.activeDiscoveries(), this.uniqueRewards, this.balance);
    state.replacementsRemaining -= 1;
    state.replacementMode = false;
    state.message = "";
    this.renderSession();
    this.saveCareer();
    this.rootElement.querySelector(`[data-discovery-index="${index}"]`).focus();
  }

  effectiveDiscovery(discovery) {
    const values = this.balance.discoveries;
    if (discovery.stat && !Object.hasOwn(values.statPoints, discovery.id)) {
      throw new Error(`Unregistered balance upgrade: ${discovery.id}`);
    }
    if (Object.hasOwn(values.statPoints, discovery.id)) {
      const multiplier = discovery.rarity === "blue"
        ? 1 + this.permanentUpgrades.filter((item) => item.id === "legacy-lab").length * values.blueBonusMultiplier : 1;
      const amount = values.statPoints[discovery.id] * multiplier;
      return { ...discovery, amount, effect: `+${amount} ${discovery.stat}` };
    }
    if (Object.hasOwn(DISCOVERY_PACE_FIELDS, discovery.id)) {
      return { ...discovery, effect: `-${values[DISCOVERY_PACE_FIELDS[discovery.id]]} ms / lap` };
    }
    const effect = {
      "tyre-insight": `+${values.tyreLifePerLevel * 100}% Tyre Life`,
      "fuel-mapping": `+${values.fuelEfficiencyPerLevel * 100}% Fuel Efficiency`,
      "research-charter": `+${values.fullRerolls} full reroll${values.fullRerolls === 1 ? "" : "s"} per future session`,
      "design-review": `+${values.singleRerolls} single-card reroll${values.singleRerolls === 1 ? "" : "s"} per future session`,
      "legacy-lab": `Blue upgrades gain +${values.blueBonusMultiplier}x effect`,
    }[discovery.id];
    return effect ? { ...discovery, effect } : discovery;
  }

  refreshBalanceUpgrades() {
    for (const upgrade of this.permanentUpgrades || []) {
      const base = DISCOVERIES.find((item) => item.id === upgrade.id);
      if (!base || !Object.hasOwn(this.balance.discoveries.statPoints, upgrade.id)) continue;
      const effective = this.effectiveDiscovery(base);
      upgrade.amount = effective.amount * (upgrade.level || 1);
      upgrade.effect = `+${upgrade.amount} ${upgrade.stat}`;
    }
  }

  chooseDiscovery(index) {
    const state = this.weekendState;
    if (state.phase !== "discovery" || !state.options[index]) return;
    const discovery = this.effectiveDiscovery(state.options[index]);
    const upgrades = discovery.category === "permanent" ? this.permanentUpgrades : this.weekendDiscoveries;
    const existing = upgrades.find((upgrade) => upgrade.id === discovery.id);
    if ((!discovery.stackable && (existing || this.uniqueRewards.has(discovery.id)))
      || (existing && discovery.maxLevel != null && existing.level >= discovery.maxLevel)) {
      throw new Error(`Discovery is no longer available: ${discovery.name}`);
    }
    if (existing) {
      existing.level += 1;
      if (discovery.stat) {
        existing.amount += discovery.amount;
        existing.effect = `+${existing.amount} ${existing.stat}`;
      }
    } else {
      upgrades.push(discovery.stackable ? { ...discovery, level: 1 } : discovery);
      if (!discovery.stackable) this.uniqueRewards.add(discovery.id);
      if (discovery.id === "legacy-lab") {
        this.refreshBalanceUpgrades();
      }
    }
    this.renderProfile("Race Weekend Ready");
    this.advanceSession(existing
      ? `${discovery.name} upgraded. Level ${existing.level}.`
      : `${discovery.name} acquired: ${discovery.effect}.`);
  }

  advanceSession(message) {
    const state = this.weekendState;
    state.message = message;
    state.options = [];
    state.discoveryPrepared = false;
    state.practice = null;
    state.classification = null;
    state.race = null;
    state.setup = { tyre: "Medium", fuel: 100 };
    state.sessionIndex += 1;
    state.phase = state.sessionIndex === state.weekend.sessions.length ? "complete" : "ready";
    this.renderProfile("Race Weekend Ready");
    if (state.phase === "complete") {
      this.roundsCompleted += 1;
      this.rootElement.querySelector(".pit-wall-championship progress").value = this.roundsCompleted;
      this.weekendDiscoveries = [];
      if (this.currentRoundIndex === this.seasonWeekends.length - 1) {
        this.renderSeasonComplete(message);
        this.saveCareer();
        return;
      }
      this.renderProfile("Round Complete");
    }
    this.renderSession();
    this.saveCareer();
    const heading = this.rootElement.querySelector(".pit-wall-session-name, .pit-wall-session-complete, .pit-wall-session-step.current");
    heading?.focus();
  }

  renderSeasonComplete(message) {
    this.renderCommand();
    this.renderProfile("Season Complete");
    const mainPanel = this.rootElement.querySelector(".pit-wall-track-display");
    const rareCount = this.permanentUpgrades.filter((upgrade) => upgrade.rarity === "purple").length;
    const legendaryCount = this.permanentUpgrades.filter((upgrade) => upgrade.rarity === "gold").length;
    const standings = [...this.championship].sort((a, b) => b.points - a.points || a.order - b.order);
    const position = standings.findIndex((entry) => entry.player);
    mainPanel.innerHTML = `
      <section class="pit-wall-season-finish" aria-labelledby="pit-wall-season-finish-title">
        <h4 id="pit-wall-season-finish-title" tabindex="-1">Season Complete</h4>
        ${message ? `<p class="pit-wall-session-notice" role="status">${message}</p>` : ""}
        <p>Rounds Completed: ${this.roundsCompleted} / ${this.seasonWeekends.length}</p>
        <dl>
          <dt>Total Permanent Upgrades</dt><dd>${this.permanentUpgrades.reduce((total, upgrade) => total + (upgrade.stackable ? upgrade.level : 1), 0)}</dd>
          <dt>Total Rare Breakthroughs</dt><dd>${rareCount}</dd>
          <dt>Total Legendary Discoveries</dt><dd>${legendaryCount}</dd>
          <dt>Weekend Wins</dt><dd>Not available yet</dd>
          <dt>Championship Position</dt><dd>${position < 0 ? "Not available yet" : `P${position + 1}`}</dd>
        </dl>
        ${championshipTable(this.championship)}
      </section>
    `;
    mainPanel.querySelector("#pit-wall-season-finish-title").focus();
  }
}

export { PitWallConsole, drawDiscovery };
