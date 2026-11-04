# Progress

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
