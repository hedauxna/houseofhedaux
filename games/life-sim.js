const YEAR_LENGTH = 365;
const MAX_VISIBLE_EVENTS = 30;
const DAILY_LIVING_COST = 2;

const DAILY_STAGES = [
  { id: "earlyMorning", label: "Early Morning", period: "Morning", type: "choice" },
  { id: "morningRoutine", label: "Morning Routine", period: "Morning", type: "routine" },
  { id: "morningActivity", label: "Morning Activity", period: "Morning", type: "activity" },
  { id: "afternoonRoutine", label: "Afternoon Routine", period: "Afternoon", type: "routine" },
  { id: "afternoonActivity", label: "Afternoon Activity", period: "Afternoon", type: "activity" },
  { id: "eveningRoutine", label: "Evening Routine", period: "Evening", type: "routine" },
  { id: "eveningActivity", label: "Evening Activity", period: "Evening", type: "activity" },
  { id: "night", label: "Night", period: "Night", type: "choice" },
];

const routineDefinitions = [
  {
    id: "make-breakfast",
    stage: "morningRoutine",
    name: "Make Breakfast",
    description: "Make a simple breakfast at home · £2.",
    effects: { health: 3, energy: 3, money: -2 },
    cost: 2,
    outcome: "You made a simple breakfast at home.",
  },
  {
    id: "buy-breakfast",
    stage: "morningRoutine",
    name: "Buy Breakfast",
    description: "Pick up breakfast on the way out · £5.",
    effects: { health: 2, happiness: 7, energy: 4, money: -5 },
    cost: 5,
    outcome: "You bought breakfast and enjoyed a brighter start.",
  },
  {
    id: "skip-breakfast",
    stage: "morningRoutine",
    name: "Skip Breakfast",
    description: "Save money, but start the day hungry.",
    effects: { health: -3, energy: -5 },
    outcome: "You skipped breakfast to save money.",
  },
  {
    id: "freshen-up",
    stage: "morningRoutine",
    name: "Freshen Up",
    description: "Wash and get ready for the day.",
    effects: { hygiene: 20 },
    outcome: "You freshened up before heading out.",
  },
  {
    id: "quick-shower",
    stage: "morningRoutine",
    name: "Quick Shower",
    description: "Take a quick shower and feel more confident.",
    effects: { hygiene: 50, confidence: 3, energy: -2 },
    outcome: "A quick shower left you feeling refreshed and confident.",
  },
  {
    id: "full-self-care",
    stage: "morningRoutine",
    name: "Full Self Care Day",
    description: "Take a little extra time to look after yourself.",
    effects: { hygiene: 20, stress: -5, happiness: 3, energy: 4 },
    outcome: "You made time for a full day of self-care.",
  },
  {
    id: "prepare-lunch",
    stage: "afternoonRoutine",
    name: "Prepare Lunch",
    description: "Make a filling lunch at home · £2.",
    effects: { health: 3, energy: 3, money: -2 },
    cost: 2,
    outcome: "You prepared an inexpensive lunch.",
  },
  {
    id: "buy-lunch",
    stage: "afternoonRoutine",
    name: "Buy Lunch",
    description: "Pick up something convenient · £6.",
    effects: { health: 2, happiness: 4, energy: 3, money: -6 },
    cost: 6,
    outcome: "You bought lunch while out.",
  },
  {
    id: "skip-lunch",
    stage: "afternoonRoutine",
    name: "Skip Lunch",
    description: "Keep your money and push through hungry.",
    effects: { health: -2, energy: -4 },
    outcome: "You skipped lunch and saved your money.",
  },
  {
    id: "cook-dinner",
    stage: "eveningRoutine",
    name: "Cook Dinner",
    description: "Cook a simple meal at home · £4.",
    effects: { health: 4, happiness: 3, money: -4 },
    cost: 4,
    outcome: "You cooked a satisfying dinner at home.",
  },
  {
    id: "order-takeaway",
    stage: "eveningRoutine",
    name: "Order Takeaway",
    description: "Have dinner delivered · £12.",
    effects: { happiness: 7, health: 1, money: -12 },
    cost: 12,
    outcome: "You ordered a takeaway and enjoyed an easy evening meal.",
  },
  {
    id: "eat-out",
    stage: "eveningRoutine",
    name: "Eat Out",
    description: "Go out for dinner · £24.",
    effects: { happiness: 12, confidence: 7, money: -24 },
    cost: 24,
    outcome: "You went out for dinner and enjoyed a special evening.",
  },
  {
    id: "skip-dinner",
    stage: "eveningRoutine",
    name: "Skip Dinner",
    description: "Save money, but go to bed hungry.",
    effects: { health: -3, energy: -5 },
    outcome: "You skipped dinner and saved your money.",
  },
];

const STAT_DEFINITIONS = [
  { id: "money", label: "Money", type: "money" },
  { id: "health", label: "Health", type: "meter" },
  { id: "energy", label: "Energy", type: "meter" },
  { id: "happiness", label: "Happiness", type: "meter" },
  { id: "stress", label: "Stress", type: "meter" },
  { id: "confidence", label: "Confidence", type: "meter" },
  { id: "intelligence", label: "Intelligence", type: "meter" },
  { id: "hygiene", label: "Hygiene", type: "meter" },
];

const STARTING_STATS = {
  health: 72,
  stress: 38,
  money: 40,
  confidence: 42,
  intelligence: 38,
  hygiene: 65,
  happiness: 58,
  energy: 70,
};

