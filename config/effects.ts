export const DEBRIS = {
  /** Max voxels turned into debris per blast. */
  perBlast: 24,
  /** Global live cap. */
  cap: 300,
  sizeM: 0.5,
  lifetimeS: 4,
  shrinkS: 0.5,
  impulseScale: 0.3,
  impulseJitter: 0.2,
  spinMax: 6,
  /** Glass spawns this many more, smaller pieces. */
  glassCountMul: 2,
  glassSizeMul: 0.5
} as const;

export const EFFECTS = {
  shakeScale: 0.12,
  shakeMax: 0.6,
  shakeDecay: 6,
  flashMs: 90,
  particles: 30,
  particleLifeS: 0.7,
  particleSpeed: 9,
  particleSize: 0.25,
  hitMarkerMs: 120,
  /** Secondary 'tink' particle count for glass. */
  glassParticles: 12
} as const;

export const AUDIO = {
  masterVolume: 0.7,
  /** Distance at which sound is half as loud (m). */
  halfDistanceM: 18,
  /** Low-pass cutoff range by distance (Hz). */
  lowpassNearHz: 8000,
  lowpassFarHz: 600
} as const;
