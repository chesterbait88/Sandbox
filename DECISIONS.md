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
