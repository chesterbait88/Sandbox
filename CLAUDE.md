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
- Follow the phase order in SPEC.md "Build plan". Finish and commit each phase's gate before starting the next. Phases 0–5 are the MVP; do not touch phase 6 polish until the MVP runs end to end.
- At each gate: run `pnpm test`, run the Playwright screenshot script, commit with `phase N: <summary>`, and write a 5-line status to `PROGRESS.md` (done, next, blockers, fps numbers, open decisions).
- When the spec is ambiguous, choose the simpler option, log it in `DECISIONS.md`, and continue. Do not stop to ask unless a gate has failed twice.
- Performance target: 60 fps on integrated graphics with 300 debris; no main-thread frame over 16 ms during a C4 blast. Profile before optimizing.
- Keep the module interfaces listed in SPEC.md "Project structure" stable so pieces can be tested alone.

## Commands
- `pnpm install` · `pnpm dev` (client on 5173 proxying /api to server on 8080) · `pnpm build` · `pnpm test` · `pnpm screenshots` · `pnpm gallery` (visual review set in `screenshots/gallery-updated/`, committed; `screenshots/gallery-before/` is the frozen pre-overhaul set for comparison) · `pnpm diagrams` · `pnpm start` (serve built client + API on 8080)
- Docker is deferred: containerize after the game runs locally (`Dockerfile` is provided but not part of any gate).

## Living diagrams (grow with the build, never written ahead of it)
docs/PLAYER-FLOW.md and docs/DEVELOPER-TREE.md describe the game as it actually exists at each gate. At every phase gate: add what that phase made real, revise anything the phase changed, move items out of the "Not yet playable" / "Planned, not built" lists as they become real, and append a dated changelog line to both files. Only draw what the current commit does. Keep every diagram one screen tall; split rather than cram. Validate Mermaid with `mmdc` (from @mermaid-js/mermaid-cli) before committing (`pnpm diagrams` runs it over every block in docs/). When a phase changes a decision, update the diagram and note it in DECISIONS.md.

## Style
- TypeScript strict. Small files, one responsibility each. Typed event emitter between gameplay and UI; gameplay code never touches the DOM.
- Vertex colors only; no textures, no image assets except a favicon.
