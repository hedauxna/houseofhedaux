import { loadBahrainRoute, mountRouteDebug } from "./route-debug.js";
import { mountRouteMarker } from "./route-marker.js";
import { DEFAULT_BALANCE, DISCOVERY_PACE_FIELDS, createBalance } from "./pit-wall-balance.js";
import { mountBalancePanel } from "./pit-wall-balance-panel.js";
import {
  PRACTICE_DURATION, MINIMUM_LAPS, createPracticeSession, advancePracticeSession,
  formatSessionTime, formatLapTime, setDriverMode, callToPit, selectPitTyre,
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
    circuitLength: "5.412 km", laps: 57, image: new URL("../assets/Bahrain_Circuit_Trimmed.png", import.meta.url).href,
  },
  {
    id: "saudi-arabia", name: "Saudi Arabia", title: "Saudi Arabian Grand Prix", country: "Saudi Arabia",
    track: "Jeddah Corniche Circuit", dates: "19-21 March 2027",
    weather: "Hot Conditions", weatherIcon: "&#9728;", forecast: "Stable",
    circuitLength: "6.174 km", laps: 50, image: new URL("../assets/Saudi_Arabia_Circuit_Trimmed.png", import.meta.url).href,
  },
  { id: "australia", name: "Australia", title: "Australian Grand Prix", country: "Australia", track: "Albert Park Grand Prix Circuit", dates: "2-4 April 2027", circuitLength: "5.278 km", sprint: true },
  { id: "japan", name: "Japan", title: "Japanese Grand Prix", country: "Japan", track: "Suzuka Circuit", dates: "9-11 April 2027", circuitLength: "5.807 km", sprint: true },
  { id: "china", name: "China", title: "Chinese Grand Prix", country: "China", track: "Shanghai International Circuit", dates: "16-18 April 2027", circuitLength: "5.451 km" },
  { id: "miami", name: "Miami", country: "United States", track: "Miami International Autodrome", dates: "30 April-2 May 2027", circuitLength: "5.412 km" },
  { id: "canada", name: "Canada", title: "Canadian Grand Prix", country: "Canada", track: "Circuit Gilles Villeneuve", dates: "21-23 May 2027", circuitLength: "4.361 km", sprint: true },
  { id: "monaco", name: "Monaco", country: "Monaco", track: "Circuit de Monaco", dates: "4-6 June 2027", circuitLength: "3.337 km", sprint: true },
  { id: "portugal", name: "Portugal", title: "Portuguese Grand Prix", country: "Portugal", track: "Algarve International Circuit", dates: "18-20 June 2027", circuitLength: "4.653 km" },
  { id: "great-britain", name: "Great Britain", title: "British Grand Prix", country: "United Kingdom", track: "Silverstone Circuit", dates: "2-4 July 2027", circuitLength: "5.891 km", sprint: true },
  { id: "austria", name: "Austria", title: "Austrian Grand Prix", country: "Austria", track: "Red Bull Ring", dates: "9-11 July 2027", circuitLength: "4.326 km" },
  { id: "belgium", name: "Belgium", title: "Belgian Grand Prix", country: "Belgium", track: "Circuit de Spa-Francorchamps", dates: "23-25 July 2027", circuitLength: "7.004 km" },
  { id: "hungary", name: "Hungary", title: "Hungarian Grand Prix", country: "Hungary", track: "Hungaroring", dates: "30 July-1 August 2027", circuitLength: "4.381 km" },
  { id: "italy", name: "Italy", title: "Italian Grand Prix", country: "Italy", track: "Monza Circuit", dates: "3-5 September 2027", circuitLength: "5.793 km", sprint: true },
  { id: "spain", name: "Spain", title: "Spanish Grand Prix", country: "Spain", track: "Madring", dates: "10-12 September 2027", circuitLength: "5.414 km" },
  { id: "azerbaijan", name: "Azerbaijan", country: "Azerbaijan", track: "Baku City Circuit", dates: "24-26 September 2027", circuitLength: "6.003 km" },
  { id: "turkiye", name: "Türkiye", title: "Turkish Grand Prix", country: "Türkiye", track: "Istanbul Park", dates: "1-3 October 2027", circuitLength: "5.338 km" },
  { id: "singapore", name: "Singapore", country: "Singapore", track: "Marina Bay Street Circuit", dates: "8-10 October 2027", circuitLength: "4.927 km" },
  { id: "united-states", name: "United States", country: "United States", track: "Circuit of the Americas", dates: "22-24 October 2027", circuitLength: "5.513 km" },
  { id: "mexico", name: "Mexico", title: "Mexico City Grand Prix", country: "Mexico", track: "Autódromo Hermanos Rodríguez", dates: "29-31 October 2027", circuitLength: "4.304 km" },
  { id: "brazil", name: "Brazil", title: "São Paulo Grand Prix", country: "Brazil", track: "Interlagos", dates: "5-7 November 2027", circuitLength: "4.309 km", sprint: true },
  { id: "las-vegas", name: "Las Vegas", country: "United States", track: "Las Vegas Strip Circuit", dates: "18-20 November 2027", circuitLength: "6.201 km" },
  { id: "qatar", name: "Qatar", country: "Qatar", track: "Lusail International Circuit", dates: "3-5 December 2027", circuitLength: "5.419 km", sprint: true },
  { id: "abu-dhabi", name: "Abu Dhabi", country: "United Arab Emirates", track: "Yas Marina Circuit", dates: "10-12 December 2027", circuitLength: "5.281 km", sprint: true },
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

