# 05 — Scores: gameplay (G1, G2, G3, G8, G9, custom)

Comparators used for every 4: Teardown (material response, tactility), Krunker.io (browser FPS onboarding and rematch speed), Instruments of Destruction (score-attack demolition loop and live objective readout). Evidence tags refer to `04-evidence-gameplay.md`.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G1.1 | 3 | M | [G1.1] [G1.3b] | The verb (shoot, things fly, number ticks) is on screen in the first frame; what *scores* (structures, not the crater you just dug) is never said, only implied by absent feedback. |
| G1.2 | 3 | M | [G1.2] | Input polled once per frame, hitscan hits resolve and render in the same frame, melee's 100 ms is deliberate; real input-to-photon and pointer-lock feel cannot be measured headlessly. |
| G1.3 | 2 | H | [G1.3] [G2.4b] [G1.3b] | Outcomes are deterministic, but pistol/bat/pickaxe do nothing to brick/concrete/steel and the game gives zero feedback, so a player cannot attribute the "miss" to a rule. |
| G1.4 | 2 | H | [G1.4] | Explosions have 4+1 channels; combo level-up, leveled, score change, time-out and ammo-out have one visual channel and no audio; ineffective hits have none. |
| G1.5 | 3 | M | [G1.5] | Seconds-scale decisions, the draining heat meter forces re-engagement, dead time is travel and reloads by design; tuned only from headless runs. |
| G1.6 | 3 | M | [G1.6] [G9.4] | Chain routing, combo upkeep, collapse exploitation and point-buy give an expert a visibly different round; no playtest evidence. |
| G1.7 | 2 | H | [G1.7] | Terrain = 0, props never grant rewards, 100 % leveled threshold, scoring freeze and quiet milestones are all silent exceptions. |
| G2.1 | 2 | M | [G2.1] [G2.2] | 3 clicks + 3 s countdown after a boot that cannot be timed on target hardware here (17 s on software GL); two screens to read makes the ≤15 s browser-arcade bar improbable for a stranger. |
| G2.2 | 2 | H | [G2.2] | Two mandatory screens beyond the title (picker, loadout), both defaulted but neither skippable. |
| G2.3 | 1 | H | [G2.3] [G1.7] | The only teaching is 11 key chips and one-line weapon roles on the loadout screen; no mechanic is introduced in play, no in-round hint exists in the bundle. |
| G2.4 | 1 | H | [G2.4] [G2.4b] [G2.4c] | The two first "failures" (hard material, empty magazine) produce no explanation: no sound, no text, no cue beyond a red plate. |
| G2.5 | 2 | H | [G2.5] | Nothing to skip, but the controls reference is unreachable from a round without quitting it (4 inputs, round lost). |
| G2.6 | 3 | M | [G2.6] [G9.7] | A rank, a "need N more" goal and a replay/share reason exist by the end of round one; no personal best for the unranked player. |
| G2.7 | 2 | H | [G2.7] | 3 inputs to the next countdown and theme/mode are remembered within the session, but nothing survives a page load except three sliders. |
| G3.1 | 2 | M | [G3.1] | Early hook (first milestone in a few shots) and a red-clock crescendo, but no waves, valleys or mid-round change; the arena at 2:50 is the arena at 0:10. |
| G3.2 | 0 | H | [G3.2] | No difficulty settings or assist toggles of any kind; Settings is three sliders. |
| G3.3 | 2 | H | [G3.3] [G1.1] | Score, next milestone and clock are always visible, but the primary job (structures, not terrain) and arena % are not surfaced until the results card. |
| G3.4 | 2 | H | [G3.4] | Varied in kind within "power" (ammo, time, boost, multiplier) but a fixed 1,000-pt drip, not timed to an interest curve. |
| G3.5 | 2 | M | [G3.5] [G9.1] | Nothing new arrives within a round; across rounds three themes and 14 recipes with repeats inside one arena. |
| G3.6 | 3 | H | [G3.6] | 180 s rounds with a natural stop at every results card; pause stops the clock; quitting costs only the round. |
| G3.7 | 2 | M | [G3.7] [G2.7] | No fail state; retry is 3 inputs through two repeated screens plus a full regeneration and countdown; no "same seed again". |
| G8.1 | 2 | H | [G8.1] | Shots, explosions, glass, melee, switch, milestone and menus have sound; reload, empty, combo, leveled, clock, round end do not; only glass varies pitch. |
| G8.2 | 2 | M | [G8.2] | One master gain, no limiter, no priority or ducking; stacked chain booms can sum past 1.0; music is off in-round so cues are not masked. Not listened to. |
| G8.3 | 3 | M | [G8.3] | Shake, flashes, particles, debris, pops, stamps, slow-mo, callouts, count-ups, all on anchored plates; misses the shake toggle and hit-stop. |
| G8.4 | N/A | H | [G8.4] | Keyboard/mouse only by design; no gamepad path to haptics. |
| G8.5 | 2 | H | [G8.5] | One menu loop, silence in the round, same loop on results; no win/lose or intensity response. |
| G9.1 | 2 | M | [G9.1] | 3 themes, 14 + 9 recipes, 8 weapons; a 9-structure arena repeats recipes (two office blocks, two stores, two shelters in the audited seed). |
| G9.2 | 3 | H | [G9.2] | Per-theme and point-buy boards, "need N more", share links and replayable rows; nothing manipulative; no daily seed or personal best. |
| G9.3 | 0 | H | [G9.3] | No telemetry; only accepted scores are stored. |
| G9.4 | 3 | M | [G9.4] [G1.3b] | Carve → volatile chain → heat; carve → support check → collapse paid as destruction; craters catch debris; leveled → magazines and power. Emergent "cut the legs" strategy. |
| G9.5 | 3 | H | [G9.5] [G.custom-3] | Seeded layouts differ meaningfully and repeat exactly; kit and rules do not vary. |
| G9.6 | 2 | H | [G9.6] | Forged, replayed, early and over-cap posts are refused, but a plain curl with a valid session, 150 s of patience and a score under the ×5 cap takes rank 1; stats are never checked. |
| G9.7 | 3 | H | [G9.7] [G2.6] | Slow-mo, staggered count-up, rank line, initials, highlighted row, PLAY AGAIN; the round ends on purpose. |
| G.custom-1 | 3 | M | [G.custom-1] | Every volatile has a distinct hue and a row-pattern (stripes/band) that survives deuteranopia (fuel base = brick at ΔE 1.9, stripe contrast ΔE 21); no emissive or silhouette cue, lighting at 20–30 m not verifiable without a GPU. |
| G.custom-3 | 4 | H | [G.custom-3] | Same theme + seed gives an identical structure list, arenaTotal and a full voxel-array hash across two page loads; the suite tests it per theme. Meets the 4-bar (voxel hash identical) and the roguelike daily-seed norm. |

