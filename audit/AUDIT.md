# AAA Audit — Voxel Wreck

**Date:** 2026-11-05 · **Auditor:** Claude (aaa-audit skill, one orchestrator + three evidence agents + reviewer pass) · **Commit:** f557656 · **Build run:** yes (headless Chromium on SwiftShader; no GPU, no human play)
**Class:** hybrid game 80 / web 20 · **Rubrics:** `rubrics/games.md`, `rubrics/web.md` (W1, W2, W9, W10 only; W3–W8 dropped as duplicates) · **Confidence:** Medium

---

## 1. Verdict

**Tier: Prototype — overall 41/100**
Capped from *Indie / functional* (41.2) by seven categories averaging below 2.0 (G2, G3, G5, G7, W1, W2, W9). Independently, four failed gates (GG2, WG1, WG2, WG4) cap the tier at Professional.

Voxel Wreck is a three-minute first-person demolition game with a hand-written voxel engine, eight weapons through one carve function, chain reactions, Rapier debris, structural collapse and a signed leaderboard, all built in one day of commits and running end to end from a clean checkout with 33 passing tests. The engine, the arenas, the collapse and the seed-sharing loop are genuinely good; the round ends on purpose and the results loop is level with its comparators. What separates it from first-class is that **nothing in the product teaches or confirms anything**: a stranger is handed two screens of reading, then a world where a pistol shot into concrete produces no sound, no mark and no message, where the biggest blast of the round silently scores zero because it hit terrain, and where the combo meter, the leveled bonus and the milestone rewards are rules the player has to reverse-engineer. Under that sit three engineering gaps that first-class browser games do not ship with: a 5 MB uncompressed single-chunk bundle with no cache headers, a menu that waits for the whole arena to generate before painting anything, and main-thread frames of 24–74 ms on every C4 (433 ms on a collapse) against a stated 16 ms budget. The single biggest thing standing between this and first-class is the first sixty seconds.

**Comparators used:** Teardown (material response, HUD restraint), Krunker.io (browser FPS onboarding, time to match, load path), Instruments of Destruction (score-attack demolition loop, live objective readout).

## 2. Gate results

| Gate | Result | Evidence |
|---|---|---|
| GG1 Stability | PASS (M) | [GG1] perf — ≈ 15 min scripted abuse across nine sessions, zero errors; shorter than the 60-min soak. |
| GG2 Save integrity | **FAIL** | [GG2a] gameplay — corrupt or partial `vw.settings` in localStorage kills boot; [GG2b] server side passes. |
| GG3 Pause and suspend | PASS | [GG3] perf — clock stops (0 ms over 3 s); not pausable during the 3 s countdown. |
| GG4 Input disconnect | PASS | [GG4] perf — pointer-lock loss pauses with a PAUSED panel; no gamepad to test. |
| GG5 Photosensitivity | PASS | [GG5] perf — full-screen flash ≤ 2/s at 22 % opacity by design; no reduce-flash option. |
| GG6 Legibility | PASS (narrow) | [G4.2] ui — critical numbers 30–56 px at ≥ 5.3:1; wheel names and ARMED at 12 px. |
| GG7 Controls | PASS (narrow) | [G5.7] ui — every action documented on the loadout screen; Mouse 2 detonate, F3 and hold-Q undocumented in-game; no remap. |
| GG8 Monetisation | N/A | No monetisation. |
| GG9 No first-run wall | PASS | [GG9] gameplay — no account, launcher or consent wall. |
| WG1 Critical path at 360 px | **FAIL** | [W2.9] ui — DEPLOY/BACK below the viewport with `overflow:hidden`; the same defect fails 200 % desktop zoom (W2.9). Product is desktop-only by declaration, so a reader may treat this as N/A; the zoom defect is not arguable. |
| WG2 WCAG 2.2 A on the critical path | **FAIL** | [W2.2] ui — theme cards (picker, on the critical path) and replay rows are mouse-only `div`/`li` (SC 2.1.1); canvas unnamed (1.1.1). axe itself reports zero errors. |
| WG3 CWV not Poor | UNVERIFIED | [WG3] perf — lab only; CLS 0, LCP/INP need field data. |
| WG4 HTTPS / HSTS | **FAIL (as shipped)** | [WG4] perf — plain HTTP, no HSTS, no documented TLS front. Passes once a deployer terminates TLS and adds HSTS. |
| WG5 Deceptive design | N/A | No money or consent surface. |
| WG6 Forms recover | PASS | [W2.6] ui — seed and initials forms submit; seed silently sanitised. |
| WG7 Third parties blocked | PASS | [WG7] perf — Google Fonts blocked → menu works in fallback fonts. |

**GG2 — Save integrity (FAIL).** The only client-side persisted state is `vw.settings` in localStorage. `settings.load()` (`client/src/ui/dom.ts:49-57`) catches a JSON parse error but returns any value that parses. `SettingsScreen` (`client/src/ui/screens/Settings.ts:11-14`) then applies it unvalidated, `Synth.ensure()` (`client/src/audio/Synth.ts:32-33`) assigns the undefined volume to an AudioParam, which throws "non-finite" inside `Game.warmup()` during `Flow.boot()`, which has no catch. Result: with `{}`, `[]`, `42` or `"str"` stored, the page never reaches the menu (four of eight corrupt shapes tested). Out-of-range values (`sensitivity: "abc"`, `volume: 5`, `fov: -1`) are applied as-is. The realistic trigger is any older or partial settings object after a schema change. Fix: validate shape and `Number.isFinite` per field, clamp to the slider ranges, fall back per field, and never write a non-finite gain. Effort: small.

**WG1 — Critical path at 360 px (FAIL).** At 360 × 640 the loadout clips 57 elements and DEPLOY sits at y 706–783 under `overflow:hidden`, so the flow cannot complete. The product refuses coarse pointers with a notice, so a phone never sees this; a narrow desktop window or 200 % zoom does (W2.9 = 0). Fix: `overflow:auto` on `.screen`, wrap `.slots` and `.cards`, rem-based type. Effort: medium.

**WG2 — WCAG 2.2 Level A (FAIL).** Theme selection is a `div.card` with a click handler and no `tabindex`, `role` or key handling; leaderboard replay rows are `li` elements likewise. Keyboard users can play (the default theme is preselected) but cannot choose an arena. The canvas has no accessible name. Fix: cards become `<button>` in a radiogroup, rows get a button, canvas gets `aria-label`; move focus into overlays and mark them `role=dialog`. Effort: small.

**WG4 — HTTPS / HSTS (FAIL as shipped).** The Hono server sends no `Strict-Transport-Security` and no security headers of any kind; README and compose document no TLS termination. Fix: `hono/secure-headers` with a CSP, and a one-paragraph reverse-proxy note. Effort: small.

## 3. Top findings (ranked by impact)