class PitWallConsole {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.routeDebugEnabled = new URLSearchParams(rootElement.ownerDocument.defaultView.location.search).get("pitWallDebug") === "1";
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
            <div class="pit-wall-header-info">
              <span class="pit-wall-info-label">Session Status</span>
              <span class="pit-wall-info-value">Ready</span>
            </div>
            ${this.routeDebugEnabled ? '<button type="button" class="pit-wall-discovery-action" data-action="balance-toggle" aria-expanded="false" aria-controls="pit-wall-balance-panel">Balance</button>' : ""}
            <a class="pit-wall-exit" href="#games-room-start">Games Room</a>
          </div>
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
                <div class="pit-wall-menu-buttons">
                  <button class="pit-wall-menu-button" data-action="continue-game">Continue</button>
                  <button class="pit-wall-menu-button" data-action="new-game">New Game</button>
                </div>
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
            <span class="pit-wall-command-mode" data-command-mode></span>
            <button type="button" class="pit-wall-command-toggle" aria-label="Expand Command Centre" aria-expanded="false" aria-controls="pit-wall-command-content" data-action="toggle-command">
              <svg class="pit-wall-command-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m6 15 6-6 6 6"/>
              </svg>
            </button>
          </div>
          <div class="pit-wall-command-body" id="pit-wall-command-content" inert>
            <div class="pit-wall-panel-content">
              <div class="pit-wall-placeholder-block">
                <p class="pit-wall-placeholder-label">Radio & Strategy Controls</p>
                <p class="pit-wall-placeholder-info">Strategic commands and radio instructions will appear here</p>
              </div>
            </div>
          </div>
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
    this.rootElement.querySelector('[data-action="new-game"]').addEventListener("click", () => {
      this.startDraft();
    });