| Gate | Result | Evidence | Note |
|---|---|---|---|
| GG2 | FAIL | [GG2a] [GG2b] | Server: WAL + atomic inserts, survives SIGKILL, replay refused after restart. Client: a `vw.settings` value of `{}`, `[]`, `42` or `"str"` passes `settings.load()`, `setVolume(undefined)` throws in `Synth.ensure()` during warm-up and the game never boots; out-of-range values are applied unclamped. |
| GG9 | PASS | [GG9] [G2.2] | No account, launcher, survey or consent wall; the two interposed screens are the game's own and have defaults. |

## Goal question answers

Q1 — Partly — Three clicks and a 3 s countdown with no account, but after a world build that is unmeasured on target hardware (17 s on software GL) and two screens a stranger will read — [G2.1] [G2.2]
Q2 — No — The loadout screen's CONTROLS chips are the only teaching; no in-round or countdown prompt exists in the source or bundle — [G2.3] [G2.5]
Q3 — No — A terrain hit gives debris, particles and a hit marker but no score change, readout or message; "terrain is free" is only inferable from absence, and the biggest blasts are mostly terrain — [G1.1] [G1.3b] [G1.7]
Q4 — Yes — Stripes/bands are a non-colour cue on every volatile and survive deuteranopia (fuel base colour alone equals brick, ΔE 1.9); distance under theme lighting not verifiable without a GPU — [G.custom-1]
Q5 — Partly — A chain gives a bigger flash, shake and boom 150 ms later and the combo plate pops magenta with "CHAIN n", but nothing says "chain" or sounds the multiplier step, so causation is inferable, not stated — [G1.4] [G1.3b]
Q6 — Yes — Combo heat rate, the 100 % leveled threshold, the prop exception, quiet milestones, the scoring freeze and terrain = 0 are all undiscoverable except by inference — [G1.7] [G2.3]
Q7 — Yes — Results → rank or "need N more" → initials → highlighted leaderboard row → PLAY AGAIN; the unranked player gets no personal best to beat — [G2.6] [G9.7]
Q8 — Yes — PLAY AGAIN → NEXT: LOADOUT → DEPLOY is 3 inputs; theme and mode persist within the session (not across loads); the seed re-rolls and the arena regenerates — [G2.7] [G3.7]
Q13 — No — Server persistence is atomic and SIGKILL-safe; client settings with a non-object or partial JSON shape crash the boot and out-of-range values are applied unclamped — [GG2a] [GG2b]
Q24 — Boot plus two screens vs Krunker.io's ~10 s to a match; silent ineffective hits vs Teardown's universal material response; no live objective/arena % vs Instruments of Destruction's readout; the results→initials→board loop and seed sharing are level with the comparators — [Q24] [G1.3] [G3.3]