const starterJobs = [
  {
    id: "retail-assistant",
    name: "Retail Assistant",
    dailyIncome: 62,
    description: "A friendly shop-floor role with a steady pace.",
    shiftEffects: { energy: -10, stress: 3, confidence: 1 },
  },
  {
    id: "warehouse-worker",
    name: "Warehouse Worker",
    dailyIncome: 78,
    description: "An active job that rewards stamina and routine.",
    shiftEffects: { energy: -18, health: -2, stress: 5 },
  },
  {
    id: "office-junior",
    name: "Office Junior",
    dailyIncome: 58,
    description: "A chance to learn office skills and build experience.",
    shiftEffects: { energy: -8, stress: 4, intelligence: 1 },
  },
  {
    id: "delivery-driver",
    name: "Delivery Driver",
    dailyIncome: 70,
    description: "A varied day on the road with plenty of stops.",
    shiftEffects: { energy: -12, health: -1, stress: 3 },
  },
];

const activityDefinitions = [
  {
    id: "stay-home",
    name: "Stay Home",
    description: "Take a quiet day and recharge.",
    stage: "morningActivity",
    effects: { energy: 5, hygiene: -2, happiness: -1 },
    outcome: "You stayed home for a quiet start to the day.",
  },
  {
    id: "morning-study",
    name: "Study",
    description: "Spend focused time learning something new.",
    stage: "morningActivity",
    effects: { intelligence: 7, happiness: -4, energy: -8 },
    outcome: "You put in a focused study session.",
  },
  {
    id: "visit-gym",
    name: "Visit Gym",
    description: "Put in a workout and build confidence.",
    stage: "morningActivity",
    effects: { confidence: 7, health: 6, energy: -14, hygiene: -60 },
    outcome: "You completed a gym session and felt stronger for it.",
  },
  {
    id: "take-stroll",
    name: "Take Stroll",
    description: "Get outside for some fresh air.",
    stage: "morningActivity",
    effects: { happiness: 7, stress: -6, energy: -8 },
    outcome: "A change of scenery lifted your mood.",
  },
  {
    id: "look-for-work",
    name: "Look For Work",
    description: "Apply for an entry-level role.",
    stage: "morningActivity",
    effects: { energy: -5, stress: 2 },
    resolver: "job-application",
    outcome: "You prepared and submitted a job application.",
    requiresUnemployed: true,
  },
  {
    id: "morning-meet-people",
    name: "Meet People",
    description: "Make time for conversation and connection.",
    stage: "morningActivity",
    effects: { confidence: 2, happiness: 3, energy: -5 },
    outcome: "You made time to be around other people.",
  },
  {
    id: "continue-studying",
    name: "Continue Studying",
    description: "Build on your morning's learning.",
    stage: "afternoonActivity",
    effects: { intelligence: 5, happiness: -3, energy: -7 },
    outcome: "You continued studying and made steady progress.",
  },
  {
    id: "work-shift",
    name: "Work",
    description: "Put in a shift and earn your daily pay.",
    stage: "afternoonActivity",
    effects: { hygiene: -20 },
    resolver: "job-shift",
    requiresJob: true,
    outcome: "You completed a work shift.",
  },
  {
    id: "visit-town",
    name: "Visit Town",
    description: "Run errands and see what's happening in town.",
    stage: "afternoonActivity",
    effects: { happiness: 3, confidence: 2, energy: -6 },
    outcome: "You spent some time exploring town.",
  },
  {
    id: "afternoon-exercise",
    name: "Exercise",
    description: "Get moving and build your fitness.",
    stage: "afternoonActivity",
    effects: { health: 5, confidence: 3, energy: -12, hygiene: -40 },
    outcome: "You made time for exercise.",
  },
  {
    id: "socialise",
    name: "Socialise",
    description: "Catch up with someone and enjoy their company.",
    stage: "afternoonActivity",
    effects: { confidence: 2, happiness: 4, energy: -5 },
    outcome: "You spent time socialising.",
  },
  {
    id: "relax-at-home",
    name: "Relax At Home",
    description: "Take a quiet break and recharge.",
    stage: "afternoonActivity",
    effects: { energy: 8, stress: -4, hygiene: -2, happiness: 1 },
    outcome: "You relaxed at home and recharged.",
  },
  {
    id: "watch-tv",
    name: "Watch TV",
    description: "Put your feet up and watch a favourite show.",
    stage: "eveningActivity",
    effects: { happiness: 5, stress: -3, energy: 2 },
    outcome: "You watched television and unwound.",
  },
  {
    id: "read-book",
    name: "Read Book",
    description: "Enjoy a book and learn something along the way.",
    stage: "eveningActivity",
    effects: { intelligence: 4, stress: -3, energy: -2 },
    outcome: "You spent the evening reading.",
  },
  {
    id: "see-friends",
    name: "See Friends",
    description: "Spend the evening with friends.",
    stage: "eveningActivity",
    effects: { happiness: 6, confidence: 3, energy: -6 },
    outcome: "You enjoyed an evening with friends.",
  },
  {
    id: "visit-pub",
    name: "Visit Pub",
    description: "Go out for a drink and a change of scene · £10.",
    stage: "eveningActivity",
    effects: { happiness: 5, confidence: 2, stress: -2, money: -10, hygiene: -10 },
    cost: 10,
    outcome: "You visited the pub for a change of scene.",
  },
  {
    id: "work-overtime",
    name: "Work Overtime",
    description: "Stay on for extra hours and extra pay.",
    stage: "eveningActivity",
    effects: { hygiene: -20 },
    resolver: "overtime",
    requiresJob: true,
    requiresWorkToday: true,
    outcome: "You worked overtime.",
  },
  {
    id: "relaxing-bath",
    name: "Relaxing Bath",
    description: "Enjoy a warm bath and let the day melt away.",
    stage: "eveningActivity",
    effects: { health: 3, stress: -6, happiness: 4, hygiene: 90 },
    outcome: "A relaxing bath eased your stress and refreshed you.",
  },
  {
    id: "sleep-early",
    name: "Sleep Early",
    description: "Turn in early for a long, restorative sleep.",
    stage: "night",
    effects: { health: 5, energy: 38, stress: -7 },
    outcome: "You slept early and woke feeling well rested.",
  },
  {
    id: "go-to-bed",
    name: "Go To Bed",
    description: "End the day with a regular night's rest.",
    stage: "night",
    effects: { health: 4, energy: 27, stress: -5 },
    outcome: "You went to bed and got a good night's rest.",
  },
  {
    id: "stay-up-late",
    name: "Stay Up Late",
    description: "Enjoy a little more time before bed, at a cost tomorrow.",
    stage: "night",
    effects: { intelligence: 2, happiness: 2, stress: 3 },
    outcome: "You stayed up later than planned.",
    nextDayEnergy: -14,
  },
];

