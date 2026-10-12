// Every tunable in one place.

/** The model (CC-BY-4.0, paija on Sketchfab — credited in the HUD and README). */
export const MODEL = {
  url: "/models/googlyeye.glb",
  /** The node that is the black pupil disc, and the eye's centre and radius in model units. */
  pupilNode: "Cylinder_1",
  /** The white back's material name. */
  backMaterial: "Material.002",
  centre: { x: 0.039, z: 0.011 },
  radius: 1,
  /** The pupil disc's radius (model units): it can travel the rest, less a hair. */
  pupilRadius: 0.434,
  margin: 0.04,
  credit: "Googly eye model by paija (Sketchfab), CC BY 4.0",
};

/**
 * Size: each eye's radius as a share of the distance between your eyes —
 * just under half, so the two big cartoon eyes nearly touch. Pushed this far
 * toward the camera (share of that distance) so they sit on the face.
 */
export const EYE = { radius: 0.47, forward: 0.12, smoothing: 15 };

/**
 * The pupil: a loose weight inside the rim (units: eye radii, seconds).
 * Gravity pulls it down the screen, head motion shoves it the other way, it
 * bounces off the rim (restitution) and slides (friction per bounce), with a
 * little air drag. Loose & bouncy: it drops fast and rattles before settling.
 */
export const PUPIL = {
  gravity: 34,
  /** How strongly the head's acceleration shoves it (1 = physically). */
  inertia: 1,
  /** Head accelerations beyond this (radii/s²) are clipped (tracking jumps). */
  maxShove: 900,
  drag: 0.6,
  restitution: 0.55,
  friction: 0.88,
  /** A bounce harder than this (radii/s) counts as a rattle (for the shake hint). */
  rattle: 6,
};

/** Following the head's turn: how much of its pitch / yaw the eyes take. */
export const TURN = { pitch: 0.8, yaw: 0.8 };

/** Blink: closed above this (the SDK's eyeBlink value), squashed this far, this fast (per second). */
export const BLINK = { on: 0.5, squash: 0.88, speed: 26, kick: 3 };

/**
 * The glossy look: glints sit at the dome's top (eye units, +z toward the
 * camera), and a soft shadow (this dark) falls on the face, offset down-right.
 */
export const SHEEN = {
  domeTop: 0.3,
  shadow: 0.38,
  shadowOffset: { x: 0.08, y: -0.12 },
};
