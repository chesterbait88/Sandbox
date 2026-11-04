# Decisions

- **Docker deferred.** The user asked to iterate locally first; `Dockerfile`/`docker-compose.yml` are written but not part of any gate. `pnpm build && pnpm start` serves the built client and API on one port, which is what the container will run.
- **Server is bundled with esbuild** so it can import the shared `config/` TypeScript directly; `better-sqlite3` stays external.
- **Playwright** pins 1.63.0 to match the browser preinstalled in the build sandbox; the screenshot script uses `CHROMIUM_PATH` or `/opt/pw-browsers/chromium`.
- **Gravel and Water** were added to `materials.ts` (ids 6, 7) because the Memorial Park theme calls for gravel paths and a fountain with water; both are terrain-value materials.
- **World storage is one flat `Uint8Array` + `Uint16Array`** (8.4 M voxels, ~25 MB) instead of per-chunk arrays. Padded chunk copies for the mesher become contiguous row copies, and the owner array is always allocated (simpler than lazily per chunk). `Chunk.ts` holds render state only.
- **Per-voxel colour jitter is applied in the fragment shader** from world position (stable across remeshes) rather than baked per vertex, so greedy merging still works. AO is baked into vertex colour; neon uses an `emit` vertex attribute instead of a third mesh.
- **Sidewalk** (id 8) was added as a terrain-valued concrete look-alike so Downtown sidewalks score nothing.
- **FPS claims**: the sandbox has no GPU; frame timing is measured for CPU-side work (mesher, controller, damage) and the GPU budget is kept by construction (few hundred draw calls, vertex colours only).
- **Volatile dedupe radius is 2 m** (spec said 1 m): a 1×1×2 m fuel tank detonated twice at 1 m. One detonation per tank is the intent.
- **Grenades and rockets use hand-rolled ballistics against the voxel grid** (raycast per step, reflect on bounce) instead of Rapier bodies: Rapier only knows the terrain heightfield, so a Rapier grenade would fly through every wall. Rapier is reserved for debris.
- **Bullet and melee damage is centred on the hit voxel's centre** (`snapToVoxelCentre`) so the hit voxel always receives full power and hits at voxel edges do not fizzle. Pistol power was retuned 5 → 2.5 and rifle 9 → 6 so that pistol pops glass/drywall/wood, rifle and shotgun eat brick and concrete, and nothing but explosives touches steel.
- **View-model voxels are 0.025 m, not 0.1 m**: at 0.1 m a 24-voxel gun is 2.4 m long and fills the screen. The models still read as chunkier than the world.
- **Debris has CCD off and physics takes at most 2 sub-steps per frame**; CCD on 24 fresh bodies cost 15 ms in one step. Pieces move under 0.3 m per step so tunnelling through the heightfield is not an issue.
- **A warm-up pass runs at world load** (scratch carve, Rapier steps, AudioContext creation) because the first calls were 10–50× slower than warm ones.
- **One InstancedMesh for all debris** with per-instance colour instead of one per material; same look, one draw call.
- **The terrain heightfield is static**: carving terrain does not update it, so debris may rest on the pre-crater surface. Accepted for the MVP.
- **Volatile dedupe radius is 2 m** (see above).
