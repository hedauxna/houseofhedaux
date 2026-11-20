/**
 * Rogue Racing Manager - Live Race Control Centre
 * Phase 2: Live race simulation, multi-car racing, real track layouts, immersive experience
 */

class Driver {
  constructor(name, traits, stats, number) {
    this.name = name;
    this.traits = traits;
    this.stats = { ...stats };
    this.number = number; // Driver number for display
    this.mood = 'neutral';
    this.confidence = 50 + Math.random() * 50;
    this.tyreWear = 0;
    this.tyreType = 'medium'; // soft, medium, hard, wet, intermediate
    this.fuelLevel = 100;
    this.batteryCharge = 100;
    this.errors = 0;
    this.position = 1;
    this.gapToLeader = 0;
    this.lastLap = 0;
    this.bestLap = 0;
    this.currentSector = 1;
    this.reliability = 100;
  }

  updateTyreWear(delta) {
    this.tyreWear = Math.min(100, this.tyreWear + delta);
  }

  updateFuel(delta) {
    this.fuelLevel = Math.max(0, this.fuelLevel + delta);
  }

  updateBattery(delta) {
    this.batteryCharge = Math.max(0, this.batteryCharge + delta);
  }

  updateConfidence(delta) {
    this.confidence = Math.max(0, Math.min(100, this.confidence + delta));
  }

  makeError() {
    if (Math.random() < this.stats.consistency) {
      this.errors += 1;
      this.updateConfidence(-10);
      return true;
    }
    return false;
  }
}

class Car {
  constructor() {
    this.engine = 50;
    this.aero = 50;
    this.battery = 50;
    this.reliability = 50;
    this.pitCrew = 50;
  }

  getOverallPerformance() {
    return (this.engine + this.aero + this.battery + this.reliability + this.pitCrew) / 5;
  }

  applyUpgrade(upgrade) {
    const upgradeMap = {
      'engine': 'engine',
      'aero': 'aero',
      'battery': 'battery',
      'reliability': 'reliability',
      'pit-crew': 'pitCrew'
    };
    if (upgradeMap[upgrade.type]) {
      this[upgradeMap[upgrade.type]] = Math.min(100, this[upgradeMap[upgrade.type]] + upgrade.value);
    }
  }
}

class Track {
  constructor(name, lapLength, corners, difficulty, svgPath) {
    this.name = name;
    this.lapLength = lapLength; // in km
    this.corners = corners;
    this.difficulty = difficulty; // 1-5
    this.svgPath = svgPath; // SVG path for track visualization
    this.weather = 'sunny';
    this.gripLevel = 1.0;
    this.temperature = 20;
    this.trackTemp = 40;
    this.rainChance = 0;
    this.weatherStates = ['sunny', 'cloudy', 'overcast', 'light-rain', 'heavy-rain', 'storm'];
    this.weatherTransition = 0; // 0-1, smooth transitions
  }

  updateWeather() {
    const roll = Math.random();
    if (roll < 0.4) this.weather = 'sunny';
    else if (roll < 0.6) this.weather = 'cloudy';
    else if (roll < 0.75) this.weather = 'overcast';
    else if (roll < 0.85) this.weather = 'light-rain';
    else if (roll < 0.95) this.weather = 'heavy-rain';
    else this.weather = 'storm';

    this.updateGrip();
    this.updateTemperature();
  }

  updateGrip() {
    const gripMap = {
      'sunny': 1.0,
      'cloudy': 0.98,
      'overcast': 0.95,
      'light-rain': 0.80,
      'heavy-rain': 0.65,
      'storm': 0.50
    };
    this.gripLevel = gripMap[this.weather] || 1.0;
    this.rainChance = this.gripLevel < 0.9 ? (1 - this.gripLevel) * 100 : 0;
  }

  updateTemperature() {
    const tempBase = { 'sunny': 25, 'cloudy': 20, 'overcast': 18, 'light-rain': 15, 'heavy-rain': 12, 'storm': 10 };
    this.temperature = (tempBase[this.weather] || 20) + (Math.random() - 0.5) * 2;
    this.trackTemp = this.temperature + 15 + (Math.random() - 0.5) * 5;
  }