| # | Criterion | Observed (evidence) | First-class bar | Fix | Impact | Effort |
|---|---|---|---|---|---|---|
| 1 | GG2 / G2.7 | Corrupt or partial `vw.settings` throws inside warm-up; boot never completes; bad values applied unclamped ([GG2a] gameplay) | Corrupted save detected and handled, not a crash | Validate + clamp per field in `settings.load()`; guard `setVolume` | H | S |
| 2 | G1.3 / G1.4 / G2.4 | Pistol, bat, pickaxe on brick/concrete/steel emit `hit` with `destroyed: []` and nothing plays, spawns or ticks; empty magazine is a red plate only; default spawn faces steel and brick with the pistol ([G1.3] [G2.4b] gameplay) | Every action ≥ 2 feedback channels; first failure legible | Ricochet/thud + dust sprite + crosshair "blocked" tick on ineffective hits; dry-click and "EMPTY · R" on the ammo plate | H | S |
| 3 | G2.3 / G3.3 / G1.1 | Zero in-round teaching: no hint element in source or bundle; terrain-is-free, combo heat, 100 % leveled threshold and prop exception are silent; a C4 + 3 chains destroyed 23,214 voxels of which 76 % were worth 0 and the HUD said nothing ([G2.3] [G1.7] [G1.3b] gameplay) | Teach by doing; goal statable at any moment (Instruments of Destruction shows live % wrecked) | One-shot contextual prompts on first occurrence; key chips on the countdown; live "ARENA n %" on the score bar | H | M |
| 4 | G.custom-2 / G6.2 | Every C4 produced a main-thread frame of 24–74 ms; a base-cut collapse produced 11 frames > 100 ms, max 433 ms, from dirty-box remesh uploads, trimesh rebuilds and the cut ([G6.2] [G6.2b] perf; PROGRESS.md agrees at ≈ 50 ms) | No frame > 16.7 ms for 2 s after a blast; p99 ≤ 25 ms; SPEC's own bar is 8 ms | Time-slice remesh uploads, collider builds and debris inserts into a shared per-frame budget; dirty-mark per touched chunk on collapse | H | L |
| 5 | W1.5 / W1.4 / G11.3 | 5,066 KB uncompressed JS in one chunk, 82 % of it Rapier's wasm as base64; no `content-encoding`, no `Cache-Control`/`ETag`, so repeat visits re-download it ([W1.5] [W1.4] [G11.3] perf) | ≤ 170 KB compressed JS on the landing path; brotli; immutable fingerprinted assets | Switch to `@dimforge/rapier3d` streamed wasm; `hono/compress` or precompressed assets; long max-age on `/assets/*` | H | M |
| 6 | G6.3 / W1.1 | Menu appears only after full arena generation, 720-chunk mesh and shader warm-up with nothing painted and no progress bar (35–54 s on software GL; ≈ 2–3 s on a laptop by PROGRESS.md's per-chunk numbers) ([G6.3] perf) | ≤ 5 s to interactive or a masked/progress load | Paint the menu over a static sky at once; stream the backdrop in; progress from `chunks.stats.meshed` | H | S |
| 7 | G4.7 | QUIT TO MENU ends a round in one click with no confirm; a qualifying player cannot decline initials (no SKIP, Esc does nothing) ([G4.7] ui) | Destructive actions confirm with the consequence; accidental inputs recoverable | Two-button confirm stating the score lost; SKIP on initials | H | S |
| 8 | W2.9 / G7.1 | At 200 % zoom (and 360 px) the primary button of loadout, picker, results and leaderboard is outside the viewport with no scroll; all CSS is px ([W2.9] ui) | WCAG 1.4.4 / 1.4.10; XAG text scaling ≥ 200 % | `overflow:auto`, wrapping rows, rem type, a UI-scale setting | H | M |
| 9 | W2.2 / G4.9 | Theme cards and replay rows are mouse-only; opening SETTINGS leaves obscured buttons in the Tab order ([W2.2] ui) | SC 2.1.1, 2.4.3, 2.4.11 | Buttons in a radiogroup; `role=dialog` + `inert` behind overlays | M | S |
| 10 | G7.7 / W2.7 / G7.8 / G3.2 | No shake, flash or reduced-motion toggle; `prefers-reduced-motion` ignored; one master volume; 180 s limit cannot be extended; no difficulty or assist option ([G7.7] [G7.8] ui, [G3.2] gameplay) | Game Accessibility Guidelines Basic; XAG time-limit guidance; ≥ 3 options or assist toggles | Motion & shake toggle; SFX/music sliders on the existing gain graph; practice length off the board | M | S |

Also material but below the top ten: G9.6 a bare `curl` with a valid session and 150 s of patience takes rank 1 under the ×5 cap ([G9.6]); W10.4 zero security headers and one moderate advisory in `@hono/node-server`; G11.5 no CI, the DOM smoke round is outside `pnpm test`; G8.1 reload, empty, combo step, leveled and round end are silent; W9.3 the SVG `og:image` will not render on Facebook/X/Discord.

## 4. Scorecard

| Category | Weight | Score /100 | Weighted | Confidence | Note |
|---|---|---|---|---|---|
| G1 Core loop and game feel | 16.0 | 52 | 8.4 | M | Deterministic, responsive loop with real systemic depth; undermined by silent ineffective hits and unstated rules. |
| G2 Onboarding and first session | 10.4 | 37 | 3.9 | H | No teaching at all: two mandatory screens, 11 key chips, first failures unexplained. |
| G3 Progression, difficulty, flow | 5.6 | 37 | 2.1 | H | A flat 180 s with a fixed 1,000-point drip; no difficulty or assist options (G3.2 = 0). |
| G4 UX heuristics, UI, HUD | 9.6 | 42 | 4.1 | H | Legible plates; but no confirm on quit, unskippable initials, inconsistent back buttons, silent refusals. |
| G5 Controls and input | 6.4 | 32 | 2.0 | H | Keyboard+mouse complete and polled per frame; no remapping (0), hold-only inputs. |
| G6 Performance and stability | 12.0 | 47 | 5.6 | M | Stable and leak-free in a 15-min soak; blast and collapse frames far over budget; iGPU fps unverifiable here. |
| G7 Accessibility | 6.4 | 26 | 1.6 | H | Below Game Accessibility Guidelines Basic: no text scale, no motion toggle, one volume, no ARIA. |
| G8 Audio, feedback, juice | 6.4 | 45 | 2.9 | M | Strong visual juice; audio covers explosions and shots but not state changes; music menus-only. |
| G9 Content depth and retention | 2.4 | 50 | 1.2 | H | Seeded arenas and a fair-enough leaderboard; zero telemetry (G9.3 = 0); curl can still take rank 1. |
| G11 Engine code and pipeline | 4.8 | 42 | 2.0 | H | Strict TS, config-driven, HMR; no CI, variable timestep, magic numbers leaked, 5 MB bundle unbudgeted. |
| W1 Web performance and loading | 7.0 | 31 | 2.2 | M | 5 MB uncompressed single chunk, no cache headers, no CI budget; CLS is perfect. |
| W2 Web accessibility (WCAG 2.2 AA) | 6.0 | 38 | 2.3 | H | Zero axe errors but mouse-only cards/rows, 200 % zoom hides the primary button, reduced-motion ignored. |
| W9 SEO and sharing | 3.0 | 30 | 0.9 | H | OG tags exist but the SVG og:image will not render on social crawlers; no structured data. |
| W10 Front-end engineering | 4.0 | 51 | 2.1 | H | Clean build and semantic HTML; zero security headers, no browser-support policy. |
| **Overall** | 100 | | **41.2** | Medium | |

Criteria scored: 99 · N/A: 9 · UNVERIFIED: 2 (listed in §9). Custom criteria are folded into their parent category: G.custom-1 → G1, G.custom-2 → G6, G.custom-3 → G9, W.custom-1 → W9. G10 (monetisation) has no scored criterion and is excluded from the denominator. Only two criteria reached 4 (G.custom-3 seed determinism, W1.3 CLS); none reached 5.

## 5. Intent Sheet (summary)

- **Promise:** "I can drop into a wreckable voxel arena and blow up as much as I can in three minutes, without installing anything or reading instructions, and put my initials on a board."
- **Target user:** a desktop player who already knows WASD + mouse look; casual, short-session, leaderboard-motivated; friends sharing seed links (inferred).
- **Primary job:** score as many points as possible in one 180 s round by destroying structures and chaining volatiles.
- **Pillars:** P1 arcade immediacy · P2 everything is wreckable and reads at a glance · P3 chain reactions are the skill · P4 same seed, same arena · P5 juice is a requirement.
- **Primary metric:** rounds played per visitor (play-again rate), share-link opens as growth proxy — currently measured: **no** (no telemetry; only accepted scores are stored).
- **First five minutes should deliver:** understood that structures score and terrain does not; fired every weapon class; triggered a chain and seen the multiplier move; finished a round; seen rank or "need N more"; clicked PLAY AGAIN.
- **Non-goals:** multiplayer, mobile/touch, accounts, save files, enemies, textures, off-the-shelf voxel engines, React.
- **Constraints:** desktop WebGL2 + pointer lock; 60 fps on integrated graphics with 300 debris, no main-thread frame over 16 ms during a C4; one container with SQLite.

Full sheet: `audit/01-intent.md`.

## 6. Goal questions — answered

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Within 60 s on a cold cache, can a stranger be wrecking something? | Partly | Three clicks + 3 s countdown and no wall, but after an unpainted arena build (17–54 s on software GL, ≈ 2–3 s on a laptop) and two screens to read. [G2.1] [G2.2] [G6.3] |
| 2 | Does the player ever learn the controls without reading? | No | The loadout CONTROLS chips are the only teaching; no in-round prompt exists in source or bundle. [G2.3] [G2.5] |
| 3 | Is "structures score, terrain is free" communicated in the first 30 s? | No | A terrain hit gives debris and a hit marker but no score, readout or message. [G1.1] [G1.3b] [G1.7] |
| 4 | Can a volatile be told from a non-volatile at a glance, colour-blind included? | Yes | Every volatile carries stripes/band; the fuel base colour alone equals brick under deuteranopia (ΔE 1.9) but the stripe contrast survives. Range under theme lighting unverified without a GPU. [G.custom-1] |
| 5 | Does the player understand they caused a chain and that it raised the multiplier? | Partly | Bigger flash, shake and boom 150 ms later and a magenta "CHAIN n" pop; nothing says "chain" and the multiplier step is silent. [G1.4] |
| 6 | Is there a mechanic the scoring depends on that a player could fail to discover? | Yes | Combo heat rate, 100 % leveled threshold, prop exception, quiet milestones, scoring freeze, terrain = 0. [G1.7] [G2.3] |
| 7 | Does the round end with a win, a goal and a reason to return? | Yes | Rank or "need N more" → initials → highlighted row → PLAY AGAIN; no personal best for the unranked. [G2.6] [G9.7] |
| 8 | Does play-again cost ≤ 3 inputs and remember the theme? | Yes | 3 inputs; theme and mode kept in-session only; the seed re-rolls. [G2.7] |
| 9 | Does the main thread hold 16.7 ms through a C4 and a collapse? | No | 24–74 ms per C4; collapse max 433 ms, 11 frames > 100 ms (SwiftShader; PROGRESS.md reports ≈ 50 ms). [G6.2] [G6.2b] |
| 10 | Does memory stay flat over a soak? | Yes | 98 → 95 → 91 MB across 3 rounds / 42 blasts; GPU resources return to baseline (3.5-min soak). [G6.4] |
| 11 | What happens on pause spam, resize, blur, pointer-lock loss, rejected lock? | Partly | All leave state consistent and playable; rapid pause/resume can end paused; blur does not auto-pause; rejected lock could not be simulated. [G6.7] |
| 12 | Can the game be paused from every playable state with timers stopped? | Partly | Yes in play, end freeze and with the radial open (0 ms drift over 3 s); no during the wall-clock countdown. [GG3] |
| 13 | Is persisted state atomic and corruption-tolerant? | No | Server: WAL, SIGKILL-safe, replay refused after restart. Client: corrupt settings kill boot. [GG2a] [GG2b] |
| 14 | Do flashes stay under 3/s over > 25 % of the screen? | Yes | Full-screen flash ≤ 2/s at 22 % by the drip design; blast sprites exceed 3/s only at close range in tank clusters. [GG5] |
| 15 | Is every critical HUD string above the legibility floor at 4.5:1? | Partly | Critical numbers 30–56 px at ≥ 5.3:1; wheel names/ARMED/combo labels 12–13 px; countdown and LEVELED stamp drawn over the world at 1.0–1.25:1 worst pixel. [G4.2] |
| 16 | Is every action reachable and documented, and remappable? | Partly | All reachable; Mouse 2 detonate, F3, hold-Q undocumented in-game; nothing remappable. [G5.7] [G5.1] |
| 17 | Can the menus be driven by keyboard with visible focus and zero axe errors? | Partly | Main path works with a UA ring and zero axe errors; theme cards and rows are mouse-only; overlays leave hidden buttons in Tab order. [W2.2] |
| 18 | Does it render at 360 × 640 and 1366 × 768 without cut-off? | Partly | 1366 × 768 clean; 360 × 640 hides DEPLOY with no scroll and HUD plates overlap. [W2.9] [G6.5] |
| 19 | Are difficulty / assist options present? | No | Three sliders only. [G3.2] [G7.7] |
| 20 | Are tunables really all in `config/`? | Partly | Centralised and documented, but ~20 clear coefficients leaked into Game, effects, Debris, Controller. [G11.2] |
| 21 | Does the leaderboard refuse the trivial exploits the spec promises to stop? | Yes | Forged, early, tampered, replayed → 403; over-cap, bad initials → 400; rate limit → 429, all live. But see G9.6. [W.custom-1b] |
| 22 | What ships, and does the server set security headers? | — | One 4,991,539-byte JS chunk (82 % Rapier base64) + three workers + 21 kB CSS; no source maps; no compression, cache or security headers. [G11.3] [W1.4] [W10.4] |
| 23 | Is anything serving a non-goal or duplicating another feature? | Yes | Point-buy and sticky grenades serve a declared non-goal; pickaxe and bat duplicate each other; credits is a dead screen. §7 |
| 24 | Versus Krunker.io and Teardown, where is the first minute clearly worse? | — | Boot + two screens vs ~10 s to a match; silent ineffective hits vs universal material response; no live objective vs Instruments of Destruction's readout. Results/initials/board and seed sharing are level. [Q24] |

## 7. Cut / Keep / Enhance

### Cut
| Feature | Pillar | Usage | Cost | Reason |
|---|---|---|---|---|
| Credits screen | none | ~0 | 15 lines + a fourth menu button | Hick's law on the one screen every player sees; three lines belong in a footer. |
| Sticky grenades (point-buy only) | none | very low | mode-gated branch in `Weapons.ts` + a price | Serves a non-goal twice; if fun, make it a milestone reward for everyone. |

### Merge / Simplify
| Feature | Into / How | Reason |
|---|---|---|
| Pickaxe + Bat | One melee tool with the pickaxe's precision and the bat's width | Two free infinite slots doing one job; Teardown ships one sledgehammer. |
| Loadout screen | One-glance briefing (arena, points standing, DEPLOY) with the weapon strip non-blocking; controls move to the countdown and first 10 s | The only mandatory pre-play screen not justified by P1; Krunker.io is one click to a match. |
| Seed field | Commit on `input`, show the top score for *this* seed | Today it commits on blur only and the arena rebuilds silently. |
| Point-buy | Keep behind its tab; instrument; cut in 90 days if < 10 % of rounds | Doubles the board, token mode and budget math for a declared non-goal. |

### Enhance (where polish budget goes)
| Feature | Current score | Target | What "first-class" looks like here |
|---|---|---|---|
| Carve feedback on ineffective hits and empty magazine | G1.3 2 · G1.4 2 · G2.4 1 | 4 | Teardown: every tool on every material answers with sound, mark and particles; a dry click is a dry click. |
| In-round teaching and live objective | G2.3 1 · G3.3 2 · G1.7 2 | 4 | First-occurrence prompts, "ARENA 23 %" on the score bar, a "SCENERY" tag when a prop is hit. |
| Blast and collapse frame budget | G.custom-2 2 · G6.2 2 | 3 | Flat frame-time graph through a C4; collapse never hitches over 33 ms. |
| Load path | G6.3 2 · W1.5 1 · W1.8 1 | 3 | Menu painted in < 1 s, arena streams in behind it, < 1 MB compressed, cached. |
| HUD overlap and small labels | G4.2 3 · G4.3 2 | 4 | Stamp inside the readout plate, callout above the wheel, 16 px wheel labels, countdown on a scrim. |
| Audio coverage and mix | G8.1 2 · G8.2 2 · G8.5 2 | 3 | Cues for reload, empty, combo step, leveled, last 10 s; ±5 % pitch jitter; a compressor on master; a quiet in-round layer that rises with the multiplier. |
| Settings | G5.1 0 · G7.1 0 · G7.7 1 · G7.8 1 · G3.2 0 | 3 | Remap, UI scale, shake/flash toggle, SFX/music, practice length. |
| Quit and initials | G4.7 1 | 3 | Confirm with the score at stake; SKIP on initials. |
| Share preview | W9.3 1 · W.custom-1 3 | 4 | A PNG `og:image` per arena naming theme and seed. |

### Keep (protect)
| Feature | Score | Why it matters |
|---|---|---|
| Seeded, deterministic arenas with share links and replayable rows | G.custom-3 4 · G9.5 3 · W.custom-1 3 | The only growth loop the product has, and it already works. |
| Structural collapse and debris that settles in craters | G9.4 3 · G8.3 3 | The most Teardown-like moment; emergent "cut the legs" strategy. |
| Results → initials → leaderboard loop | G9.7 3 · G2.6 3 | Level with the comparators. |
| Server validation (token, window, cap, replay, rate limit) | G6.8 3 · Q21 | Casual anti-cheat as promised; do not regress it when adding the arena cap. |
| Volatile hazard patterns | G.custom-1 3 | Colour-blind safe by construction. |
| Zero layout shift, clean strict TS, config-driven tuning | W1.3 4 · G11.8 3 · G11.4 3 | Cheap to keep, expensive to recover. |

### Watch (instrument before deciding)
| Feature | What to measure | Decision rule |
|---|---|---|
| Point-buy mode | share of deployed rounds in `custom` | < 10 % after 90 days → cut |
| Leveled rewards (magazine + power boost) | share of rounds leveling ≥ 1 structure; score delta with the boost | < 30 % → make the first structure easier to level |
| Debris cap (300) and collapse bodies (10) | p99 main-thread frame on an iGPU laptop | reduce until p99 ≤ 25 ms |
| Menu music | share of players at volume 0 | high → separate sliders before adding in-round music |

Full inventory: `audit/06-features.md`.

## 8. Prioritized backlog

Scoring: ICE (Impact 1–10 on rounds-per-visitor · Confidence 1–10 · Ease 1–10; score = product).

| Rank | Item | Criterion | Impact | Confidence | Ease | Score |
|---|---|---|---|---|---|---|
| 1 | Validate and clamp `vw.settings` on load; guard `setVolume` against non-finite | GG2 | 7 | 10 | 10 | 700 |
| 2 | Confirm on QUIT TO MENU with the score at stake; SKIP on initials | G4.7 | 6 | 10 | 10 | 600 |
| 3 | Ricochet/dust/crosshair tick on ineffective hits; dry-click + "EMPTY · R" on empty | G1.3 G1.4 G2.4 | 8 | 8 | 9 | 576 |
| 4 | Paint the menu immediately over a static sky; progress bar from `chunks.stats`; stream the backdrop | G6.3 W1.1 | 8 | 8 | 8 | 512 |
| 5 | Streamed Rapier wasm, brotli/gzip, immutable cache headers on `/assets/*` | W1.5 W1.4 W1.8 G11.3 | 8 | 9 | 6 | 432 |
| 6 | Shake/flash/reduced-motion toggle; SFX and music sliders | G7.7 W2.7 G7.8 G8.3 | 6 | 9 | 8 | 432 |
| 7 | GitHub Actions: typecheck + test + build + `e2e.mjs` + `size-limit`; tag releases | G11.5 W1.9 G11.7 | 6 | 9 | 8 | 432 |
| 8 | `hono/secure-headers` with CSP, bump `@hono/node-server`, document TLS front | WG4 W10.4 | 5 | 9 | 9 | 405 |
| 9 | Synth cues for reload, empty, combo step, leveled, last 10 s; pitch jitter; compressor on master | G8.1 G8.2 | 6 | 8 | 8 | 384 |
| 10 | First-occurrence prompts (terrain, chain, prop), key chips on the countdown, live "ARENA n %" | G2.3 G3.3 G1.1 | 9 | 7 | 6 | 378 |
| 11 | Theme cards and replay rows as buttons; focus into overlays with `role=dialog` + `inert` | WG2 W2.2 G4.9 | 5 | 9 | 8 | 360 |
| 12 | `overflow:auto` screens, wrapping rows, rem type, UI-scale setting | WG1 W2.9 G7.1 | 6 | 9 | 5 | 270 |
| 13 | Server-side plausibility cap from theme + seed; `stats` consistency checks | G9.6 | 5 | 7 | 5 | 175 |
| 14 | PNG `og:image` per arena, `og:url`, `twitter:card` | W9.3 W.custom-1 | 3 | 8 | 7 | 168 |
| 15 | Time-slice remesh uploads, collider builds and debris inserts; per-chunk dirty marks on collapse | G.custom-2 G6.2 | 9 | 6 | 3 | 162 |

**Do these five first:** 1, 3, 4, 2, 10. The gate fix first because it is an hour of work and a hard stop. Then the two things a stranger meets in their first sixty seconds (an unpainted boot, then a gun that does nothing to a wall) and the one destructive action that loses a round. Teaching (item 10) is fifth despite its medium effort because it is the largest single lever on the primary metric; items 5 and 15 are the biggest engineering levers but need a Rapier swap and a profiler session on real hardware before they can be sized honestly.

## 9. Unverified and not-applicable

| Criterion | Status | Why | What would verify it |
|---|---|---|---|
| G5.5 | N/A | Desktop-only by design; coarse pointers get a notice. | — |
| G6.1 | UNVERIFIED | No GPU: the 60 fps-on-iGPU target cannot be observed; main-thread idle p50 4.9 ms fits the budget, p95 60.7 ms does not. Verify with a Chrome profiler run on an iGPU laptop. | A Chrome profiler / F3 overlay run on a 2019-class iGPU laptop for a full round. |
| G7.2 | N/A | No speech in the product; non-speech cue redundancy scored under G7.4. | — |
| G8.4 | N/A | Keyboard/mouse only by design; no gamepad path to haptics. | — |
| W1.2 | UNVERIFIED | No RUM, no headless INP. Verify with a Lighthouse/RUM run on real hardware. | Lighthouse or RUM on real hardware. |
| W1.6 | N/A | No raster images; two SVG icons only. | — |
| W10.2 | N/A | WebGL game cannot work without JS; the missing WebGL-failure message is scored under G6.9. | — |
| W2.10 | N/A | No image, video or audio media elements. | — |
| W2.11 | N/A | No authentication. | — |
| W9.4 | N/A | Canvas game; nothing to index beyond title/description. | — |
| W9.5 | N/A | Not a local business. | — |
| GG8 | N/A | No monetisation of any kind. | — |
| WG3 | UNVERIFIED | Lab only: CLS 0, no LCP/INP field data. | PageSpeed Insights field section once deployed, or Lighthouse on real hardware. |
| G10.1–G10.4 | N/A | No purchases, ads or currencies; the category is excluded from the headline. | — |

## 10. Per-category detail

### G1 — Core loop and game feel — 52/100

Deterministic, responsive loop with real systemic depth; undermined by silent ineffective hits and unstated rules.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G.custom-1 | 3 | M | [G.custom-1] (04-evidence-gameplay.md) | Every volatile has a distinct hue and a row-pattern (stripes/band) that survives deuteranopia (fuel base = brick at ΔE 1.9, stripe contrast ΔE 21); no emissive or silhouette cue, lighting at 20–30 m not verifiable without a GPU. |
| G1.1 | 3 | M | [G1.1] [G1.3b] (04-evidence-gameplay.md) | The verb (shoot, things fly, number ticks) is on screen in the first frame; what *scores* (structures, not the crater you just dug) is never said, only implied by absent feedback. |
| G1.2 | 3 | M | [G1.2] (04-evidence-gameplay.md) | Input polled once per frame, hitscan hits resolve and render in the same frame, melee's 100 ms is deliberate; real input-to-photon and pointer-lock feel cannot be measured headlessly. |
| G1.3 | 2 | H | [G1.3] [G2.4b] [G1.3b] (04-evidence-gameplay.md) | Outcomes are deterministic, but pistol/bat/pickaxe do nothing to brick/concrete/steel and the game gives zero feedback, so a player cannot attribute the "miss" to a rule. |
| G1.4 | 2 | H | [G1.4] (04-evidence-gameplay.md) | Explosions have 4+1 channels; combo level-up, leveled, score change, time-out and ammo-out have one visual channel and no audio; ineffective hits have none. |
| G1.5 | 3 | M | [G1.5] (04-evidence-gameplay.md) | Seconds-scale decisions, the draining heat meter forces re-engagement, dead time is travel and reloads by design; tuned only from headless runs. |
| G1.6 | 3 | M | [G1.6] [G9.4] (04-evidence-gameplay.md) | Chain routing, combo upkeep, collapse exploitation and point-buy give an expert a visibly different round; no playtest evidence. |
| G1.7 | 2 | H | [G1.7] (04-evidence-gameplay.md) | Terrain = 0, props never grant rewards, 100 % leveled threshold, scoring freeze and quiet milestones are all silent exceptions. |

### G2 — Onboarding and first session — 37/100

No teaching at all: two mandatory screens, 11 key chips, first failures unexplained.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G2.1 | 2 | M | [G2.1] [G2.2] (04-evidence-gameplay.md) | 3 clicks + 3 s countdown after a boot that cannot be timed on target hardware here (17 s on software GL); two screens to read makes the ≤15 s browser-arcade bar improbable for a stranger. |
| G2.2 | 2 | H | [G2.2] (04-evidence-gameplay.md) | Two mandatory screens beyond the title (picker, loadout), both defaulted but neither skippable. |
| G2.3 | 1 | H | [G2.3] [G1.7] (04-evidence-gameplay.md) | The only teaching is 11 key chips and one-line weapon roles on the loadout screen; no mechanic is introduced in play, no in-round hint exists in the bundle. |
| G2.4 | 1 | H | [G2.4] [G2.4b] [G2.4c] (04-evidence-gameplay.md) | The two first "failures" (hard material, empty magazine) produce no explanation: no sound, no text, no cue beyond a red plate. |
| G2.5 | 2 | H | [G2.5] (04-evidence-gameplay.md) | Nothing to skip, but the controls reference is unreachable from a round without quitting it (4 inputs, round lost). |
| G2.6 | 3 | M | [G2.6] [G9.7] (04-evidence-gameplay.md) | A rank, a "need N more" goal and a replay/share reason exist by the end of round one; no personal best for the unranked player. |
| G2.7 | 2 | H | [G2.7] (04-evidence-gameplay.md) | 3 inputs to the next countdown and theme/mode are remembered within the session, but nothing survives a page load except three sliders. |

### G3 — Progression, difficulty, flow — 37/100

A flat 180 s with a fixed 1,000-point drip; no difficulty or assist options (G3.2 = 0).

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G3.1 | 2 | M | [G3.1] (04-evidence-gameplay.md) | Early hook (first milestone in a few shots) and a red-clock crescendo, but no waves, valleys or mid-round change; the arena at 2:50 is the arena at 0:10. |
| G3.2 | 0 | H | [G3.2] (04-evidence-gameplay.md) | No difficulty settings or assist toggles of any kind; Settings is three sliders. |
| G3.3 | 2 | H | [G3.3] [G1.1] (04-evidence-gameplay.md) | Score, next milestone and clock are always visible, but the primary job (structures, not terrain) and arena % are not surfaced until the results card. |
| G3.4 | 2 | H | [G3.4] (04-evidence-gameplay.md) | Varied in kind within "power" (ammo, time, boost, multiplier) but a fixed 1,000-pt drip, not timed to an interest curve. |
| G3.5 | 2 | M | [G3.5] [G9.1] (04-evidence-gameplay.md) | Nothing new arrives within a round; across rounds three themes and 14 recipes with repeats inside one arena. |
| G3.6 | 3 | H | [G3.6] (04-evidence-gameplay.md) | 180 s rounds with a natural stop at every results card; pause stops the clock; quitting costs only the round. |
| G3.7 | 2 | M | [G3.7] [G2.7] (04-evidence-gameplay.md) | No fail state; retry is 3 inputs through two repeated screens plus a full regeneration and countdown; no "same seed again". |

### G4 — UX heuristics, UI, HUD — 42/100

Legible plates; but no confirm on quit, unskippable initials, inconsistent back buttons, silent refusals.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G4.1 | 3 | M | [G4.1] (04-evidence-ui.md) | Every HUD element informs a live decision; readout and callouts are contextual; idle combo plate and next-milestone never hide (Teardown hides what is not in use). |
| G4.2 | 3 | H | [G4.2] [G4.2b] [G4.2c] (04-evidence-ui.md) | All plate text ≥ 5.3:1, critical numbers 30–56 px; misses 4 on 12–13 px secondary labels, countdown/stamp drawn over the world with shadow-only contrast, and callout/stamp/wheel overlap geometry. |
| G4.3 | 2 | H | [G4.3] [G4.3b] (04-evidence-ui.md) | Depth ≤ 2 and overlays close on Esc, but Esc leaves none of picker/loadout/leaderboard/results/initials, results has no back, initials cannot be declined. |
| G4.4 | 2 | H | [G4.4] (04-evidence-ui.md) | "Back" is BACK-plain, BACK-primary, DONE, MENU or absent depending on screen; two tab classes; confirm size inconsistent. |
| G4.5 | 2 | H | [G4.5] (04-evidence-ui.md) | Hover/active on buttons and cards only; no UI click sound; refused point-buy steps and a 10 s DEPLOY wait give no feedback at all. |
| G4.6 | 2 | M | [G4.6] (04-evidence-ui.md) | Readout is good just-in-time info, but all controls are taught up front on one screen and the combo/heat rules are never surfaced. |
| G4.7 | 1 | H | [G4.7] (04-evidence-ui.md) | QUIT TO MENU abandons a round with no confirmation; initials irreversible and unskippable; seed silently rewritten. |
| G4.8 | 2 | H | [G4.8] (04-evidence-ui.md) | Nothing externalised, `en-US` number formatting hard-coded; layout does tolerate +35 % text with zero overflow. |
| G4.9 | 2 | H | [G4.9] (04-evidence-ui.md) | Buttons follow PC conventions and pointer-lock handling is right; theme cards and leaderboard rows are mouse-only; no gamepad. |

### G5 — Controls and input — 32/100

Keyboard+mouse complete and polled per frame; no remapping (0), hold-only inputs.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G5.1 | 0 | H | [G5.1] (04-evidence-ui.md) | No remapping of any action. |
| G5.2 | 2 | H | [G5.2] (04-evidence-ui.md) | Keyboard+mouse complete; no gamepad on a desktop FPS; touch correctly refused. |
| G5.3 | 2 | H | [G5.3] (04-evidence-ui.md) | Sensitivity 12× range, persisted, keyboard-adjustable; no invert-Y, no ADS sensitivity. |
| G5.4 | 1 | H | [G5.4] (04-evidence-ui.md) | Sprint, aim, Q wheel and auto-fire are hold-only; pistol/shotgun require a click per shot; no toggles. |
| G5.5 | N/A | H | [G5.5] (04-evidence-ui.md) | Desktop-only by design; coarse pointers get a notice. |
| G5.6 | 3 | M | [G5.6] (04-evidence-ui.md) | Events write straight into per-frame state, read every sim step, nothing deferred behind render; perceived latency unmeasurable without GPU. |

### G6 — Performance and stability — 47/100

Stable and leak-free in a 15-min soak; blast and collapse frames far over budget; iGPU fps unverifiable here.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G.custom-2 | 2 | M | [G.custom-2] [G6.2] [G6.2b] (04-evidence-perf.md) | Bar 3: no main-thread frame > 16.7 ms for 2 s after a C4. Every blast exceeded it (worst 24–74 ms); a collapse hit 433 ms. PROGRESS.md agrees (≈ 50 ms). |
| G6.1 | UNVERIFIED | M | [G6.1] (04-evidence-perf.md) | No GPU: the 60 fps-on-iGPU target cannot be observed; main-thread idle p50 4.9 ms fits the budget, p95 60.7 ms does not. Verify with a Chrome profiler run on an iGPU laptop. |
| G6.2 | 2 | M | [G6.2] [G6.2b] (04-evidence-perf.md) | Bar: p99 ≤ 25 ms, no hitch > 100 ms. Single C4: p99 24–74 ms; collapse: 11 frames > 100 ms, max 433 ms. |
| G6.3 | 2 | M | [G6.3] (04-evidence-perf.md) | Bar ≤ 5 s to interactive (browser). 5 MB uncompressed JS plus full arena generation before the menu, with no progress indicator; 35–54 s here, several seconds on real hardware. |
| G6.4 | 3 | M | [G6.4] (04-evidence-perf.md) | Heap flat across 3 rounds / 42 blasts (98 → 95 → 91 MB); geometries, textures, programs, bodies return to baseline. Soak was 3.5 min, not 60. |
| G6.5 | 3 | M | [G6.5] (04-evidence-perf.md) | 360×640 to 3440×1440 all correct (aspect, buffer, no overflow); DPR capped at 2; no vsync/refresh options (browser-managed). |
| G6.6 | 1 | H | [G6.6] (04-evidence-perf.md) | Bar: graphics options with auto-detect. Only sensitivity/volume/FOV; shadows and AA always on; no presets. |
| G6.7 | 3 | M | [G6.7] (04-evidence-perf.md) | Resize, blur, visibility, pointer-lock loss and radial all leave state intact; rapid pause/resume ends paused (safe); countdown is wall-clock. Audio unobservable. |
| G6.8 | 3 | H | [G6.8] [W.custom-1b] (04-evidence-perf.md) | Leaderboard REST only; server-authoritative validation; offline degrades to OFFLINE labels and a playable round, but the results note says "You'd need 0 more" when offline. |
| G6.9 | 2 | H | [G6.9] (04-evidence-perf.md) | Zero uncaught errors in 9 sessions and all catches are deliberate fallbacks, but no global error handler, no crash reporter, no contextual logging, no WebGL-failure message. |

### G7 — Accessibility — 26/100

Below Game Accessibility Guidelines Basic: no text scale, no motion toggle, one volume, no ARIA.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G7.1 | 0 | H | [G7.1] (04-evidence-ui.md) | No text-size option; px-only CSS; at 200 % zoom DEPLOY/NEXT/CONTINUE are off-screen with no scroll. |
| G7.2 | N/A | H | [G7.2] (04-evidence-ui.md) | No speech in the product; non-speech cue redundancy scored under G7.4. |
| G7.3 | 2 | H | [G7.3] (04-evidence-ui.md) | Most states have a redundant cue; empty ammo and the player's leaderboard row are colour-only. |
| G7.4 | 3 | M | [G7.4] (04-evidence-ui.md) | Every gameplay-critical sound has a visual twin; inferred from the event wiring, not heard. |
| G7.5 | 1 | H | [G7.5] (04-evidence-ui.md) | Real buttons and labelled sliders, but zero ARIA, no live regions, no landmarks, unnamed canvas. |
| G7.6 | 1 | H | [G7.6] [G5.1] [G5.4] (04-evidence-ui.md) | No remap, no toggles, mash fire, hold-and-gesture wheel; only sensitivity is adjustable. |
| G7.7 | 1 | H | [G7.7] (04-evidence-ui.md) | Objective shown once; no reduce-motion/shake toggle; 180 s limit with no extend/disable. |
| G7.8 | 1 | H | [G7.8] (04-evidence-ui.md) | Single master volume; music gain fixed; no mono. |

### G8 — Audio, feedback, juice — 45/100

Strong visual juice; audio covers explosions and shots but not state changes; music menus-only.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G8.1 | 2 | H | [G8.1] (04-evidence-gameplay.md) | Shots, explosions, glass, melee, switch, milestone and menus have sound; reload, empty, combo, leveled, clock, round end do not; only glass varies pitch. |
| G8.2 | 2 | M | [G8.2] (04-evidence-gameplay.md) | One master gain, no limiter, no priority or ducking; stacked chain booms can sum past 1.0; music is off in-round so cues are not masked. Not listened to. |
| G8.3 | 3 | M | [G8.3] (04-evidence-gameplay.md) | Shake, flashes, particles, debris, pops, stamps, slow-mo, callouts, count-ups, all on anchored plates; misses the shake toggle and hit-stop. |
| G8.4 | N/A | H | [G8.4] (04-evidence-gameplay.md) | Keyboard/mouse only by design; no gamepad path to haptics. |
| G8.5 | 2 | H | [G8.5] (04-evidence-gameplay.md) | One menu loop, silence in the round, same loop on results; no win/lose or intensity response. |

### G9 — Content depth and retention — 50/100

Seeded arenas and a fair-enough leaderboard; zero telemetry (G9.3 = 0); curl can still take rank 1.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G.custom-3 | 4 | H | [G.custom-3] (04-evidence-gameplay.md) | Same theme + seed gives an identical structure list, arenaTotal and a full voxel-array hash across two page loads; the suite tests it per theme. Meets the 4-bar (voxel hash identical) and the roguelike daily-seed norm. |
| G9.1 | 2 | M | [G9.1] (04-evidence-gameplay.md) | 3 themes, 14 + 9 recipes, 8 weapons; a 9-structure arena repeats recipes (two office blocks, two stores, two shelters in the audited seed). |
| G9.2 | 3 | H | [G9.2] (04-evidence-gameplay.md) | Per-theme and point-buy boards, "need N more", share links and replayable rows; nothing manipulative; no daily seed or personal best. |
| G9.3 | 0 | H | [G9.3] (04-evidence-gameplay.md) | No telemetry; only accepted scores are stored. |
| G9.4 | 3 | M | [G9.4] [G1.3b] (04-evidence-gameplay.md) | Carve → volatile chain → heat; carve → support check → collapse paid as destruction; craters catch debris; leveled → magazines and power. Emergent "cut the legs" strategy. |
| G9.5 | 3 | H | [G9.5] [G.custom-3] (04-evidence-gameplay.md) | Seeded layouts differ meaningfully and repeat exactly; kit and rules do not vary. |
| G9.6 | 2 | H | [G9.6] (04-evidence-gameplay.md) | Forged, replayed, early and over-cap posts are refused, but a plain curl with a valid session, 150 s of patience and a score under the ×5 cap takes rank 1; stats are never checked. |
| G9.7 | 3 | H | [G9.7] [G2.6] (04-evidence-gameplay.md) | Slow-mo, staggered count-up, rank line, initials, highlighted row, PLAY AGAIN; the round ends on purpose. |

### G11 — Engine code and pipeline — 42/100

Strict TS, config-driven, HMR; no CI, variable timestep, magic numbers leaked, 5 MB bundle unbudgeted.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G11.1 | 2 | H | [G11.1] (04-evidence-perf.md) | Variable-step gameplay (dt clamped 50 ms) with fixed-step Rapier only; frame-rate-dependent lerp/Euler/cooldown math remains. Input polled per frame. |
| G11.2 | 2 | H | [G11.2] (04-evidence-perf.md) | Centralised, documented `config/` is good, but it is compiled TS (rebuild for prod) and ~20 clear coefficients leaked into Game/effects/Debris/Controller/Weapons despite the CLAUDE.md rule. |
| G11.3 | 2 | H | [G11.3] (04-evidence-perf.md) | Reproducible build, no maps, three.js tree-shaken, but 82 % of a 5 MB bundle is base64 Rapier wasm, no size budget, warning limit raised to hide it. |
| G11.4 | 3 | M | [G11.4] (04-evidence-perf.md) | Vite HMR + tsx watch; config consumed as TS source so tuning hot-reloads. Not timed. |
| G11.5 | 2 | H | [G11.5] (04-evidence-perf.md) | 33 unit tests on simulation logic and the API; a DOM smoke round exists but is outside `pnpm test`; no CI, build never fails on tests. |
| G11.6 | 1 | H | [G11.6] (04-evidence-perf.md) | Only accepted scores are recorded (with hashed IP); no session/round/fail/settings/crash events. Privacy-respecting by absence. |
| G11.7 | 2 | H | [G11.7] (04-evidence-perf.md) | One-command build and start, Dockerfile/compose present; version frozen at 0.1.0, no tags, no changelog or release checklist. |
| G11.8 | 3 | H | [G11.8] (04-evidence-perf.md) | Strict TS clean, 0.19 % duplication, 0 TODOs, no secrets, 12-factor config, docs match code; no linter, 14 functions > 60 lines (max 181), 7 dead exports, 1 moderate dep vuln. |

### W1 — Web performance and loading — 31/100

5 MB uncompressed single chunk, no cache headers, no CI budget; CLS is perfect.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| W1.1 | 1 | M | [W1.1] [G6.3] (04-evidence-perf.md) | Lab only; first content behind 5 MB uncompressed JS + arena gen; LCP will be "Poor" (> 4 s) on ordinary links. |
| W1.2 | UNVERIFIED | — | [W1.2] (04-evidence-perf.md) | No RUM, no headless INP. Verify with a Lighthouse/RUM run on real hardware. |
| W1.3 | 4 | M | [W1.3] (04-evidence-perf.md) | CLS 0.000 in five lab runs (canvas + absolute overlay, transform-only animations); comparator: any well-built canvas app, e.g. Figma's editor shell. Lab only. |
| W1.4 | 1 | H | [W1.4] (04-evidence-perf.md) | TTFB fine locally, but no gzip/brotli, no CDN, no cache headers. |
| W1.5 | 1 | H | [W1.5] (04-evidence-perf.md) | 5,066 KB JS (1.82 MB gzipped) on the landing path vs 170 KB bar; single chunk. |
| W1.6 | N/A | — | [W1.6] (04-evidence-perf.md) | No raster images; two SVG icons only. |
| W1.7 | 3 | H | [W1.7] [WG7] (04-evidence-perf.md) | ≤ 2 families, `display=swap`, fallbacks work; not self-hosted/subset/preloaded, stylesheet render-blocking. |
| W1.8 | 1 | H | [W1.8] (04-evidence-perf.md) | Fingerprinted assets but no Cache-Control/ETag at all; repeat visit re-downloads 5 MB. |
| W1.9 | 0 | H | [W1.9] (04-evidence-perf.md) | No CI, no budget; chunk warning threshold raised instead. |

### W2 — Web accessibility (WCAG 2.2 AA) — 38/100

Zero axe errors but mouse-only cards/rows, 200 % zoom hides the primary button, reduced-motion ignored.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| W2.1 | 3 | H | [W2.1] (04-evidence-ui.md) | Zero axe WCAG violations on 11 states (best-practice `region` only); contrast had to be measured manually. |
| W2.10 | N/A | H | [W2.10] (04-evidence-ui.md) | No image, video or audio media elements. |
| W2.11 | N/A | H | [W2.11] (04-evidence-ui.md) | No authentication. |
| W2.2 | 2 | H | [W2.2] (04-evidence-ui.md) | PLAY→NEXT→DEPLOY→CONTINUE→SUBMIT all keyboard-reachable with a visible (UA) ring; theme cards and replay rows are not; overlays leave obscured buttons in the Tab order. |
| W2.3 | 1 | M | [W2.3] [G7.5] (04-evidence-ui.md) | No AT run possible; DOM has no live regions/landmarks/dialog semantics, so score, timer and overlays are silent. |
| W2.4 | 3 | H | [W2.4] [G4.2] (04-evidence-ui.md) | Text ≥ 5.3:1 on plates, components ≈ 5.5:1, focus ring UA dual-ring; countdown and stamp over the world rely on shadows. |
| W2.5 | 3 | H | [W2.5] (04-evidence-ui.md) | Every author-sized target ≥ 24×24 (smallest 32×26 steppers); menu buttons 300×61. |
| W2.6 | 2 | H | [W2.6] (04-evidence-ui.md) | Seed input named by placeholder only, silent sanitising; sliders properly labelled. |
| W2.7 | 1 | H | [W2.7] (04-evidence-ui.md) | `prefers-reduced-motion` ignored; infinite pulse animations and an endless auto-orbit camera with no pause. |
| W2.8 | 2 | H | [W2.8] (04-evidence-ui.md) | lang, title, one h1 and per-screen h2 present; zero landmarks, unnamed canvas, two h2 visible with overlays. |
| W2.9 | 0 | H | [W2.9] [G7.1] (04-evidence-ui.md) | 200 % zoom and 360 px both hide the primary button with no way to scroll. |

### W9 — SEO and sharing — 30/100

OG tags exist but the SVG og:image will not render on social crawlers; no structured data.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| W.custom-1 | 3 | H | [W.custom-1] [W.custom-1b] (04-evidence-perf.md) | Link opens the picker with the right theme/seed; one-click copy from results and leaderboard; rows replay. Preview does not name the arena (bar 4). |
| W9.1 | 2 | H | [W9.1] (04-evidence-perf.md) | Title + description present; no canonical/sitemap/robots; catch-all serves 200 HTML for every path including /robots.txt. |
| W9.2 | 0 | H | [W9.2] (04-evidence-perf.md) | No structured data. |
| W9.3 | 1 | H | [W9.3] (04-evidence-perf.md) | OG tags exist but og:image is a relative SVG (not rendered by Facebook/X crawlers), no og:url/twitter:card, no per-arena card. |
| W9.4 | N/A | — | [W9.4] (04-evidence-perf.md) | Canvas game; nothing to index beyond title/description. |
| W9.5 | N/A | — | [W9.5] (04-evidence-perf.md) | Not a local business. |

### W10 — Front-end engineering — 51/100

Clean build and semantic HTML; zero security headers, no browser-support policy.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| W10.1 | 3 | H | [W10.1] (04-evidence-perf.md) | Real buttons, sections, headings, labels, range inputs; theme cards and leaderboard rows are click-only divs/li. |
| W10.2 | N/A | — | [W10.2] (04-evidence-perf.md) | WebGL game cannot work without JS; the missing WebGL-failure message is scored under G6.9. |
| W10.3 | 2 | M | [W10.3] (04-evidence-perf.md) | No stated policy; only Chromium exercised (clean console); es2022 + module workers + pointer lock untested on Safari/Firefox. |
| W10.4 | 1 | H | [W10.4] [G11.8] (04-evidence-perf.md) | Zero security headers; deps audited with one moderate finding. |
| W10.5 | 3 | H | [W10.5] (04-evidence-perf.md) | Reproducible, fingerprinted, no public source maps, no inlined env. |
| W10.6 | 3 | H | [W10.6] [WG7] (04-evidence-perf.md) | One third party (Google Fonts, no scripts); page works with it blocked. |
| W10.7 | 3 | M | [W10.7] (04-evidence-perf.md) | 21 kB, tokens, 0 `!important`, consistent naming; coverage not measured. |
| W10.8 | 3 | H | [G11.8] (04-evidence-perf.md) | As G11.8. |

## 11. Re-audit plan

- **Automate:**
  - A CI workflow (`pnpm typecheck && pnpm test && pnpm build && node scripts/dev/e2e.mjs`) so the build fails on a failing test or a broken round; add `size-limit` on `client/dist/assets/*.js` with a budget that fails above 1 MB compressed.
  - The perf agent's blast script (`scratchpad/agent-perf/`, to be moved into `scripts/dev/`) as `pnpm perf`: five C4s plus a base-cut collapse on `downtown/AUDIT`, failing when `worstFrame` > 16.7 ms on the reference laptop. Keep the headless SwiftShader numbers only as a trend line.
  - axe-core injected into `e2e.mjs` on every screen, failing on any WCAG violation; a Tab-walk assertion that PLAY → NEXT → DEPLOY → CONTINUE → SUBMIT stays keyboard-reachable.
  - A settings fuzz test (`{}`, `[]`, `42`, `"str"`, out-of-range fields) asserting `__vwReady` still fires.
  - Lighthouse CI on the deployed URL once one exists (LCP, INP, CWV field data after a few hundred sessions).
- **Watch weekly** (all three need the minimal telemetry from G11.6 first: session start, deploy, round end, play again, share open, page error):
  1. rounds per visitor and play-again rate (the primary metric);
  2. p99 main-thread frame time during blasts, from the F3 overlay's `worstFrame` beaconed at round end;
  3. share-link opens and the fraction that reach DEPLOY.
- **Re-audit trigger:** after backlog items 1–5 ship, or after the first hands-on session on a real iGPU laptop with speakers (whichever is first), because that session resolves G6.1, W1.2, WG3 and every "unlistened" audio score.

## Appendix — evidence ledger

See `audit/04-evidence-gameplay.md`, `audit/04-evidence-ui.md`, `audit/04-evidence-perf.md` (one ledger per agent; tags in this report refer to them). Per-agent score tables: `audit/05-scores-*.md`. Weights and reasons: `audit/03-weights.md`. Scope and blind spots: `audit/00-scope.md`. Raw scripts, JSON and screenshots were kept in the session scratchpad and are not committed.
