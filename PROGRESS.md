# Progress

## Combo meter, leveled rewards, ammo plate (done; user review)
- Done: the combo badge that sat behind the corner timer is gone; a combo plate on the bottom edge (between the weapon hub and the readout) shows the multiplier, chain count, a meter that fills with destruction (√ of value) and chain detonations and steps the multiplier when full, draining a level per 4 s after a 1.5 s pause; leveling a real structure refills a magazine of the weapon in hand and adds +25 % weapon power for 12 s (stacking to +100 %), shown on the same plate with its own timer and on the LEVELED stamp; the ammo plate is smaller with the grenade count as a number and the C4 charges as a pip column up its right edge. 33 tests; gallery regenerated in full (87 images, new `hud-combo-meter` shot).
- Next: hands-on tuning of the meter rates (`SCORING.comboHeatPerSqrtPoint`, `comboHeatPerDetonation`, `comboDrainS`) and the boost size; they are first guesses from headless runs.
- Blockers: none.
- FPS / timing: unchanged from the overhaul entry.
- Open decisions: see DECISIONS.md.

## Visual overhaul (done; user review of the gallery)
- Done: voxel 0.5 → 0.25 m in a 96 × 40 × 96 m arena (720 chunks); every metre↔voxel factor from `VOXEL_SIZE` (the recipe context's hardcoded ×2 was a bug); siting constants in metres; all 14 recipes re-authored in metres with 0.25 m detail plus nine prop types (cars, trees, lamp posts, cactus, boulders, signs, dumpsters, hydrants, benches) placed after the structures; road centre/edge lines, kerbs and lane dashes, rock/dark sand/dry grass/flower beds; outline/bevel/hatch scaled per surface class (terrain faint, structures full, weapon in hand solid); eight weapon models with hands on a 1.25 cm canvas; neon UI (cyan/magenta/acid on near-black, no grey text, straight buttons) with every HUD element on a plate anchored to an edge or corner, structure readout and callouts along the bottom, controls on the loadout screen instead of an in-round hint; dusk skies per theme. Material values are per half-metre block so arena totals stay in range (desert ≈ 41k, downtown ≈ 66k, park ≈ 15k).
- Next: a hands-on pass in a real browser (GPU fps with 720 chunks, the dusk lighting on a real display, weapon pose feel). Candidate: non-cubic mesh regions in the mesher so the 66-deep weapon models mesh faster at boot.
- Blockers: none. 32 tests, `pnpm diagrams`, e2e round and the gallery all green.
- FPS / timing (headless CPU, SwiftShader, so render time is not representative): world gen + first mesh of 720 chunks ≈ 3.4 ms per chunk in the workers; pure C4 carve 1.6 ms in node for 14k voxels; in the browser a C4 in an office block (~4k voxels) costs ≈ 23 ms including handlers, Rapier 1–2 ms/frame with one 17–34 ms step while debris inserts, collapse check 16–46 ms on its worker plus ≈ 11 ms to copy the box out, milestone callout ≈ 10 ms, worst frame in the 2 s after the blast ≈ 50 ms (was 70–100 ms before the perf commit, 7–10 ms at 0.5 m). The budget is not met in this sandbox; real hardware is several times faster, to be confirmed hands-on.
- Open decisions: see DECISIONS.md ("Visual overhaul" onward). The working brief (`OVERHAUL.md`) was folded into DECISIONS.md and this entry and removed. Gallery review after the first regeneration fixed three things: downtown was lit too dark to tell glass from concrete (brighter blue hour), the combo badge overlapped the corner timer (moved to the bar's left), and the C4 gallery step stood inside the new office block's lobby (it now walks up to the first wall it sees).

## Visual review gallery
- `pnpm gallery` writes 87 JPEGs plus `INDEX.md` to `screenshots/gallery/` (committed): every screen and HUD state, each weapon in hand, action moments (C4, chain, rocket, crater, collapse), every structure and two props per theme from a 3/4 view and up close, theme aerials, terrain and material close-ups, the phone notice. Generating it caught two bugs: the HUD layer blocked clicks on the pause screen (CSS specificity) and a collapse's thirty milestones flashed the screen for twenty seconds (bursts now go quiet after three).

## Final state (end of run)

**Works** (verified headless with Vitest, a DOM-driven end-to-end round and Playwright screenshots; see the phase sections below for details):
- Menu → world picker (3 themes, seed, dice, live arena behind) → loadout (fixed kit or 128-point point-buy with sticky grenades) → countdown → 3-minute round → slow-mo → results → initials → leaderboard (per theme, ALL, POINT-BUY; rows replay their arena; share links) → play again.
- Hand-written voxel engine: 23.6 M voxels at 0.25 m, greedy mesher with AO in two Workers (uniform chunks skipped), per-voxel outline/bevel/hatch shader scaled per surface class, arcade palette with hazard-striped volatiles.
- Three 96 m arenas with 14 detailed structure types sited contextually (roadside, blocks, sidewalks, paths, hills, centre, edge) plus nine prop types, road markings and terrain variety, deterministic per seed.
- Eight weapons through one damage path; chain reactions; Rapier debris that bounces off walls and settles into craters; structural collapse of unsupported clusters; shake, flash, sparks, synthesized sound and menu music.
- Scoring with combos, leveled bonuses and dripped milestones; HUD; settings persisted.
- Server: SQLite under `DATA_DIR`, HMAC single-use sessions, time window, score caps, profanity filter, rate limit, cache; forged, early, oversized and replayed scores rejected; scores survive restarts.
- `pnpm install && pnpm build && pnpm start` from a clean checkout (verified), `pnpm test` (33 tests), `pnpm screenshots`, `pnpm gallery`, `pnpm diagrams`, `node scripts/dev/e2e.mjs`.

**Does not work / not verified here:**
- Anything needing a real GPU, pointer lock or speakers was not exercised by a human: mouse look, aiming feel, audio levels, real frame rate. The controller, weapons and audio code paths were driven headlessly.
- Debris passes through glass (no collider for transparent faces).
- `docker compose` itself was not run (the build sandbox's registry access was rate limited), but the same Dockerfile was built with `docker build` and run with a `/data` volume: health, client, session, score and restart persistence all verified. Image is 234 MB.

**Measured numbers** (headless Chromium on the sandbox CPU, software GL, so GPU-bound fps is unknown):
- Mesher: 2.7–4 ms per 32³ chunk in a Worker; world generation 80–150 ms in a Worker.
- Carve: 1–6 ms for a 5 m fuel detonation (2–3k voxels) after warm-up; C4 blast frame 7–10 ms including debris spawn.
- Physics: 144–300 debris 1.3–2.7 ms per frame steady; insertion frame after a blast 19 ms (balls) vs 37 ms (cubes); wall collider build ~5 ms, one per frame.
- Collapse: office-block support check + cut 29 ms once per blast that touches it; cluster mesh built on a Worker.
- The frame loop's own CPU work stays under the 16 ms target in normal play; outliers in this sandbox were attributed to its CPU (GC/scheduling), not reproducible in node.

## Phase 7 — stretch (done)
- Done: chunk trimesh colliders for chunks holding structure voxels (built one per frame, ~5 ms each) so debris bounces off walls; structural collapse (flood-fill support per touched structure, unsupported clusters cut, scored and dropped as convex-hull rigid bodies meshed on a worker, one cluster per frame); point-buy loadout (128-point budget, +/− per slot, sticky grenade upgrade) with its own leaderboard board (`mode` column, POINT-BUY tab, mode signed into the session token); share links (`?arena=theme-SEED`) from results and leaderboard, leaderboard rows replay their arena; milestone drip so bursts of milestones announce one at a time; debris colliders switched to balls (cheaper against walls). 29 tests, e2e still green.
- Also done after the gate: terrain heightfield refresh after carving (debris rests in craters).
- Next: nothing left in SPEC.md. Candidates if continued: glass colliders, a hands-on tuning pass.
- Blockers: none.
- FPS / timing (headless CPU): office-block collapse check 29 ms once (flood fill + cutting 20k voxels + hull) with the mesh on a worker; 144 debris against walls: physics 1.3 ms/frame avg (balls), insertion frame 19 ms; wall collider build ~5 ms each, one per frame.
- Open decisions: see DECISIONS.md.

## Phase 6 — polish (done)
- Done (new): synth menu music loop (bass + arpeggio, stops on deploy), aim zoom on Mouse 2, control hint on the countdown and the first 9 s of a round, desktop-only notice for touch devices, OpenGraph/description meta + `og.svg`, pointer lock requested on the DEPLOY click with click-to-relock and an Esc debounce, round end no longer trips the lock-loss pause, countdown and end-freeze on wall-clock deadlines, loadout models framed closer. Already in from earlier phases: transitions, number ticks, hit markers, muzzle flash, weapon bob, theme sky/fog, slow-mo round end, favicon, settings persisted to localStorage.
- Next: phase 7 stretch only if budget remains (trimesh colliders, structural collapse, point-buy loadouts, sticky grenades, replay links). First: a hands-on pass in a real browser is the one check this sandbox cannot do (pointer lock, audio, GPU fps).
- Blockers: none.
- FPS / timing: headless software rendering only; the frame loop's CPU side is unchanged from phase 2 numbers.
- Open decisions: see DECISIONS.md.

## Phase 5 — server + deploy (done)
- Done: SQLite (`better-sqlite3`, WAL) under `DATA_DIR`, HMAC session tokens (`SCORE_SECRET`), validation (initials regex + profanity → `???`, 150–600 s window, per-theme score cap, single-use nonces), per-IP rate limit on sessions, 5 s leaderboard cache, IP hash only; 8 server tests (token tamper, validation, forged/early/replayed/implausible rejections, rate limit, qualifies, cache); README with run/deploy/env; Dockerfile + compose written (untested: no daemon here). Verified by hand: forged `curl` → 403, oversized score → 400, replay → 403, and a real score is still on the leaderboard after killing and restarting the server with the same `DATA_DIR`.
- Next: phase 6 polish (transitions, number ticks, hit markers, muzzle flash, weapon bob exist; add menu music loop, theme sky/fog, aim zoom, favicon/OpenGraph, desktop-only notice, loadout model size, misc).
- Blockers: none (Docker image later built and run successfully; see the final state section).
- FPS / timing: unchanged.
- Open decisions: see DECISIONS.md.

## Phase 4 — game flow + HUD (done)
- Done: `Flow` state machine (menu → worldPicker → loadout → countdown → playing ⇄ paused → results → initials → leaderboard → menu) with the 180 s `Round` clock and +5 s rewards; nine DOM screens (menu over an orbiting live arena, picker with live theme switch + seed/dice, loadout with spinning model viewports, pause, settings persisted to localStorage, credits, results with count-ups and top-100 check, arcade initials, leaderboard tabs); HUD (score bar + combo ring, timer, Q radial with slow-mo, ammo + pips + ARMED, structure readout + LEVELED stamp, crosshair + hit markers, milestone callouts + flash, countdown); in-memory server routes for session/score/leaderboard/qualifies; `scripts/dev/e2e.mjs` plays a full round through the DOM with zero page errors; `pnpm screenshots` captures all eight screens. Also from user requests mid-phase: arcade palette with two-tone volatiles, per-voxel outline/bevel/hatch shader, contextual siting with a downtown street grid.
- Next: phase 5 server (SQLite on a volume, HMAC session tokens, time window + score cap validation, rate limit, profanity list, leaderboard cache, README).
- Blockers: none. Pointer lock cannot be exercised headless, so mouse-look in a real round is verified by construction (phase 1 probe drove the controller directly).
- FPS / timing: headless CPU only; frame loop unchanged from phase 2 numbers. World regeneration on theme switch 80–150 ms in the worker plus one burst of remeshing.
- Open decisions: see DECISIONS.md.

## Phase 3 — structures + scoring (done)
- Done: StructureCtx with owner tagging and value sums; 14 recipes across the three themes with random dimensions; placer with reserved spawn pad/road, jittered grid, 10 m gaps, flattened pads that keep the heightmap in sync; Score (value × multiplier, 2 s combo window, +0.5 steps to ×5, 50 % leveled bonus, milestones every 1,000 with ammo rewards); Game wires hit/detonation → Score and milestone → ammo; weapon view models reshaped. 20 Vitest tests (placer determinism + 6–10 count, no floating, scoring math).
- Next: phase 4 game flow + HUD (state machine, Menu with orbiting world, World picker, Loadout, HUD, milestone callouts, Pause, Results, Initials, Leaderboard against a local server).
- Blockers: none.
- FPS / timing: world gen with structures 80–140 ms in the worker; arena totals desert ≈ 58k, downtown ≈ 106k, park ≈ 15k points for seed 1234. In-game check: leveling a bus shelter (556) paid 834 = 556 × 1.5.
- Open decisions: see DECISIONS.md.

## Phase 2 — destruction (done)
- Done: `applyDamage` sphere carve with hardness falloff, glass shatter, volatile chain queue (150 ms, deduped per tank); all eight weapons fire through one path (melee, hitscan with pellets/spread, raymarched rocket, bouncing grenade with fuse, stuck C4 with group detonation); Rapier debris (InstancedMesh, 300 cap) on a terrain heightfield; shake/flash/particles; synthesized boom/shot/tink/swing; view models with recoil, bob, muzzle flash; `?test=wall` harness. 13 Vitest tests.
- Next: phase 3 structures + scoring (StructureCtx, placer, recipes for all three themes, owner tagging, Score with combo + leveled bonus, structure readout event, proper weapon view models).
- Blockers: none.
- FPS / timing (headless, slow sandbox CPU, after warm-up): carve 1–6 ms for a 5 m fuel detonation (node: 1–3 ms); physics 2.7 ms/frame with 300 live debris; C4 blast frame 7–10 ms; occasional 13–22 ms outliers attributed to the sandbox CPU (GC/scheduling), not reproducible in node. GPU fps not measurable here.
- Open decisions: see DECISIONS.md (projectiles on voxel ballistics, hitscan snapping, retuned pistol/rifle power).

## Phase 1 — voxel world + player (done)
- Done: flat-array World (get/set/dirty/DDA raycast), greedy mesher with vertex colour + patterns + AO + transparent pass in 2 Workers, per-voxel jitter in the fragment shader, Desert Highway terrain (dunes + road) generated in a Worker, AABB FPS controller with step-up and pointer lock, F3 debug overlay, 9 Vitest tests.
- Next: phase 2 destruction (applyDamage, pistol/pickaxe/grenade, Rapier debris, volatile chain, effects, synth audio).
- Blockers: none.
- FPS: real GPU fps not measurable in the build sandbox (headless SwiftShader). Mesher: 2.7 ms avg per 32³ chunk in the Worker; world gen 80–130 ms; player sweep 180 steps in 3 ms.
- Open decisions: see DECISIONS.md.

## Phase 0 — scaffold (done)
- pnpm workspace, Vite+TS+Three.js, Hono server, Vitest, Playwright screenshots. Docker deferred.
