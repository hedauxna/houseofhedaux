const SECTION_DETAILS = {
  vehicleStats: ["Base vehicle stats", "Zero base points are the current baseline. Reliability reduces lap-time variation."],
  lap: ["Lap, tyre and fuel model", "Wear and fuel pace effects are sampled at the start of each lap."],
  driverTraits: ["Driver traits and weaknesses", "A strength saves this time; the same weakness adds it."],
  teamTraits: ["Team bonuses and weaknesses", "A bonus saves this time; the same weakness adds it."],
  tyres: ["Tyre compounds", "Pace is a signed lap-time adjustment; wear is condition lost per lap."],
  modes: ["Driver modes", "Wear and fuel are multipliers: 1.4 means 140% of normal."],
  practiceAI: ["AI practice programmes", "Timing and hidden programme variation for practice stints."],
  qualifyingAI: ["AI sprint qualifying programmes", "Run timing, flying-lap counts, dry tyre weights and fuel reserve."],
  sprintRace: ["Sprint race", "Grid spacing and AI strategy."],
  grandPrix: ["Grand Prix strategy", "AI tyre wear thresholds and fuel reserves."],
  statPoints: ["Permanent upgrades and rare breakthroughs", "Points apply per selection."],
  discoveries: ["Weekend and legendary discoveries", "Weekend pace gains apply per level and expire after the weekend."],
  rewardWeights: ["Discovery rarity weights", "Weights are relative and are redistributed when a rarity has no eligible rewards."],
};

const LAP_FIELDS = {
  baseTimeMs: ["Reference lap", "ms", 1000, 300000],
  referenceLengthKm: ["Reference circuit length", "km", .1, 100],
  variationMs: ["Random variation range", "ms", 0, 30000],
  maxUpgradeGainMs: ["Maximum upgrade pace gain", "ms", 0, 30000],
  statPointCap: ["Points counted per upgrade", "points", 0, 1000],
  baseClampMs: ["Base pace limit from reference", "ms", 0, 30000],
  minimumLapMs: ["Minimum lap target", "ms", 100, 30000],
  tyreWearMsPerPercent: ["Tyre wear penalty", "ms / 1% wear", 0, 1000],
  fuelSavingMsPerPercent: ["Fuel burn-off gain", "ms / 1% fuel used", 0, 1000],
  fuelPerLap: ["Fuel consumption", "% / reference lap", 0, 100],
  pitBaseMs: ["Base pit time", "ms", 0, 300000],
  pitMinimumMs: ["Minimum pit time", "ms", 0, 300000],
};

const DISCOVERY_FIELDS = {
  tyreLifePerLevel: ["Tyre Insight", "extra tyre life / level", 0, 20],
  fuelEfficiencyPerLevel: ["Fuel Mapping", "extra fuel efficiency / level", 0, 20],
  trackEvolutionMsPerLevel: ["Track Evolution", "ms faster / level", 0, 30000],
  brakingReferenceMsPerLevel: ["Braking Reference Data", "ms faster / level", 0, 30000],
  overtakingAnalysisMsPerLevel: ["Overtaking Analysis", "ms faster / level", 0, 30000],
  fullRerolls: ["Research Charter", "full rerolls / session", 0, 100, 1],
  singleRerolls: ["Design Review", "single-card rerolls / session", 0, 100, 1],
  blueBonusMultiplier: ["Legacy Lab", "extra blue multiplier", 0, 20],
};

