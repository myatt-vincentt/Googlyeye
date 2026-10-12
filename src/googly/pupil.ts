// A googly-eye pupil — pure, unit-tested (pupil.test.ts).
//
// The pupil is a loose weight inside the eye's rim. It's simulated in the
// screen plane (world x right, y up), relative to the eye's centre, in eye
// radii: gravity pulls it down, the eye's own acceleration shoves it the other
// way (it lags and sloshes when you move your head), it bounces off the rim
// and slides along it. Because it lives in screen space, turning the eye
// (tilting your head) doesn't drag it round: it stays down and rolls along the
// rim, just like the toy. `local` turns it into the eye's own frame.
import { PUPIL } from "./config";

export type V2 = { x: number; y: number };

export type Pupil = {
  /** Offset from the eye's centre (eye radii, screen axes) and velocity. */
  pos: V2;
  vel: V2;
  /** The eye centre's last position and velocity (world units), for its acceleration. */
  lastEye: V2 | null;
  lastEyeVel: V2 | null;
};

export const createPupil = (): Pupil => ({
  pos: { x: 0, y: -0.4 },
  vel: { x: 0, y: 0 },
  lastEye: null,
  lastEyeVel: null,
});

export type PupilInput = {
  /** The eye's centre (world units) and radius (world units). */
  eye: V2;
  radius: number;
  /** How far the pupil may travel from the centre (eye radii). */
  travel: number;
  /** How much of gravity lies in the eye's plane (1 facing the camera; less tilted back). */
  gravityShare?: number;
};

/** Advance one frame. Returns the speed of a rim hit this frame (eye radii/s), or 0. */
export const stepPupil = (p: Pupil, input: PupilInput, dt: number): number => {
  if (dt <= 0) return 0;
  const r = Math.max(1e-6, input.radius);
  // The eye's acceleration, in eye radii / s², from its last two positions.
  let shove = { x: 0, y: 0 };
  if (p.lastEye) {
    const v = {
      x: (input.eye.x - p.lastEye.x) / r / dt,
      y: (input.eye.y - p.lastEye.y) / r / dt,
    };
    if (p.lastEyeVel) {
      const ax = (v.x - p.lastEyeVel.x) / dt;
      const ay = (v.y - p.lastEyeVel.y) / dt;
      const a = Math.hypot(ax, ay);
      const k = a > PUPIL.maxShove ? PUPIL.maxShove / a : 1;
      shove = { x: -ax * k * PUPIL.inertia, y: -ay * k * PUPIL.inertia };
    }
    p.lastEyeVel = v;
  }
  p.lastEye = { ...input.eye };
  const g = PUPIL.gravity * (input.gravityShare ?? 1);
  const drag = Math.exp(-PUPIL.drag * dt);
  p.vel.x = (p.vel.x + shove.x * dt) * drag;
  p.vel.y = (p.vel.y + (shove.y - g) * dt) * drag;
  p.pos.x += p.vel.x * dt;
  p.pos.y += p.vel.y * dt;
  // The rim: push back inside, bounce the outward part, rub the rest.
  const d = Math.hypot(p.pos.x, p.pos.y);
  if (d > input.travel) {
    const n = { x: p.pos.x / d, y: p.pos.y / d };
    p.pos.x = n.x * input.travel;
    p.pos.y = n.y * input.travel;
    const out = p.vel.x * n.x + p.vel.y * n.y;
    if (out > 0) {
      const tx = p.vel.x - out * n.x;
      const ty = p.vel.y - out * n.y;
      p.vel.x = tx * PUPIL.friction - out * PUPIL.restitution * n.x;
      p.vel.y = ty * PUPIL.friction - out * PUPIL.restitution * n.y;
      return out;
    }
  }
  return 0;
};

/** The pupil in the eye's own frame (x right, y up), for an eye turned `roll` radians. */
export const local = (p: Pupil, roll: number): V2 => {
  const c = Math.cos(-roll);
  const s = Math.sin(-roll);
  return { x: p.pos.x * c - p.pos.y * s, y: p.pos.x * s + p.pos.y * c };
};

/** Knock the pupil (a blink, say): a random push this hard (eye radii / s). */
export const kick = (p: Pupil, speed: number, random: () => number) => {
  const a = random() * Math.PI * 2;
  p.vel.x += Math.cos(a) * speed;
  p.vel.y += Math.sin(a) * speed;
};
