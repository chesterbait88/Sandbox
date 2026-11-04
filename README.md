# Voxel Wreck

A first-person browser demolition game: drop into a procedurally generated voxel arena with a fixed loadout and three minutes to wreck as much of the structures as you can. Chain reactions through fuel tanks, propane and transformers are the combo. Three-letter initials on a leaderboard at the end.

Three.js + TypeScript + Vite client with a hand-written voxel engine (greedy mesher in Web Workers), Rapier (WASM) for debris, Web Audio for every sound, and a small Node + Hono + SQLite API that serves the client and the leaderboard from one process.

## Run it locally

```bash
pnpm install
pnpm dev
```

Client on <http://localhost:5173> (proxying `/api` to the server on 8080). Or build and serve everything from one port:

```bash
pnpm build
pnpm start
```

Then open <http://localhost:8080>.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server + API with reload |
| `pnpm build` | Build the client (`client/dist`) and bundle the server (`server/dist`) |
| `pnpm start` | Serve the built client and `/api/*` on `PORT` |
| `pnpm test` | Vitest: mesher, world, damage, scoring, placement, server API |
| `pnpm typecheck` | Strict TypeScript across the workspace |
| `pnpm screenshots` | Playwright screenshots of every screen into `screenshots/` |
| `pnpm diagrams` | Validate the Mermaid diagrams in `docs/` |
| `node scripts/dev/e2e.mjs` | Play a full round through the DOM headlessly |

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port |
| `DATA_DIR` | `./data` | Directory holding `scores.db` (SQLite, WAL mode) |
| `SCORE_SECRET` | random per process | HMAC secret for session tokens. **Set it in production**, otherwise tokens stop working on restart |
| `VW_DEV_NO_TIME_CHECK` | unset | `1` disables the 150–600 s round window check (development only) |

## Deploy as a single container

The `Dockerfile` builds the client and server and runs them from one `node:20-alpine` image. Mount a volume at `/data` and set `SCORE_SECRET`:

```bash
SCORE_SECRET=change-me docker compose up --build
```

`docker-compose.yml` exposes port 8080 and keeps scores in the `scores` volume. The container's health check hits `/api/health`.

> The Docker build is written to the spec but was not exercised in the environment this was built in (no Docker daemon). `pnpm build && pnpm start` is the same thing without the container.

## How the leaderboard stays honest

Casual-grade anti-cheat: the client gets a signed session token when a round starts, a score is accepted only with a valid token, once, between 150 and 600 s after the session started, with initials matching `^[A-Z ]{3}$` (a short profanity list turns offenders into `???`), and below a per-theme plausibility cap. Session creation is rate limited per IP; only a hash of the IP is stored.

## Project layout

- `config/` — every tunable number: materials, weapons, scoring, milestones, themes, player, effects
- `client/src/` — `world/` (chunks, mesher, generation, recipes), `destruction/`, `physics/`, `player/`, `scoring/`, `audio/`, `game/` (loop + flow), `ui/` (screens + HUD)
- `server/src/` — Hono app, SQLite, tokens, validation
- `docs/` — living diagrams: `PLAYER-FLOW.md` (the game as played) and `DEVELOPER-TREE.md` (the code as built)
- `SPEC.md`, `PROGRESS.md`, `DECISIONS.md`

## Controls

WASD move · Shift sprint · Space jump · Mouse 1 fire / swing / throw / place · Mouse 2 aim (C4: detonate) · 1–8 or wheel switch · Q (hold) radial picker · R reload · G grenade · Esc pause · F3 stats.
