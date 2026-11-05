# 01 — Intent Sheet

Derived from `SPEC.md` (the design doc), `README.md`, `index.html` meta copy, the start-menu and loadout screens, and `docs/PLAYER-FLOW.md`. Inferences are labelled.

## 1. One-sentence promise

> "I can drop into a wreckable voxel arena and blow up as much as I can in three minutes, without installing anything or reading instructions, and put my initials on a board."

Source: SPEC.md "Concept & scope" ("drop into a themed, procedurally generated voxel world with a fixed loadout and 3 minutes to wreck as much of the structures as you can"), `index.html` description ("Three minutes, one loadout, a voxel arena…"), SPEC.md phase-7 gate ("a stranger can play without instructions").

## 2. Target user

A desktop player with a mouse and keyboard who knows first-person controls (WASD + mouse look is never taught; the loadout screen shows key chips). Casual, short-session, leaderboard-motivated. The phone/tablet notice says "DESKTOP ONLY" outright. **Inference:** the player is a friend-of-the-author / small-community audience sharing seed links, not a store audience; there is no account, no monetisation, no store page.

## 3. Primary job

Score as many points as possible in one 180 s round by destroying structures (not terrain), chaining volatile materials for the combo multiplier.

Secondary jobs: compare with friends on the same seed (share links, per-theme leaderboards); try a different loadout (point-buy).

## 4. Design pillars (derived)

| # | Pillar | Evidence it is a pillar |
|---|---|---|
| P1 | **Arcade immediacy** — three minutes, one loadout, no setup | Round length, fixed kit, no accounts (SPEC "Concept"), "MVP cut line" ordering, no tutorial anywhere. |
| P2 | **Everything you see is wreckable and reads at a glance** | Hand-written voxel engine so any voxel can be carved; vertex-colour palette with hazard stripes on volatiles ("the explosive things read at a glance", DECISIONS.md). |
| P3 | **Chain reactions are the skill** | Combo mechanic is defined entirely by volatiles (SPEC "Scoring"); fuel tanks placed inside structures by recipe; `bestChain` is a results stat. |
| P4 | **Same seed, same arena** | Deterministic generation, seed field + dice, share links, leaderboard rows replay their arena. |
| P5 | **Juice is a requirement, not a stretch** | SPEC "Game flow & UI": "Polish is a requirement… every number that changes should tick, pop or slide". |

## 5. Primary success metric

**Rounds played per visitor** (or "play again" rate), with **share-link opens** as the growth proxy. For a 3-minute arcade loop with a leaderboard, the proof the promise is kept is that a player finishes one round and immediately starts another.

- Currently measured: **no.** There is no client telemetry at all. The server stores submitted scores (`scores` table) which gives a lagging count of *completed qualifying rounds* only.
- Should be measured: session start, deploy, round end, play-again, share-link open, settings change, page error.

## 6. First five minutes

By minute five a new player should have: understood that structures score and terrain does not (readout plate), fired every weapon class at least once, triggered at least one chain reaction and seen the multiplier move, finished one round, seen the results screen and either entered initials or seen "you'd need N more", and clicked PLAY AGAIN.

## 7. Explicit non-goals (from SPEC "Out of scope" and DECISIONS)

Multiplayer, mobile/touch, accounts, save files, enemies/NPCs, textures or image assets, any off-the-shelf voxel engine, React. Structural collapse and point-buy were non-goals that later shipped as stretch (phase 7).

Anything present that serves a non-goal is a cut candidate; see `06-features.md`.

## 8. Comparators

| Comparator | What defines the bar here |
|---|---|
| **Teardown** (Tuxedo Labs) | Voxel destruction feel: every material behaves differently, debris has weight, tools are tactile; the reference for "wreckable world" readability and for collapse. |
| **Krunker.io** | Browser FPS onboarding: in a match within ~10 s of landing, pointer-lock handled gracefully, key hints in-world, runs on integrated graphics. |
| **Instruments of Destruction** | Score-attack demolition with a timer and a percent-destroyed readout; the clean "how much did I wreck" results loop and replayable levels. |

Secondary reference for the web surface: **Krunker.io** again (one page, no interstitial, OpenGraph works).

## 9. Constraints

- Platform: desktop browsers with WebGL2 and pointer lock; "DESKTOP ONLY" on coarse pointers.
- Performance envelope (CLAUDE.md): 60 fps on integrated graphics with 300 debris; no main-thread frame over 16 ms during a C4 blast.
- Team: one agent-driven build, one author, one day of commits. No budget tier stated; no legal/regulatory surface (no money, no PII beyond an IP hash).
- Deployment: a single Docker container with SQLite on a volume.
