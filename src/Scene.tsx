// Scene.tsx — Googly Eye: a 3D googly eye stuck on each of your eyes, the
// pupils rattling around like the real toy as you move and tilt your head.
// See PLAN.md.
import { lazy, Suspense } from "react";

import { ExperienceStatus } from "./googly/ExperienceStatus";
import { GooglyEyes } from "./googly/GooglyEyes";
import { Hud } from "./googly/Hud";

// Dev-only media switcher for previewing without a camera. Lazy and behind a
// constant esbuild folds to false in production. Two rules:
// `process.env.NODE_ENV`, not `import.meta.env.DEV`
// (vincentt-xr/v2-template#112); and write the check INSIDE the ternary —
// hoisted into a `const`, esbuild keeps the dead branch.
const DevMediaSwitcher =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./DevMediaSwitcher"))
    : null;

export const Scene = () => (
  <>
    <ExperienceStatus />
    {/* The model loads through a suspending loader. */}
    <Suspense fallback={null}>
      <GooglyEyes />
    </Suspense>
    <Hud />
    {DevMediaSwitcher ? (
      <Suspense fallback={null}>
        <DevMediaSwitcher />
      </Suspense>
    ) : null}
  </>
);
