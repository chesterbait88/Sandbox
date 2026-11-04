# Voxel Wreck — Developer Tree (living document)

The codebase **as it exists at the current commit**: modules, functions and the paths that run end to end. Modules from SPEC.md with no code are listed at the end under "Planned, not built".

## Architecture

```mermaid
flowchart TB
    subgraph main[Main thread · client/src]
        M[main.ts boot + ?screen jumps]
        FL[game/Flow state machine + Round]
        UI[ui/UI screens + hud]
        G[game/Game frame loop]
        R[render/Renderer]
        W[world/World]
        CR[world/ChunkRenderer]
        WG[world/WorldGen]
        PC[player/Controller]
        IN[player/Input]
        WP[player/Weapons]
        VM[player/ViewModel]
        DM[destruction/damage]
        DE[destruction/Debris]
        EF[destruction/effects]
        PH[physics/PhysicsWorld]
        AU[audio/Synth]
        SC[scoring/Score]
        EV[state/events · Emitter]
    end
    subgraph workers[Web Workers]
        MW[mesher.worker ×2]
        GW[gen.worker → terrain, placer, recipes]
    end
    subgraph wasm[WASM]
        RP[Rapier]
    end
    subgraph server[Node server · server/src]
        SV[index.ts static + /api]
        AP[api.ts session, score, leaderboard, qualifies]
        TK[token.ts HMAC]
        VA[validate.ts]
        DBm[db.ts better-sqlite3]
        FS[(DATA_DIR/scores.db)]
    end
    CFG[(config/ shared tables)]
    M --> G & FL & UI
    FL -- timeScale, cameras, enable --> G
    UI -- buttons --> FL
    FL -. tick, roundEnd .-> EV
    EV -. score, ammo, structure, milestone .-> UI
    UI -- fetch /api --> SV
    G --> R & CR & WG & PC & IN & WP & DM & DE & EF & PH & VM
    CR -- padded chunk --> MW
    MW -- geometry buffers --> CR
    WG -- theme, seed --> GW
    GW -- voxel arrays --> WG
    PC --> W
    WP -- raycast --> W
    WP -- applyDamage --> DM
    DM -- carve, markDirty --> W
    DM -. hit, detonation .-> EV
    WP -. weaponFire, ammoChanged .-> EV
    EV -. subscribed in Game .-> DE & EF & AU & SC
    SC -. scoreChanged, structureDamaged, milestone .-> EV
    DE --> PH --> RP
    SV --> AP
    AP --> TK & VA & DBm
    DBm --> FS
    CFG --- main
    CFG --- workers
```

`Game` owns the systems and the frame loop; `Flow` decides each frame whether the player runs (and drives the orbit/countdown cameras); `UI` owns the DOM. Gameplay never touches the DOM: the HUD and screens subscribe to `events`, and `Flow` is the only thing the screens call. The client talks to the server through `scoring/api.ts` for sessions, score submission, the leaderboard and the top-100 check.

## Sequence: a world loads and becomes walkable

```mermaid
sequenceDiagram
    participant M as main.ts
    participant G as gen.worker
    participant W as World
    participant C as ChunkRenderer
    participant K as mesher.worker
    participant P as Controller
    M->>G: generateWorld(theme, seed)
    G->>G: generateTerrain → heightmap + strata
    G->>G: placeStructures → pads, recipes, owner tags
    G-->>M: mat, owner, height, structures, spawn (transferred)
    M->>W: new World(mat, owner)
    M->>C: setWorld(world)
    M->>P: spawn(pos, yaw)
    loop every frame
        M->>C: update(cameraPos)
        C->>W: copyPadded(chunk)
        C->>K: MeshRequest (nearest dirty chunks)
        K->>K: meshVoxels greedy + AO
        K-->>C: MeshResponse (buffers)
        C->>C: buildGeometry, swap mesh
    end
```

## Sequence: one frame of player movement

```mermaid
sequenceDiagram
    participant M as main.ts
    participant I as Input
    participant P as Controller
    participant W as World
    participant R as Renderer
    M->>P: look(input)
    M->>P: update(dt, input)
    P->>P: wish velocity, gravity, jump
    P->>P: move → sweep(y), sweep(x), sweep(z)
    P->>W: isSolidAt(x,y,z) per overlapped voxel
    P->>P: tryStepUp when blocked on ground
    P->>P: updateCamera
    M->>R: render()
    M->>I: endFrame()
```

## Sequence: the round lifecycle against the server

