# Rogue Racing Manager - Phase 1 Documentation

## Overview

**Rogue Racing Manager** is a roguelike racing team management simulator inspired by Formula 1, Motorsport Manager, Balatro, and Slay the Spire. Players manage a racing team through strategic decisions during races and between-race upgrades while navigating random events and weather conditions.

## Core Concept

The game combines:
- **Racing Simulation**: Real-time lap-by-lap race simulation with weather and tyre management
- **Team Management**: Strategic upgrades and resource allocation
- **Roguelike Systems**: Randomized drivers, events, and upgrades each run with permanent progression unlocks
- **Strategic Depth**: Radio commands and pit strategy have meaningful impact on race outcomes

## Architecture

### Classes

#### `Driver`
Represents a racing driver with individual characteristics.

**Properties:**
- `name`: Driver's name (randomly generated)
- `traits`: Array of unique driver traits (e.g., "Aggressive", "Defensive")
- `stats`: Driver statistics
  - `pace`: Raw speed capability (0-100)
  - `consistency`: Error probability (0-1)
  - `experience`: Career experience (0-100)
  - `racecraft`: Race strategy skill (0-100)
- `mood`: Current mood state (neutral, confident, frustrated, etc.)
- `tyreWear`: Current tyre wear percentage (0-100)
- `fuelLevel`: Fuel remaining (0-100)
- `batteryCharge`: Battery/ERS charge (0-100)
- `errors`: Number of mistakes made

**Methods:**
- `updateTyreWear(delta)`: Add tyre wear
- `updateFuel(delta)`: Consume or add fuel
- `updateBattery(delta)`: Change battery level
- `makeError()`: Probabilistic error based on consistency stat

#### `Car`
Represents the racing car with performance upgrades.

**Properties:**
- `engine`: Engine performance rating (0-100)
- `aero`: Aerodynamic rating (0-100)
- `battery`: Battery/ERS system rating (0-100)
- `reliability`: Overall reliability (0-100)
- `pitCrew`: Pit crew efficiency (0-100)

**Methods:**
- `getOverallPerformance()`: Calculate average performance
- `applyUpgrade(upgrade)`: Apply an upgrade card to a system

#### `Track`
Represents a race track with environmental conditions.

**Properties:**
- `name`: Track name
- `lapLength`: Length in kilometers
- `corners`: Number of corners
- `difficulty`: Difficulty rating (1-5)
- `weather`: Current weather state (clear, overcast, wet, stormy)
- `gripLevel`: Tyre grip multiplier based on weather

**Methods:**
- `updateWeather()`: Randomly change weather and grip

#### `Lap`
Records data for a single lap completed during a race.

**Properties:**
- `lapNumber`: Which lap in the race
- `timeMs`: Total lap time in milliseconds
- `sector1`, `sector2`, `sector3`: Sector times
- `tyreType`: Current tyre type
- `weather`: Weather during this lap
- `isValid`: Whether lap counts (not consumed fuel/battery)

**Methods:**
- `formatTime()`: Returns formatted time string (M:SS.MS)

#### `RaceSimulation`
Manages a complete race from start to finish.

**Properties:**
- `driver`: The Driver object
- `car`: The Car object
- `track`: The Track object
- `position`: Current race position
- `laps`: Array of completed Lap objects
- `currentLapNumber`: Lap counter
- `raceTime`: Total race elapsed time
- `isComplete`: Whether race has finished
- `results`: Final race results with points and money earned

**Methods:**
- `generateLapTime()`: Calculate raw lap time based on car, driver, weather, tyres, fuel
- `generateSectorTimes(lapTime)`: Break lap time into three sectors
- `simulateLap(radioCommand, ersMode, pitThisLap)`: Simulate one lap with given strategy
- `getFastestLap()`: Return fastest lap object or null
- `completeRace()`: Calculate final results and points

#### `Team`
Represents the racing team's resources and progression.

**Properties:**
- `archetype`: Team type (balanced, aggressive, defensive, innovative)
- `money`: Current budget in credits
- `reputation`: Team reputation level
- `championshipPoints`: Accumulated championship points
- `inventory`: Array of installed upgrades

#### `Upgrade`
Represents a performance upgrade card.

**Static Methods:**
- `generateRandom()`: Create a random upgrade with type, value, description, and rarity
- `generateThreeOptions()`: Generate three random upgrade options

**Properties:**
- `type`: System being upgraded (engine, aero, battery, reliability, pit-crew)
- `value`: Performance increase amount
- `description`: Human-readable upgrade name
- `rarity`: Visual rarity indicator (common, rare, epic)

