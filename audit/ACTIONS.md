# Action list — from the AAA audit of commit f557656

Derived from `AUDIT.md` §2 (gates), §3 (findings), §7 (cut / simplify) and §8 (backlog). Same order as the backlog's ICE ranking, grouped into passes. Each item names the files to touch and the check that proves it is done. Tick the box, re-run the check, move on.

Criterion IDs in brackets point at `AUDIT.md` §10 and the `04-evidence-*.md` ledgers.

---

## Pass 1 — the hard stops and the first sixty seconds (do first, ~2–3 days)

- [ ] **1. Make settings loading corruption-proof** [GG2, G2.7] — *effort S*
  - `client/src/ui/dom.ts` `settings.load()`: reject anything that is not a plain object; take each of `sensitivity`, `volume`, `fov` only if `Number.isFinite`, otherwise use the default; clamp to `PLAYER.sensitivityMin/Max`, `0–1`, `60–110`.
  - `client/src/audio/Synth.ts` `setVolume()` / `ensure()`: never write a non-finite value to `master.gain`.
  - Add a Vitest case that feeds `{}`, `[]`, `42`, `"str"`, `{"volume":5,"fov":-1}` through `settings.load()` and asserts the defaults/clamps.
  - **Done when:** the page reaches the menu (`__vwReady`) with every one of those values pre-seeded in localStorage. Gate GG2 flips to PASS.

- [ ] **2. Give ineffective hits and the empty magazine feedback** [G1.3, G1.4, G2.4] — *effort S*
  - `client/src/game/Game.ts` `hit` handler: when `destroyed.length === 0 && power > 0`, play a ricochet/thud (`Synth`), spawn a small dust/spark sprite at `h.center` (`effects.ts`), and tick the crosshair with a "blocked" state.
  - `client/src/player/Weapons.ts` / `ui/hud/Ammo.ts`: on fire with an empty magazine, play a dry click and show "EMPTY · R TO RELOAD" (or "SWITCH 1–8" when the reserve is empty) on the ammo plate.
  - **Done when:** a pistol shot into concrete at spawn produces a sound and a mark; firing on empty produces a click and a label. G1.4 feedback matrix has ≥ 2 channels for both rows.

- [ ] **3. Paint the menu immediately; stream the arena behind it** [G6.3, W1.1] — *effort S*
  - `client/src/game/Flow.ts` `boot()`: call `set('menu')` before awaiting `loadArena()`; render the sky/fog without chunks until meshing finishes.
  - Add a thin progress bar fed by `chunks.stats.meshed / total` (expose total from `ChunkRenderer`), hidden once idle.
  - Keep DEPLOY disabled with a "BUILDING ARENA…" label while `flow.loading` is pending (also fixes the silent 10 s wait, G4.5).
  - **Done when:** the menu buttons are visible within ~1 s of `load` on the dev machine and the bar reaches 100 % before PLAY is needed.

- [ ] **4. Confirm destructive actions; allow declining initials** [G4.7] — *effort S*
  - `client/src/ui/screens/Pause.ts`: QUIT TO MENU opens a two-button confirm that states the score at stake ("Abandon round? 4,120 points will be lost").
  - `client/src/ui/screens/Initials.ts`: add SKIP (and make Esc do the same) that goes to the leaderboard without posting; drop the session token.
  - **Done when:** a mid-round quit needs two inputs and a qualifying player can reach the leaderboard without submitting.

- [ ] **5. Teach by doing: first-occurrence prompts and a live objective** [G2.3, G3.3, G1.1, G1.7] — *effort M*
  - New `ui/hud/Hints.ts` driven by events, each prompt shown once per session: first terrain-only hit → "TERRAIN IS FREE · WRECK THE BUILDINGS"; first chain → "CHAIN REACTION · MULTIPLIER UP"; first prop hit → "SCENERY · SMALL CHANGE"; first time at 80 %+ on a structure → "FINISH IT FOR THE LEVELED BONUS".
  - Show the key chips (`ui/controls.ts`) on the countdown and for the first ~10 s of play.
  - Add "ARENA n %" (from `score.arenaPercent`) to the score bar so the primary job is always visible.
  - Make the structure readout say "+0 · TERRAIN" when a blast destroys only terrain.
  - **Done when:** goal questions Q2, Q3 and Q6 in `AUDIT.md` §6 can be answered Yes.

## Pass 2 — load path, settings depth, feedback (~1 week)

