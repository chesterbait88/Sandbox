# 05 — Scores (perf agent)

Scale: 0–5 per SKILL.md; 3 = meets the published bar. Conf H = measured/reproduced, M = observed once or inferred from code, L = docs only. All frame numbers are headless SwiftShader main-thread measurements (see the ledger preamble).

| ID | Score | Conf | Evidence | Note |
|---|---|---|---|---|
| G6.1 | UNVERIFIED | M | [G6.1] | No GPU: the 60 fps-on-iGPU target cannot be observed; main-thread idle p50 4.9 ms fits the budget, p95 60.7 ms does not. Verify with a Chrome profiler run on an iGPU laptop. |
| G6.2 | 2 | M | [G6.2] [G6.2b] | Bar: p99 ≤ 25 ms, no hitch > 100 ms. Single C4: p99 24–74 ms; collapse: 11 frames > 100 ms, max 433 ms. |
| G6.3 | 2 | M | [G6.3] | Bar ≤ 5 s to interactive (browser). 5 MB uncompressed JS plus full arena generation before the menu, with no progress indicator; 35–54 s here, several seconds on real hardware. |
| G6.4 | 3 | M | [G6.4] | Heap flat across 3 rounds / 42 blasts (98 → 95 → 91 MB); geometries, textures, programs, bodies return to baseline. Soak was 3.5 min, not 60. |
| G6.5 | 3 | M | [G6.5] | 360×640 to 3440×1440 all correct (aspect, buffer, no overflow); DPR capped at 2; no vsync/refresh options (browser-managed). |
| G6.6 | 1 | H | [G6.6] | Bar: graphics options with auto-detect. Only sensitivity/volume/FOV; shadows and AA always on; no presets. |
| G6.7 | 3 | M | [G6.7] | Resize, blur, visibility, pointer-lock loss and radial all leave state intact; rapid pause/resume ends paused (safe); countdown is wall-clock. Audio unobservable. |
| G6.8 | 3 | H | [G6.8] [W.custom-1b] | Leaderboard REST only; server-authoritative validation; offline degrades to OFFLINE labels and a playable round, but the results note says "You'd need 0 more" when offline. |
| G6.9 | 2 | H | [G6.9] | Zero uncaught errors in 9 sessions and all catches are deliberate fallbacks, but no global error handler, no crash reporter, no contextual logging, no WebGL-failure message. |
| G.custom-2 | 2 | M | [G.custom-2] [G6.2] [G6.2b] | Bar 3: no main-thread frame > 16.7 ms for 2 s after a C4. Every blast exceeded it (worst 24–74 ms); a collapse hit 433 ms. PROGRESS.md agrees (≈ 50 ms). |
| G11.1 | 2 | H | [G11.1] | Variable-step gameplay (dt clamped 50 ms) with fixed-step Rapier only; frame-rate-dependent lerp/Euler/cooldown math remains. Input polled per frame. |
| G11.2 | 2 | H | [G11.2] | Centralised, documented `config/` is good, but it is compiled TS (rebuild for prod) and ~20 clear coefficients leaked into Game/effects/Debris/Controller/Weapons despite the CLAUDE.md rule. |
| G11.3 | 2 | H | [G11.3] | Reproducible build, no maps, three.js tree-shaken, but 82 % of a 5 MB bundle is base64 Rapier wasm, no size budget, warning limit raised to hide it. |
| G11.4 | 3 | M | [G11.4] | Vite HMR + tsx watch; config consumed as TS source so tuning hot-reloads. Not timed. |
| G11.5 | 2 | H | [G11.5] | 33 unit tests on simulation logic and the API; a DOM smoke round exists but is outside `pnpm test`; no CI, build never fails on tests. |
| G11.6 | 1 | H | [G11.6] | Only accepted scores are recorded (with hashed IP); no session/round/fail/settings/crash events. Privacy-respecting by absence. |
| G11.7 | 2 | H | [G11.7] | One-command build and start, Dockerfile/compose present; version frozen at 0.1.0, no tags, no changelog or release checklist. |
| G11.8 | 3 | H | [G11.8] | Strict TS clean, 0.19 % duplication, 0 TODOs, no secrets, 12-factor config, docs match code; no linter, 14 functions > 60 lines (max 181), 7 dead exports, 1 moderate dep vuln. |
| W1.1 | 1 | M | [W1.1] [G6.3] | Lab only; first content behind 5 MB uncompressed JS + arena gen; LCP will be "Poor" (> 4 s) on ordinary links. |
| W1.2 | UNVERIFIED | — | [W1.2] | No RUM, no headless INP. Verify with a Lighthouse/RUM run on real hardware. |
| W1.3 | 4 | M | [W1.3] | CLS 0.000 in five lab runs (canvas + absolute overlay, transform-only animations); comparator: any well-built canvas app, e.g. Figma's editor shell. Lab only. |
| W1.4 | 1 | H | [W1.4] | TTFB fine locally, but no gzip/brotli, no CDN, no cache headers. |
| W1.5 | 1 | H | [W1.5] | 5,066 KB JS (1.82 MB gzipped) on the landing path vs 170 KB bar; single chunk. |
| W1.6 | N/A | — | [W1.6] | No raster images; two SVG icons only. |
| W1.7 | 3 | H | [W1.7] [WG7] | ≤ 2 families, `display=swap`, fallbacks work; not self-hosted/subset/preloaded, stylesheet render-blocking. |
| W1.8 | 1 | H | [W1.8] | Fingerprinted assets but no Cache-Control/ETag at all; repeat visit re-downloads 5 MB. |
| W1.9 | 0 | H | [W1.9] | No CI, no budget; chunk warning threshold raised instead. |
| W9.1 | 2 | H | [W9.1] | Title + description present; no canonical/sitemap/robots; catch-all serves 200 HTML for every path including /robots.txt. |
| W9.2 | 0 | H | [W9.2] | No structured data. |
| W9.3 | 1 | H | [W9.3] | OG tags exist but og:image is a relative SVG (not rendered by Facebook/X crawlers), no og:url/twitter:card, no per-arena card. |
| W9.4 | N/A | — | [W9.4] | Canvas game; nothing to index beyond title/description. |
| W9.5 | N/A | — | [W9.5] | Not a local business. |
| W10.1 | 3 | H | [W10.1] | Real buttons, sections, headings, labels, range inputs; theme cards and leaderboard rows are click-only divs/li. |
| W10.2 | N/A | — | [W10.2] | WebGL game cannot work without JS; the missing WebGL-failure message is scored under G6.9. |
| W10.3 | 2 | M | [W10.3] | No stated policy; only Chromium exercised (clean console); es2022 + module workers + pointer lock untested on Safari/Firefox. |
| W10.4 | 1 | H | [W10.4] [G11.8] | Zero security headers; deps audited with one moderate finding. |
| W10.5 | 3 | H | [W10.5] | Reproducible, fingerprinted, no public source maps, no inlined env. |
| W10.6 | 3 | H | [W10.6] [WG7] | One third party (Google Fonts, no scripts); page works with it blocked. |
| W10.7 | 3 | M | [W10.7] | 21 kB, tokens, 0 `!important`, consistent naming; coverage not measured. |
| W10.8 | 3 | H | [G11.8] | As G11.8. |
| W.custom-1 | 3 | H | [W.custom-1] [W.custom-1b] | Link opens the picker with the right theme/seed; one-click copy from results and leaderboard; rows replay. Preview does not name the arena (bar 4). |

