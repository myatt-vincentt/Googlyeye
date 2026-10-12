// Shared live state: the eyes write it, the HUD reads it. Plain mutable
// fields (no React state).
export const googlyState = {
  /** A face is in view; the head has been shaken; hard rim hits so far. */
  face: false,
  shaken: false,
  rattles: 0,
};
