export const PLAYER = {
  width: 0.6,
  height: 1.8,
  eyeHeight: 1.6,
  walkSpeed: 6,
  sprintSpeed: 9,
  jumpHeight: 1.4,
  gravity: 20,
  stepUp: 0.5,
  /** Horizontal acceleration (m/s²) on the ground and in the air. */
  groundAccel: 60,
  airAccel: 20,
  groundFriction: 12,
  /** Default mouse sensitivity (radians per pixel) and its slider range. */
  sensitivity: 0.0022,
  sensitivityMin: 0.0005,
  sensitivityMax: 0.006,
  /** Clamp pitch to ± this (radians). */
  maxPitch: 1.55,
  /** Radial picker time scale while open. */
  radialTimeScale: 0.3
} as const;
