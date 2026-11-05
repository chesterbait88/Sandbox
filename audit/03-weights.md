# 03 — Weights

## Game rubric (primary, 80 % of the headline)

Default weights sum to 100; adjusted within ±10 per category with reasons tied to the Intent Sheet, then scaled ×0.8.

| Cat | Name | Default | Adj | Reason | Scaled (×0.8) |
|---|---|---|---|---|---|
| G1 | Core loop and game feel | 15 | **+5 → 20** | P2/P3: the wrecking loop *is* the product; nothing else earns a replay. | 16.0 |
| G2 | Onboarding and first session | 10 | **+3 → 13** | P1 and the phase-7 gate "a stranger can play without instructions"; first session is the whole session for a 3-minute arcade game. | 10.4 |
| G3 | Progression, difficulty, flow | 10 | **−3 → 7** | One round length, no campaign: progression is within-round only. | 5.6 |
| G4 | UX heuristics, UI, HUD | 12 | 0 → 12 | The HUD carries all teaching; keep default. | 9.6 |
| G5 | Controls and input | 8 | 0 → 8 | | 6.4 |
| G6 | Performance and stability | 12 | **+3 → 15** | Explicit constraint in CLAUDE.md (60 fps iGPU, ≤ 16 ms during C4); voxel engines live or die on frame pacing. | 12.0 |
| G7 | Accessibility | 8 | 0 → 8 | | 6.4 |
| G8 | Audio, feedback, juice | 6 | **+2 → 8** | P5 "polish is a requirement"; feedback is how chains are understood. | 6.4 |
| G9 | Content depth and retention | 8 | **−5 → 3** | Three arenas and a leaderboard; depth is deliberately shallow for a three-minute loop. Return triggers still matter but G2.6/G2.7 already carry them. | 2.4 |
| G10 | Monetization ethics | 3 | **−3 → 0** | No monetisation at all; every criterion is N/A, so the category is excluded (formula: only categories with ≥ 1 scored criterion count). | 0 |
| G11 | Engine-side code and pipeline | 8 | **−2 → 6** | Important but not player-facing; the Intent Sheet's metric is rounds played. | 4.8 |
| | **Sum** | 100 | **100** | | **80.0** |

## Web rubric (secondary, 20 % of the headline)

Only the four non-duplicate categories are kept (see `00-scope.md`); their default weights (14 + 12 + 6 + 8 = 40) are scaled to 20.

| Cat | Name | Default | Kept | Scaled (×0.5) |
|---|---|---|---|---|
| W1 | Performance (loading, JS budget, caching) | 14 | yes | 7.0 |
| W2 | Accessibility (WCAG 2.2 AA on the DOM UI) | 12 | yes | 6.0 |
| W9 | SEO, discoverability, sharing | 6 | yes | 3.0 |
| W10 | Front-end engineering quality | 8 | yes | 4.0 |
| W3–W8 | | 60 | dropped (duplicates) | 0 |
| | **Sum** | | | **20.0** |

Within W1, the field-data criteria (W1.1–W1.3) are scored from lab measurement at confidence M as the rubric allows when no field data exists; W1.6 (images) and W1.7 (fonts) are scored; W1.9 (perf budget in CI) is scored.

## Product-specific criteria

| ID | Definition | First-class bar | Anchor | Evidence |
|---|---|---|---|---|
| G.custom-1 | **Volatile legibility.** A fuel tank, propane bottle or transformer is distinguishable from its surroundings at 20 m under every theme's lighting and under deuteranopia. | 3: distinct hue *and* a non-colour pattern (stripes/band) on every volatile; 4: additionally a silhouette or emissive cue readable at 30 m. | P2/P3; Teardown's propane/fuel colour-coding; XAG colour-independence; G7.3. | Gallery close-ups + a simulated colour-blind pass on `materials.ts` colours. |
| G.custom-2 | **Blast budget.** A C4 detonation in the densest structure keeps the main thread ≤ 16 ms per frame, including debris insertion and collapse. | 3: no frame > 16.7 ms during the 2 s after the blast; 4: p99 ≤ 8 ms (the SPEC's own 8 ms bar). | CLAUDE.md non-negotiable; SPEC "Performance budget"; G6.2. | Instrumented headless blast; frame histogram. |
| G.custom-3 | **Seed determinism.** Same theme + seed yields an identical arena (structure list, positions, values) across two page loads and in the test suite. | 3: identical structure list and `arenaTotal`; 4: identical voxel array hash. | P4; roguelike daily-seed norm (Spelunky, Hades); G9.5. | Two headless loads; `placer.test.ts`. |
| W.custom-1 | **Share-link round trip.** A copied `?arena=` link opens the picker with the same theme and seed and the leaderboard row for that arena replays it. | 3: works and is one click; 4: link preview (OpenGraph) names the arena. | P4; G9.6; W9.3. | Follow a generated link headlessly; inspect OG tags. |

Gates GG1–GG9 and WG1–WG7 apply unchanged; GG8 (monetisation) is N/A.