#### `GameState`
Main game state manager.

**Properties:**
- `season`: Current season number
- `raceNumber`: Race counter
- `driver`: Current Driver
- `car`: Current Car
- `team`: Current Team
- `races`: Array of completed RaceSimulation objects
- `upgrades`: Array of collected upgrades

**Methods:**
- `startNewRun()`: Initialize a fresh game run
- `generateDriver()`: Create a random driver with traits and stats
- `getRandomTraits()`: Get 1-3 random trait objects
- `save()`: Persist game to localStorage
- `load()`: Restore game from localStorage

#### `RaceScreenUI`
Handles rendering and interaction for race screen.

**Properties:**
- `root`: DOM element to render into
- `gameState`: Reference to GameState
- `race`: Current RaceSimulation
- `track`: Current Track

**Methods:**
- `render()`: Render complete race screen UI
- `renderTrackMap()`: Generate SVG track visualization
- `getBarColor(percentage)`: Return hex color based on value
- `attachEventListeners()`: Wire up button handlers
- `showRaceResults()`: Display race completion results

### Module Export

```javascript
export function mountRacingManager(rootElement)
```

Initializes the game, creates a driver and race, and mounts the UI.

Returns: `{ gameState, raceSimulation, raceScreen }`

## Phase 1 Features

### Driver Generation
- Random name generation from pools
- 6+ unique trait types (Aggressive, Defensive, Determined, Adaptable, Confident, Cautious)
- Randomized stats: pace, consistency, experience, racecraft
- Traits provide mechanical effects on race outcomes

### Single Race Simulation
- Complete lap-by-lap race simulation
- 10 laps per race (configurable)
- Real-time lap timing with sector splits
- Tyre wear, fuel consumption, battery management
- Weather influences grip and performance
- Mistakes/errors based on driver consistency and pressure

### Lap Timing System
- Base lap time calculated from: track length, car performance, driver pace, weather, tyres, fuel
- Variance to prevent identical laps
- Sector times calculated from total lap time with realistic distribution
- Lap validation (fuel/battery not depleted)
- Fastest lap tracking
- Time formatting: M:SS.MS

### Radio Commands
Drivers respond to radio instructions affecting lap times:
- **PUSH** (-50ms, risk of mistake): Aggressive driving
- **STANDARD** (baseline): Normal pace
- **SAVE TYRES** (+100ms): Preserve tyre life
- **ATTACK** (-100ms, high risk): Maximum effort
- **DEFEND** (+50ms): Focus on position defense

### ERS/Engine Management
- **FULL** (-60ms): Use maximum power
- **NORMAL** (baseline): Standard energy recovery
- **HARVEST** (+40ms, charge battery): Prioritize energy collection

### Basic Upgrade Cards
- Three random upgrade options offered between (future) races
- Five upgrade types: engine, aero, battery, reliability, pit-crew
- Each upgrade +5% to target system
- Visual rarity indicators (common, rare, epic)

### Save/Load System
- LocalStorage persistence to `rrm-save-game` key
- Saves: season, race count, driver name/stats, car configuration, team data, race results
- Full restoration of game state

### Race Screen UI

#### Header
- Race track name
- Current lap / total laps
- Weather indicator
- Championship position

#### Left Panel (Driver Info)
- Driver name and portrait placeholder
- Driver traits displayed as badges
- Real-time status bars:
  - Tyre wear (color-coded: green > 70%, amber 40-70%, red < 40%)
  - Fuel level (blue gradient)
  - Battery charge (green gradient)

#### Center Panel (Track View)
- SVG track map showing circuit layout
- Driver position marker with animation pulse
- Track name and corner count
- Unique map for each circuit

#### Right Panel (Timing Tower)
- Live position table: Pos, Driver, Gap, Last Lap, Best Lap, Current Tyre, Pit Status
- Fastest lap indicator with time
- Monospace timing font for readability

#### Command Deck (Bottom)
- Radio command buttons (Push, Standard, Save Tyres, Attack, Defend)
- ERS mode selector (Full, Normal, Harvest)
- Next Lap button to advance simulation
- Visual active state highlighting

#### Race Results Screen
- Finishing position
- Points earned (F1-style: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1)
- Money earned (varies)
- Best lap time
- Number of valid laps completed

## Visual Design