  getWeatherIcon() {
    const icons = {
      'sunny': '☀️',
      'cloudy': '☁️',
      'overcast': '☁️☁️',
      'light-rain': '🌧️',
      'heavy-rain': '⛈️',
      'storm': '⛈️⛈️'
    };
    return icons[this.weather] || '☀️';
  }
}

class Lap {
  constructor(lapNumber, timeMs, sector1, sector2, sector3) {
    this.lapNumber = lapNumber;
    this.timeMs = timeMs;
    this.sector1 = sector1;
    this.sector2 = sector2;
    this.sector3 = sector3;
    this.tyreType = 'medium';
    this.weather = 'clear';
    this.isValid = true;
  }

  formatTime() {
    const totalSeconds = Math.floor(this.timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = this.timeMs % 1000;
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(Math.floor(ms / 10)).padStart(2, '0')}`;
  }
}

class RaceSimulation {
  constructor(driver, car, track, gridPosition = 1) {
    this.driver = driver;
    this.car = car;
    this.track = track;
    this.position = gridPosition;
    this.laps = [];
    this.currentLapNumber = 1;
    this.raceTime = 0;
    this.isComplete = false;
    this.results = {
      position: gridPosition,
      pointsEarned: 0,
      money: 0,
      reliability: 100
    };
  }

  generateLapTime() {
    const baseTime = this.track.lapLength * 60000 / (100 + this.car.getOverallPerformance() * 0.5);
    const driverModifier = (this.driver.stats.pace / 50 - 1);
    const weatherModifier = this.track.gripLevel;
    const tyreModifier = 1 + (this.driver.tyreWear / 100) * 0.3;
    const fuelModifier = this.driver.fuelLevel < 20 ? 1.1 : 1.0;
    
    const variance = (Math.random() - 0.5) * baseTime * 0.08;
    const lapTime = baseTime * (1 + driverModifier * 0.1) * weatherModifier * tyreModifier * fuelModifier + variance;

    return Math.max(baseTime * 0.8, Math.floor(lapTime));
  }

  generateSectorTimes(lapTime) {
    const sector1 = Math.floor(lapTime * (0.3 + Math.random() * 0.05));
    const sector2 = Math.floor(lapTime * (0.3 + Math.random() * 0.05));
    const sector3 = lapTime - sector1 - sector2;
    return { sector1, sector2, sector3 };
  }

  simulateLap(radioCommand = 'standard', ersMode = 'normal', pitThisLap = false) {
    const baseTime = this.generateLapTime();
    
    let timeAdjustment = 0;
    if (radioCommand === 'push') timeAdjustment = -50;
    if (radioCommand === 'save-tyres') timeAdjustment = 100;
    if (radioCommand === 'attack') timeAdjustment = -100;
    if (radioCommand === 'defend') timeAdjustment = 50;
    
    if (ersMode === 'full') timeAdjustment -= 60;
    if (ersMode === 'harvest') timeAdjustment += 40;

    if (radioCommand === 'push' && Math.random() < 0.15) {
      this.driver.makeError();
      timeAdjustment += 300;
    }

    const finalTime = Math.max(baseTime + timeAdjustment, baseTime * 0.7);
    const { sector1, sector2, sector3 } = this.generateSectorTimes(finalTime);

    const lap = new Lap(this.currentLapNumber, finalTime, sector1, sector2, sector3);

    this.driver.updateTyreWear(2 + (radioCommand === 'push' ? 3 : 0));
    this.driver.updateFuel(-1.5 + (radioCommand === 'save-tyres' ? -0.5 : 0));
    if (ersMode === 'full') this.driver.updateBattery(-8);
    if (ersMode === 'harvest') this.driver.updateBattery(3);

    if (this.driver.fuelLevel <= 0 || this.driver.batteryCharge <= 0) {
      lap.isValid = false;
      this.results.reliability -= 25;
    }

    this.laps.push(lap);
    this.currentLapNumber += 1;
    this.raceTime += finalTime;

    return lap;
  }

  getFastestLap() {
    if (this.laps.length === 0) return null;
    return this.laps.reduce((fastest, lap) => lap.timeMs < fastest.timeMs ? lap : fastest);
  }

  completeRace() {
    this.isComplete = true;
    const pointsScale = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    this.results.pointsEarned = pointsScale[Math.max(0, Math.min(9, this.position - 1))] || 0;
    this.results.money = Math.floor(this.results.pointsEarned * 50 + Math.random() * 100);
    this.results.reliability = Math.max(0, this.results.reliability);
  }
}

class Team {
  constructor(archetype = 'balanced') {
    this.archetype = archetype;
    this.money = 500000;
    this.reputation = 0;
    this.championshipPoints = 0;
    this.inventory = [];
  }
}

class Upgrade {
  static generateRandom() {
    const types = ['engine', 'aero', 'battery', 'reliability', 'pit-crew'];
    const descriptions = {
      'engine': 'Engine Power: +5%',
      'aero': 'Aerodynamics: +5%',
      'battery': 'Battery Capacity: +5%',
      'reliability': 'Car Reliability: +5%',
      'pit-crew': 'Pit Crew Speed: +5%'
    };
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      type,
      value: 5,
      description: descriptions[type],
      rarity: ['common', 'rare', 'epic'][Math.floor(Math.random() * 3)]
    };
  }

  static generateThreeOptions() {
    return [Upgrade.generateRandom(), Upgrade.generateRandom(), Upgrade.generateRandom()];
  }
}

class GameState {
  constructor() {
    this.season = 1;
    this.raceNumber = 1;
    this.driver = null;
    this.car = new Car();
    this.team = new Team();
    this.races = [];
    this.upgrades = [];
  }

  startNewRun() {
    this.driver = this.generateDriver();
    this.car = new Car();
    this.team = new Team();
    this.races = [];
    this.upgrades = [];
    this.season = 1;
    this.raceNumber = 1;
  }

  generateDriver() {
    const firstNames = ['Lewis', 'Max', 'Lando', 'Carlos', 'Oscar', 'George', 'Fernando', 'Yuki', 'Sergio', 'Lance'];
    const lastNames = ['Johnson', 'Martinez', 'Anderson', 'Taylor', 'Williams', 'Brown', 'Garcia', 'Miller', 'Davis', 'Rodriguez'];
    
    const traits = this.getRandomTraits();
    const stats = {
      pace: 30 + Math.random() * 40,
      consistency: 0.7 + Math.random() * 0.2,
      experience: Math.random() * 100,
      racecraft: Math.random() * 100
    };

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return new Driver(`${firstName} ${lastName}`, traits, stats);
  }

  getRandomTraits() {
    const allTraits = [
      { name: 'Aggressive', effect: '+15% Pace, -10% Consistency' },
      { name: 'Defensive', effect: '+15% Consistency, -10% Pace' },
      { name: 'Determined', effect: '+10% Recovery in adverse conditions' },
      { name: 'Adaptable', effect: 'Better in changing weather' },
      { name: 'Confident', effect: '+5% all stats when ahead' },
      { name: 'Cautious', effect: 'Fewer errors, slower in qualifying' }
    ];
    return [allTraits[Math.floor(Math.random() * allTraits.length)]];
  }

  save() {
    const saveData = {
      season: this.season,
      raceNumber: this.raceNumber,
      driverName: this.driver?.name,
      driverStats: this.driver?.stats,
      carStats: this.car,
      teamData: this.team,
      raceResults: this.races.map(r => ({ position: r.results.position, points: r.results.pointsEarned }))
    };
    localStorage.setItem('rrm-save-game', JSON.stringify(saveData));
    return saveData;
  }

  load() {
    const saved = localStorage.getItem('rrm-save-game');
    if (saved) {
      const data = JSON.parse(saved);
      this.season = data.season;
      this.raceNumber = data.raceNumber;
      return true;
    }
    return false;
  }
}

class RaceScreenUI {
  constructor(rootElement, gameState, raceSimulation, track) {
    this.root = rootElement;
    this.gameState = gameState;
    this.race = raceSimulation;
    this.track = track;
    this.updateInterval = null;
  }

  render() {
    const html = `
      <div class="rrm-container" data-rrm-screen="race">
        <header class="rrm-header">
          <div class="rrm-header-left">
            <h2 class="rrm-race-title">${this.track.name}</h2>
            <div class="rrm-race-meta">
              <span class="rrm-lap-info">Lap <span data-lap-number>${this.race.currentLapNumber}</span>/10</span>
              <span class="rrm-weather-badge" data-weather="${this.track.weather}">${this.track.weather.toUpperCase()}</span>
            </div>
          </div>
          <div class="rrm-header-right">
            <div class="rrm-championship-position">
              <span class="rrm-label">Position</span>
              <span class="rrm-value" data-position>${this.race.position}th</span>
            </div>
          </div>
        </header>

        <div class="rrm-main-layout">
          <aside class="rrm-driver-panel">
            <div class="rrm-driver-info">
              <h3>${this.race.driver.name}</h3>
              <div class="rrm-driver-traits">
                ${this.race.driver.traits.map(t => `<span class="rrm-trait-badge">${t.name}</span>`).join('')}
              </div>
            </div>
            <div class="rrm-car-condition">
              <div class="rrm-status-bar">
                <label>Tyres</label>
                <div class="rrm-bar-background">
                  <div class="rrm-bar-fill" style="width: ${100 - this.race.driver.tyreWear}%; background: ${this.getBarColor(100 - this.race.driver.tyreWear)}"></div>
                </div>
                <span>${Math.floor(this.race.driver.tyreWear)}%</span>
              </div>
              <div class="rrm-status-bar">
                <label>Fuel</label>
                <div class="rrm-bar-background">
                  <div class="rrm-bar-fill" style="width: ${this.race.driver.fuelLevel}%; background: #80c9f3"></div>
                </div>
                <span>${Math.floor(this.race.driver.fuelLevel)}%</span>
              </div>
              <div class="rrm-status-bar">
                <label>Battery</label>
                <div class="rrm-bar-background">
                  <div class="rrm-bar-fill" style="width: ${this.race.driver.batteryCharge}%; background: #2ecc71"></div>
                </div>
                <span>${Math.floor(this.race.driver.batteryCharge)}%</span>
              </div>
            </div>
          </aside>

          <div class="rrm-track-view">
            <svg class="rrm-track-map" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
              ${this.renderTrackMap()}
            </svg>
            <div class="rrm-track-info">
              <p><strong>${this.track.lapLength}km</strong> • <strong>${this.track.corners}</strong> corners</p>
            </div>
          </div>

          <aside class="rrm-timing-panel">
            <h4>Live Timing</h4>
            <div class="rrm-timing-tower">
              <div class="rrm-timing-row">
                <span class="rrm-timing-col rrm-col-pos">${this.race.position}</span>
                <span class="rrm-timing-col rrm-col-driver">${this.race.driver.name}</span>
                <span class="rrm-timing-col rrm-col-gap">+0.0s</span>
                <span class="rrm-timing-col rrm-col-last">${this.race.laps.length > 0 ? this.race.laps[this.race.laps.length - 1].formatTime() : '--:--'}</span>
                <span class="rrm-timing-col rrm-col-best">${this.race.getFastestLap()?.formatTime() || '--:--'}</span>
              </div>
            </div>
            <div class="rrm-fastest-lap" data-fastest-lap>
              ${this.race.getFastestLap() ? `<span class="rrm-fl-badge">🏁 Fastest</span> ${this.race.getFastestLap().formatTime()}` : ''}
            </div>
          </aside>
        </div>

        <div class="rrm-command-deck">
          <div class="rrm-command-section">
            <label>Radio</label>
            <div class="rrm-command-buttons">
              <button class="rrm-btn rrm-btn-command" data-command="push">PUSH</button>
              <button class="rrm-btn rrm-btn-command rrm-btn-active" data-command="standard">STANDARD</button>
              <button class="rrm-btn rrm-btn-command" data-command="save-tyres">SAVE TYRES</button>
              <button class="rrm-btn rrm-btn-command" data-command="attack">ATTACK</button>
              <button class="rrm-btn rrm-btn-command" data-command="defend">DEFEND</button>
            </div>
          </div>

          <div class="rrm-command-section">
            <label>ERS Mode</label>
            <div class="rrm-command-buttons">
              <button class="rrm-btn rrm-btn-ers" data-ers="full">FULL</button>
              <button class="rrm-btn rrm-btn-ers rrm-btn-active" data-ers="normal">NORMAL</button>
              <button class="rrm-btn rrm-btn-ers" data-ers="harvest">HARVEST</button>
            </div>
          </div>

          <div class="rrm-command-section">
            <button class="rrm-btn rrm-btn-primary" data-action="next-lap">Next Lap</button>
          </div>
        </div>
      </div>
    `;

    this.root.innerHTML = html;
    this.attachEventListeners();
  }

  renderTrackMap() {
    const trackMaps = {
      'Silverstone': 'M50,30 L80,35 L85,60 L70,80 L50,75 L40,90 L30,80 L35,50 Z',
      'Monaco': 'M60,40 L75,50 L78,70 L65,85 L45,88 L40,70 L50,55 Z',
      'Monza': 'M50,25 L85,50 L90,85 L50,90 L30,70 L35,40 Z',
      'Spa-Francorchamps': 'M45,30 L80,45 L85,70 L60,88 L35,75 L40,50 Z'
    };

    const pathData = trackMaps[this.track.name] || trackMaps['Silverstone'];
    return `<path d="${pathData}" class="rrm-track-line" fill="none" stroke="#00bfff" stroke-width="3"/>
            <circle cx="60" cy="50" r="4" class="rrm-driver-marker" fill="#ff6b6b"/>`;
  }

  getBarColor(percentage) {
    if (percentage > 70) return '#2ecc71';
    if (percentage > 40) return '#f39c12';
    return '#e74c3c';
  }

  attachEventListeners() {
    const nextLapBtn = this.root.querySelector('[data-action="next-lap"]');
    const commandBtns = this.root.querySelectorAll('[data-command]');
    const ersBtns = this.root.querySelectorAll('[data-ers]');

    let selectedCommand = 'standard';
    let selectedErs = 'normal';

    commandBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        commandBtns.forEach(b => b.classList.remove('rrm-btn-active'));
        btn.classList.add('rrm-btn-active');
        selectedCommand = btn.dataset.command;
      });
    });

    ersBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        ersBtns.forEach(b => b.classList.remove('rrm-btn-active'));
        btn.classList.add('rrm-btn-active');
        selectedErs = btn.dataset.ers;
      });
    });

    nextLapBtn?.addEventListener('click', () => {
      this.race.simulateLap(selectedCommand, selectedErs);
      
      if (this.race.currentLapNumber > 10) {
        this.race.completeRace();
        this.showRaceResults();
      } else {
        this.render();
      }
    });
  }

  showRaceResults() {
    const resultsHtml = `
      <div class="rrm-race-results">
        <h2>Race Complete</h2>
        <div class="rrm-result-summary">
          <p><strong>Finishing Position:</strong> ${this.race.results.position}</p>
          <p><strong>Points Earned:</strong> ${this.race.results.pointsEarned}</p>
          <p><strong>Money Earned:</strong> £${this.race.results.money.toLocaleString()}</p>
          <p><strong>Best Lap:</strong> ${this.race.getFastestLap()?.formatTime()}</p>
          <p><strong>Laps Completed:</strong> ${this.race.laps.filter(l => l.isValid).length}/10</p>
        </div>
        <button class="rrm-btn rrm-btn-primary" data-action="continue">Continue</button>
      </div>
    `;
    this.root.innerHTML = resultsHtml;
  }
}

class LiveRaceScreenUI extends RaceScreenUI {
  constructor(rootElement, gameState, raceSimulation, track) {
    super(rootElement, gameState, raceSimulation, track);
    this.isRaceRunning = false;
    this.isPaused = false;
    this.raceSpeed = 1;
    this.selectedCommand = 'standard';
    this.selectedErs = 'normal';
    this.selectedTyre = 'medium';
    this.lastUpdateTime = 0;
    this.showStartSequence = true;
    this.eventLog = [];
  }

  renderStartSequence() {
    const html = `
      <div class="rrm-container" data-rrm-screen="start-sequence">
        <div class="rrm-start-sequence">
          <div class="rrm-start-title">
            <h2>${this.track.name}</h2>
            <p>${this.race.driver.name} #${this.race.driver.number}</p>
          </div>
          
          <div class="rrm-grid-lights">
            <div class="rrm-light" data-light="1"></div>
            <div class="rrm-light" data-light="2"></div>
            <div class="rrm-light" data-light="3"></div>
            <div class="rrm-light" data-light="4"></div>
            <div class="rrm-light" data-light="5"></div>
          </div>
          
          <div class="rrm-sequence-info">
            <p>Get ready for the race start</p>
            <p class="rrm-drivers-info">20 drivers | ${this.track.weather.toUpperCase()}</p>
          </div>
        </div>
      </div>
    `;
    
    this.root.innerHTML = html;
    this.animateStartLights();
  }

  animateStartLights() {
    const lights = this.root.querySelectorAll('.rrm-light');
    let lightIndex = 0;
    
    const lightSequence = () => {
      if (lightIndex < 5) {
        lights[lightIndex].classList.add('rrm-light-on');
        lightIndex++;
        setTimeout(lightSequence, 400);
      } else {
        setTimeout(() => {
          this.showStartSequence = false;
          this.isRaceRunning = true;
          this.render();
          this.startRaceLoop();
        }, 500);
      }
    };
    
    setTimeout(lightSequence, 500);
  }

  renderLiveRace() {
    const html = `
      <div class="rrm-container" data-rrm-screen="live-race">
        <header class="rrm-header">
          <div class="rrm-header-left">
            <h2 class="rrm-race-title">${this.track.name}</h2>
            <div class="rrm-race-meta">
              <span class="rrm-lap-info">Lap <span data-lap-number>${this.race.currentLapNumber}</span>/10</span>
              <span class="rrm-weather-badge" data-weather="${this.track.weather}">${this.track.weather.toUpperCase()}</span>
              <span class="rrm-status-badge" data-status="${this.isPaused ? 'paused' : 'live'}">${this.isPaused ? 'PAUSED' : 'LIVE'}</span>
            </div>
          </div>
          <div class="rrm-header-right">
            <div class="rrm-championship-position">
              <span class="rrm-label">Position</span>
              <span class="rrm-value" data-position>${this.race.position}th</span>
            </div>
            <div class="rrm-race-controls">
              <button class="rrm-btn rrm-btn-small" data-action="play-pause">${this.isPaused ? '▶' : '⏸'}</button>
              <select class="rrm-speed-control" data-action="speed-select">
                <option value="1" ${this.raceSpeed === 1 ? 'selected' : ''}>1x</option>
                <option value="2" ${this.raceSpeed === 2 ? 'selected' : ''}>2x</option>
                <option value="4" ${this.raceSpeed === 4 ? 'selected' : ''}>4x</option>
                <option value="8" ${this.raceSpeed === 8 ? 'selected' : ''}>8x</option>
              </select>
            </div>
          </div>
        </header>

        <div class="rrm-main-layout">
          <aside class="rrm-driver-panel">
            <div class="rrm-driver-info">
              <h3>${this.race.driver.name}</h3>
              <div class="rrm-driver-traits">
                ${this.race.driver.traits.map(t => `<span class="rrm-trait-badge">${t.name}</span>`).join('')}
              </div>
              <div class="rrm-driver-stats">
                <div class="rrm-stat-line">
                  <span class="rrm-stat-label">Confidence</span>
                  <span class="rrm-stat-value">${Math.floor(this.race.driver.confidence)}%</span>
                </div>
                <div class="rrm-stat-line">
                  <span class="rrm-stat-label">Gap to Leader</span>
                  <span class="rrm-stat-value">${this.race.driver.gapToLeader > 0 ? '+' : ''}${this.race.driver.gapToLeader.toFixed(1)}s</span>
                </div>
              </div>
            </div>
            
            <div class="rrm-car-condition">
              <div class="rrm-status-bar">
                <label>Tyres</label>
                <div class="rrm-bar-background">
                  <div class="rrm-bar-fill" style="width: ${100 - this.race.driver.tyreWear}%; background: ${this.getBarColor(100 - this.race.driver.tyreWear)}"></div>
                </div>
                <span>${Math.floor(this.race.driver.tyreWear)}%</span>
              </div>
              <div class="rrm-status-bar">
                <label>Fuel</label>
                <div class="rrm-bar-background">
                  <div class="rrm-bar-fill" style="width: ${this.race.driver.fuelLevel}%; background: #80c9f3"></div>
                </div>
                <span>${Math.floor(this.race.driver.fuelLevel)}%</span>
              </div>
              <div class="rrm-status-bar">
                <label>Battery</label>
                <div class="rrm-bar-background">
                  <div class="rrm-bar-fill" style="width: ${this.race.driver.batteryCharge}%; background: #2ecc71"></div>
                </div>
                <span>${Math.floor(this.race.driver.batteryCharge)}%</span>
              </div>
              <div class="rrm-status-bar">
                <label>Reliability</label>
                <div class="rrm-bar-background">
                  <div class="rrm-bar-fill" style="width: ${this.race.driver.reliability}%; background: #f39c12"></div>
                </div>
                <span>${Math.floor(this.race.driver.reliability)}%</span>
              </div>
            </div>
          </aside>

          <div class="rrm-track-view">
            <svg class="rrm-track-map" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
              ${this.renderTrackMap()}
            </svg>
            <div class="rrm-track-info">
              <p><strong>${this.track.lapLength}km</strong> • <strong>${this.track.corners}</strong> corners • Grip: ${(this.track.gripLevel * 100).toFixed(0)}%</p>
            </div>
          </div>

          <aside class="rrm-timing-panel">
            <h4>Live Timing</h4>
            <div class="rrm-standings">
              ${this.renderStandings()}
            </div>
            <div class="rrm-fastest-lap" data-fastest-lap>
              ${this.race.getFastestLap() ? `<span class="rrm-fl-badge">🏁</span> ${this.race.getFastestLap().formatTime()}` : 'No fastest lap yet'}
            </div>
          </aside>
        </div>

        <div class="rrm-event-feed">
          <h4>Race Events</h4>
          <div class="rrm-event-list">
            ${this.eventLog.slice(-5).reverse().map(e => `<p class="rrm-event-item" style="color: ${e.type === 'green' ? '#2ecc71' : '#f39c12'}">Lap ${e.lap}: ${e.message}</p>`).join('')}
          </div>
        </div>

        <div class="rrm-command-deck">
          <div class="rrm-command-section">
            <label>Radio</label>
            <div class="rrm-command-buttons">
              <button class="rrm-btn rrm-btn-command ${this.selectedCommand === 'push' ? 'rrm-btn-active' : ''}" data-command="push">PUSH</button>
              <button class="rrm-btn rrm-btn-command ${this.selectedCommand === 'standard' ? 'rrm-btn-active' : ''}" data-command="standard">STANDARD</button>
              <button class="rrm-btn rrm-btn-command ${this.selectedCommand === 'save-tyres' ? 'rrm-btn-active' : ''}" data-command="save-tyres">SAVE TYRES</button>
              <button class="rrm-btn rrm-btn-command ${this.selectedCommand === 'attack' ? 'rrm-btn-active' : ''}" data-command="attack">ATTACK</button>
              <button class="rrm-btn rrm-btn-command ${this.selectedCommand === 'defend' ? 'rrm-btn-active' : ''}" data-command="defend">DEFEND</button>
            </div>
          </div>

          <div class="rrm-command-section">
            <label>ERS</label>
            <div class="rrm-command-buttons">
              <button class="rrm-btn rrm-btn-ers ${this.selectedErs === 'full' ? 'rrm-btn-active' : ''}" data-ers="full">FULL</button>
              <button class="rrm-btn rrm-btn-ers ${this.selectedErs === 'normal' ? 'rrm-btn-active' : ''}" data-ers="normal">NORMAL</button>
              <button class="rrm-btn rrm-btn-ers ${this.selectedErs === 'harvest' ? 'rrm-btn-active' : ''}" data-ers="harvest">HARVEST</button>
            </div>
          </div>

          <div class="rrm-command-section">
            <label>Pit Tyres</label>
            <div class="rrm-command-buttons">
              <button class="rrm-btn ${this.selectedTyre === 'soft' ? 'rrm-btn-active' : ''}" data-tyre="soft">SOFT</button>
              <button class="rrm-btn ${this.selectedTyre === 'medium' ? 'rrm-btn-active' : ''}" data-tyre="medium">MED</button>
              <button class="rrm-btn ${this.selectedTyre === 'hard' ? 'rrm-btn-active' : ''}" data-tyre="hard">HARD</button>
              <button class="rrm-btn ${this.selectedTyre === 'wet' ? 'rrm-btn-active' : ''}" data-tyre="wet">WET</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.root.innerHTML = html;
    this.attachLiveEventListeners();
  }