const activityIds = activityDefinitions.map((activity) => activity.id);

const earlyMorningChoices = [
  {
    id: "wake-up",
    name: "Wake Up",
    description: "Get up with the alarm and begin the day.",
    effects: { energy: -2, stress: 2 },
    outcome: "You woke with the alarm and got the day underway.",
  },
  {
    id: "stay-in-bed",
    name: "Stay In Bed",
    description: "Rest a little longer before starting the day.",
    effects: { energy: 7, stress: -4, happiness: 1 },
    outcome: "You stayed in bed a little longer and eased into the day.",
  },
];

const randomEventDefinitions = [
  {
    id: "find-money",
    activityIds: ["take-stroll"],
    chance: 0.12,
    message: "You spotted £10 on the pavement and added it to your wallet.",
    effects: { money: 10, happiness: 2 },
  },
  {
    id: "meet-walker",
    activityIds: ["take-stroll"],
    chance: 0.2,
    social: true,
    conditions: {
      all: [{ stat: "hygiene", min: 45 }, { stat: "stress", max: 70 }],
    },
    message: "You struck up a pleasant conversation on your walk.",
    effects: { confidence: 2, happiness: 3 },
    addTo: { relationships: ["Neighbour from a walk"] },
  },
  {
    id: "rain-ruins-walk",
    activityIds: ["take-stroll"],
    chance: 0.18,
    negative: true,
    message: "A sudden shower cut your walk short.",
    effects: { happiness: -3, energy: -2 },
  },
  {
    id: "gym-injury",
    activityIds: ["visit-gym", "afternoon-exercise"],
    chance: 0.035,
    negative: true,
    message: "You twisted an ankle during your workout and had to take it easy.",
    effects: { health: -12, energy: -5, stress: 4 },
  },
  {
    id: "free-gym-trial",
    activityIds: ["visit-gym"],
    chance: 0.08,
    message: "The gym offered you a free trial session for next time.",
    effects: { happiness: 3, confidence: 1 },
    addTo: { opportunities: ["Free gym trial"] },
  },
  {
    id: "boredom",
    activityIds: ["stay-home"],
    chance: 0.2,
    negative: true,
    message: "The quiet turned into boredom. You wished you had made plans.",
    effects: { happiness: -5, stress: 2 },
  },
  {
    id: "course-advertisement",
    activityIds: ["morning-study", "continue-studying", "read-book"],
    chance: 0.16,
    conditions: {
      all: [{ collection: "opportunities", excludes: "Local course" }],
    },
    message: "A local course advertisement caught your eye.",
    effects: { confidence: 1 },
    addTo: { opportunities: ["Local course"] },
  },
  {
    id: "qualification",
    activityIds: ["morning-study", "continue-studying", "read-book"],
    chance: 0.1,
    conditions: {
      all: [
        { stat: "intelligence", min: 50 },
        { collection: "qualifications", excludes: "Study Skills Certificate" },
      ],
    },
    message: "Your study paid off: you unlocked a Study Skills Certificate.",
    effects: { confidence: 3, happiness: 4 },
    addTo: { qualifications: ["Study Skills Certificate"] },
  },
  {
    id: "new-connection",
    activityIds: ["morning-meet-people", "socialise", "see-friends"],
    chance: 0.34,
    social: true,
    conditions: {
      all: [{ stat: "hygiene", min: 45 }, { stat: "stress", max: 70 }],
    },
    message: "The conversation flowed, and you made a new connection.",
    effects: { confidence: 4, happiness: 6, stress: -2 },
    addTo: { relationships: ["New friend"] },
  },
  {
    id: "awkward-meeting",
    activityIds: ["morning-meet-people", "socialise", "see-friends"],
    chance: 0.24,
    negative: true,
    social: true,
    conditions: {
      any: [{ stat: "hygiene", max: 35 }, { stat: "stress", min: 75 }],
    },
    message: "You felt a little out of sorts during the conversation.",
    effects: { stress: 4, happiness: -2 },
  },
  {
    id: "late-night-idea",
    activityIds: ["stay-up-late"],
    chance: 0.15,
    message: "A late-night idea gave you something interesting to explore tomorrow.",
    effects: { intelligence: 2, happiness: 2 },
    addTo: { opportunities: ["Personal project idea"] },
  },
  {
    id: "town-money",
    activityIds: ["visit-town"],
    chance: 0.14,
    message: "You found £10 while walking through town.",
    effects: { money: 10, happiness: 2 },
  },
  {
    id: "pub-conversation",
    activityIds: ["visit-pub"],
    chance: 0.2,
    social: true,
    conditions: {
      all: [{ stat: "hygiene", min: 45 }, { stat: "stress", max: 70 }],
    },
    message: "A friendly conversation at the pub lifted your spirits.",
    effects: { happiness: 3, confidence: 2 },
    addTo: { relationships: ["Pub acquaintance"] },
  },
  {
    id: "low-hygiene-social-encounter",
    activityIds: ["take-stroll", "morning-meet-people", "socialise", "see-friends", "visit-pub"],
    chance: 0.2,
    negative: true,
    social: true,
    conditions: { all: [{ stat: "hygiene", max: 9 }] },
    message: "An uncomfortable interaction left you feeling more isolated.",
    effects: { happiness: -4, stress: 5, confidence: -2 },
  },
  {
    id: "friend-text",
    activityIds,
    chance: 0.035,
    message: "A friend sent a thoughtful text that brightened your day.",
    effects: { happiness: 3, stress: -1 },
    addTo: { relationships: ["Friend who checks in"] },
  },
];

