# Progress

## Phase 7 — stretch (done)
- Done: chunk trimesh colliders for chunks holding structure voxels (built one per frame, ~5 ms each) so debris bounces off walls; structural collapse (flood-fill support per touched structure, unsupported clusters cut, scored and dropped as convex-hull rigid bodies meshed on a worker, one cluster per frame); point-buy loadout (128-point budget, +/− per slot, sticky grenade upgrade) with its own leaderboard board (`mode` column, POINT-BUY tab, mode signed into the session token); share links (`?arena=theme-SEED`) from results and leaderboard, leaderboard rows replay their arena; milestone drip so bursts of milestones announce one at a time; debris colliders switched to balls (cheaper against walls). 29 tests, e2e still green.
- Next: nothing left in SPEC.md. Candidates if continued: glass colliders, heightfield updates after terrain carving, a hands-on tuning pass.
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
- Blockers: Docker build unverified in this sandbox.
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
