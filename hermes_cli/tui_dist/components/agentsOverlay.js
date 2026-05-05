import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, NoSelect, ScrollBox, Text, useInput, useStdout } from '@hermes/ink';
import { useStore } from '@nanostores/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { $delegationState, $overlaySectionsOpen, applyDelegationStatus, toggleOverlaySection } from '../app/delegationStore.js';
import { patchOverlayState } from '../app/overlayStore.js';
import { $spawnDiff, $spawnHistory, clearDiffPair } from '../app/spawnHistoryStore.js';
import { useTurnSelector } from '../app/turnStore.js';
import { asRpcResult } from '../lib/rpc.js';
import { buildSubagentTree, descendantIds, flattenTree, fmtCost, fmtDuration, fmtTokens, formatSummary, hotnessBucket, peakHotness, sparkline, topLevelSubagents, treeTotals, widthByDepth } from '../lib/subagentTree.js';
import { compactPreview } from '../lib/text.js';
const SORT_ORDER = ['depth-first', 'tools-desc', 'duration-desc', 'status'];
const FILTER_ORDER = ['all', 'running', 'failed', 'leaf'];
const SORT_LABEL = {
  'depth-first': 'spawn order',
  'duration-desc': 'slowest',
  status: 'status',
  'tools-desc': 'busiest'
};
const FILTER_LABEL = {
  all: 'all',
  failed: 'failed',
  leaf: 'leaves',
  running: 'running'
};
const STATUS_RANK = {
  failed: 0,
  interrupted: 1,
  running: 2,
  queued: 3,
  completed: 4
};
const SORT_COMPARATORS = {
  'depth-first': (a, b) => a.item.depth - b.item.depth || a.item.index - b.item.index,
  'tools-desc': (a, b) => b.aggregate.totalTools - a.aggregate.totalTools,
  'duration-desc': (a, b) => b.aggregate.totalDuration - a.aggregate.totalDuration,
  status: (a, b) => STATUS_RANK[a.item.status] - STATUS_RANK[b.item.status]
};
const FILTER_PREDICATES = {
  all: () => true,
  leaf: n => n.children.length === 0,
  running: n => n.item.status === 'running' || n.item.status === 'queued',
  failed: n => n.item.status === 'failed' || n.item.status === 'interrupted'
};
const STATUS_GLYPH = {
  running: {
    color: t => t.color.accent,
    glyph: '●'
  },
  queued: {
    color: t => t.color.muted,
    glyph: '○'
  },
  completed: {
    color: t => t.color.statusGood,
    glyph: '✓'
  },
  interrupted: {
    color: t => t.color.warn,
    glyph: '■'
  },
  failed: {
    color: t => t.color.error,
    glyph: '✗'
  }
};
// Heatmap palette — cold → hot, resolved against the active theme.
const heatPalette = t => [t.color.border, t.color.accent, t.color.primary, t.color.warn, t.color.error];
// ── Pure helpers ─────────────────────────────────────────────────────
const fmtDur = seconds => seconds == null || seconds <= 0 ? '' : fmtDuration(seconds);
const fmtElapsedLabel = seconds => seconds < 0 ? '' : fmtDuration(seconds);
const displayElapsedSeconds = (item, nowMs) => {
  if (item.durationSeconds != null) {
    return item.durationSeconds;
  }
  if (item.startedAt != null && (item.status === 'running' || item.status === 'queued')) {
    return Math.max(0, (nowMs - item.startedAt) / 1000);
  }
  return null;
};
const indentFor = depth => '  '.repeat(Math.max(0, depth));
const formatRowId = n => String(n + 1).padStart(2, ' ');
const cycle = (order, current) => order[(order.indexOf(current) + 1) % order.length];
const statusGlyph = (item, t) => {
  const g = STATUS_GLYPH[item.status];
  return {
    color: g.color(t),
    glyph: g.glyph
  };
};
const prepareRows = (tree, sort, filter) => tree.length === 0 ? [] : flattenTree([...tree].sort(SORT_COMPARATORS[sort])).filter(FILTER_PREDICATES[filter]);
const diffMetricLine = (name, a, b, fmt) => {
  const d = b - a;
  const sign = d === 0 ? '' : d > 0 ? '+' : '-';
  return `${name}: ${fmt(a)} → ${fmt(b)}  (${sign}${fmt(Math.abs(d)) || '0'})`;
};
// ── Sub-components ───────────────────────────────────────────────────
/** Polled on parent `tick` so accordions can resize the thumb without a scroll event. */
function OverlayScrollbar({
  scrollRef,
  t,
  tick
}) {
  void tick; // ensures re-render when the parent clock advances
  const [hover, setHover] = useState(false);
  const [grab, setGrab] = useState(null);
  const s = scrollRef.current;
  const vp = Math.max(0, s?.getViewportHeight() ?? 0);
  if (!vp) {
    return _jsx(Box, {
      width: 1
    });
  }
  const total = Math.max(vp, s?.getScrollHeight() ?? vp);
  const scrollable = total > vp;
  const thumb = scrollable ? Math.max(1, Math.round(vp * vp / total)) : vp;
  const travel = Math.max(1, vp - thumb);
  const pos = Math.max(0, (s?.getScrollTop() ?? 0) + (s?.getPendingDelta() ?? 0));
  const thumbTop = scrollable ? Math.round(pos / Math.max(1, total - vp) * travel) : 0;
  const below = Math.max(0, vp - thumbTop - thumb);
  const vBar = n => n > 0 ? `${'│\n'.repeat(n - 1)}│` : '';
  const thumbBody = `${'┃\n'.repeat(Math.max(0, thumb - 1))}┃`;
  const thumbColor = grab !== null ? t.color.primary : t.color.accent;
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
    children: !scrollable ? _jsx(Text, {
      color: trackColor,
      dim: true,
      children: vBar(vp)
    }) : _jsxs(_Fragment, {
      children: [thumbTop > 0 ? _jsx(Text, {
        color: trackColor,
        dim: !hover,
        children: vBar(thumbTop)
      }) : null, _jsx(Text, {
        color: thumbColor,
        children: thumbBody
      }), below > 0 ? _jsx(Text, {
        color: trackColor,
        dim: !hover,
        children: vBar(below)
      }) : null]
    })
  });
}
function GanttStrip({
  cols,
  cursor,
  flatNodes,
  maxRows,
  now,
  t
}) {
  const spans = flatNodes.map((node, idx) => {
    const started = node.item.startedAt ?? now;
    const ended = node.item.durationSeconds != null && node.item.startedAt != null ? node.item.startedAt + node.item.durationSeconds * 1000 : now;
    return {
      endAt: ended,
      idx,
      node,
      startAt: started
    };
  }).filter(s => s.endAt >= s.startAt);
  if (!spans.length) {
    return null;
  }
  const globalStart = Math.min(...spans.map(s => s.startAt));
  const globalEnd = Math.max(...spans.map(s => s.endAt));
  const totalSpan = Math.max(1, globalEnd - globalStart);
  const totalSeconds = (globalEnd - globalStart) / 1000;
  // 5-col id gutter ("  12  ") so the bar doesn't press against the id.
  // 10-col right reserve: pad + up to `12m 30s`-style label without
  // truncate-end against a full-width bar.
  const idGutter = 5;
  const labelReserve = 10;
  const barWidth = Math.max(10, cols - idGutter - labelReserve);
  const startIdx = Math.max(0, Math.min(Math.max(0, spans.length - maxRows), cursor - Math.floor(maxRows / 2)));
  const shown = spans.slice(startIdx, startIdx + maxRows);
  const bar = (startAt, endAt) => {
    const s = Math.floor((startAt - globalStart) / totalSpan * barWidth);
    const e = Math.min(barWidth, Math.ceil((endAt - globalStart) / totalSpan * barWidth));
    const fill = Math.max(1, e - s);
    return ' '.repeat(s) + '█'.repeat(fill) + ' '.repeat(Math.max(0, barWidth - s - fill));
  };
  const charStep = totalSeconds < 20 && barWidth > 20 ? 5 : 10;
  const ruler = Array.from({
    length: barWidth
  }, (_, i) => {
    if (i > 0 && i % 10 === 0) {
      return '┼';
    }
    if (i > 0 && i % 5 === 0) {
      return '·';
    }
    return '─';
  }).join('');
  const rulerLabels = (() => {
    const chars = new Array(barWidth).fill(' ');
    for (let pos = 0; pos < barWidth; pos += charStep) {
      const secs = pos / barWidth * totalSeconds;
      const label = pos === 0 ? '0' : secs >= 1 ? `${Math.round(secs)}s` : `${secs.toFixed(1)}s`;
      for (let j = 0; j < label.length && pos + j < barWidth; j++) {
        chars[pos + j] = label[j];
      }
    }
    return chars.join('');
  })();
  const windowLabel = spans.length > maxRows ? `  (${startIdx + 1}-${Math.min(spans.length, startIdx + maxRows)}/${spans.length})` : '';
  return _jsxs(Box, {
    flexDirection: "column",
    marginBottom: 1,
    children: [_jsxs(Text, {
      color: t.color.muted,
      children: ["Timeline \u00B7 ", fmtElapsedLabel(Math.max(0, totalSeconds)), windowLabel]
    }), shown.map(({
      endAt,
      idx,
      node,
      startAt
    }) => {
      const active = idx === cursor;
      const {
        color
      } = statusGlyph(node.item, t);
      const accent = active ? t.color.accent : t.color.muted;
      const elSec = displayElapsedSeconds(node.item, now);
      const elLabel = elSec != null ? fmtElapsedLabel(elSec) : '';
      return _jsxs(Text, {
        wrap: "truncate-end",
        children: [_jsxs(Text, {
          bold: active,
          color: accent,
          children: [formatRowId(idx), '  ']
        }), _jsx(Text, {
          color: active ? t.color.accent : color,
          children: bar(startAt, endAt)
        }), elLabel ? _jsxs(Text, {
          color: accent,
          children: ['   ', elLabel]
        }) : null]
      }, node.item.id);
    }), _jsxs(Text, {
      color: t.color.muted,
      dim: true,
      children: ['    ', ruler]
    }), totalSeconds > 0 ? _jsxs(Text, {
      color: t.color.muted,
      dim: true,
      children: ['    ', rulerLabels]
    }) : null]
  });
}
function OverlaySection(t0) {
  const $ = _c(11);
  const {
    children,
    count,
    defaultOpen: t1,
    title,
    t
  } = t0;
  const defaultOpen = t1 === undefined ? false : t1;
  const openMap = useStore($overlaySectionsOpen);
  const open = title in openMap ? openMap[title] : defaultOpen;
  let t2;
  if ($[0] !== children || $[1] !== count || $[2] !== defaultOpen || $[3] !== open || $[4] !== t.color.accent || $[5] !== t.color.label || $[6] !== title) {
    let t3;
    if ($[8] !== defaultOpen || $[9] !== title) {
      t3 = () => toggleOverlaySection(title, defaultOpen);
      $[8] = defaultOpen;
      $[9] = title;
      $[10] = t3;
    } else {
      t3 = $[10];
    }
    t2 = _jsxs(Box, {
      flexDirection: "column",
      marginTop: 1,
      children: [_jsx(Box, {
        onClick: t3,
        children: _jsxs(Text, {
          color: t.color.label,
          children: [_jsx(Text, {
            color: t.color.accent,
            children: open ? "\u25BE " : "\u25B8 "
          }), title, typeof count === "number" ? ` (${count})` : ""]
        })
      }), open ? _jsx(Box, {
        flexDirection: "column",
        children
      }) : null]
    });
    $[0] = children;
    $[1] = count;
    $[2] = defaultOpen;
    $[3] = open;
    $[4] = t.color.accent;
    $[5] = t.color.label;
    $[6] = title;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
}
function Field({
  name,
  t,
  value
}) {
  return _jsxs(Text, {
    wrap: "truncate-end",
    children: [_jsxs(Text, {
      color: t.color.label,
      children: [name, " \u00B7 "]
    }), _jsx(Text, {
      color: t.color.text,
      children: value
    })]
  });
}
function Detail({
  id,
  node,
  t
}) {
  const {
    aggregate: agg,
    item
  } = node;
  const {
    color,
    glyph
  } = statusGlyph(item, t);
  const inputTokens = item.inputTokens ?? 0;
  const outputTokens = item.outputTokens ?? 0;
  const localTokens = inputTokens + outputTokens;
  const subtreeTokens = agg.inputTokens + agg.outputTokens - localTokens;
  const localCost = item.costUsd ?? 0;
  const subtreeCost = agg.costUsd - localCost;
  const filesRead = item.filesRead ?? [];
  const filesWritten = item.filesWritten ?? [];
  const outputTail = item.outputTail ?? [];
  // Tool calls: prefer the live stream; for archived / post-turn views
  // that stream is often empty even when tool_count > 0, so fall back to
  // the tool names captured in outputTail at subagent.complete time.
  const toolLines = item.tools.length > 0 ? item.tools : outputTail.map(e => e.tool).filter(Boolean);
  const filesOverflow = Math.max(0, filesRead.length - 8) + Math.max(0, filesWritten.length - 8);
  return _jsxs(Box, {
    flexDirection: "column",
    children: [_jsxs(Text, {
      bold: true,
      color: t.color.text,
      wrap: "wrap",
      children: [id ? _jsxs(Text, {
        color: t.color.accent,
        children: ["#", id, " "]
      }) : null, _jsx(Text, {
        color: color,
        children: glyph
      }), " ", item.goal]
    }), _jsxs(Box, {
      flexDirection: "column",
      marginTop: 1,
      children: [_jsx(Field, {
        name: "depth",
        t: t,
        value: `${item.depth} · ${item.status}`
      }), item.model ? _jsx(Field, {
        name: "model",
        t: t,
        value: item.model
      }) : null, item.toolsets?.length ? _jsx(Field, {
        name: "toolsets",
        t: t,
        value: item.toolsets.join(', ')
      }) : null, _jsx(Field, {
        name: "tools",
        t: t,
        value: `${item.toolCount ?? 0} (subtree ${agg.totalTools})`
      }), _jsx(Field, {
        name: "subtree",
        t: t,
        value: `${agg.descendantCount} agent${agg.descendantCount === 1 ? '' : 's'} · d${agg.maxDepthFromHere} · ⚡${agg.activeCount}`
      }), item.durationSeconds ? _jsx(Field, {
        name: "elapsed",
        t: t,
        value: fmtDur(item.durationSeconds)
      }) : null, item.iteration != null ? _jsx(Field, {
        name: "iteration",
        t: t,
        value: String(item.iteration)
      }) : null, item.apiCalls ? _jsx(Field, {
        name: "api calls",
        t: t,
        value: String(item.apiCalls)
      }) : null]
    }), localTokens > 0 || localCost > 0 ? _jsxs(OverlaySection, {
      defaultOpen: true,
      t: t,
      title: "Budget",
      children: [localTokens > 0 ? _jsx(Field, {
        name: "tokens",
        t: t,
        value: _jsxs(_Fragment, {
          children: [fmtTokens(inputTokens), " in \u00B7 ", fmtTokens(outputTokens), " out", item.reasoningTokens ? ` · ${fmtTokens(item.reasoningTokens)} reasoning` : '']
        })
      }) : null, localCost > 0 ? _jsx(Field, {
        name: "cost",
        t: t,
        value: _jsxs(_Fragment, {
          children: [fmtCost(localCost), subtreeCost >= 0.01 ? ` · subtree +${fmtCost(subtreeCost)}` : '']
        })
      }) : null, subtreeTokens > 0 ? _jsx(Field, {
        name: "subtree tokens",
        t: t,
        value: `+${fmtTokens(subtreeTokens)}`
      }) : null]
    }) : null, filesRead.length > 0 || filesWritten.length > 0 ? _jsxs(OverlaySection, {
      count: filesRead.length + filesWritten.length,
      t: t,
      title: "Files",
      children: [filesWritten.slice(0, 8).map((p, i) => _jsxs(Text, {
        color: t.color.statusGood,
        wrap: "truncate-end",
        children: ["+", p]
      }, `w-${i}`)), filesRead.slice(0, 8).map((p, i) => _jsxs(Text, {
        color: t.color.text,
        wrap: "truncate-end",
        children: [_jsx(Text, {
          color: t.color.muted,
          children: "\u00B7"
        }), " ", p]
      }, `r-${i}`)), filesOverflow > 0 ? _jsxs(Text, {
        color: t.color.muted,
        children: ["\u2026+", filesOverflow, " more"]
      }) : null]
    }) : null, toolLines.length > 0 ? _jsx(OverlaySection, {
      count: toolLines.length,
      defaultOpen: true,
      t: t,
      title: "Tool calls",
      children: toolLines.map((line, i) => _jsxs(Text, {
        color: t.color.text,
        wrap: "wrap",
        children: [_jsx(Text, {
          color: t.color.muted,
          children: "\u00B7"
        }), " ", line]
      }, i))
    }) : null, outputTail.length > 0 ? _jsx(OverlaySection, {
      count: outputTail.length,
      defaultOpen: true,
      t: t,
      title: "Output",
      children: outputTail.map((entry, i) => _jsxs(Text, {
        color: entry.isError ? t.color.error : t.color.text,
        wrap: "wrap",
        children: [_jsx(Text, {
          bold: true,
          color: entry.isError ? t.color.error : t.color.accent,
          children: entry.tool
        }), ' ', entry.preview]
      }, i))
    }) : null, item.notes.length ? _jsx(OverlaySection, {
      count: item.notes.length,
      t: t,
      title: "Progress",
      children: item.notes.slice(-6).map((line, i) => _jsxs(Text, {
        color: t.color.text,
        wrap: "wrap",
        children: [_jsx(Text, {
          color: t.color.label,
          children: "\u00B7"
        }), " ", line]
      }, i))
    }) : null, item.summary ? _jsx(OverlaySection, {
      defaultOpen: true,
      t: t,
      title: "Summary",
      children: _jsx(Text, {
        color: t.color.text,
        wrap: "wrap",
        children: item.summary
      })
    }) : null]
  });
}
function ListRow({
  active,
  index,
  node,
  peak,
  t,
  width
}) {
  const {
    color,
    glyph
  } = statusGlyph(node.item, t);
  const palette = heatPalette(t);
  const heatIdx = hotnessBucket(node.aggregate.hotness, peak, palette.length);
  const heatMarker = heatIdx >= 2 ? palette[heatIdx] : null;
  const goal = compactPreview(node.item.goal || 'subagent', width - 28 - node.item.depth * 2);
  const toolsCount = node.aggregate.totalTools > 0 ? ` ·${node.aggregate.totalTools}t` : '';
  const kids = node.children.length ? ` ·${node.children.length}↓` : '';
  const line = node.item.status === 'running' ? node.item.tools.at(-1) : undefined;
  const paren = line ? line.indexOf('(') : -1;
  const toolShort = line ? (paren > 0 ? line.slice(0, paren) : line).trim() : '';
  const trailing = toolShort ? ` · ${compactPreview(toolShort, 14)}` : '';
  const fg = active ? t.color.accent : t.color.text;
  return _jsxs(Text, {
    bold: active,
    color: fg,
    inverse: active,
    wrap: "truncate-end",
    children: [' ', _jsxs(Text, {
      color: active ? fg : t.color.muted,
      children: [formatRowId(index), " "]
    }), indentFor(node.item.depth), heatMarker ? _jsx(Text, {
      color: heatMarker,
      children: "\u258D"
    }) : null, _jsx(Text, {
      color: active ? fg : color,
      children: glyph
    }), " ", goal, _jsxs(Text, {
      color: active ? fg : t.color.muted,
      children: [toolsCount, kids, trailing]
    })]
  });
}
function DiffPane({
  label,
  snapshot,
  t,
  totals,
  width
}) {
  return _jsxs(Box, {
    flexDirection: "column",
    width: width,
    children: [_jsx(Text, {
      bold: true,
      color: t.color.text,
      children: label
    }), _jsx(Text, {
      color: t.color.muted,
      wrap: "truncate-end",
      children: snapshot.label
    }), _jsx(Box, {
      marginTop: 1,
      children: _jsx(Text, {
        color: t.color.muted,
        wrap: "truncate-end",
        children: formatSummary(totals)
      })
    }), _jsx(Box, {
      flexDirection: "column",
      marginTop: 1,
      children: topLevelSubagents(snapshot.subagents).slice(0, 8).map(s => {
        const {
          color,
          glyph
        } = statusGlyph(s, t);
        return _jsxs(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: [_jsx(Text, {
            color: color,
            children: glyph
          }), " ", s.goal || 'subagent']
        }, s.id);
      })
    })]
  });
}
function DiffView(t0) {
  const $ = _c(13);
  const {
    cols,
    onClose,
    pair,
    t
  } = t0;
  let t1;
  if ($[0] !== pair.baseline.subagents) {
    t1 = treeTotals(buildSubagentTree(pair.baseline.subagents));
    $[0] = pair.baseline.subagents;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const aTotals = t1;
  let t2;
  if ($[2] !== pair.candidate.subagents) {
    t2 = treeTotals(buildSubagentTree(pair.candidate.subagents));
    $[2] = pair.candidate.subagents;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const bTotals = t2;
  const paneWidth = Math.floor((cols - 4) / 2);
  let t3;
  if ($[4] !== onClose) {
    t3 = (ch, key) => {
      if (key.escape || ch === "q") {
        onClose();
      }
    };
    $[4] = onClose;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  useInput(t3);
  const round = _temp;
  const sumTokens = _temp2;
  const dollars = _temp3;
  let t4;
  if ($[6] !== aTotals || $[7] !== bTotals || $[8] !== pair.baseline || $[9] !== pair.candidate || $[10] !== paneWidth || $[11] !== t) {
    t4 = _jsxs(Box, {
      flexDirection: "column",
      flexGrow: 1,
      paddingX: 1,
      paddingY: 1,
      children: [_jsxs(Box, {
        flexDirection: "column",
        marginBottom: 1,
        children: [_jsx(Text, {
          bold: true,
          color: t.color.border,
          children: "Replay diff"
        }), _jsx(Text, {
          color: t.color.muted,
          children: "baseline vs candidate \xB7 esc/q close"
        })]
      }), _jsxs(Box, {
        flexDirection: "row",
        marginBottom: 1,
        children: [_jsx(DiffPane, {
          label: "A \xB7 baseline",
          snapshot: pair.baseline,
          t,
          totals: aTotals,
          width: paneWidth
        }), _jsx(Box, {
          width: 2
        }), _jsx(DiffPane, {
          label: "B \xB7 candidate",
          snapshot: pair.candidate,
          t,
          totals: bTotals,
          width: paneWidth
        })]
      }), _jsxs(Box, {
        flexDirection: "column",
        marginTop: 1,
        children: [_jsx(Text, {
          bold: true,
          color: t.color.accent,
          children: "\u0394"
        }), _jsx(Text, {
          color: t.color.text,
          children: diffMetricLine("agents", aTotals.descendantCount, bTotals.descendantCount, round)
        }), _jsx(Text, {
          color: t.color.text,
          children: diffMetricLine("tools", aTotals.totalTools, bTotals.totalTools, round)
        }), _jsx(Text, {
          color: t.color.text,
          children: diffMetricLine("depth", aTotals.maxDepthFromHere, bTotals.maxDepthFromHere, round)
        }), _jsx(Text, {
          color: t.color.text,
          children: diffMetricLine("duration", aTotals.totalDuration, bTotals.totalDuration, _temp4)
        }), _jsx(Text, {
          color: t.color.text,
          children: diffMetricLine("tokens", sumTokens(aTotals), sumTokens(bTotals), fmtTokens)
        }), _jsx(Text, {
          color: t.color.text,
          children: diffMetricLine("cost", aTotals.costUsd, bTotals.costUsd, dollars)
        })]
      })]
    });
    $[6] = aTotals;
    $[7] = bTotals;
    $[8] = pair.baseline;
    $[9] = pair.candidate;
    $[10] = paneWidth;
    $[11] = t;
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  return t4;
}
// ── Main overlay ─────────────────────────────────────────────────────
function _temp4(n_1) {
  return `${n_1.toFixed(1)}s`;
}
function _temp3(n_0) {
  return fmtCost(n_0) || "$0.00";
}
function _temp2(x) {
  return x.inputTokens + x.outputTokens;
}
function _temp(n) {
  return String(Math.round(n));
}
export function AgentsOverlay({
  gw,
  initialHistoryIndex = 0,
  onClose,
  t
}) {
  const liveSubagents = useTurnSelector(state => state.subagents);
  const delegation = useStore($delegationState);
  const history = useStore($spawnHistory);
  const diffPair = useStore($spawnDiff);
  const {
    stdout
  } = useStdout();
  // historyIndex === 0: live turn.  1..N pulls the Nth-most-recent archived
  // snapshot.  /replay passes N on open.
  const [historyIndex, setHistoryIndex] = useState(() => Math.max(0, Math.min(history.length, Math.floor(initialHistoryIndex))));
  const [sort, setSort] = useState('depth-first');
  const [filter, setFilter] = useState('all');
  const [cursor, setCursor] = useState(0);
  const [flash, setFlash] = useState('');
  const [now, setNow] = useState(() => Date.now());
  // cc-style view switching: list = full-width row picker, detail = full-width
  // scrollable pane.  Two panes side-by-side in Ink fought Yoga flex.
  const [mode, setMode] = useState('list');
  const detailScrollRef = useRef(null);
  const prevLiveCountRef = useRef(liveSubagents.length);
  // ── Derived state ──────────────────────────────────────────────────
  const activeSnapshot = historyIndex > 0 ? history[historyIndex - 1] : null;
  // Instant fallback to history[0] the moment the live list clears — avoids
  // a one-frame "no subagents" flash while the auto-follow effect fires.
  const justFinishedSnapshot = historyIndex === 0 && liveSubagents.length === 0 ? history[0] ?? null : null;
  const effectiveSnapshot = activeSnapshot ?? justFinishedSnapshot;
  const replayMode = effectiveSnapshot != null;
  const subagents = replayMode ? effectiveSnapshot.subagents : liveSubagents;
  const tree = useMemo(() => buildSubagentTree(subagents), [subagents]);
  const totals = useMemo(() => treeTotals(tree), [tree]);
  const widths = useMemo(() => widthByDepth(tree), [tree]);
  const spark = useMemo(() => sparkline(widths), [widths]);
  const peak = useMemo(() => peakHotness(tree), [tree]);
  const rows = useMemo(() => prepareRows(tree, sort, filter), [tree, sort, filter]);
  const selected = rows[cursor] ?? null;
  const cols = stdout?.columns ?? 80;
  const rowsH = Math.max(8, (stdout?.rows ?? 24) - 10);
  const listWindowStart = Math.max(0, cursor - Math.floor(rowsH / 2));
  // ── Effects ────────────────────────────────────────────────────────
  useEffect(() => {
    // Ticker drives both the live gantt and OverlayScrollbar content-reflow
    // detection.  Slower in replay (nothing's growing) but not stopped
    // because accordions still expand.
    const id = setInterval(() => setNow(Date.now()), replayMode ? 300 : 500);
    return () => clearInterval(id);
  }, [replayMode]);
  useEffect(() => {
    // Clamp stale index when history grows/shrinks beneath us.
    if (historyIndex > history.length) {
      setHistoryIndex(history.length);
    }
  }, [history.length, historyIndex]);
  useEffect(() => {
    // Auto-follow the just-finished turn onto history[1] so the user isn't
    // dropped into an empty live view.  Fires only when transitioning from
    // "had live subagents" → "live empty" while in live mode.
    const prev = prevLiveCountRef.current;
    prevLiveCountRef.current = liveSubagents.length;
    if (historyIndex === 0 && prev > 0 && liveSubagents.length === 0 && history.length > 0) {
      setHistoryIndex(1);
      setCursor(0);
      setFlash('turn finished · inspect freely · q to close');
    }
  }, [history.length, historyIndex, liveSubagents.length]);
  useEffect(() => {
    // Reset detail scroll on navigation so the top of the new node shows.
    detailScrollRef.current?.scrollTo(0);
  }, [cursor, historyIndex, mode]);
  useEffect(() => {
    // Warm caps + paused flag on open.
    gw.request('delegation.status', {}).then(r => applyDelegationStatus(asRpcResult(r))).catch(() => {});
  }, [gw]);
  useEffect(() => {
    if (cursor >= rows.length) {
      setCursor(Math.max(0, rows.length - 1));
    }
  }, [cursor, rows.length]);
  // ── Actions ────────────────────────────────────────────────────────
  const guardLive = action => {
    if (replayMode) {
      setFlash('replay mode — controls disabled');
    } else {
      action();
    }
  };
  const interrupt = id_0 => gw.request('subagent.interrupt', {
    subagent_id: id_0
  });
  const killOne = id_1 => guardLive(() => {
    interrupt(id_1).then(raw => {
      const r_0 = asRpcResult(raw);
      setFlash(r_0?.found ? `killing ${id_1}` : `not found: ${id_1}`);
    }).catch(() => setFlash(`kill failed: ${id_1}`));
  });
  const killSubtree = node => guardLive(() => {
    const ids = [node.item.id, ...descendantIds(node)];
    ids.forEach(id_2 => interrupt(id_2).catch(() => {}));
    setFlash(`killing subtree · ${ids.length} node${ids.length === 1 ? '' : 's'}`);
  });
  const togglePause = () => guardLive(() => {
    gw.request('delegation.pause', {
      paused: !delegation.paused
    }).then(raw_0 => {
      const r_1 = asRpcResult(raw_0);
      applyDelegationStatus({
        paused: r_1?.paused
      });
      setFlash(r_1?.paused ? 'spawning paused' : 'spawning resumed');
    }).catch(() => setFlash('pause failed'));
  });
  const stepHistory = delta => setHistoryIndex(idx => {
    const next = Math.max(0, Math.min(history.length, idx + delta));
    if (next !== idx) {
      setCursor(0);
      setFlash(next === 0 ? 'live turn' : `replay · ${next}/${history.length}`);
    }
    return next;
  });
  const closeWithCleanup = () => {
    clearDiffPair();
    onClose();
  };
  // ── Input ──────────────────────────────────────────────────────────
  const detailPageSize = Math.max(4, rowsH - 2);
  const wheelDetailDy = 3;
  const scrollDetail = dy => detailScrollRef.current?.scrollBy(dy);
  useInput((ch, key) => {
    if (ch === 'q') {
      return closeWithCleanup();
    }
    if (key.escape) {
      return mode === 'detail' ? setMode('list') : closeWithCleanup();
    }
    // Shared actions (both modes).
    if (ch === '<' || ch === '[') {
      return stepHistory(1);
    }
    if (ch === '>' || ch === ']') {
      return stepHistory(-1);
    }
    if (ch === 'p') {
      return togglePause();
    }
    if (ch === 'x' && selected) {
      return killOne(selected.item.id);
    }
    if (ch === 'X' && selected) {
      return killSubtree(selected);
    }
    if (mode === 'detail') {
      if (key.leftArrow || ch === 'h') {
        return setMode('list');
      }
      if (key.pageUp || key.ctrl && ch === 'u') {
        return scrollDetail(-detailPageSize);
      }
      if (key.pageDown || key.ctrl && ch === 'd') {
        return scrollDetail(detailPageSize);
      }
      if (key.wheelUp) {
        return scrollDetail(-wheelDetailDy);
      }
      if (key.wheelDown) {
        return scrollDetail(wheelDetailDy);
      }
      if (key.upArrow || ch === 'k') {
        return scrollDetail(-2);
      }
      if (key.downArrow || ch === 'j') {
        return scrollDetail(2);
      }
      if (ch === 'g') {
        return detailScrollRef.current?.scrollTo(0);
      }
      if (ch === 'G') {
        return detailScrollRef.current?.scrollToBottom?.();
      }
      return;
    }
    // List mode.
    if ((key.return || key.rightArrow || ch === 'l') && selected) {
      return setMode('detail');
    }
    if (key.upArrow || ch === 'k' || key.wheelUp) {
      return setCursor(c => Math.max(0, c - 1));
    }
    if (key.downArrow || ch === 'j' || key.wheelDown) {
      return setCursor(c_0 => Math.min(Math.max(0, rows.length - 1), c_0 + 1));
    }
    if (ch === 'g') {
      return setCursor(0);
    }
    if (ch === 'G') {
      return setCursor(Math.max(0, rows.length - 1));
    }
    if (ch === 's') {
      return setSort(m => cycle(SORT_ORDER, m));
    }
    if (ch === 'f') {
      return setFilter(m_0 => cycle(FILTER_ORDER, m_0));
    }
  });
  // ── Header assembly ────────────────────────────────────────────────
  const mix = Object.entries(subagents.reduce((acc, it) => {
    const key_0 = it.model ? it.model.split('/').pop() : 'inherit';
    acc[key_0] = (acc[key_0] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k}×${v}`).join(' · ');
  const capsLabel = delegation.maxSpawnDepth ? `caps d${delegation.maxSpawnDepth}/${delegation.maxConcurrentChildren ?? '?'}` : '';
  const title = replayMode && effectiveSnapshot ? `${historyIndex > 0 ? `Replay ${historyIndex}/${history.length}` : 'Last turn'} · finished ${new Date(effectiveSnapshot.finishedAt).toLocaleTimeString()}` : `Spawn tree${delegation.paused ? ' · ⏸ paused' : ''}`;
  const metaLine = [formatSummary(totals), spark, capsLabel, mix ? `· ${mix}` : ''].filter(Boolean).join('  ');
  const controlsHint = replayMode ? ' · controls locked' : ` · x kill · X subtree · p ${delegation.paused ? 'resume' : 'pause'}`;
  // ── Rendering ──────────────────────────────────────────────────────
  if (diffPair) {
    return _jsx(DiffView, {
      cols: cols,
      onClose: closeWithCleanup,
      pair: diffPair,
      t: t
    });
  }
  return _jsxs(Box, {
    alignItems: "stretch",
    flexDirection: "column",
    flexGrow: 1,
    paddingX: 1,
    paddingY: 1,
    children: [_jsx(Box, {
      flexDirection: "column",
      marginBottom: 1,
      children: _jsxs(Text, {
        wrap: "truncate-end",
        children: [_jsx(Text, {
          bold: true,
          color: replayMode ? t.color.border : t.color.primary,
          children: title
        }), metaLine ? _jsxs(Text, {
          color: t.color.muted,
          children: ['   ', metaLine]
        }) : null]
      })
    }), rows.length === 0 ? _jsx(Box, {
      flexDirection: "column",
      flexGrow: 1,
      children: _jsx(Text, {
        color: t.color.muted,
        children: "No subagents this turn. Trigger delegate_task to populate the tree."
      })
    }) : mode === 'list' ? _jsxs(Box, {
      flexDirection: "column",
      flexGrow: 1,
      flexShrink: 1,
      minHeight: 0,
      children: [_jsx(GanttStrip, {
        cols: cols,
        cursor: cursor,
        flatNodes: rows,
        maxRows: 6,
        now: now,
        t: t
      }), _jsx(Box, {
        flexDirection: "column",
        flexGrow: 0,
        flexShrink: 0,
        overflow: "hidden",
        children: rows.slice(listWindowStart, listWindowStart + rowsH).map((node_0, i) => _jsx(ListRow, {
          active: listWindowStart + i === cursor,
          index: listWindowStart + i,
          node: node_0,
          peak: peak,
          t: t,
          width: cols
        }, node_0.item.id))
      })]
    }) : _jsxs(Box, {
      flexDirection: "row",
      flexGrow: 1,
      flexShrink: 1,
      minHeight: 0,
      children: [_jsx(ScrollBox, {
        flexDirection: "column",
        flexGrow: 1,
        flexShrink: 1,
        ref: detailScrollRef,
        children: _jsx(Box, {
          flexDirection: "column",
          paddingBottom: 4,
          paddingRight: 1,
          children: selected ? _jsx(Detail, {
            id: formatRowId(cursor).trim(),
            node: selected,
            t: t
          }) : null
        })
      }), _jsx(NoSelect, {
        flexShrink: 0,
        marginLeft: 1,
        children: _jsx(OverlayScrollbar, {
          scrollRef: detailScrollRef,
          t: t,
          tick: now
        })
      })]
    }), _jsxs(Box, {
      flexDirection: "column",
      marginTop: 1,
      children: [flash ? _jsx(Text, {
        color: t.color.accent,
        children: flash
      }) : null, mode === 'list' ? _jsxs(Text, {
        color: t.color.muted,
        children: ["\u2191\u2193/jk move \u00B7 g/G top/bottom \u00B7 Enter/\u2192 open detail", controlsHint, " \u00B7 s sort:", SORT_LABEL[sort], " \u00B7 f filter:", FILTER_LABEL[filter], history.length > 0 ? ` · [ / ] history ${historyIndex}/${history.length}` : '', ' · q close']
      }) : _jsxs(Text, {
        color: t.color.muted,
        children: ["\u2191\u2193/jk scroll \u00B7 PgUp/PgDn page \u00B7 g/G top/bottom \u00B7 Esc/\u2190 back to list", controlsHint, " \u00B7 q close"]
      })]
    })]
  });
}
export const closeAgentsOverlay = () => patchOverlayState({
  agents: false
});
export const openAgentsOverlay = () => patchOverlayState({
  agents: true
});