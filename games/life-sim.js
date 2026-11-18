const YEAR_LENGTH = 365;
const MAX_VISIBLE_EVENTS = 30;
const DIFFICULTY_INTERVAL = 30;
const RARE_EVENT_DISPLAY_DAYS = 5;
const PROMOTION_REVIEW_DAYS = 7;
const OVERDRAFT_LIMIT = 500;
const START_DATE = Date.UTC(2027, 0, 4);
const DAY_MS = 86400000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_SCHEDULE = [1, 2, 3, 4, 5];
const JOB_SCHEDULES = {
  "retail-assistant": [1, 2, 3, 5, 6],
  "cafe-assistant": [0, 2, 3, 5, 6],
  "care-assistant": [1, 2, 4, 5, 6],
  nurse: [1, 2, 4, 5, 6],
  "emergency-responder": [0, 1, 3, 4, 6],
  "night-security": [0, 1, 2, 4, 5],
};
const ABSENCE_REASONS = [
  { id: "doctor", label: "Doctor Appointment", supporting: ["visit-doctor"], evidence: "Medical Note" },
  { id: "dentist", label: "Dentist Appointment", supporting: ["dentist"], evidence: "Appointment Confirmation" },
  { id: "illness", label: "Illness", supporting: ["stay-home", "relax-at-home", "watch-tv", "read-book", "sleep-early", "go-to-bed", "sleep-after-night-shift", "visit-doctor"] },
  { id: "mental-health", label: "Mental Health Day", supporting: ["stay-home", "relax-at-home", "take-stroll", "visit-doctor", "morning-hobby", "watch-tv", "read-book", "sleep-early", "go-to-bed"] },
  { id: "family", label: "Family Emergency" },
  { id: "personal", label: "Personal Day" },
  { id: "other", label: "Other Reason" },
];
const QUESTIONABLE_ABSENCE_ACTIONS = ["visit-town", "socialise", "morning-meet-people", "see-friends", "visit-pub", "eat-out", "visit-gym", "daytime-exercise"];
let notificationSequence = 0;

function getDate(day) {
  return new Date(START_DATE + (day - 1) * DAY_MS);
}

