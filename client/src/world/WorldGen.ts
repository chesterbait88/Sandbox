import type { ThemeId } from '@vw/config';
import { World } from './World';
import type { GenRequest, GenResponse } from './gen/gen.worker';

/** Runs world generation in a Worker and builds a World from the result. */
export function generateWorld(theme: ThemeId, seed: string, terrainOnly = false): Promise<{ world: World; height: Int16Array; ms: number }> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./gen/gen.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<GenResponse>) => {
      const r = e.data;
      const world = new World(r.mat, r.owner);
      world.structures = r.structures;
      world.spawn = r.spawn;
      world.spawnYaw = r.spawnYaw;
      w.terminate();
      resolve({ world, height: r.height, ms: r.ms });
    };
    w.onerror = (err) => {
      w.terminate();
      reject(err);
    };
    const req: GenRequest = { type: 'gen', theme, seed, terrainOnly };
    w.postMessage(req);
  });
}