const AI_FIELDS = {
  initialDelayMinMs: ["Earliest garage exit", "ms", 1000, 3600000],
  initialDelayMaxMs: ["Latest garage exit", "ms", 1000, 3600000],
  garageMinMs: ["Minimum garage stay", "ms", 1000, 3600000],
  garageMaxMs: ["Maximum garage stay", "ms", 1000, 3600000],
  stintMinLaps: ["Minimum stint length", "laps", 1, 100, 1],
  stintMaxLaps: ["Maximum stint length", "laps", 1, 100, 1],
  fuelMinPercent: ["Minimum AI fuel load", "%", 10, 100],
  fuelMaxPercent: ["Maximum AI fuel load", "%", 10, 100],
  modeChangeMinMs: ["Minimum mode interval", "ms", 1000, 3600000],
  modeChangeMaxMs: ["Maximum mode interval", "ms", 1000, 3600000],
  engineVariationMs: ["Engine programme variation", "ms", 0, 30000],
  testingVariationMs: ["Testing programme variation", "ms", 0, 30000],
};

const QUALIFYING_AI_FIELDS = {
  initialDelayMinMs: ["Earliest qualifying garage exit", "ms", 1000, 900000],
  initialDelayMaxMs: ["Latest qualifying garage exit", "ms", 1000, 900000],
  garageMinMs: ["Minimum qualifying garage stay", "ms", 1000, 900000],
  garageMaxMs: ["Maximum qualifying garage stay", "ms", 1000, 900000],
  flyingLapsMin: ["Minimum qualifying flying laps", "laps", 1, 100, 1],
  flyingLapsMax: ["Maximum qualifying flying laps", "laps", 1, 100, 1],
  softWeight: ["Qualifying Soft preference", "weight", 1, 1000],
  mediumWeight: ["Qualifying Medium preference", "weight", 0, 1000],
  hardWeight: ["Qualifying Hard preference", "weight", 0, 1000],
  fuelReservePercent: ["Qualifying fuel reserve", "%", 0, 100],
};

const SPRINT_RACE_FIELDS = {
  gridGapMs: ["Sprint grid spacing", "ms", 0, 10000],
  aiPitChance: ["AI pit probability", "probability", 0, 1],
  aiFuelMinFactor: ["AI minimum fuel factor", "multiplier", 0, 5],
  aiFuelMaxFactor: ["AI maximum fuel factor", "multiplier", 0, 5],
  aiPitEarliestFraction: ["AI earliest pit", "race fraction", 0, 1],
  aiPitLatestFraction: ["AI latest pit", "race fraction", 0, 1],
};

const GRAND_PRIX_FIELDS = {
  aiPitWearMin: ["Minimum AI tyre wear before pit", "% wear", 0, 100],
  aiPitWearMax: ["Maximum AI tyre wear before pit", "% wear", 0, 100],
  aiFuelReserveMin: ["Minimum AI fuel reserve", "%", 0, 100],
  aiFuelReserveMax: ["Maximum AI fuel reserve", "%", 0, 100],
};

function humanize(value) {
  return String(value).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ");
}