function formatDate(day) {
  return getDate(day).toLocaleDateString("en-GB", {
    timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).replace(",", "");
}

function getSchedule(job) {
  return job.workingDays;
}

function isWorkingDay(day, job) {
  return Boolean(job) && getSchedule(job).includes(getDate(day).getUTCDay());
}

function formatSchedule(job) {
  return getSchedule(job).map((day) => WEEKDAYS[day].slice(0, 3)).join(", ");
}

const PERIOD_PRESENTATION = {
  Morning: { icon: "☀️", accent: "#f1b66f" },
  Daytime: { icon: "🌤", accent: "#80c9f3" },
  Evening: { icon: "🌅", accent: "#c5a6ed" },
  Night: { icon: "🌙", accent: "#a9bfd5" },
};

const DAILY_STAGES = [
  { id: "earlyMorning", label: "Early Morning", period: "Morning", type: "choice" },
  { id: "morningRoutine", label: "Morning Routine", period: "Morning", type: "routine" },
  { id: "morningActivity", label: "Morning Activity", period: "Morning", type: "activity" },
  { id: "daytimeRoutine", label: "Daytime Routine", period: "Daytime", type: "routine" },
  { id: "daytimeActivity", label: "Daytime Activity", period: "Daytime", type: "activity" },
  { id: "eveningRoutine", label: "Evening Routine", period: "Evening", type: "routine" },
  { id: "eveningActivity", label: "Evening Activity", period: "Evening", type: "activity" },
  { id: "night", label: "Night", period: "Night", type: "choice" },
];

const ACHIEVEMENT_DEFINITIONS = [
  {
    id: "first-job",
    icon: "🏆",
    title: "First Job",
    description: "Accept your first job.",
    isUnlocked: (state) => Boolean(state.jobId),
    progress: () => "Find and accept a role",
  },
  {
    id: "first-friend",
    icon: "🏆",
    title: "First Friend",
    description: "Form your first relationship.",
    isUnlocked: (state) => state.collections.relationships.length > 0,
    progress: () => "Make a meaningful connection",
  },
  {
    id: "first-qualification",
    icon: "🏆",
    title: "First Qualification",
    description: "Earn a qualification.",
    isUnlocked: (state) => state.collections.qualifications.length > 0,
    progress: () => "Complete a qualification",
  },
  {
    id: "saved-1000",
    icon: "🏆",
    title: "£1,000 Saved",
    description: "Build your savings to £1,000.",
    isUnlocked: (state) => state.stats.money >= 1000,
    progress: (state) => `${formatMoney(Math.max(0, state.stats.money))} / £1,000`,
  },
  {
    id: "healthy-month",
    icon: "🏆",
    title: "30 Consecutive Healthy Days",
    description: "Maintain good health, energy, hunger, and stress for 30 days.",
    isUnlocked: (state) => state.consecutiveHealthyDays >= 30,
    progress: (state) => `${Math.min(state.consecutiveHealthyDays, 30)} / 30 days`,
  },
  {
    id: "stress-free-month",
    icon: "🏆",
    title: "Stress-Free Month",
    description: "Keep Stress at 20 or below for 30 consecutive days.",
    isUnlocked: (state) => state.stressFreeDays >= 30,
    progress: (state) => `${Math.min(state.stressFreeDays, 30)} / 30 days`,
  },
];

const HUNGER_PERIOD_COSTS = {
  Morning: 10,
  Daytime: 15,
  Evening: 15,
  Night: 10,
};

const PHASE_MEALS = { morningRoutine: "breakfast", daytimeRoutine: "lunch", eveningRoutine: "dinner" };
const HEALTH_STRAIN_FACTORS = [
  { stat: "fitness", max: 59 },
  { stat: "hunger", max: 59 },
  { stat: "stress", min: 41 },
  { stat: "hygiene", max: 59 },
  { stat: "happiness", max: 59 },
  { stat: "homeCleanliness", max: 59 },
];
const HEALTH_STRAIN_UNITS_PER_POINT = 4;

const routineDefinitions = [
  {
    id: "make-breakfast",
    stage: "morningRoutine",
    name: "Make Breakfast",
    description: "Make a simple breakfast at home.",
    effects: { health: 3, energy: 5, money: -2, stress: 1, confidence: 1, hygiene: -2, homeCleanliness: -3, happiness: 2, fitness: 1 },
    hungerChange: 30,
    meal: "breakfast",
    cost: 2,
    outcome: "You made a simple breakfast at home.",
  },
  {
    id: "buy-breakfast",
    stage: "morningRoutine",
    name: "Buy Breakfast",
    description: "Pick up breakfast on the way out.",
    effects: { health: 2, happiness: 8, energy: 8, money: -5, fitness: 2 },
    hungerChange: 25,
    meal: "breakfast",
    cost: 5,
    outcome: "You bought breakfast and enjoyed a brighter start.",
  },
  {
    id: "skip-breakfast",
    stage: "morningRoutine",
    name: "Skip Breakfast",
    description: "Save money, but start the day hungry. A rare opportunity may turn up.",
    effects: { health: -5, energy: -10, happiness: -10, stress: 5, confidence: -3 },
    hungerChange: -20,
    outcome: "You skipped breakfast to save money.",
  },
  {
    id: "freshen-up",
    stages: ["morningRoutine", "eveningRoutine"],
    name: "Freshen Up",
    description: "Wash and get ready for the day.",
    effects: { hygiene: 40, energy: -3, happiness: 2, stress: -1, confidence: 1, homeCleanliness: -1 },
    outcome: "You freshened up before heading out.",
  },
  {
    id: "quick-shower",
    stages: ["morningRoutine", "eveningRoutine"],
    name: "Quick Shower",
    description: "Take a quick shower and feel more confident.",
    effects: { hygiene: 70, confidence: 3, energy: -5, health: 1, happiness: 4, stress: -5, homeCleanliness: -5, fitness: 1 },
    outcome: "A quick shower left you feeling refreshed and confident.",
  },
  {
    id: "full-self-care",
    stage: "morningRoutine",
    name: "Full Self Care Day",
    description: "Spend the morning and daytime recovering. Skip breakfast and both activity slots, including work; lunch is still available.",
    effects: { hygiene: 40, health: 4, stress: -10, happiness: 10, energy: 10, confidence: 2, homeCleanliness: -2, fitness: 4 },
    selfCareDay: true,
    outcome: "You dedicated the morning and daytime to self-care.",
  },
  {
    id: "morning-stretch",
    stage: "morningRoutine",
    name: "Gentle Stretch",
    description: "Ease into the day with light movement.",
    effects: { fitness: 4, health: 1, energy: -4, hunger: -2, happiness: 4, hygiene: -5 },
    outcome: "You eased into the day with a gentle stretch.",
  },
  {
    id: "morning-mindfulness",
    stage: "morningRoutine",
    name: "Mindful Moment",
    description: "Pause and set an intention for the day.",
    effects: { stress: -4, happiness: 10, hunger: -2, hygiene: -2, fitness: 2 },
    outcome: "A mindful moment helped you feel more settled.",
  },
  {
    id: "morning-plan",
    stage: "morningRoutine",
    name: "Plan Your Day",
    description: "Prepare for your next challenge.",
    effects: { confidence: 2, intelligence: 2, energy: -2, hunger: -1, happiness: 2, stress: -2 },
    outcome: "You took a moment to plan your day.",
  },
  {
    id: "prepare-lunch",
    stage: "daytimeRoutine",
    name: "Prepare Lunch",
    description: "Make a filling lunch at home.",
    effects: { health: 3, energy: 5, money: -2, stress: 1, confidence: 1, hygiene: -2, homeCleanliness: -3, happiness: 2, fitness: 1 },
    hungerChange: 35,
    meal: "lunch",
    cost: 2,
    outcome: "You prepared an inexpensive lunch.",
  },
  {
    id: "buy-lunch",
    stage: "daytimeRoutine",
    name: "Buy Lunch",
    description: "Pick up something convenient.",
    effects: { health: 2, happiness: 8, energy: 8, money: -8, fitness: 2 },
    hungerChange: 30,
    meal: "lunch",
    cost: 8,
    outcome: "You bought lunch while out.",
  },
  {
    id: "skip-lunch",
    stage: "daytimeRoutine",
    name: "Skip Lunch",
    description: "Keep your money and push through hungry. A rare opportunity may turn up.",
    effects: { health: -5, energy: -10, happiness: -10, stress: 5, confidence: -3 },
    hungerChange: -25,
    outcome: "You skipped lunch and saved your money.",
  },
  {
    id: "cook-dinner",
    stage: "eveningRoutine",
    name: "Cook Dinner",
    description: "Cook a simple meal at home.",
    effects: { health: 4, happiness: 6, money: -4, energy: 10, fitness: 1, hygiene: -2, homeCleanliness: -3 },
    hungerChange: 40,
    meal: "dinner",
    cost: 4,
    outcome: "You cooked a satisfying dinner at home.",
  },
  {
    id: "order-takeaway",
    stage: "eveningRoutine",
    name: "Order Takeaway",
    description: "Have dinner delivered.",
    effects: { happiness: 10, health: 1, money: -12, energy: 12, fitness: 1 },
    hungerChange: 35,
    meal: "dinner",
    cost: 12,
    outcome: "You ordered a takeaway and enjoyed an easy evening meal.",
  },
  {
    id: "skip-dinner",
    stage: "eveningRoutine",
    name: "Skip Dinner",
    description: "Save money, but go to bed hungry. A rare opportunity may turn up.",
    effects: { health: -10, energy: -15, happiness: -10, stress: 5, confidence: -3 },
    hungerChange: -30,
    outcome: "You skipped dinner and saved your money.",
  },
];

const STAT_DEFINITIONS = [
  { id: "money", label: "Current Account", type: "money" },
  { id: "health", label: "Health", type: "meter" },
  { id: "energy", label: "Energy", type: "meter" },
  { id: "fitness", label: "Fitness", type: "meter" },
  { id: "hunger", label: "Hunger", type: "meter" },
  { id: "happiness", label: "Happiness", type: "meter" },
  { id: "stress", label: "Stress", type: "meter" },
  { id: "confidence", label: "Confidence", type: "meter" },
  { id: "intelligence", label: "Intelligence", type: "meter" },
  { id: "hygiene", label: "Hygiene", type: "meter" },
  { id: "homeCleanliness", label: "Home Cleanliness", type: "meter" },
];

const STARTING_STATS = {
  health: 95,
  fitness: 75,
  stress: 50,
  money: 500,
  confidence: 0,
  intelligence: 10,
  hygiene: 80,
  happiness: 75,
  energy: 100,
  hunger: 50,
  homeCleanliness: 100,
};

const jobs = [
  {
    id: "retail-assistant",
    name: "Retail Assistant",
    dailyIncome: 62,
    energyCost: 15,
    stressCost: 2,
    description: "A friendly shop-floor role with a steady pace.",
    shiftEffects: { confidence: 1, fitness: 1, happiness: -1 },
    skill: "service", performanceStats: ["confidence", "happiness"],
  },
  {
    id: "warehouse-worker",
    name: "Warehouse Worker",
    dailyIncome: 78,
    energyCost: 15,
    stressCost: 3,
    description: "An active job that rewards stamina and routine.",
    shiftEffects: { health: -2, fitness: 3 },
    skill: "practical", performanceStats: ["fitness", "health"],
  },
  {
    id: "office-junior",
    name: "Office Junior",
    dailyIncome: 58,
    energyCost: 10,
    stressCost: 1,
    description: "A chance to learn office skills and build experience.",
    shiftEffects: { intelligence: 1 },
    skill: "administration", performanceStats: ["intelligence", "confidence"],
    promotionTitles: ["Office Coordinator", "Senior Office Coordinator"],
  },
  {
    id: "delivery-driver",
    name: "Delivery Driver",
    dailyIncome: 70,
    energyCost: 15,
    stressCost: 3,
    description: "A varied day on the road with plenty of stops.",
    shiftEffects: { health: -1, fitness: 2 },
    skill: "logistics", performanceStats: ["fitness", "confidence"],
  },
  { id: "cafe-assistant", name: "Café Assistant", dailyIncome: 60, energyCost: 15, stressCost: 2,
    description: "Serve customers in a busy café.", shiftEffects: { confidence: 1, fitness: 1 },
    skill: "service", performanceStats: ["happiness", "confidence"] },
  { id: "care-assistant", name: "Care Assistant", dailyIncome: 68, energyCost: 20, stressCost: 3,
    description: "Support people with their daily needs.", shiftEffects: { happiness: 1, health: -1, fitness: 3 },
    skill: "care", performanceStats: ["happiness", "health"],
    promotionTitles: ["Lead Care Assistant", "Senior Care Lead"] },
  { id: "junior-designer", name: "Junior Designer", dailyIncome: 70, energyCost: 15, stressCost: 2,
    description: "Build a portfolio on a creative team.", shiftEffects: { intelligence: 1, fitness: -1 },
    skill: "creative", performanceStats: ["intelligence", "confidence"],
    promotionTitles: ["Designer", "Senior Designer"],
    conditions: { all: [{ stat: "intelligence", min: 45 }, { stat: "confidence", min: 40 }] } },
  { id: "fitness-instructor", name: "Fitness Instructor", dailyIncome: 88, energyCost: 20, stressCost: 2,
    description: "Help people train and stay active.", shiftEffects: { fitness: 5 },
    skill: "fitness", performanceStats: ["fitness", "confidence"],
    conditions: { all: [{ stat: "fitness", min: 70 }, { stat: "confidence", min: 55 }] } },
  { id: "electrician", name: "Electrician", dailyIncome: 115, energyCost: 15, stressCost: 3,
    description: "Apply practical training to electrical work.", shiftEffects: { intelligence: 1, fitness: 3 },
    skill: "practical", performanceStats: ["intelligence", "fitness"],
    conditions: { all: [{ stat: "intelligence", min: 55 }, { skill: "practical", min: 5 }] } },
  { id: "logistics-coordinator", name: "Logistics Coordinator", dailyIncome: 105, energyCost: 15, stressCost: 3,
    description: "Coordinate deliveries and solve scheduling problems.", shiftEffects: { intelligence: 1, fitness: 2 },
    skill: "logistics", performanceStats: ["intelligence", "confidence"],
    conditions: { all: [{ stat: "intelligence", min: 55 }, { skill: "logistics", min: 5 }] } },
  { id: "office-manager", name: "Office Manager", dailyIncome: 120, energyCost: 15, stressCost: 4,
    description: "Keep an office and its people organised.", shiftEffects: { confidence: 1, fitness: -1 },
    skill: "administration", performanceStats: ["intelligence", "confidence"],
    conditions: { all: [{ stat: "confidence", min: 55 }, { skill: "administration", min: 5 }] } },
  { id: "graphic-designer", name: "Graphic Designer", dailyIncome: 120, energyCost: 15, stressCost: 3,
    description: "Create visual work for clients.", shiftEffects: { intelligence: 1, fitness: -1 },
    skill: "creative", performanceStats: ["intelligence", "confidence"],
    conditions: { all: [{ stat: "intelligence", min: 60 }, { skill: "creative", min: 5 }] } },
  { id: "nurse", name: "Nurse", dailyIncome: 140, energyCost: 25, stressCost: 4,
    description: "Combine care experience with further study.", shiftEffects: { happiness: 1, fitness: 5 },
    skill: "care", performanceStats: ["health", "intelligence", "happiness"],
    conditions: { all: [{ stat: "intelligence", min: 65 }, { skill: "care", min: 5 },
      { collection: "qualifications", includes: "Study Skills Certificate" }] } },
  { id: "software-developer", name: "Software Developer", dailyIncome: 150, energyCost: 15, stressCost: 4,
    description: "Use study and technical experience to build software.", shiftEffects: { intelligence: 1, fitness: -1 },
    skill: "technical", performanceStats: ["intelligence", "confidence"],
    conditions: { all: [{ stat: "intelligence", min: 70 }, { skill: "technical", min: 5 },
      { collection: "qualifications", includes: "Study Skills Certificate" }] } },
  { id: "researcher", name: "Researcher", dailyIncome: 160, energyCost: 15, stressCost: 4,
    description: "Investigate questions using advanced study skills.", shiftEffects: { intelligence: 1 },
    skill: "technical", performanceStats: ["intelligence", "happiness"],
    conditions: { all: [{ stat: "intelligence", min: 80 }, { stat: "happiness", min: 55 },
      { skill: "technical", min: 8 }, { collection: "qualifications", includes: "Study Skills Certificate" }] } },
  { id: "emergency-responder", name: "Emergency Responder", dailyIncome: 145, energyCost: 20, stressCost: 5,
    description: "Respond to demanding incidents using practical experience.", shiftEffects: { confidence: 1, fitness: 5 },
    skill: "practical", performanceStats: ["fitness", "health", "confidence"],
    conditions: { all: [{ stat: "fitness", min: 75 }, { stat: "health", min: 65 },
      { stat: "confidence", min: 60 }, { skill: "practical", min: 5 }] } },
  { id: "night-security", name: "Night Security", dailyIncome: 85, energyCost: 15, stressCost: 3,
    description: "Keep premises safe through the evening and night.", shiftEffects: { confidence: 1 },
    skill: "security", performanceStats: ["health", "confidence"] },
].map((job) => ({
  ...job,
  workingDays: JOB_SCHEDULES[job.id] || WEEKDAY_SCHEDULE,
  workingHours: job.id === "night-security" ? ["eveningActivity", "night"] : ["morningActivity", "daytimeActivity"],
  payFrequency: ["retail-assistant", "warehouse-worker", "cafe-assistant"].includes(job.id) ? "weekly"
    : ["delivery-driver", "night-security", "emergency-responder"].includes(job.id) ? "fortnightly" : "monthly",
  annualSalary: job.id === "office-junior" ? 24000 : Math.max(23000, job.dailyIncome * 260),
  promotionPath: job.promotionTitles || [`Senior ${job.name}`, `Lead ${job.name}`],
  qualificationRequirements: (job.conditions?.all || []).filter((condition) => condition.collection === "qualifications")
    .map((condition) => condition.includes),
  promotionRequirements: { days: 30, attendance: 90, performance: 75, skill: 20 },
}));

const activityDefinitions = [
  {
    id: "stay-home",
    name: "Stay Home",
    description: "Take a quiet day and recharge.",
    stage: "morningActivity",
    effects: { energy: 3, hygiene: -2, happiness: -2, fitness: -2, hunger: -2, stress: 1, homeCleanliness: -5 },
    outcome: "You stayed home for a quiet start to the day.",
  },
  {
    id: "morning-study",
    name: "Study",
    description: "Spend focused time learning and build technical skill.",
    stage: "morningActivity",
    effects: { intelligence: 5, happiness: -5, energy: -5, fitness: -2, hunger: -2, stress: 5, confidence: 1, hygiene: -1, homeCleanliness: -1 },
    skillGains: { technical: 1 },
    outcome: "You put in a focused study session.",
  },
  {
    id: "visit-gym",
    name: "Visit Gym",
    description: "Put in a workout and build fitness skill. Membership is billed monthly.",
    stage: "morningRoutine",
    effects: { confidence: 7, health: 6, energy: -25, hygiene: -40, fitness: 15, hunger: -10, happiness: 8, stress: -5 },
    skillGains: { fitness: 1 },
    outcome: "You completed a gym session and felt stronger for it.",
  },
  {
    id: "take-stroll",
    name: "Take Stroll",
    description: "Get outside for some fresh air.",
    stages: ["morningActivity", "daytimeActivity"],
    effects: { happiness: 10, stress: -6, energy: -12, fitness: 7, health: 2, hunger: -2, confidence: 1, hygiene: -5 },
    outcome: "A change of scenery lifted your mood.",
  },
  {
    id: "look-for-work",
    name: "Look For Work",
    description: "Apply for a role suited to your attributes and experience.",
    stages: ["morningActivity", "daytimeActivity"],
    effects: { energy: -5, stress: 2, hunger: -2, hygiene: -2, homeCleanliness: -1 },
    resolver: "job-application",
    outcome: "You prepared and submitted a job application.",
    requiresUnemployed: true,
  },
  {
    id: "morning-meet-people",
    name: "Meet People",
    description: "Make time for conversation and connection.",
    stage: "morningActivity",
    effects: { confidence: 2, happiness: 8, energy: -5, money: -5, hunger: -2, fitness: 1 },
    cost: 5,
    outcome: "You made time to be around other people.",
  },
  {
    id: "morning-reading",
    name: "Read a Book",
    description: "Enjoy a short read and build technical skill.",
    stage: "morningActivity",
    effects: { intelligence: 3, stress: -2, energy: -2, fitness: -2, hunger: -2, happiness: 4, confidence: 1, hygiene: -2, homeCleanliness: -1 },
    skillGains: { technical: 1 },
    outcome: "You spent a quiet morning reading.",
  },
  {
    id: "morning-chores",
    name: "Household Chores",
    description: "Clean your home and make it more comfortable.",
    stages: ["morningActivity", "daytimeActivity"],
    effects: { homeCleanliness: 50, stress: -3, happiness: 4, energy: -8, money: -3, fitness: 2, hunger: -2, confidence: 1, hygiene: -5 },
    cost: 3,
    outcome: "You tidied up and made your home feel calmer.",
  },
  {
    id: "morning-hobby",
    name: "Enjoy a Hobby",
    description: "Make time for something you enjoy.",
    stages: ["morningActivity", "daytimeActivity"],
    effects: { happiness: 10, stress: -3, energy: -5, hygiene: -2, homeCleanliness: -2 },
    outcome: "You made time for a favourite hobby.",
  },
  {
    id: "haircut",
    name: "Get a Haircut",
    description: "Make time for a haircut.",
    stages: ["morningActivity", "daytimeActivity"],
    effects: { money: -20, confidence: 2, happiness: 2 },
    cost: 20,
    outcome: "You got a haircut and felt more presentable.",
  },
  {
    id: "dentist",
    name: "Visit the Dentist",
    description: "Arrange a routine dental check-up.",
    stages: ["morningActivity", "daytimeActivity", "eveningActivity"],
    effects: { money: -40, health: 2, stress: -1 },
    cost: 40,
    outcome: "You attended a routine dental check-up.",
  },
  {
    id: "visit-doctor",
    name: "Visit Doctor",
    description: "Visit a doctor or an out-of-hours service.",
    stages: ["morningActivity", "daytimeActivity", "eveningActivity", "night"],
    effects: { health: 4, stress: -2, energy: -2 },
    outcome: "You visited a doctor and received advice.",
  },
  {
    id: "continue-studying",
    name: "Study",
    description: "Keep learning and build technical skill.",
    stages: ["daytimeActivity", "eveningActivity"],
    effects: { intelligence: 5, happiness: -3, energy: -5, fitness: -1, confidence: 1, hygiene: -1, homeCleanliness: -1 },
    skillGains: { technical: 1 },
    outcome: "You studied and made steady progress.",
  },
  {
    id: "work-shift",
    name: "Go To Work",
    description: "Attend your scheduled shift; wages are paid on payday.",
    stages: ["morningActivity", "daytimeActivity", "eveningActivity", "night"],
    effects: { hygiene: -10, hunger: -10, happiness: -5, homeCleanliness: -1 },
    resolver: "job-shift",
    requiresJob: true,
    outcome: "You completed a work shift.",
  },
  {
    id: "unpaid-leave",
    name: "Report An Absence",
    description: "Tell your employer why you cannot attend this unpaid shift.",
    stages: ["morningActivity", "daytimeActivity", "eveningActivity", "night"],
    requiresJob: true,
    effects: {},
    outcome: "You reported an absence.",
  },
  {
    id: "visit-town",
    name: "Visit Town",
    description: "Run errands and see what's happening in town.",
    stage: "daytimeActivity",
    effects: { happiness: 6, confidence: 2, energy: -10, money: -4, fitness: 2, hunger: -6, hygiene: -5 },
    cost: 4,
    outcome: "You spent some time exploring town.",
  },
  {
    id: "daytime-exercise",
    name: "Intense Workout",
    description: "Push yourself and build fitness skill.",
    stage: "daytimeActivity",
    effects: { health: 5, confidence: 3, energy: -35, hygiene: -40, fitness: 15, money: -10, hunger: -12, happiness: 8, stress: -8 },
    cost: 10,
    skillGains: { fitness: 1 },
    outcome: "You made time for exercise.",
  },
  {
    id: "socialise",
    name: "Socialise",
    description: "Catch up with someone and enjoy their company.",
    stage: "daytimeActivity",
    effects: { confidence: 2, happiness: 8, energy: -8, money: -8, hunger: -2, hygiene: -2, fitness: 1 },
    cost: 8,
    outcome: "You spent time socialising.",
  },
  {
    id: "relax-at-home",
    name: "Relax At Home",
    description: "Take a quiet break and recharge.",
    stage: "daytimeActivity",
    effects: { energy: 5, stress: -4, hygiene: -2, happiness: 2, fitness: -1, hunger: -2, confidence: -2 },
    outcome: "You relaxed at home and recharged.",
  },
  {
    id: "eat-out",
    stage: "eveningActivity",
    name: "Eat Out",
    description: "Go out for dinner.",
    effects: { happiness: 15, confidence: 7, money: -30, health: 2, energy: 8, fitness: 2 },
    hungerChange: 40,
    meal: "dinner",
    cost: 30,
    outcome: "You went out for dinner and enjoyed a special evening.",
  },
  {
    id: "watch-tv",
    name: "Watch TV",
    description: "Put your feet up and watch a favourite show.",
    stage: "eveningActivity",
    effects: { happiness: 10, stress: -3, energy: -2, fitness: -4, hunger: -2, hygiene: -2 },
    outcome: "You watched television and unwound.",
  },
  {
    id: "read-book",
    name: "Read Book",
    description: "Enjoy a book and build technical skill.",
    stage: "eveningActivity",
    effects: { intelligence: 3, stress: -2, energy: -2, fitness: -1, hunger: -2, happiness: 4, confidence: 1, hygiene: -2, homeCleanliness: -1 },
    skillGains: { technical: 1 },
    outcome: "You spent the evening reading.",
  },
  {
    id: "see-friends",
    name: "See Friends",
    description: "Spend the evening with friends.",
    stage: "eveningActivity",
    effects: { happiness: 10, confidence: 3, energy: -6, money: -5, hunger: -2, hygiene: -2 },
    cost: 5,
    outcome: "You enjoyed an evening with friends.",
  },
  {
    id: "visit-pub",
    name: "Visit Pub",
    description: "Go out for a drink and a change of scene.",
    stage: "eveningActivity",
    effects: { happiness: 10, confidence: 2, stress: -2, money: -10, hygiene: -10, fitness: -2, health: -5, energy: -8 },
    cost: 10,
    outcome: "You visited the pub for a change of scene.",
  },
  {
    id: "work-overtime",
    name: "Work Overtime",
    description: "Stay on for extra hours and extra pay.",
    stage: "eveningActivity",
    effects: { hygiene: -20, hunger: -20, happiness: -10 },
    resolver: "overtime",
    requiresJob: true,
    requiresWorkToday: true,
    outcome: "You worked overtime.",
  },
  {
    id: "relaxing-bath",
    name: "Relaxing Bath",
    description: "Enjoy a warm bath and let the day melt away.",
    stage: "eveningRoutine",
    effects: { health: 3, stress: -10, happiness: 6, hygiene: 90, energy: -2, confidence: 2, homeCleanliness: -5 },
    outcome: "A relaxing bath eased your stress and refreshed you.",
  },
  {
    id: "sleep-early",
    name: "Sleep Early",
    description: "Turn in early for a long sleep and start the next day. Recovery depends on Stress, Hunger and Fitness.",
    stage: "eveningActivity",
    endsDay: true,
    effects: { health: 5, energy: 80, stress: -7, hunger: -4, fitness: -2 },
    outcome: "You slept early and woke feeling well rested.",
  },
  {
    id: "go-to-bed",
    name: "Go To Bed",
    description: "End the day with a regular night's rest. Recovery depends on Stress, Hunger and Fitness.",
    stage: "night",
    effects: { health: 4, energy: 60, stress: -5 },
    outcome: "You went to bed and got a good night's rest.",
  },
  {
    id: "stay-up-late",
    name: "Stay Up Late",
    description: "Stay up for a chance of a creative idea or paid commission.",
    stage: "night",
    effects: { energy: 20, intelligence: 2, happiness: 4, stress: 3, health: -1, fitness: -2, hunger: -4, homeCleanliness: -2 },
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
    effects: { energy: -2, stress: 5, fitness: 1, hunger: -2, confidence: 2, homeCleanliness: -5 },
    outcome: "You woke with the alarm and got the day underway.",
  },
  {
    id: "stay-in-bed",
    name: "Stay In Bed",
    description: "Rest longer, but miss breakfast and both Morning choices.",
    effects: { energy: 8, hygiene: -5, confidence: -2, happiness: 4, homeCleanliness: -7 },
    hungerChange: -20,
    outcome: "You stayed in bed and gave up the morning's productive time.",
  },
  {
    id: "sleep-after-night-shift",
    name: "Sleep After Night Shift",
    description: "Rest after working overnight, missing breakfast and the morning.",
    effects: { energy: 75, health: 2, stress: -4, hunger: -10 },
    outcome: "You slept after your night shift.",
  },
];

const randomEventDefinitions = [
  {
    id: "rare-breakfast-opportunity",
    activityIds: ["skip-breakfast"],
    chance: 0.03,
    rare: true,
    rareTitle: "Early Opportunity",
    message: "The extra time led to a paid morning errand worth £35.",
    effects: { money: 35, happiness: 4 },
  },
  {
    id: "rare-lunch-opportunity",
    activityIds: ["skip-lunch"],
    chance: 0.03,
    rare: true,
    rareTitle: "Lunch Break Opportunity",
    message: "A chance conversation during your lunch break led to a £35 paid task.",
    effects: { money: 35, confidence: 3 },
  },
  {
    id: "rare-dinner-opportunity",
    activityIds: ["skip-dinner"],
    chance: 0.03,
    rare: true,
    rareTitle: "Evening Opportunity",
    message: "The extra evening time led to a creative commission worth £35.",
    effects: { money: 35, happiness: 4 },
  },
  {
    id: "rare-found-50",
    activityIds: ["take-stroll"],
    chance: 0.02,
    rare: true,
    rareTitle: "Found £50 During Walk",
    message: "You found £50 on the pavement and added it to your wallet.",
    effects: { money: 50, happiness: 4 },
  },
  {
    id: "rare-future-friend",
    activityIds: ["morning-meet-people", "socialise", "see-friends"],
    chance: 0.025,
    rare: true,
    rareTitle: "Met a Future Friend",
    social: true,
    conditions: {
      all: [{ stat: "hygiene", min: 45 }, { stat: "stress", max: 70 }],
    },
    message: "A chance conversation became the start of a lasting friendship.",
    effects: { confidence: 5, happiness: 7 },
    addTo: { relationships: ["Future friend"] },
  },
  {
    id: "rare-local-raffle",
    activityIds: ["visit-town"],
    chance: 0.02,
    rare: true,
    rareTitle: "Won the Local Raffle",
    message: "A local raffle ticket turned into a £100 prize.",
    effects: { money: 100, happiness: 5 },
  },
  {
    id: "rare-scholarship",
    activityIds: ["morning-study", "morning-reading", "continue-studying", "read-book"],
    chance: 0.015,
    rare: true,
    rareTitle: "Scholarship Opportunity",
    conditions: { all: [{ stat: "intelligence", min: 50 }] },
    message: "A tutor encouraged you to apply for a local scholarship.",
    effects: { confidence: 4, happiness: 5 },
    addTo: { opportunities: ["Scholarship opportunity"] },
  },
  {
    id: "rare-gym-membership",
    activityIds: ["visit-gym"],
    chance: 0.02,
    rare: true,
    rareTitle: "Free Gym Membership",
    message: "The gym offered you a free month of membership.",
    effects: { happiness: 5, confidence: 2 },
    addTo: { opportunities: ["Free gym membership"] },
  },
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
    activityIds: ["visit-gym", "daytime-exercise"],
    chance: 0.035,
    negative: true,
    message: "You twisted an ankle during your workout and had to take it easy.",
    effects: { health: -12, energy: -5, stress: 4 },
  },
  {
    id: "low-energy-strain",
    activityIds: ["visit-gym", "daytime-exercise"],
    chance: 0.18,
    negative: true,
    lowEnergyOnly: true,
    message: "You pushed through a workout while exhausted and strained a muscle.",
    effects: { health: -8, energy: -8, stress: 3 },
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
    activityIds: ["morning-study", "morning-reading", "continue-studying", "read-book"],
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
    activityIds: ["morning-study", "morning-reading", "continue-studying", "read-book"],
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
    id: "rare-late-night-commission",
    activityIds: ["stay-up-late"],
    chance: 0.05,
    rare: true,
    rareTitle: "Late-Night Commission",
    message: "Your late-night creativity led to a paid commission worth £50.",
    effects: { money: 50, confidence: 4, happiness: 4 },
  },
  {
    id: "late-night-idea",
    activityIds: ["stay-up-late"],
    chance: 0.25,
    message: "A late-night creative breakthrough gave you something exciting to explore.",
    effects: { intelligence: 5, happiness: 5 },
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
    id: "daytime-arrives",
    repeat: "daily",
    conditions: { all: [{ period: "daytime" }] },
    message: "Daytime arrives. There is still time to shape the day.",
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
    progressiveChance: 0.005,
    conditions: { all: [{ stat: "stress", min: 81 }] },
    message: "The pressure is taking a serious toll. You feel close to burnout.",
    effects: { stress: 5, happiness: -3, energy: -4 },
  },
  {
    id: "panic-attack",
    chance: 0.08,
    progressiveChance: 0.004,
    conditions: { all: [{ stat: "stress", min: 81 }] },
    message: "A sudden panic attack left you shaken and exhausted.",
    effects: { stress: 8, health: -2, energy: -8 },
  },
  {
    id: "low-hygiene-illness",
    chance: 0.1,
    progressiveChance: 0.01,
    maxChance: 0.35,
    conditions: { all: [{ stat: "hygiene", max: 9 }] },
    message: "After neglecting your health, you became ill and needed to rest.",
    effects: { health: -8, energy: -6, stress: 3 },
  },
  {
    id: "seasonal-illness",
    chance: 0.005,
    progressiveChance: 0.003,
    maxChance: 0.05,
    conditions: { all: [{ dayMin: 30 }] },
    message: "You caught a minor illness and needed extra rest.",
    effects: { health: -4, energy: -6, stress: 2 },
  },
  {
    id: "unexpected-bill",
    chance: 0.025,
    progressiveChance: 0.004,
    maxChance: 0.08,
    repeat: "monthly",
    conditions: { all: [{ dayMin: 30 }] },
    message: "An unexpected household bill arrived.",
    effects: { stress: 3 },
    electricityBill: 25,
  },
  {
    id: "phone-replacement",
    chance: 0.012,
    progressiveChance: 0.002,
    maxChance: 0.04,
    repeat: "monthly",
    conditions: { all: [{ dayMin: 60 }] },
    message: "Your phone stopped working and needed an expensive replacement.",
    effects: { money: -70, stress: 3 },
  },
  {
    id: "rent-increase",
    chance: 0.025,
    progressiveChance: 0.003,
    maxChance: 0.06,
    repeat: "once",
    conditions: { all: [{ dayMin: 60 }] },
    message: "A rent review increased your monthly rent by £30.",
    effects: { stress: 3 },
    rentIncrease: 1,
  },
  {
    id: "car-repair",
    chance: 0.012,
    progressiveChance: 0.002,
    maxChance: 0.04,
    repeat: "monthly",
    conditions: { all: [{ dayMin: 30 }, { job: "delivery-driver" }] },
    message: "A car repair disrupted your budget.",
    effects: { money: -55, stress: 4 },
  },
  {
    id: "family-emergency",
    chance: 0.012,
    progressiveChance: 0.002,
    maxChance: 0.04,
    repeat: "monthly",
    conditions: { all: [{ dayMin: 30 }] },
    message: "A family emergency left you with unexpected costs and worries.",
    effects: { money: -40, stress: 4, happiness: -3 },
  },
  {
    id: "medical-cost",
    chance: 0.015,
    progressiveChance: 0.002,
    maxChance: 0.045,
    repeat: "monthly",
    conditions: { all: [{ dayMin: 30 }, { stat: "health", max: 55 }] },
    message: "You needed to pay for an unexpected medical expense.",
    effects: { money: -35, stress: 2 },
  },
];

