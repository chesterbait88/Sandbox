# 02 — Goal questions

Each question maps to rubric criteria and names the evidence that answers it. Answers are in `AUDIT.md` §6.

| # | Question | Criteria | Evidence to collect |
|---|---|---|---|
| Q1 | Within 60 s of landing on a cold cache, can a stranger with a mouse be wrecking something? | G2.1, G2.2, G6.3, W1.1 | Stopwatch from `goto` to first carve via DOM clicks only; count the mandatory screens. |
| Q2 | Does the player ever learn WASD / mouse-look / which key does what without reading, or is the loadout "CONTROLS" row the only teaching? | G2.3, G2.5, GG7 | Inventory of in-game prompts; code path for hints. |
| Q3 | Is "structures score, terrain is free" communicated in the first 30 s of play, or discovered by accident? | G1.1, G3.3, G4.6 | What the HUD shows after a terrain hit vs. a structure hit. |
| Q4 | Can the player tell a volatile (fuel tank, propane, transformer) from a non-volatile at a glance, at play distance? | P2, G4.2, G7.3, G1.3 | Material palette; hazard patterns; colour-blind simulation on a gallery shot. |
| Q5 | When a chain reaction happens, does the player understand that *they* caused it and that it raised the multiplier? | P3, G1.4, G1.7, G8.1 | Feedback matrix for `detonation` and `comboStep` events. |
| Q6 | Is there any mechanic a player could fail to discover in a full round that the scoring depends on (combo heat, leveled bonus, milestone rewards)? | G2.3, G3.3, G1.7 | Trace where each is explained; none in a tutorial → "partly". |
| Q7 | Does the round end with a win, a goal, and a reason to return? | G2.6, G9.2 | Results and leaderboard screens; the "you'd need N more" line. |
| Q8 | Does "play again" cost ≤ 3 inputs and remember the theme? | G2.7, G3.7 | Click count from leaderboard to next countdown. |
| Q9 | Does the main thread hold a 16.7 ms budget through a C4 blast and a collapse in a headless profile, and what is the p99? | G6.1, G6.2, G11.1 | Frame-time histogram from an instrumented round. |
| Q10 | Does memory stay flat over a 10-minute soak with repeated rounds? | G6.4, GG1 | `performance.memory` samples across 3 rounds. |
| Q11 | What happens on pause spam, window resize, tab blur, pointer-lock loss, and a rejected pointer lock? | GG3, GG4, G6.7 | Scripted abuse pass; state machine after each. |
| Q12 | Can the game be paused from every playable state, and do timers stop? | GG3 | Pause during countdown, during slow-mo freeze, with radial open. |
| Q13 | Is anything persisted (settings, leaderboard) atomically and corruption-tolerant? | GG2 | `settings.load()` with corrupt localStorage; SQLite WAL + validation. |
| Q14 | Do milestone flashes / blast flashes stay under 3 flashes per second across > 25 % of the screen? | GG5, W2.7 | Flash element CSS + `effects.ts` timings; the 30-milestone collapse case. |
| Q15 | Is every gameplay-critical HUD string ≥ the legibility floor and ≥ 4.5:1 on its real background? | GG6, G4.2 | Computed font sizes and contrast on worst-case screenshots. |
| Q16 | Can every action be reached from keyboard+mouse with documented defaults, and can anything be remapped? | GG7, G5.1, G5.4 | Bindings vs. `Input.ts`; settings screen inventory. |
| Q17 | Can the DOM menus be driven by keyboard alone with visible focus and zero axe errors? | W2.1, W2.2, W2.4, G7.5 | axe-core per screen; Tab walk. |
| Q18 | Does the landing render usefully at 360 × 640 and 1366 × 768 without horizontal scroll or cut-off HUD? | G6.5, WG1 | Viewport matrix screenshots. |
| Q19 | Are difficulty / assist options present (there is one difficulty: 180 s)? | G3.2, G7.6, G7.7 | Settings inventory. |
| Q20 | Are tunables really all in `config/` (CLAUDE.md non-negotiable) or do magic numbers leak into gameplay code? | G11.2 | Grep gameplay files for numeric literals. |
| Q21 | Is the leaderboard resistant to the trivial exploits the spec promises to stop (forged post, replay, early submit, impossible score)? | G9.6, W10.4 | Server tests + live curl against the running server. |
| Q22 | What does the build ship (JS bytes, chunks, source maps), and does the server set security headers? | W1.5, W10.4, W10.5 | `client/dist` sizes; `curl -I`. |
| Q23 | Is anything in the product serving a non-goal (mobile, accounts, textures) or duplicating another feature? | Cut analysis | Feature inventory. |
| Q24 | Versus Krunker.io and Teardown, where is the first minute clearly worse? | G1.1, G2.1, G8.3 | Side-by-side heuristic walk. |
