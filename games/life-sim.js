const YEAR_LENGTH = 365;
const MAX_VISIBLE_EVENTS = 30;
const BASE_DAILY_LIVING_COST = 2;
const DIFFICULTY_INTERVAL = 30;
const RARE_EVENT_DISPLAY_DAYS = 5;
const PROMOTION_REVIEW_DAYS = 7;
let notificationSequence = 0;

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
    effects: { hygiene: 40, energy: -3, money: -1, happiness: 2, stress: -1, confidence: 1, homeCleanliness: -1 },
    cost: 1,
    outcome: "You freshened up before heading out.",
  },
  {
    id: "quick-shower",
    stages: ["morningRoutine", "eveningRoutine"],
    name: "Quick Shower",
    description: "Take a quick shower and feel more confident.",
    effects: { hygiene: 70, confidence: 3, energy: -5, money: -2, health: 1, happiness: 4, stress: -5, homeCleanliness: -5, fitness: 1 },
    cost: 2,
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
  { id: "money", label: "Money", type: "money" },
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
  health: 72,
  fitness: 65,
  stress: 38,
  money: 40,
  confidence: 42,
  intelligence: 38,
  hygiene: 65,
  happiness: 58,
  energy: 70,
  hunger: 90,
  homeCleanliness: 70,
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
    skill: "care", performanceStats: ["happiness", "health"] },
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
];

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
    description: "Put in a workout and build fitness skill.",
    stage: "morningRoutine",
    effects: { confidence: 7, health: 6, energy: -25, hygiene: -40, fitness: 15, money: -10, hunger: -10, happiness: 8, stress: -5 },
    cost: 10,
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
    name: "Work",
    description: "Put in a shift and earn your daily pay.",
    stages: ["morningActivity", "daytimeActivity"],
    effects: { hygiene: -20, hunger: -20, happiness: -10, homeCleanliness: -1 },
    resolver: "job-shift",
    requiresJob: true,
    outcome: "You completed a work shift.",
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
    effects: { money: -25, stress: 3 },
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
    message: "A rent review increased your daily living costs by £1.",
    effects: { money: -30, stress: 3 },
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
    stage: "earlyMorning",
    stats: { ...STARTING_STATS },
    jobId: null,
    pendingJobOfferId: null,
    workedToday: false,
    workedJobIdToday: null,
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
    currentJobDays: 0,
    currentJobCountedDay: 0,
    promotionLevel: 0,
    promotionReviewDays: 0,
    promotionShifts: 0,
    promotionWellbeingDays: 0,
    promotionPerformanceTotal: 0,
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

function clampStat(id, value) {
  return id === "money" ? Math.max(-500, Math.round(value)) : Math.max(0, Math.min(100, Math.round(value)));
}

function formatMoney(value) {
  return value < 0 ? `-£${Math.abs(value)}` : `£${value}`;
}

