# Voxel Wreck — Browser Sandbox Build Spec

Nov 3, 2026 · @Zach g

## Concept & scope

A first-person browser game where you drop into a themed, procedurally generated voxel world with a fixed loadout and 3 minutes to wreck as much of the structures as you can. Score comes only from structures (gas station, convenience store, monument), weighted by material; terrain is free to dig but worth nothing. Chain reactions through volatile materials (fuel tanks, propane) are the combo mechanic. At the end you enter three-letter initials on a leaderboard. "Voxel Wreck" is a placeholder name.

**Decided in discussion:**

- World voxel = 0.5 m; a 1 m block is a 2×2×2 cube of 8 voxels. Blocks are carved, not shattered into rigid pieces; the 8 sub-voxels are the destruction resolution.
- Materials are colors + a value + a hardness, no textures. Depth comes from per-voxel color jitter, two-tone patterns (brick rows, siding) and vertex ambient occlusion from the mesher.
- Guns and tools are voxel models built from the same material system, rendered through the same mesher, so they look like the world.
- First person with pointer lock.
- Everyone gets the same fixed loadout with hard ammo counts; point-buy loadouts and a separate leaderboard for them are a later revision.
- Three themes at launch, each with its own terrain generator and structure pool, plus a seed field.
- Self-hosted in one Docker container (static client + Node API + SQLite).

**MVP cut line (must work end to end before any polish):** start menu → theme + seed → loadout screen → 3-minute round with carving, debris, scoring and the per-structure HUD → results → initials → leaderboard.

**Out of scope for this build:** structural collapse of unsupported voxels, point-buy loadouts, multiplayer, mobile/touch controls, accounts, save files, enemies/NPCs. Each is noted as a stretch goal in the build plan so the agent leaves hooks and does not design them out.

## Tech stack

Three.js + TypeScript + Vite on the client, Rapier (WASM) for debris and projectiles only, a hand-written voxel engine, and a tiny Node + SQLite API in the same container. No off-the-shelf voxel engine.

| Layer | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Language / build | TypeScript, Vite, pnpm | Fast dev server, native Web Worker and WASM support, same language as the server | Plain JS (no types for a 10k-line agent-written codebase) |
| Rendering | Three.js (latest release), WebGL2 | Mature, huge example base, BufferGeometry + vertex colors is exactly the voxel case | Babylon.js (fine, but less agent-familiar); WebGPU (not yet default everywhere) |
| Voxel world | Custom: Uint8Array chunks, greedy mesher in a Web Worker | Explosions carve spheres and need per-voxel ownership; Minecraft-style engines (noa, voxelize, voxeljs) fight that | noa-engine, voxelize, bvx.ts |
| Physics | @dimforge/rapier3d-compat | WASM, deterministic, handles hundreds of debris bodies with CCD; the -compat build embeds the WASM so Vite needs no plugins | cannon-es (pure JS, struggles past \~100 bodies, no CCD); ammo.js (bigger, clunkier API) |
| Noise | simplex-noise (npm) | Seedable, tiny, 2D/3D/4D | Writing our own |
| UI | Plain HTML/CSS overlay on the canvas | Menus, HUD and initials entry are DOM, not in-canvas; trivial to style | React (unneeded weight) |
| Audio | Web Audio API, synthesized | No asset pipeline; explosions, shots and hits as procedural noise bursts | Sample files |
| Server | Node 20, Hono, better-sqlite3 | One process serves the built client and `/api/*`; SQLite file on a volume | Cloudflare Workers (you want your own container) |
| Container | Multi-stage Dockerfile, single image | Build client, copy `dist/` into the Node image, expose one port | Separate nginx + API images |

**Physics boundary (important):** Rapier never sees the voxel world as bodies. The player collides against the voxel grid with simple AABB sweeps. Rapier simulates debris cubes, grenades and rockets; for the MVP they collide against a Rapier heightfield built from the terrain surface. Chunk trimesh colliders for walls are a phase-2 upgrade.

