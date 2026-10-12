// The finishing touches that make the eyes read as glossy plastic stuck on a
// face: a soft white glint on the dome (and a little one opposite), and a
// soft drop shadow on the face behind. Flat planes with gradient textures,
// in eye units (radius 1, +z toward the camera).
import {
  AdditiveBlending,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";

import { SHEEN } from "./config";

const radial = (stops: [number, string][]) => {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

let shared: {
  plane: PlaneGeometry;
  glint: MeshBasicMaterial;
  shadow: MeshBasicMaterial;
} | null = null;

const materials = () => {
  if (!shared)
    shared = {
      plane: new PlaneGeometry(1, 1),
      glint: new MeshBasicMaterial({
        map: radial([
          [0, "rgba(255,255,255,0.95)"],
          [0.45, "rgba(255,255,255,0.55)"],
          [1, "rgba(255,255,255,0)"],
        ]),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
      shadow: new MeshBasicMaterial({
        map: radial([
          [0, `rgba(0,0,0,${SHEEN.shadow})`],
          [0.62, `rgba(0,0,0,${SHEEN.shadow * 0.8})`],
          [1, "rgba(0,0,0,0)"],
        ]),
        transparent: true,
        depthWrite: false,
      }),
    };
  return shared;
};

/** The glints and the shadow for one eye, as a group to add in eye units. */
export const makeSheen = () => {
  const m = materials();
  const group = new Group();
  const glint = new Mesh(m.plane, m.glint);
  glint.position.set(-0.38, 0.42, SHEEN.domeTop);
  glint.rotation.z = 0.75;
  glint.scale.set(0.62, 0.34, 1);
  glint.renderOrder = 3;
  const small = new Mesh(m.plane, m.glint);
  small.position.set(0.44, -0.4, SHEEN.domeTop);
  small.scale.set(0.16, 0.16, 1);
  small.renderOrder = 3;
  const shadow = new Mesh(m.plane, m.shadow);
  shadow.position.set(SHEEN.shadowOffset.x, SHEEN.shadowOffset.y, -0.12);
  shadow.scale.set(2.5, 2.5, 1);
  shadow.renderOrder = -1;
  group.add(shadow, glint, small);
  return group;
};