```mermaid
sequenceDiagram
    actor U as Player
    participant S as Screens
    participant F as Flow
    participant G as Game
    participant A as api.ts
    participant SV as server api.ts
    U->>S: PLAY → pick theme → NEXT → DEPLOY
    S->>F: toWorldPicker / pickTheme / toLoadout / deploy
    F->>G: loadWorld(theme, seed) (on each pick)
    F->>A: startSession(theme, seed)
    A->>SV: POST /session (rate limited per IP)
    SV-->>F: HMAC token {theme, seed, startedAt, nonce}
    F->>F: countdown 3 s → startPlaying (Round.start, lock pointer)
    loop playing
        F->>F: Round.update → tick events
    end
    F->>F: endRound: freeze 1.5 s, Score.active = false
    F->>A: qualifies(theme, score)
    A->>SV: GET /qualifies
    SV-->>F: rank, qualifies, needed
    F->>S: results → initials (if top 100)
    U->>S: type initials, ENTER
    S->>F: submitInitials
    F->>A: submitScore(token, initials, score, stats)
    A->>SV: POST /score
    SV->>SV: verify signature, 150–600 s window, initials, score cap, nonce unused
    SV->>SV: INSERT scores, invalidate cache
    SV-->>S: accepted, rank
    S->>A: leaderboard(theme)
```

## Sequence: placing one structure (gen.worker)

```mermaid
sequenceDiagram
    participant P as placer
    participant R as Recipe
    participant T as terrain arrays
    participant C as StructureCtx
    P->>P: reserve spawn pad (and the desert road)
    P->>R: footprint(rng)
    loop up to 40 attempts: jittered grid cells, then random
        P->>P: rectangle inside the margin, 10 m from everything taken?
    end
    P->>T: stampPad: flatten to the median height, refill strata, update heightmap
    P->>C: new StructureCtx(mat, owner, id, origin)
    P->>R: build(ctx, rng, footprint)
    R->>C: box / hollowBox / cylinder / fill
    C->>T: mat = material, owner = id, totalValue += value
    P->>P: StructureInfo {id, name, totalValue, center}
```

## Sequence: a destroyed voxel becomes points

```mermaid
sequenceDiagram
    participant D as Destruction
    participant E as events
    participant G as Game
    participant S as Score
    D-->>E: hit {destroyed}
    E-->>G: hit
    G->>S: onDestroyed(list)
    S->>S: per voxel with owner: value × multiplier, structure destroyedValue
    S-->>E: structureDamaged (per touched structure)
    S-->>E: structureLeveled (+50 % bonus, once)
    S-->>E: scoreChanged
    S-->>E: milestone (each 1,000)
    E-->>G: milestone → Weapons.grant
    D-->>E: detonation
    E-->>G: detonation
    G->>S: onDetonation → multiplier +0.5, window 2 s
```

## Sequence: one shot, from click to debris

```mermaid
sequenceDiagram
    participant I as Input
    participant WP as Weapons
    participant W as World
    participant D as Destruction
    participant E as events
    participant G as Game (subscriber)
    participant DB as Debris
    participant FX as Effects / Synth
    I->>WP: mousePressed[0]
    WP->>WP: cooldown, ammo, kick view model
    WP->>W: raycast(eye, forward ± spread, range)
    W-->>WP: RayHit
    WP->>D: applyDamage(hit voxel centre, radius, power, id)
    loop voxels in the sphere's bounding cube
        D->>D: energy = power × (1 − d / radius) ≥ hardness?
        D->>W: mat = 0, owner = 0, markDirty
        D->>D: volatile → queue (+150 ms, deduped 2 m)
    end
    D-->>E: emit hit {destroyed, glass, power}
    E-->>G: hit
    G->>DB: spawn(destroyed, centre, power)
    G->>FX: blast / boom / tink
    D-->>WP: Destroyed[] (copied list of pooled records)
```

## Sequence: a chain reaction frame

```mermaid
sequenceDiagram
    participant G as Game.frame
    participant D as Destruction
    participant E as events
    participant CR as ChunkRenderer
    G->>D: update(now)
    D->>D: collect pending entries with at ≤ now
    loop each due detonation
        D-->>E: emit detonation
        D->>D: applyDamage(centre, radius, power, "chain")
    end
    G->>CR: update(camera)
    CR->>CR: dirty chunks → mesher workers, nearest first
```

## Sequence: a grenade's life