const stateEventDefinitions = [
  {
    id: "day-one-start",
    repeat: "once",
    conditions: { all: [{ day: 1 }, { period: "morning" }] },
    message: "Day 1 of 365 begins. A whole year is ahead of you.",
  },
  {
    id: "afternoon-arrives",
    repeat: "daily",
    conditions: { all: [{ period: "afternoon" }] },
    message: "Afternoon arrives. There is still time to shape the day.",
  },
  {
    id: "low-health",
    repeat: "once",
    conditions: { all: [{ stat: "health", max: 35 }] },
    message: "You are feeling run down. Taking care of yourself may help.",
  },
  {
    id: "high-stress",
    repeat: "once",
    conditions: { all: [{ stat: "stress", min: 75 }] },
    message: "The pressure is building. A quiet moment could help you reset.",
  },
  {
    id: "low-energy",
    repeat: "once",
    conditions: { all: [{ stat: "energy", max: 15 }] },
    message: "You are nearly out of energy. Rest may be a good idea.",
  },
  {
    id: "low-money",
    repeat: "once",
    conditions: { all: [{ stat: "money", max: 10 }] },
    message: "Your spending money is running low. Keep an eye on costs.",
  },
];

const dailyRiskEvents = [
  {
    id: "burnout-warning",
    chance: 0.12,
    conditions: { all: [{ stat: "stress", min: 81 }] },
    message: "The pressure is taking a serious toll. You feel close to burnout.",
    effects: { stress: 5, happiness: -3, energy: -4 },
  },
  {
    id: "panic-attack",
    chance: 0.08,
    conditions: { all: [{ stat: "stress", min: 81 }] },
    message: "A sudden panic attack left you shaken and exhausted.",
    effects: { stress: 8, health: -2, energy: -8 },
  },
  {
    id: "low-hygiene-illness",
    chance: 0.1,
    conditions: { all: [{ stat: "hygiene", max: 9 }] },
    message: "After neglecting your health, you became ill and needed to rest.",
    effects: { health: -8, energy: -6, stress: 3 },
  },
];

const eventIndex = new Map(activityIds.map((id) => [id, []]));
randomEventDefinitions.forEach((event) => {
  event.activityIds.forEach((id) => eventIndex.get(id)?.push(event));
});

function createInitialState() {
  return {
    day: 1,
    stage: "earlyMorning",
    stats: { ...STARTING_STATS },
    jobId: null,
    pendingJobOfferId: null,
    workedToday: false,
    overtimeWorkedToday: false,
    nextDayEnergy: 0,
    skippedMealsToday: 0,
    daysSurvived: 0,
    moneyEarned: 0,
    currentJobDays: 0,
    currentJobCountedDay: 0,
    longestJobDays: 0,
    longestJobName: "",
    gameOver: null,
    yearComplete: false,
    firedStateEvents: new Set(),
    eventLog: [],
    collections: {
      qualifications: [],
      relationships: [],
      opportunities: [],
    },
  };
}

function clampStat(id, value) {
  return id === "money" ? Math.max(-500, Math.round(value)) : Math.max(0, Math.min(100, Math.round(value)));
}

function formatMoney(value) {
  return value < 0 ? `-£${Math.abs(value)}` : `£${value}`;
}

function applyEffects(state, effects = {}) {
  Object.entries(effects).forEach(([stat, amount]) => {
    if (Object.hasOwn(state.stats, stat)) {
      let adjustedAmount = amount;
      if (amount > 0 && stat === "happiness") {
        const stress = state.stats.stress;
        const recoveryFactor = stress >= 81 ? 0.5 : stress >= 61 ? 0.7 : stress >= 31 ? 0.85 : 1;
        adjustedAmount = Math.max(1, Math.floor(amount * recoveryFactor));
      } else if (amount > 0 && stat === "confidence") {
        const stress = state.stats.stress;
        const stressFactor = stress >= 81 ? 0.5 : stress >= 61 ? 0.7 : stress >= 31 ? 0.85 : 1;
        adjustedAmount = Math.max(1, Math.floor(amount * stressFactor * (state.stats.hygiene < 50 ? 0.8 : 1)));
      } else if (amount > 0 && stat === "energy" && state.stage === "night" && state.stats.stress >= 61) {
        adjustedAmount = Math.max(1, Math.floor(amount * (state.stats.stress >= 81 ? 0.5 : 0.75)));
      }
      if (stat === "money" && adjustedAmount > 0) {
        state.moneyEarned += adjustedAmount;
      }
      state.stats[stat] = clampStat(stat, state.stats[stat] + adjustedAmount);
    }
  });
}

function applyCollections(state, additions = {}) {
  Object.entries(additions).forEach(([collection, values]) => {
    if (!Array.isArray(state.collections[collection])) {
      state.collections[collection] = [];
    }
    values.forEach((value) => {
      if (!state.collections[collection].includes(value)) {
        state.collections[collection].push(value);
      }
    });
  });
}

function conditionMatches(state, condition) {
  const stage = DAILY_STAGES.find((item) => item.id === state.stage);
  if (condition.period && stage?.period.toLowerCase() !== condition.period) {
    return false;
  }
  if (condition.day && state.day !== condition.day) {
    return false;
  }
  if (condition.stat) {
    const value = state.stats[condition.stat];
    if (value === undefined
      || (condition.min !== undefined && value < condition.min)
      || (condition.max !== undefined && value > condition.max)) {
      return false;
    }
  }
  if (condition.collection && state.collections[condition.collection]) {
    const values = state.collections[condition.collection];
    if (condition.includes && !values.includes(condition.includes)) {
      return false;
    }
    if (condition.excludes && values.includes(condition.excludes)) {
      return false;
    }
  }
  return true;
}

