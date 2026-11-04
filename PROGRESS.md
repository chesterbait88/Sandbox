# Progress

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
