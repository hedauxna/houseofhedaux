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
  { name: "Apex Dynamics", bonus: "Qualifying pace", weakness: "Tyre wear", description: "Built for one-lap speed." },
  { name: "Nova Racing", bonus: "Race strategy", weakness: "Slow starts", description: "A team with a tactical edge." },
  { name: "Orion Motorsport", bonus: "Consistency", weakness: "Qualifying pace", description: "Reliable through every stint." },
  { name: "Blackline GP", bonus: "Wet conditions", weakness: "Tyre wear", description: "At home in changing weather." },
  { name: "Titan Velocity", bonus: "Straight-line speed", weakness: "Cornering", description: "Power is their calling card." },
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
  { id: "wind-tunnel", name: "Wind Tunnel Upgrade", stat: "Aero", amount: 1, effect: "+1 Aero", rarity: "green", category: "permanent" },
  { id: "brake-cooling", name: "Brake Cooling", stat: "Reliability", amount: 1, effect: "+1 Reliability", rarity: "green", category: "permanent" },
  { id: "battery-optimisation", name: "Battery Optimisation", stat: "Energy Recovery", amount: 1, effect: "+1 Energy Recovery", rarity: "green", category: "permanent" },
  { id: "suspension-development", name: "Suspension Development", stat: "Handling", amount: 1, effect: "+1 Handling", rarity: "green", category: "permanent" },
  { id: "pit-crew-training", name: "Pit Crew Training", stat: "Pit Efficiency", amount: 1, effect: "+1 Pit Efficiency", rarity: "green", category: "permanent" },
  { id: "tyre-insight", name: "Tyre Insight", effect: "+10% Tyre Life", rarity: "blue", category: "weekend" },
  { id: "track-evolution", name: "Track Evolution Notes", effect: "+0.15 Pace", rarity: "blue", category: "weekend" },
  { id: "braking-reference", name: "Braking Reference Data", effect: "+20% Corner Entry", rarity: "blue", category: "weekend" },
  { id: "fuel-mapping", name: "Fuel Mapping Discovery", effect: "+15% Fuel Efficiency", rarity: "blue", category: "weekend" },
  { id: "overtaking-analysis", name: "Overtaking Analysis", effect: "+20% Racecraft", rarity: "blue", category: "weekend" },
  { id: "aero-breakthrough", name: "Aero Breakthrough", stat: "Aero", amount: 3, effect: "+3 Aero", rarity: "purple", category: "permanent" },
  { id: "durability-breakthrough", name: "Durability Breakthrough", stat: "Reliability", amount: 3, effect: "+3 Reliability", rarity: "purple", category: "permanent" },
  { id: "handling-breakthrough", name: "Handling Breakthrough", stat: "Handling", amount: 3, effect: "+3 Handling", rarity: "purple", category: "permanent" },
  { id: "research-charter", name: "Research Charter", effect: "+1 full reroll per future session", rarity: "gold", category: "permanent" },
  { id: "design-review", name: "Design Review", effect: "+1 single-card reroll per future session", rarity: "gold", category: "permanent" },
  { id: "legacy-lab", name: "Legacy Lab", effect: "Future green upgrades gain +1x effect", rarity: "gold", category: "permanent" },
];

const SESSION_DURATION = 5000;

