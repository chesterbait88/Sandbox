# 06 — Feature inventory and Cut / Keep / Enhance

Every user-facing feature, screen, mode, setting and notable system at commit f557656. Usage signals are `unknown` throughout: the product has no telemetry and no players yet, so usage is inferred from prominence and comparator norms (marked *inferred*). Cost is lines of TypeScript (non-test) plus churn (commits touching the main file, from `git log --name-only`). Quality is the criterion score(s) (0–5) from `AUDIT.md` §10 that cover the feature.

Pillars (from `01-intent.md`): P1 arcade immediacy · P2 wreckable and legible · P3 chain reactions are the skill · P4 same seed, same arena · P5 juice is a requirement.

| # | Feature | Pillar served | Usage | Quality (criteria) | Cost | Kano | Decision |
|---|---|---|---|---|---|---|---|
| F1 | Start menu over a live orbiting arena (PLAY / LEADERBOARD / SETTINGS / CREDITS, best strip) | P1 primary | *inferred* 100 % of visitors | G2.2 = 2, G4.3 = 2 | 30 lines + Flow orbit; churn 2 | must-be | KEEP (simplify: see F4) |
| F2 | World picker: 3 theme cards, seed field, dice, live arena rebuild on click | P4 primary | *inferred* every round | G2.2 = 2, G9.5 = 3, G.custom-3 = 4 | 75 lines; churn 3 | performance | ENHANCE (seed typing is `change`-event only; cards are CSS art not renders) |
| F3 | Loadout briefing: 8 spinning weapon viewports, ammo, role, arena points, CONTROLS row, DEPLOY | P1 secondary (it is a mandatory screen between the player and play) | *inferred* every round | G2.2 = 2, G2.5 = 2, GG7 pass | 141 lines; churn 6 | performance | SIMPLIFY — see §Simplify |
| F4 | Credits screen | none | *inferred* ~0 | — | 15 lines | indifferent | CUT (fold the three lines into the menu footer) |
| F5 | Settings: sensitivity, volume, FOV; persisted to localStorage | P1 secondary | *inferred* low | G5.3 = 2, G7.8 = 1, G7.7 = 1, GG2 FAIL | 42 lines + `settings` in dom.ts | must-be | ENHANCE (add shake/flash/reduced-motion toggle, separate music/SFX, remap) |
| F6 | 3-2-1 countdown with camera drop | P5 primary | every round | G2.1 = 2, G8.3 = 3 | in Flow.ts | delighter | KEEP |
| F7 | Round clock (180 s), +5 s milestone reward, slow-mo end freeze | P1 primary | every round | G3.6 = 3, G3.7 = 2, G1.5 = 3 | Round.ts + Flow | must-be | KEEP |
| F8 | Core destruction: `applyDamage` sphere carve, hardness falloff, glass shatter, volatile chain queue | P2 / P3 primary | every round | G1.1 = 3, G1.3 = 2, G1.7 = 2 | damage.ts 155; churn 5 | must-be | ENHANCE (chain cause is not surfaced) |
| F9 | Eight weapons through one damage path (pickaxe, bat, pistol, shotgun, rifle, rocket, grenade, C4) with view models and hands | P2 primary | every round | G1.6 = 3, G8.1 = 2, G1.4 = 2 | Weapons.ts 460 + ViewModel 140 + weaponModels.ts 279; churn 5 | performance | ENHANCE (two melee weapons overlap: see §Merge) |
| F10 | Rapier debris (300 cap, balls), trimesh wall colliders, crater heightfield refresh | P5 primary | every round | G8.3 = 3, G6.2 = 2 | Debris.ts 155 + PhysicsWorld 120 | delighter | KEEP / WATCH cost (insertion-frame spikes) |
| F11 | Structural collapse (support flood-fill on a worker, unsupported clusters fall and pay) | P2 primary | *inferred* most rounds | G9.4 = 3, G1.4 = 2, G6.2 = 2 | Collapse.ts 231 + support.ts + worker | delighter | KEEP (it is the most "Teardown-like" moment) |
| F12 | Effects: shake, flash sprite, additive particles, muzzle flash, recoil, bob | P5 primary | every round | G8.3 = 3, GG5 pass | effects.ts 129 | performance | ENHANCE (no toggle) |
| F13 | Synth audio: boom, shot, tink, swing, click, stinger, menu music loop | P5 primary | every round | G8.1 = 2, G8.2 = 2, G8.5 = 2, G7.8 = 1 | Synth.ts 255 | performance | ENHANCE (no music in-round, no ducking, single volume) |
| F14 | Scoring: per-material value, combo heat meter (×1–×5), leveled bonus, milestones every 1,000 | P3 primary | every round | G1.7 = 2, G3.4 = 2, G3.3 = 2 | Score.ts 178 + scoring.ts | must-be | ENHANCE (rules are invisible until they fire) |
| F15 | Leveled rewards: +1 magazine and +25 % power for 12 s (stacking) | P3 secondary | *inferred* most rounds | G3.4 = 2 | Game.ts subscribe | delighter | WATCH (first-guess tuning per PROGRESS.md) |
| F16 | HUD: score bar, timer, weapon plate + Q radial (slow-mo), combo plate, ammo plate with C4 pips, structure readout + LEVELED stamp, crosshair + hit markers, callouts | P2 / P5 primary | every round | G4.1 = 3, G4.2 = 3, GG6 pass, G4.6 = 2 | hud/ 353 lines + styles.css; churn 10 | must-be | ENHANCE |
| F17 | Pause (Esc / pointer-lock loss): RESUME / SETTINGS / QUIT TO MENU | P1 secondary | every round | GG3 pass, GG4 pass, G4.7 = 1 | Pause.ts 18 + Flow | must-be | ENHANCE (quit is unconfirmed) |
| F18 | Results: ticking stats, final score, top-100 check, "you'd need N more", SHARE ARENA, CONTINUE | P1 / P4 | every round | G2.6 = 3, G9.7 = 3 | Results.ts 60 | must-be | KEEP |
| F19 | Initials entry (arcade columns, typing works) | P1 | qualifying rounds | G4.5 = 2, W2.6 = 2 | Initials.ts | must-be | KEEP |
| F20 | Leaderboard: tabs per theme + ALL + POINT-BUY, top 10, own row, row click replays arena, SHARE ARENA, PLAY AGAIN | P4 primary | every round | G9.2 = 3, G9.6 = 2, G2.7 = 2 | Leaderboard.ts 75 + server 346 | must-be | KEEP |
| F21 | Server anti-cheat: HMAC session, time window, score cap, single-use, profanity, rate limit, IP hash | P4 secondary | every submission | G9.6 = 2, W10.4 = 1 | server/src 346; 8 tests | must-be | KEEP |
| F22 | Point-buy loadout (128-point budget, ±steps, ceilings) with its own board | none (SPEC lists it as a non-goal later promoted to stretch) | *inferred* low (hidden behind a tab) | G9.5 = 3, G3.2 = 0 | Loadout.ts + Flow adjust/customCost + server mode column; ~120 lines | indifferent / delighter | WATCH → candidate CUT |
| F23 | Sticky grenades upgrade (point-buy only) | none | *inferred* very low | — | Weapons.ts branch + LOADOUT.stickyCost | indifferent | CUT (or make it a milestone reward in the fixed kit) |
| F24 | Share links `?arena=theme-SEED` (results + leaderboard, clipboard) | P4 primary | *inferred* low but strategic | W.custom-1 = 3, W9.3 = 1 | Flow.shareLink + main.ts parse | performance | ENHANCE (no OG preview per arena) |
| F25 | Desktop-only notice on coarse pointers | non-goal (mobile) handled honestly | *inferred* some share-link opens | G4.9 = 2 | 6 lines main.ts | must-be | KEEP |
| F26 | F3 debug overlay, `?screen=`, `?test=wall`, `?debug` jump points | none (developer) | 0 player | G11.4 = 3 | DebugOverlay 50 + main.ts jump | indifferent | KEEP (dev-only; F3 is undocumented in-game, which is fine) |
| F27 | OpenGraph tags + og.svg, favicon | P4 secondary | share previews | W9.3 = 1 | index.html | must-be | ENHANCE (SVG og:image is ignored by Facebook/Twitter/Discord) |
| F28 | Three themes × 14 structure recipes × 9 props, contextual siting, terrain variety | P2 primary | every round | G9.1 = 2, G3.5 = 2, G9.5 = 3 | recipes 845 + placer 298 + terrain 173 | performance | KEEP |
| F29 | Menu music loop (stops on deploy) | P5 secondary | every visit | G8.5 = 2 | Synth MUSIC | delighter | ENHANCE (no in-round music / adaptive layer) |
| F30 | Aim zoom on Mouse 2 (tighter spread) | P2 secondary | *inferred* moderate | G5.4 = 1 | Weapons/Game zoom | performance | KEEP |

