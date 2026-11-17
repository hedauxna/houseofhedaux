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

The simulation runs for 365 days with eight stages: **Early Morning**, **Morning Routine**, **Morning Activity**, **Daytime Routine**, **Daytime Activity**, **Evening Routine**, **Evening Activity**, and **Night**. Choose one option per stage. Morning Routine offers breakfast, hygiene, exercise and other ways to begin the day; choosing a non-meal option skips breakfast. Lunch is chosen during Daytime Routine, while Evening Routine offers dinner or hygiene. Morning and Daytime Activity each offer work, study, socialising, chores and hobbies; a regular work shift can be taken only once a day. Evening activities include overtime after a shift for the current job, entertainment, study and social choices.

Staying in bed skips both Morning stages and breakfast. **Full Self Care Day** is a Morning Routine choice that skips breakfast and both activity slots, including work, while preserving lunch and the evening; normal period Hunger losses still apply. **Sleep Early** is an Evening Activity that skips the Night choice and advances to the next day. Other Evening choices lead to **Go To Bed** or **Stay Up Late**. Their base Energy recovery is 60, 40 and 20 respectively, adjusted by Stress, Hunger and Fitness and capped at 100. Staying up late also costs 14 Energy the following morning, but may lead to a creative breakthrough or a rare paid commission. The 365th day ends the year.

Money is shown first in the status panel, with Fitness below Health. Fitness starts at 65 and declines by 5 at the end of each day. Gym visits add 8 Fitness, intense workouts add 5, and strolls add 2; sedentary activities reduce it. Fitness influences job application chances and gym gains; below 30 it reduces Energy recovery and adds 2 daily Health deterioration, while above 80 it improves Energy recovery and adds 1 daily Health. The daily health effects use Fitness before that day's decay. Hunger is a visible 0–100 meter where 100 means well nourished; it falls by 10 in the morning, 15 in Daytime, 15 in the evening, and 10 at night. Meals restore Hunger. Low Hunger reduces sleep recovery, mood, study gains, application chances, and work pay. Stat colors adapt to each value, with Stress using an inverse scale.

Home Cleanliness starts at 70 and falls by 5 each day. Household Chores can be selected in either activity slot to restore 35, at an Energy cost. After daily decay, a home below 30 increases Stress and reduces Happiness; below 15 these effects are stronger. A warning appears below 20.

Applications can offer entry-level or more advanced careers according to attributes, skills, and qualifications. Unsuccessful applications display a temporary notification and remain in Notable events. Working a shift improves that role's skill; study and reading build technical skill, and workouts build fitness skill. Skills and qualifications stay with the player when changing jobs and appear under Milestones. Study can unlock the Study Skills Certificate required by some professional roles. Choose **Quit Job** in Employment to leave immediately; apply again during a Morning or Daytime Activity. Quitting resets the new role's promotion progress, not earned skills or achievements.

Every seven days in a job there is a promotion review. Actual shifts, maintained wellbeing, job-specific performance attributes, and the relevant skill improve the chance; neglected stats lower it. A review without a shift cannot promote. Up to two promotions advance the job title and increase base shift and overtime pay by 25% of the original salary per level. Hunger can still reduce actual earnings.

Routines, activities, jobs, random encounters, and daily risks are defined in data arrays in `games/life-sim.js`. Current jobs cost 15 Energy per regular shift; overtime costs 8 more. New jobs define `skill`, `performanceStats`, income, energy cost, and stress cost independently, and may use `promotionTitles` and conditions such as `{ all: [{ stat: "fitness", min: 60 }, { skill: "practical", min: 5 }] }` or qualification collection checks. Confidence and happiness can reduce work stress, while low energy, high stress, and consecutive workdays increase it.

Stress and hygiene influence recovery, confidence, social encounters, and job applications. Hygiene declines by 10 each day and by additional amounts for strenuous activities and work. Before each choice, Fitness, Hunger, Hygiene, Happiness and Home Cleanliness below 60, and Stress above 40, each add one quarter of a Health point in strain. Strain carries between choices and days; each four accumulated quarters removes 1 Health after the choice. The choice hint shows when strain will cause damage. This is in addition to the daily health deterioration from overlapping poor-hygiene, high-stress, low-energy, and skipped-meal conditions. Exercise gains fall when Energy is low, and repeated workouts add fatigue; repeated days at home reduce Confidence. Skipping two or more meals causes further penalties, while Hunger compounds the effects. Living costs start at £2 per day and rise every 30 days; illness and financial-pressure events also become more likely over time. Money is the primary resource and can fall into debt.

Health, Energy, Stress, Happiness, and Money can end a run. The game-over summary reports days survived, current day, money earned, longest job tenure, relationships, traits, achievements, and the reason the run ended. Restart Life begins a fresh simulation.

The dashboard uses three columns for the story and choices, character status and employment, and notable events, rare events, achievements, and milestones. Its banner shows the day, time, and phase; matching icons and subtle button accents distinguish periods. Warnings above the stats identify critical Health, Fitness, Energy, Hunger, and Stress. Rare-event cards remain visible for five in-game days; achievement progress and temporary event notifications make important outcomes easier to spot. Routine and activity outcomes, job decisions, and random encounters appear in **Notable events**. Random encounters and daily risks are data-driven and conditional, so a walk, workout, study session, or social visit can lead to different results as character stats and the year progress. **Restart Year** resets the prototype.

The live site deploys from the `static-site-rollout` branch. Test changes locally, then commit and push them when you are ready for Render to publish the update.

## Keep secrets out of the frontend

There are no passwords or credentials in this game. HTML, CSS, and JavaScript sent to a browser are public, so never put a password, API key, or other secret in them.

The repository ignores `.env` files. If a future feature needs a secret, keep it in a server-side environment variable and read it from the Flask application; do not pass it into page markup or client-side JavaScript. Static browser code cannot safely hide environment variables.