```mermaid
sequenceDiagram
    participant WP as Weapons
    participant W as World
    participant D as Destruction
    WP->>WP: spawnGrenade: eye + forward + arc, player velocity added
    loop every frame
        WP->>WP: vel.y −= gravity · dt
        WP->>W: raycast(pos, step dir, |step| + radius)
        alt hit
            WP->>WP: stop at the surface, reflect normal × restitution, damp tangent
        else
            WP->>WP: pos += step
        end
        WP->>WP: fuse −= dt
    end
    WP->>D: applyDamage(pos, 2.5 m, 40, "grenade")
```

## Data types: world and destruction

```mermaid
classDiagram
    class World {
        Uint8Array mat
        Uint16Array owner
        Uint8Array dirty
        StructureInfo[] structures
        Vec3 spawn
        getVoxel(x,y,z) number
        setVoxel(x,y,z,m,owner)
        isSolidAt(x,y,z) boolean
        raycast(origin,dir,maxDist) RayHit
        copyPadded(chunkIndex,out)
    }
    class Chunk {
        number index
        Vector3 origin
        Mesh opaque
        Mesh transparent
        boolean pending
        number version
    }
    class RayHit {
        number x,y,z
        Vec3 face
        number mat
        number owner
        Vec3 point
        number dist
    }
    class StructureInfo {
        number id
        string name
        number totalValue
        Vec3 center
        number voxels
    }
    class Flow {
        ScreenName state
        ThemeId theme
        string seed
        Round round
        Session session
        RoundResult result
        boot(), deploy(), pause(), resume()
        endRound(), submitInitials(), playAgain()
        update(rawDt) boolean
    }
    class Round {
        number remaining
        boolean running
        start(), stop(), addTime(), update(dt)
    }
    class RoundResult {
        number score, voxelsDestroyed
        number structuresLeveled, bestChain
        number arenaPercent, rank, needed
        boolean qualifies
    }
    Flow *-- Round
    Flow --> RoundResult
    class Score {
        number score, multiplier, comboRemaining
        number chain, bestChain
        number voxelsDestroyed, structuresLeveled
        number arenaTotal, nextMilestone
        boolean active
        reset(structures)
        onDestroyed(list)
        onDetonation()
        update(dt)
        structure(id)
    }
    class Destroyed {
        number x,y,z
        number mat
        number owner
    }
    World "1" o-- "256" Chunk : rendered by ChunkRenderer
    World --> RayHit
    World --> StructureInfo
    World --> Destroyed : applyDamage output
    Score o-- StructureInfo : registry
    Score ..> Destroyed : owner + mat
```

## Data types: mesher output and config tables

```mermaid
classDiagram
    class MeshBuffers {
        Float32Array position
        Float32Array normal
        Uint8Array color
        Uint8Array emit
        Uint32Array index
    }
    class MeshResult {
        MeshBuffers opaque
        MeshBuffers transparent
    }
    class Material {
        number id
        string color
        number value
        number hardness
        flags terrain,transparent,shatters,emissive
        pattern
        volatile power,radius
    }
    class Weapon {
        string id
        number slot
        WeaponKind kind
        number radius,power
        number magSize,totalAmmo
        ModelBox[] model
    }
    class ThemeDef {
        ThemeId id
        number reliefM
        strata
        string[] pool
        structureCount, minGapM
        sky,fog,sun colours
    }
    class Recipe {
        string id, name
        footprint(rng) Footprint
        build(ctx, rng, fp)
    }
    class StructureCtx {
        number id, totalValue, voxels
        origin
        box(...)
        hollowBox(...)
        cylinder(...)
        fill(...)
        center()
    }
    Recipe ..> StructureCtx : draws through
    ThemeDef ..> Recipe : pool names
    MeshResult *-- MeshBuffers
    Material <.. MeshBuffers : colour and pattern baked in
    ThemeDef <.. Material : strata are material ids
```

## Function tree

Legend: **[main]** main thread · **[worker]** Web Worker · **[server]** Node · **[pure]** usable anywhere · **(unwired)** not called by the running game.

- `config/` **[pure]** — data tables only: `world.ts`, `materials.ts`, `weapons.ts`, `scoring.ts`, `milestones.ts`, `themes.ts`, `player.ts`, `effects.ts`
  - `materialOf(id) → Material | undefined` — lookup
  - `milestoneFor(index) → MilestoneTier` — callout + reward for the nth milestone (unwired)