    const toggle = this.rootElement.querySelector('[data-action="toggle-command"]');
    const commandBody = this.rootElement.querySelector(".pit-wall-command-body");
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("aria-label", `${expanded ? "Collapse" : "Expand"} Command Centre`);
      commandBody.inert = !expanded;
    });
  }

  startDraft() {
    this.clearSessionTimer();
    this.clearRouteMarker();
    this.routeOverlay?.remove();
    this.routeOverlay = null;
    this.bahrainRoute = null;
    this.driver = null;
    this.team = null;
    this.permanentUpgrades = [];
    this.weekendDiscoveries = [];
    this.uniqueRewards = new Set();
    this.weekendState = null;
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
    const active = [...this.weekendDiscoveries, ...this.permanentUpgrades];
    const rarityOrder = { green: 0, blue: 1, purple: 2, gold: 3 };
    const unique = active.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    const labels = { green: "Weekend discovery", blue: "Permanent upgrade", purple: "Rare breakthrough", gold: "Legendary discovery" };
    driverPanel.innerHTML = `
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
    if (status) this.rootElement.querySelector(".pit-wall-info-value").textContent = status;
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
            <div class="pit-wall-driver-card" data-${kind}-index="${index}">
              <button type="button" class="pit-wall-card-choice" aria-pressed="false">
                ${isDriver ? portrait(candidate) : ""}
                <span class="pit-wall-driver-name">${candidate.name}</span>
                ${isDriver ? driverDetails(candidate) : teamDetails(candidate, true)}
              </button>
              <div class="pit-wall-card-footer">
                <span class="pit-wall-driver-select">Select ${kind}</span>
                <button type="button" class="pit-wall-confirm-button" aria-label="Confirm ${candidate.name}" hidden>Confirm</button>
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    `;

    const cards = mainPanel.querySelectorAll(`[data-${kind}-index]`);
    cards.forEach((card, index) => {
      const confirm = card.querySelector(".pit-wall-confirm-button");
      card.addEventListener("click", (event) => {
        if (event.target.closest(".pit-wall-confirm-button")) return;
        cards.forEach((other) => {
          const selected = other === card;
          other.classList.toggle("is-selected", selected);
          other.querySelector(".pit-wall-card-choice").setAttribute("aria-pressed", String(selected));
          other.querySelector(".pit-wall-driver-select").textContent = selected ? "Selected" : `Select ${kind}`;
          other.querySelector(".pit-wall-confirm-button").hidden = !selected;
        });
        if (isDriver) {
          this.driver = candidates[index];
          this.renderProfile();
        }
      });
      confirm.addEventListener("click", () => {
        if (isDriver) {
          this.driver = candidates[index];
          this.renderProfile("Driver Confirmed");
          this.renderDraft("team");
        } else {
          this.team = candidates[index];
          this.renderProfile("Ready For Season");
          this.renderSeasonSetup();
        }
        mainPanel.querySelector("#pit-wall-draft-title").focus();
      });
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
          <button type="button" class="pit-wall-menu-button pit-wall-season-confirm" data-action="confirm-season">Confirm Season</button>
        </div>
      </section>
    `;

    const confirm = mainPanel.querySelector('[data-action="confirm-season"]');
    const renderCalendar = () => {
      const racesElement = mainPanel.querySelector(".pit-wall-season-races");
      racesElement.innerHTML = WEEKENDS.map((weekend) => `
        <button type="button" class="pit-wall-season-race" data-weekend="${weekend.id}"
          aria-pressed="${this.selectedWeekends.has(weekend.id)}"
          aria-label="Round ${weekend.round}, ${weekend.name}, ${weekend.dates}${weekend.sprint ? ", Sprint weekend" : ""}">
          <span class="pit-wall-season-round">R${weekend.round}</span>
          <span class="pit-wall-season-name">${weekend.name}</span>
          ${weekend.sprint ? '<span class="pit-wall-season-sprint">Sprint</span>' : ""}
          <span class="pit-wall-season-date">${weekend.dates.replace(/ \d{4}$/, "").replace(/\b[A-Za-z]{4,}\b/g, (month) => month.slice(0, 3))}</span>
        </button>
      `).join("");
      racesElement.querySelectorAll("[data-weekend]").forEach((button) => {
        button.addEventListener("click", () => {
          const id = button.dataset.weekend;
          if (this.selectedWeekends.has(id)) this.selectedWeekends.delete(id);
          else this.selectedWeekends.add(id);
          button.setAttribute("aria-pressed", String(this.selectedWeekends.has(id)));
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
      setup: { tyre: "Medium", fuel: 100 },
    };
    const mainPanel = this.rootElement.querySelector(".pit-wall-track-display");
    this.renderProfile("Race Weekend Ready");
    mainPanel.classList.add("pit-wall-weekend-display");
    mainPanel.innerHTML = `
      <section class="pit-wall-weekend" aria-labelledby="pit-wall-weekend-title">
        <header class="pit-wall-weekend-banner">
          <div class="pit-wall-championship">
            <strong>2027 Championship</strong>
            <span>Current Round: Round ${weekend.round} / ${WEEKENDS.length}</span>
            ${this.seasonWeekends.length !== WEEKENDS.length ? `<span>Selected: ${this.currentRoundIndex + 1} / ${this.seasonWeekends.length}</span>` : ""}
            <progress aria-label="Season progress" max="${this.seasonWeekends.length}" value="${this.roundsCompleted}"></progress>
          </div>
          <div class="pit-wall-weekend-heading">
            <h4 id="pit-wall-weekend-title" tabindex="-1">${weekend.title}</h4>
            <span>${weekend.dates}</span>
          </div>
          <div class="pit-wall-weekend-facts">
            <span>${weekend.weatherIcon ? `<span aria-hidden="true">${weekend.weatherIcon}</span> ` : ""}${weekend.weather || "Weather: Not available"}</span>
            <span>Forecast: ${weekend.forecast || "Not available"}</span>
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
    if (this.isPractice()) {
      timingPanel.innerHTML = `
        <div class="pit-wall-timing-live">
          <section class="pit-wall-telemetry" aria-label="Telemetry Summary">
            <p class="pit-wall-placeholder-label">Telemetry Summary</p>
            <dl>
              <div><dt>Current Tyre</dt><dd data-timing="tyre" class="pit-wall-tyre-label"></dd></div>
              <div class="pit-wall-gauge-row"><dt>Tyre Condition</dt>
                <dd class="pit-wall-gauge" role="meter" aria-label="Tyre condition" aria-valuemin="0" aria-valuemax="100"><span></span></dd></div>
              <div class="pit-wall-gauge-row"><dt>Fuel Load</dt>
                <dd class="pit-wall-gauge" role="meter" aria-label="Fuel load" aria-valuemin="0" aria-valuemax="100"><span></span></dd></div>
              <div><dt>Last Lap</dt><dd data-timing="last-lap"></dd></div>
              <div><dt>Best Lap</dt><dd class="pit-wall-best-lap" data-timing="best-lap"></dd></div>
              <div><dt>Session Time Remaining</dt><dd data-timing="remaining"></dd></div>
              <div><dt>Session Speed</dt><dd data-timing="speed"></dd></div>
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
    const laps = practice ? practice.lapTimes : [];
    const values = {
      tyre: practice ? practice.tyre : this.weekendState.setup.tyre,
      "last-lap": formatLapTime(laps.length ? laps[laps.length - 1] : null),
      "best-lap": formatLapTime(laps.length ? Math.min(...laps) : null),
      remaining: formatSessionTime(PRACTICE_DURATION - (practice ? practice.elapsed : 0)),
      speed: practice && practice.speed === 0 ? "Paused" : `${practice ? practice.speed : 1}x`,
    };
    Object.entries(values).forEach(([key, value]) => {
      const field = timing.querySelector(`[data-timing="${key}"]`);
      if (field.textContent !== String(value)) field.textContent = value;
    });
    timing.querySelector('[data-timing="tyre"]').dataset.tyre = values.tyre;
    for (const [label, value] of [
      ["Tyre condition", practice ? 100 - practice.tyreWear : 100],
      ["Fuel load", practice ? practice.fuel : this.weekendState.setup.fuel],
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
    const running = this.weekendState.phase === "running";
    const version = `${laps.length}:${running}`;
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
          <span>Lap ${laps.length + 1}</span> <span>In Progress</span>
        </li>`);
      if (!rows.length) rows.push('<li class="pit-wall-lap-empty">No laps yet</li>');
      list.innerHTML = rows.join("");
      list.dataset.version = version;
    }
    const goal = this.rootElement.querySelector("[data-practice-goal]");
    const goalText = laps.length >= MINIMUM_LAPS
      ? "Discovery goal achieved" : `Discovery data: ${laps.length} / ${MINIMUM_LAPS} laps`;
    if (goal && goal.textContent !== goalText) goal.textContent = goalText;
    this.updateCommand();
  }

  renderCommand() {
    const state = this.weekendState;
    const content = this.rootElement.querySelector(".pit-wall-command-body > .pit-wall-panel-content");
    const running = state && state.phase === "running" && this.isPractice();
    if (!running) {
      content.innerHTML = `<div class="pit-wall-placeholder-block">
        <p class="pit-wall-placeholder-label">Radio & Strategy Controls</p>
        <p class="pit-wall-placeholder-info">Controls are available during practice.</p>
      </div>`;
      this.rootElement.querySelector("[data-command-mode]").textContent = "";
      return;
    }
    content.innerHTML = `
      <div class="pit-wall-command-controls">
        <div class="pit-wall-command-group" role="group" aria-label="Driver mode">
          <strong>Driver Mode</strong>
          ${Object.keys(this.balance.modes).map((mode) =>
    `<button type="button" class="pit-wall-discovery-action" data-driver-mode="${mode}">${mode}</button>`).join("")}
          <span data-mode-feedback></span>
        </div>
        <div class="pit-wall-command-group">
          <button type="button" class="pit-wall-discovery-action" data-action="call-pit">Call To Pit</button>
          <span data-pit-status role="status"></span>
        </div>
        <div class="pit-wall-command-group" data-pit-tyres hidden role="group" aria-label="Replacement tyre">
          <strong>Fit Tyre</strong>
          ${Object.keys(this.balance.tyres).map((tyre) =>
    `<button type="button" class="pit-wall-discovery-action pit-wall-tyre-button" data-tyre="${tyre}" data-pit-tyre="${tyre}">${tyre}</button>`).join("")}
        </div>
      </div>`;
    const sync = () => {
      if (this.sessionTimer != null && this.syncPracticeClock()) {
        this.completeSession();
        return false;
      }
      return state.phase === "running";
    };
    content.querySelectorAll("[data-driver-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!sync()) return;
        setDriverMode(state.practice, button.dataset.driverMode);
        this.updateTiming();
      });
    });
    content.querySelector('[data-action="call-pit"]').addEventListener("click", () => {
      if (!sync()) return;
      callToPit(state.practice);
      this.updateTiming();
    });
    content.querySelectorAll("[data-pit-tyre]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!sync()) return;
        selectPitTyre(state.practice, button.dataset.pitTyre);
        this.updateTiming();
      });
    });
    this.updateCommand();
  }

  updateCommand() {
    const state = this.weekendState;
    if (!state || state.phase !== "running" || !state.practice) return;
    const practice = state.practice;
    const content = this.rootElement.querySelector(".pit-wall-command-body > .pit-wall-panel-content");
    this.rootElement.querySelector("[data-command-mode]").textContent = `Driver Mode: ${practice.mode}${practice.pitState === "stopped" ? " · PIT STOP" : practice.pitState === "called" ? " · PIT CALLED" : ""}`;
    content.querySelectorAll("[data-driver-mode]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.driverMode === practice.mode));
    });
    const call = content.querySelector('[data-action="call-pit"]');
    if (!call) return;
    const mode = this.balance.modes[practice.mode];
    const baseline = this.balance.modes.Balanced;
    const paceFeedback = mode.pace < baseline.pace ? "Faster pace" : mode.pace > baseline.pace ? "Slower pace" : "Balanced pace";
    const usageFeedback = mode.wear > baseline.wear && mode.fuel > baseline.fuel ? "more tyre wear & fuel"
      : mode.wear < baseline.wear && mode.fuel < baseline.fuel ? "less tyre wear & fuel"
        : mode.wear === baseline.wear && mode.fuel === baseline.fuel ? "normal wear & fuel"
          : `tyre wear ${mode.wear}x · fuel ${mode.fuel}x`;
    const modeFeedback = content.querySelector("[data-mode-feedback]");
    const feedback = `${paceFeedback} · ${usageFeedback}`;
    if (modeFeedback.textContent !== feedback) modeFeedback.textContent = feedback;
    call.disabled = practice.pitState !== "none";
    const status = content.querySelector("[data-pit-status]");
    const statusText = practice.pitState === "called" ? "Pit requested · awaiting lap end"
      : practice.pitState === "stopped" ? `Pit Stop In Progress · ${Math.ceil(practice.pitRemaining / 1000)}s${practice.nextTyre ? " · tyre selected" : " · select a tyre"}`
        : "";
    if (status.textContent !== statusText) status.textContent = statusText;
    content.querySelector("[data-pit-tyres]").hidden = practice.pitState !== "stopped";
    content.querySelectorAll("[data-pit-tyre]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.pitTyre === practice.nextTyre));
    });
  }

  clearSessionTimer() {
    if (this.sessionTimer != null) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  clearRouteMarker() {
    this.routeMarker?.remove();
    this.routeMarker = null;
  }

  isBahrainPractice() {
    const state = this.weekendState;
    return state.weekend.id === "bahrain" && this.isPractice();
  }

  isPractice() {
    const state = this.weekendState;
    return (state.weekend.sessions[state.sessionIndex] || "").startsWith("Practice ");
  }

  renderSession() {
    const state = this.weekendState;
    const tracker = this.rootElement.querySelector(".pit-wall-session-tracker");
    const panel = this.rootElement.querySelector(".pit-wall-session-panel");
    const circuit = this.rootElement.querySelector(".pit-wall-circuit");
    circuit.hidden = state.phase === "discovery" || state.phase === "review";
    if (state.phase !== "running" || !state.showRoute) {
      this.routeOverlay?.remove();
      this.routeOverlay = null;
    }
    panel.classList.toggle("is-discovery", state.phase === "discovery");
    panel.classList.toggle("is-review", state.phase === "review");
    this.renderTiming();
    this.renderCommand();
    tracker.innerHTML = state.weekend.sessions.map((session, index) => {
      const completed = state.sessionResults[index] !== "pending";
      const current = index === state.sessionIndex && !completed && state.phase !== "complete";
      const label = completed ? "Completed" : current ? "Current" : "Pending";
      const icon = completed ? "&#10003;" : current ? "&#9679;" : "&#183;";
      return `<li class="pit-wall-session-step ${label.toLowerCase()}" aria-label="${session}: ${label}"${current ? ' aria-current="step"' : ""}>${icon} ${session}</li>`;
    }).join("");

    if (state.phase === "complete") {
      panel.innerHTML = `
        <div class="pit-wall-session-complete" tabindex="-1">
          <button type="button" class="pit-wall-menu-button" data-action="next-round">Proceed To Next Round</button>
          ${state.message ? `<span class="pit-wall-session-notice">${state.message}</span>` : ""}
        </div>
      `;
      panel.querySelector('[data-action="next-round"]').addEventListener("click", () => {
        if (this.weekendState !== state || state.phase !== "complete") return;
        this.currentRoundIndex += 1;
        this.renderWeekend(this.seasonWeekends[this.currentRoundIndex]);
      });
      return;
    }

    const session = state.weekend.sessions[state.sessionIndex];
    if (state.phase === "review") {
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
          <button type="button" class="pit-wall-menu-button" data-action="continue-review">${enoughData ? "Choose Engineering Discovery" : "Continue to Next Session"}</button>
        </section>`;
      panel.querySelector('[data-action="continue-review"]').addEventListener("click", () => {
        if (state.phase !== "review") return;
        if (enoughData) this.offerDiscoveries();
        else this.advanceSession("No discovery awarded: insufficient data.");
      });
      return;
    }
    if (state.phase === "discovery") {
      panel.innerHTML = `
        <div class="pit-wall-discovery-heading" tabindex="-1">
          <strong>Session Complete</strong>
          <span>Engineering Discovery Available</span>
          ${state.message ? `<span role="status">${state.message}</span>` : ""}
          ${state.rerollsRemaining ? `<button type="button" class="pit-wall-discovery-action" data-action="reroll-discoveries">Reroll all (${state.rerollsRemaining})</button>` : ""}
          ${state.replacementsRemaining ? `<button type="button" class="pit-wall-discovery-action" data-action="replace-discovery" aria-pressed="${state.replacementMode}">Reroll one (${state.replacementsRemaining})</button>` : ""}
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
      panel.querySelector('[data-action="reroll-discoveries"]')?.addEventListener("click", () => this.rerollDiscoveries());
      panel.querySelector('[data-action="replace-discovery"]')?.addEventListener("click", () => {
        state.replacementMode = !state.replacementMode;
        this.renderSession();
        panel.querySelector('[data-action="replace-discovery"]').focus();
      });
      return;
    }

    panel.innerHTML = `
      <div class="pit-wall-session-current">
        <div class="pit-wall-session-details">
          <span class="pit-wall-session-label">Current Session</span>
          <strong class="pit-wall-session-name" tabindex="-1">${session}</strong>
          <span>Track Conditions: Green</span>
          <span>Weather: ${state.weekend.weather || "Not available"}</span>
          <span>Driver Confidence: Normal</span>
        </div>
        <div class="pit-wall-session-actions">
          ${state.phase === "running" ? `
            <span class="pit-wall-session-running">${session} ${state.debugPaused ? "Paused (Route Debug)" : state.practice && state.practice.speed === 0 ? "Paused" : "Running..."}</span>
            ${this.isPractice() ? "" : `<progress aria-label="${session} progress" max="${SESSION_DURATION}" value="${state.elapsed}"></progress>`}
            <button type="button" class="pit-wall-menu-button" data-action="complete-session"${this.isBahrainPractice() && !this.routeMarker ? " disabled" : ""}>Complete Session</button>
          ` : `
            <button type="button" class="pit-wall-menu-button" data-action="start-session">Start Session</button>
            <button type="button" class="pit-wall-menu-button" data-action="skip-session">Skip Session</button>
          `}
        </div>
        ${state.phase === "running" && this.isPractice() ? `
          <div class="pit-wall-speed-controls" role="group" aria-label="Session speed">
            <span>Session Speed</span>
            ${[0, 1, 10, 50].map((speed) => `<button type="button" class="pit-wall-discovery-action" data-speed="${speed}" aria-pressed="${state.practice.speed === speed}">${speed === 0 ? "Pause" : `${speed}x`}</button>`).join("")}
            <span data-practice-goal>${state.practice.lapTimes.length >= MINIMUM_LAPS ? "Discovery goal achieved" : `Discovery data: ${state.practice.lapTimes.length} / ${MINIMUM_LAPS} laps`}</span>
          </div>
        ` : ""}
      </div>
      ${state.phase === "ready" && this.isPractice() ? `
        <div class="pit-wall-garage-setup" aria-label="Garage setup">
          <div class="pit-wall-setup-tyres" role="group" aria-label="Starting tyre">
            <strong>Tyres</strong>
            ${Object.keys(this.balance.tyres).map((tyre) =>
    `<button type="button" class="pit-wall-discovery-action pit-wall-tyre-button" data-tyre="${tyre}" data-setup-tyre="${tyre}" aria-pressed="${state.setup.tyre === tyre}">${tyre}</button>`).join("")}
          </div>
          <label class="pit-wall-setup-fuel">Fuel
            <input type="range" min="10" max="100" step="1" value="${state.setup.fuel}" data-setup-fuel>
            <output data-setup-fuel-value>${state.setup.fuel}%</output>
          </label>
        </div>
      ` : ""}
      ${state.phase === "running" && state.markerLoading ? '<p class="pit-wall-session-notice" role="status">Loading Bahrain route...</p>' : ""}
      ${state.phase === "running" && state.markerError ? `
        <div class="pit-wall-route-error" role="alert">${state.markerError}
          <button type="button" class="pit-wall-discovery-action" data-action="retry-marker">Retry Route</button>
        </div>
      ` : ""}
      ${state.phase === "running" && this.routeDebugEnabled && state.weekend.id === "bahrain" ? `
        <div class="pit-wall-route-controls">
          <span>Developer Route Debug</span>
          <button type="button" class="pit-wall-discovery-action" data-action="toggle-route" aria-pressed="${state.showRoute}"${state.routeLoading || state.markerLoading ? " disabled" : ""}>${state.routeLoading ? "Loading Route..." : state.showRoute ? "Hide Route" : "Show Route"}</button>
          ${state.showRoute ? `
            <button type="button" class="pit-wall-discovery-action" data-action="edit-route" aria-pressed="${state.editRoute}">Edit Route</button>
            <button type="button" class="pit-wall-discovery-action" data-action="export-route">Export JSON</button>
            ${state.selectedWaypoint !== null ? `<span>Waypoint ${state.selectedWaypoint}</span>` : ""}
          ` : ""}
          <button type="button" class="pit-wall-discovery-action" data-action="pause-route-session"${state.routeLoading ? " disabled" : ""}>${state.debugPaused ? "Resume Session" : "Pause Session"}</button>
          ${state.routeError ? `<span class="pit-wall-route-error" role="alert">${state.routeError}</span>` : ""}
        </div>
      ` : ""}
      ${state.message ? `<p class="pit-wall-session-notice" role="status">${state.message}</p>` : ""}
    `;
    if (state.phase === "ready") {
      panel.querySelector('[data-action="start-session"]').addEventListener("click", () => this.startSession());
      panel.querySelectorAll("[data-setup-tyre]").forEach((button) => {
        button.addEventListener("click", () => {
          state.setup.tyre = button.dataset.setupTyre;
          panel.querySelectorAll("[data-setup-tyre]").forEach((choice) => {
            choice.setAttribute("aria-pressed", String(choice === button));
          });
          this.updateTiming();
        });
      });
      panel.querySelector("[data-setup-fuel]")?.addEventListener("input", (event) => {
        state.setup.fuel = Number(event.currentTarget.value);
        panel.querySelector("[data-setup-fuel-value]").textContent = `${state.setup.fuel}%`;
        this.updateTiming();
      });
    }
    panel.querySelector('[data-action="skip-session"]')?.addEventListener("click", () => this.skipSession());
    panel.querySelector('[data-action="complete-session"]')?.addEventListener("click", () => this.completeSession());
    panel.querySelectorAll("[data-speed]").forEach((button) => {
      button.addEventListener("click", () => this.setPracticeSpeed(Number(button.dataset.speed)));
    });
    panel.querySelector('[data-action="retry-marker"]')?.addEventListener("click", () => this.startRouteMarker());
    panel.querySelector('[data-action="toggle-route"]')?.addEventListener("click", () => this.toggleRoute());
    panel.querySelector('[data-action="edit-route"]')?.addEventListener("click", () => {
      state.editRoute = !state.editRoute;
      this.routeOverlay.setEditing(state.editRoute);
      this.renderSession();
      panel.querySelector('[data-action="edit-route"]').focus();
    });
    panel.querySelector('[data-action="export-route"]')?.addEventListener("click", () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(this.bahrainRoute, null, 2) + "\n"], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "bahrain-route.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    panel.querySelector('[data-action="pause-route-session"]')?.addEventListener("click", () => {
      if (state.debugPaused) {
        state.showRoute = false;
        state.editRoute = false;
        state.routeLoading = false;
        state.debugPaused = false;
        this.renderSession();
        if (this.isBahrainPractice()) {
          if (this.routeMarker) {
            this.resumeSessionTimer();
            this.routeMarker.resume();
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
    state.message = "";
    state.elapsed = 0;
    state.debugPaused = this.routeDebugEnabled && state.weekend.id === "bahrain" && !this.isBahrainPractice();
    state.showRoute = false;
    state.editRoute = false;
    state.routeLoading = false;
    state.routeError = "";
    state.selectedWaypoint = null;
    state.markerLoading = false;
    state.markerError = "";
    state.markerRequest = null;
    if (this.isPractice()) {
      const length = parseFloat(state.weekend.circuitLength);
      if (!Number.isFinite(length) || length <= 0) throw new Error("Practice circuit length is unavailable");
      state.practice = createPracticeSession(this.driver, this.team, this.activeDiscoveries(), length, Math.random, state.setup, this.balance);
    } else state.practice = null;
    this.renderSession();
    if (this.isBahrainPractice()) this.startRouteMarker();
    else if (!state.debugPaused) this.resumeSessionTimer();
  }

  pauseSessionTimer() {
    const state = this.weekendState;
    if (state.debugPaused) return;
    if (this.isPractice()) {
      if (this.sessionTimer != null && this.syncPracticeClock()) {
        this.completeSession();
        return;
      }
      this.clearSessionTimer();
      this.routeMarker?.pause();
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
      route = this.bahrainRoute || await loadBahrainRoute();
      if (this.weekendState !== state || state.phase !== "running" || state.markerRequest !== request) return;
      this.bahrainRoute = route;
      this.routeMarker = mountRouteMarker(this.rootElement.querySelector(".pit-wall-circuit"),
        route, driverInitials(this.driver), this.team.colour, () => this.practiceProgress());
      if (!state.debugPaused) {
        this.resumeSessionTimer();
        this.routeMarker.resume();
      }
      else if (state.showRoute) this.routeMarker.pause(true);
    } catch (error) {
      console.error("Could not display Bahrain driver marker.", error);
      if (this.weekendState !== state || state.phase !== "running" || state.markerRequest !== request) return;
      this.clearSessionTimer();
      this.clearRouteMarker();
      state.markerError = "Could not load the Bahrain route. Check the browser console.";
    }
    state.markerLoading = false;
    this.renderSession();
  }

  async toggleRoute() {
    const state = this.weekendState;
    const sessionIndex = state.sessionIndex;
    if (state.showRoute) {
      state.showRoute = false;
      state.editRoute = false;
      this.renderSession();
      return;
    }
    this.pauseSessionTimer();
    if (state.phase !== "running") return;
    state.routeError = "";
    state.routeLoading = true;
    this.renderSession();
    let route;
    try {
      route = this.bahrainRoute || await loadBahrainRoute();
    } catch (error) {
      console.error("Could not load Bahrain route.", error);
      if (this.weekendState === state && state.phase === "running" && state.sessionIndex === sessionIndex) {
        state.routeLoading = false;
        state.routeError = "Could not load Bahrain route. Check the browser console.";
        this.renderSession();
      }
      return;
    }
    if (this.weekendState !== state || state.phase !== "running" || state.sessionIndex !== sessionIndex || !state.debugPaused) return;
    this.bahrainRoute = route;
    state.routeLoading = false;
    state.showRoute = true;
    this.routeMarker?.pause(true);
    this.routeOverlay = mountRouteDebug(this.rootElement.querySelector(".pit-wall-circuit"),
      this.bahrainRoute, driverInitials(this.driver), (index) => {
        state.selectedWaypoint = index;
        this.renderSession();
      });
    this.renderSession();
    this.rootElement.querySelector('[data-action="toggle-route"]').focus();
  }

  resumeSessionTimer() {
    const state = this.weekendState;
    this.clearSessionTimer();
    if (this.isPractice()) {
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
    advancePracticeSession(state.practice, delta * state.practice.speed);
    this.updateTiming();
    return state.practice.elapsed >= PRACTICE_DURATION;
  }

  practiceProgress() {
    const state = this.weekendState;
    const practice = state.practice;
    const pending = this.sessionTimer != null
      ? Math.max(0, performance.now() - state.timerStartedAt) * practice.speed : 0;
    return practice.pitState === "stopped" ? 0
      : Math.min(1, practice.lapProgress + pending / practice.lapTarget);
  }

  setPracticeSpeed(speed) {
    const state = this.weekendState;
    if (state.phase !== "running" || !this.isPractice() || ![0, 1, 10, 50].includes(speed)) return;
    if (this.sessionTimer != null && this.syncPracticeClock()) {
      this.completeSession();
      return;
    }
    state.practice.speed = speed;
    this.rootElement.querySelectorAll("[data-speed]").forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.speed) === speed));
    });
    const status = this.rootElement.querySelector(".pit-wall-session-running");
    const session = state.weekend.sessions[state.sessionIndex];
    status.textContent = `${session} ${state.debugPaused ? "Paused (Route Debug)" : speed === 0 ? "Paused" : "Running..."}`;
    this.updateTiming();
  }

  completeSession() {
    const state = this.weekendState;
    if (state.phase !== "running" || (this.isBahrainPractice() && !this.routeMarker)) return;
    if (this.isPractice() && this.sessionTimer != null) this.syncPracticeClock();
    this.clearSessionTimer();
    this.clearRouteMarker();
    state.sessionResults[state.sessionIndex] = "completed";
    if (this.isPractice()) {
      state.phase = "review";
      this.renderSession();
      this.rootElement.querySelector("#pit-wall-review-title").focus();
      return;
    }
    this.offerDiscoveries();
  }

  offerDiscoveries() {
    const state = this.weekendState;
    state.phase = "discovery";
    state.rerollsRemaining = this.permanentUpgrades.filter((item) => item.id === "research-charter").length * this.balance.discoveries.fullRerolls;
    state.replacementsRemaining = this.permanentUpgrades.filter((item) => item.id === "design-review").length * this.balance.discoveries.singleRerolls;
    state.replacementMode = false;
    state.options = discoveryOffer(this.isPostGrandPrix(), this.activeDiscoveries(), this.uniqueRewards, this.balance);
    if (!state.options.length) {
      this.advanceSession("No discoveries available.");
      return;
    }
    this.renderSession();
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
    state.practice = null;
    state.setup = { tyre: "Medium", fuel: 100 };
    state.sessionIndex += 1;
    state.phase = state.sessionIndex === state.weekend.sessions.length ? "complete" : "ready";
    if (state.phase === "complete") {
      this.roundsCompleted += 1;
      this.weekendDiscoveries = [];
      if (this.currentRoundIndex === this.seasonWeekends.length - 1) {
        this.renderSeasonComplete(message);
        return;
      }
      this.renderProfile("Round Complete");
    }
    this.renderSession();
    const heading = this.rootElement.querySelector(".pit-wall-session-name, .pit-wall-session-complete");
    heading.focus();
  }

  renderSeasonComplete(message) {
    this.renderCommand();
    this.renderProfile("Season Complete");
    const mainPanel = this.rootElement.querySelector(".pit-wall-track-display");
    const rareCount = this.permanentUpgrades.filter((upgrade) => upgrade.rarity === "purple").length;
    const legendaryCount = this.permanentUpgrades.filter((upgrade) => upgrade.rarity === "gold").length;
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
          <dt>Championship Position</dt><dd>Not available yet</dd>
        </dl>
      </section>
    `;
    mainPanel.querySelector("#pit-wall-season-finish-title").focus();
  }
}

export { PitWallConsole, drawDiscovery };