## Decisions

### Cut
| Feature | Pillar | Usage | Cost | Reason |
|---|---|---|---|---|
| F4 Credits screen | none | ~0 | 15 lines + a menu button | Hick's law: the menu has four buttons, only PLAY matters. Three lines of credits belong in a footer or the settings panel. |
| F23 Sticky grenades (point-buy only) | none | very low | a mode-gated branch in Weapons.ts and a price | Serves a non-goal twice over (point-buy, and an upgrade nobody can reach from the default kit). If the mechanic is fun, give it to everyone as a milestone reward. |

### Merge / Simplify
| Feature | Into / How | Reason |
|---|---|---|
| F9 Pickaxe + Bat | One melee tool (keep the pickaxe's precision, give it the bat's glass/drywall width) | Two free, infinite-ammo melee slots that do the same job with different radii double the slot count the radial has to teach. Teardown ships one sledgehammer. |
| F3 Loadout screen | Collapse to a one-glance briefing: arena name + points standing + DEPLOY, with the weapon strip as a non-blocking band; move CONTROLS into the countdown and first 10 s of play | P1 says "no setup"; a full screen of eight spinning models between the player and play is the one mandatory pre-play screen that is not justified in the Intent Sheet. Krunker.io goes landing → match with one click. |
| F2 Seed field | Keep, but make it live (`input` event) and show the top score for *this* seed, not the theme | The field only commits on blur/Enter today; the arena behind rebuilds silently on theme click but not on typing. |
| F22 Point-buy | Keep behind the tab for now; **instrument first** (how many rounds pick it) and cut in 90 days if < 10 % | It doubles the leaderboard surface, the server token mode, and the budget math for a mode the SPEC called a non-goal. |

### Enhance (where polish budget goes)
Filled from the scorecard in `AUDIT.md` §7 (features whose covering criteria score below 4 and serve a primary pillar): F8, F9, F12, F13, F14, F16, F17, F24, F27, F5.

### Keep (protect)
F6 countdown, F7 clock, F10 debris, F11 collapse, F18 results, F19 initials, F20 leaderboard, F21 anti-cheat, F25 desktop notice, F28 arenas, F30 aim zoom.

### Watch (instrument before deciding)
| Feature | What to measure | Decision rule |
|---|---|---|
| F22 Point-buy | share of deployed rounds in `custom` mode | < 10 % after 90 days → cut, keep the fixed kit only |
| F15 Leveled rewards | how often a round levels ≥ 1 structure; score delta with/without the boost | if < 30 % of rounds ever see it, make the first structure easier to level |
| F10 Debris cap (300) | insertion-frame cost on real iGPU hardware | if p99 > 16 ms with 300, drop the cap to the largest value that holds 60 fps |
| F29 Menu music | mute rate (volume slider to 0) | high mute → make SFX and music separate sliders before adding in-round music |