- `client/src/main.ts` **[main]** — boot: builds `Game`, reads `?theme&seed&test`, exposes `window.__vw` for probes
- `client/src/game/Flow.ts` **[main]**
  - `Flow(game)` — state machine; subscribes `milestone` (time reward) and pointer-lock loss (pause)
  - `boot(theme?, seed?)` — random arena for the menu backdrop
  - `loadArena()` — regenerate for the current theme + seed (menu, picker, play again)
  - `toMenu()`, `toWorldPicker()`, `pickTheme(id)`, `setSeed(s)`, `randomSeed()`, `toLoadout()`
  - `deploy()` — session from the server, reset weapons/score, countdown
  - `startPlaying()`, `pause()`, `resume()`, `quitToMenu()`
  - `endRound()` — freeze, `roundEnd`, top-100 lookup, `RoundResult`
  - `toResults()`, `afterResults()`, `submitInitials(s)`, `toLeaderboard()`, `playAgain()`
  - `setRadial(open)` — 30 % time scale while the picker is open
  - `canvasClick()` — re-request pointer lock mid-round; `skipCountdown()` — debug
  - `set(state)` also starts/stops the menu music; countdown and end-freeze run on wall-clock deadlines so slow frames do not stretch them
  - `update(rawDt) → boolean` — orbit camera in menus, countdown swoop, clock while playing; returns whether the controller runs
  - `updateFreeze(rawDt)` — moves to results after the slow-motion freeze
- `client/src/state/Round.ts` **[main]**
  - `start()`, `stop()`, `addTime()`, `update(dt) → boolean` — 180 s clock, `tick` once a second, true when it hits zero
- `client/src/scoring/api.ts` **[main]**
  - `api.health()`, `startSession(theme, seed)`, `submitScore(token, initials, score, stats)`, `leaderboard(theme, limit)`, `qualifies(theme, score)`
- `client/src/ui/UI.ts` **[main]**
  - `UI(root, game, flow)` — builds every screen and HUD widget, maps `Flow` states to screens, shows the HUD in a round
  - `showOverlay(screen)` — settings / credits on top of a screen
  - `update(dt, now, game, flow)` — countdown number, radial, crosshair, combo ring, readout timeout
- `client/src/ui/Screen.ts` — `show()/hide()` with enter/leave animation, `onShow()/onHide()`
- `client/src/ui/dom.ts` — `h`, `button`, `fmt`, `tickNumber`, `pop`, `settings.load/save` (localStorage)
- `client/src/ui/screens/` **[main]** — `Menu` (best strip), `WorldPicker` (cards, seed, dice, top scores), `Loadout` (eight scissored model viewports via `renderViews`), `Pause`, `Settings` (sensitivity/volume/FOV sliders), `Credits`, `Results` (count-ups), `Initials` (three columns, typing + arrows), `Leaderboard` (tabs, top 10, highlight)
- `client/src/ui/hud/` **[main]** — `ScoreBar` (score tick, milestone fill, combo badge + ring), `Timer`, `Ammo` (mag/reserve/reload/pips/armed), `Radial` (Q hold, mouse-direction select), `StructureReadout` (3 s, LEVELED stamp), `Crosshair` (spread, hit marker), `Callouts` (milestone slam + flash), `Countdown`
- `client/src/game/Game.ts` **[main]**
  - `Game(canvas, uiRoot)` — constructs every system, subscribes to events
  - `flow`, `uiUpdate`, `afterRender` — hooks the state machine and UI into the frame
  - `init()` — Rapier init, debris pool
  - `loadWorld(theme, seed, terrainOnly)` — generate, install, heightfield, spawn, warm-up, wait for meshes
  - `warmup()` — carves a scratch world and steps physics so first-call JIT/first-contact costs are paid before play
  - `whenMeshed() → Promise` — resolves when no chunk is dirty
  - `start()`, `frame()` — the loop: look, move, weapons, chains, physics, debris, effects, view model, shake, chunks, render
  - `onFrame(fn)` — extra per-frame hooks
  - `stampTestWall()` — `?test=wall` harness: brick wall, fuel tank, propane, glass, concrete
- `client/src/render/Renderer.ts` **[main]**
  - `GameRenderer(canvas)` — WebGL2 renderer, camera, sun with shadow map, hemisphere light, overlay scene
  - `resize()` — fit the window
  - `setFov(fov)` — base camera FOV (settings); `setZoom(mul)` — aim zoom multiplier applied to both cameras
  - `setTheme(theme)` — sky, fog, sun colours from the theme table
  - `render()` — world pass then overlay pass
