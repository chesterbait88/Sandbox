# Decisions

- **Docker deferred.** The user asked to iterate locally first; `Dockerfile`/`docker-compose.yml` are written but not part of any gate. `pnpm build && pnpm start` serves the built client and API on one port, which is what the container will run.
- **Server is bundled with esbuild** so it can import the shared `config/` TypeScript directly; `better-sqlite3` stays external.
- **Playwright** pins 1.63.0 to match the browser preinstalled in the build sandbox; the screenshot script uses `CHROMIUM_PATH` or `/opt/pw-browsers/chromium`.
- **Gravel and Water** were added to `materials.ts` (ids 6, 7) because the Memorial Park theme calls for gravel paths and a fountain with water; both are terrain-value materials.