**Why not WebGPU / TSL:** WebGL2 runs everywhere the leaderboard audience will be; the geometry load (a few hundred chunk meshes, vertex-colored) is nowhere near WebGL2's limits.

Sources: [Three.js physics manual](https://threejs.org/manual/en/physics.html) · [Rapier JS overview](https://learnwithhasan.com/js-libraries/rapier/) · [Rapier in a worker](https://abratabia.com/game-physics/rapier.php) · [engine-level discussion of greedy meshing budgets](https://reddit.rtrace.io/r/VoxelGameDev/comments/wny62d/opensource_web_voxel_engine)

## World model

The world is a fixed 128 m × 64 m × 128 m box of 0.5 m voxels (256 × 128 × 256 = 8.4 M voxels), stored as 32³ chunks (8 × 4 × 8 = 256 chunks, 32 KB each). No infinite streaming; a round is one arena.

**Per chunk:**

- `mat: Uint8Array(32768)` — material ID, 0 = air
- `owner: Uint16Array(32768)` — structure ID, 0 = terrain/none (only allocated for chunks a structure touches)
- `flags`: `empty`, `uniform` (skip meshing), `dirty` (needs remesh)
- Two Three.js meshes: opaque and transparent (glass), both `BufferGeometry` with position, normal, color and AO attributes

**Materials** live in one config file (`materials.ts`) so balance is a data edit, not a code edit:

| ID | Name | Base color | Value | Hardness | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | Grass | #5a9e3c | 0 | 1 | terrain |
| 2 | Dirt | #7a5a3a | 0 | 1 | terrain |
| 3 | Sand | #d9c27e | 0 | 1 | terrain |
| 4 | Stone (terrain) | #8a8a85 | 0 | 3 | terrain |
| 5 | Asphalt | #3a3a3c | 0 | 2 | terrain |
| 10 | Glass | #a8d8f0 | 1 | 1 | transparent, shatters on any hit |
| 11 | Wood | #a06b3c | 2 | 2 |  |
| 12 | Drywall | #e8e4da | 1 | 1 |  |
| 13 | Brick | #9b4a35 | 3 | 3 | two-tone rows |
| 14 | Concrete | #9a9a94 | 5 | 5 |  |
| 15 | Steel | #6b7280 | 8 | 8 |  |
| 16 | Marble | #e6e2d8 | 6 | 5 |  |
| 17 | Neon / sign | #ff4fa3 | 2 | 1 | emissive |
| 20 | Fuel tank | #c0392b | 4 | 2 | volatile (power 60, radius 5 m) |
| 21 | Propane | #e0e0e0 | 3 | 1 | volatile (power 35, radius 3 m) |
| 22 | Transformer | #4a5568 | 5 | 3 | volatile (power 25, radius 2.5 m) |

**Color definition without textures:** final vertex color = base color × a per-voxel jitter of ±6 % brightness seeded from the voxel coordinates (so it is stable across remeshes), × a per-material pattern function (brick: alternate 0.5 m rows between the base and a 12 % darker tone; drywall: none; marble: low-frequency 3D noise tint). The mesher computes vertex ambient occlusion (the standard 0–3 neighbour count per corner) and darkens corners up to 35 %. Light: one directional sun with a shadow map covering the arena, plus hemisphere ambient.

**Terrain generation** (per theme, in a Worker, seeded): a 2D heightmap from 2–3 octaves of simplex noise, scaled to the theme's relief (Desert Highway ±6 m, Downtown ±1 m, Memorial Park ±3 m), filled downward with the theme's strata (grass over dirt over stone, or sand over stone). A flat "pad" is stamped where each structure goes so buildings never float or sink.

**Structure generation** is recipe-based. A recipe is a TypeScript function `(ctx, rng) => void` that places voxels through `ctx.box(x0,y0,z0,x1,y1,z1, material)`, `ctx.cylinder(...)`, `ctx.fill(...)` and `ctx.hollowBox(...)`; every placed voxel is tagged with the structure's ID and summed into its `totalValue`. Recipes take random dimensions within a range so no two gas stations match. Placement: the theme picks 6–10 recipes from its pool, places them on a jittered grid with a minimum 10 m gap, and the player spawns on a cleared pad at one edge facing the arena.

| Theme | Terrain | Structure pool |
| --- | --- | --- |
| Desert Highway | Sand, rolling dunes, one asphalt road through the middle | Gas station (canopy, 2–4 pumps on fuel tanks, store box with glass front, tall sign), Diner (long box, glass, neon), Billboard (steel posts, wood face), Water tower (steel legs, steel tank), Propane cage |
| Downtown | Flat asphalt grid with concrete sidewalks | Convenience store (glass front, drywall interior walls, propane cage outside), Office block (3–5 floors, concrete frame, glass curtain wall, transformer in the alley), Parking structure (2–3 open concrete decks), Bus shelter (glass + steel) |
| Memorial Park | Grass, gentle hills, gravel paths | Monument (marble pedestal + column, steel core), Fountain (marble ring, water as transparent material), Gazebo (wood posts, wood roof), Statue (marble mass on a concrete base), Maintenance shed (wood, with a fuel tank inside) |

Terrain carries no score so players dig freely; the pad under a structure is terrain too.

## Destruction system

Every hit in the game is one function: `applyDamage(center, radius, power, source)`. Bullets are a tiny radius with modest power; explosives are a big radius with big power. Volatile materials queue their own `applyDamage` when destroyed, which is the chain reaction.

**Carve step** (synchronous, on the main thread, in voxel space):

1. Iterate voxels in the bounding cube of the sphere; skip air.
2. `energy = power × (1 − d / radius)` where d is distance from the center. Destroy the voxel if `energy ≥ hardness`.
3. For each destroyed voxel: record `(material, owner)` for scoring, set `mat = 0`, mark its chunk dirty (and neighbouring chunks if on a border).
4. If the material is volatile, push a secondary explosion at that voxel onto a timed queue (150 ms delay, so chains ripple visibly) and skip any further volatile voxel within 1 m of it (one detonation per tank, not one per voxel).
5. Return the list of destroyed voxels to the debris and scoring systems.

A grenade at power 40 / radius 2.5 m clears drywall, wood and glass fully, chews a shallow crater into brick and barely marks concrete at the edge; C4 at power 90 / radius 4 m punches through concrete. Numbers are in `weapons.ts` and `materials.ts` for tuning.

**Remesh step** (asynchronous): dirty chunks go to the mesher Worker, nearest-to-player first, max 4 per frame. The Worker runs greedy meshing with vertex color, AO and a separate transparent pass, and posts back transferable `Float32Array`/`Uint8Array` buffers; the main thread swaps the `BufferGeometry` attributes. A 32³ chunk should remesh in well under 4 ms in the Worker. Until the remesh arrives the old mesh stays, which at 150 ms chain delays is never visible.

**Debris step:** from the destroyed list, pick up to 24 voxels (bias toward the surface of the crater, random sample) and spawn a Rapier dynamic cuboid of 0.5 m for each, colored with that voxel's final color (one `InstancedMesh` per material, a global cap of 300 live debris; the oldest die first). Impulse = outward direction × power × 0.3 with ±20 % jitter and a random spin. Debris lives 4 s, shrinks over the last 0.5 s, then is removed. Debris collides with the terrain heightfield and with other debris; not with walls (phase-2 trimesh upgrade).

**Feedback:** screen shake scaled to `power / distance`, a flash sprite at the center, a burst of 30 small additive particles (plain `Points`), and a synthesized Web Audio boom with low-pass falloff by distance. Glass makes a bright tink and spawns more, smaller debris.

**Performance budget** (checked by the agent with the Chrome profiler before moving past phase 2): 60 fps on an integrated-graphics laptop with 300 debris and 6 chunks remeshing per second; a C4 blast must never block the main thread more than 8 ms.

## Player, controls & loadout

First person, pointer lock, one fixed loadout for everyone. Weapons are data in `weapons.ts`; the view models are small voxel arrays rendered through the same mesher as the world.

**Controller:** a 0.6 × 1.8 × 0.6 m AABB swept against the voxel grid per axis (no Rapier). Walk 6 m/s, sprint 9 m/s, jump 1.4 m, gravity 20 m/s², automatic step-up of one voxel (0.5 m). Mouse look with a sensitivity slider in pause. Fall damage is off; the only fail state is the clock.

**Bindings:** WASD move · Shift sprint · Space jump · Mouse 1 fire / swing · Mouse 2 aim (slight zoom, tighter spread) · 1–8 direct weapon select · Q (hold) or mouse wheel opens the radial picker · R reload (where applicable) · G throw grenade from any weapon · Esc pause.

**Loadout** (ammo per 3-minute round; all values in config):

| Slot | Weapon | Type | Radius | Power | Ammo | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Pickaxe | Melee, 2 m reach | 0.6 m | 6 | ∞ | Fast swing, single-voxel precision, digs terrain |
| 2 | Bat | Melee, 2 m reach | 1.2 m | 4 | ∞ | Slower, wide; wrecks glass and drywall in one swing |
| 3 | Pistol | Hitscan | 0.4 m | 5 | 12 / mag, 72 total | Starter gun; pops glass, chips wood, triggers volatiles |
| 4 | Shotgun | Hitscan, 8 pellets in a cone | 0.5 m each | 5 | 6 / mag, 30 total | Close range wall-eater |
| 5 | Rifle | Hitscan | 0.5 m | 9 | 30 / mag, 120 total | Full auto, 10 rounds/s, punches brick |
| 6 | Rocket launcher | Projectile 40 m/s, explodes on contact | 3 m | 55 | 6 | Long-range demolition |
| 7 | Grenade | Thrown, 3 s fuse, bounces (Rapier body) | 2.5 m | 40 | 8 | Also on G from any weapon |
| 8 | C4 | Placed on a surface, detonate with Mouse 1 again | 4 m | 90 | 4 | Highest damage; all placed charges fire together |

Melee and hitscan call `applyDamage` at the hit voxel (a DDA voxel raycast, max 100 m for guns). Rockets and grenades are Rapier bodies that call it on contact or fuse. C4 charges are small voxel models stuck to the hit face.

**View models:** each weapon is a 16 × 8 × 24 voxel array (0.1 m voxels, so the gun looks blockier than the world but in the same palette), meshed once at load and attached to the camera with a simple recoil kick and bob. Muzzle flash is a short-lived emissive quad. Hands are two skin-colored voxel blocks.

**Later (not MVP):** point-buy loadouts with a budget, a separate leaderboard for them, and sticky grenades.

## Game flow & UI

All UI is a DOM overlay on the canvas, one screen visible at a time, driven by a small state machine: `menu → worldPicker → loadout → playing ⇄ paused → results → initials → leaderboard → menu`. Polish is a requirement, not a stretch: the visual bar is "arcade cabinet meets modern indie" — a bold condensed display font, chunky high-contrast panels with slight transparency, animated transitions (150–250 ms), and every number that changes should tick, pop or slide rather than snap.

**Start menu:** title in big voxel-style lettering over a slowly orbiting camera on a live generated world (so the menu is never a static screen). Buttons: Play, Leaderboard, Settings (sensitivity, volume, FOV), Credits. A tiny "best today" strip at the bottom.

**World picker:** three large theme cards side by side (Desert Highway, Downtown, Memorial Park), each with a live low-res render of a sample world, a one-line description and the theme's top score. Below: a seed field (random by default, with a dice button) so friends can play the same arena.

**Loadout screen:** the eight weapon slots in a row with their voxel model rendered in a small spinning viewport, ammo count, and a one-line role ("wall-eater", "chain starter"). Since everyone has the same kit this screen is a briefing: it also shows the round length and the arena's total available points. One button: Deploy. A 3-2-1 countdown with the camera dropping into the spawn pad.

**HUD during play:**

- **Top: score bar.** Full-width bar with the current score on the left, the next milestone on the right, and a fill that races toward it; the whole bar flashes and the score pops in on each hit. A combo multiplier badge (×1.5, ×2 …) appears next to the score during chain reactions and decays with a shrinking ring.
- **Top-right: round timer**, pulsing red under 30 s.
- **Bottom-left: weapon radial.** Holding Q (or rolling the wheel) fans the eight weapons out in a circle around a centered hub; moving the mouse highlights a segment, releasing selects it, and the game runs at 30 % speed while it is open. Closed, it collapses to a small icon of the current weapon with the slot number.
- **Bottom-right: ammo.** Big magazine count, small reserve count, a reload bar under it; grenade and C4 counts as pips above. Red tint when empty.
- **Center-bottom: structure readout.** Appears for 3 s when you damage a structure: name, a percent-destroyed bar and its point value ("GAS STATION 78 % · 1,240 pts"). At 100 %: a stamp animation "LEVELED +620".
- **Crosshair** that spreads with the shotgun and tightens while aiming; hit markers tick on every destroyed voxel group.

**Milestone events** (every 1,000 points, tiers in config): the score bar fills, a full-width callout slams in ("WRECKING", "DEMOLITION", "TOTAL CHAOS" …), the screen flashes, a stinger plays, and a reward drops — alternating +1 grenade / +1 rocket / +1 C4 / +5 s on the clock. Tier names, rewards and intervals are a table in `milestones.ts`.

**Pause:** Esc releases the pointer, blurs the game, shows Resume / Settings / Quit to menu.

**Results:** the round ends with a 1.5 s slow-motion freeze, then a results card that counts up: structures leveled, voxels destroyed, biggest chain, final score, and the arena's percent-destroyed. If the score makes the top 100 for that theme it goes to initials entry; otherwise to the leaderboard with a "you'd need N more" line.

**Initials entry:** three large letter columns, A–Z plus space, arcade-style: W/S or arrow keys cycle, A/D move between columns, Enter confirms (mouse and typing also work). The score sits above, the theme and seed below. Submit posts to the server and shows a confirmation.

**Leaderboard:** tabs per theme plus All, top 10 shown as rank · initials · score · date, the player's row highlighted if present, with a Play Again that returns to the world picker with the same theme pre-selected.

## Scoring & leaderboard

Points come only from structure voxels: `score += materialValue × comboMultiplier` per destroyed voxel, plus a bonus when a structure reaches 100 %. Terrain is worth 0.

**Rules (all tunable in `scoring.ts`):**

- Base: each destroyed structure voxel pays its material value (glass 1 … steel 8).
- Combo: every volatile detonation starts or extends a 2-second combo window and raises the multiplier by +0.5 (×1.5, ×2 … capped at ×5). Anything destroyed inside the window, by any cause, uses the current multiplier. The window resets to 2 s on each detonation.
- Leveled bonus: when a structure's destroyed value reaches 100 % of its total, +50 % of its total value, once.
- Milestones (every 1,000 points) grant the rewards listed in the UI section; they do not change the score.
- The round is 180 s; nothing scores after the clock, but queued chain reactions in flight still resolve for the fireworks.

**Client tracks per round:** `score`, `voxelsDestroyed`, `structuresLeveled`, `bestChain` (detonations in one combo window), `arenaTotal` (sum of all structure values, for the "% of arena" readout).

**Server API** (Hono on Node, SQLite via better-sqlite3, one file on a Docker volume):

| Method & path | Body / query | Returns | Notes |
| --- | --- | --- | --- |
| `POST /api/session` | `{ theme, seed }` | `{ token, startedAt }` | Issued when the round starts; token is a signed HMAC of `(theme, seed, startedAt, nonce)`. Rate-limited per IP (10/min). |
| `POST /api/score` | `{ token, initials, score, stats }` | `{ rank, accepted }` | Validates token signature, elapsed time 150–600 s since `startedAt`, `initials` matches `^[A-Z ]{3}$`, `score ≤ themeMaxScore[theme] × 5`, one submission per token. Stores IP hash only. |
| `GET /api/leaderboard?theme=downtown&limit=10` | query | `{ entries: [{ rank, initials, score, date }] }` | `theme=all` merges. Cached 5 s in memory. |
| `GET /api/health` | — | `{ ok: true }` | For the orchestrator's health check. |

Schema: `scores(id, theme, seed, initials, score, stats_json, ip_hash, created_at)` with an index on `(theme, score DESC)`. Profanity filter on initials with a short list; rejected initials get `"???"`.

**Anti-cheat stance:** this is a casual leaderboard, so the goal is to stop trivial `curl` posts and impossible scores, not determined cheaters. The token + time window + max-score cap does that. If it ever matters, the next step is sending the per-structure breakdown in `stats` and recomputing a plausibility ceiling server-side from the seed.

## Project structure

One pnpm workspace with `client/` and `server/`, a shared `config/` package for the data tables both sides read, and a single Dockerfile at the root. Every gameplay number lives in `config/`, never inline.

```
voxel-wreck/
├── CLAUDE.md                  # agent brief (see kick-off section)
├── SPEC.md                    # this document, exported as markdown
├── Dockerfile                 # multi-stage: build client → node image serving dist + api
├── docker-compose.yml         # one service, one volume for /data/scores.db
├── package.json / pnpm-workspace.yaml
├── config/                    # shared, plain TS, no deps
│   ├── materials.ts           # id, color, value, hardness, flags
│   ├── weapons.ts             # loadout table, view-model voxel arrays
│   ├── scoring.ts             # combo, bonuses, round length
│   ├── milestones.ts          # tiers, callouts, rewards
│   └── themes.ts              # theme ids, names, terrain params, structure pools
├── client/
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts            # boot: renderer, state machine, loop
│       ├── state/             # GameState machine, round clock, stats
│       ├── world/
│       │   ├── Chunk.ts       # Uint8Array mat + Uint16Array owner + flags
│       │   ├── World.ts       # chunk map, get/set voxel, dirty tracking, DDA raycast
│       │   ├── mesher.worker.ts   # greedy mesh + AO + transparent pass
│       │   ├── ChunkRenderer.ts   # swaps geometry buffers from worker results
│       │   └── gen/
│       │       ├── terrain.ts     # per-theme heightmap + strata
│       │       ├── StructureCtx.ts# box/cylinder/hollowBox helpers + owner tagging
│       │       ├── placer.ts      # jittered grid placement, spawn pad
│       │       └── recipes/       # gasStation.ts, diner.ts, officeBlock.ts, monument.ts …
│       ├── destruction/
│       │   ├── damage.ts      # applyDamage(): carve, volatile queue, returns destroyed list
│       │   ├── Debris.ts      # Rapier bodies + InstancedMesh pools, caps, lifetimes
│       │   └── effects.ts     # shake, flash, particles
│       ├── physics/
│       │   └── PhysicsWorld.ts# Rapier init, heightfield, projectiles, step
│       ├── player/
│       │   ├── Controller.ts  # AABB sweep movement, pointer lock, input map
│       │   ├── Weapons.ts     # fire/swing/throw/place, ammo, reload, radial select
│       │   └── ViewModel.ts   # voxel gun meshes, recoil, bob, muzzle flash
│       ├── scoring/
│       │   ├── Score.ts       # multiplier, structure registry, milestones
│       │   └── api.ts         # session/score/leaderboard fetches
│       ├── audio/
│       │   └── Synth.ts       # Web Audio procedural sfx + stingers
│       └── ui/
│           ├── screens/       # Menu, WorldPicker, Loadout, Pause, Results, Initials, Leaderboard
│           ├── hud/           # ScoreBar, Timer, Radial, Ammo, StructureReadout, Crosshair, Callouts
│           └── styles.css
└── server/
    ├── src/index.ts           # Hono app: static dist + /api routes
    ├── src/db.ts              # better-sqlite3 schema + queries
    ├── src/token.ts           # HMAC session tokens
    └── src/validate.ts        # initials, score caps, timing window
```

**Interfaces that must stay stable** (so modules can be built in parallel and tested alone):

- `World.getVoxel(x,y,z) / setVoxel(x,y,z, mat) / raycast(origin, dir, maxDist) → { x,y,z, face, mat, owner } | null`
- `applyDamage(center: Vec3, radius: number, power: number, source: string) → Destroyed[]` where `Destroyed = { x,y,z, mat, owner }`
- `Score.onDestroyed(list: Destroyed[])` and `Score.onDetonation()`
- `Debris.spawn(list: Destroyed[], center: Vec3, power: number)`
- `events`: a tiny typed emitter for `hit`, `detonation`, `structureLeveled`, `milestone`, `roundEnd`, which the HUD and audio subscribe to so gameplay code never touches the DOM.

**Testing:** Vitest for the pure parts — mesher output on a hand-built 4³ chunk, `applyDamage` on known materials, scoring math, token validation. No test for rendering; the agent instead takes Playwright screenshots of each screen and the HUD mid-round and checks them visually against this spec.

**Docker:** stage 1 `node:20-alpine` runs `pnpm install && pnpm -r build`; stage 2 copies `client/dist` and `server/dist`, runs `node server/dist/index.js` on port 8080 with `DATA_DIR=/data` and `SCORE_SECRET` from the environment. Healthcheck hits `/api/health`.

## Build plan

Seven phases, each ending in a runnable check-in the agent commits and screenshots before moving on. Phases 0–5 are the MVP and must finish before any polish; phase 6 is where the remaining budget goes. Phase 7 only if tokens are left. The agent should report progress at each gate and stop if a gate fails twice.

1. **Scaffold** — pnpm workspace, Vite + TS client with Three.js rendering a lit cube, Hono server serving the client, Dockerfile builds and runs locally, Vitest and Playwright wired. *Gate:* `docker compose up` shows the cube at `localhost:8080`.
2. **Voxel world + player** — Chunk/World, `materials.ts`, greedy mesher in a Worker with vertex color, jitter, patterns and AO, Desert Highway terrain, FPS controller with AABB sweeps, pointer lock, a debug overlay (fps, chunks meshed). *Gate:* walk around a 128 m dune arena at 60 fps; profiler shows remesh under 4 ms per chunk.
3. **Destruction** — `applyDamage`, DDA raycast, pistol + pickaxe + grenade (Rapier init, heightfield, thrown body), debris pools, volatile queue with a test fuel tank, shake/flash/particles, synthesized sounds. *Gate:* throw a grenade at a brick wall with a fuel tank behind it; crater, chain detonation, debris, no frame over 16 ms during a C4 blast.
4. **Structures + scoring** — StructureCtx, placer, all three themes' terrain and recipes, owner tagging, Score with combo + leveled bonus, structure readout event, full weapon roster with view models. *Gate:* each theme generates 6–10 structures from a seed deterministically; leveling a gas station pays its listed value; Vitest passes for scoring.
5. **Game flow + HUD** — state machine, Menu (orbiting live world), World picker, Loadout, HUD (score bar, timer, radial, ammo, readout, crosshair), milestones with callouts and rewards, Pause, Results, Initials, Leaderboard screens against a local server. *Gate:* a full round from menu to leaderboard without touching the console; Playwright screenshots of every screen.
6. **Server + deploy** — session tokens, score validation, SQLite schema, leaderboard cache, rate limit, profanity list, Docker volume, health check, README with run/deploy steps and environment variables. *Gate:* `curl` with a forged score is rejected; a real round's score appears in the leaderboard after a container restart.
7. **Polish** — this is where it should look like a product: transitions, number ticks, hit markers, muzzle flash, weapon bob, menu music loop (synth), theme-specific sky colors and fog, slow-mo on round end, favicon and OpenGraph tags, a settings screen that persists to localStorage, mobile "desktop only" notice. *Gate:* a stranger can play without instructions and the HUD reads at a glance.
8. **Stretch (only if budget remains)** — chunk trimesh colliders so debris bounces off walls; structural collapse (flood-fill support check per structure after each blast, unsupported clusters become one rigid body); point-buy loadout with its own leaderboard tab; sticky grenades; a replay seed share link.

**Working rules for the agent across all phases:** commit at every gate with a message naming the phase; keep `config/` as the only place numbers live; never let the main thread do meshing; profile before optimizing; write the Playwright screenshot script in phase 1 and reuse it; when something in this spec is ambiguous, pick the simpler option, note it in `DECISIONS.md`, and keep moving rather than waiting.

## Kick-off prompt & CLAUDE.md

Export this doc as Markdown, save it as `SPEC.md` in an empty repo next to the `CLAUDE.md` below, then start the cloud instance with the kick-off message. The spec carries the design; CLAUDE.md carries the standing rules; the kick-off message just points at both and sets the stopping conditions.

**CLAUDE.md**

```markdown
# Voxel Wreck — agent brief

You are building a first-person browser demolition game. The full design is in SPEC.md; read it completely before writing any code, and re-read the relevant section before starting each phase.

## Stack (fixed — do not substitute)
- pnpm workspace: `config/` (shared TS data), `client/` (Vite + TypeScript + Three.js), `server/` (Node 20 + Hono + better-sqlite3)
- Physics: `@dimforge/rapier3d-compat` for debris and projectiles only. The voxel world is never a Rapier body; the player uses AABB sweeps against the grid.
- Voxel engine is hand-written per SPEC.md. Do not add noa-engine, voxelize, or any voxel library.
- UI is a DOM overlay (vanilla TS + CSS). No React.
- Audio is synthesized with Web Audio. No audio files.

## Non-negotiables
- Every tunable number lives in `config/*.ts`. Grep for magic numbers before each commit.
- Meshing runs in a Web Worker. The main thread never meshes a chunk.
- Follow the phase order in SPEC.md "Build plan". Finish and commit each phase's gate before starting the next. Phases 0–5 are the MVP; do not touch phase 6 polish until the MVP runs end to end in Docker.
- At each gate: run `pnpm test`, run the Playwright screenshot script, commit with `phase N: <summary>`, and write a 5-line status to `PROGRESS.md` (done, next, blockers, fps numbers, open decisions).
- When the spec is ambiguous, choose the simpler option, log it in `DECISIONS.md`, and continue. Do not stop to ask unless a gate has failed twice.
- Performance target: 60 fps on integrated graphics with 300 debris; no main-thread frame over 16 ms during a C4 blast. Profile before optimizing.
- Keep the module interfaces listed in SPEC.md "Project structure" stable so pieces can be tested alone.

## Commands
- `pnpm install` · `pnpm dev` (client on 5173 proxying /api to server on 8080) · `pnpm build` · `pnpm test` · `pnpm screenshots` · `docker compose up --build`

## Style
- TypeScript strict. Small files, one responsibility each. Typed event emitter between gameplay and UI; gameplay code never touches the DOM.
- Vertex colors only; no textures, no image assets except a favicon.
```

**Kick-off message** (paste as the first message to the cloud instance):

```markdown
Read CLAUDE.md and SPEC.md in full. Then build the game described there, phase by phase, starting at phase 0.

Rules for this run:
- Work through phases 0–5 without stopping. Commit at every gate and keep PROGRESS.md current; I will read it rather than the transcript.
- Do not ask me questions. If the spec is ambiguous, pick the simpler reading, note it in DECISIONS.md, and keep going.
- After phase 5 passes its gate in Docker, continue into phase 6 (polish) and spend the remaining budget there. Only start phase 7 if everything in 6 is done.
- At the end of the run, make sure the repo builds from clean with `docker compose up --build`, the README explains how to deploy it as a single container with a volume at /data and a SCORE_SECRET env var, and PROGRESS.md lists exactly what works, what does not, and the fps numbers you measured.

Start with phase 0 now.
```

**What to check when you come back:** open `PROGRESS.md` first, then `docker compose up --build` and play one round. If the agent stalled, the last gate it passed tells you where to restart it from ("continue from phase N; the gate for N−1 is already committed").
