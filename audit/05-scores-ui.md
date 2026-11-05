# 05 — Scores: UI / controls / accessibility (agent `ui`)

Comparators used for 4/5 judgements: Krunker.io (browser FPS menus, keyboard+mouse conventions), Teardown (HUD restraint, settings depth incl. remapping and accessibility toggles), Instruments of Destruction (score-attack HUD readability). No criterion reached a 4.

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G4.1 | 3 | M | [G4.1] | Every HUD element informs a live decision; readout and callouts are contextual; idle combo plate and next-milestone never hide (Teardown hides what is not in use). |
| G4.2 | 3 | H | [G4.2] [G4.2b] [G4.2c] | All plate text ≥ 5.3:1, critical numbers 30–56 px; misses 4 on 12–13 px secondary labels, countdown/stamp drawn over the world with shadow-only contrast, and callout/stamp/wheel overlap geometry. |
| G4.3 | 2 | H | [G4.3] [G4.3b] | Depth ≤ 2 and overlays close on Esc, but Esc leaves none of picker/loadout/leaderboard/results/initials, results has no back, initials cannot be declined. |
| G4.4 | 2 | H | [G4.4] | "Back" is BACK-plain, BACK-primary, DONE, MENU or absent depending on screen; two tab classes; confirm size inconsistent. |
| G4.5 | 2 | H | [G4.5] | Hover/active on buttons and cards only; no UI click sound; refused point-buy steps and a 10 s DEPLOY wait give no feedback at all. |
| G4.6 | 2 | M | [G4.6] | Readout is good just-in-time info, but all controls are taught up front on one screen and the combo/heat rules are never surfaced. |
| G4.7 | 1 | H | [G4.7] | QUIT TO MENU abandons a round with no confirmation; initials irreversible and unskippable; seed silently rewritten. |
| G4.8 | 2 | H | [G4.8] | Nothing externalised, `en-US` number formatting hard-coded; layout does tolerate +35 % text with zero overflow. |
| G4.9 | 2 | H | [G4.9] | Buttons follow PC conventions and pointer-lock handling is right; theme cards and leaderboard rows are mouse-only; no gamepad. |
| G5.1 | 0 | H | [G5.1] | No remapping of any action. |
| G5.2 | 2 | H | [G5.2] | Keyboard+mouse complete; no gamepad on a desktop FPS; touch correctly refused. |
| G5.3 | 2 | H | [G5.3] | Sensitivity 12× range, persisted, keyboard-adjustable; no invert-Y, no ADS sensitivity. |
| G5.4 | 1 | H | [G5.4] | Sprint, aim, Q wheel and auto-fire are hold-only; pistol/shotgun require a click per shot; no toggles. |
| G5.5 | N/A | H | [G5.5] | Desktop-only by design; coarse pointers get a notice. |
| G5.6 | 3 | M | [G5.6] | Events write straight into per-frame state, read every sim step, nothing deferred behind render; perceived latency unmeasurable without GPU. |
| G7.1 | 0 | H | [G7.1] | No text-size option; px-only CSS; at 200 % zoom DEPLOY/NEXT/CONTINUE are off-screen with no scroll. |
| G7.2 | N/A | H | [G7.2] | No speech in the product; non-speech cue redundancy scored under G7.4. |
| G7.3 | 2 | H | [G7.3] | Most states have a redundant cue; empty ammo and the player's leaderboard row are colour-only. |
| G7.4 | 3 | M | [G7.4] | Every gameplay-critical sound has a visual twin; inferred from the event wiring, not heard. |
| G7.5 | 1 | H | [G7.5] | Real buttons and labelled sliders, but zero ARIA, no live regions, no landmarks, unnamed canvas. |
| G7.6 | 1 | H | [G7.6] [G5.1] [G5.4] | No remap, no toggles, mash fire, hold-and-gesture wheel; only sensitivity is adjustable. |
| G7.7 | 1 | H | [G7.7] | Objective shown once; no reduce-motion/shake toggle; 180 s limit with no extend/disable. |
| G7.8 | 1 | H | [G7.8] | Single master volume; music gain fixed; no mono. |
| W2.1 | 3 | H | [W2.1] | Zero axe WCAG violations on 11 states (best-practice `region` only); contrast had to be measured manually. |
| W2.2 | 2 | H | [W2.2] | PLAY→NEXT→DEPLOY→CONTINUE→SUBMIT all keyboard-reachable with a visible (UA) ring; theme cards and replay rows are not; overlays leave obscured buttons in the Tab order. |
| W2.3 | 1 | M | [W2.3] [G7.5] | No AT run possible; DOM has no live regions/landmarks/dialog semantics, so score, timer and overlays are silent. |
| W2.4 | 3 | H | [W2.4] [G4.2] | Text ≥ 5.3:1 on plates, components ≈ 5.5:1, focus ring UA dual-ring; countdown and stamp over the world rely on shadows. |
| W2.5 | 3 | H | [W2.5] | Every author-sized target ≥ 24×24 (smallest 32×26 steppers); menu buttons 300×61. |
| W2.6 | 2 | H | [W2.6] | Seed input named by placeholder only, silent sanitising; sliders properly labelled. |
| W2.7 | 1 | H | [W2.7] | `prefers-reduced-motion` ignored; infinite pulse animations and an endless auto-orbit camera with no pause. |
| W2.8 | 2 | H | [W2.8] | lang, title, one h1 and per-screen h2 present; zero landmarks, unnamed canvas, two h2 visible with overlays. |
| W2.9 | 0 | H | [W2.9] [G7.1] | 200 % zoom and 360 px both hide the primary button with no way to scroll. |
| W2.10 | N/A | H | [W2.10] | No image, video or audio media elements. |
| W2.11 | N/A | H | [W2.11] | No authentication. |