function fieldDetails(path, discoveries) {
  const [group, name, property] = path;
  if (group === "lap" && path.length === 2 && Object.hasOwn(LAP_FIELDS, name)) return LAP_FIELDS[name];
  if (group === "practiceAI" && path.length === 2 && Object.hasOwn(AI_FIELDS, name)) return AI_FIELDS[name];
  if (group === "qualifyingAI" && path.length === 2 && Object.hasOwn(QUALIFYING_AI_FIELDS, name)) return QUALIFYING_AI_FIELDS[name];
  if (group === "sprintRace" && path.length === 2 && Object.hasOwn(SPRINT_RACE_FIELDS, name)) return SPRINT_RACE_FIELDS[name];
  if (group === "grandPrix" && path.length === 2 && Object.hasOwn(GRAND_PRIX_FIELDS, name)) return GRAND_PRIX_FIELDS[name];
  if (group === "discoveries" && path.length === 2 && Object.hasOwn(DISCOVERY_FIELDS, name)) return DISCOVERY_FIELDS[name];
  if (group === "vehicleStats" && path.length === 3) {
    if (property === "base") return [`${name} base`, "points", 0, 1000];
    if (property === "lapGainMs") return [`${name} pace gain`, "ms faster / point", 0, 30000];
    if (property === "pitGainMs") return [`${name} pit gain`, "ms saved / point", 0, 30000];
    if (name === "Reliability" && property === "variationReductionPerPoint") {
      return ["Reliability consistency", "extra variation divisor / point", 0, 20];
    }
  }
  if ((group === "driverTraits" || group === "teamTraits") && path.length === 2) return [name, "ms / lap", 0, 30000];
  if (group === "tyres" && path.length === 3) {
    if (property === "pace") return [`${name} pace`, "ms / lap", -30000, 30000];
    if (property === "wear") return [`${name} wear`, "% / lap", 0, 100];
  }
  if (group === "modes" && path.length === 3) {
    if (property === "pace") return [`${name} pace`, "ms / lap", -30000, 30000];
    if (property === "wear") return [`${name} tyre wear`, "multiplier", 0, 20];
    if (property === "fuel") return [`${name} fuel usage`, "multiplier", 0, 20];
  }
  if (group === "discoveries" && name === "statPoints" && path.length === 3) {
    const item = discoveries.find((discovery) => discovery.id === property);
    return [item ? `${item.name} (${item.stat})` : humanize(property), "points", 0, 1000];
  }
  if (group === "rewardWeights" && path.length === 3) {
    const period = name === "beforeGrandPrix" ? "Before Grand Prix"
      : name === "afterGrandPrix" ? "After Grand Prix" : humanize(name);
    return [`${period}: ${property}`, "weight", 0, 1000];
  }
  return [path.slice(1).map(humanize).join(" · ") || humanize(group), "value"];
}

function isSimulated(path, balance, discoveries) {
  const [group, name, property] = path;
  if (!Number.isFinite(valueAt(balance, path))) return false;
  if (group === "lap") return path.length === 2 && Object.hasOwn(LAP_FIELDS, name);
  if (group === "vehicleStats" && path.length === 3) {
    const stat = balance.vehicleStats[name];
    if (property === "base") {
      return (name === "Reliability" && Number.isFinite(stat.variationReductionPerPoint))
        || (name === "Pit Efficiency" && Number.isFinite(stat.pitGainMs))
        || Number.isFinite(stat.lapGainMs);
    }
    return (property === "lapGainMs" && Number.isFinite(stat.base))
      || (name === "Reliability" && property === "variationReductionPerPoint")
      || (name === "Pit Efficiency" && property === "pitGainMs");
  }
  if (group === "driverTraits" || group === "teamTraits") return path.length === 2;
  if (group === "tyres") return path.length === 3 && ["pace", "wear"].includes(property);
  if (group === "modes") return path.length === 3 && ["pace", "wear", "fuel"].includes(property);
  if (group === "practiceAI") return path.length === 2 && [
    "initialDelayMinMs", "initialDelayMaxMs", "garageMinMs", "garageMaxMs",
    "stintMinLaps", "stintMaxLaps", "fuelMinPercent", "fuelMaxPercent",
    "modeChangeMinMs", "modeChangeMaxMs", "engineVariationMs", "testingVariationMs",
  ].includes(name);
  if (group === "qualifyingAI") return path.length === 2 && Object.hasOwn(QUALIFYING_AI_FIELDS, name);
  if (group === "sprintRace") return path.length === 2 && Object.hasOwn(SPRINT_RACE_FIELDS, name);
  if (group === "grandPrix") return path.length === 2 && Object.hasOwn(GRAND_PRIX_FIELDS, name);
  if (group === "discoveries" && name === "statPoints" && path.length === 3) {
    const item = discoveries.find((discovery) => discovery.id === property);
    const stat = item && balance.vehicleStats[item.stat];
    return Boolean(stat && (item.stat === "Reliability" || item.stat === "Pit Efficiency"
      || Number.isFinite(stat.lapGainMs)));
  }
  if (group === "discoveries" && path.length === 2) {
    return ["tyreLifePerLevel", "fuelEfficiencyPerLevel", "trackEvolutionMsPerLevel",
      "brakingReferenceMsPerLevel", "overtakingAnalysisMsPerLevel", "fullRerolls",
      "singleRerolls", "blueBonusMultiplier"].includes(name);
  }
  if (group === "rewardWeights" && path.length === 3) {
    return ["beforeGrandPrix", "afterGrandPrix"].includes(name)
      && discoveries.some((discovery) => discovery.rarity === property && (name === "beforeGrandPrix" || property !== "green"));
  }
  return false;
}

