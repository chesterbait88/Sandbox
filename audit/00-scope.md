# 00 — Scope

**Product:** Voxel Wreck (placeholder name), a first-person browser demolition game.
**Commit audited:** f557656 on `claude/magical-allen-n38z7b` (2026-11-04, 39 commits, single day, single author).
**Audit date:** 2026-11-05. **Auditor:** Claude (aaa-audit skill v. as uploaded, rubrics games.md + web.md).

## Product class

`game` primary / `web` secondary, **80 / 20**.

Rationale: the entire product is a game session; the "web surface" is one HTML page that hosts the canvas and a DOM HUD, plus a tiny leaderboard API. There is no marketing site, no signup, no checkout, no content pages. Web criteria that duplicate a game category are dropped per SKILL.md Phase 0 §2:

| Web category | Disposition | Reason |
|---|---|---|
| W1 Performance / loading | **kept** (scaled) | Boot-to-interactive and bundle weight are the player's first experience; G6.3 covers load only partially. |
| W2 Accessibility | **kept** (scaled) | All menus and HUD are DOM, so WCAG 2.2 applies literally; G7 covers game-specific a11y. |
| W3 Comprehension | dropped | Duplicates G2 (onboarding) and G4 (UI clarity). |
| W4 Navigation / IA | dropped | Duplicates G4.3 (menu depth) and G2.2 (screens before play). |
| W5 Visual design | dropped | Duplicates G4 (consistency, legibility) and G8 (juice). |
| W6 Forms / conversion | dropped | The only forms are a seed field and initials entry; covered by G4.5 / G4.7 and W2.6. |
| W7 Trust / ethics | dropped | No money, no consent surface, no tracking; G10 is N/A for the same reason. |
| W8 Retention | dropped | Duplicates G9.2 / G9.3 / G2.7. |
| W9 SEO / sharing | **kept** (scaled) | Share links and OpenGraph are a product feature (`?arena=` links). |
| W10 Front-end engineering | **kept** (scaled) | Security headers, build hygiene and dependency audit have no game-rubric equivalent; G11.8 points to S2 only. |

## What can be exercised here

| Evidence source | Available | Notes |
|---|---|---|
| Source tree | yes | ~8.9k lines TS across `config/`, `client/`, `server/`. |
| Clean build | yes | `pnpm install --frozen-lockfile && pnpm build`, timed. |
| Test suite | yes | Vitest, 33 tests; run twice for flakiness. |
| Type check | yes | `pnpm typecheck` (strict). |
| Running instance | **yes, headless only** | Built client served by the Node server, driven with Playwright + Chromium on SwiftShader (software GL). No GPU, no real pointer lock, no audio output device. |
| Frame-time capture | partial | Main-thread frame times from `performance.now()` inside the loop; GPU time unmeasurable (SwiftShader is CPU rasterisation and 10–50× slower than an iGPU). |
| Memory trace | partial | `performance.memory` in Chromium over a soak. |
| Telemetry / analytics | none | The product has none. |
| Store / review data | none | Not shipped publicly. |
| Design docs | yes | `SPEC.md`, `DECISIONS.md`, `PROGRESS.md`, `docs/PLAYER-FLOW.md`, `docs/DEVELOPER-TREE.md`. |
| User research / playtests | none | No evidence of a human having played a round (PROGRESS.md says so explicitly). |
| Screenshots | yes | 87-image committed gallery plus fresh captures. |
| Docker | no daemon | Dockerfile read statically; PROGRESS.md records a prior successful build. |

## Known blind spots

1. **No GPU.** Every fps number is a main-thread CPU number. G6.1/G6.2 are scored at confidence M at best and the headline "60 fps on integrated graphics" target is UNVERIFIED.
2. **No real pointer lock or human input.** Mouse-look feel (G1.2 perceived latency, G5.3 sensitivity defaults) can only be inferred from the code path; scored at confidence M or marked UNVERIFIED.
3. **No speakers.** Audio mix (G8.2) is judged from the synth code and gain graph, not by listening.
4. **No players.** Retention (G9.3), measured onboarding (G2.1 "fresh player"), and difficulty-curve data (G3.1) rely on a simulated fresh-player walk-through by the auditor.
5. **Single-day history.** Git churn/hotspot analysis (S2.10 via G11.8) has 39 commits in one day; cadence and bus factor are trivially "one author, one day".

Confidence for the audit as a whole: **Medium** (the product runs end to end here, but every player-feel and GPU criterion is inferred).