- `client/src/world/World.ts` **[main]** (also constructed in tests)
  - `voxelIndex(x,y,z) → number`, `chunkIndex(cx,cy,cz) → number` — flat-array indexing
  - `getVoxel(x,y,z) → number` — material id, 0 outside
  - `getOwner(x,y,z) → number` — structure id
  - `isSolidAt(x,y,z) → boolean` — collision query; arena walls and bedrock count as solid
  - `setVoxel(x,y,z,mat,owner)` — write + dirty tracking
  - `markDirty(x,y,z)` — flags the chunk and border neighbours
  - `surfaceY(x,z) → number` — topmost solid voxel
  - `copyPadded(chunkIndex,out)` — 34³ copy with neighbour border for the mesher
  - `raycast(origin,dir,maxDist) → RayHit | null` — Amanatides–Woo DDA
- `client/src/world/Chunk.ts` **[main]**
  - `Chunk(index)` — render state for one 32³ chunk
  - `distSq(point) → number` — remesh priority
- `client/src/world/mesher.ts` **[pure]**
  - `patternFactor(mat,x,y,z) → number` — brick rows, siding, checker, marble tint
  - `meshVoxels(vox, opts) → MeshResult` — greedy quads, vertex AO baked into colour, transparent pass
  - `transferables(result) → ArrayBuffer[]` — buffers to transfer out of a worker
- `client/src/world/mesher.worker.ts` **[worker]**
  - `onmessage(MeshRequest)` — meshes one padded chunk, posts `MeshResponse`
- `client/src/world/VoxelMaterial.ts` **[main]**
  - `createOpaqueMaterial(voxelSize)`, `createTransparentMaterial(voxelSize)` — Lambert + vertex colour + shader-side per-voxel jitter + emissive attribute
  - `buildGeometry(buffers) → BufferGeometry` — wraps worker output
- `client/src/world/ChunkRenderer.ts` **[main]**
  - `ChunkRenderer(world)` — 256 chunks, 2 mesher workers
  - `setWorld(world)` — drop meshes, remesh everything
  - `idle → boolean` — nothing dirty or in flight
  - `update(focus)` — send nearest dirty chunks, up to `perFrame`
  - `send(chunk)`, `onResult(response)` — worker round trip, stale-version guard
  - `dispose()`
- `client/src/world/WorldGen.ts` **[main]**
  - `generateWorld(theme, seed, terrainOnly) → Promise<{world, height, ms}>` — runs the gen worker once
- `client/src/world/gen/gen.worker.ts` **[worker]**
  - `onmessage(GenRequest)` — terrain + placement, posts arrays
- `client/src/world/gen/terrain.ts` **[worker]**
  - `generateTerrain(theme, rng, mat) → {height}` — simplex heightmap, strata fill
  - `desertRoad(x,z,h)`, `surfaceOverride(theme,x,z,noise)`, `fillColumn(...)` — theme overlays
- `client/src/world/gen/placer.ts` **[worker]**
  - `placeStructures(theme, rng, mat, owner, height, terrainOnly) → Placed` — reserves the spawn pad (and the desert road), picks 6–10 recipes from the pool, jittered-grid then random placement with a 10 m gap, stamps pads, builds, returns `StructureInfo[]` + spawn
  - `stampPad(theme, mat, height, rect, h)` — flatten to h, refill strata, keep the heightmap in sync
  - `padHeight(height, rect) → number` — median terrain height under a rectangle
  - `reserved(theme) → Rect[]`, `overlaps(a, b, gap)`
- `client/src/world/gen/StructureCtx.ts` **[worker]**
  - `StructureCtx(mat, owner, id, origin)` — local voxel coordinates, y = 0 on the pad
  - `set(x,y,z,m)` — writes material + owner, keeps `totalValue`, `voxels` and bounds
  - `box(...)`, `hollowBox(..., thickness, floor, roof)`, `cylinder(cx, cz, r, y0, y1, m, hollow)`, `fill(..., fn)` — drawing helpers
  - `center() → Vec3` — metres
- `client/src/world/gen/recipes/` **[worker]** — `Recipe = { id, name, footprint(rng), build(ctx, rng, fp) }`
  - `desert.ts`: `gasStation`, `diner`, `billboard`, `waterTower`, `propaneCage`
  - `downtown.ts`: `convenienceStore`, `officeBlock`, `parkingStructure`, `busShelter`
  - `park.ts`: `monument`, `fountain`, `gazebo`, `statue`, `shed`
  - `index.ts`: `RECIPES` by id