function conditionsMatch(state, conditions = {}) {
  const all = conditions.all || [];
  const any = conditions.any || [];
  return all.every((condition) => conditionMatches(state, condition))
    && (any.length === 0 || any.some((condition) => conditionMatches(state, condition)));
}

function getApplicationChance(stats) {
  const weightedScore = (stats.confidence * 0.25)
    + (stats.intelligence * 0.3)
    + (stats.hygiene * 0.2)
    + (stats.health * 0.15)
    - (stats.stress * 0.2);
  const stressPenalty = stats.stress >= 81 ? 15 : stats.stress >= 61 ? 8 : 0;
  const hygienePenalty = stats.hygiene < 30 ? 15 : stats.hygiene < 50 ? 5 : 0;
  return Math.max(0, Math.min(100, Math.round(weightedScore - stressPenalty - hygienePenalty)));
}

function formatEffects(effects = {}) {
  return Object.entries(effects)
    .filter(([, amount]) => amount !== 0)
    .map(([stat, amount]) => {
      const label = STAT_DEFINITIONS.find((definition) => definition.id === stat)?.label || stat;
      const value = stat === "money" ? `£${Math.abs(amount)}` : Math.abs(amount);
      return `${label} ${amount > 0 ? "+" : "−"}${value}`;
    })
    .join(" · ");
}

function makeInitialStateEvent(state, event) {
  const key = event.repeat === "daily" ? `${event.id}:${state.day}` : event.id;
  if (state.firedStateEvents.has(key) || !conditionsMatch(state, event.conditions)) {
    return;
  }
  state.firedStateEvents.add(key);
  appendEvent(state, event.message);
}

function appendEvent(state, message) {
  const periodLabel = DAILY_STAGES.find((period) => period.id === state.stage)?.label || "Year complete";
  state.eventLog.push({
    day: state.day,
    period: periodLabel,
    message,
  });
}

function processStateEvents(state) {
  stateEventDefinitions.forEach((event) => makeInitialStateEvent(state, event));
}

function getActivity(activityId) {
  return activityDefinitions.find((activity) => activity.id === activityId);
}

function getJob(jobId) {
  return starterJobs.find((job) => job.id === jobId);
}

function isActivityAvailable(state, activity) {
  return activity.stage === state.stage
    && (!activity.requiresJob || Boolean(state.jobId))
    && (!activity.requiresUnemployed || !state.jobId)
    && (!activity.requiresWorkToday || state.workedToday)
    && (!activity.id || activity.id !== "work-shift" || !state.workedToday)
    && (activity.id !== "work-overtime" || !state.overtimeWorkedToday);
}

function getStageActivities(state) {
  return activityDefinitions.filter((activity) => activity.stage === state.stage);
}

function getGameOver(state) {
  if (state.stats.health <= 0) {
    return { title: "LIFE ENDED", description: "Your health has failed." };
  }
  if (state.stats.energy <= 0) {
    return { title: "LIFE ENDED", description: "Exhaustion has finally caught up with you." };
  }
  if (state.stats.stress >= 100) {
    return {
      title: "BURNOUT",
      description: "Years of pressure finally catch up with you. Your body and mind can no longer keep pace.",
    };
  }
  if (state.stats.happiness <= 0) {
    return { title: "LIFE ENDED", description: "You have lost all motivation to continue." };
  }
  if (state.stats.money <= -500) {
    return { title: "LIFE ENDED", description: "Debt has overwhelmed your life." };
  }
  return null;
}

function applyGameOver(state) {
  const result = getGameOver(state);
  if (result && !state.gameOver) {
    state.gameOver = { ...result, day: state.day };
    appendEvent(state, result.title === "BURNOUT" ? "Burnout ended your life." : result.description);
  }
  return Boolean(state.gameOver);
}

function getTraits(state) {
  const traits = [];
  if (state.stats.intelligence >= 70) traits.push("Curious");
  if (state.stats.confidence >= 70) traits.push("Confident");
  if (state.stats.health >= 70 && state.stats.energy >= 60) traits.push("Resilient");
  if (state.stats.happiness >= 70) traits.push("Optimistic");
  if (state.stats.stress <= 30) traits.push("Calm");
  if (state.collections.relationships.length >= 3) traits.push("Well-connected");
  if (state.longestJobDays >= 30) traits.push("Dedicated");
  return traits.length ? traits : ["Still finding your footing"];
}

function getAchievements(state) {
  const achievements = [...state.collections.qualifications];
  if (state.collections.relationships.length > 0) {
    achievements.push(`Formed ${state.collections.relationships.length} connection${state.collections.relationships.length === 1 ? "" : "s"}`);
  }
  if (state.longestJobDays > 0) {
    achievements.push(`Held ${state.longestJobName} for ${state.longestJobDays} day${state.longestJobDays === 1 ? "" : "s"}`);
  }
  if (state.daysSurvived >= 30) achievements.push("Made it through a month");
  if (state.daysSurvived >= YEAR_LENGTH) achievements.push("Completed a full year");
  return achievements.length ? achievements : ["No major achievements recorded"];
}