function drawDiscovery(postGrandPrix, exclude = []) {
  const roll = Math.random();
  const rarity = postGrandPrix
    ? (roll < .90 ? "green" : roll < .98 ? "purple" : "gold")
    : (roll < .45 ? "blue" : roll < .90 ? "green" : roll < .98 ? "purple" : "gold");
  const candidates = DISCOVERIES.filter((item) =>
    item.rarity === rarity && !exclude.some((other) => other.id === item.id));
  if (!candidates.length) throw new Error(`No ${rarity} discoveries available for this offer`);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function discoveryOffer(postGrandPrix) {
  const options = [];
  while (options.length < 3) options.push(drawDiscovery(postGrandPrix, options));
  return options;
}

function rarityLabel(rarity) {
  return {
    blue: "Blue · Weekend Only",
    green: "Green · Permanent",
    purple: "Purple · Rare · Permanent",
    gold: "Gold · Legendary · Permanent",
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
  const initials = driver.name.split(" ").map((part) => part[0]).join("");
  return `<span class="pit-wall-driver-portrait" aria-hidden="true">${initials}</span>`;
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
  }

  mount() {
    this.clearSessionTimer();
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
      </div>
    `;

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
    this.driver = null;
    this.team = null;
    this.permanentUpgrades = [];
    this.weekendDiscoveries = [];
    this.weekendState = null;
    this.seasonWeekends = [];
    this.currentRoundIndex = 0;
    this.roundsCompleted = 0;
    this.profileUpgradePage = 0;
    this.seasonPage = 0;
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
    const permanent = this.upgradeEntries(this.permanentUpgrades);
    const temporary = this.upgradeEntries(this.weekendDiscoveries);
    const pages = Math.max(1, permanent.length + temporary.length);
    this.profileUpgradePage = Math.min(this.profileUpgradePage, pages - 1);
    const rareCount = this.permanentUpgrades.filter((upgrade) => upgrade.rarity === "purple").length;
    const legendaryCount = this.permanentUpgrades.filter((upgrade) => upgrade.rarity === "gold").length;
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
            <span>Permanent Upgrades: ${this.permanentUpgrades.length}</span>
            <span>Rare Breakthroughs: ${rareCount}</span>
            <span>Legendary Discoveries: ${legendaryCount}</span>
          </section>
          <section class="pit-wall-active-upgrades" aria-label="Active Upgrades">
            <span class="pit-wall-driver-profile-label">Active Upgrades</span>
            <span class="pit-wall-driver-traits-label">Permanent Upgrades${permanent.length ? "" : ": None"}</span>
            ${this.upgradeList(permanent, 0)}
            <span class="pit-wall-driver-traits-label">Weekend Discoveries${temporary.length ? "" : ": None"}</span>
            ${this.upgradeList(temporary, permanent.length)}
            ${pages > 1 ? `
              <div class="pit-wall-upgrade-pagination" aria-label="Upgrade pages">
                <button type="button" data-action="previous-upgrades" ${this.profileUpgradePage === 0 ? "disabled" : ""} aria-label="Previous upgrades">&lsaquo;</button>
                <span>${this.profileUpgradePage + 1}/${pages}</span>
                <button type="button" data-action="next-upgrades" ${this.profileUpgradePage === pages - 1 ? "disabled" : ""} aria-label="Next upgrades">&rsaquo;</button>
              </div>
            ` : ""}
          </section>
        ` : ""}
      </div>
    `;
    const changeUpgradePage = (direction) => {
      this.profileUpgradePage += direction;
      this.renderProfile(status);
      const preferred = direction < 0 ? "previous-upgrades" : "next-upgrades";
      const alternative = direction < 0 ? "next-upgrades" : "previous-upgrades";
      const button = driverPanel.querySelector(`[data-action="${preferred}"]`);
      const focusTarget = button && !button.disabled ? button : driverPanel.querySelector(`[data-action="${alternative}"]`);
      focusTarget?.focus();
    };
    driverPanel.querySelector('[data-action="previous-upgrades"]')?.addEventListener("click", () => changeUpgradePage(-1));
    driverPanel.querySelector('[data-action="next-upgrades"]')?.addEventListener("click", () => changeUpgradePage(1));
    if (status) this.rootElement.querySelector(".pit-wall-info-value").textContent = status;
  }

  upgradeEntries(upgrades) {
    const counts = new Map();
    upgrades.forEach((upgrade) => counts.set(upgrade.name, (counts.get(upgrade.name) || 0) + 1));
    return [...counts];
  }

  upgradeList(entries, offset) {
    const index = this.profileUpgradePage - offset;
    const page = index < 0 ? [] : entries.slice(index, index + 1);
    if (!page.length) return "";
    return `<ul class="pit-wall-upgrade-list">${page.map(([name, count]) => `
      <li>${name}${count > 1 ? ` &times;${count}` : ""}</li>
    `).join("")}</ul>`;
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
        <p class="pit-wall-draft-eyebrow">Prepare your season</p>
        <h4 id="pit-wall-draft-title" tabindex="-1">2027 Season Setup</h4>
        <p class="pit-wall-draft-intro">Choose the weekends you want to include.</p>
        <div class="pit-wall-season-races"></div>
        <div class="pit-wall-season-navigation">
          <button type="button" class="pit-wall-discovery-action" data-action="previous-calendar">Previous</button>
          <span data-calendar-page></span>
          <button type="button" class="pit-wall-discovery-action" data-action="next-calendar">Next</button>
          <button type="button" class="pit-wall-discovery-action" data-action="select-all-races">Select All</button>
          <button type="button" class="pit-wall-discovery-action" data-action="clear-races">Clear All</button>
        </div>
        <div class="pit-wall-season-summary" aria-live="polite">
          <span class="pit-wall-season-summary-label">Selected Races</span>
          <span data-season-names></span>
          <span class="pit-wall-season-summary-label">Selected Race Count</span>
          <span data-season-count></span>
          <span class="pit-wall-season-summary-label">Season Length</span>
          <span data-season-length></span>
        </div>
        <div class="pit-wall-season-footer">
          <span class="pit-wall-season-warning" data-season-warning></span>
          <button type="button" class="pit-wall-menu-button pit-wall-season-confirm" data-action="confirm-season">Confirm Season</button>
        </div>
      </section>
    `;

    const confirm = mainPanel.querySelector('[data-action="confirm-season"]');
    const renderCalendar = () => {
      const pageSize = 6;
      const pageCount = Math.ceil(WEEKENDS.length / pageSize);
      const racesElement = mainPanel.querySelector(".pit-wall-season-races");
      racesElement.innerHTML = WEEKENDS.slice(this.seasonPage * pageSize, (this.seasonPage + 1) * pageSize).map((weekend) => `
        <button type="button" class="pit-wall-season-race" data-weekend="${weekend.id}" aria-pressed="${this.selectedWeekends.has(weekend.id)}">
          <span class="pit-wall-season-round">Round ${weekend.round}${weekend.sprint ? " · Sprint" : ""}</span>
          <span class="pit-wall-season-name">${weekend.name}</span>
          <span class="pit-wall-season-date">${weekend.dates}</span>
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
      mainPanel.querySelector("[data-calendar-page]").textContent = `Calendar ${this.seasonPage + 1}/${pageCount}`;
      mainPanel.querySelector('[data-action="previous-calendar"]').disabled = this.seasonPage === 0;
      mainPanel.querySelector('[data-action="next-calendar"]').disabled = this.seasonPage === pageCount - 1;
    };
    const updateSelection = () => {
      const selected = WEEKENDS.filter((weekend) => this.selectedWeekends.has(weekend.id));
      const count = selected.length;
      const races = count === 1 ? "Race" : "Races";
      const names = selected.slice(0, 2).map((weekend) => weekend.name).join(", ");
      mainPanel.querySelector("[data-season-names]").textContent = names
        ? `${names}${count > 2 ? ` + ${count - 2} more` : ""}` : "None";
      mainPanel.querySelector("[data-season-count]").textContent = String(count);
      mainPanel.querySelector("[data-season-length]").textContent = `${count} ${races} Selected`;
      mainPanel.querySelector("[data-season-warning]").textContent = count ? "" : "Select at least one race.";
      confirm.disabled = count === 0;
    };
    mainPanel.querySelector('[data-action="previous-calendar"]').addEventListener("click", () => {
      this.seasonPage -= 1;
      renderCalendar();
    });
    mainPanel.querySelector('[data-action="next-calendar"]').addEventListener("click", () => {
      this.seasonPage += 1;
      renderCalendar();
    });
    mainPanel.querySelector('[data-action="select-all-races"]').addEventListener("click", () => {
      this.selectedWeekends = new Set(WEEKENDS.map((weekend) => weekend.id));
      renderCalendar();
      updateSelection();
    });
    mainPanel.querySelector('[data-action="clear-races"]').addEventListener("click", () => {
      this.selectedWeekends.clear();
      renderCalendar();
      updateSelection();
    });
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
    this.weekendDiscoveries = [];
    this.profileUpgradePage = 0;
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
    };
    const mainPanel = this.rootElement.querySelector(".pit-wall-track-display");
    const timingPanel = this.rootElement.querySelector(".pit-wall-panel-right .pit-wall-panel-content");
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
    this.renderSession();
    mainPanel.querySelector("#pit-wall-weekend-title").focus();
  }

  clearSessionTimer() {
    if (this.sessionTimer != null) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  renderSession() {
    const state = this.weekendState;
    const tracker = this.rootElement.querySelector(".pit-wall-session-tracker");
    const panel = this.rootElement.querySelector(".pit-wall-session-panel");
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
    if (state.phase === "discovery") {
      panel.innerHTML = `
        <div class="pit-wall-discovery-heading" tabindex="-1">
          <strong>Session Complete</strong>
          <span>Engineering Discovery Available</span>
          ${state.rerollsRemaining ? `<button type="button" class="pit-wall-discovery-action" data-action="reroll-discoveries">Reroll all (${state.rerollsRemaining})</button>` : ""}
          ${state.replacementsRemaining ? `<button type="button" class="pit-wall-discovery-action" data-action="replace-discovery" aria-pressed="${state.replacementMode}">Reroll one (${state.replacementsRemaining})</button>` : ""}
          ${state.replacementMode ? '<span role="status">Choose a card to reroll.</span>' : ""}
        </div>
        <div class="pit-wall-discovery-cards">
          ${state.options.map((discovery, index) => `
            <button type="button" class="pit-wall-discovery-card ${discovery.rarity}" data-discovery-index="${index}">
              <strong>${discovery.name}</strong>
              <span>${this.effectiveDiscovery(discovery).effect}</span>
              <span>${rarityLabel(discovery.rarity)}</span>
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
            <span class="pit-wall-session-running">${session} Running...</span>
            <progress aria-label="${session} progress" max="${SESSION_DURATION}" value="0"></progress>
            <button type="button" class="pit-wall-menu-button" data-action="skip-session">Skip Session</button>
          ` : `
            <button type="button" class="pit-wall-menu-button" data-action="start-session">Start Session</button>
            <button type="button" class="pit-wall-menu-button" data-action="skip-session">Skip Session</button>
          `}
        </div>
      </div>
      ${state.message ? `<p class="pit-wall-session-notice" role="status">${state.message}</p>` : ""}
    `;
    if (state.phase === "ready") {
      panel.querySelector('[data-action="start-session"]').addEventListener("click", () => this.startSession());
    }
    panel.querySelector('[data-action="skip-session"]').addEventListener("click", () => this.skipSession());
  }

  startSession() {
    const state = this.weekendState;
    if (state.phase !== "ready") return;
    state.phase = "running";
    state.message = "";
    this.renderSession();
    const progress = this.rootElement.querySelector(".pit-wall-session-panel progress");
    const startedAt = performance.now();
    this.sessionTimer = setInterval(() => {
      const elapsed = Math.min(SESSION_DURATION, Math.max(0, performance.now() - startedAt));
      progress.value = elapsed;
      if (elapsed >= SESSION_DURATION) {
        this.clearSessionTimer();
        state.sessionResults[state.sessionIndex] = "completed";
        state.phase = "discovery";
        state.rerollsRemaining = this.permanentUpgrades.filter((item) => item.id === "research-charter").length;
        state.replacementsRemaining = this.permanentUpgrades.filter((item) => item.id === "design-review").length;
        state.replacementMode = false;
        state.options = discoveryOffer(this.isPostGrandPrix());
        this.renderSession();
        this.rootElement.querySelector(".pit-wall-discovery-heading").focus();
      }
    }, 100);
  }

  skipSession() {
    const state = this.weekendState;
    if (state.phase !== "ready" && state.phase !== "running") return;
    this.clearSessionTimer();
    const session = state.weekend.sessions[state.sessionIndex];
    state.sessionResults[state.sessionIndex] = "skipped";
    this.advanceSession(`${session} skipped. No discovery awarded.`);
  }

  isPostGrandPrix() {
    const state = this.weekendState;
    const index = state.weekend.sessions.indexOf("Grand Prix");
    return index !== -1 && state.sessionResults[index] !== "pending";
  }

  rerollDiscoveries() {
    const state = this.weekendState;
    if (state.phase !== "discovery" || !state.rerollsRemaining) return;
    state.rerollsRemaining -= 1;
    state.replacementMode = false;
    state.options = discoveryOffer(this.isPostGrandPrix());
    this.renderSession();
    this.rootElement.querySelector(".pit-wall-discovery-heading").focus();
  }

  replaceDiscovery(index) {
    const state = this.weekendState;
    if (state.phase !== "discovery" || !state.replacementMode || !state.replacementsRemaining || !state.options[index]) return;
    state.options[index] = drawDiscovery(this.isPostGrandPrix(), state.options.filter((_, optionIndex) => optionIndex !== index));
    state.replacementsRemaining -= 1;
    state.replacementMode = false;
    this.renderSession();
    this.rootElement.querySelector(`[data-discovery-index="${index}"]`).focus();
  }

  effectiveDiscovery(discovery) {
    if (discovery.rarity !== "green") return discovery;
    const multiplier = 1 + this.permanentUpgrades.filter((item) => item.id === "legacy-lab").length;
    const amount = discovery.amount * multiplier;
    return { ...discovery, amount, effect: `+${amount} ${discovery.stat}` };
  }

  chooseDiscovery(index) {
    const state = this.weekendState;
    if (state.phase !== "discovery" || !state.options[index]) return;
    const discovery = this.effectiveDiscovery(state.options[index]);
    const upgrades = discovery.category === "permanent" ? this.permanentUpgrades : this.weekendDiscoveries;
    upgrades.push(discovery);
    this.renderProfile("Race Weekend Ready");
    this.advanceSession(`${discovery.name} acquired: ${discovery.effect}.`);
  }

  advanceSession(message) {
    const state = this.weekendState;
    state.message = message;
    state.options = [];
    state.sessionIndex += 1;
    state.phase = state.sessionIndex === state.weekend.sessions.length ? "complete" : "ready";
    if (state.phase === "complete") {
      this.roundsCompleted += 1;
      this.weekendDiscoveries = [];
      this.profileUpgradePage = 0;
      if (this.currentRoundIndex === this.seasonWeekends.length - 1) {
        this.renderSeasonComplete();
        return;
      }
      this.renderProfile("Round Complete");
    }
    this.renderSession();
    const heading = this.rootElement.querySelector(".pit-wall-session-name, .pit-wall-session-complete");
    heading.focus();
  }

  renderSeasonComplete() {
    this.renderProfile("Season Complete");
    const mainPanel = this.rootElement.querySelector(".pit-wall-track-display");
    const rareCount = this.permanentUpgrades.filter((upgrade) => upgrade.rarity === "purple").length;
    const legendaryCount = this.permanentUpgrades.filter((upgrade) => upgrade.rarity === "gold").length;
    mainPanel.innerHTML = `
      <section class="pit-wall-season-finish" aria-labelledby="pit-wall-season-finish-title">
        <h4 id="pit-wall-season-finish-title" tabindex="-1">Season Complete</h4>
        <p>Rounds Completed: ${this.roundsCompleted} / ${this.seasonWeekends.length}</p>
        <dl>
          <dt>Total Permanent Upgrades</dt><dd>${this.permanentUpgrades.length}</dd>
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