function applyEffects(state, effects = {}, { sleep = state.stage === "night" } = {}) {
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
        adjustedAmount = Math.max(1, Math.floor(amount * stressFactor * (state.stats.hygiene < 50 ? 0.8 : 1)));
      } else if (amount > 0 && stat === "energy") {
        const stressFactor = sleep
          ? state.stats.stress >= 81 ? 0.5 : state.stats.stress >= 61 ? 0.75 : 1
          : 1;
        const hungerFactor = sleep
          ? state.stats.hunger < 15 ? 0.5 : state.stats.hunger < 30 ? 0.7 : state.stats.hunger < 50 ? 0.85 : 1
          : 1;
        const fitnessFactor = state.stats.fitness < 30 ? 0.8 : state.stats.fitness > 80 ? 1.15 : 1;
        adjustedAmount = Math.max(1, Math.floor(amount * stressFactor * hungerFactor * fitnessFactor));
      }
      if (stat === "money" && adjustedAmount > 0) {
        state.moneyEarned += adjustedAmount;
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
  const factors = HEALTH_STRAIN_FACTORS.filter((condition) => conditionMatches(state, condition)).length;
  const units = state.healthStrainUnits + factors;
  return {
    factors,
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
  stressGain += Math.min(Math.floor(state.consecutiveWorkDays / 5), 4);
  return Math.max(0, stressGain);
}

function getWorkPerformance(state) {
  if (state.stats.hunger < 15) return 0.6;
  if (state.stats.hunger < 30) return 0.75;
  if (state.stats.hunger < 50) return 0.9;
  return 1;
}

function getDailyLivingCost(state) {
  return BASE_DAILY_LIVING_COST + getDifficultyLevel(state.day) + state.rentSurcharge;
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

function processStateEvents(state) {
  stateEventDefinitions.forEach((event) => makeInitialStateEvent(state, event));
}

function getActivity(activityId) {
  return [...routineDefinitions, ...activityDefinitions].find((activity) => activity.id === activityId);
}

function getJob(jobId) {
  return jobs.find((job) => job.id === jobId);
}

function getJobTitle(state, job) {
  if (state.promotionLevel > 0 && job.promotionTitles?.[state.promotionLevel - 1]) {
    return job.promotionTitles[state.promotionLevel - 1];
  }
  const prefix = ["", "Senior ", "Lead "][state.promotionLevel];
  return `${prefix}${job.name}`;
}

function getJobIncome(state, job) {
  return Math.round(job.dailyIncome * (1 + state.promotionLevel * 0.25));
}

function resetPromotionReview(state) {
  state.promotionReviewDays = 0;
  state.promotionShifts = 0;
  state.promotionWellbeingDays = 0;
  state.promotionPerformanceTotal = 0;
}

function gainSkills(state, gains = {}) {
  Object.entries(gains).forEach(([skill, amount]) => {
    state.skills[skill] = Math.min(100, (state.skills[skill] || 0) + amount);
  });
}

function getPromotionChance(state, job) {
  if (!state.promotionShifts) return 0;
  const stats = state.stats;
  const coreStats = ["health", "fitness", "energy", "hunger", "happiness", "confidence", "intelligence", "hygiene"];
  const lowStats = coreStats.filter((stat) => stats[stat] < 40).length + (stats.stress > 60 ? 1 : 0);
  const allGreen = coreStats.every((stat) => stats[stat] >= 80) && stats.stress <= 20;
  const attendance = state.promotionShifts / state.promotionReviewDays;
  const wellbeing = state.promotionWellbeingDays / state.promotionReviewDays;
  const performance = state.promotionPerformanceTotal / state.promotionShifts;
  const skill = state.skills[job.skill] || 0;
  return Math.max(0, Math.min(90, Math.round(5 + attendance * 20 + wellbeing * 15
    + performance * 0.25 + Math.min(skill, 30) * 0.5 + (allGreen ? 10 : 0) - lowStats * 4)));
}

function reviewPromotion(state, job, random) {
  state.promotionReviewDays += 1;
  if (state.stats.health >= 60 && state.stats.hunger >= 50 && state.stats.hygiene >= 50
    && state.stats.happiness >= 50 && state.stats.energy >= 40 && state.stats.stress <= 60) {
    state.promotionWellbeingDays += 1;
  }
  if (state.promotionReviewDays < PROMOTION_REVIEW_DAYS) return;
  if (state.promotionLevel < 2) {
    const chance = getPromotionChance(state, job);
    if (random() * 100 < chance) {
      state.promotionLevel += 1;
      appendEvent(state, `Promoted to ${getJobTitle(state, job)}! Pay is now £${getJobIncome(state, job)} per shift.`);
    } else {
      appendEvent(state, state.promotionShifts
        ? `Promotion review: no promotion this time (${chance}% chance). Attendance, wellbeing and ${job.skill} skill affect your prospects.`
        : "Promotion review: work shifts to become eligible for promotion.");
    }
  }
  resetPromotionReview(state);
}

function isActivityAvailable(state, activity) {
  return isChoiceInStage(activity, state.stage)
    && (!activity.requiresJob || Boolean(state.jobId))
    && (!activity.requiresUnemployed || !state.jobId)
    && (!activity.requiresWorkToday || (state.workedToday && state.workedJobIdToday === state.jobId))
    && (!activity.id || activity.id !== "work-shift" || !state.workedToday)
    && (activity.id !== "work-overtime" || !state.overtimeWorkedToday);
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

function finishDay(state, random) {
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
    const interval = Math.floor((state.day - 1) / DIFFICULTY_INTERVAL);
    const eventKey = event.repeat === "once"
      ? event.id
      : event.repeat === "monthly"
        ? `${event.id}:${interval}`
        : `${event.id}:${state.day}`;
    if (state.firedStateEvents.has(eventKey) || !conditionsMatch(state, event.conditions)) return;
    if (random() >= getProgressiveChance(event, state)) return;
    state.firedStateEvents.add(eventKey);
    applyEffects(state, event.effects);
    if (event.rentIncrease) {
      state.rentSurcharge += event.rentIncrease;
    }
    appendEvent(state, event.message);
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

  if (state.jobId && state.currentJobCountedDay !== state.day) {
    state.currentJobDays += 1;
    state.currentJobCountedDay = state.day;
    if (state.currentJobDays > state.longestJobDays) {
      state.longestJobDays = state.currentJobDays;
      state.longestJobName = getJobTitle(state, getJob(state.jobId));
    }
    reviewPromotion(state, getJob(state.jobId), random);
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
  state.workedJobIdToday = null;
  state.selfCareToday = false;
  state.overtimeWorkedToday = false;
  state.stayedInBedToday = false;
  state.stayedHomeToday = false;
  state.skippedMealsToday = 0;
  state.skippedDinnerToday = false;
  applyPeriodHunger(state, "Morning");
  const livingCost = getDailyLivingCost(state);
  applyEffects(state, { money: -livingCost });
  appendEvent(state, `Daily living costs: −£${livingCost}.`);
  if (state.nextDayEnergy !== 0) {
    applyEffects(state, { energy: state.nextDayEnergy });
    appendEvent(state, `You felt the effects of last night's sleep. Energy ${state.nextDayEnergy > 0 ? "+" : "−"}${Math.abs(state.nextDayEnergy)}.`);
    state.nextDayEnergy = 0;
  }
  applyGameOver(state);
}

function advanceStage(state, random, endsDay = false) {
  if (state.stage === "night" || endsDay) {
    if (endsDay) state.stage = "night";
    finishDay(state, random);
    return;
  }
  if (state.stage === "earlyMorning" && state.stayedInBedToday) {
    state.stage = "daytimeRoutine";
    applyPeriodHunger(state, "Daytime");
    return;
  }
  if (state.selfCareToday && state.stage === "morningRoutine") {
    applyPeriodHunger(state, "Daytime");
    state.stage = "daytimeRoutine";
    return;
  }
  if (state.selfCareToday && state.stage === "daytimeRoutine") {
    state.stage = "eveningRoutine";
    applyPeriodHunger(state, "Evening");
    return;
  }
  const stageIndex = DAILY_STAGES.findIndex((stage) => stage.id === state.stage);
  const currentPeriod = DAILY_STAGES[stageIndex].period;
  const nextStage = DAILY_STAGES[stageIndex + 1];
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
  const performance = job.performanceStats.reduce((sum, stat) => sum + state.stats[stat], 0) / job.performanceStats.length;
  state.promotionPerformanceTotal += performance * getWorkPerformance(state);
  state.promotionShifts += 1;
  gainSkills(state, { [job.skill]: 1 });
  applyEffects(state, job.shiftEffects);
  applyEffects(state, { energy: -job.energyCost });
  const stressGain = getWorkStressGain(state, job.stressCost);
  applyEffects(state, { stress: stressGain });
  const earnings = Math.round(getJobIncome(state, job) * getWorkPerformance(state));
  applyEffects(state, { money: earnings });
  state.workedToday = true;
  state.workedJobIdToday = job.id;
  appendEvent(state, `${getJobTitle(state, job)} shift complete. You earned £${earnings} for the day.`);
}

function resolveOvertime(state) {
  const job = getJob(state.jobId);
  if (!job) {
    return;
  }
  const overtimePay = Math.round(getJobIncome(state, job) * 0.5 * getWorkPerformance(state));
  applyEffects(state, { energy: -(job.energyCost + 8) });
  applyEffects(state, { stress: getWorkStressGain(state, job.stressCost + 2) });
  applyEffects(state, { money: overtimePay });
  state.overtimeWorkedToday = true;
  appendEvent(state, `You earned an extra £${overtimePay} for working overtime.`);
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
  const statsContainer = app.querySelector("[data-game-stats]");
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
    offerPanel.hidden = gameState.pendingJobOfferId === null;

    if (gameState.pendingJobOfferId !== null) {
      const job = getJob(gameState.pendingJobOfferId);
      offerCopy.textContent = `${job.name} · £${job.dailyIncome} per shift · Energy −${job.energyCost} · Stress +${job.stressCost}. ${job.description}`;
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
    const strain = getHealthStrain(gameState);
    if (strain.factors > 0) {
      choicesHint.textContent += strain.loss
        ? ` Health strain from ${strain.factors} risk factor${strain.factors === 1 ? "" : "s"}: Health −${strain.loss} on this choice.`
        : ` Health strain from ${strain.factors} risk factor${strain.factors === 1 ? "" : "s"} is accumulating.`;
    }

    let choices = [];
    if (gameState.stage === "earlyMorning") {
      choices = earlyMorningChoices;
    } else {
      choices = getStageActivities(gameState);
    }

    choices.forEach((choice) => {
      let description = choice.description;
      const unavailable = stage.type !== "choice" && !isActivityAvailable(gameState, choice);
      if (choice.id === "look-for-work" && gameState.jobId) {
        description = "You already have a job.";
      } else if (choice.id === "work-shift" || choice.id === "work-overtime") {
        const job = getJob(gameState.jobId);
        if (!job) {
          description = "Apply for a role with Look for Work before taking a shift.";
        } else if (choice.id === "work-shift" && gameState.workedToday) {
          description = "You have already worked your shift today.";
        } else if (choice.id === "work-overtime"
          && (!gameState.workedToday || gameState.workedJobIdToday !== gameState.jobId)) {
          description = "Work a regular shift for this job today to unlock overtime.";
        }
      }
      if (!unavailable && choice.cost > gameState.stats.money) {
        description += " Not enough money.";
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
          unavailable || choice.cost > gameState.stats.money,
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
    const period = gameState.yearComplete ? "Year complete" : stage.period;
    const presentation = PERIOD_PRESENTATION[period];
    dayLabel.textContent = gameState.yearComplete
      ? `Day ${YEAR_LENGTH} of ${YEAR_LENGTH}`
      : `Day ${gameState.day} of ${YEAR_LENGTH}`;
    periodLabel.textContent = period;
    periodIcon.textContent = presentation?.icon || "✦";
    phaseLabel.textContent = gameState.yearComplete ? "Year complete" : stage.label;
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
    } else if (gameState.yearComplete) {
      sceneTitle.textContent = "A year of your life";
      sceneCopy.textContent = `You reached the end of the year with ${formatMoney(gameState.stats.money)}, ${gameState.collections.relationships.length} connections, and ${gameState.collections.qualifications.length} qualification${gameState.collections.qualifications.length === 1 ? "" : "s"}. Your choices shaped the journey.`;
    } else if (gameState.stage === "earlyMorning" && gameState.day === 1) {
      sceneTitle.textContent = "Day 1 · A new morning";
      sceneCopy.textContent = "The alarm sounds as the first light comes through the curtains. Decide whether to get up or rest a little longer.";
    } else {
      sceneTitle.textContent = `${stage.label} · Day ${gameState.day}`;
      sceneCopy.textContent = "Your choices shape your routine, relationships, and the opportunities that follow.";
    }

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
        statsContainer.append(item);
      }
      updateStat(item, definition, gameState.stats[definition.id]);
    });
    renderRareEvents();
    renderAchievements();

    const job = getJob(gameState.jobId);
    jobStatus.textContent = job
      ? `${getJobTitle(gameState, job)} · £${getJobIncome(gameState, job)} per shift · Energy −${job.energyCost} · Stress +${job.stressCost} · ${job.skill} skill ${gameState.skills[job.skill] || 0}${gameState.promotionLevel < 2 ? ` · Review in ${PROMOTION_REVIEW_DAYS - gameState.promotionReviewDays} day(s)` : " · Highest promotion"}`
      : "Looking for work · Apply during Morning or Daytime Activity.";
    quitJobButton.hidden = !job || gameState.yearComplete || Boolean(gameState.gameOver);

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

    if (!choice || (choice.cost !== undefined && choice.cost > gameState.stats.money)) {
      return false;
    }

    const lowEnergyExercise = isExercise(choice) && gameState.stats.energy < 25;
    const effects = getChoiceEffects(gameState, choice);
    const strain = getHealthStrain(gameState);
    if (choice.endsDay) applyPeriodHunger(gameState, "Night");
    applyEffects(gameState, effects, { sleep: choice.endsDay || gameState.stage === "night" });
    if (PHASE_MEALS[gameState.stage] && choice.meal !== PHASE_MEALS[gameState.stage]) {
      gameState.skippedMealsToday += 1;
      if (gameState.stage === "eveningRoutine") {
        gameState.skippedDinnerToday = true;
      }
    } else if (gameState.stage === "eveningActivity" && choice.meal === "dinner" && gameState.skippedDinnerToday) {
      gameState.skippedMealsToday -= 1;
      gameState.skippedDinnerToday = false;
    }
    if (choice.id === "stay-in-bed") {
      gameState.stayedInBedToday = true;
      gameState.skippedMealsToday += 1;
    }
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
    advanceStage(gameState, random, choice.endsDay);
    processStateEvents(gameState);
    return true;
  }

  function resolveJobOffer(action) {
    if (action === "accept-job" && gameState.pendingJobOfferId) {
      const job = getJob(gameState.pendingJobOfferId);
      gameState.jobId = job.id;
      gameState.currentJobDays = 0;
      gameState.currentJobCountedDay = gameState.day - 1;
      gameState.promotionLevel = 0;
      resetPromotionReview(gameState);
      gameState.pendingJobOfferId = null;
      appendEvent(gameState, `You accepted the ${job.name} offer.`);
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
    if (kind === "offer") {
      if (resolveJobOffer(action)) {
        processStateEvents(gameState);
        render();
      }
      return;
    }
    if (action === "restart-year") {
      gameState = createInitialState();
      notificationsContainer.replaceChildren();
      notificationsContainer.hidden = true;
      displayedNotificationIds.clear();
      processStateEvents(gameState);
      render();
      return;
    }
    if (action === "quit-job" && gameState.jobId && !gameState.gameOver && !gameState.yearComplete) {
      const job = getJob(gameState.jobId);
      appendEvent(gameState, `You quit your job as ${getJobTitle(gameState, job)} and are looking for work again.`);
      gameState.jobId = null;
      gameState.promotionLevel = 0;
      gameState.currentJobDays = 0;
      resetPromotionReview(gameState);
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
