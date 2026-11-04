import * as THREE from 'three';
import { RENDER, THEMES, type ThemeId, THEME_IDS } from '@vw/config';
import './ui/styles.css';
import { GameRenderer } from './render/Renderer';
import { ChunkRenderer } from './world/ChunkRenderer';
import { World } from './world/World';
import { generateWorld } from './world/WorldGen';
import { Controller } from './player/Controller';
import { Input } from './player/Input';
import { DebugOverlay } from './debug/DebugOverlay';

declare global {
  interface Window {
    __vwReady?: boolean;
    __vw?: Record<string, unknown>;
  }
}

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui')!;
const gfx = new GameRenderer(canvas);
const input = new Input(canvas);
const debug = new DebugOverlay(ui);
let world = new World();
const chunks = new ChunkRenderer(world);
gfx.scene.add(chunks.group);
const player = new Controller(world, gfx.camera);

const theme = (THEME_IDS.includes(params.get('theme') as ThemeId) ? params.get('theme') : 'desert') as ThemeId;
const seed = params.get('seed') ?? 'ALPHA';
gfx.setTheme(theme);

const hint = document.createElement('div');
hint.className = 'phase0';
hint.textContent = `Voxel Wreck — phase 1 · ${THEMES[theme].name} · seed ${seed} · click to play, F3 debug`;
ui.appendChild(hint);

const t0 = performance.now();
generateWorld(theme, seed).then(({ world: w, ms }) => {
  world = w;
  chunks.setWorld(w);
  player.setWorld(w);
  player.spawn(w.spawn, w.spawnYaw);
  chunks.perFrame = RENDER.remeshBurst;
  console.log(`world generated in ${ms.toFixed(0)} ms (worker), ${(performance.now() - t0).toFixed(0)} ms total`);
});

canvas.addEventListener('click', () => input.requestLock());

let last = performance.now();
let readyFrames = 0;
gfx.renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dtMs = now - last;
  last = now;
  const dt = Math.min(dtMs / 1000, 0.05);

  player.look(input);
  player.update(dt, input);
  chunks.update(gfx.camera.position);
  if (chunks.idle && chunks.perFrame !== RENDER.remeshPerFrame) {
    chunks.perFrame = RENDER.remeshPerFrame;
  }
  if (!window.__vwReady && chunks.stats.meshed > 0 && chunks.idle && ++readyFrames > 5) window.__vwReady = true;

  gfx.render();
  debug.frame(dtMs);
  debug.set(
    `pos ${player.position.x.toFixed(1)} ${player.position.y.toFixed(1)} ${player.position.z.toFixed(1)} ground ${player.onGround}\n` +
      `chunks meshed ${chunks.stats.meshed} · dirty ${chunks.stats.dirty} · inflight ${chunks.stats.inFlight} · last ${chunks.stats.lastMs.toFixed(2)} ms · avg ${chunks.stats.avgMs.toFixed(2)} ms\n` +
      `draw calls ${gfx.renderer.info.render.calls} · tris ${gfx.renderer.info.render.triangles}`
  );
  input.endFrame();
});

window.__vw = { get world() { return world; }, chunks, player, gfx };