function fieldsFor(balance, discoveries) {
  const groups = new Map();
  function visit(value, path) {
    if (value !== null && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) visit(child, [...path, key]);
      return;
    }
    const type = typeof value;
    if (!["number", "boolean", "string"].includes(type) || (type === "number" && !Number.isFinite(value))) {
      throw new Error(`Unsupported balance value at ${path.join(".")}`);
    }
    const group = path[0] === "discoveries" && path[1] === "statPoints" ? "statPoints" : path[0];
    if (!groups.has(group)) {
      const [title, description] = Object.hasOwn(SECTION_DETAILS, group) ? SECTION_DETAILS[group] : [humanize(group), ""];
      groups.set(group, { title, description, fields: [] });
    }
    const [label, unit, min, max, step = "any"] = fieldDetails(path, discoveries);
    groups.get(group).fields.push({ label, path, type, unit, min, max, step,
      simulated: isSimulated(path, balance, discoveries) });
  }
  visit(balance, []);
  const order = Object.keys(SECTION_DETAILS);
  return [...groups.entries()].sort(([a], [b]) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return (indexA < 0 ? order.length : indexA) - (indexB < 0 ? order.length : indexB);
  }).map(([, group]) => group);
}

function valueAt(balance, path) {
  return path.reduce((value, key) => value[key], balance);
}