  renderStandings() {
    const standings = [this.race.driver, ...this.race.competitors].slice(0, 5)
      .sort((a, b) => a.position - b.position);
    
    return standings.map((driver, idx) => `
      <div class="rrm-timing-row" ${driver === this.race.driver ? 'style="background: rgba(0, 191, 255, 0.1); border-left-color: #2ecc71;"' : ''}>
        <span class="rrm-timing-col rrm-col-pos">${driver.position}</span>
        <span class="rrm-timing-col rrm-col-driver">${driver.name}</span>
        <span class="rrm-timing-col rrm-col-gap">${driver.position === 1 ? 'LEADER' : '+' + driver.gapToLeader.toFixed(1)}</span>
        <span class="rrm-timing-col rrm-col-last">${driver.lastLap ? (driver.lastLap / 1000).toFixed(2) : '--:--'}</span>
        <span class="rrm-timing-col rrm-col-best">${driver.bestLap ? (driver.bestLap / 1000).toFixed(2) : '--:--'}</span>
      </div>
    `).join('');
  }

  attachLiveEventListeners() {
    const commandBtns = this.root.querySelectorAll('[data-command]');
    const ersBtns = this.root.querySelectorAll('[data-ers]');
    const tyreBtns = this.root.querySelectorAll('[data-tyre]');
    const playPauseBtn = this.root.querySelector('[data-action="play-pause"]');
    const speedSelect = this.root.querySelector('[data-action="speed-select"]');

    commandBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        commandBtns.forEach(b => b.classList.remove('rrm-btn-active'));
        btn.classList.add('rrm-btn-active');
        this.selectedCommand = btn.dataset.command;
      });
    });

    ersBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        ersBtns.forEach(b => b.classList.remove('rrm-btn-active'));
        btn.classList.add('rrm-btn-active');
        this.selectedErs = btn.dataset.ers;
      });
    });

    tyreBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tyreBtns.forEach(b => b.classList.remove('rrm-btn-active'));
        btn.classList.add('rrm-btn-active');
        this.selectedTyre = btn.dataset.tyre;
      });
    });

    playPauseBtn?.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      this.renderLiveRace();
    });

    speedSelect?.addEventListener('change', (e) => {
      this.raceSpeed = parseInt(e.target.value);
    });
  }

  startRaceLoop() {
    const simulateFrame = () => {
      if (!this.isPaused && this.isRaceRunning) {
        const now = performance.now();
        if (!this.lastUpdateTime) this.lastUpdateTime = now;
        
        const deltaTime = (now - this.lastUpdateTime) / 1000 * this.raceSpeed;
        this.lastUpdateTime = now;
        
        // Simulate a lap approximately every 500ms
        if (deltaTime > 0.5) {
          this.race.simulateLap(this.selectedCommand, this.selectedErs);
          this.addEvent(`Lap ${this.race.currentLapNumber - 1} completed`, 'green');
          this.lastUpdateTime = now;
          
          if (this.race.currentLapNumber > 10) {
            this.race.completeRace();
            this.isRaceRunning = false;
            this.showRaceResults();
            return;
          }
          
          this.renderLiveRace();
        }
      }
      
      if (this.isRaceRunning) {
        requestAnimationFrame(simulateFrame);
      }
    };
    
    requestAnimationFrame(simulateFrame);
  }

  addEvent(message, type = 'info') {
    this.eventLog.push({
      lap: this.race.currentLapNumber,
      message,
      type
    });
  }

  render() {
    if (this.showStartSequence) {
      this.renderStartSequence();
    } else {
      this.renderLiveRace();
    }
  }
}

export function mountRacingManager(rootElement) {
  const gameState = new GameState();
  gameState.startNewRun();

  const tracks = [
    new Track('Silverstone', 5.891, 18, 3),
    new Track('Monaco', 3.337, 19, 4),
    new Track('Monza', 5.793, 11, 2),
    new Track('Spa-Francorchamps', 7.004, 25, 4)
  ];

  const selectedTrack = tracks[0];
  selectedTrack.updateWeather();

  const raceSimulation = new RaceSimulation(gameState.driver, gameState.car, selectedTrack, 1);
  
  // Create AI competitors
  raceSimulation.competitors = [];
  for (let i = 2; i <= 20; i++) {
    const aiDriver = gameState.generateDriver();
    aiDriver.number = i;
    aiDriver.position = i;
    raceSimulation.competitors.push(aiDriver);
  }

  const raceScreen = new LiveRaceScreenUI(rootElement, gameState, raceSimulation, selectedTrack);
  raceScreen.render();

  return { gameState, raceSimulation, raceScreen };
}
