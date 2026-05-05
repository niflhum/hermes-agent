import { c as _c } from "react/compiler-runtime";
import { createElement as _createElement } from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, NoSelect, Text } from '@hermes/ink';
import { memo, useEffect, useMemo, useState } from 'react';
import spinners from 'unicode-animations';
import { THINKING_COT_MAX } from '../config/limits.js';
import { sectionMode } from '../domain/details.js';
import { buildSubagentTree, fmtCost, fmtTokens, formatSummary as formatSpawnSummary, hotnessBucket, peakHotness, sparkline, treeTotals, widthByDepth } from '../lib/subagentTree.js';
import { boundedLiveRenderText, compactPreview, estimateTokensRough, fmtK, formatToolCall, parseToolTrailResultLine, pick, splitToolDuration, thinkingPreview, toolTrailLabel } from '../lib/text.js';
const THINK = ['helix', 'breathe', 'orbit', 'dna', 'waverows', 'snake', 'pulse'];
const TOOL = ['cascade', 'scan', 'diagswipe', 'fillsweep', 'rain', 'columns', 'sparkle'];
const fmtElapsed = ms => {
  const sec = Math.max(0, ms) / 1000;
  return sec < 10 ? `${sec.toFixed(1)}s` : `${Math.round(sec)}s`;
};
const nextTreeRails = (rails, branch) => [...rails, branch === 'mid'];
const treeLead = (rails, branch) => `${rails.map(on => on ? '│ ' : '  ').join('')}${branch === 'mid' ? '├─ ' : '└─ '}`;
// ── Primitives ───────────────────────────────────────────────────────
function TreeRow({
  branch,
  children,
  rails = [],
  stemColor,
  stemDim = true,
  t
}) {
  const lead = treeLead(rails, branch);
  return _jsxs(Box, {
    children: [_jsx(NoSelect, {
      flexShrink: 0,
      fromLeftEdge: true,
      width: lead.length,
      children: _jsx(Text, {
        color: stemColor ?? t.color.muted,
        dim: stemDim,
        children: lead
      })
    }), _jsx(Box, {
      flexDirection: "column",
      flexGrow: 1,
      children: children
    })]
  });
}
function TreeTextRow({
  branch,
  color,
  content,
  dimColor,
  rails = [],
  t,
  wrap = 'wrap-trim'
}) {
  const text = dimColor ? _jsx(Text, {
    color: color,
    dim: true,
    wrap: wrap,
    children: content
  }) : _jsx(Text, {
    color: color,
    wrap: wrap,
    children: content
  });
  return _jsx(TreeRow, {
    branch: branch,
    rails: rails,
    t: t,
    children: text
  });
}
function TreeNode({
  branch,
  children,
  header,
  open,
  rails = [],
  stemColor,
  stemDim,
  t
}) {
  return _jsxs(Box, {
    flexDirection: "column",
    children: [_jsx(TreeRow, {
      branch: branch,
      rails: rails,
      stemColor: stemColor,
      stemDim: stemDim,
      t: t,
      children: header
    }), open ? children?.(nextTreeRails(rails, branch)) : null]
  });
}
export function Spinner(t0) {
  const $ = _c(16);
  const {
    color,
    variant: t1
  } = t0;
  const variant = t1 === undefined ? "think" : t1;
  const raw = spinners[pick(variant === "tool" ? TOOL : THINK)];
  let t2;
  if ($[0] !== raw.frames) {
    t2 = raw.frames.map(_temp);
    $[0] = raw.frames;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  let t3;
  if ($[2] !== raw || $[3] !== t2) {
    t3 = {
      ...raw,
      frames: t2
    };
    $[2] = raw;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const spin = t3;
  const [frame, setFrame] = useState(0);
  let t4;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = () => {
      setFrame(0);
    };
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  let t5;
  if ($[6] !== spin) {
    t5 = [spin];
    $[6] = spin;
    $[7] = t5;
  } else {
    t5 = $[7];
  }
  useEffect(t4, t5);
  let t6;
  if ($[8] !== spin.frames.length || $[9] !== spin.interval) {
    t6 = () => {
      const id = setInterval(() => setFrame(f_0 => (f_0 + 1) % spin.frames.length), spin.interval);
      return () => clearInterval(id);
    };
    $[8] = spin.frames.length;
    $[9] = spin.interval;
    $[10] = t6;
  } else {
    t6 = $[10];
  }
  let t7;
  if ($[11] !== spin) {
    t7 = [spin];
    $[11] = spin;
    $[12] = t7;
  } else {
    t7 = $[12];
  }
  useEffect(t6, t7);
  const t8 = spin.frames[frame];
  let t9;
  if ($[13] !== color || $[14] !== t8) {
    t9 = _jsx(Text, {
      color,
      children: t8
    });
    $[13] = color;
    $[14] = t8;
    $[15] = t9;
  } else {
    t9 = $[15];
  }
  return t9;
}
function _temp(f) {
  return [...f][0] ?? "\u2800";
}
function Detail({
  branch = 'last',
  color,
  content,
  dimColor,
  rails = [],
  t
}) {
  return _jsx(TreeTextRow, {
    branch: branch,
    color: color,
    content: content,
    dimColor: dimColor,
    rails: rails,
    t: t
  });
}
function StreamCursor(t0) {
  const $ = _c(9);
  const {
    color,
    dimColor,
    streaming: t1,
    visible: t2
  } = t0;
  const streaming = t1 === undefined ? false : t1;
  const visible = t2 === undefined ? false : t2;
  const [on, setOn] = useState(true);
  let t3;
  let t4;
  if ($[0] !== streaming || $[1] !== visible) {
    t3 = () => {
      if (!visible || !streaming) {
        setOn(true);
        return;
      }
      const id = setInterval(() => setOn(_temp2), 420);
      return () => clearInterval(id);
    };
    t4 = [streaming, visible];
    $[0] = streaming;
    $[1] = visible;
    $[2] = t3;
    $[3] = t4;
  } else {
    t3 = $[2];
    t4 = $[3];
  }
  useEffect(t3, t4);
  if (!visible) {
    return null;
  }
  let t5;
  if ($[4] !== color || $[5] !== dimColor || $[6] !== on || $[7] !== streaming) {
    t5 = dimColor ? _jsx(Text, {
      color,
      dim: true,
      children: streaming && on ? "\u258D" : " "
    }) : _jsx(Text, {
      color,
      children: streaming && on ? "\u258D" : " "
    });
    $[4] = color;
    $[5] = dimColor;
    $[6] = on;
    $[7] = streaming;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  return t5;
}
function _temp2(v) {
  return !v;
}
function Chevron({
  count,
  onClick,
  open,
  suffix,
  t,
  title,
  tone = 'dim'
}) {
  const color = tone === 'error' ? t.color.error : tone === 'warn' ? t.color.warn : t.color.muted;
  return _jsx(Box, {
    onClick: e => onClick(!!e?.shiftKey || !!e?.ctrlKey),
    children: _jsxs(Text, {
      color: color,
      dim: tone === 'dim',
      children: [_jsx(Text, {
        color: t.color.accent,
        children: open ? '▾ ' : '▸ '
      }), title, typeof count === 'number' ? ` (${count})` : '', suffix ? _jsxs(Text, {
        color: t.color.statusFg,
        dim: true,
        children: ['  ', suffix]
      }) : null]
    })
  });
}
function heatColor(node, peak, theme) {
  const palette = [theme.color.border, theme.color.accent, theme.color.primary, theme.color.warn, theme.color.error];
  const idx = hotnessBucket(node.aggregate.hotness, peak, palette.length);
  // Below the median bucket we keep the default dim stem so cool branches
  // fade into the chrome — only "hot" branches draw the eye.
  if (idx < 2) {
    return undefined;
  }
  return palette[idx];
}
function SubagentAccordion(t0) {
  const $ = _c(45);
  const {
    branch,
    expanded,
    node,
    peak,
    rails: t1,
    t
  } = t0;
  const rails = t1 === undefined ? [] : t1;
  const [open, setOpen] = useState(expanded);
  const [deep, setDeep] = useState(expanded);
  const [openThinking, setOpenThinking] = useState(expanded);
  const [openTools, setOpenTools] = useState(expanded);
  const [openNotes, setOpenNotes] = useState(expanded);
  const [openKids, setOpenKids] = useState(expanded);
  let t2;
  let t3;
  if ($[0] !== expanded) {
    t2 = () => {
      if (!expanded) {
        return;
      }
      setOpen(true);
      setDeep(true);
      setOpenThinking(true);
      setOpenTools(true);
      setOpenNotes(true);
      setOpenKids(true);
    };
    t3 = [expanded];
    $[0] = expanded;
    $[1] = t2;
    $[2] = t3;
  } else {
    t2 = $[1];
    t3 = $[2];
  }
  useEffect(t2, t3);
  let t4;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = () => {
      setOpen(true);
      setDeep(true);
      setOpenThinking(true);
      setOpenTools(true);
      setOpenNotes(true);
      setOpenKids(true);
    };
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  const expandAll = t4;
  const item = node.item;
  const children = node.children;
  const aggregate = node.aggregate;
  const statusTone = item.status === "failed" ? "error" : item.status === "interrupted" ? "warn" : "dim";
  const prefix = item.taskCount > 1 ? `[${item.index + 1}/${item.taskCount}] ` : "";
  const goalLabel = item.goal || `Subagent ${item.index + 1}`;
  let t5;
  if ($[4] !== goalLabel || $[5] !== open) {
    t5 = open ? goalLabel : compactPreview(goalLabel, 60);
    $[4] = goalLabel;
    $[5] = open;
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  const title = `${prefix}${t5}`;
  const summary = compactPreview((item.summary || "").replace(/\s+/g, " ").trim(), 72);
  const statusLabel = item.status === "queued" ? "queued" : item.status === "running" ? "running" : String(item.status);
  let rollupBits;
  if ($[7] !== aggregate.activeCount || $[8] !== aggregate.costUsd || $[9] !== aggregate.descendantCount || $[10] !== aggregate.totalTools || $[11] !== children.length || $[12] !== item.costUsd || $[13] !== item.durationSeconds || $[14] !== item.filesRead?.length || $[15] !== item.filesWritten?.length || $[16] !== item.inputTokens || $[17] !== item.outputTokens || $[18] !== item.status || $[19] !== item.toolCount || $[20] !== statusLabel) {
    rollupBits = [statusLabel];
    if (item.durationSeconds) {
      const t6 = item.durationSeconds * 1000;
      let t7;
      if ($[22] !== t6) {
        t7 = fmtElapsed(t6);
        $[22] = t6;
        $[23] = t7;
      } else {
        t7 = $[23];
      }
      rollupBits.push(t7);
    }
    const localTools = item.toolCount ?? 0;
    const subtreeTools = aggregate.totalTools - localTools;
    if (localTools > 0) {
      rollupBits.push(`${localTools} tool${localTools === 1 ? "" : "s"}`);
    }
    const localTokens = (item.inputTokens ?? 0) + (item.outputTokens ?? 0);
    if (localTokens > 0) {
      let t6;
      if ($[24] !== localTokens) {
        t6 = fmtTokens(localTokens);
        $[24] = localTokens;
        $[25] = t6;
      } else {
        t6 = $[25];
      }
      rollupBits.push(`${t6} tok`);
    }
    const localCost = item.costUsd ?? 0;
    if (localCost > 0) {
      let t6;
      if ($[26] !== localCost) {
        t6 = fmtCost(localCost);
        $[26] = localCost;
        $[27] = t6;
      } else {
        t6 = $[27];
      }
      rollupBits.push(t6);
    }
    const filesLocal = (item.filesWritten?.length ?? 0) + (item.filesRead?.length ?? 0);
    if (filesLocal > 0) {
      rollupBits.push(`⎘${filesLocal}`);
    }
    if (children.length > 0) {
      rollupBits.push(`${aggregate.descendantCount}↓`);
      if (subtreeTools > 0) {
        rollupBits.push(`+${subtreeTools}t sub`);
      }
      const subCost = aggregate.costUsd - localCost;
      if (subCost >= 0.01) {
        let t6;
        if ($[28] !== subCost) {
          t6 = fmtCost(subCost);
          $[28] = subCost;
          $[29] = t6;
        } else {
          t6 = $[29];
        }
        rollupBits.push(`+${t6} sub`);
      }
      if (aggregate.activeCount > 0 && item.status !== "running") {
        rollupBits.push(`⚡${aggregate.activeCount}`);
      }
    }
    $[7] = aggregate.activeCount;
    $[8] = aggregate.costUsd;
    $[9] = aggregate.descendantCount;
    $[10] = aggregate.totalTools;
    $[11] = children.length;
    $[12] = item.costUsd;
    $[13] = item.durationSeconds;
    $[14] = item.filesRead?.length;
    $[15] = item.filesWritten?.length;
    $[16] = item.inputTokens;
    $[17] = item.outputTokens;
    $[18] = item.status;
    $[19] = item.toolCount;
    $[20] = statusLabel;
    $[21] = rollupBits;
  } else {
    rollupBits = $[21];
  }
  const suffix = rollupBits.join(" \xB7 ");
  const thinkingText = item.thinking.join("\n");
  const hasThinking = Boolean(thinkingText);
  const hasTools = item.tools.length > 0;
  const noteRows = [...(summary ? [summary] : []), ...item.notes];
  const hasNotes = noteRows.length > 0;
  const noteColor = statusTone === "error" ? t.color.error : statusTone === "warn" ? t.color.warn : t.color.muted;
  const sections = [];
  if (hasThinking) {
    let t6;
    if ($[30] === Symbol.for("react.memo_cache_sentinel")) {
      t6 = shift => {
        if (shift) {
          expandAll();
        } else {
          setOpenThinking(_temp3);
        }
      };
      $[30] = t6;
    } else {
      t6 = $[30];
    }
    sections.push({
      header: _jsx(Chevron, {
        count: item.thinking.length,
        onClick: t6,
        open: openThinking,
        t,
        title: "Thinking"
      }),
      key: "thinking",
      open: openThinking,
      render: childRails => _jsx(Thinking, {
        active: item.status === "running",
        branch: "last",
        mode: "full",
        rails: childRails,
        reasoning: thinkingText,
        streaming: item.status === "running",
        t
      })
    });
  }
  if (hasTools) {
    let t6;
    if ($[31] === Symbol.for("react.memo_cache_sentinel")) {
      t6 = shift_0 => {
        if (shift_0) {
          expandAll();
        } else {
          setOpenTools(_temp4);
        }
      };
      $[31] = t6;
    } else {
      t6 = $[31];
    }
    let t7;
    if ($[32] !== item.id || $[33] !== item.tools || $[34] !== t) {
      t7 = childRails_0 => _jsx(Box, {
        flexDirection: "column",
        children: item.tools.map((line, index) => _jsx(TreeTextRow, {
          branch: index === item.tools.length - 1 ? "last" : "mid",
          color: t.color.text,
          content: _jsxs(_Fragment, {
            children: [_jsx(Text, {
              color: t.color.accent,
              children: "\u25CF "
            }), line]
          }),
          rails: childRails_0,
          t
        }, `${item.id}-tool-${index}`))
      });
      $[32] = item.id;
      $[33] = item.tools;
      $[34] = t;
      $[35] = t7;
    } else {
      t7 = $[35];
    }
    sections.push({
      header: _jsx(Chevron, {
        count: item.tools.length,
        onClick: t6,
        open: openTools,
        t,
        title: "Tool calls"
      }),
      key: "tools",
      open: openTools,
      render: t7
    });
  }
  if (hasNotes) {
    let t6;
    if ($[36] === Symbol.for("react.memo_cache_sentinel")) {
      t6 = shift_1 => {
        if (shift_1) {
          expandAll();
        } else {
          setOpenNotes(_temp5);
        }
      };
      $[36] = t6;
    } else {
      t6 = $[36];
    }
    sections.push({
      header: _jsx(Chevron, {
        count: noteRows.length,
        onClick: t6,
        open: openNotes,
        t,
        title: "Progress",
        tone: statusTone
      }),
      key: "notes",
      open: openNotes,
      render: childRails_1 => _jsx(Box, {
        flexDirection: "column",
        children: noteRows.map((line_0, index_0) => _jsx(TreeTextRow, {
          branch: index_0 === noteRows.length - 1 ? "last" : "mid",
          color: noteColor,
          content: line_0,
          dimColor: statusTone === "dim",
          rails: childRails_1,
          t
        }, `${item.id}-note-${index_0}`))
      })
    });
  }
  if (children.length > 0) {
    let t6;
    if ($[37] === Symbol.for("react.memo_cache_sentinel")) {
      t6 = shift_2 => {
        if (shift_2) {
          expandAll();
        } else {
          setOpenKids(_temp6);
        }
      };
      $[37] = t6;
    } else {
      t6 = $[37];
    }
    let t7;
    if ($[38] !== children || $[39] !== deep || $[40] !== expanded || $[41] !== peak || $[42] !== t) {
      t7 = childRails_2 => _jsx(Box, {
        flexDirection: "column",
        children: children.map((child, i) => _jsx(SubagentAccordion, {
          branch: i === children.length - 1 ? "last" : "mid",
          expanded: expanded || deep,
          node: child,
          peak,
          rails: childRails_2,
          t
        }, child.item.id))
      });
      $[38] = children;
      $[39] = deep;
      $[40] = expanded;
      $[41] = peak;
      $[42] = t;
      $[43] = t7;
    } else {
      t7 = $[43];
    }
    sections.push({
      header: _jsx(Chevron, {
        count: children.length,
        onClick: t6,
        open: openKids,
        suffix: `d${item.depth + 1} · ${aggregate.descendantCount} total`,
        t,
        title: "Spawned"
      }),
      key: "subagents",
      open: openKids,
      render: t7
    });
  }
  const stem = heatColor(node, peak, t);
  let t6;
  if ($[44] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = shift_3 => {
      if (shift_3) {
        expandAll();
        return;
      }
      setOpen(v_3 => {
        if (!v_3) {
          setDeep(false);
        }
        return !v_3;
      });
    };
    $[44] = t6;
  } else {
    t6 = $[44];
  }
  return _jsx(TreeNode, {
    branch,
    header: _jsx(Chevron, {
      onClick: t6,
      open,
      suffix,
      t,
      title,
      tone: statusTone
    }),
    open,
    rails,
    stemColor: stem,
    stemDim: stem == null,
    t,
    children: childRails_3 => _jsx(Box, {
      flexDirection: "column",
      children: sections.map((section, index_1) => _jsx(TreeNode, {
        branch: index_1 === sections.length - 1 ? "last" : "mid",
        header: section.header,
        open: section.open,
        rails: childRails_3,
        t,
        children: section.render
      }, `${item.id}-${section.key}`))
    })
  });
}
// ── Thinking ─────────────────────────────────────────────────────────
function _temp6(v_2) {
  return !v_2;
}
function _temp5(v_1) {
  return !v_1;
}
function _temp4(v_0) {
  return !v_0;
}
function _temp3(v) {
  return !v;
}
export const Thinking = memo(function Thinking(t0) {
  const $ = _c(14);
  const {
    active: t1,
    branch: t2,
    mode: t3,
    rails: t4,
    reasoning,
    streaming: t5,
    t
  } = t0;
  const active = t1 === undefined ? false : t1;
  const branch = t2 === undefined ? "last" : t2;
  const mode = t3 === undefined ? "truncated" : t3;
  let t6;
  let t7;
  if ($[0] !== active || $[1] !== branch || $[2] !== mode || $[3] !== reasoning || $[4] !== t || $[5] !== t4 || $[6] !== t5) {
    t7 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const rails = t4 === undefined ? [] : t4;
      const streaming = t5 === undefined ? false : t5;
      let t8;
      if ($[9] !== mode || $[10] !== reasoning) {
        const raw = thinkingPreview(reasoning, mode, THINKING_COT_MAX);
        t8 = mode === "full" ? boundedLiveRenderText(raw) : raw;
        $[9] = mode;
        $[10] = reasoning;
        $[11] = t8;
      } else {
        t8 = $[11];
      }
      const preview = t8;
      let t9;
      if ($[12] !== preview) {
        t9 = preview.split("\n").map(_temp7);
        $[12] = preview;
        $[13] = t9;
      } else {
        t9 = $[13];
      }
      const lines = t9;
      if (!preview && !active) {
        t7 = null;
        break bb0;
      }
      t6 = _jsx(TreeRow, {
        branch,
        rails,
        t,
        children: _jsx(Box, {
          flexDirection: "column",
          flexGrow: 1,
          children: preview ? mode === "full" ? lines.map((line_0, index) => _jsxs(Text, {
            color: t.color.muted,
            wrap: "wrap-trim",
            children: [line_0 || " ", index === lines.length - 1 ? _jsx(StreamCursor, {
              color: t.color.muted,
              streaming,
              visible: active
            }) : null]
          }, index)) : _jsxs(Text, {
            color: t.color.muted,
            wrap: "truncate-end",
            children: [preview, _jsx(StreamCursor, {
              color: t.color.muted,
              streaming,
              visible: active
            })]
          }) : _jsx(Text, {
            color: t.color.muted,
            children: _jsx(StreamCursor, {
              color: t.color.muted,
              streaming,
              visible: active
            })
          })
        })
      });
    }
    $[0] = active;
    $[1] = branch;
    $[2] = mode;
    $[3] = reasoning;
    $[4] = t;
    $[5] = t4;
    $[6] = t5;
    $[7] = t6;
    $[8] = t7;
  } else {
    t6 = $[7];
    t7 = $[8];
  }
  if (t7 !== Symbol.for("react.early_return_sentinel")) {
    return t7;
  }
  return t6;
});
export const ToolTrail = memo(function ToolTrail(t0) {
  const $ = _c(39);
  const {
    busy: t1,
    commandOverride: t2,
    detailsMode: t3,
    outcome: t4,
    reasoningActive: t5,
    reasoning: t6,
    reasoningTokens,
    reasoningStreaming: t7,
    sections,
    subagents: t8,
    t,
    tools: t9,
    toolTokens,
    trail: t10,
    activity: t11
  } = t0;
  const busy = t1 === undefined ? false : t1;
  const commandOverride = t2 === undefined ? false : t2;
  const detailsMode = t3 === undefined ? "collapsed" : t3;
  const outcome = t4 === undefined ? "" : t4;
  const reasoningActive = t5 === undefined ? false : t5;
  const reasoning = t6 === undefined ? "" : t6;
  const reasoningStreaming = t7 === undefined ? false : t7;
  const subagents = t8 === undefined ? [] : t8;
  const tools = t9 === undefined ? [] : t9;
  const trail = t10 === undefined ? [] : t10;
  const activity = t11 === undefined ? [] : t11;
  let t12;
  if ($[0] !== commandOverride || $[1] !== detailsMode || $[2] !== sections) {
    t12 = sectionMode("thinking", detailsMode, sections, commandOverride);
    $[0] = commandOverride;
    $[1] = detailsMode;
    $[2] = sections;
    $[3] = t12;
  } else {
    t12 = $[3];
  }
  let t13;
  if ($[4] !== commandOverride || $[5] !== detailsMode || $[6] !== sections) {
    t13 = sectionMode("tools", detailsMode, sections, commandOverride);
    $[4] = commandOverride;
    $[5] = detailsMode;
    $[6] = sections;
    $[7] = t13;
  } else {
    t13 = $[7];
  }
  let t14;
  if ($[8] !== commandOverride || $[9] !== detailsMode || $[10] !== sections) {
    t14 = sectionMode("subagents", detailsMode, sections, commandOverride);
    $[8] = commandOverride;
    $[9] = detailsMode;
    $[10] = sections;
    $[11] = t14;
  } else {
    t14 = $[11];
  }
  let t15;
  if ($[12] !== commandOverride || $[13] !== detailsMode || $[14] !== sections) {
    t15 = sectionMode("activity", detailsMode, sections, commandOverride);
    $[12] = commandOverride;
    $[13] = detailsMode;
    $[14] = sections;
    $[15] = t15;
  } else {
    t15 = $[15];
  }
  let t16;
  if ($[16] !== t12 || $[17] !== t13 || $[18] !== t14 || $[19] !== t15) {
    t16 = {
      thinking: t12,
      tools: t13,
      subagents: t14,
      activity: t15
    };
    $[16] = t12;
    $[17] = t13;
    $[18] = t14;
    $[19] = t15;
    $[20] = t16;
  } else {
    t16 = $[20];
  }
  const visible = t16;
  const [now, setNow] = useState(_temp8);
  const [openThinking, setOpenThinking] = useState(visible.thinking === "expanded");
  const [openTools, setOpenTools] = useState(visible.tools === "expanded");
  const [openSubagents, setOpenSubagents] = useState(visible.subagents === "expanded");
  const [deepSubagents, setDeepSubagents] = useState(visible.subagents === "expanded");
  const [openMeta, setOpenMeta] = useState(visible.activity === "expanded");
  useEffect(() => {
    if (!tools.length || visible.tools !== "expanded" && !openTools) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [openTools, tools.length, visible.tools]);
  let t17;
  if ($[21] !== visible.activity || $[22] !== visible.subagents || $[23] !== visible.thinking || $[24] !== visible.tools) {
    t17 = () => {
      setOpenThinking(visible.thinking === "expanded");
      setOpenTools(visible.tools === "expanded");
      setOpenSubagents(visible.subagents === "expanded");
      setOpenMeta(visible.activity === "expanded");
    };
    $[21] = visible.activity;
    $[22] = visible.subagents;
    $[23] = visible.thinking;
    $[24] = visible.tools;
    $[25] = t17;
  } else {
    t17 = $[25];
  }
  let t18;
  if ($[26] !== visible) {
    t18 = [visible];
    $[26] = visible;
    $[27] = t18;
  } else {
    t18 = $[27];
  }
  useEffect(t17, t18);
  const cot = thinkingPreview(reasoning, "full", THINKING_COT_MAX);
  const spawnTree = buildSubagentTree(subagents);
  const spawnPeak = peakHotness(spawnTree);
  const spawnTotals = treeTotals(spawnTree);
  const spawnWidths = widthByDepth(spawnTree);
  const spawnSpark = sparkline(spawnWidths);
  const spawnSummaryLabel = formatSpawnSummary(spawnTotals);
  if (!busy && !trail.length && !tools.length && !subagents.length && !activity.length && !cot && !reasoningActive && !outcome) {
    return null;
  }
  const groups = [];
  const meta = [];
  const pushDetail = row => (groups.at(-1)?.details ?? meta).push(row);
  for (const [i, line] of trail.entries()) {
    const parsed = parseToolTrailResultLine(line);
    if (parsed) {
      groups.push({
        color: parsed.mark === "\u2717" ? t.color.error : t.color.text,
        content: parsed.call,
        details: [],
        key: `tr-${i}`,
        label: parsed.call
      });
      if (parsed.detail) {
        pushDetail({
          color: parsed.mark === "\u2717" ? t.color.error : t.color.muted,
          content: parsed.detail,
          dimColor: parsed.mark !== "\u2717",
          key: `tr-${i}-d`
        });
      }
      continue;
    }
    if (line.startsWith("drafting ")) {
      const label = toolTrailLabel(line.slice(9).replace(/…$/, "").trim());
      groups.push({
        color: t.color.text,
        content: label,
        details: [{
          color: t.color.muted,
          content: "drafting...",
          dimColor: true,
          key: `tr-${i}-d`
        }],
        key: `tr-${i}`,
        label
      });
      continue;
    }
    if (line === "analyzing tool output\u2026") {
      pushDetail({
        color: t.color.muted,
        dimColor: true,
        key: `tr-${i}`,
        content: groups.length ? _jsxs(_Fragment, {
          children: [_jsx(Spinner, {
            color: t.color.accent,
            variant: "think"
          }), " ", line]
        }) : line
      });
      continue;
    }
    meta.push({
      color: t.color.muted,
      content: line,
      dimColor: true,
      key: `tr-${i}`
    });
  }
  for (const tool of tools) {
    const label_0 = formatToolCall(tool.name, tool.context || "");
    groups.push({
      color: t.color.text,
      key: tool.id,
      label: label_0,
      details: [],
      content: _jsxs(_Fragment, {
        children: [_jsx(Spinner, {
          color: t.color.accent,
          variant: "tool"
        }), " ", label_0, tool.startedAt ? ` (${fmtElapsed(now - tool.startedAt)})` : ""]
      })
    });
  }
  for (const item of activity.slice(-4)) {
    const glyph = item.tone === "error" ? "\u2717" : item.tone === "warn" ? "!" : "\xB7";
    const color = item.tone === "error" ? t.color.error : item.tone === "warn" ? t.color.warn : t.color.muted;
    meta.push({
      color,
      content: `${glyph} ${item.text}`,
      dimColor: item.tone === "info",
      key: `a-${item.id}`
    });
  }
  const hasTools = groups.length > 0;
  const hasSubagents = subagents.length > 0;
  const hasMeta = meta.length > 0;
  const hasThinking = !!cot || reasoningActive || reasoningStreaming;
  const thinkingLive = reasoningActive || reasoningStreaming;
  let t19;
  let tokenCount;
  let toolTokenCount;
  let totalTokenCount;
  if ($[28] !== reasoning || $[29] !== reasoningTokens || $[30] !== toolTokens) {
    tokenCount = reasoningTokens && reasoningTokens > 0 ? reasoningTokens : reasoning ? estimateTokensRough(reasoning) : 0;
    toolTokenCount = toolTokens ?? 0;
    totalTokenCount = tokenCount + toolTokenCount;
    t19 = tokenCount > 0 ? `~${fmtK(tokenCount)} tokens` : null;
    $[28] = reasoning;
    $[29] = reasoningTokens;
    $[30] = toolTokens;
    $[31] = t19;
    $[32] = tokenCount;
    $[33] = toolTokenCount;
    $[34] = totalTokenCount;
  } else {
    t19 = $[31];
    tokenCount = $[32];
    toolTokenCount = $[33];
    totalTokenCount = $[34];
  }
  const thinkingTokensLabel = t19;
  const toolTokensLabel = toolTokens !== undefined && toolTokens > 0 ? `~${fmtK(toolTokens)} tokens` : undefined;
  let t20;
  if ($[35] !== tokenCount || $[36] !== toolTokenCount || $[37] !== totalTokenCount) {
    t20 = tokenCount > 0 && toolTokenCount > 0 ? `~${fmtK(totalTokenCount)} total` : null;
    $[35] = tokenCount;
    $[36] = toolTokenCount;
    $[37] = totalTokenCount;
    $[38] = t20;
  } else {
    t20 = $[38];
  }
  const totalTokensLabel = t20;
  const delegateGroups = groups.filter(_temp9);
  const inlineDelegateKey = hasSubagents && delegateGroups.length === 1 ? delegateGroups[0].key : null;
  const toolLabel = group => {
    const {
      duration,
      label: label_1
    } = splitToolDuration(String(group.content));
    return duration ? _jsxs(_Fragment, {
      children: [label_1, _jsx(Text, {
        color: t.color.statusFg,
        dim: true,
        children: duration
      })]
    }) : group.content;
  };
  const allHidden = visible.thinking === "hidden" && visible.tools === "hidden" && visible.subagents === "hidden" && visible.activity === "hidden";
  if (allHidden) {
    const alerts = activity.filter(_temp0).slice(-2);
    return alerts.length ? _jsx(Box, {
      flexDirection: "column",
      children: alerts.map(i_1 => _jsxs(Text, {
        color: i_1.tone === "error" ? t.color.error : t.color.warn,
        children: [i_1.tone === "error" ? "\u2717" : "!", " ", i_1.text]
      }, `ha-${i_1.id}`))
    }) : null;
  }
  const expandAll = () => {
    if (visible.thinking !== "hidden") {
      setOpenThinking(true);
    }
    if (visible.tools !== "hidden") {
      setOpenTools(true);
    }
    if (visible.subagents !== "hidden") {
      setOpenSubagents(true);
      setDeepSubagents(true);
    }
    if (visible.activity !== "hidden") {
      setOpenMeta(true);
    }
  };
  const metaTone = activity.some(_temp1) ? "error" : activity.some(_temp10) ? "warn" : "dim";
  const renderSubagentList = rails => _jsx(Box, {
    flexDirection: "column",
    children: spawnTree.map((node, index) => _jsx(SubagentAccordion, {
      branch: index === spawnTree.length - 1 ? "last" : "mid",
      expanded: visible.subagents === "expanded" || deepSubagents,
      node,
      peak: spawnPeak,
      rails,
      t
    }, node.item.id))
  });
  const panels = [];
  if (hasThinking && visible.thinking !== "hidden") {
    panels.push({
      header: _jsx(Box, {
        onClick: e => {
          if (e?.shiftKey || e?.ctrlKey) {
            expandAll();
          } else {
            setOpenThinking(_temp11);
          }
        },
        children: _jsxs(Text, {
          color: t.color.muted,
          dim: !thinkingLive,
          children: [_jsx(Text, {
            color: t.color.accent,
            children: openThinking ? "\u25BE " : "\u25B8 "
          }), thinkingLive ? _jsx(Text, {
            bold: true,
            color: t.color.text,
            children: "Thinking"
          }) : _jsx(Text, {
            color: t.color.muted,
            dim: true,
            children: "Thinking"
          }), thinkingTokensLabel ? _jsxs(Text, {
            color: t.color.statusFg,
            dim: true,
            children: ["  ", thinkingTokensLabel]
          }) : null]
        })
      }),
      key: "thinking",
      open: openThinking,
      render: rails_0 => _jsx(Thinking, {
        active: reasoningActive,
        branch: "last",
        mode: "full",
        rails: rails_0,
        reasoning: busy ? reasoning : cot,
        streaming: busy && reasoningStreaming,
        t
      })
    });
  }
  if (hasTools && visible.tools !== "hidden") {
    panels.push({
      header: _jsx(Chevron, {
        count: groups.length,
        onClick: shift => {
          if (shift) {
            expandAll();
          } else {
            setOpenTools(_temp12);
          }
        },
        open: openTools,
        suffix: toolTokensLabel,
        t,
        title: "Tool calls"
      }),
      key: "tools",
      open: openTools,
      render: rails_1 => _jsx(Box, {
        flexDirection: "column",
        children: groups.map((group_0, index_0) => {
          const branch = index_0 === groups.length - 1 ? "last" : "mid";
          const childRails = nextTreeRails(rails_1, branch);
          const hasInlineSubagents = inlineDelegateKey === group_0.key;
          return _jsxs(Box, {
            flexDirection: "column",
            children: [_jsx(TreeTextRow, {
              branch,
              color: group_0.color,
              content: _jsxs(_Fragment, {
                children: [_jsx(Text, {
                  color: t.color.accent,
                  children: "\u25CF "
                }), toolLabel(group_0)]
              }),
              rails: rails_1,
              t
            }), group_0.details.map((detail, detailIndex) => _createElement(Detail, {
              ...detail,
              branch: detailIndex === group_0.details.length - 1 && !hasInlineSubagents ? "last" : "mid",
              key: detail.key,
              rails: childRails,
              t
            })), hasInlineSubagents ? renderSubagentList(childRails) : null]
          }, group_0.key);
        })
      })
    });
  }
  if (hasSubagents && !inlineDelegateKey && visible.subagents !== "hidden") {
    const suffix = spawnSpark ? `${spawnSummaryLabel}  ${spawnSpark}  (/agents)` : `${spawnSummaryLabel}  (/agents)`;
    panels.push({
      header: _jsx(Chevron, {
        count: spawnTotals.descendantCount,
        onClick: shift_0 => {
          if (shift_0) {
            expandAll();
            setDeepSubagents(true);
          } else {
            setOpenSubagents(_temp13);
            setDeepSubagents(false);
          }
        },
        open: openSubagents,
        suffix,
        t,
        title: "Spawn tree"
      }),
      key: "subagents",
      open: openSubagents,
      render: renderSubagentList
    });
  }
  if (hasMeta && visible.activity !== "hidden") {
    panels.push({
      header: _jsx(Chevron, {
        count: meta.length,
        onClick: shift_1 => {
          if (shift_1) {
            expandAll();
          } else {
            setOpenMeta(_temp14);
          }
        },
        open: openMeta,
        t,
        title: "Activity",
        tone: metaTone
      }),
      key: "meta",
      open: openMeta,
      render: rails_2 => _jsx(Box, {
        flexDirection: "column",
        children: meta.map((row_0, index_1) => _jsx(TreeTextRow, {
          branch: index_1 === meta.length - 1 ? "last" : "mid",
          color: row_0.color,
          content: row_0.content,
          dimColor: row_0.dimColor,
          rails: rails_2,
          t
        }, row_0.key))
      })
    });
  }
  const topCount = panels.length + (totalTokensLabel ? 1 : 0);
  return _jsxs(Box, {
    flexDirection: "column",
    children: [panels.map((panel, index_2) => _jsx(TreeNode, {
      branch: index_2 === topCount - 1 ? "last" : "mid",
      header: panel.header,
      open: panel.open,
      t,
      children: panel.render
    }, panel.key)), totalTokensLabel ? _jsx(TreeTextRow, {
      branch: "last",
      color: t.color.statusFg,
      content: _jsxs(_Fragment, {
        children: [_jsx(Text, {
          color: t.color.accent,
          children: "\u03A3 "
        }), totalTokensLabel]
      }),
      dimColor: true,
      t
    }) : null, outcome ? _jsx(Box, {
      marginTop: 1,
      children: _jsxs(Text, {
        color: t.color.muted,
        dim: true,
        children: ["\xB7 ", outcome]
      })
    }) : null]
  });
});
function _temp7(line) {
  return line.replace(/\t/g, "  ");
}
function _temp8() {
  return Date.now();
}
function _temp9(g) {
  return g.label.startsWith("Delegate Task");
}
function _temp0(i_0) {
  return i_0.tone !== "info";
}
function _temp1(i_3) {
  return i_3.tone === "error";
}
function _temp10(i_2) {
  return i_2.tone === "warn";
}
function _temp11(v) {
  return !v;
}
function _temp12(v_0) {
  return !v_0;
}
function _temp13(v_1) {
  return !v_1;
}
function _temp14(v_2) {
  return !v_2;
}