function finishDay(state, random) {
  applyEffects(state, { hygiene: -10 });
  appendEvent(state, "Daily hygiene declined by 10.");

  let healthLoss = (state.stats.stress >= 81 ? 3 : state.stats.stress >= 61 ? 1 : 0)
    + (state.stats.hygiene < 10 ? 2 : state.stats.hygiene < 20 ? 1 : 0)
    + (state.stats.energy < 20 ? 2 : 0)
    + (state.skippedMealsToday * 2);
  if (healthLoss > 0) {
    applyEffects(state, { health: -healthLoss });
    appendEvent(state, `Daily health deterioration: −${healthLoss} from stress, hygiene, energy, or skipped meals.`);
  }
  if (state.stats.hygiene < 20) {
    applyEffects(state, { confidence: -1 });
    appendEvent(state, "Poor hygiene affected your confidence.");
  }

  dailyRiskEvents.forEach((event) => {
    if (conditionsMatch(state, event.conditions) && random() < event.chance) {
      applyEffects(state, event.effects);
      appendEvent(state, event.message);
    }
  });
  if (applyGameOver(state)) return;

  if (state.jobId && state.currentJobCountedDay !== state.day) {
    state.currentJobDays += 1;
    state.currentJobCountedDay = state.day;
    if (state.currentJobDays > state.longestJobDays) {
      state.longestJobDays = state.currentJobDays;
      state.longestJobName = getJob(state.jobId)?.name || "";
    }
  }
  state.daysSurvived += 1;

  if (state.day === YEAR_LENGTH) {
    state.yearComplete = true;
    appendEvent(state, "You completed all 365 days. The year is yours to look back on.");
    return;
  }

  state.day += 1;
  state.stage = "earlyMorning";
  state.workedToday = false;
  state.overtimeWorkedToday = false;
  state.skippedMealsToday = 0;
  applyEffects(state, { money: -DAILY_LIVING_COST });
  appendEvent(state, `Daily living costs: −£${DAILY_LIVING_COST}.`);
  if (state.nextDayEnergy !== 0) {
    applyEffects(state, { energy: state.nextDayEnergy });
    appendEvent(state, `You felt the effects of last night's sleep. Energy ${state.nextDayEnergy > 0 ? "+" : "−"}${Math.abs(state.nextDayEnergy)}.`);
    state.nextDayEnergy = 0;
  }
  applyGameOver(state);
}

function advanceStage(state, random) {
  if (state.stage === "night") {
    finishDay(state, random);
    return;
  }
  const stageIndex = DAILY_STAGES.findIndex((stage) => stage.id === state.stage);
  state.stage = DAILY_STAGES[stageIndex + 1].id;
}

function resolveJobApplication(state, random) {
  const chance = getApplicationChance(state.stats);
  if (random() * 100 < chance) {
    const job = starterJobs[Math.floor(random() * starterJobs.length)];
    state.pendingJobOfferId = job.id;
    appendEvent(state, `Your application had a ${chance}% success chance. ${job.name} offered you a starter role.`);
  } else {
    appendEvent(state, `Your application had a ${chance}% success chance, but you did not receive an offer this time.`);
  }
}

function resolveWorkShift(state) {
  const job = getJob(state.jobId);
  if (!job) {
    return;
  }
  applyEffects(state, job.shiftEffects);
  applyEffects(state, { money: job.dailyIncome });
  state.workedToday = true;
  appendEvent(state, `${job.name} shift complete. You earned £${job.dailyIncome} for the day.`);
}

function resolveOvertime(state) {
  const job = getJob(state.jobId);
  if (!job) {
    return;
  }
  const overtimePay = Math.round(job.dailyIncome * 0.5);
  applyEffects(state, { energy: -12, stress: 5 });
  applyEffects(state, { money: overtimePay });
  state.overtimeWorkedToday = true;
  appendEvent(state, `You earned an extra £${overtimePay} for working overtime.`);
}

const activityResolvers = {
  "job-application": resolveJobApplication,
  "job-shift": resolveWorkShift,
  overtime: resolveOvertime,
};

function resolveRandomEncounter(state, activity, random) {
  const candidates = eventIndex.get(activity.id) || [];
  for (const event of candidates) {
    let chance = event.chance;
    if (event.social && state.stats.hygiene < 30) {
      chance *= 0.6;
    }
    if (event.social && state.stats.stress >= 81) {
      chance *= 0.5;
    }
    if (event.negative && state.stats.stress >= 81) {
      chance *= 1.5;
    }
    if (event.negative && event.social && state.stats.hygiene < 10) {
      chance *= 1.5;
    }
    if (conditionsMatch(state, event.conditions) && random() < Math.min(chance, 1)) {
      applyEffects(state, event.effects);
      applyCollections(state, event.addTo);
      appendEvent(state, event.message);
      return;
    }
  }
}

function makeButton(title, description, action, kind = "action", disabled = false) {
  const button = document.createElement("button");
  button.className = "life-sim-action-button";
  button.type = "button";
  button.dataset.lifeSimAction = action;
  button.dataset.lifeSimKind = kind;
  button.disabled = disabled;

  const name = document.createElement("span");
  name.className = "life-sim-action-title";
  name.textContent = title;
  const detail = document.createElement("span");
  detail.className = "life-sim-action-description";
  detail.textContent = description;
  button.append(name, detail);
  return button;
}

function makeStat(definition, value) {
  const item = document.createElement("div");
  item.className = "life-sim-stat";
  const name = document.createElement("dt");
  name.textContent = definition.label;
  const amount = document.createElement("dd");
  amount.textContent = definition.type === "money" ? formatMoney(value) : `${value}/100`;
  item.append(name, amount);

  if (definition.type === "meter") {
    const meter = document.createElement("meter");
    meter.min = 0;
    meter.max = 100;
    meter.value = value;
    meter.setAttribute("aria-label", `${definition.label}: ${value} out of 100`);
    item.append(meter);
  }
  return item;
}

