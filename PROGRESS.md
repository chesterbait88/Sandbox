# Progress

## Phase 1 — voxel world + player (done)
- Done: flat-array World (get/set/dirty/DDA raycast), greedy mesher with vertex colour + patterns + AO + transparent pass in 2 Workers, per-voxel jitter in the fragment shader, Desert Highway terrain (dunes + road) generated in a Worker, AABB FPS controller with step-up and pointer lock, F3 debug overlay, 9 Vitest tests.
- Next: phase 2 destruction (applyDamage, pistol/pickaxe/grenade, Rapier debris, volatile chain, effects, synth audio).
- Blockers: none.
- FPS: real GPU fps not measurable in the build sandbox (headless SwiftShader). Mesher: 2.7 ms avg per 32³ chunk in the Worker; world gen 80–130 ms; player sweep 180 steps in 3 ms.
- Open decisions: see DECISIONS.md.

## Phase 0 — scaffold (done)
- pnpm workspace, Vite+TS+Three.js, Hono server, Vitest, Playwright screenshots. Docker deferred.

## State at pause (wip: pause for living docs)
- Phase: 2 (Destruction) in progress; phases 0 and 1 gates committed.
- Works right now: `pnpm dev`/`pnpm build && pnpm start` serve a page that generates a Desert Highway world from `?theme&seed`, meshes it in Workers and lets you walk it in first person with pointer lock (WASD, Shift, Space, F3 debug). Server answers `/api/health` only.
- Half-done (written, typechecked, unit-tested, but not wired into the running game): `Destruction.applyDamage` with the volatile chain queue, `PhysicsWorld` (Rapier init + terrain heightfield), `Debris` (InstancedMesh + Rapier cuboids), typed `events` emitter. Nothing in `main.ts` calls them yet.
- Not started: weapons/input firing, projectiles, effects (shake/flash/particles), synth audio, view models, structures/recipes/placer (placer is a spawn-pad stub), scoring, game state machine, all UI screens and HUD, server session/score/leaderboard API, SQLite.
