import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text } from '@hermes/ink';
import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import { $uiState } from '../app/uiStore.js';
import { fmtK } from '../lib/text.js';
function fmtCost(n) {
  if (n == null || n === 0) return '';
  if (n < 0.01) return '<$0.01';
  return `$${n.toFixed(2)}`;
}
function contextBar(pct, t) {
  if (pct == null || pct <= 0) return '';
  const block = pct > 80 ? '█' : pct > 60 ? '▓' : pct > 40 ? '▒' : '░';
  const w = Math.max(1, Math.min(10, Math.round(pct / 10)));
  return block.repeat(w);
}
export function TokenHUD(t0) {
  const $ = _c(26);
  const {
    t
  } = t0;
  const ui = useStore($uiState);
  const usage = ui.usage;
  const model = ui.info?.model ?? "";
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      input: 0,
      output: 0,
      total: 0,
      cost_usd: undefined,
      context_max: undefined,
      context_used: undefined,
      calls: 0
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const prev = useRef(t1);
  const [pulse, setPulse] = useState(false);
  let t2;
  let t3;
  if ($[1] !== usage.calls || $[2] !== usage.context_max || $[3] !== usage.context_used || $[4] !== usage.cost_usd || $[5] !== usage.input || $[6] !== usage.output || $[7] !== usage.total) {
    t2 = () => {
      const snap = {
        input: usage.input,
        output: usage.output,
        total: usage.total,
        cost_usd: usage.cost_usd,
        context_max: usage.context_max,
        context_used: usage.context_used,
        calls: usage.calls
      };
      const changed = snap.input !== prev.current.input || snap.output !== prev.current.output || snap.total !== prev.current.total || snap.context_max !== prev.current.context_max || snap.context_used !== prev.current.context_used || snap.cost_usd !== prev.current.cost_usd || snap.calls !== prev.current.calls;
      if (changed) {
        setPulse(true);
        const t_0 = setTimeout(() => setPulse(false), 600);
        prev.current = snap;
        return () => clearTimeout(t_0);
      }
      prev.current = snap;
    };
    t3 = [usage.input, usage.output, usage.total, usage.cost_usd, usage.context_max, usage.context_used, usage.calls];
    $[1] = usage.calls;
    $[2] = usage.context_max;
    $[3] = usage.context_used;
    $[4] = usage.cost_usd;
    $[5] = usage.input;
    $[6] = usage.output;
    $[7] = usage.total;
    $[8] = t2;
    $[9] = t3;
  } else {
    t2 = $[8];
    t3 = $[9];
  }
  useEffect(t2, t3);
  if (!model) {
    return null;
  }
  const pct = usage.context_percent;
  let t4;
  if ($[10] !== model || $[11] !== pct || $[12] !== pulse || $[13] !== t || $[14] !== usage.calls || $[15] !== usage.context_max || $[16] !== usage.context_used || $[17] !== usage.cost_usd || $[18] !== usage.input || $[19] !== usage.output || $[20] !== usage.total) {
    const bar = contextBar(pct, t);
    const barColor = pct != null ? pct > 80 ? t.color.error : pct > 60 ? t.color.warn : t.color.ok : t.color.border;
    let t5;
    if ($[22] !== usage.context_max || $[23] !== usage.context_used || $[24] !== usage.total) {
      t5 = usage.context_max ? `${fmtK(usage.context_used ?? 0)}/${fmtK(usage.context_max)}` : usage.total > 0 ? `${fmtK(usage.total)} tok` : "";
      $[22] = usage.context_max;
      $[23] = usage.context_used;
      $[24] = usage.total;
      $[25] = t5;
    } else {
      t5 = $[25];
    }
    const ctxLabel = t5;
    const cost = fmtCost(usage.cost_usd);
    const entryColor = pulse ? t.color.primary : t.color.muted;
    t4 = _jsx(Box, {
      flexShrink: 0,
      height: 1,
      children: _jsxs(Text, {
        color: t.color.border,
        children: ["\u2501 ", _jsx(Text, {
          color: pulse ? t.color.accent : t.color.muted,
          children: model
        }), _jsxs(Text, {
          color: t.color.muted,
          children: [" \u2502 ", _jsxs(Text, {
            color: entryColor,
            children: ["in ", fmtK(usage.input)]
          }), " \xB7 ", _jsxs(Text, {
            color: entryColor,
            children: ["out ", fmtK(usage.output)]
          }), usage.total > 0 ? _jsxs(_Fragment, {
            children: [" \xB7 ", _jsxs(Text, {
              color: entryColor,
              children: ["tot ", fmtK(usage.total)]
            })]
          }) : null]
        }), ctxLabel ? _jsxs(Text, {
          color: t.color.muted,
          children: [" \u2502 ", _jsx(Text, {
            color: entryColor,
            children: ctxLabel
          }), bar ? _jsxs(Text, {
            children: [" ", _jsxs(Text, {
              color: barColor,
              children: ["[", bar, "]"]
            }), pct != null ? _jsxs(Text, {
              color: barColor,
              children: [" ", pct, "%"]
            }) : null]
          }) : null]
        }) : bar ? _jsxs(Text, {
          color: t.color.muted,
          children: [" \u2502 ", _jsxs(Text, {
            color: barColor,
            children: ["[", bar, "]"]
          }), pct != null ? _jsxs(Text, {
            color: barColor,
            children: [" ", pct, "%"]
          }) : null]
        }) : null, cost ? _jsxs(Text, {
          color: t.color.muted,
          children: [" \u2502 ", _jsx(Text, {
            color: entryColor,
            children: cost
          })]
        }) : null, usage.calls > 0 ? _jsxs(Text, {
          color: t.color.muted,
          children: [" \u2502 ", _jsxs(Text, {
            color: entryColor,
            children: [usage.calls, " call", usage.calls !== 1 ? "s" : ""]
          })]
        }) : null, " \u2501"]
      })
    });
    $[10] = model;
    $[11] = pct;
    $[12] = pulse;
    $[13] = t;
    $[14] = usage.calls;
    $[15] = usage.context_max;
    $[16] = usage.context_used;
    $[17] = usage.cost_usd;
    $[18] = usage.input;
    $[19] = usage.output;
    $[20] = usage.total;
    $[21] = t4;
  } else {
    t4 = $[21];
  }
  return t4;
}