- [ ] **6. Shrink and cache the bundle** [W1.5, W1.4, W1.8, G11.3] — *effort M*
  - Replace `@dimforge/rapier3d-compat` with `@dimforge/rapier3d` (streamed `.wasm`, compiled off-thread); check `vite.config.ts` handles the wasm asset.
  - Server: add `hono/compress` (or ship precompressed `.br`/`.gz` and serve them); set `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` and `no-cache` on `index.html`.
  - Dynamic-import the recipe modules and loadout models so the first parse is the engine only.
  - Restore the Vite chunk-size warning to its default instead of raising it.
  - **Done when:** landing-path JS ≤ 1 MB compressed and a second visit transfers only `index.html`.

- [ ] **7. Motion, shake and audio settings** [G7.7, W2.7, G7.8, G8.3, G3.2] — *effort S*
  - `Settings.ts`: toggles for screen shake, screen flash and slow-mo; separate SFX and music sliders (two gain nodes under master in `Synth.ts`).
  - Wire `prefers-reduced-motion` in `styles.css` (pulse keyframes, orbit) and default the toggles from it.
  - A practice round length (120 / 180 / 240 s) that is excluded from the leaderboard (server ignores or flags non-180 rounds).
  - **Done when:** G7.7 and G7.8 score ≥ 2 and G3.2 ≥ 1 under the rubric.

- [ ] **8. CI that gates the build** [G11.5, W1.9, G11.7] — *effort S*
  - `.github/workflows/ci.yml`: `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm build && node scripts/dev/e2e.mjs`.
  - Add `size-limit` (or a 10-line script) that fails when `client/dist/assets/*.js` exceeds the budget from item 6.
  - Bump `package.json` version and tag releases; add a 5-line release checklist to README.
  - **Done when:** a failing test or an oversized bundle turns the PR red.

- [ ] **9. Security headers and the TLS note** [WG4, W10.4, G11.8] — *effort S*
  - `server/src/index.ts`: `hono/secure-headers` with a CSP allowing `'self'` plus `fonts.googleapis.com` / `fonts.gstatic.com` (or self-host the two fonts and drop the exception), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
  - Bump `@hono/node-server` past the moderate advisory; re-run `pnpm audit`.
  - README: one paragraph on terminating TLS in front of the container (Caddy or nginx example).
  - **Done when:** `curl -I` shows the five headers and `pnpm audit` is clean. Gate WG4 flips to PASS behind TLS.

- [ ] **10. Audio for state changes and a limiter** [G8.1, G8.2, G8.5] — *effort S*
  - `Synth.ts`: short cues for reload, empty, combo step, leveled, last 10 s tick, round end; ±5 % pitch and filter jitter on `shot` and `boom`.
  - A `DynamicsCompressorNode` on master so stacked chain booms do not clip.
  - Optional: a quiet in-round pad that rises with the multiplier (covers G8.5).
  - **Done when:** every row of the feedback matrix in `04-evidence-gameplay.md` has an audio channel.

## Pass 3 — accessibility and layout (~3–4 days)

- [ ] **11. Keyboard-operable cards and rows; focus into overlays** [WG2, W2.2, G4.9, G7.5] — *effort S*
  - `WorldPicker.ts`: theme cards become `<button>` inside a `role=radiogroup`; `Leaderboard.ts`: replay rows get a button or `tabindex=0` + Enter.
  - Settings/credits overlays: `role=dialog aria-modal`, move focus to the first control, `inert` on the screen behind, Esc closes.
  - `aria-label` on the canvas; `aria-live="polite"` on the score and callout elements.
  - **Done when:** the Tab walk in `04-evidence-ui.md` [W2.2] reaches a theme card and a replay row, and axe stays at zero. Gate WG2 flips to PASS.

- [ ] **12. Layout that survives 200 % zoom and narrow windows** [WG1, W2.9, G7.1, G6.5] — *effort M*
  - `styles.css`: `.screen { overflow: auto }` with `min-height` centring instead of fixed; let `.slots` and `.cards` wrap; convert type sizes to `rem` and add a UI-scale setting (100–200 %).
  - Raise the wheel's weapon labels and the ARMED label to ≥ 16 px; put the LEVELED stamp inside the readout plate; lift the callout band clear of the Q wheel; give the countdown a dark scrim.
  - **Done when:** DEPLOY is reachable at 360 × 640 and at 200 % zoom on 1366 × 768; no HUD element overlaps another at 720p. Gate WG1 flips to PASS.

- [ ] **13. Feedback for refused inputs** [G4.5] — *effort S*
  - Loadout point-buy: set `disabled` on +/− when `flow.adjust()` returns false and show "BUDGET FULL"; same for the sticky toggle.
  - A click sound on every menu button via the `button()` helper in `dom.ts`.
  - **Done when:** twenty refused clicks produce twenty visible/audible refusals.

## Pass 4 — engine budget and leaderboard honesty (needs real hardware first)

