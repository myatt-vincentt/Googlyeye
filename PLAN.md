# Plan — Googly Eye

A 3D googly eye on each of your eyes; the pupils move like the real toy with your head's motion
and rotation. Built 2026-10-12.

## Decisions (the user's)

- Model: `public/models/googlyeye.glb` (CC BY 4.0, paija on Sketchfab — credited on screen and
  in the README).
- Both eyes; big cartoon size (they nearly touch); loose & bouncy pupils.
- Extras: blink reacts (the eyes squash shut); a "Shake your head!" hint.

## How it works

- **The model**: a white back disc, a clear dome and a black pupil disc (`Cylinder_1`), the dome
  facing +y. Each eye is a clone: turned to face the camera, centred on the eye (model units:
  radius 1, pupil radius 0.434). The dome's glass transmission (an extra full-scene pass per
  frame) is replaced by a light glossy shell; the back is a little self-lit to stay white; a
  glint and a soft drop shadow (`sheen.ts`) make it read as plastic stuck on a face.
- **Placement** (`GooglyEyes.tsx`): `FaceTracker` with `face.leftEye` / `face.rightEye`
  anchors (One Euro smoothing 15, following the head's roll). Each frame each eye is sized to
  0.47 × the distance between the anchors and nudged toward the camera; it takes 80 % of the
  head's pitch and yaw.
- **Pupils** (`pupil.ts`, pure, tested): simulated in the screen plane relative to the eye, in eye
  radii — gravity (34 radii/s², × cos pitch), minus the eye's own acceleration (from its last two
  positions, clipped), air drag; at the rim it's pushed back, the outward speed bounces
  (restitution 0.55) and the rest rubs (0.88). Because it lives in screen space, a tilted head
  leaves it pointing down: converted into the eye's frame by the anchor's roll, it rolls along
  the rim. The result moves the pupil node.
- **Blink**: the SDK's `eyeBlink` action > 0.5 squashes the eyes shut; reopening kicks the pupils.
- **Hint** (`Hud.tsx`): look at the camera → shake your head; gone after the SDK's `headShake`
  gesture (or a dozen hard rattles).