Category means (excluding N/A): G4 = 2.11/5 (42), G5 = 1.60/5 (32), G7 = 1.29/5 (26), W2 = 1.89/5 (38).

| Gate | Result | Evidence | Note |
|---|---|---|---|
| GG6 Legibility | PASS | [G4.2] [G4.2b] | Narrow pass: every gameplay-critical number is 30–56 px at ≥ 5.3:1 on its plate; the wheel's weapon names (12 px) and the ARMED label (12 px, rotated) sit below any published floor, and nothing scales at 4K/DPR 1 ([G6.5]). |
| GG7 Controls | PASS | [G5.7] | Narrow pass: every required action is reachable through an input documented on the loadout screen; Mouse 2 detonate (README only), F3, and the "hold" semantics of Q are undocumented in-game, and no reference is reachable during play. No remapping. |
| WG1 Critical path at 360 px | FAIL | [W2.9] [G6.5] | At 360×640 the loadout screen clips 57 elements, DEPLOY and BACK are below the viewport (y 706–783) with overflow hidden, and HUD plates overlap; the flow cannot be completed. (Product declares desktop-only, but the gate is unconditional.) |
| WG2 WCAG 2.2 Level A on the critical path | FAIL | [W2.2] [W2.1] [G7.5] | axe finds zero Level A errors, page is titled and lang-tagged, no trap, but SC 2.1.1: theme selection (picker, on the critical path) and leaderboard replay rows are mouse-only `<div>`/`<li>` click targets; the canvas has no text alternative (1.1.1). |

## Goal question answers

Q15 — Partly — Every gameplay-critical number is ≥ 30 px and ≥ 5.3:1 on its plate, but the 12–13 px wheel names/ARMED/combo labels fall under the floor and the countdown and LEVELED stamp are drawn over the world with shadow-only contrast (1.0:1 / 1.25:1 at their worst pixels). — [G4.2] [G4.2b]

Q16 — Partly — All actions are reachable on keyboard+mouse with defaults documented on the loadout screen, but Mouse 2 detonate, F3 and the hold-Q semantics are undocumented in-game and nothing can be remapped or toggled. — [G5.7] [G5.1] [G5.4]