- [ ] **14. Hands-on session on an integrated-GPU laptop** [G6.1, W1.2, WG3, G8.2, G1.2] — *effort S, unblocks the rest*
  - Play three full rounds with the F3 overlay on; record fps and `worstFrame` through a C4 and a collapse; listen to the mix; check pointer-lock feel and the sensitivity default.
  - Run Lighthouse on the served build.
  - **Done when:** the four UNVERIFIED rows in `AUDIT.md` §9 have numbers.

- [ ] **15. Time-slice the blast work** [G.custom-2, G6.2, G11.1] — *effort L*
  - Give remesh uploads, trimesh collider builds, debris inserts and collapse cuts one shared per-frame time budget (~4 ms) with carry-over, instead of fixed counts per frame.
  - On collapse, dirty-mark only the chunks the cut touched, not the whole bounding box.
  - Consider a fixed-timestep accumulator for gameplay (today dt is clamped at 50 ms and some lerps are frame-rate dependent).
  - **Done when:** no main-thread frame > 16.7 ms in the 2 s after a C4 on the reference laptop (the SPEC's own 8 ms bar is the stretch target); collapse never exceeds 33 ms.

- [ ] **16. Server-side plausibility cap and stats checks** [G9.6] — *effort M*
  - Compute the arena's maximum (theme + seed → `arenaTotal × (1 + leveledBonus) × comboMax`) server-side or sign it into the session token; reject scores above it.
  - Validate `stats`: `arenaPercent ≤ 1`, `score ≤ k × voxelsDestroyed`, `structuresLeveled ≤` the arena's structure count.
  - Rate-limit `POST /api/score` per IP like sessions.
  - **Done when:** the "299,999 by curl" probe in `04-evidence-gameplay.md` [G9.6] is refused.

- [ ] **17. Minimal telemetry** [G11.6, G9.3, W8-class metrics] — *effort S*
  - `POST /api/event` (beacon) for: session start, deploy, round end (with score, `worstFrame`, theme, mode), play again, share-link open, settings change, page error. Store counts only, no identifiers beyond the existing IP hash.
  - A tiny `/api/stats` summary or a nightly SQL query for rounds per visitor and play-again rate.
  - **Done when:** the three weekly metrics in `AUDIT.md` §11 can be read from the database.

- [ ] **18. Global error handling and offline honesty** [G6.9, G6.8] — *effort S*
  - `window.onerror` / `unhandledrejection` → a small "something broke, reload" card plus the error beacon from item 17.
  - Guard `WebGLRenderer` construction with a "WebGL unavailable" message.
  - `Results.ts`: show "OFFLINE · score not saved" when `flow.session` is null instead of "You'd need 0 more".

## Pass 5 — share previews and scope trims (when there is slack)

- [ ] **19. Per-arena share preview** [W9.3, W.custom-1] — *effort S*
  - Replace the SVG `og:image` with a PNG (Facebook, X and Discord ignore SVG); add `og:url` and `twitter:card`.
  - Stretch: a server route that renders a PNG card naming theme and seed for `?arena=` links.

- [ ] **20. Scope trims from §7** — *effort S each*
  - Remove the Credits screen; put the three lines in a menu footer.
  - Remove the sticky-grenade upgrade from point-buy (or make it a milestone reward for everyone).
  - Merge pickaxe and bat into one melee tool.
  - Make the seed field commit on `input` and show the top score for that seed.
  - Decide point-buy's fate from telemetry (item 17) after 90 days: < 10 % of rounds → cut.

- [ ] **21. Pull leaked tunables back into `config/`** [G11.2] — *effort S*
  - The ~20 coefficients listed in `04-evidence-perf.md` [G11.2] (`Game.ts` 0.4 / 1.3 / 14 / 200, `effects.ts` 0.45 / 1.5 / 12, `Debris.ts`, `Controller.ts`) into `config/effects.ts` / `config/player.ts`; drop the 7 dead exports knip found.

- [ ] **22. Document the undocumented inputs** [GG7, G5.x] — *effort S*
  - Add Mouse 2 = detonate (C4) and "hold Q" to the loadout CONTROLS row; add a controls card reachable from Pause so the reference is available mid-round without quitting.
  - Later: remapping and hold/toggle options for sprint, aim and the wheel (G5.1, G5.4).

---

## Re-audit

When Pass 1 and Pass 2 are done, or after item 14, re-run the audit from `AUDIT.md` §11: `pnpm test`, the e2e round, the blast probe, axe on every screen, the settings fuzz test, and re-score G1, G2, G6, G7, W1 and W2. Expected movement if Passes 1–3 land: gates GG2, WG1, WG2, WG4 pass; G2, G7, W2 clear 2.0; overall into the 55–65 range (Professional needs 60 and no failed gate).