## Findings

1. GG2 / G2.7 · `settings.load()` returns any parsed JSON; `{}`, `[]`, `42`, `"str"` reach `audio.setVolume(undefined)` and `Synth.ensure()` throws "non-finite AudioParam" inside `Game.warmup()`, so the page never becomes playable; `{"sensitivity":"abc","volume":5,"fov":-1}` is applied as-is · bar: corrupted save detected and handled, not a crash · fix: validate `typeof === 'object'` and each field `Number.isFinite`, clamp to `PLAYER.sensitivityMin/Max`, 0–1, 60–110, fall back per field, and never let `setVolume` write a non-finite value · impact H · effort S.
2. G1.3 / G1.4 / G2.4 · pistol, bat and pickaxe on brick/concrete/steel emit `hit` with `destroyed: []` and the game plays, spawns and ticks nothing; empty magazine likewise · bar: every action ≥ 2 feedback channels and the first failure is legible · fix: on `hit` with no destruction and power > 0 play a ricochet/thud, spawn a small dust sprite and give the crosshair a "blocked" tick; on empty, a dry-click and an "EMPTY · R / 1–8" line on the ammo plate · impact H · effort S.
3. G2.3 / G3.3 / G1.1 · nothing teaches that structures score and terrain is free, what the combo meter is, or that 100 % levels a building; no in-round hints exist · bar: teach by doing; goal statable at any moment · fix: one-shot contextual prompts on first occurrence (first terrain-only hit → "TERRAIN IS FREE · WRECK THE BUILDINGS", first chain → "CHAIN REACTION ×1.5", first prop → "SCENERY"), show the key chips on the countdown, add a live "ARENA n %" to the score bar · impact H · effort M.
4. G9.6 · a valid session plus 150 s of patience lets a bare `curl` post 299,999 (under the ×5 theme cap) and take rank 1; `stats` are stored unchecked · bar: leaderboards resist trivial cheating · fix: cap at the arena's computable maximum (theme + seed → arenaTotal × (1 + leveledBonus) × max combo headroom, recomputed server-side or signed into the session), require `stats` consistency (score ≤ k × voxelsDestroyed, arenaPercent ≤ 1), rate-limit scores per IP · impact M · effort M.
5. G8.1 / G8.2 · reload, empty, combo step, leveled, last seconds and round end are silent; the shot sound is one fixed burst per weapon; one master gain with no limiter · bar: every meaningful action has sound, varied; priority/limiter · fix: six short synth cues, ±5 % pitch and filter jitter on `shot`/`boom`, a `DynamicsCompressorNode` on master · impact M · effort S.
6. G3.2 / G8.3 · no difficulty or assist options and screen shake / screen flash cannot be turned off · bar: ≥ 3 options or assist toggles; shake toggleable · fix: Settings toggles for shake, flash and slow-mo, plus a practice round length (120/180/240 s) off the leaderboard · impact M · effort S.