### Color Palette
- **Deep charcoal backgrounds**: `#0a1423`, `#031a34`
- **Electric blue**: `#00bfff` (telemetry, positions, headers)
- **Emerald green**: `#2ecc71` (positive indicators, points)
- **Amber**: `#f39c12` (warnings, medium values)
- **Crimson**: `#e74c3c` (critical alerts)
- **Text**: `#f3efe3` (paper white)

### UI Elements
- Glass-effect panels with 1px borders
- Soft shadows: `0 8px 24px rgba(0,0,0,0.3)`
- Inset highlights: `inset 0 0 20px rgba(0,191,255,0.05)`
- Neon-style telemetry text
- Rounded corners (3-4px)
- Responsive grid layout

### Animations
- Smooth status bar transitions (0.3s ease)
- Driver position marker pulse (2s infinite)
- Hover effects on buttons with glow shadows
- Active button state with enhanced glow

## Data Flow

1. **Initialization**: `mountRacingManager()` creates GameState, generates Driver, creates Track
2. **Race Setup**: RaceSimulation configured with initial position
3. **Lap Loop**: Player selects radio command and ERS mode → Lap simulated → UI updated
4. **Race Complete**: 10 laps → results calculated → completion screen shown
5. **Persistence**: Game state can be saved to localStorage at any point

## Future Enhancements (Phase 2+)

### Gameplay
- Multi-race seasons with championship progression
- Pit stop strategy and tyre selection
- Fuel strategy throughout race
- Position-based grid starts
- Safety car and yellow flags
- Driver incidents and reliability failures
- Sponsor offers and team decisions

### Roguelike Systems
- Multiple selectable driver choices at start
- Random event cards between races
- Permanent skill unlocks between runs
- Different team archetypes with unique bonuses
- Variable season lengths

### UI/UX
- Lap-by-lap replay system
- Advanced telemetry telemetry graphs
- Weather radar overlay
- Real-time gap calculations to other cars
- Customizable UI layouts
- Mobile optimization

### Content
- 20+ circuit variations
- 50+ driver archetypes
- 100+ upgrade combinations
- Dynamic difficulty scaling
- Achievement/trophy system
- Leaderboard support

### Technical
- Asynchronous multiplayer spectating
- Replay file format and sharing
- Advanced telemetry export
- Deterministic race seeding for reproducibility

## Running the Game

1. Open `index.html` in a browser
2. Click "House of Hedaux" banner if needed
3. Navigate to Games Room
4. Click "Rogue Racing Manager" card or link
5. Wait for game to load
6. Race! Use radio commands and ERS modes to influence lap times
7. Progress through 10-lap races

## Browser Requirements
- Modern browser with ES6 module support
- LocalStorage API for save game functionality
- CSS Grid and Flexbox support
- SVG rendering support

## File Structure
```
HouseOfHedaux2.0/
├── index.html                    # Main page with all games room markup
├── games/
│   ├── life-sim.js              # Existing life simulation game
│   └── racing-manager.js        # Rogue Racing Manager game logic
└── ROGUE_RACING_MANAGER.md      # This documentation
```

## Development Notes

### Code Organization
The racing-manager.js follows class-based, modular architecture:
- Each system (Driver, Car, Track, Race) is self-contained
- Clear separation between data (models) and presentation (UI)
- Minimal dependencies - game runs entirely in-browser
- Deterministic simulation for consistent race outcomes

### Key Design Decisions
1. **No external dependencies**: Pure JavaScript for portability
2. **LocalStorage only**: No server communication in Phase 1
3. **Modular classes**: Easy to extend with new systems
4. **Responsive layout**: Works on tablet and desktop
5. **Accessible colors**: WCAG compliant contrast ratios
6. **Performance**: Lightweight SVG and DOM updates

### Testing Checklist
- [ ] Game loads without console errors
- [ ] Driver generated with valid stats and traits
- [ ] Race simulation completes 10 laps
- [ ] Lap times vary realistically
- [ ] Radio commands affect lap times correctly
- [ ] ERS modes consume/generate battery
- [ ] Tyres wear throughout race
- [ ] Weather changes grip level
- [ ] Results screen shows correct calculations
- [ ] Save/load preserves game state
- [ ] UI responsive on 1024px+ width
- [ ] All buttons have hover states

## Credits

Game design and development by Nathan Hedaux as part of House of Hedaux project.
Inspired by: Formula 1, Motorsport Manager, Balatro, Slay the Spire, and "A Day in the Life".

---

**Last Updated**: Phase 1 Release
**Status**: Playable Prototype
**Next Phase**: Multi-race seasons, random events, permanent progression
