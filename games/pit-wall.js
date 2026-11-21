/**
 * Pit Wall - A roguelike race engineering simulator
 * Phase 0: Engineering Console Foundation
 * 
 * This module creates the permanent engineering screen layout.
 * No simulation systems exist yet. Layout is fixed and stable.
 */

class PitWallConsole {
  constructor(rootElement) {
    this.rootElement = rootElement;
  }

  mount() {
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
          </div>
        </header>

        <!-- Main Layout -->
        <div class="pit-wall-layout">
          <!-- Left Panel: Driver/Team Information -->
          <aside class="pit-wall-panel pit-wall-panel-left">
            <div class="pit-wall-panel-header">
              <h3>Driver</h3>
            </div>
            <div class="pit-wall-panel-content">
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
              <div class="pit-wall-placeholder-block">
                <p class="pit-wall-placeholder-label">Timing Panel</p>
                <p class="pit-wall-placeholder-info">Live race data and statistics will appear here</p>
              </div>
            </div>
          </aside>
        </div>

        <!-- Bottom Panel: Command Centre -->
        <footer class="pit-wall-panel pit-wall-panel-bottom">
          <div class="pit-wall-panel-header">
            <h3>Command Centre</h3>
            <button class="pit-wall-quit-button" title="Return to Games Room" data-action="quit-game">
              <svg class="pit-wall-quit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          </div>
          <div class="pit-wall-panel-content">
            <div class="pit-wall-placeholder-block">
              <p class="pit-wall-placeholder-label">Radio & Strategy Controls</p>
              <p class="pit-wall-placeholder-info">Strategic commands and radio instructions will appear here</p>
            </div>
          </div>
        </footer>
      </div>
    `;
  }
}

export { PitWallConsole };
