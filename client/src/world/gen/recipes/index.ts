import type { Recipe } from './types';
import { billboard, diner, gasStation, propaneCage, waterTower } from './desert';
import { busShelter, convenienceStore, officeBlock, parkingStructure } from './downtown';
import { fountain, gazebo, monument, shed, statue } from './park';
import { bench, cactus, car, dumpster, hydrant, lampPost, roadSign, rock, tree } from './props';

export const RECIPES: Record<string, Recipe> = Object.fromEntries(
  [
    gasStation, diner, billboard, waterTower, propaneCage,
    convenienceStore, officeBlock, parkingStructure, busShelter,
    monument, fountain, gazebo, statue, shed,
    cactus, rock, car, roadSign, lampPost, dumpster, hydrant, tree, bench
  ].map((r) => [r.id, r])
);
export type { Recipe } from './types';