- `client/src/scoring/Score.ts` **[main]**
  - `reset(structures)` — registry and arena total
  - `onDestroyed(list)` — value × multiplier for owned voxels, structureDamaged / structureLeveled events
  - `onDetonation()` — combo step and window
  - `update(dt)` — combo decay
  - `add(delta)` — scoreChanged + milestone events
  - `structure(id)`, `arenaPercent`
- `client/src/player/Input.ts` **[main]**
  - `Input(canvas)` — key set, mouse buttons, wheel, movement deltas, pointer lock
  - `requestLock()`, `releaseLock()`, `down(code)`, `wasPressed(code)`, `endFrame()`
- `client/src/player/Controller.ts` **[main]**
  - `Controller(world, camera)` — AABB 0.6 × 1.8 m, feet position
  - `spawn(pos, yaw)`, `eye() → Vector3`, `forward() → Vector3`
  - `look(input)` — yaw/pitch from mouse deltas
  - `update(dt, input)` — acceleration, jump, gravity, then `move`
  - `move(dx,dy,dz)` — per-axis sweep with step-up
  - `tryStepUp(axis, d) → boolean`
  - `sweep(axis, d) → boolean` — sub-stepped overlap test against `World.isSolidAt`
- `client/src/debug/DebugOverlay.ts` **[main]**
  - `toggle()`, `set(lines)`, `frame(dtMs)` — fps, worst frame, mesher stats
- `client/src/util/` **[pure]**
  - `rng.ts`: `hashSeed`, `mulberry32`, `rngFromSeed`, `randInt`, `randRange`, `pick`, `voxelHash`, `randomSeedString`
  - `events.ts`: `Emitter.on/off/emit/clear`
  - `color.ts`: `hexToRgb`, `packRgb`, `clamp255`
  - `growable.ts`: `GrowF32`, `GrowU8`, `GrowU32` push/slice
  - `vec.ts`: `Vec3`, `v3`, `dist3`
- `client/src/state/events.ts` **[main]** — `GameEvents` type and the shared `events` emitter. Emitted today: `hit`, `detonation`, `weaponFire`, `weaponSwitch`, `ammoChanged`, `placedCharge`. Declared but not yet emitted: `structureDamaged`, `structureLeveled`, `scoreChanged`, `combo`, `milestone`, `roundEnd`, `tick`
- `client/src/destruction/damage.ts` **[main]**
  - `Destruction(world)`
  - `applyDamage(center, radius, power, source) → Destroyed[]` — sphere carve, glass shatters on any energy, volatile queue; records are pooled, the list is a copy
  - `update(now)` — fires due detonations as chained `applyDamage` calls, emits `detonation`
  - `setWorld(world)`, `pendingCount`
- `client/src/physics/PhysicsWorld.ts` **[main → WASM]**
  - `PhysicsWorld.init()`, `create(gravity)` — Rapier init
  - `setTerrain(height)` — static heightfield from the surface (not updated when terrain is carved)
  - `update(dt)` — fixed 60 Hz stepping, at most 2 sub-steps per frame
- `client/src/destruction/Debris.ts` **[main]**
  - `spawn(list, center, power)` — up to 24 cuboids per blast, 300 cap, glass splits smaller; one InstancedMesh with per-instance colour
  - `update(now)` — copies body transforms into the InstancedMesh, shrinks over the last 0.5 s, expires at 4 s
  - `clear()`
- `client/src/destruction/effects.ts` **[main]**
  - `blast(center, power, viewer, glass)` — shake amount from power/distance, additive flash sprite, particle burst
  - `applyShake(camera)` — random offset + roll after the controller placed the camera
  - `update(dt, now)` — decay shake, fade flashes, integrate particles
- `client/src/audio/Synth.ts` **[main]**
  - `prime()` — create the AudioContext and noise buffer early
  - `boom(power, dist)`, `shot(kind)`, `tink(dist)`, `swing(hit)`, `click(pitch)`, `stinger()` — procedural sounds; distance sets gain and low-pass
  - `startMusic()`, `stopMusic()`, `musicPlaying` — four-chord bass + arpeggio loop scheduled a bar at a time (`MUSIC` in config)
  - `setVolume(v)`
