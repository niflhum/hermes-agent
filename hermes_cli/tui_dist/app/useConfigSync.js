import { c as _c } from "react/compiler-runtime";
import { useEffect, useRef } from 'react';
import { resolveDetailsMode, resolveSections } from '../domain/details.js';
import { asRpcResult } from '../lib/rpc.js';
import { DEFAULT_INDICATOR_STYLE, INDICATOR_STYLES } from './interfaces.js';
import { turnController } from './turnController.js';
import { patchUiState } from './uiStore.js';
const STATUSBAR_ALIAS = {
  bottom: 'bottom',
  off: 'off',
  on: 'top',
  top: 'top'
};
export const normalizeStatusBar = raw => raw === false ? 'off' : typeof raw === 'string' ? STATUSBAR_ALIAS[raw.trim().toLowerCase()] ?? 'top' : 'top';
const BUSY_MODES = new Set(['interrupt', 'queue', 'steer']);
// TUI defaults to `queue` even though the framework default
// (`hermes_cli/config.py`) is `interrupt`.  Rationale: in a full-screen
// TUI you're typically authoring the next prompt while the agent is
// still streaming, and an unintended interrupt loses work.  Set
// `display.busy_input_mode: interrupt` (or `steer`) explicitly to
// opt out per-config; CLI / messaging adapters keep their `interrupt`
// default unchanged.
const TUI_BUSY_DEFAULT = 'queue';
export const normalizeBusyInputMode = raw => {
  if (typeof raw !== 'string') {
    return TUI_BUSY_DEFAULT;
  }
  const v = raw.trim().toLowerCase();
  return BUSY_MODES.has(v) ? v : TUI_BUSY_DEFAULT;
};
const INDICATOR_STYLE_SET = new Set(INDICATOR_STYLES);
export const normalizeIndicatorStyle = raw => {
  if (typeof raw !== 'string') {
    return DEFAULT_INDICATOR_STYLE;
  }
  const v = raw.trim().toLowerCase();
  return INDICATOR_STYLE_SET.has(v) ? v : DEFAULT_INDICATOR_STYLE;
};
const FALSEY_MOUSE = new Set(['0', 'false', 'no', 'off']);
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
export const normalizeMouseTracking = display => {
  const raw = hasOwn(display, 'mouse_tracking') ? display.mouse_tracking : display.tui_mouse;
  if (raw === false || raw === 0) {
    return false;
  }
  return typeof raw === 'string' ? !FALSEY_MOUSE.has(raw.trim().toLowerCase()) : true;
};
const MTIME_POLL_MS = 5000;
const quietRpc = async (gw, method, params = {}) => {
  try {
    return asRpcResult(await gw.request(method, params));
  } catch {
    return null;
  }
};
export const applyDisplay = (cfg, setBell) => {
  const d = cfg?.config?.display ?? {};
  setBell(!!d.bell_on_complete);
  patchUiState({
    busyInputMode: normalizeBusyInputMode(d.busy_input_mode),
    compact: !!d.tui_compact,
    detailsMode: resolveDetailsMode(d),
    detailsModeCommandOverride: false,
    indicatorStyle: normalizeIndicatorStyle(d.tui_status_indicator),
    inlineDiffs: d.inline_diffs !== false,
    mouseTracking: normalizeMouseTracking(d),
    sections: resolveSections(d.sections),
    showCost: !!d.show_cost,
    showReasoning: !!d.show_reasoning,
    statusBar: normalizeStatusBar(d.tui_statusbar),
    streaming: d.streaming !== false
  });
};
export function useConfigSync(t0) {
  const $ = _c(11);
  const {
    gw,
    setBellOnComplete,
    setVoiceEnabled,
    sid
  } = t0;
  const mtimeRef = useRef(0);
  let t1;
  let t2;
  if ($[0] !== gw || $[1] !== setBellOnComplete || $[2] !== setVoiceEnabled || $[3] !== sid) {
    t1 = () => {
      if (!sid) {
        return;
      }
      setVoiceEnabled(process.env.HERMES_VOICE === "1");
      quietRpc(gw, "config.get", {
        key: "mtime"
      }).then(r => {
        mtimeRef.current = Number(r?.mtime ?? 0);
      });
      quietRpc(gw, "config.get", {
        key: "full"
      }).then(r_0 => applyDisplay(r_0, setBellOnComplete));
    };
    t2 = [gw, setBellOnComplete, setVoiceEnabled, sid];
    $[0] = gw;
    $[1] = setBellOnComplete;
    $[2] = setVoiceEnabled;
    $[3] = sid;
    $[4] = t1;
    $[5] = t2;
  } else {
    t1 = $[4];
    t2 = $[5];
  }
  useEffect(t1, t2);
  let t3;
  let t4;
  if ($[6] !== gw || $[7] !== setBellOnComplete || $[8] !== sid) {
    t3 = () => {
      if (!sid) {
        return;
      }
      const id = setInterval(() => {
        quietRpc(gw, "config.get", {
          key: "mtime"
        }).then(r_1 => {
          const next = Number(r_1?.mtime ?? 0);
          if (!mtimeRef.current) {
            if (next) {
              mtimeRef.current = next;
            }
            return;
          }
          if (!next || next === mtimeRef.current) {
            return;
          }
          mtimeRef.current = next;
          quietRpc(gw, "reload.mcp", {
            session_id: sid,
            confirm: true
          }).then(_temp);
          quietRpc(gw, "config.get", {
            key: "full"
          }).then(r_3 => applyDisplay(r_3, setBellOnComplete));
        });
      }, MTIME_POLL_MS);
      return () => clearInterval(id);
    };
    t4 = [gw, setBellOnComplete, sid];
    $[6] = gw;
    $[7] = setBellOnComplete;
    $[8] = sid;
    $[9] = t3;
    $[10] = t4;
  } else {
    t3 = $[9];
    t4 = $[10];
  }
  useEffect(t3, t4);
}
function _temp(r_2) {
  return r_2 && turnController.pushActivity("MCP reloaded after config change");
}