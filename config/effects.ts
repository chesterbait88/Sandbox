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
  /** Continuous collision detection per piece (expensive; pieces move < 0.3 m per step). */
  ccd: false,
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

/** Menu music loop: tempo and chord cycle (Hz). */
export const MUSIC = {
  bpm: 112,
  gain: 0.35,
  chords: [
    [110, 164.81, 220, 261.63],
    [87.31, 130.81, 174.61, 220],
    [98, 146.83, 196, 246.94],
    [82.41, 123.47, 164.81, 207.65]
  ]
} as const;

export const PHYSICS = {
  /** Fixed step (s) and the most steps taken in one frame before time is dropped. */
  step: 1 / 60,
  maxSubSteps: 2
} as const;
