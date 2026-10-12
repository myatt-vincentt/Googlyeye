import { describe, expect, it } from "vitest";

import { createPupil, local, stepPupil } from "./pupil";

const TRAVEL = 0.53;
const still = { eye: { x: 0, y: 0 }, radius: 0.05, travel: TRAVEL };

const run = (
  p: ReturnType<typeof createPupil>,
  seconds: number,
  input: (t: number) => Parameters<typeof stepPupil>[1] = () => still,
) => {
  let hits = 0;
  for (let t = 0; t < seconds; t += 1 / 60)
    if (stepPupil(p, input(t), 1 / 60) > 0) hits++;
  return hits;
};

describe("googly pupil", () => {
  it("drops to the bottom of the eye and settles there", () => {
    const p = createPupil();
    p.pos = { x: 0, y: TRAVEL };
    run(p, 3);
    expect(p.pos.y).toBeCloseTo(-TRAVEL, 2);
    expect(Math.abs(p.pos.x)).toBeLessThan(0.02);
    expect(Math.hypot(p.vel.x, p.vel.y)).toBeLessThan(0.3);
  });

  it("bounces when it lands (loose and bouncy), never leaving the rim", () => {
    const p = createPupil();
    p.pos = { x: 0, y: TRAVEL };
    let maxD = 0;
    let rose = false;
    let prevVy = 0;
    for (let t = 0; t < 2; t += 1 / 60) {
      stepPupil(p, still, 1 / 60);
      maxD = Math.max(maxD, Math.hypot(p.pos.x, p.pos.y));
      if (prevVy < 0 && p.vel.y > 0.5) rose = true;
      prevVy = p.vel.y;
    }
    expect(rose).toBe(true);
    expect(maxD).toBeLessThanOrEqual(TRAVEL + 1e-9);
  });

  it("tilt your head: it stays down on screen, so in the eye it rolls along the rim", () => {
    const p = createPupil();
    run(p, 3);
    // Head tilted 90° (the eye turned a quarter): in the eye's own frame the
    // pupil is now at the side, not the eye's bottom.
    const l = local(p, Math.PI / 2);
    expect(l.x).toBeCloseTo(-TRAVEL, 2);
    expect(Math.abs(l.y)).toBeLessThan(0.02);
  });

  it("move your head: it lags behind, then sloshes back", () => {
    const p = createPupil();
    run(p, 2);
    // A quick shove of the head to the right.
    let minX = 0;
    for (let t = 0; t < 0.25; t += 1 / 60) {
      const x = 0.4 * Math.min(1, t / 0.15) ** 2;
      stepPupil(p, { ...still, eye: { x, y: 0 } }, 1 / 60);
      minX = Math.min(minX, p.pos.x);
    }
    expect(minX).toBeLessThan(-0.1);
  });

  it("a hard head shake rattles it off the rim", () => {
    const p = createPupil();
    run(p, 2);
    const hits = run(p, 1.5, (t) => ({
      ...still,
      eye: { x: 0.05 * Math.sin(t * 2 * Math.PI * 3), y: 0 },
    }));
    expect(hits).toBeGreaterThan(4);
  });
});