export function mountLifeSim(root, { random = () => Math.random() } = {}) {
  const placeholder = root.querySelector("[data-life-sim-placeholder]");
  const app = root.querySelector("[data-life-sim-app]");
  if (!placeholder || !app) {
    throw new Error("Life Sim markup is incomplete.");
  }

  const gameplay = app.querySelector("[data-gameplay]");
  const gameOverPanel = app.querySelector("[data-game-over]");
  const gameOverTitle = app.querySelector("[data-game-over-title]");
  const gameOverDescription = app.querySelector("[data-game-over-description]");
  const gameOverSummary = app.querySelector("[data-game-over-summary]");
  const dayLabel = app.querySelector("[data-game-day]");
  const periodLabel = app.querySelector("[data-game-period]");
  const yearProgress = app.querySelector("[data-game-year-progress]");
  const yearLabel = app.querySelector("[data-game-year-label]");
  const sceneTitle = app.querySelector("[data-scene-title]");
  const sceneCopy = app.querySelector("[data-scene-copy]");
  const choicesHeading = app.querySelector("[data-choices-heading]");
  const choicesHint = app.querySelector("[data-choices-hint]");
  const actionContainer = app.querySelector("[data-game-actions]");
  const offerPanel = app.querySelector("[data-game-job-offer]");
  const offerCopy = app.querySelector("[data-game-job-offer-copy]");
  const offerActions = app.querySelector("[data-game-offer-actions]");
  const statsContainer = app.querySelector("[data-game-stats]");
  const jobStatus = app.querySelector("[data-game-employment]");
  const collectionsContainer = app.querySelector("[data-game-collections]");
  const eventContainer = app.querySelector("[data-game-events]");
  let gameState = createInitialState();

  function renderChoices() {
    actionContainer.replaceChildren();
    offerActions.replaceChildren();
    offerPanel.hidden = gameState.pendingJobOfferId === null;

    if (gameState.pendingJobOfferId !== null) {
      const job = getJob(gameState.pendingJobOfferId);
      offerCopy.textContent = `${job.name} · £${job.dailyIncome} per shift. ${job.description}`;
      offerActions.append(
        makeButton("Accept offer", "Accept this job offer.", "accept-job", "offer"),
        makeButton("Decline", "Keep looking for another opportunity.", "decline-job", "offer"),
      );
      choicesHeading.textContent = "Job offer";
      choicesHint.textContent = "Decide whether to accept before choosing your next activity.";
      return;
    }

    offerCopy.textContent = "";
    if (gameState.yearComplete) {
      choicesHeading.textContent = "Year complete";
      choicesHint.textContent = "You can start over to explore a different path.";
      actionContainer.append(makeButton("Start a new year", "Reset all progress and begin again.", "restart-year"));
      return;
    }

    const stage = DAILY_STAGES.find((item) => item.id === gameState.stage);
    choicesHeading.textContent = stage.label;
    choicesHint.textContent = stage.type === "routine"
      ? "Choose one part of your routine before moving on."
      : stage.type === "choice"
        ? "Choose one option to move on with your day."
        : "Choose one activity for this part of the day.";

    let choices = [];
    if (gameState.stage === "earlyMorning") {
      choices = earlyMorningChoices;
    } else if (stage.type === "routine") {
      choices = routineDefinitions.filter((routine) => routine.stage === gameState.stage);
    } else {
      choices = getStageActivities(gameState);
    }

    choices.forEach((choice) => {
      let description = choice.description;
      const unavailable = stage.type === "activity" && !isActivityAvailable(gameState, choice);
      if (choice.effects) {
        const effects = formatEffects(choice.effects);
        if (effects) {
          description = `${description} ${effects}.`;
        }
      }
      if (choice.id === "look-for-work" && gameState.jobId) {
        description = "You already have a job.";
      } else if (choice.id === "work-shift" || choice.id === "work-overtime") {
        const job = getJob(gameState.jobId);
        if (!job) {
          description = "Apply for a starter role with Look for Work before taking a shift.";
        } else if (choice.id === "work-overtime" && !gameState.workedToday) {
          description = "Work a regular shift this afternoon to unlock overtime.";
        } else {
          description = choice.id === "work-shift"
            ? `${job.description} Earn £${job.dailyIncome}; ${formatEffects({ ...job.shiftEffects, ...choice.effects })}.`
            : `${job.description} Earn an extra £${Math.round(job.dailyIncome * 0.5)}; ${formatEffects({ ...choice.effects, energy: -12, stress: 5 })}.`;
        }
      }
      actionContainer.append(
        makeButton(
          choice.name,
          description,
          choice.id,
          stage.type,
          unavailable || choice.cost > gameState.stats.money,
        ),
      );
    });
  }

  function render() {
    const stage = DAILY_STAGES.find((item) => item.id === gameState.stage);
    dayLabel.textContent = gameState.yearComplete
      ? `Day ${YEAR_LENGTH} of ${YEAR_LENGTH}`
      : `Day ${gameState.day} of ${YEAR_LENGTH}`;
    periodLabel.textContent = gameState.yearComplete ? "Year complete" : stage.label;
    yearProgress.max = YEAR_LENGTH;
    yearProgress.value = gameState.yearComplete ? YEAR_LENGTH : gameState.day;
    yearLabel.textContent = `${gameState.yearComplete ? YEAR_LENGTH : gameState.day} / ${YEAR_LENGTH} days`;

    if (gameplay) gameplay.hidden = Boolean(gameState.gameOver);
    if (gameOverPanel) gameOverPanel.hidden = !gameState.gameOver;
    if (gameState.gameOver) {
      gameOverTitle.textContent = gameState.gameOver.title;
      gameOverDescription.textContent = gameState.gameOver.description;
      const summary = [
        ["Days survived", gameState.daysSurvived],
        ["Current day", gameState.gameOver.day],
        ["Money earned", formatMoney(gameState.moneyEarned)],
        ["Longest job held", gameState.longestJobDays
          ? `${gameState.longestJobName} · ${gameState.longestJobDays} days`
          : "No job held"],
        ["Relationships formed", gameState.collections.relationships.length],
        ["Traits", getTraits(gameState).join(", ")],
        ["Major achievements", getAchievements(gameState).join(", ")],
        ["Cause of failure", gameState.gameOver.description],
      ];
      gameOverSummary.replaceChildren(...summary.map(([label, value]) => {
        const item = document.createElement("div");
        const name = document.createElement("dt");
        name.textContent = label;
        const detail = document.createElement("dd");
        detail.textContent = value;
        item.append(name, detail);
        return item;
      }));
    } else if (gameState.yearComplete) {
      sceneTitle.textContent = "A year of your life";
      sceneCopy.textContent = `You reached the end of the year with ${formatMoney(gameState.stats.money)}, ${gameState.collections.relationships.length} connections, and ${gameState.collections.qualifications.length} qualification${gameState.collections.qualifications.length === 1 ? "" : "s"}. Your choices shaped the journey.`;
    } else if (gameState.stage === "earlyMorning" && gameState.day === 1) {
      sceneTitle.textContent = "Day 1 · A new morning";
      sceneCopy.textContent = "The alarm sounds as the first light comes through the curtains. Decide whether to get up or rest a little longer.";
    } else {
      sceneTitle.textContent = `${stage.label} · Day ${gameState.day}`;
      sceneCopy.textContent = stage.type === "routine"
        ? "Take care of a small everyday choice before moving on with the day."
        : "Your choices shape your routine, relationships, and the opportunities that follow.";
    }

    renderChoices();
    statsContainer.replaceChildren(
      ...STAT_DEFINITIONS.map((definition) => makeStat(definition, gameState.stats[definition.id])),
    );

    const job = getJob(gameState.jobId);
    jobStatus.textContent = job
      ? `${job.name} · £${job.dailyIncome} per shift`
      : "No job yet";

    const collectionEntries = [
      ["Qualifications", gameState.collections.qualifications],
      ["Connections", gameState.collections.relationships],
      ["Opportunities", gameState.collections.opportunities],
    ];
    collectionsContainer.replaceChildren();
    collectionEntries.forEach(([label, values]) => {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      name.textContent = `${label}: `;
      const value = document.createElement("span");
      value.textContent = values.length ? values.join(", ") : "None yet";
      item.append(name, value);
      collectionsContainer.append(item);
    });

    const recentEvents = gameState.eventLog.slice(-MAX_VISIBLE_EVENTS).reverse();
    if (recentEvents.length === 0) {
      const empty = document.createElement("li");
      empty.className = "life-sim-event-empty";
      empty.textContent = "No notable events yet.";
      eventContainer.replaceChildren(empty);
    } else {
      eventContainer.replaceChildren(...recentEvents.map((event) => {
        const item = document.createElement("li");
        const time = document.createElement("span");
        time.className = "life-sim-event-time";
        time.textContent = `Day ${event.day} · ${event.period}`;
        const text = document.createElement("span");
        text.textContent = event.message;
        item.append(time, text);
        return item;
      }));
    }
  }

  function performChoice(action) {
    let choice;
    if (gameState.stage === "earlyMorning") {
      choice = earlyMorningChoices.find((item) => item.id === action);
    } else if (DAILY_STAGES.find((item) => item.id === gameState.stage)?.type === "routine") {
      choice = routineDefinitions.find((item) => item.id === action && item.stage === gameState.stage);
    } else {
      choice = getActivity(action);
      if (!choice || !isActivityAvailable(gameState, choice)) {
        return false;
      }
    }

    if (!choice || (choice.cost !== undefined && choice.cost > gameState.stats.money)) {
      return false;
    }

    applyEffects(gameState, choice.effects);
    if (["skip-breakfast", "skip-lunch", "skip-dinner"].includes(choice.id)) {
      gameState.skippedMealsToday += 1;
    }
    if (choice.resolver) {
      activityResolvers[choice.resolver]?.(gameState, random);
    }
    const effectSummary = formatEffects(choice.effects);
    appendEvent(gameState, effectSummary ? `${choice.outcome} ${effectSummary}.` : choice.outcome);

    if (activityDefinitions.includes(choice)) {
      resolveRandomEncounter(gameState, choice, random);
      if (choice.id === "work-shift") {
        gameState.workedToday = true;
      }
      if (choice.nextDayEnergy !== undefined) {
        gameState.nextDayEnergy = choice.nextDayEnergy;
      }
    }

    if (applyGameOver(gameState)) {
      return true;
    }
    advanceStage(gameState, random);
    processStateEvents(gameState);
    return true;
  }

  function resolveJobOffer(action) {
    if (action === "accept-job" && gameState.pendingJobOfferId) {
      const job = getJob(gameState.pendingJobOfferId);
      gameState.jobId = job.id;
      gameState.currentJobDays = 0;
      gameState.currentJobCountedDay = gameState.day - 1;
      gameState.pendingJobOfferId = null;
      appendEvent(gameState, `You accepted the ${job.name} offer.`);
      return true;
    }
    if (action === "decline-job" && gameState.pendingJobOfferId) {
      const job = getJob(gameState.pendingJobOfferId);
      gameState.pendingJobOfferId = null;
      appendEvent(gameState, `You declined the ${job.name} offer.`);
      return true;
    }
    return false;
  }

  app.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    const button = event.target.closest("[data-life-sim-action]");
    if (!button || !app.contains(button) || button.disabled) {
      return;
    }

    const { lifeSimAction: action, lifeSimKind: kind } = button.dataset;
    if (kind === "offer") {
      if (resolveJobOffer(action)) {
        processStateEvents(gameState);
        render();
      }
      return;
    }
    if (action === "restart-year") {
      gameState = createInitialState();
      processStateEvents(gameState);
      render();
      return;
    }
    if (gameState.gameOver || gameState.pendingJobOfferId || !performChoice(action)) {
      return;
    }
    render();
  });

  placeholder.hidden = true;
  app.hidden = false;
  processStateEvents(gameState);
  render();
}