- `client/src/player/Weapons.ts` **[main]**
  - `Weapons(world, player, destruction, view)` — eight `WeaponState`s from the config table
  - `update(dt, now, input)` — cooldowns, reload timers, delayed melee resolve, select keys/wheel, R, G, trigger, projectiles
  - `select(i)`, `reload(state)`, `grant(id, n)`, `reset()`, `emitAmmo()`
  - `fire(state) → boolean` — melee swing, hitscan pellets, rocket spawn, grenade throw, C4 place-or-detonate
  - `throwGrenade()` — G from any weapon
  - `centreFor(hit)` — damage centre snapped to the hit voxel's centre
  - `spawnGrenade()`, `updateGrenades(dt)` — hand-rolled ballistics with voxel raycast bounces, fuse
  - `spawnRocket()`, `updateRockets(dt)` — raymarched flight, explodes on contact or at max range
  - `placeCharge(point, face)`, `detonateCharges()` — C4 meshes stuck to faces, all fire together
- `client/src/player/ViewModel.ts` **[main]**
  - `voxelsFromBoxes(boxes, size)`, `buildModelMesh(boxes, size, voxelM) → Group` — tiny voxel models meshed on the main thread with the world mesher
  - `ViewModel(weapons)` — one model per weapon plus two hand blocks and a muzzle-flash quad, attached to the overlay camera
  - `select(id)`, `kick(amount, now, muzzle)`, `startSwing()`, `update(dt, now, moving, speed)` — recoil, bob, swing arc, flash timing
- `server/src/index.ts` **[server]** — Hono app: serves `client/dist`, mounts `/api`
- `server/src/api.ts` **[server]**
  - `createApi({db, signer, skipTimeCheck, now}) → Hono` — `GET /health`; `POST /session` (10/min per IP, signed token); `POST /score` (signature, 150–600 s window, initials + profanity, per-theme cap, single-use nonce, IP hash only); `GET /leaderboard?theme&limit` (5 s cache); `GET /qualifies?theme&score`
- `server/src/db.ts` **[server]**
  - `Db(file)` — `scores` table with `(theme, score DESC)` index, `used_tokens`, WAL
  - `insertScore(row)`, `top(theme, limit)`, `rankFor(theme, score, prospective)`, `cutoff(theme)`, `useToken(nonce, now)`, `pruneTokens(now, maxAge)`, `close()`
- `server/src/token.ts` **[server]**
  - `TokenSigner(secret)` — `sign(payload)`, `verify(token)` (timing-safe), `TokenSigner.nonce()`
  - `resolveSecret(env)` — `SCORE_SECRET` or a random per-process secret with a warning
- `server/src/validate.ts` **[server]**
  - `cleanInitials(s)` — `^[A-Z ]{3}$`, profanity → `???`
  - `validScore(theme, score)` — integer, 0 … themeMax × 5
  - `validElapsed(startedAt, now, skip)` — 150–600 s
  - `RateLimiter(limit, windowMs).allow(key, now)`
  - `isTheme(t)`, `maxScoreFor(theme)`
- `scripts/screenshots.mjs` — Playwright capture of `?screen=` pages against the built server
- `scripts/dev/probe.mjs` — headless probe that evaluates a script against `window.__vw`

## Built mechanics → implementing function