export function mountBalancePanel(root, balance, discoveries, onChange, beforeChange, context) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const panel = root.querySelector("#pit-wall-balance-panel");
  const toggle = root.querySelector('[data-action="balance-toggle"]');
  let fields = [];
  let signature = "";
  panel.innerHTML = `
    <header class="pit-wall-balance-header">
      <strong>Developer Balance</strong>
      <button type="button" class="pit-wall-discovery-action" data-action="export-balance">Export Balance Data</button>
      <button type="button" class="pit-wall-discovery-action" data-action="close-balance">Close</button>
    </header>
    <p class="pit-wall-balance-intro">New lap targets use edited values. Career checkpoints save the balance; export downloads a copy.</p>
    <p class="pit-wall-balance-context" data-balance-context></p>
    <p class="pit-wall-balance-status" role="status" aria-live="polite"></p>
    <div class="pit-wall-balance-sections"></div>`;
  const status = panel.querySelector(".pit-wall-balance-status");
  function refreshFields() {
    const sections = fieldsFor(balance, discoveries);
    const nextFields = sections.flatMap((section) => section.fields);
    const nextSignature = JSON.stringify(sections);
    const container = panel.querySelector(".pit-wall-balance-sections");
    if (signature === nextSignature) {
      container.querySelectorAll("[data-balance-field]").forEach((input) => {
        if (input.hasAttribute("aria-invalid")) return;
        const field = fields[Number(input.dataset.balanceField)];
        const value = valueAt(balance, field.path);
        if (field.type === "boolean") input.checked = value;
        else input.value = String(value);
      });
      return;
    }
    const open = new Set([...container.querySelectorAll("details[open]")].map((item) => item.dataset.balanceSection));
    const invalid = new Map([...container.querySelectorAll('[aria-invalid="true"]')]
      .map((input) => [input.dataset.balanceKey, input.value]));
    fields = nextFields;
    signature = nextSignature;
    const fragment = doc.createDocumentFragment();
    let index = 0;
    for (const group of sections) {
      const details = doc.createElement("details");
      details.dataset.balanceSection = group.title;
      details.open = open.has(group.title);
      const summary = doc.createElement("summary");
      summary.textContent = group.title;
      const description = doc.createElement("p");
      description.textContent = group.description;
      details.append(summary, description);
      for (const field of group.fields) {
        const label = doc.createElement("label");
        label.className = "pit-wall-balance-field";
        label.dataset.balanceCoverage = field.simulated ? "simulated" : "not-simulated";
        const name = doc.createElement("span");
        name.textContent = field.label;
        const input = doc.createElement("input");
        input.id = `pit-wall-balance-${index}`;
        input.dataset.balanceField = String(index++);
        input.dataset.balancePath = field.path.join(".");
        input.dataset.balanceKey = JSON.stringify(field.path);
        input.type = field.type === "number" ? "number" : field.type === "boolean" ? "checkbox" : "text";
        if (field.type === "number") {
          input.step = String(field.step);
          if (field.min !== undefined) input.min = String(field.min);
          if (field.max !== undefined) input.max = String(field.max);
        }
        const value = valueAt(balance, field.path);
        if (field.type === "boolean") input.checked = value;
        else input.value = String(value);
        if (invalid.has(input.dataset.balanceKey)) {
          input.value = invalid.get(input.dataset.balanceKey);
          input.setAttribute("aria-invalid", "true");
        }
        const unit = doc.createElement("span");
        unit.textContent = field.unit;
        const coverage = doc.createElement("small");
        coverage.className = "pit-wall-balance-coverage";
        coverage.textContent = field.simulated ? "Simulated" : "Not Simulated";
        unit.append(coverage);
        label.htmlFor = input.id;
        label.append(name, input, unit);
        details.append(label);
      }
      fragment.append(details);
    }
    container.replaceChildren(fragment);
  }
  refreshFields();
  function close() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  }
  toggle.addEventListener("click", () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    toggle.setAttribute("aria-expanded", String(opening));
    if (opening) {
      refreshFields();
      panel.querySelector("[data-balance-context]").textContent = context();
      panel.querySelector('[data-action="close-balance"]').focus();
    }
  });
  panel.querySelector('[data-action="close-balance"]').addEventListener("click", close);
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
    }
  });
  panel.addEventListener("change", (event) => {
    const input = event.target;
    if (!input.matches("[data-balance-field]")) return;
    const field = fields[Number(input.dataset.balanceField)];
    const value = field.type === "number" ? input.valueAsNumber : field.type === "boolean" ? input.checked : input.value;
    if (!input.validity.valid || (field.type === "number" && !Number.isFinite(value))) {
      input.setAttribute("aria-invalid", "true");
      status.textContent = field.min !== undefined && field.max !== undefined
        ? `${field.label} must be between ${field.min} and ${field.max}.` : `${field.label} must be a finite number.`;
      return;
    }
    beforeChange();
    const parent = valueAt(balance, field.path.slice(0, -1));
    parent[field.path[field.path.length - 1]] = value;
    input.removeAttribute("aria-invalid");
    status.textContent = `${field.label} updated.`;
    onChange();
    panel.querySelector("[data-balance-context]").textContent = context();
  });
  panel.querySelector('[data-action="export-balance"]').addEventListener("click", () => {
    const invalid = panel.querySelector('[aria-invalid="true"]');
    if (invalid) {
      status.textContent = "Correct invalid values before exporting.";
      invalid.focus();
      return;
    }
    const url = win.URL.createObjectURL(new Blob([JSON.stringify(balance, null, 2) + "\n"], { type: "application/json" }));
    const link = doc.createElement("a");
    link.href = url;
    link.download = "pit-wall-balance.json";
    link.click();
    win.setTimeout(() => win.URL.revokeObjectURL(url), 1000);
    status.textContent = "Balance data exported.";
  });
}
