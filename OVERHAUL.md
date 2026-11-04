# Visual overhaul — working brief (delete when every item below is done)

Written mid-session so the plan survives a cut-off. Branch: `claude/magical-allen-n38z7b`. Each step is its own commit; `git log` shows what landed.

## What the user asked for (verbatim gist)

- The world looks like a cheap Minecraft clone: plain, uninviting landscape; voxels far too big for the structures. Smaller voxels, smaller worlds, more resolution.
- Weapons look cut off and do not adhere to the block size. Build them fully from (small) voxels with real definition.
- Colour scheme is bland; the menu is plain and uses Claude orange. Go neon, drop the orange.
- Text floats in the HUD; everything needs a box/outline so it looks anchored.
- Score bar flush with the actual top edge; timer flush in the top-right corner; ammo as a quarter circle anchored in the bottom-right corner; weapon/ammo section anchored in the corner too.
- No dim/muted text anywhere; everything legible and popping.
- Remove the in-round control hint; put the controls on one of the first selection screens (loadout).
- Structure destruction percentage anchored to the bottom, legible, in its own container.
- No diagonal/clipped buttons (leaderboard looked cut off); straight buttons.
- Milestone callout ("WRECKING") at the bottom of the screen (or top-left), out of the viewport centre.
- "JWT" in the first message was voice-to-text noise; ignore.

## Decisions taken so far

1. Voxel 0.5 m → **0.25 m**; arena 128 × 64 × 128 m → **96 × 40 × 96 m** (384 × 160 × 384 voxels, 720 chunks, same order of voxel count ×2.8). Ground base level 16 m → 8 m.
2. Every metre↔voxel conversion goes through `VOXEL_SIZE` (StructureCtx, damage bounds, warm-up, swatches, gallery helpers, menu camera). `CITY`, `ROAD`, `SITING` are now in metres (`*M` fields).
3. Shader stylisation (outline/bevel/hatch) is scaled per surface class: terrain faces carry a `terr` attribute and use `RENDER.terrainStyle`; the weapon in hand uses `RENDER.viewModelStyle`.
4. Recipes are to be authored in **metres** via `m()` from `recipes/types.ts` (was raw voxel counts) and re-detailed for 0.25 m.
5. Props are recipes with `prop: true` from `THEMES[t].props` / `propCount`, placed after structures with a 1 m gap and no pad margin; they score but never count as "structures leveled" (`StructureInfo.prop`).
6. New materials 23–35: leaves, bark, rubber, three enamels (props) and rock, dark sand, road paint, lane paint, kerb, dry grass, flowers (terrain, worth 0). `MAX_MATERIAL_ID` 40.
7. Terrain variety: desert gets double-yellow centre line + white edge lines, rock on steep slopes, dark-sand hollows; downtown gets kerbs and dashed lane lines; park gets dry-grass tops, flower dips, rocks on slopes.
8. Volatile dedupe radius 2 → 2.5 m (a 2 m tank's far voxel centres are 2.2 m apart at 0.25 m).
9. Debris cube 0.5 → 0.3 m; collapse body limits ×8 (48 … 480 000 voxels).
10. Uniform chunks (all air / solid opaque) skip the mesher worker; the carve iterates only sphere rows.
11. Weapon view model: new canvas at 1 cm voxels, hands built into every model (the old hand blocks sat below the frame — that was the "cut off" look), distinct silhouettes; loadout showcase camera in `VIEW_MODEL.showcase`.
12. UI: tokens → near-black ink, electric cyan primary, hot magenta secondary, acid green good, no orange; Anton stays for display. Straight buttons.

## Performance (0.25 m, sandbox = SwiftShader on a slow CPU)

Before: C4 in an office block (~4 100 voxels) → carve 20–27 ms, collapse check 19–41 ms on the main thread, Rapier step 15–50 ms every frame while a floor fell, worst frame 70–100 ms, 1.5 s shader compile on the first blast. After the perf commit: Rapier step 1–2 ms (one 17–34 ms step when debris inserts), collapse check 46 ms on the worker + 10–20 ms main-thread copy, pure carve 1.6 ms (node), milestone callout 22 → 11 ms (UI fork removing the forced reflow). Remaining main-thread cost per blast ≈ 24 ms in the sandbox, mostly the hit handlers; real hardware is several times faster. Re-measure with `scripts/dev/probe.mjs` (`CLIENT_DIST=... PROBE=...`).

## Step order and status

| # | Step | Status |
| --- | --- | --- |
| 1 | Scale-factor fixes | committed |
| 2 | Shader class split | committed |
| 3 | Voxel 0.25 m + metre constants + props plumbing + terrain variety | committed |
| 4 | Recipes re-authored in metres with detail; prop recipes (cactus, rock, car, roadSign, lampPost, dumpster, hydrant, tree, bench) | committed |
| 5 | Weapon models + hands | pending |
| 6 | Theme colours (dusk/neon) + UI/HUD restyle per the list above | pending |
| 7 | Blast-frame performance: collapse on a worker, box cluster bodies, 0.5 m heightfield, debris spread, dirty box, shader pre-compile | committed; re-measure after the UI fork removes the callout reflow |
| 8 | Gallery regenerate, docs/PLAYER-FLOW + DEVELOPER-TREE changelog, DECISIONS.md, PROGRESS.md, push | pending |
