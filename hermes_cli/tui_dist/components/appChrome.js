import { c as _c } from "react/compiler-runtime";
import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text } from '@hermes/ink';
import { useStore } from '@nanostores/react';
import { useEffect, useMemo, useState } from 'react';
import unicodeSpinners from 'unicode-animations';
import { $delegationState } from '../app/delegationStore.js';
import { useTurnSelector } from '../app/turnStore.js';
import { $uiState } from '../app/uiStore.js';
import { FACES } from '../content/faces.js';
import { VERBS } from '../content/verbs.js';
import { fmtDuration } from '../domain/messages.js';
import { stickyPromptFromViewport } from '../domain/viewport.js';
import { buildSubagentTree, treeTotals, widthByDepth } from '../lib/subagentTree.js';
import { fmtK } from '../lib/text.js';
import { useViewportSnapshot } from '../lib/viewportStore.js';
const FACE_TICK_MS = 2500;
const HEART_COLORS = ['#ff5fa2', '#ff4d6d'];
// Compact alternates for the `emoji` and `ascii` indicator styles.
// Each entry is a fixed-width (display-width) glyph.
const EMOJI_FRAMES = ['⚕ ', '🌀', '🤔', '✨', '🍵', '🔮'];
const ASCII_FRAMES = ['|', '/', '-', '\\'];
// Faster tick for spinner-style indicators — they read as motion only
// at frame rates closer to their authored interval.
const SPINNER_TICK_MS = 100;
const renderIndicator = (style, tick) => {
  if (style === 'kaomoji') {
    return {
      frame: FACES[tick % FACES.length] ?? '',
      intervalMs: FACE_TICK_MS,
      showVerb: true
    };
  }
  if (style === 'emoji') {
    return {
      frame: EMOJI_FRAMES[tick % EMOJI_FRAMES.length] ?? '⚕ ',
      intervalMs: SPINNER_TICK_MS * 6,
      showVerb: true
    };
  }
  if (style === 'ascii') {
    return {
      frame: ASCII_FRAMES[tick % ASCII_FRAMES.length] ?? '|',
      intervalMs: SPINNER_TICK_MS,
      showVerb: true
    };
  }
  // 'unicode' — braille spinner (fixed 1-col).  Authored interval is
  // ~80ms; honour it but bound below at a safe minimum so React
  // re-renders stay reasonable.  This style is for users who want
  // the cleanest possible status, so no verb rotation either.
  const spinner = unicodeSpinners.braille;
  const frame = spinner.frames[tick % spinner.frames.length] ?? '⠋';
  return {
    frame,
    intervalMs: Math.max(SPINNER_TICK_MS, spinner.interval),
    showVerb: false
  };
};
function FaceTicker(t0) {
  const $ = _c(17);
  const {
    color,
    startedAt
  } = t0;
  const ui = useStore($uiState);
  const style = ui.indicatorStyle;
  const [tick, setTick] = useState(_temp);
  const [verbTick, setVerbTick] = useState(_temp2);
  const [now, setNow] = useState(_temp3);
  let t1;
  if ($[0] !== style) {
    t1 = renderIndicator(style, 0);
    $[0] = style;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const {
    intervalMs,
    showVerb
  } = t1;
  let t2;
  let t3;
  if ($[2] !== intervalMs || $[3] !== showVerb) {
    t2 = () => {
      const glyph = setInterval(() => setTick(_temp4), intervalMs);
      const clock = setInterval(() => setNow(Date.now()), 1000);
      const verb = showVerb ? setInterval(() => setVerbTick(_temp5), FACE_TICK_MS) : null;
      return () => {
        clearInterval(glyph);
        clearInterval(clock);
        if (verb !== null) {
          clearInterval(verb);
        }
      };
    };
    t3 = [intervalMs, showVerb];
    $[2] = intervalMs;
    $[3] = showVerb;
    $[4] = t2;
    $[5] = t3;
  } else {
    t2 = $[4];
    t3 = $[5];
  }
  useEffect(t2, t3);
  let t4;
  if ($[6] !== color || $[7] !== now || $[8] !== showVerb || $[9] !== startedAt || $[10] !== style || $[11] !== tick || $[12] !== verbTick) {
    const {
      frame
    } = renderIndicator(style, tick);
    const verb_0 = VERBS[verbTick % VERBS.length] ?? "";
    const verbSegment = showVerb ? ` ${verb_0}…` : "";
    let t5;
    if ($[14] !== now || $[15] !== startedAt) {
      t5 = startedAt ? ` · ${fmtDuration(now - startedAt)}` : "";
      $[14] = now;
      $[15] = startedAt;
      $[16] = t5;
    } else {
      t5 = $[16];
    }
    const durationSegment = t5;
    t4 = _jsxs(Text, {
      color,
      children: [frame, verbSegment, durationSegment]
    });
    $[6] = color;
    $[7] = now;
    $[8] = showVerb;
    $[9] = startedAt;
    $[10] = style;
    $[11] = tick;
    $[12] = verbTick;
    $[13] = t4;
  } else {
    t4 = $[13];
  }
  return t4;
}
function _temp5(n_0) {
  return n_0 + 1;
}
function _temp4(n) {
  return n + 1;
}
function _temp3() {
  return Date.now();
}
function _temp2() {
  return Math.floor(Math.random() * VERBS.length);
}
function _temp() {
  return Math.floor(Math.random() * 1000);
}
function ctxBarColor(pct, t) {
  if (pct == null) {
    return t.color.muted;
  }
  if (pct >= 95) {
    return t.color.statusCritical;
  }
  if (pct > 80) {
    return t.color.statusBad;
  }
  if (pct >= 50) {
    return t.color.statusWarn;
  }
  return t.color.statusGood;
}
function ctxBar(pct, w = 10) {
  const p = Math.max(0, Math.min(100, pct ?? 0));
  const filled = Math.round(p / 100 * w);
  return '█'.repeat(filled) + '░'.repeat(w - filled);
}
function SpawnHud(t0) {
  const $ = _c(18);
  const {
    t
  } = t0;
  const delegation = useStore($delegationState);
  const subagents = useTurnSelector(_temp6);
  let t1;
  if ($[0] !== subagents) {
    t1 = buildSubagentTree(subagents);
    $[0] = subagents;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const tree = t1;
  let t2;
  if ($[2] !== tree) {
    t2 = treeTotals(tree);
    $[2] = tree;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const totals = t2;
  if (!totals.descendantCount && !delegation.paused) {
    return null;
  }
  const maxDepth = delegation.maxSpawnDepth;
  const maxConc = delegation.maxConcurrentChildren;
  const depth = Math.max(0, totals.maxDepthFromHere);
  const active = totals.activeCount;
  let t3;
  if ($[4] !== tree) {
    t3 = widthByDepth(tree).reduce(_temp7, 0);
    $[4] = tree;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const widestLevel = t3;
  const depthRatio = maxDepth ? depth / maxDepth : 0;
  const concRatio = maxConc ? widestLevel / maxConc : 0;
  const ratio = Math.max(depthRatio, concRatio);
  const color = delegation.paused || ratio >= 1 ? t.color.error : ratio >= 0.66 ? t.color.warn : t.color.muted;
  let pieces;
  if ($[6] !== active || $[7] !== delegation.paused || $[8] !== depth || $[9] !== maxConc || $[10] !== maxDepth || $[11] !== totals.descendantCount || $[12] !== widestLevel) {
    pieces = [];
    if (delegation.paused) {
      pieces.push("\u23F8 paused");
    }
    if (totals.descendantCount > 0) {
      const depthLabel = maxDepth ? `${depth}/${maxDepth}` : `${depth}`;
      pieces.push(`d${depthLabel}`);
      if (active > 0) {
        const extra = Math.max(0, active - widestLevel);
        const widthLabel = maxConc ? `${widestLevel}/${maxConc}` : `${widestLevel}`;
        const suffix = extra > 0 ? `+${extra}` : "";
        pieces.push(`⚡${widthLabel}${suffix}`);
      }
    }
    $[6] = active;
    $[7] = delegation.paused;
    $[8] = depth;
    $[9] = maxConc;
    $[10] = maxDepth;
    $[11] = totals.descendantCount;
    $[12] = widestLevel;
    $[13] = pieces;
  } else {
    pieces = $[13];
  }
  const atCap = depthRatio >= 1 || concRatio >= 1;
  const t4 = atCap ? " \u2502 \u26A0 " : " \u2502 ";
  const t5 = pieces.join(" ");
  let t6;
  if ($[14] !== color || $[15] !== t4 || $[16] !== t5) {
    t6 = _jsxs(Text, {
      color,
      children: [t4, t5]
    });
    $[14] = color;
    $[15] = t4;
    $[16] = t5;
    $[17] = t6;
  } else {
    t6 = $[17];
  }
  return t6;
}
function _temp7(a, b) {
  return Math.max(a, b);
}
function _temp6(state) {
  return state.subagents;
}
function SessionDuration(t0) {
  const $ = _c(5);
  const {
    startedAt
  } = t0;
  const [now, setNow] = useState(_temp8);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      setNow(Date.now());
      const id = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(id);
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let t2;
  if ($[1] !== startedAt) {
    t2 = [startedAt];
    $[1] = startedAt;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  useEffect(t1, t2);
  const t3 = now - startedAt;
  let t4;
  if ($[3] !== t3) {
    t4 = fmtDuration(t3);
    $[3] = t3;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  return t4;
}
function _temp8() {
  return Date.now();
}
const effortLabel = effort => {
  const value = String(effort ?? '').trim().toLowerCase();
  return value && value !== 'medium' && value !== 'normal' && value !== 'default' ? value : '';
};
const shortModelLabel = model => model.split('/').pop().replace(/^claude[-_]/, '').replace(/^anthropic[-_]/, '').replace(/[-_]/g, ' ').replace(/\b(\d+)\s+(\d+)\b/g, '$1.$2').trim();
const modelLabel = (model, effort, fast) => [shortModelLabel(model), effortLabel(effort), fast ? 'fast' : ''].filter(Boolean).join(' ');
export function GoodVibesHeart(t0) {
  const $ = _c(10);
  const {
    tick,
    t
  } = t0;
  const [active, setActive] = useState(false);
  const [color, setColor] = useState(t.color.accent);
  let t1;
  if ($[0] !== t.color.accent || $[1] !== t.color.error || $[2] !== t.color.warn || $[3] !== tick) {
    t1 = () => {
      if (tick <= 0) {
        return;
      }
      const palette = [t.color.error, t.color.warn, t.color.accent];
      setColor(palette[Math.floor(Math.random() * palette.length)]);
      setActive(true);
      const id = setTimeout(() => setActive(false), 650);
      return () => clearTimeout(id);
    };
    $[0] = t.color.accent;
    $[1] = t.color.error;
    $[2] = t.color.warn;
    $[3] = tick;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  let t2;
  if ($[5] !== t.color.accent || $[6] !== tick) {
    t2 = [t.color.accent, tick];
    $[5] = t.color.accent;
    $[6] = tick;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  useEffect(t1, t2);
  if (!active) {
    return null;
  }
  let t3;
  if ($[8] !== color) {
    t3 = _jsx(Text, {
      color,
      children: "\u2665"
    });
    $[8] = color;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  return t3;
}
export function StatusRule({
  cwdLabel,
  cols,
  busy,
  status,
  statusColor,
  model,
  modelFast,
  modelReasoningEffort,
  usage,
  bgCount,
  sessionStartedAt,
  showCost,
  turnStartedAt,
  voiceLabel,
  t
}) {
  const pct = usage.context_percent;
  const barColor = ctxBarColor(pct, t);
  const ctxLabel = usage.context_max ? `${fmtK(usage.context_used ?? 0)}/${fmtK(usage.context_max)}` : usage.total > 0 ? `${fmtK(usage.total)} tok` : '';
  const bar = usage.context_max ? ctxBar(pct) : '';
  const leftWidth = Math.max(12, cols - cwdLabel.length - 3);
  return _jsxs(Box, {
    height: 1,
    children: [_jsx(Box, {
      flexShrink: 1,
      width: leftWidth,
      children: _jsxs(Text, {
        color: t.color.border,
        wrap: "truncate-end",
        children: ['─ ', busy ? _jsx(FaceTicker, {
          color: statusColor,
          startedAt: turnStartedAt
        }) : _jsx(Text, {
          color: statusColor,
          children: status
        }), _jsxs(Text, {
          color: t.color.muted,
          children: [" \u2502 ", modelLabel(model, modelReasoningEffort, modelFast)]
        }), ctxLabel ? _jsxs(Text, {
          color: t.color.muted,
          children: [" \u2502 ", ctxLabel]
        }) : null, bar ? _jsxs(Text, {
          color: t.color.muted,
          children: [' │ ', _jsxs(Text, {
            color: barColor,
            children: ["[", bar, "]"]
          }), " ", _jsx(Text, {
            color: barColor,
            children: pct != null ? `${pct}%` : ''
          })]
        }) : null, sessionStartedAt ? _jsxs(Text, {
          color: t.color.muted,
          children: [' │ ', _jsx(SessionDuration, {
            startedAt: sessionStartedAt
          })]
        }) : null, _jsx(SpawnHud, {
          t: t
        }), voiceLabel ? _jsxs(Text, {
          color: voiceLabel.startsWith('●') ? t.color.error : voiceLabel.startsWith('◉') ? t.color.warn : t.color.muted,
          children: [' │ ', voiceLabel]
        }) : null, bgCount > 0 ? _jsxs(Text, {
          color: t.color.muted,
          children: [" \u2502 ", bgCount, " bg"]
        }) : null, showCost && typeof usage.cost_usd === 'number' ? _jsxs(Text, {
          color: t.color.muted,
          children: [" \u2502 $", usage.cost_usd.toFixed(4)]
        }) : null]
      })
    }), _jsx(Text, {
      color: t.color.border,
      children: " \u2500 "
    }), _jsx(Text, {
      color: t.color.label,
      children: cwdLabel
    })]
  });
}
export function FloatBox({
  children,
  color
}) {
  return _jsx(Box, {
    alignSelf: "flex-start",
    borderColor: color,
    borderStyle: "double",
    flexDirection: "column",
    marginTop: 1,
    opaque: true,
    paddingX: 1,
    children: children
  });
}
export function StickyPromptTracker(t0) {
  const $ = _c(10);
  const {
    messages,
    offsets,
    scrollRef,
    onChange
  } = t0;
  const {
    atBottom,
    bottom,
    top
  } = useViewportSnapshot(scrollRef);
  let t1;
  if ($[0] !== atBottom || $[1] !== bottom || $[2] !== messages || $[3] !== offsets || $[4] !== top) {
    t1 = stickyPromptFromViewport(messages, offsets, top, bottom, atBottom);
    $[0] = atBottom;
    $[1] = bottom;
    $[2] = messages;
    $[3] = offsets;
    $[4] = top;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  const text = t1;
  let t2;
  let t3;
  if ($[6] !== onChange || $[7] !== text) {
    t2 = () => onChange(text);
    t3 = [onChange, text];
    $[6] = onChange;
    $[7] = text;
    $[8] = t2;
    $[9] = t3;
  } else {
    t2 = $[8];
    t3 = $[9];
  }
  useEffect(t2, t3);
  return null;
}
export function TranscriptScrollbar({
  scrollRef,
  t
}) {
  const [hover, setHover] = useState(false);
  const [grab, setGrab] = useState(null);
  const {
    scrollHeight: total,
    top: pos,
    viewportHeight: vp
  } = useViewportSnapshot(scrollRef);
  if (!vp) {
    return _jsx(Box, {
      width: 1
    });
  }
  const s = scrollRef.current;
  const scrollable = total > vp;
  const thumb = scrollable ? Math.max(1, Math.round(vp * vp / total)) : vp;
  const travel = Math.max(1, vp - thumb);
  const thumbTop = scrollable ? Math.round(pos / Math.max(1, total - vp) * travel) : 0;
  const thumbColor = grab !== null ? t.color.primary : hover ? t.color.accent : t.color.border;
  const trackColor = hover ? t.color.border : t.color.muted;
  const jump = (row, offset) => {
    if (!s || !scrollable) {
      return;
    }
    s.scrollTo(Math.round(Math.max(0, Math.min(travel, row - offset)) / travel * Math.max(0, total - vp)));
  };
  return _jsx(Box, {
    flexDirection: "column",
    onMouseDown: e => {
      const row_0 = Math.max(0, Math.min(vp - 1, e.localRow ?? 0));
      const off = row_0 >= thumbTop && row_0 < thumbTop + thumb ? row_0 - thumbTop : Math.floor(thumb / 2);
      setGrab(off);
      jump(row_0, off);
    },
    onMouseDrag: e_0 => jump(Math.max(0, Math.min(vp - 1, e_0.localRow ?? 0)), grab ?? Math.floor(thumb / 2)),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onMouseUp: () => setGrab(null),
    width: 1,
    children: !scrollable ? _jsxs(Text, {
      color: trackColor,
      dim: true,
      children: [' \n'.repeat(Math.max(0, vp - 1)), ' ']
    }) : _jsxs(_Fragment, {
      children: [thumbTop > 0 ? _jsx(Text, {
        color: trackColor,
        dim: !hover,
        children: `${'│\n'.repeat(Math.max(0, thumbTop - 1))}${thumbTop > 0 ? '│' : ''}`
      }) : null, thumb > 0 ? _jsx(Text, {
        color: thumbColor,
        children: `${'┃\n'.repeat(Math.max(0, thumb - 1))}${thumb > 0 ? '┃' : ''}`
      }) : null, vp - thumbTop - thumb > 0 ? _jsx(Text, {
        color: trackColor,
        dim: !hover,
        children: `${'│\n'.repeat(Math.max(0, vp - thumbTop - thumb - 1))}${vp - thumbTop - thumb > 0 ? '│' : ''}`
      }) : null]
    })
  });
}