// Googly eyes: the 3D googly eye (public/models/googlyeye.glb) on each of your
// eyes, big and cartoonish, turning with your head; each pupil a loose weight
// that drops, lags, sloshes and rattles like the real toy (pupil.ts).
//
// Per eye, inside a FaceTracker's eye anchor (which follows the eye and the
// head's roll):
//   root    sized every frame from the distance between your eyes, nudged
//           toward the camera
//   tilt    the head's pitch and yaw
//   squash  a cartoon blink (squashes shut while you blink); holds the
//           glints and the drop shadow (sheen.ts)
//   orient  the model turned to face the camera (its dome faces +y)
//   centred the model moved so the eye's centre is the origin
// The pupil node (MODEL.pupilNode) is moved inside the eye each frame.
import { useEffect, useMemo } from "react";
import {
  Group,
  type Material,
  type Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Object3D,
  Quaternion,
  Vector3,
} from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  FaceTracker,
  getFaceActionValue,
  TrackingAnchor,
  useFaceInfo,
  useGesture,
} from "@vincentt-xr/sdk/tracking";

import { BLINK, EYE, MODEL, PUPIL, TURN } from "./config";
import { createPupil, kick, local, type Pupil, stepPupil } from "./pupil";
import { makeSheen } from "./sheen";
import { googlyState } from "./state";

type EyeRig = {
  root: Group;
  tilt: Group;
  squash: Group;
  pupilNode: Object3D | null;
  pupilY: number;
  pupil: Pupil;
};

/**
 * The model's clear dome uses glass transmission (an extra render pass of the
 * whole scene per frame); a light, glossy see-through shell looks the same on
 * a toy this size and costs nothing.
 */
const dome = new MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.2,
  roughness: 0.06,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
  depthWrite: false,
});

/** The eye's white back, a little self-lit so it stays white. */
const back = new MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0x5a5a5a,
  roughness: 0.55,
  metalness: 0,
});

const makeEye = (scene: Object3D): EyeRig => {
  const model = scene.clone(true);
  model.traverse((o) => {
    const mesh = o as Mesh;
    const mat = mesh.material as
      | (Material & { transmission?: number })
      | undefined;
    if (mesh.isMesh && mat && (mat.transmission ?? 0) > 0) {
      mesh.material = dome;
      mesh.renderOrder = 2;
    } else if (mesh.isMesh && mat && mat.name === MODEL.backMaterial) {
      // The white back reads grey under the scene's light: lift it to toy white.
      mesh.material = back;
    }
  });
  const centred = new Group();
  centred.position.set(-MODEL.centre.x, 0, -MODEL.centre.z);
  centred.add(model);
  const orient = new Group();
  orient.rotation.x = Math.PI / 2;
  orient.add(centred);
  const squash = new Group();
  squash.add(orient, makeSheen());
  const tilt = new Group();
  tilt.add(squash);
  const root = new Group();
  root.add(tilt);
  const pupilNode = model.getObjectByName(MODEL.pupilNode) ?? null;
  return {
    root,
    tilt,
    squash,
    pupilNode,
    pupilY: pupilNode?.position.y ?? 0,
    pupil: createPupil(),
  };
};

const TRAVEL = (MODEL.radius - MODEL.pupilRadius - MODEL.margin) / MODEL.radius;

const v = new Vector3();
const w = new Vector3();
const q = new Quaternion();
const xAxis = new Vector3();

const Eyes = () => {
  const { scene } = useGLTF(MODEL.url);
  const eyes = useMemo(() => [makeEye(scene), makeEye(scene)], [scene]);
  const face = useFaceInfo({ active: true });
  const live = useMemo(() => ({ blink: 0, wasClosed: false }), []);

  useGesture("headShake", {
    onBegin: () => {
      googlyState.shaken = true;
    },
  });

  // Dev hook for inspecting the eyes live.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __googly?: unknown }).__googly = {
        state: googlyState,
        eyes,
        live,
      };
    }
  }, [eyes, live]);

  useFrame((_state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    googlyState.face = !!face;
    const [left, right] = eyes;
    for (const e of eyes) e.root.visible = !!face;
    if (!face) return;

    // Size from the distance between the eyes.
    left.root.parent?.getWorldPosition(v);
    right.root.parent?.getWorldPosition(w);
    const between = v.distanceTo(w);
    if (between <= 1e-6) return;
    const radius = EYE.radius * between;

    // Blink: squash shut, and knock the pupils as the eyes open again.
    const closed = getFaceActionValue(face, "eyeBlink") > BLINK.on;
    live.blink +=
      ((closed ? 1 : 0) - live.blink) * (1 - Math.exp(-BLINK.speed * dt));
    if (live.wasClosed && !closed)
      for (const e of eyes) kick(e.pupil, BLINK.kick, Math.random);
    live.wasClosed = closed;

    const { x: pitch, y: yaw } = face.pose.rotation;
    for (const e of eyes) {
      const anchor = e.root.parent;
      if (!anchor) continue;
      const parentScale = anchor.getWorldScale(v).x || 1;
      e.root.scale.setScalar(radius / MODEL.radius / parentScale);
      e.root.position.set(0, 0, (EYE.forward * between) / parentScale);
      e.tilt.rotation.set(-pitch * TURN.pitch, yaw * TURN.yaw, 0);
      e.squash.scale.set(1, 1 - BLINK.squash * live.blink, 1);

      // The eye's roll on screen (the anchor follows the head's tilt).
      anchor.getWorldQuaternion(q);
      xAxis.set(1, 0, 0).applyQuaternion(q);
      const roll = Math.atan2(xAxis.y, xAxis.x);
      anchor.getWorldPosition(w);
      const hit = stepPupil(
        e.pupil,
        {
          eye: { x: w.x, y: w.y },
          radius,
          travel: TRAVEL,
          gravityShare: Math.cos(pitch),
        },
        dt,
      );
      if (hit > PUPIL.rattle) googlyState.rattles++;
      const l = local(e.pupil, roll);
      if (e.pupilNode)
        e.pupilNode.position.set(
          MODEL.centre.x + l.x * MODEL.radius,
          e.pupilY,
          MODEL.centre.z - l.y * MODEL.radius,
        );
    }
  });

  return (
    <FaceTracker>
      <TrackingAnchor target="face.leftEye" smoothing={EYE.smoothing}>
        <primitive object={eyes[0].root} />
      </TrackingAnchor>
      <TrackingAnchor target="face.rightEye" smoothing={EYE.smoothing}>
        <primitive object={eyes[1].root} />
      </TrackingAnchor>
    </FaceTracker>
  );
};

useGLTF.preload(MODEL.url);

export const GooglyEyes = Eyes;