| Player mechanic (works today) | Function |
| --- | --- |
| Arena generates from theme + seed | `generateWorld` → `generateTerrain` |
| Dunes, road, sidewalk grid, gravel paths | `desertRoad`, `surfaceOverride`, `fillColumn` |
| World appears chunk by chunk, nearest first | `ChunkRenderer.update` → `mesher.worker` |
| Brick rows, siding, marble, per-voxel speckle | `patternFactor`; jitter in `VoxelMaterial` shader |
| Corners look shaded | AO in `meshVoxels` |
| Mouse look after clicking | `Input.requestLock`, `Controller.look` |
| Walk, sprint, jump | `Controller.update` |
| Can't walk through terrain, climbs single steps | `Controller.sweep`, `Controller.tryStepUp` |
| Can't leave the arena | `World.isSolidAt` boundary rule |
| Stats readout (F3) | `DebugOverlay` |
| Switch weapon (1–8, wheel) | `Weapons.update` → `Weapons.select` |
| Pickaxe / bat swing | `Weapons.fire` (melee) → `resolveMelee` → `applyDamage` |
| Pistol / shotgun / rifle shots, spread, aim tightens spread | `Weapons.fire` (hitscan) → `spreadDir` → `World.raycast` → `applyDamage` |
| Rocket flight and impact | `spawnRocket`, `updateRockets` |
| Grenade arc, bounce, fuse; G from any weapon | `spawnGrenade`, `updateGrenades`, `throwGrenade` |
| C4 placement and group detonation | `placeCharge`, `detonateCharges` |
| Reload and ammo counts | `Weapons.reload`, `Weapons.update`, `emitAmmo` |
| Sphere carving by material hardness | `Destruction.applyDamage` |
| Glass shatters on any hit | `shattersOf` check in `applyDamage` |
| Fuel / propane / transformer chain reactions | volatile queue in `applyDamage`, `Destruction.update` |
| Debris cubes that tumble on the terrain | `Debris.spawn`, `Debris.update`, `PhysicsWorld.setTerrain` |
| Screen shake, flash, sparks | `Effects.blast`, `Effects.applyShake`, `Effects.update` |
| Boom, gunshot, glass tink, swing whoosh, clicks | `Synth.*`, routed in `Game.subscribe` |
| Gun in hand with recoil, bob, muzzle flash | `ViewModel.*` |
| Test wall with tank behind it (`?test=wall`) | `Game.stampTestWall` |
| Six to ten structures per arena, same seed same arena | `placeStructures`, `RECIPES` |
| Buildings stand on flattened pads | `stampPad`, `padHeight` |
| Each structure's voxels carry its id and its value is known | `StructureCtx.set` |
| Structure voxels pay value × multiplier, terrain pays nothing | `Score.onDestroyed` |
| Combo multiplier from chain detonations, 2 s window | `Score.onDetonation`, `Score.update` |
| Leveled bonus, once per structure | `Score.onDestroyed` |
| Milestones every 1,000 with ammo rewards and a stinger | `Score.add`, `Game.subscribe` → `Weapons.grant` |
| +5 s milestone reward | `Flow` → `Round.addTime` |
| Menu over an orbiting live arena | `Flow.update` (menu states), `Flow.boot` |
| Theme cards rebuild the arena, seed + dice | `WorldPickerScreen`, `Flow.pickTheme`, `Flow.setSeed` |
| Loadout briefing with spinning models | `LoadoutScreen.renderViews` |
| 3-2-1 countdown with the camera dropping in | `Flow.update` (countdown), `Countdown` |
| 3:00 clock, red under 30 s | `Round`, `Timer` |
| Score bar, combo badge and ring | `ScoreBar` |
| Radial picker with slow motion | `Radial`, `Flow.setRadial` |
| Ammo panel, pips, ARMED | `Ammo` |
| Structure readout and LEVELED stamp | `StructureReadout` |
| Crosshair spread and hit markers | `Crosshair` |
| Milestone callouts and screen flash | `Callouts` |
| Esc pauses, pointer-lock loss pauses | `UI` keydown, `Input.onLockChange` → `Flow.pause` |
| Settings remembered between visits | `SettingsScreen`, `settings.save` |
| Slow-motion round end, results count-up | `Flow.endRound`, `Flow.updateFreeze`, `ResultsScreen` |
| Top-100 check, initials, submission, leaderboard tabs | `Flow.endRound` → `api.qualifies`, `InitialsScreen`, `Flow.submitInitials`, `LeaderboardScreen` |
| Scores survive a restart; forged or replayed scores are rejected | `Db`, `TokenSigner`, `validate.ts`, `createApi` |
| Contextual placement (roadside, blocks, paths, hills) | `candidates` in `placer.ts`, `Recipe.siting` |
| Voxel outlines, bevel, hatch | `VoxelMaterial` fragment shader |
| Menu music loop | `Synth.startMusic`, `Flow.set` |
| Aim zoom | `Game.frame` → `GameRenderer.setZoom` |
| Control hint during countdown and the first seconds | `UI` (`hud-hint`) |
| Desktop-only notice on touch devices | `main.ts` |
| Esc during a round pauses; Esc on pause resumes (debounced); click re-locks | `Input.onLockChange`, `UI` keydown, `Flow.canvasClick` |

## Planned, not built

Modules in SPEC.md "Project structure" with no code at this commit:


## Changelog

- 2026-11-04: Phase 6 — music loop, aim zoom, hints, notice, wall-clock UI timers
- 2026-11-04: Phase 5 — db.ts, token.ts, validate.ts, real api.ts; server subgraph and lifecycle sequence updated
- 2026-11-04: Phase 4 — Flow, Round, api.ts, in-memory server routes, UI root, nine screens, eight HUD widgets; contextual siting and the outline shader; round lifecycle sequence
- 2026-11-04: Phase 3 — StructureCtx, placer, 14 recipes, Score wired into Game; placement and scoring sequences
- 2026-11-04: Phase 2 — Game loop, Weapons, ViewModel, Destruction wired, Debris on Rapier heightfield, Effects, Synth; sequences for a shot, a chain frame and a grenade
- 2026-11-04: Initial snapshot at 580cf52
