import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// FPS counter overlay (HERMES_TUI_FPS=1). Zero-cost when disabled.
import { Text } from '@hermes/ink';
import { useStore } from '@nanostores/react';
import { SHOW_FPS } from '../config/env.js';
import { $fpsState } from '../lib/fpsStore.js';
const fpsColor = (fps, t) => fps >= 50 ? t.color.statusGood : fps >= 30 ? t.color.statusWarn : t.color.error;
export function FpsOverlay({
  t
}) {
  if (!SHOW_FPS) {
    return null;
  }
  return _jsx(FpsOverlayInner, {
    t: t
  });
}
function FpsOverlayInner(t0) {
  const $ = _c(5);
  const {
    t
  } = t0;
  const {
    fps,
    lastDurationMs,
    totalFrames
  } = useStore($fpsState);
  let t1;
  if ($[0] !== fps || $[1] !== lastDurationMs || $[2] !== t || $[3] !== totalFrames) {
    t1 = _jsxs(Text, {
      color: fpsColor(fps, t),
      children: [fps.toFixed(1).padStart(5), "fps \xB7 ", lastDurationMs.toFixed(1).padStart(5), "ms \xB7 #", totalFrames]
    });
    $[0] = fps;
    $[1] = lastDurationMs;
    $[2] = t;
    $[3] = totalFrames;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}