Category means (excluding N/A and UNVERIFIED): G6 = (2+2+3+3+1+3+3+2)/8 = 2.38 → 47.5; G.custom-2 = 2 → 40; G11 = (2+2+2+3+2+1+2+3)/8 = 2.13 → 42.5; W1 = (1+4+1+1+3+1+0)/7 = 1.57 → 31.4; W9 = (2+0+1)/3 = 1.00 → 20.0; W10 = (3+2+1+3+3+3+3)/7 = 2.57 → 51.4; W.custom-1 = 3 → 60.

| Gate | Result | Evidence | Note |
|---|---|---|---|
| GG1 Stability | PASS | [GG1] | No crash/hang/soft-lock/uncaught error across ≈ 15 min of scripted abuse and play in nine sessions; shorter than the 60-min soak the rubric names, so treat as PASS at confidence M and run the hour on real hardware. |
| GG3 Pause and suspend | PASS | [GG3] [G6.7] | Pausable in play and in the end freeze; clock stops (0 ms over 3 s); focus loss keeps state. Misses: not pausable in the 3 s countdown (wall-clock, continues while hidden); rapid pause/resume can end paused. |
| GG4 Input disconnect | PASS | [GG4] | Pointer-lock loss (the browser's input disconnect) pauses with a PAUSED / RESUME panel; keys cleared on blur. The prompt does not explain why it paused; no gamepad support to test. Real-lock rejection unverifiable headlessly. |
| GG5 Photosensitivity | PASS | [GG5] | Full-screen flash ≤ 2/s at 22 % opacity by the drip design; score-bar/hit flashes are < 25 % of the screen; localized blast sprites can exceed 3/s in a chaining tank cluster but cover > 25 % only at close range. No reduce-flash option. |
| WG3 CWV not Poor | UNVERIFIED | [WG3] [W1.1] [W1.3] | Lab only: CLS 0, LCP unreported headlessly, INP unmeasured. The 5 MB uncompressed bundle makes a "Poor" LCP likely on ordinary connections; needs field data or a Lighthouse run on real hardware. |
| WG4 HTTPS/HSTS | FAIL | [WG4] | What ships is plain HTTP with no HSTS and no documented TLS front; no mixed content. Passes only if a deployer adds TLS + HSTS in front. |
| WG7 Third parties blocked | PASS | [WG7] | With Google Fonts blocked the game boots and the menu works in fallback fonts; one console resource error. |

## Goal question answers

Q9 — No — main-thread p50 stays ~10 ms after a C4 but every blast produced frames of 24–74 ms and a building collapse produced 11 frames over 100 ms (max 433 ms), so the 16.7 ms budget and the SPEC's 8 ms bar are missed (SwiftShader sandbox; PROGRESS.md reports the same ≈ 50 ms) — [G6.2] [G6.2b] [G.custom-2]
Q10 — Yes — across three fast-forwarded rounds and 42 blasts the heap went 98 → 95 → 91 MB with Three.js/Rapier resource counts returning to baseline on each reload (3.5-minute soak) — [G6.4]
Q11 — Partly — pause spam, Esc spam, six resizes, blur/focus/visibility and a real pointer-lock loss all left the game consistent and playable, but rapid pause/resume ends paused because the lock-change event is asynchronous, blur does not auto-pause, and a rejected lock could not be simulated — [G6.7]
Q12 — Partly — pause works in play and in the end freeze with timers frozen (0 ms over 3 s) and with the radial open, but `pause()` is a no-op during the 3 s countdown, which runs on the wall clock even while the tab is hidden — [GG3] [G6.7]
Q14 — Yes — the full-screen milestone flash is capped at 3 loud per burst spaced 0.6 s (≤ 2 per second, 22 % white, 400 ms) and the rest are quiet; only the small score bar flashes at rifle rate; world-space blast sprites can exceed 3/s in a tank cluster but cover > 25 % of the screen only at close range — [GG5]
Q20 — Partly — tunables are centralised and documented in `config/`, but ~195 numeric literals remain in gameplay files outside world-gen, including clear coefficients in Game.ts (0.4, 1.3, 14, /200), effects.ts (0.45, 1.5, g = 12), Debris.ts and Controller.ts — [G11.2]
Q21 — Yes — live against the server: forged token 403, submit before 150 s 403, tampered payload 403, replayed token 403, over-cap/negative/float score 400, bad initials 400, 10/min session rate limit 429 — [W.custom-1b]
Q22 — Ships a single 4,991,539-byte JS chunk (82 % base64 Rapier wasm) plus three small workers and 21 kB CSS, no source maps, served with no compression, no cache headers and no security headers (CSP/HSTS/XCTO/Referrer-Policy/Permissions-Policy all absent); the share link `?arena=downtown-AUDIT` lands on the picker with theme and seed set — [G11.3] [W1.4] [W10.4] [W.custom-1]

## Findings

1. W1.5 / W1.4 / G11.3 · The landing path transfers 5,066 KB of uncompressed JavaScript in one chunk, 4.1 M characters of which is Rapier's wasm inlined as base64, and the server sends no `content-encoding` and no cache headers ([W1.4] [W1.5] [G11.3]) · Bar: ≤ 170 KB compressed JS, brotli/gzip, fingerprinted assets with long max-age · Fix: switch to `@dimforge/rapier3d` (streamed `.wasm` fetch, ~2.9 MB → ~1 MB brotli, compiled off-thread), add `hono/compress` or precompressed `.br/.gz` assets, set `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` and `no-cache` on index.html, and dynamic-import the loadout models/recipes · Impact H · Effort M.
2. G.custom-2 / G6.2 · Every C4 produced main-thread frames of 24–74 ms and a building collapse produced 11 frames over 100 ms (max 433 ms), driven by dirty-chunk remesh uploads, trimesh collider rebuilds and the collapse cut ([G6.2] [G6.2b]) · Bar: no frame > 16.7 ms for 2 s after a blast; p99 ≤ 25 ms · Fix: budget the per-frame work by time rather than by count (remesh uploads, collider builds and debris inserts share a 4 ms slice with carry-over), mark dirty chunks per touched chunk instead of one bounding box for a collapse cut, and move the chunk geometry upload to `transferControlToOffscreen` or split large uploads across frames · Impact H · Effort L.
3. G6.3 / W1.1 · The menu does not appear until the boot arena is fully generated, meshed and shader-warmed, with nothing painted and no progress indicator in between ([G6.3]) · Bar: ≤ 5 s to interactive with a masked/progress load · Fix: render the menu over a static sky immediately, stream the backdrop arena in behind it, and show a thin progress bar fed by `chunks.stats.meshed / total` · Impact H · Effort S.
4. WG4 / W10.4 · The shipped server sets zero security headers (no CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) and documents no TLS front ([W10.4] [WG4]); `@hono/node-server` 1.19.18 has a moderate advisory ([G11.8]) · Bar: OWASP header baseline, HSTS, dependencies current · Fix: add `hono/secure-headers` with a CSP allowing `'self'` plus fonts.googleapis/gstatic (or self-host the fonts and drop the exception), bump `@hono/node-server` ≥ 2.1.3, and document the TLS reverse proxy in README/compose · Impact M · Effort S.
5. G11.5 / W1.9 / G11.7 · No CI: tests never gate a build, the DOM smoke round is not in `pnpm test`, no size budget, version frozen at 0.1.0 with no tags ([G11.5] [W1.9] [G11.7]) · Bar: build fails on failing tests, one smoke play automated, perf budget enforced · Fix: a GitHub Actions workflow running `pnpm typecheck && pnpm test && pnpm build && node scripts/dev/e2e.mjs` plus a `size-limit` check on `client/dist/assets/*.js`; tag releases · Impact M · Effort S.
6. G6.9 / G6.8 · No global error handler or crash reporting, no WebGL-failure message, and with the API down the results screen tells the player "You'd need 0 more for the top 100" ([G6.9] [G6.8]) · Bar: no unhandled exception reaches the player unexplained; errors logged with context; every state designed · Fix: `window.onerror`/`unhandledrejection` → a small "something broke, reload" card plus a `/api/log` beacon; guard `WebGLRenderer` construction with a "WebGL unavailable" message; make `Results` show "OFFLINE · score not saved" when `flow.session` is null · Impact M · Effort S.
