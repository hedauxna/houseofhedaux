# Games Room Life Sim

The life sim is a browser-only prototype available on the live site. In the Games Room, choose **A Day in the Life** to open it. It runs in the browser and does not send game state to a server.

## Run it locally

In VS Code:

1. Open the `HouseOfHedaux2.0` repository folder.
2. Install the **Live Server** extension if it is not already installed.
3. In Explorer, right-click `index.html` and choose **Open with Live Server**.
4. Open the local URL shown by VS Code, usually <http://127.0.0.1:5500/>.

Use the local server to test changes before publishing. Keep the server running while testing; a browser `ERR_CONNECTION_REFUSED` means the server is stopped or you opened the wrong port.

Alternatively, open a terminal in the repository folder and run `py -m http.server 8000`, then open <http://localhost:8000/>. This requires the Python Launcher for Windows. Stop either server with `Ctrl+C` in its terminal.

The simulation runs for 365 days with eight stages: **Early Morning**, **Morning Routine**, **Morning Activity**, **Afternoon Routine**, **Afternoon Activity**, **Evening Routine**, **Evening Activity**, and **Night**. Wake up or stay in bed; then make one choice at each routine and activity stage. Staying in bed skips the morning routine and activity and moves directly to the afternoon. Night advances to the next day, and the 365th night ends the year. Overtime removes **Sleep Early** from that night's choices, and staying up late applies an energy penalty the following morning.

Money is shown first in the status panel, followed by Health, Energy, Hunger, Happiness, Stress, Confidence, Intelligence, and Hygiene. Hunger is a visible 0–100 meter where 100 means fully fed; it falls by 10 in the morning, 15 in the afternoon, 15 in the evening, and 10 at night, while meals restore it. Low Hunger reduces sleep recovery, mood, study gains, application chances, and work pay. Stat colors adapt to each value, with Stress using an inverse scale. Routines, activities, starter jobs, random encounters, and daily risks are defined in data arrays in `games/life-sim.js`. New entries can reuse the existing stage, effects, conditions, and event data rather than adding one-off rendering code. Jobs define income, energy cost, and base stress independently; confidence and happiness can reduce work stress, while low energy, high stress, and consecutive workdays increase it.

Stress and hygiene influence recovery, confidence, social encounters, and job applications. Hygiene declines by 10 each day and by additional amounts for strenuous activities and work. At the end of each day, overlapping poor-hygiene, high-stress, low-energy, and skipped-meal conditions increase health deterioration. Exercise gains fall when Energy is low, and repeated workouts add fatigue; repeated days at home reduce Confidence. Skipping two or more meals causes further penalties, while Hunger compounds the effects. Living costs start at £2 per day and rise every 30 days; illness and financial-pressure events also become more likely over time. Money is the primary resource and can fall into debt.

Health, Energy, Stress, Happiness, and Money can end a run. The game-over summary reports days survived, current day, money earned, longest job tenure, relationships, traits, achievements, and the reason the run ended. Restart Life begins a fresh simulation.

The dashboard uses three columns for the story and choices, character status and employment, and notable events, rare events, achievements, and milestones. The time-of-day label includes a matching icon and subtle accent. Rare-event cards remain visible for five in-game days; achievement progress and temporary event notifications make important outcomes easier to spot. Routine and activity outcomes, job decisions, and random encounters appear in **Notable events**. Random encounters and daily risks are data-driven and conditional, so a walk, workout, study session, or social visit can lead to different results as character stats and the year progress. **Restart Year** resets the prototype.

The live site deploys from the `static-site-rollout` branch. Test changes locally, then commit and push them when you are ready for Render to publish the update.

## Keep secrets out of the frontend

There are no passwords or credentials in this game. HTML, CSS, and JavaScript sent to a browser are public, so never put a password, API key, or other secret in them.

The repository ignores `.env` files. If a future feature needs a secret, keep it in a server-side environment variable and read it from the Flask application; do not pass it into page markup or client-side JavaScript. Static browser code cannot safely hide environment variables.