const eventIndex = new Map([...routineDefinitions, ...activityDefinitions].map(({ id }) => [id, []]));
randomEventDefinitions.forEach((event) => {
  event.activityIds.forEach((id) => eventIndex.get(id)?.push(event));
});

function createInitialState() {
  return {
    day: 1,
    age: 21,
    stage: "earlyMorning",
    stats: { ...STARTING_STATS },
    jobId: null,
    pendingJobOfferId: null,
    workedToday: false,
    workedJobIdToday: null,
    scheduledShifts: null,
    employment: null,
    payrollAccounts: [],
    pendingAbsence: false,
    reportedAbsence: null,
    needsDaySleep: false,
    selfCareToday: false,
    overtimeWorkedToday: false,
    stayedInBedToday: false,
    stayedHomeToday: false,
    consecutiveHomeDays: 0,
    exercisedToday: false,
    exerciseCountToday: 0,
    consecutiveExerciseDays: 0,
    consecutiveWorkDays: 0,
    nextDayEnergy: 0,
    skippedMealsToday: 0,
    skippedDinnerToday: false,
    healthStrainUnits: 0,
    rentSurcharge: 0,
    consecutiveHealthyDays: 0,
    stressFreeDays: 0,
    rareEvents: [],
    achievements: [],
    notifications: [],
    daysSurvived: 0,
    moneyEarned: 0,
    arrears: 0,
    reports: [],
    weekReflectedDay: 0,
    weekly: createWeeklyRecord(STARTING_STATS),
    monthly: createMonthlyRecord(),
    responsibilities: { appearance: 100, dental: 100, mental: 70, weight: 65, maintenance: 70 },
    reminderDays: {},
    currentJobDays: 0,
    currentJobCountedDay: 0,
    promotionLevel: 0,
    skills: {},
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

function createWeeklyRecord(stats) {
  return {
    startStats: { ...stats },
    income: 0,
    spent: 0,
    events: [],
    achievements: [],
    friends: [],
    qualifications: [],
    promotions: [],
  };
}

function createMonthlyRecord() {
  return {
    jobIncome: 0, otherIncome: 0, lifestyle: 0,
    rent: 0, electricity: 0, water: 0, internet: 0, subscriptions: 0,
    gym: false, freeGym: false,
  };
}

function clampStat(id, value) {
  return id === "money" ? Math.max(-OVERDRAFT_LIMIT, Math.round(value)) : Math.max(0, Math.min(100, Math.round(value)));
}

function formatMoney(value) {
  const amount = Math.abs(value).toLocaleString("en-GB");
  return value < 0 ? `-£${amount}` : `£${amount}`;
}

function applyEffects(state, effects = {}, { sleep = state.stage === "night", moneyCategory = "other" } = {}) {
  Object.entries(effects).forEach(([stat, amount]) => {
    if (Object.hasOwn(state.stats, stat)) {
      let adjustedAmount = amount;
      if (amount > 0 && stat === "happiness") {
        const stress = state.stats.stress;
        const recoveryFactor = stress >= 81 ? 0.5 : stress >= 61 ? 0.7 : stress >= 31 ? 0.85 : 1;
        const hungerFactor = state.stats.hunger < 15 ? 0.5 : state.stats.hunger < 30 ? 0.7 : state.stats.hunger < 50 ? 0.85 : 1;
        adjustedAmount = Math.max(1, Math.floor(amount * recoveryFactor * hungerFactor));
      } else if (amount > 0 && stat === "confidence") {
        const stress = state.stats.stress;
        const stressFactor = stress >= 81 ? 0.5 : stress >= 61 ? 0.7 : stress >= 31 ? 0.85 : 1;
        adjustedAmount = Math.max(1, Math.floor(amount * stressFactor * (state.stats.hygiene < 50 ? 0.8 : 1)
          * (state.responsibilities.appearance < 30 ? 0.9 : 1)));
      } else if (amount > 1 && stat === "health" && state.responsibilities.dental < 25) {
        adjustedAmount = Math.max(1, Math.floor(amount * 0.9));
      } else if (amount > 0 && stat === "energy") {
        const stressFactor = sleep
          ? state.stats.stress >= 81 ? 0.5 : state.stats.stress >= 61 ? 0.75 : 1
          : 1;
        const hungerFactor = sleep
          ? state.stats.hunger < 15 ? 0.5 : state.stats.hunger < 30 ? 0.7 : state.stats.hunger < 50 ? 0.85 : 1
          : 1;
        const fitnessFactor = state.stats.fitness < 30 ? 0.8 : state.stats.fitness > 80 ? 1.15 : 1;
        adjustedAmount = Math.max(1, Math.floor(amount * stressFactor * hungerFactor * fitnessFactor
          * (state.responsibilities.weight < 30 ? 0.95 : 1)));
      }
      if (stat === "money") {
        const before = state.stats.money;
        const after = clampStat(stat, before + adjustedAmount);
        const actual = after - before;
        if (adjustedAmount > 0) {
          state.moneyEarned += actual;
          state.weekly.income += actual;
          if (moneyCategory === "job") state.monthly.jobIncome += actual;
          else state.monthly.otherIncome += actual;
        } else if (adjustedAmount < 0) {
          state.weekly.spent -= actual;
          if (moneyCategory !== "bill") {
            state.monthly.lifestyle -= adjustedAmount;
            state.arrears += Math.max(0, -adjustedAmount + actual);
          }
        }
      }
      state.stats[stat] = clampStat(stat, state.stats[stat] + adjustedAmount);
    }
  });
}

function queueNotification(state, type, title, message) {
  notificationSequence += 1;
  state.notifications.push({
    id: notificationSequence,
    type,
    title,
    message,
  });
}

function unlockAchievement(state, definition) {
  if (state.achievements.some((achievement) => achievement.id === definition.id)) {
    return;
  }
  const achievement = { id: definition.id, title: definition.title, day: state.day };
  state.achievements.unshift(achievement);
  state.weekly.achievements.push(definition.title);
  appendEvent(state, `Achievement unlocked: ${definition.title}.`);
  queueNotification(state, "achievement", "ACHIEVEMENT UNLOCKED", definition.title);
}

function checkAchievements(state) {
  ACHIEVEMENT_DEFINITIONS.forEach((definition) => {
    if (definition.isUnlocked(state)) {
      unlockAchievement(state, definition);
    }
  });
}

function addRareEvent(state, event) {
  const rareEvent = {
    id: event.id,
    title: event.rareTitle || event.message,
    message: event.message,
    day: state.day,
  };
  state.rareEvents.unshift(rareEvent);
  state.rareEvents = state.rareEvents.slice(0, 20);
}

function applyCollections(state, additions = {}) {
  Object.entries(additions).forEach(([collection, values]) => {
    if (!Array.isArray(state.collections[collection])) {
      state.collections[collection] = [];
    }
    values.forEach((value) => {
      if (!state.collections[collection].includes(value)) {
        state.collections[collection].push(value);
        if (collection === "relationships") state.weekly.friends.push(value);
        if (collection === "qualifications") state.weekly.qualifications.push(value);
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
  if ((condition.dayMin !== undefined && state.day < condition.dayMin)
    || (condition.dayMax !== undefined && state.day > condition.dayMax)) {
    return false;
  }
  if (condition.job && state.jobId !== condition.job) {
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
  if (condition.skill) {
    const value = state.skills[condition.skill] || 0;
    if ((condition.min !== undefined && value < condition.min)
      || (condition.max !== undefined && value > condition.max)) {
      return false;
    }
  }
  if (condition.collection) {
    const values = state.collections[condition.collection];
    if (!Array.isArray(values)) return false;
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

function getHealthStrain(state) {
  const activeFactors = HEALTH_STRAIN_FACTORS.filter((condition) => conditionMatches(state, condition));
  const factors = activeFactors.length;
  const units = state.healthStrainUnits + factors;
  return {
    factors,
    activeFactors,
    loss: Math.floor(units / HEALTH_STRAIN_UNITS_PER_POINT),
    remainingUnits: units % HEALTH_STRAIN_UNITS_PER_POINT,
  };
}

function getApplicationChance(stats, hunger = 100) {
  const weightedScore = (stats.confidence * 0.25)
    + (stats.intelligence * 0.3)
    + (stats.hygiene * 0.2)
    + (stats.health * 0.15)
    - (stats.stress * 0.2);
  const stressPenalty = stats.stress >= 81 ? 15 : stats.stress >= 61 ? 8 : 0;
  const hygienePenalty = stats.hygiene < 30 ? 15 : stats.hygiene < 50 ? 5 : 0;
  const hungerPenalty = hunger < 15 ? 15 : hunger < 30 ? 8 : hunger < 50 ? 4 : 0;
  const fitnessModifier = (stats.fitness - 50) * 0.1;
  return Math.max(0, Math.min(100, Math.round(weightedScore + fitnessModifier - stressPenalty - hygienePenalty - hungerPenalty)));
}

function getDifficultyLevel(day) {
  return Math.floor((day - 1) / DIFFICULTY_INTERVAL);
}

function getProgressiveChance(event, state) {
  const chance = event.chance + ((event.progressiveChance || 0) * getDifficultyLevel(state.day));
  return Math.min(chance, event.maxChance === undefined ? 1 : event.maxChance);
}

function isExercise(activity) {
  return activity.id === "visit-gym" || activity.id === "daytime-exercise";
}

function getChoiceEffects(state, choice) {
  const effects = { ...(choice.effects || {}) };
  if (choice.id === "morning-chores" && state.responsibilities.maintenance < 30) {
    effects.homeCleanliness -= 5;
  }
  if (choice.hungerChange) {
    effects.hunger = choice.hungerChange;
  }
  if (isExercise(choice)) {
    const fatigueCost = Math.min((state.consecutiveExerciseDays + state.exerciseCountToday) * 5, 20);
    effects.energy = (effects.energy || 0) - fatigueCost;
    if (state.stats.energy < 25 || (choice.id === "visit-gym" && state.stats.fitness < 30)) {
      const effectiveness = (state.stats.energy < 25 ? 0.5 : 1)
        * (choice.id === "visit-gym" && state.stats.fitness < 30 ? 0.8 : 1);
      ["health", "confidence"].forEach((stat) => {
        if (effects[stat] > 0) {
          effects[stat] = Math.max(1, Math.floor(effects[stat] * effectiveness));
        }
      });
    } else if (choice.id === "visit-gym" && state.stats.fitness > 80) {
      ["health", "confidence"].forEach((stat) => {
        if (effects[stat] > 0) effects[stat] += 1;
      });
    }
  }
  if (["morning-study", "morning-reading", "continue-studying", "read-book"].includes(choice.id)
    && state.stats.hunger < 50
    && effects.intelligence > 0) {
    const studyFactor = state.stats.hunger < 15 ? 0.5 : state.stats.hunger < 30 ? 0.65 : 0.8;
    effects.intelligence = Math.max(1, Math.floor(effects.intelligence * studyFactor));
  }
  return effects;
}

function getWorkStressGain(state, baseCost) {
  let stressGain = baseCost;
  if (state.stats.confidence >= 70) stressGain -= 1;
  if (state.stats.happiness >= 70) stressGain -= 1;
  if (state.stats.energy < 25) stressGain += 2;
  else if (state.stats.energy < 40) stressGain += 1;
  if (state.stats.stress >= 81) stressGain += 2;
  else if (state.stats.stress >= 61) stressGain += 1;
  if (state.responsibilities.mental < 30) stressGain += 1;
  stressGain += Math.min(Math.floor(state.consecutiveWorkDays / 5), 4);
  return Math.max(0, stressGain);
}

function accrueDailyBills(state) {
  const date = getDate(state.day);
  const daysInMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  state.monthly.rent += (450 + state.rentSurcharge * 30) / daysInMonth;
  state.monthly.electricity += 30 / daysInMonth;
  state.monthly.water += 20 / daysInMonth;
  state.monthly.internet += 25 / daysInMonth;
  state.monthly.subscriptions += 12 / daysInMonth;
}

function recordChoiceUsage(state, choice) {
  const monthly = state.monthly;
  if (["freshen-up", "quick-shower", "relaxing-bath", "full-self-care"].includes(choice.id)) {
    monthly.water += choice.id === "freshen-up" ? 0.25 : choice.id === "relaxing-bath" ? 1 : 0.6;
  }
  if (["make-breakfast", "prepare-lunch", "cook-dinner"].includes(choice.id)) monthly.electricity += 0.5;
  if (["watch-tv", "morning-hobby"].includes(choice.id)) monthly.electricity += 0.3;
  if (choice.id === "visit-gym") monthly.gym = true;

  const habits = state.responsibilities;
  if (choice.id === "haircut") habits.appearance = 100;
  if (choice.id === "dentist") habits.dental = 100;
  if (choice.id === "morning-chores") habits.maintenance = Math.min(100, habits.maintenance + 30);
  if (["full-self-care", "morning-mindfulness", "take-stroll", "morning-hobby", "see-friends"].includes(choice.id)) {
    habits.mental = Math.min(100, habits.mental + 6);
  }
  if (isExercise(choice)) habits.weight = Math.min(100, habits.weight + 3);
}

function updateResponsibilities(state) {
  const habits = state.responsibilities;
  habits.appearance = Math.max(0, habits.appearance - 0.8);
  habits.dental = Math.max(0, habits.dental - 0.3);
  habits.maintenance = Math.max(0, habits.maintenance - 0.7);
  habits.mental = Math.max(0, Math.min(100, habits.mental + (state.stats.stress > 60 ? -2 : state.stats.stress < 30 ? 0.5 : -0.5)));
  habits.weight = Math.max(0, Math.min(100, habits.weight + (state.exercisedToday ? 0 : -0.3)));

  const reminders = [
    ["appearance", 40, "You should probably book a haircut."],
    ["dental", 40, "You haven't visited a dentist in a while."],
    ["maintenance", 35, "Your home may need some maintenance; a tidy-up could help."],
    ["mental", 35, "You have been feeling mentally exhausted recently. Make time for a break."],
    ["weight", 35, "A little regular movement could help you feel more energetic."],
  ];
  reminders.forEach(([key, threshold, message]) => {
    if (habits[key] <= threshold && state.day - (state.reminderDays[key] || -30) >= 30) {
      state.reminderDays[key] = state.day;
      appendEvent(state, message);
      queueNotification(state, "negative", "LIFE REMINDER", message);
    }
  });
}

function makeMonthlyReport(state) {
  const month = state.monthly;
  const rent = Math.round(month.rent);
  const electricity = Math.round(month.electricity);
  const water = Math.round(month.water);
  const internet = Math.round(month.internet);
  const subscriptions = Math.round(month.subscriptions);
  const gym = month.gym && !month.freeGym ? 30 : 0;
  const interest = Math.ceil((Math.max(0, -state.stats.money) + state.arrears) * 0.02);
  const bills = rent + electricity + water + internet + subscriptions + gym + interest;
  const outstanding = state.arrears + bills;
  const paid = Math.min(outstanding, state.stats.money + OVERDRAFT_LIMIT);
  state.arrears = outstanding - paid;
  applyEffects(state, { money: -paid }, { moneyCategory: "bill" });
  const income = month.jobIncome + month.otherIncome;
  const expenses = month.lifestyle + bills;
  const name = getDate(state.day).toLocaleDateString("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });
  const lines = [
    `Income: ${formatMoney(income)} (job earnings ${formatMoney(month.jobIncome)}, other income ${formatMoney(month.otherIncome)})`,
    `Rent: ${formatMoney(rent)}`,
    `Utilities: ${formatMoney(electricity + water)} (electricity ${formatMoney(electricity)}, water ${formatMoney(water)})`,
    `Internet: ${formatMoney(internet)}`,
    `Subscriptions: ${formatMoney(subscriptions)}`,
    `Gym membership: ${formatMoney(gym)}${month.freeGym && month.gym ? " (free month)" : ""}`,
    `Lifestyle spending: ${formatMoney(month.lifestyle)}`,
    `Overdraft interest: ${formatMoney(interest)}`,
    `Total expenses: ${formatMoney(expenses)}`,
    `Net profit/loss: ${formatMoney(income - expenses)}`,
    `Current account: ${formatMoney(state.stats.money)} · overdraft limit −£${OVERDRAFT_LIMIT}`,
    `Bills paid: ${formatMoney(paid)}${state.arrears ? ` · unpaid balance carried forward: ${formatMoney(state.arrears)}` : ""}`,
  ];
  state.monthly = createMonthlyRecord();
  return { title: `${name} finance report`, day: state.day, lines };
}

function makeWeeklyReport(state) {
  const week = state.weekly;
  const change = (stat) => state.stats[stat] - week.startStats[stat];
  const signed = (value) => `${value > 0 ? "+" : ""}${value}`;
  const stats = ["health", "fitness", "happiness", "stress"];
  const lines = [
    `Income earned: ${formatMoney(week.income)} · Money spent: ${formatMoney(week.spent)}`,
    ...stats.map((stat) => `${stat[0].toUpperCase() + stat.slice(1)} change: ${signed(change(stat))}`),
    `Achievements earned: ${week.achievements.join(", ") || "None this week"}`,
    `New friends: ${week.friends.join(", ") || "None this week"}`,
    `Qualifications: ${week.qualifications.join(", ") || "None this week"}`,
    `Promotions: ${week.promotions.join(", ") || "None this week"}`,
    `Significant events and milestones: ${week.events.join(" · ") || "A week of everyday choices"}`,
  ];
  if (change("fitness") > 0) lines.push("Your fitness improved this week.");
  if (change("health") > 0) lines.push("Your health improved this week.");
  if (change("health") < 0) lines.push("Your health declined this week; recovery may help.");
  if (change("happiness") > 0) lines.push("You found moments that improved your happiness.");
  if (change("happiness") < 0) lines.push("Your happiness fell this week; make time for something you enjoy.");
  if (change("stress") < 0) lines.push("You reduced your stress this week.");
  if (state.stats.hygiene < 50) lines.push("Your hygiene needs attention.");
  if (change("fitness") < 0) lines.push("Your fitness declined this week; consider making time for movement.");
  if (change("stress") > 0) lines.push("Stress rose this week; consider some time to recover.");
  state.weekly = createWeeklyRecord(state.stats);
  return { title: `Week ${Math.ceil(state.day / 7)} reflection`, day: state.day, lines };
}

function applyPeriodHunger(state, period) {
  const hungerLoss = HUNGER_PERIOD_COSTS[period];
  if (hungerLoss) {
    applyEffects(state, { hunger: -hungerLoss });
  }
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

function recordSignificantEvent(state, message) {
  state.weekly.events.push(message);
}

function processStateEvents(state) {
  stateEventDefinitions.forEach((event) => makeInitialStateEvent(state, event));
}

function getActivity(activityId) {
  return [...routineDefinitions, ...activityDefinitions].find((activity) => activity.id === activityId);
}

function getJob(jobId) {
  return jobs.find((job) => job.id === jobId);
}

function getPromotionTitle(job, level) {
  return level > 0 ? job.promotionPath[level - 1] : job.name;
}

function getJobTitle(state, job) {
  return getPromotionTitle(job, state.promotionLevel);
}

function getJobIncome(state, job) {
  return Math.round(job.annualSalary * (1 + state.promotionLevel * 0.25));
}

function getNextPayday(day, job) {
  if (job.payFrequency === "weekly") {
    return day + (5 - getDate(day).getUTCDay() + 7) % 7;
  }
  if (job.payFrequency === "fortnightly") {
    return day <= 5 ? 5 : 5 + Math.ceil((day - 5) / 14) * 14;
  }
  const date = getDate(day);
  for (let offset = 0; offset < 2; offset += 1) {
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset + 1, 0));
    while (!job.workingDays.includes(last.getUTCDay())) last.setUTCDate(last.getUTCDate() - 1);
    const payday = Math.round((last.getTime() - START_DATE) / DAY_MS) + 1;
    if (payday >= day) return payday;
  }
  throw new Error(`Could not calculate payday for ${job.name}.`);
}

function getShiftGrossPence(state, job) {
  const payday = getNextPayday(state.day, job);
  let firstDay;
  let lastDay;
  let periods;
  if (job.payFrequency === "monthly") {
    const date = getDate(state.day);
    firstDay = Math.round((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1) - START_DATE) / DAY_MS) + 1;
    lastDay = Math.round((Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0) - START_DATE) / DAY_MS) + 1;
    periods = 12;
  } else {
    lastDay = payday;
    firstDay = payday - (job.payFrequency === "weekly" ? 6 : 13);
    periods = job.payFrequency === "weekly" ? 52 : 26;
  }
  let shifts = 0;
  for (let day = firstDay; day <= lastDay; day += 1) {
    if (isWorkingDay(day, job)) shifts += job.workingHours.length;
  }
  return Math.round(getJobIncome(state, job) * 100 / periods / shifts);
}

function createEmployment(job) {
  return {
    expected: 0, worked: 0, missed: 0, excused: 0,
    performance: 70, recentPerformance: 70, daysInRole: 0, reviewDays: 0,
    credibility: 75, trust: 75, hrConcern: 0, hrResponse: 0, lastHrResponseDay: -7,
    absenceDays: [], unsupportedAbsences: 0, questionableAbsences: 0,
    feedback: "Your manager is getting to know your work.",
    payroll: { jobId: job.id, title: job.name, grossPence: 0 },
  };
}

function scheduleShifts(state, job, fromStage = "earlyMorning") {
  const from = DAILY_STAGES.findIndex((stage) => stage.id === fromStage);
  const stages = {};
  if (isWorkingDay(state.day, job)) {
    job.workingHours.forEach((stage) => {
      if (DAILY_STAGES.findIndex((item) => item.id === stage) >= from) stages[stage] = "pending";
    });
  }
  state.scheduledShifts = { day: state.day, jobId: job.id, stages };
}

function hasScheduledShift(state, stage = state.stage) {
  return Boolean(state.jobId && state.scheduledShifts?.day === state.day
    && state.scheduledShifts.jobId === state.jobId && state.scheduledShifts.stages[stage] === "pending");
}

function attendancePercent(employment) {
  return employment.expected ? employment.worked / employment.expected * 100 : 100;
}

function describeRequirements(job) {
  const requirements = (job.conditions?.all || []).map((condition) => {
    if (condition.stat) return `${condition.stat} ${condition.min}+`;
    if (condition.skill) return `${condition.skill} skill ${condition.min}+`;
    if (condition.collection === "qualifications") return condition.includes;
    return "";
  }).filter(Boolean);
  return requirements.length ? requirements.join(", ") : "No qualifications required";
}

function updatePerformance(state, job, missed = false) {
  const employment = state.employment;
  const stats = state.stats;
  const jobStats = job.performanceStats.reduce((sum, stat) => sum + stats[stat], 0) / job.performanceStats.length;
  const qualified = conditionsMatch(state, job.conditions);
  const target = attendancePercent(employment) * 0.2 + (100 - stats.stress) * 0.15
    + stats.confidence * 0.1 + stats.happiness * 0.1 + stats.health * 0.1
    + stats.fitness * 0.1 + employment.recentPerformance * 0.05 + (qualified ? 10 : 0)
    + employment.credibility * 0.05 + employment.trust * 0.05;
  employment.recentPerformance += (jobStats - employment.recentPerformance) * 0.2;
  const change = missed ? (target - employment.performance) * 0.1 - 3
    : 0.3 + Math.max(0, target - employment.performance) * 0.1;
  employment.performance = Math.max(0, Math.min(100, employment.performance + change));
}

function adjustEmployerValues(employment, { credibility = 0, trust = 0, concern = 0 } = {}) {
  employment.credibility = Math.max(0, Math.min(100, employment.credibility + credibility));
  employment.trust = Math.max(0, Math.min(100, employment.trust + trust));
  employment.hrConcern = Math.max(0, Math.min(100, employment.hrConcern + concern));
}

function getHrConcernLabel(value) {
  if (value <= 20) return "No Concern";
  if (value <= 40) return "Monitor Attendance";
  if (value <= 60) return "Manager Discussion";
  if (value <= 80) return "HR Counselling";
  return "Formal Process";
}

function reviewEmployerResponse(state) {
  const employment = state.employment;
  if (!employment) return;
  const steps = [
    { concern: 21, title: "Manager Check-In", message: "Your manager checks in and offers support." },
    { concern: 41, title: "Attendance Discussion", message: "Your manager would like to discuss attendance." },
    { concern: 61, title: "HR Support Meeting", message: "HR would like to discuss support and attendance." },
    { concern: 81, title: "Verbal Warning", message: "Your employer issued a verbal warning." },
    { concern: 85, title: "Written Warning", message: "Your employer issued a written warning." },
    { concern: 90, title: "Final Warning", message: "Your employer issued a final warning." },
    { concern: 95, title: "Dismissal", message: "Continued attendance concerns led to dismissal." },
  ];
  const next = steps[employment.hrResponse];
  if (!next || employment.hrConcern < next.concern || state.day - employment.lastHrResponseDay < 7) return;
  if (employment.hrResponse >= 3 && employment.missed < 2 && employment.questionableAbsences < 4) return;
  employment.hrResponse += 1;
  employment.lastHrResponseDay = state.day;
  employment.feedback = next.message;
  appendEvent(state, next.message);
  recordSignificantEvent(state, next.message);
  queueNotification(state, "negative", next.title.toUpperCase(), next.message);
  if (next.title === "Dismissal") {
    state.jobId = null;
    state.scheduledShifts = null;
    state.reportedAbsence = null;
    state.employment = null;
    state.promotionLevel = 0;
    state.currentJobDays = 0;
  }
}

function recordShift(state, stage, result, reason = "") {
  const reported = result === "excused" && state.scheduledShifts?.day === state.day
    && state.scheduledShifts.jobId === state.jobId && state.scheduledShifts.stages[stage] === "reported";
  if (!hasScheduledShift(state, stage) && !reported) return;
  const employment = state.employment;
  const job = getJob(state.jobId);
  state.scheduledShifts.stages[stage] = result;
  if (result === "excused") {
    employment.excused += 1;
    const message = `${reason}: your absence from ${job.name} was recorded. This shift is unpaid.`;
    appendEvent(state, message);
    recordSignificantEvent(state, message);
    queueNotification(state, "positive", "ABSENCE REPORTED", message);
    return;
  }
  employment.expected += 1;
  if (result === "worked") {
    employment.worked += 1;
    adjustEmployerValues(employment, { credibility: 1, trust: 2, concern: -1 });
    updatePerformance(state, job);
    return;
  }
  employment.missed += 1;
  adjustEmployerValues(employment, {
    credibility: -2, trust: -3,
    concern: 8 + (attendancePercent(employment) < 80 ? 2 : 0) + (employment.credibility < 30 ? 2 : 0),
  });
  updatePerformance(state, job, true);
  applyEffects(state, { stress: 3 });
  const message = `Missed a scheduled ${job.name} shift without reporting an absence.`;
  employment.feedback = "Your manager would like you to report absences when possible.";
  appendEvent(state, message);
  recordSignificantEvent(state, message);
  queueNotification(state, "negative", "EMPLOYMENT", message);
  reviewEmployerResponse(state);
}

function finishReportedAbsence(state, choice) {
  const report = state.reportedAbsence;
  if (!report || report.day !== state.day || report.stage !== state.stage || report.jobId !== state.jobId) return;
  const employment = state.employment;
  const reason = ABSENCE_REASONS.find((item) => item.id === report.reason);
  const supported = Boolean(reason.supporting?.includes(choice.id));
  const questionable = ["doctor", "dentist", "illness"].includes(reason.id)
    && QUESTIONABLE_ABSENCE_ACTIONS.includes(choice.id);
  recordShift(state, state.stage, "excused", reason.label);
  state.reportedAbsence = null;

  employment.absenceDays = employment.absenceDays.filter((day) => state.day - day < 28);
  const newDay = !employment.absenceDays.includes(state.day);
  if (newDay) employment.absenceDays.push(state.day);
  if (supported) {
    employment.unsupportedAbsences = 0;
    adjustEmployerValues(employment, { credibility: 2, trust: 1, concern: -1 });
    if (reason.evidence) {
      applyCollections(state, { opportunities: [reason.evidence] });
      appendEvent(state, `You received ${reason.evidence === "Medical Note" ? "a medical note" : "an appointment confirmation"}.`);
    }
  } else if (questionable) {
    employment.unsupportedAbsences += 1;
    employment.questionableAbsences += 1;
    adjustEmployerValues(employment, { credibility: -3, trust: -1, concern: employment.credibility < 30 ? 6 : 4 });
    employment.performance = Math.max(0, employment.performance - 0.5);
    appendEvent(state, "Your employer may question whether your activity matched the reported absence.");
  } else if (reason.supporting) {
    employment.unsupportedAbsences += 1;
    if (employment.unsupportedAbsences >= 3 && employment.hrConcern < 60) {
      employment.hrConcern = Math.min(60, employment.hrConcern + 2);
    }
  }
  if (newDay && employment.absenceDays.length >= 4 && employment.hrConcern < 40) {
    employment.hrConcern = Math.min(40, employment.hrConcern + 2);
  }
  reviewEmployerResponse(state);
}

function settleSkippedShifts(state, nextStage) {
  if (!state.scheduledShifts) return;
  const current = DAILY_STAGES.findIndex((stage) => stage.id === state.stage);
  const next = nextStage === null ? DAILY_STAGES.length : DAILY_STAGES.findIndex((stage) => stage.id === nextStage);
  Object.keys(state.scheduledShifts.stages).forEach((stage) => {
    const index = DAILY_STAGES.findIndex((item) => item.id === stage);
    if (index >= current && index < next) recordShift(state, stage, "missed");
  });
}

function processPaydays(state) {
  state.payrollAccounts.forEach((account) => {
    const job = getJob(account.jobId);
    if (account.grossPence <= 0 || getNextPayday(state.day, job) !== state.day) return;
    const gross = Math.round(account.grossPence / 100);
    const periods = job.payFrequency === "weekly" ? 52 : job.payFrequency === "fortnightly" ? 26 : 12;
    const taxable = Math.max(0, gross - 12570 / periods);
    const tax = Math.round(taxable * 0.2);
    const nationalInsurance = Math.round(taxable * 0.08);
    const net = gross - tax - nationalInsurance;
    applyEffects(state, { money: net }, { moneyCategory: "job" });
    checkAchievements(state);
    const lines = [account.title, `Gross Pay: ${formatMoney(gross)}`, `Tax: ${formatMoney(tax)}`,
      `National Insurance: ${formatMoney(nationalInsurance)}`, `Net Pay: ${formatMoney(net)}`,
      "Paid into your Current Account."];
    state.reports.push({ title: "PAYDAY", day: state.day, lines });
    const message = `${account.title} payday: ${formatMoney(net)} paid into your Current Account.`;
    appendEvent(state, message);
    recordSignificantEvent(state, message);
    queueNotification(state, "positive", "PAYDAY", message);
    account.grossPence = 0;
  });
  state.payrollAccounts = state.payrollAccounts.filter((account) => account.grossPence > 0
    || account === state.employment?.payroll);
}

function gainSkills(state, gains = {}) {
  Object.entries(gains).forEach(([skill, amount]) => {
    state.skills[skill] = Math.min(100, (state.skills[skill] || 0) + amount);
  });
}

function reviewPromotion(state, job) {
  const employment = state.employment;
  employment.reviewDays += 1;
  if (employment.reviewDays < PROMOTION_REVIEW_DAYS) return;
  employment.reviewDays = 0;
  const requirement = job.promotionRequirements;
  if (state.promotionLevel < 2 && employment.expected > 0
    && employment.daysInRole > requirement.days && attendancePercent(employment) > requirement.attendance
    && employment.performance > requirement.performance && (state.skills[job.skill] || 0) >= requirement.skill
    && employment.trust >= 40 && employment.credibility >= 40 && employment.hrConcern <= 60
    && conditionsMatch(state, job.conditions)) {
    state.promotionLevel += 1;
    employment.daysInRole = 0;
    employment.feedback = "Excellent progress; your performance earned a promotion.";
    const title = getJobTitle(state, job);
    employment.payroll.title = title;
    const message = `Promoted to ${title}! Annual salary is now ${formatMoney(getJobIncome(state, job))}.`;
    appendEvent(state, message);
    state.weekly.promotions.push(title);
    recordSignificantEvent(state, message);
    queueNotification(state, "positive", "PROMOTION", message);
  } else {
    employment.feedback = employment.hrConcern > 40 ? "Your employer would like to discuss attendance and support."
      : employment.trust < 40 || employment.credibility < 40 ? "Your manager would like to rebuild trust."
        : attendancePercent(employment) < 90 ? "Attendance needs improvement."
      : employment.performance >= 75 ? "Reliable team member with good future potential."
        : "Keep building your skills and looking after your wellbeing.";
  }
}

function isActivityAvailable(state, activity) {
  return isChoiceInStage(activity, state.stage)
    && (!hasScheduledShift(state) || ["work-shift", "unpaid-leave"].includes(activity.id))
    && (!activity.requiresJob || Boolean(state.jobId))
    && (!activity.requiresUnemployed || !state.jobId)
    && (!activity.requiresWorkToday || (state.workedToday && state.workedJobIdToday === state.jobId))
    && (!["work-shift", "unpaid-leave"].includes(activity.id) || hasScheduledShift(state))
    && (activity.id !== "work-overtime" || (!state.overtimeWorkedToday
      && state.scheduledShifts?.stages[state.stage] === undefined));
}

function isChoiceInStage(choice, stage) {
  return choice.stage === stage || Boolean(choice.stages?.includes(stage));
}

function getStageActivities(state) {
  return [...routineDefinitions, ...activityDefinitions].filter((activity) => isChoiceInStage(activity, state.stage));
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
  const achievements = state.achievements.map((achievement) => achievement.title);
  achievements.push(...state.collections.qualifications);
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

function finishEmploymentDay(state) {
  if (!state.jobId || state.currentJobCountedDay === state.day) return;
  const job = getJob(state.jobId);
  state.currentJobDays += 1;
  state.employment.daysInRole += 1;
  state.currentJobCountedDay = state.day;
  const strain = [state.stats.stress >= 80, state.stats.health < 30, state.stats.fitness < 20,
    state.stats.happiness < 20, state.stats.energy < 20].filter(Boolean).length;
  state.employment.performance = Math.max(0, state.employment.performance - Math.min(1.5, strain * 0.5));
  reviewEmployerResponse(state);
  if (!state.employment) return;
  if (state.currentJobDays > state.longestJobDays) {
    state.longestJobDays = state.currentJobDays;
    state.longestJobName = getJobTitle(state, job);
  }
  reviewPromotion(state, job);
}

function finishDay(state, random) {
  accrueDailyBills(state);
  updateResponsibilities(state);
  if ((state.stats.money < 0 || state.arrears > 0) && state.day % 7 === 0) {
    const debt = Math.max(0, -state.stats.money) + state.arrears;
    applyEffects(state, { stress: debt > 250 ? 3 : 1 });
    appendEvent(state, debt > 250
      ? "Your debt is creating serious financial pressure."
      : "Your overdraft is a manageable but ongoing concern.");
  }
  finishEmploymentDay(state);
  applyEffects(state, { hygiene: -10 });
  appendEvent(state, "Daily hygiene declined by 10.");

  applyEffects(state, { homeCleanliness: -5 });
  appendEvent(state, "Daily home cleanliness declined by 5.");
  if (state.stats.homeCleanliness < 30) {
    const severelyUntidy = state.stats.homeCleanliness < 15;
    applyEffects(state, { stress: severelyUntidy ? 4 : 2, happiness: severelyUntidy ? -4 : -2 });
    appendEvent(state, "An untidy home affected your mood and stress.");
  }

  if (state.stats.fitness > 80) {
    applyEffects(state, { health: 1 });
    appendEvent(state, "Good fitness supported your health. Health +1.");
  }
  const healthConditions = [
    state.stats.stress >= 61,
    state.stats.hygiene < 30,
    state.skippedMealsToday > 0,
    state.stats.energy < 25,
  ];
  const activeHealthConditions = healthConditions.filter(Boolean).length;
  let healthLoss = activeHealthConditions
    + (activeHealthConditions >= 3 ? 1 : 0)
    + (activeHealthConditions === 4 ? 1 : 0)
    + (state.stats.stress >= 81 ? 2 : 0)
    + (state.stats.hunger < 15 ? 3 : state.stats.hunger < 30 ? 1 : 0)
    + (state.stats.hygiene < 10 ? 2 : state.stats.hygiene < 20 ? 1 : 0)
    + (state.stats.fitness < 30 ? 2 : 0);
  if (healthLoss > 0) {
    applyEffects(state, { health: -healthLoss });
    appendEvent(state, `Daily health deterioration: −${healthLoss} from stress, hygiene, hunger, energy, fitness, or skipped meals.`);
  }
  applyEffects(state, { fitness: -5 });
  appendEvent(state, "Daily fitness declined by 5.");
  if (state.stats.hygiene < 20) {
    applyEffects(state, { confidence: -1 });
    appendEvent(state, "Poor hygiene affected your confidence.");
  }
  if (state.skippedMealsToday >= 2) {
    applyEffects(state, { energy: -8 });
    appendEvent(state, "Skipping two or more meals left you especially drained.");
  }
  if (state.skippedMealsToday >= 3) {
    applyEffects(state, { health: -6, stress: 6, happiness: -5 });
    appendEvent(state, "Going without all three meals harmed your health and mood.");
  }
  if (state.stats.hunger < 50) {
    applyEffects(state, { energy: -2 });
    appendEvent(state, "Low Hunger left you with less energy.");
  }
  if (state.stats.hunger < 15) {
    applyEffects(state, { happiness: -3, confidence: -2 });
    appendEvent(state, "Starvation affected your mood and confidence.");
  }

  if (state.stayedHomeToday) {
    state.consecutiveHomeDays += 1;
    if (state.consecutiveHomeDays >= 3) {
      applyEffects(state, { confidence: -1 });
      appendEvent(state, "Several days at home in a row began to affect your confidence.");
    }
  } else {
    state.consecutiveHomeDays = 0;
  }
  state.consecutiveExerciseDays = state.exercisedToday ? state.consecutiveExerciseDays + 1 : 0;
  state.exerciseCountToday = 0;
  state.exercisedToday = false;
  state.consecutiveWorkDays = state.workedToday ? state.consecutiveWorkDays + 1 : 0;
  if (state.consecutiveExerciseDays >= 3) {
    const fatigueLoss = Math.min((state.consecutiveExerciseDays - 2) * 3, 25);
    applyEffects(state, {
      energy: -fatigueLoss,
      stress: state.consecutiveExerciseDays >= 5 ? 1 : 0,
    });
    appendEvent(state, "Training without a recovery day left you exhausted.");
  }
  if (state.consecutiveWorkDays >= 5) {
    const workStrain = Math.min(Math.floor((state.consecutiveWorkDays - 5) / 10) + 1, 3);
    applyEffects(state, { stress: workStrain, energy: -1 });
    if (state.consecutiveWorkDays % 5 === 0) {
      appendEvent(state, "Working day after day is wearing you down.");
    }
  }

  dailyRiskEvents.forEach((event) => {
    const date = getDate(state.day);
    const monthKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    const eventKey = event.repeat === "once"
      ? event.id
      : event.repeat === "monthly"
        ? `${event.id}:${monthKey}`
        : `${event.id}:${state.day}`;
    if (state.firedStateEvents.has(eventKey) || !conditionsMatch(state, event.conditions)) return;
    if (random() >= getProgressiveChance(event, state)) return;
    state.firedStateEvents.add(eventKey);
    applyEffects(state, event.effects);
    if (event.electricityBill) state.monthly.electricity += event.electricityBill;
    if (event.rentIncrease) {
      state.rentSurcharge += event.rentIncrease;
    }
    appendEvent(state, event.message);
    recordSignificantEvent(state, event.message);
    queueNotification(state, "negative", "NEGATIVE EVENT", event.message);
  });
  const isHealthyDay = state.stats.health >= 60
    && state.stats.hunger >= 50
    && state.stats.energy >= 40
    && state.stats.stress <= 60;
  state.consecutiveHealthyDays = isHealthyDay ? state.consecutiveHealthyDays + 1 : 0;
  state.stressFreeDays = state.stats.stress <= 20 ? state.stressFreeDays + 1 : 0;
  checkAchievements(state);
  if (applyGameOver(state)) return;

  state.daysSurvived += 1;

  processPaydays(state);
  const date = getDate(state.day);
  const nextDate = getDate(state.day + 1);
  const isMonthEnd = date.getUTCMonth() !== nextDate.getUTCMonth();
  const monthlyReport = isMonthEnd || state.day === YEAR_LENGTH ? makeMonthlyReport(state) : null;
  if ((date.getUTCDay() === 0 && state.weekReflectedDay !== state.day) || state.day === YEAR_LENGTH) {
    state.reports.push(makeWeeklyReport(state));
    state.weekReflectedDay = state.day;
  }
  if (monthlyReport) state.reports.push(monthlyReport);

  if (state.day === YEAR_LENGTH) {
    state.yearComplete = true;
    appendEvent(state, "You completed all 365 days. The year is yours to look back on.");
    return;
  }

  state.day += 1;
  state.stage = "earlyMorning";
  state.workedToday = false;
  state.workedJobIdToday = null;
  if (state.jobId) scheduleShifts(state, getJob(state.jobId));
  else state.scheduledShifts = null;
  state.selfCareToday = false;
  state.overtimeWorkedToday = false;
  state.stayedInBedToday = false;
  state.stayedHomeToday = false;
  state.skippedMealsToday = 0;
  state.skippedDinnerToday = false;
  applyPeriodHunger(state, "Morning");
  if (state.nextDayEnergy !== 0) {
    applyEffects(state, { energy: state.nextDayEnergy });
    appendEvent(state, `You felt the effects of last night's sleep. Energy ${state.nextDayEnergy > 0 ? "+" : "−"}${Math.abs(state.nextDayEnergy)}.`);
    state.nextDayEnergy = 0;
  }
  applyGameOver(state);
}

function advanceStage(state, random, endsDay = false) {
  if (state.stage === "night" || endsDay) {
    settleSkippedShifts(state, null);
    if (endsDay) state.stage = "night";
    finishDay(state, random);
    return;
  }
  let nextStage;
  if (state.stage === "earlyMorning" && state.stayedInBedToday) {
    nextStage = DAILY_STAGES.find((stage) => stage.id === "daytimeRoutine");
  } else if (state.selfCareToday && state.stage === "morningRoutine") {
    nextStage = DAILY_STAGES.find((stage) => stage.id === "daytimeRoutine");
  } else if (state.selfCareToday && state.stage === "daytimeRoutine") {
    nextStage = DAILY_STAGES.find((stage) => stage.id === "eveningRoutine");
  } else {
    const index = DAILY_STAGES.findIndex((stage) => stage.id === state.stage);
    nextStage = DAILY_STAGES[index + 1];
  }
  const stageIndex = DAILY_STAGES.findIndex((stage) => stage.id === state.stage);
  const currentPeriod = DAILY_STAGES[stageIndex].period;
  settleSkippedShifts(state, nextStage.id);
  const job = getJob(state.jobId);
  if (job && DAILY_STAGES.findIndex((stage) => stage.id === nextStage.id)
    > Math.max(...job.workingHours.map((id) => DAILY_STAGES.findIndex((stage) => stage.id === id)))) {
    finishEmploymentDay(state);
  }
  state.stage = nextStage.id;
  if (nextStage.period !== currentPeriod) {
    applyPeriodHunger(state, nextStage.period);
  }
}

function resolveJobApplication(state, random) {
  const chance = getApplicationChance(state.stats, state.stats.hunger);
  if (random() * 100 < chance) {
    const eligibleJobs = jobs.filter((job) => conditionsMatch(state, job.conditions));
    if (eligibleJobs.length === 0) {
      appendEvent(state, "Your application succeeded, but no available roles match your qualifications.");
      queueNotification(state, "application", "NO MATCHING ROLES", "No available roles match your qualifications right now.");
      return;
    }
    const job = eligibleJobs[Math.floor(random() * eligibleJobs.length)];
    state.pendingJobOfferId = job.id;
    appendEvent(state, `Your application had a ${chance}% success chance. You received an offer for ${job.name}.`);
  } else {
    appendEvent(state, `Your application had a ${chance}% success chance, but you did not receive an offer this time.`);
    queueNotification(state, "application", "APPLICATION UNSUCCESSFUL", "No job offer this time. You can apply again.");
  }
}

function resolveWorkShift(state) {
  const job = getJob(state.jobId);
  if (!job) {
    return;
  }
  gainSkills(state, { [job.skill]: 1 });
  const shiftEffects = Object.fromEntries(Object.entries(job.shiftEffects).map(([stat, value]) => [
    stat, Math.sign(value) * Math.ceil(Math.abs(value) / job.workingHours.length),
  ]));
  applyEffects(state, shiftEffects);
  applyEffects(state, { energy: -Math.ceil(job.energyCost / job.workingHours.length) });
  const stressGain = getWorkStressGain(state, job.stressCost);
  applyEffects(state, { stress: stressGain });
  const gross = getShiftGrossPence(state, job);
  state.employment.payroll.grossPence += gross;
  state.employment.payroll.title = getJobTitle(state, job);
  recordShift(state, state.stage, "worked");
  state.workedToday = true;
  state.workedJobIdToday = job.id;
  if (state.stage === "night") state.needsDaySleep = true;
  appendEvent(state, `${getJobTitle(state, job)} shift complete. Wages will be paid on payday.`);
}

function resolveOvertime(state) {
  const job = getJob(state.jobId);
  if (!job) {
    return;
  }
  const overtimePay = Math.round(getShiftGrossPence(state, job) * 1.5);
  applyEffects(state, { energy: -(job.energyCost + 8) });
  applyEffects(state, { stress: getWorkStressGain(state, job.stressCost + 2) });
  state.employment.payroll.grossPence += overtimePay;
  state.employment.payroll.title = getJobTitle(state, job);
  state.overtimeWorkedToday = true;
  appendEvent(state, "You earned extra wages for working overtime; they will be paid on payday.");
}

const activityResolvers = {
  "job-application": resolveJobApplication,
  "job-shift": resolveWorkShift,
  overtime: resolveOvertime,
};

function resolveRandomEncounter(state, activity, random, lowEnergyExercise = false) {
  const candidates = eventIndex.get(activity.id) || [];
  for (const event of candidates) {
    if (event.lowEnergyOnly && !lowEnergyExercise) {
      continue;
    }
    let chance = event.chance * (1 + getDifficultyLevel(state.day) * 0.06);
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
      recordSignificantEvent(state, event.message);
      if (event.id === "rare-gym-membership") state.monthly.freeGym = true;
      if (event.rare) {
        addRareEvent(state, event);
      }
      const title = event.rare ? "RARE EVENT" : event.negative ? "NEGATIVE EVENT" : "POSITIVE EVENT";
      const message = event.rareTitle ? `${event.rareTitle}: ${event.message}` : event.message;
      queueNotification(state, event.negative ? "negative" : "positive", title, message);
      checkAchievements(state);
      return;
    }
  }
}

function getStatColor(id, value) {
  if (id === "stress") {
    if (value <= 20) return "#4CAF50";
    if (value <= 40) return "#8BC34A";
    if (value <= 60) return "#FFC107";
    if (value <= 80) return "#FF9800";
    return "#F44336";
  }
  if (value >= 80) return "#4CAF50";
  if (value >= 60) return "#8BC34A";
  if (value >= 40) return "#FFC107";
  if (value >= 20) return "#FF9800";
  return "#F44336";
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

function makeStat(definition) {
  const item = document.createElement("div");
  item.className = `life-sim-stat life-sim-stat--${definition.id}`;
  item.dataset.statId = definition.id;
  const name = document.createElement("dt");
  name.textContent = definition.label;
  const amount = document.createElement("dd");
  item.append(name, amount);

  if (definition.type === "meter") {
    const meter = document.createElement("div");
    meter.className = "life-sim-meter";
    meter.setAttribute("role", "meter");
    meter.setAttribute("aria-valuemin", "0");
    meter.setAttribute("aria-valuemax", "100");
    const fill = document.createElement("span");
    fill.className = "life-sim-meter-fill";
    meter.append(fill);
    item.append(meter);
  }
  return item;
}

function updateStat(item, definition, value) {
  const amount = item.querySelector("dd");
  amount.textContent = definition.type === "money" ? formatMoney(value) : `${value}/100`;
  if (definition.type === "meter") {
    const color = getStatColor(definition.id, value);
    item.style.setProperty("--stat-color", color);
    const meter = item.querySelector(".life-sim-meter");
    meter.setAttribute("aria-valuenow", String(value));
    meter.querySelector(".life-sim-meter-fill").style.width = `${value}%`;
    const scaleDescription = definition.id === "hunger"
      ? "; 100 is well nourished and 0 is starving"
      : "";
    meter.setAttribute("aria-label", `${definition.label}: ${value} out of 100${scaleDescription}`);
  }
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
  const periodDisplay = app.querySelector("[data-game-period]");
  const periodLabel = app.querySelector("[data-game-period-label]");
  const periodIcon = app.querySelector("[data-game-period-icon]");
  const phaseLabel = app.querySelector("[data-game-phase]");
  const notificationsContainer = app.querySelector("[data-game-notifications]");
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
  const accountContainer = app.querySelector("[data-game-account]");
  const statsContainer = app.querySelector("[data-game-stats]");
  const bankingStatus = app.querySelector("[data-game-banking]");
  const warningsContainer = app.querySelector("[data-game-warnings]");
  const jobStatus = app.querySelector("[data-game-employment]");
  const quitJobButton = app.querySelector("[data-life-sim-action='quit-job']");
  const collectionsContainer = app.querySelector("[data-game-collections]");
  const rareEventsContainer = app.querySelector("[data-game-rare-events]");
  const achievementsContainer = app.querySelector("[data-game-achievements]");
  const eventContainer = app.querySelector("[data-game-events]");
  const displayedNotificationIds = new Set();
  const statElements = new Map();
  let gameState = createInitialState();

  function renderNotifications() {
    const activeIds = new Set(gameState.notifications.map((notification) => notification.id));
    [...notificationsContainer.children].forEach((item) => {
      if (!activeIds.has(Number(item.dataset.notificationId))) {
        item.remove();
      }
    });

    gameState.notifications.forEach((notification) => {
      if (displayedNotificationIds.has(notification.id)) {
        return;
      }
      const card = document.createElement("div");
      card.className = `life-sim-notification life-sim-notification--${notification.type}`;
      card.dataset.notificationId = String(notification.id);
      const title = document.createElement("strong");
      title.textContent = notification.title;
      const message = document.createElement("span");
      message.textContent = notification.message;
      card.append(title, message);
      notificationsContainer.append(card);
      notificationsContainer.hidden = false;
      displayedNotificationIds.add(notification.id);

      window.setTimeout(() => {
        if (!card.isConnected) {
          return;
        }
        card.classList.add("is-fading");
        window.setTimeout(() => {
          gameState.notifications = gameState.notifications.filter((item) => item.id !== notification.id);
          displayedNotificationIds.delete(notification.id);
          card.remove();
          notificationsContainer.hidden = notificationsContainer.childElementCount === 0;
        }, 700);
      }, 5200);
    });
  }

  function renderChoices() {
    actionContainer.replaceChildren();
    offerActions.replaceChildren();
    offerPanel.hidden = gameState.pendingJobOfferId === null || gameState.reports.length > 0;

    if (gameState.reports.length) {
      choicesHeading.textContent = gameState.reports[0].title;
      choicesHint.textContent = "Take a moment to reflect before continuing.";
      actionContainer.append(makeButton("Continue", "Return to your life.", "continue-report"));
      return;
    }

    if (gameState.pendingAbsence) {
      choicesHeading.textContent = "Report an absence";
      choicesHint.textContent = "Choose a reason. This shift is unpaid and does not count against attendance.";
      ABSENCE_REASONS.forEach((reason, index) => {
        actionContainer.append(makeButton(reason.label, "Report this reason for the current shift.", `absence-${index}`));
      });
      actionContainer.append(makeButton("Cancel", "Return to your choices.", "cancel-absence"));
      return;
    }

    if (gameState.pendingJobOfferId !== null) {
      const job = getJob(gameState.pendingJobOfferId);
      offerCopy.textContent = `${job.name} · ${formatMoney(job.annualSalary)}/year · ${job.payFrequency} pay · ${formatSchedule(job)} · ${job.workingHours.map((id) => DAILY_STAGES.find((stage) => stage.id === id).label).join(" and ")} · Stress ${job.stressCost}. Requirements: ${describeRequirements(job)}. ${job.description}`;
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
    choicesHeading.textContent = `${PERIOD_PRESENTATION[stage.period].icon} ${stage.label}`;
    choicesHint.textContent = stage.type === "routine"
      ? "Choose one routine. Missing meals affects Health; two missed meals drain extra Energy and three also harm wellbeing."
      : stage.type === "activity"
        ? "Choose one activity for this part of the day."
        : "Choose one option to move on with your day.";
    let choices = [];
    if (gameState.stage === "earlyMorning") {
      choices = earlyMorningChoices.filter((choice) => choice.id !== "sleep-after-night-shift" || gameState.needsDaySleep);
    } else {
      choices = getStageActivities(gameState);
    }
    if (hasScheduledShift(gameState)) {
      choices = choices.filter((choice) => ["work-shift", "unpaid-leave"].includes(choice.id));
      choicesHint.textContent = "Your employer expects you today. Attend work or report an absence.";
    }
    const strain = getHealthStrain(gameState);
    if (strain.factors > 0) {
      const causes = strain.activeFactors.map((condition) => {
        const label = STAT_DEFINITIONS.find((definition) => definition.id === condition.stat).label;
        return `${condition.min === undefined ? "low" : "high"} ${label}`;
      }).join(", ");
      choicesHint.textContent += strain.loss
        ? ` Health strain from ${causes}: Health −${strain.loss} on this choice.`
        : ` Health strain from ${causes} is accumulating.`;
    }
    const choicePriority = (choice) => {
      if (choice.id === "work-shift") return 0;
      if (choice.id === "unpaid-leave") return 1;
      if (["morning-study", "continue-studying"].includes(choice.id)) return 2;
      if (["morning-reading", "read-book"].includes(choice.id)) return 3;
      if (["dentist", "visit-doctor"].includes(choice.id)) return 5;
      return 4;
    };
    choices.sort((a, b) => choicePriority(a) - choicePriority(b));

    choices.forEach((choice) => {
      if (["work-shift", "unpaid-leave"].includes(choice.id) && !hasScheduledShift(gameState)) return;
      if (choice.id === "work-overtime" && gameState.scheduledShifts?.stages[gameState.stage] !== undefined) return;
      let description = choice.description;
      const unavailable = gameState.stage !== "earlyMorning" && !isActivityAvailable(gameState, choice);
      if (choice.id === "look-for-work" && gameState.jobId) {
        description = "You already have a job.";
      } else if (choice.id === "work-shift" || choice.id === "work-overtime") {
        const job = getJob(gameState.jobId);
        if (!job) {
          description = "Apply for a role with Look for Work before taking a shift.";
        } else if (choice.id === "work-overtime"
          && (!gameState.workedToday || gameState.workedJobIdToday !== gameState.jobId)) {
          description = "Work a regular shift for this job today to unlock overtime.";
        }
      }
      if (choice.id === "sleep-early" && hasScheduledShift(gameState, "night")) {
        description += " Your scheduled Night shift will be missed.";
      }
      if (choice.id === "stay-in-bed" && hasScheduledShift(gameState, "morningActivity")) {
        description += " Your scheduled Morning shift will be missed.";
      }
      if (!unavailable && choice.cost > gameState.stats.money + OVERDRAFT_LIMIT) {
        description += " Not enough available funds.";
      }
      const phaseMeal = PHASE_MEALS[gameState.stage];
      if (phaseMeal && choice.meal !== phaseMeal) {
        description += phaseMeal === "dinner"
          ? " Miss dinner unless you eat out later."
          : ` Miss ${phaseMeal}.`;
      }
      actionContainer.append(
        makeButton(
          choice.name,
          description,
          choice.id,
          stage.type,
          unavailable || choice.cost > gameState.stats.money + OVERDRAFT_LIMIT,
        ),
      );
    });
  }

  function renderRareEvents() {
    const activeEvents = gameState.rareEvents.filter(
      (event) => gameState.day - event.day < RARE_EVENT_DISPLAY_DAYS,
    );
    if (activeEvents.length === 0) {
      const empty = document.createElement("li");
      empty.className = "life-sim-event-empty";
      empty.textContent = "No rare events yet.";
      rareEventsContainer.replaceChildren(empty);
      return;
    }

    rareEventsContainer.replaceChildren(...activeEvents.map((event) => {
      const item = document.createElement("li");
      item.className = "life-sim-rare-event";
      if (gameState.day - event.day >= RARE_EVENT_DISPLAY_DAYS - 2) {
        item.classList.add("is-fading");
      }
      const icon = document.createElement("span");
      icon.className = "life-sim-rare-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "⭐";
      const detail = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = event.title;
      const time = document.createElement("span");
      time.textContent = `Day ${event.day}`;
      detail.append(title, time);
      item.append(icon, detail);
      return item;
    }));
  }

  function renderAchievements() {
    const unlocked = new Map(
      gameState.achievements.map((achievement) => [achievement.id, achievement]),
    );
    achievementsContainer.replaceChildren(...ACHIEVEMENT_DEFINITIONS.map((definition) => {
      const achievement = unlocked.get(definition.id);
      const item = document.createElement("li");
      item.className = `life-sim-achievement${achievement ? " is-unlocked" : ""}`;
      const icon = document.createElement("span");
      icon.className = "life-sim-achievement-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = definition.icon;
      const detail = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = definition.title;
      const progress = document.createElement("span");
      progress.textContent = achievement
        ? `Unlocked · Day ${achievement.day}`
        : definition.progress(gameState);
      detail.append(title, progress);
      item.append(icon, detail);
      return item;
    }));
  }

  function render() {
    const stage = DAILY_STAGES.find((item) => item.id === gameState.stage);
    const report = gameState.reports[0];
    const period = gameState.yearComplete ? "Year complete" : stage.period;
    const presentation = PERIOD_PRESENTATION[period];
    const displayDay = report ? report.day : gameState.day;
    dayLabel.textContent = `Day ${displayDay} of ${YEAR_LENGTH} · ${formatDate(displayDay)} · Age ${gameState.age}`;
    periodLabel.textContent = period;
    periodIcon.textContent = presentation?.icon || "✦";
    phaseLabel.textContent = report ? report.title : gameState.yearComplete ? "Year complete" : stage.label;
    periodDisplay.dataset.period = period.toLowerCase();
    app.dataset.period = period.toLowerCase();
    if (presentation) {
      periodDisplay.style.setProperty("--period-accent", presentation.accent);
      app.style.setProperty("--period-accent", presentation.accent);
    } else {
      periodDisplay.style.removeProperty("--period-accent");
      app.style.removeProperty("--period-accent");
    }
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
    } else if (report) {
      sceneTitle.textContent = report.title;
      sceneCopy.textContent = report.lines.join("\n");
    } else if (gameState.yearComplete) {
      sceneTitle.textContent = "A year of your life";
      const unpaid = gameState.payrollAccounts.reduce((total, account) => total + account.grossPence, 0);
      sceneCopy.textContent = `You reached the end of the year with ${formatMoney(gameState.stats.money)}, ${gameState.collections.relationships.length} connections, and ${gameState.collections.qualifications.length} qualification${gameState.collections.qualifications.length === 1 ? "" : "s"}.${unpaid ? ` ${formatMoney(Math.round(unpaid / 100))} in gross wages is awaiting payday.` : ""} Your choices shaped the journey.`;
    } else if (gameState.stage === "earlyMorning" && gameState.day === 1) {
      sceneTitle.textContent = "Day 1 · A new morning";
      sceneCopy.textContent = "The alarm sounds as the first light comes through the curtains. Decide whether to get up or rest a little longer.";
    } else {
      sceneTitle.textContent = `${stage.label} · Day ${gameState.day}`;
      sceneCopy.textContent = [0, 6].includes(getDate(gameState.day).getUTCDay())
        ? "It's the weekend. Your work schedule and choices shape how you spend it."
        : "Your choices shape your routine, relationships, and the opportunities that follow.";
    }
    sceneCopy.style.whiteSpace = report ? "pre-line" : "";

    renderChoices();
    const warnings = [
      { show: gameState.stats.health < 25, label: "Poor Health" },
      { show: gameState.stats.fitness < 15, label: "Low Fitness" },
      { show: gameState.stats.energy < 20, label: "Exhausted" },
      { show: gameState.stats.hunger < 20, label: "Hungry" },
      { show: gameState.stats.stress > 80, label: "Burnout Risk" },
      { show: gameState.stats.homeCleanliness < 20, label: "Untidy Home" },
    ].filter((warning) => warning.show);
    warningsContainer.replaceChildren(...warnings.map((warning) => {
      const item = document.createElement("li");
      item.textContent = `⚠ ${warning.label}`;
      return item;
    }));
    warningsContainer.hidden = warnings.length === 0;
    STAT_DEFINITIONS.forEach((definition) => {
      let item = statElements.get(definition.id);
      if (!item) {
        item = makeStat(definition);
        statElements.set(definition.id, item);
        (definition.type === "money" ? accountContainer : statsContainer).append(item);
      }
      updateStat(item, definition, gameState.stats[definition.id]);
    });
    bankingStatus.textContent = `Overdraft limit: −£${OVERDRAFT_LIMIT} · Available: ${formatMoney(gameState.stats.money + OVERDRAFT_LIMIT)}${gameState.arrears ? ` · Unpaid bills: ${formatMoney(gameState.arrears)}` : ""}`;
    renderRareEvents();
    renderAchievements();

    const job = getJob(gameState.jobId);
    const pendingWages = gameState.payrollAccounts.filter((account) => account.grossPence > 0).map((account) => (
      `${account.title}: ${formatMoney(Math.round(account.grossPence / 100))} gross due ${formatDate(getNextPayday(gameState.day, getJob(account.jobId)))}`
    ));
    if (job) {
      const employment = gameState.employment;
      const rating = employment.performance >= 85 ? "Excellent" : employment.performance >= 75 ? "Strong"
        : employment.performance >= 55 ? "Developing" : "Needs improvement";
      const req = job.promotionRequirements;
      jobStatus.textContent = [
        `${getJobTitle(gameState, job)} · ${formatMoney(getJobIncome(gameState, job))}/year`,
        `${formatSchedule(job)} · ${job.workingHours.map((id) => DAILY_STAGES.find((stage) => stage.id === id).label).join(" + ")} · ${isWorkingDay(gameState.day, job) ? "Working day" : "Day off"} · Stress ${job.stressCost}`,
        `Pay: ${job.payFrequency} · Next payday: ${formatDate(getNextPayday(gameState.day, job))}`,
        ...(pendingWages.length ? [`Pending wages: ${pendingWages.join("; ")}`] : []),
        `Attendance: ${employment.expected ? `${Math.round(attendancePercent(employment))}%` : "No shifts yet"} (${employment.worked}/${employment.expected}; ${employment.missed} missed, ${employment.excused} excused)`,
        `Performance: ${rating}`,
        `Employer trust: ${employment.trust >= 75 ? "Strong" : employment.trust >= 40 ? "Developing" : "Needs rebuilding"} · Credibility: ${employment.credibility >= 75 ? "Strong" : employment.credibility >= 40 ? "Fair" : "Needs rebuilding"} · HR: ${getHrConcernLabel(employment.hrConcern)}`,
        gameState.promotionLevel < 2
          ? `Next: ${getPromotionTitle(job, gameState.promotionLevel + 1)} · ${employment.daysInRole}/${req.days + 1} days · ${job.skill} ${gameState.skills[job.skill] || 0}/${req.skill} · attendance >${req.attendance}% · performance >${req.performance}%`
          : "Promotion: highest level",
        `Requirements: ${describeRequirements(job)}`,
        `Manager feedback: ${employment.feedback}`,
      ].join("\n");
    } else {
      jobStatus.textContent = `Looking for work · Apply during Morning or Daytime Activity.${pendingWages.length ? `\nPending wages: ${pendingWages.join("; ")}` : ""}`;
    }
    jobStatus.style.whiteSpace = "pre-line";
    quitJobButton.hidden = !job || gameState.yearComplete || Boolean(gameState.gameOver)
      || Boolean(report) || gameState.pendingAbsence;

    const collectionEntries = [
      ["Qualifications", gameState.collections.qualifications],
      ["Connections", gameState.collections.relationships],
      ["Opportunities", gameState.collections.opportunities],
      ["Skills", Object.entries(gameState.skills).map(([skill, level]) => `${skill} ${level}`)],
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
    renderNotifications();
  }

  function performChoice(action) {
    let choice;
    if (gameState.stage === "earlyMorning") {
      choice = earlyMorningChoices.find((item) => item.id === action);
    } else {
      choice = getActivity(action);
      if (!choice || !isActivityAvailable(gameState, choice)) {
        return false;
      }
    }

    if (!choice || (choice.cost !== undefined && choice.cost > gameState.stats.money + OVERDRAFT_LIMIT)) {
      return false;
    }

    const lowEnergyExercise = isExercise(choice) && gameState.stats.energy < 25;
    const effects = getChoiceEffects(gameState, choice);
    const strain = getHealthStrain(gameState);
    if (choice.endsDay) applyPeriodHunger(gameState, "Night");
    applyEffects(gameState, effects, { sleep: choice.endsDay || gameState.stage === "night"
      || choice.id === "sleep-after-night-shift" });
    recordChoiceUsage(gameState, choice);
    finishReportedAbsence(gameState, choice);
    if (PHASE_MEALS[gameState.stage] && choice.meal !== PHASE_MEALS[gameState.stage]) {
      gameState.skippedMealsToday += 1;
      if (gameState.stage === "eveningRoutine") {
        gameState.skippedDinnerToday = true;
      }
    } else if (gameState.stage === "eveningActivity" && choice.meal === "dinner" && gameState.skippedDinnerToday) {
      gameState.skippedMealsToday -= 1;
      gameState.skippedDinnerToday = false;
    }
    if (choice.id === "stay-in-bed" || choice.id === "sleep-after-night-shift") {
      gameState.stayedInBedToday = true;
      gameState.skippedMealsToday += 1;
    }
    if (gameState.stage === "earlyMorning") gameState.needsDaySleep = false;
    if (choice.selfCareDay) {
      gameState.selfCareToday = true;
    }
    if (choice.id === "stay-home" || choice.id === "relax-at-home") {
      gameState.stayedHomeToday = true;
    }
    if (isExercise(choice)) {
      gameState.exercisedToday = true;
      gameState.exerciseCountToday += 1;
    }
    gainSkills(gameState, choice.skillGains);
    if (choice.resolver) {
      activityResolvers[choice.resolver]?.(gameState, random);
    }
    gameState.healthStrainUnits = strain.remainingUnits;
    if (strain.loss) {
      applyEffects(gameState, { health: -strain.loss });
    }
    const effectSummary = formatEffects(effects);
    const strainSummary = strain.loss ? ` Health −${strain.loss} from stat strain.` : "";
    appendEvent(gameState, `${effectSummary ? `${choice.outcome} ${effectSummary}.` : choice.outcome}${strainSummary}`);

    resolveRandomEncounter(gameState, choice, random, lowEnergyExercise);
    if (activityDefinitions.includes(choice)) {
      if (choice.id === "work-shift") {
        gameState.workedToday = true;
      }
      if (choice.nextDayEnergy !== undefined) {
        gameState.nextDayEnergy = choice.nextDayEnergy;
      }
    }

    checkAchievements(gameState);
    if (applyGameOver(gameState)) {
      return true;
    }
    if (gameState.stage === "eveningActivity" && !choice.endsDay && getDate(gameState.day).getUTCDay() === 0) {
      gameState.reports.push(makeWeeklyReport(gameState));
      gameState.weekReflectedDay = gameState.day;
    }
    advanceStage(gameState, random, choice.endsDay);
    processStateEvents(gameState);
    applyGameOver(gameState);
    return true;
  }

  function resolveJobOffer(action) {
    if (action === "accept-job" && gameState.pendingJobOfferId) {
      const job = getJob(gameState.pendingJobOfferId);
      gameState.jobId = job.id;
      gameState.employment = createEmployment(job);
      gameState.payrollAccounts.push(gameState.employment.payroll);
      scheduleShifts(gameState, job, gameState.stage);
      gameState.currentJobDays = 0;
      gameState.currentJobCountedDay = gameState.day - 1;
      gameState.promotionLevel = 0;
      gameState.pendingJobOfferId = null;
      appendEvent(gameState, `You accepted the ${job.name} offer.`);
      recordSignificantEvent(gameState, `Accepted a ${job.name} job offer.`);
      checkAchievements(gameState);
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
    if (action === "restart-year") {
      gameState = createInitialState();
      notificationsContainer.replaceChildren();
      notificationsContainer.hidden = true;
      displayedNotificationIds.clear();
      processStateEvents(gameState);
      render();
      return;
    }
    if (gameState.reports.length) {
      if (action === "continue-report") {
        gameState.reports.shift();
        render();
      }
      return;
    }
    if (gameState.pendingAbsence) {
      if (action === "cancel-absence") {
        gameState.pendingAbsence = false;
        render();
      } else if (action.startsWith("absence-")) {
        const index = Number(action.slice("absence-".length));
        const reason = ABSENCE_REASONS[index];
        if (reason && hasScheduledShift(gameState)) {
          gameState.pendingAbsence = false;
          gameState.scheduledShifts.stages[gameState.stage] = "reported";
          gameState.reportedAbsence = { day: gameState.day, stage: gameState.stage, jobId: gameState.jobId, reason: reason.id };
          render();
        }
      }
      return;
    }
    if (kind === "offer") {
      if (resolveJobOffer(action)) {
        processStateEvents(gameState);
        render();
      }
      return;
    }
    if (action === "quit-job" && gameState.jobId && !gameState.gameOver && !gameState.yearComplete) {
      const job = getJob(gameState.jobId);
      appendEvent(gameState, `You quit your job as ${getJobTitle(gameState, job)} and are looking for work again.`);
      gameState.jobId = null;
      gameState.scheduledShifts = null;
      gameState.reportedAbsence = null;
      gameState.employment = null;
      gameState.promotionLevel = 0;
      gameState.currentJobDays = 0;
      render();
      return;
    }
    if (action === "unpaid-leave" && hasScheduledShift(gameState)) {
      gameState.pendingAbsence = true;
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