Q17 — Partly — The DOM menus run PLAY→NEXT→DEPLOY→CONTINUE→SUBMIT by keyboard with a visible UA focus ring and zero axe errors, but theme cards and leaderboard rows are mouse-only and overlays leave obscured buttons in the Tab order. — [W2.2] [W2.1]

Q18 — Partly — 1366×768 is clean (nothing clipped, no overlaps); 360×640 shows the menu correctly but the loadout's DEPLOY is off-screen with no scroll and the HUD plates overlap. — [W2.9] [G6.5]

Q19 — No — The only settings are mouse sensitivity, master volume and FOV; there is no difficulty, assist, timer, motion or remap option. — [G7.7] [G7.6] [G5.3]

## Findings

1. G4.7 · QUIT TO MENU (pause) ends the round instantly: `paused`→`menu` in one click, no confirm, score and time discarded; initials entry cannot be declined once a score qualifies · bar: destructive actions confirm with the consequence stated; accidental inputs recoverable · fix: a two-button confirm ("Abandon round? Score 4,120 will be lost") on QUIT, and a SKIP on initials that goes to the leaderboard without posting · impact H · effort S

2. W2.9 / G7.1 · At browser zoom 200 % (and at 360 px) the primary button of the loadout, picker, results and leaderboard is outside the viewport and `overflow:hidden` prevents scrolling; all CSS is px so no text-scaling path exists · bar: WCAG 1.4.4/1.4.10 — 200 % and 320 px reflow without loss; XAG text scaling ≥ 200 % · fix: `.screen { overflow:auto }` with `min-height` instead of fixed centring, `rem`-based type with a UI-scale setting, wrap `.slots`/`.cards` · impact H · effort M

3. W2.2 / G4.9 · Theme cards (`div.card`) and leaderboard replay rows (`li`) are click-only with no `tabindex`, `role` or key handling; opening SETTINGS leaves focus on `body` and the Tab order walks the obscured buttons behind the overlay · bar: SC 2.1.1 keyboard, 2.4.3 order, 2.4.11 focus not obscured; PC menus navigable with every supported input · fix: make cards `<button>`s inside a radiogroup, give rows a button or `tabindex=0`+Enter, move focus into overlays and mark them `role=dialog aria-modal` with `inert` on the screen behind · impact M · effort S

4. G7.7 / W2.7 / G7.8 · No reduce-motion or shake toggle, `prefers-reduced-motion` ignored, infinite pulse animations and a perpetual auto-orbit camera; one master volume; 180 s limit cannot be extended or disabled · bar: Game Accessibility Guidelines Basic (separate volumes, option to disable screen shake/flashing) and XAG time-limit guidance · fix: a "Motion & shake" toggle wired to `effects.applyShake`, the pulse keyframes and the orbit; SFX/music sliders on the existing `Synth` graph; honour the media query in CSS · impact M · effort S

5. G4.5 · Refused point-buy steps (budget reached) and the sticky toggle fail silently with no disabled state; DEPLOY pressed while the arena regenerates waits up to 10 s with the button unchanged and no spinner; no menu button has a sound · bar: every UI input acknowledged visibly and audibly within a frame; disabled states explain why · fix: set `disabled` + a "BUDGET FULL" hint from `adjust()`'s return value, swap DEPLOY to "BUILDING ARENA…" while `loading` is pending, reuse `Synth.click()` on `button()` · impact M · effort S

6. G4.2 / G4.3b · The milestone callout (bottom 150 px), the LEVELED stamp (above the readout, no plate) and the bottom three Q-wheel segments share the same 720p screen band and overdraw each other; the stamp and countdown are drawn over the world with 1.0–1.25:1 contrast at their worst pixels; wheel weapon names are 12 px · bar: HUD text ≥ 4.5:1 on its actual background and readable at target distance; elements never obscure each other · fix: put the stamp inside the readout plate, lift the callout above the wheel ring (or hide it while the wheel is open), give the countdown a plate or dark scrim, raise wheel label size to ≥ 16 px · impact M · effort S
