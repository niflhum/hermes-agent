import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput, useStdout } from '@hermes/ink';
import { useEffect, useState } from 'react';
import { asRpcResult, rpcErrorMessage } from '../lib/rpc.js';
import { OverlayHint, useOverlayKeys, windowOffset } from './overlayControls.js';
const VISIBLE = 15;
const MIN_WIDTH = 60;
const MAX_WIDTH = 120;
const age = ts => {
  const d = (Date.now() / 1000 - ts) / 86400;
  if (d < 1) {
    return 'today';
  }
  if (d < 2) {
    return 'yesterday';
  }
  return `${Math.floor(d)}d ago`;
};
export function SessionPicker(t0) {
  const $ = _c(39);
  const {
    gw,
    onCancel,
    onSelect,
    t
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [items, setItems] = useState(t1);
  const [err, setErr] = useState("");
  const [sel, setSel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const {
    stdout
  } = useStdout();
  const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, (stdout?.columns ?? 80) - 6));
  let t2;
  if ($[1] !== onCancel) {
    t2 = {
      onClose: onCancel
    };
    $[1] = onCancel;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  useOverlayKeys(t2);
  let t3;
  let t4;
  if ($[3] !== gw) {
    t3 = () => {
      gw.request("session.list", {
        limit: 200
      }).then(raw => {
        const r = asRpcResult(raw);
        if (!r) {
          setErr("invalid response: session.list");
          setLoading(false);
          return;
        }
        setItems(r.sessions ?? []);
        setErr("");
        setLoading(false);
      }).catch(e => {
        setErr(rpcErrorMessage(e));
        setLoading(false);
      });
    };
    t4 = [gw];
    $[3] = gw;
    $[4] = t3;
    $[5] = t4;
  } else {
    t3 = $[4];
    t4 = $[5];
  }
  useEffect(t3, t4);
  let t5;
  if ($[6] !== deleting || $[7] !== gw || $[8] !== items) {
    t5 = index => {
      const target = items[index];
      if (!target || deleting) {
        return;
      }
      setDeleting(true);
      gw.request("session.delete", {
        session_id: target.id
      }).then(raw_0 => {
        const r_0 = asRpcResult(raw_0);
        if (!r_0 || r_0.deleted !== target.id) {
          setErr("invalid response: session.delete");
          setDeleting(false);
          return;
        }
        setItems(prev => {
          const next = prev.filter((_, i) => i !== index);
          setSel(s => Math.max(0, Math.min(s, next.length - 1)));
          return next;
        });
        setErr("");
        setDeleting(false);
      }).catch(e_0 => {
        setErr(rpcErrorMessage(e_0));
        setDeleting(false);
      });
    };
    $[6] = deleting;
    $[7] = gw;
    $[8] = items;
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  const performDelete = t5;
  let t6;
  if ($[10] !== confirmDelete || $[11] !== deleting || $[12] !== items || $[13] !== onSelect || $[14] !== performDelete || $[15] !== sel) {
    t6 = (ch, key) => {
      if (deleting) {
        return;
      }
      if (confirmDelete !== null) {
        if (ch?.toLowerCase() === "d") {
          const idx = confirmDelete;
          setConfirmDelete(null);
          performDelete(idx);
        } else {
          setConfirmDelete(null);
        }
        return;
      }
      if (key.upArrow && sel > 0) {
        setSel(_temp);
      }
      if (key.downArrow && sel < items.length - 1) {
        setSel(_temp2);
      }
      if (key.return && items[sel]) {
        onSelect(items[sel].id);
        return;
      }
      if (ch?.toLowerCase() === "d" && items[sel]) {
        setConfirmDelete(sel);
        return;
      }
      const n = parseInt(ch);
      if (n >= 1 && n <= Math.min(9, items.length)) {
        onSelect(items[n - 1].id);
      }
    };
    $[10] = confirmDelete;
    $[11] = deleting;
    $[12] = items;
    $[13] = onSelect;
    $[14] = performDelete;
    $[15] = sel;
    $[16] = t6;
  } else {
    t6 = $[16];
  }
  useInput(t6);
  if (loading) {
    let t7;
    if ($[17] !== t.color.muted) {
      t7 = _jsx(Text, {
        color: t.color.muted,
        children: "loading sessions\u2026"
      });
      $[17] = t.color.muted;
      $[18] = t7;
    } else {
      t7 = $[18];
    }
    return t7;
  }
  if (err && !items.length) {
    let t7;
    if ($[19] !== err || $[20] !== t) {
      t7 = _jsxs(Box, {
        flexDirection: "column",
        children: [_jsxs(Text, {
          color: t.color.label,
          children: ["error: ", err]
        }), _jsx(OverlayHint, {
          t,
          children: "Esc/q cancel"
        })]
      });
      $[19] = err;
      $[20] = t;
      $[21] = t7;
    } else {
      t7 = $[21];
    }
    return t7;
  }
  if (!items.length) {
    let t7;
    if ($[22] !== t) {
      t7 = _jsxs(Box, {
        flexDirection: "column",
        children: [_jsx(Text, {
          color: t.color.muted,
          children: "no previous sessions"
        }), _jsx(OverlayHint, {
          t,
          children: "Esc/q cancel"
        })]
      });
      $[22] = t;
      $[23] = t7;
    } else {
      t7 = $[23];
    }
    return t7;
  }
  let t7;
  if ($[24] !== confirmDelete || $[25] !== deleting || $[26] !== err || $[27] !== items || $[28] !== sel || $[29] !== t || $[30] !== width) {
    const offset = windowOffset(items.length, sel, VISIBLE);
    let t8;
    if ($[32] !== confirmDelete || $[33] !== offset || $[34] !== sel || $[35] !== t.color.accent || $[36] !== t.color.label || $[37] !== t.color.muted) {
      t8 = (s_2, vi) => {
        const i_0 = offset + vi;
        const selected = sel === i_0;
        const pendingDelete = confirmDelete === i_0;
        return _jsxs(Box, {
          children: [_jsx(Text, {
            bold: selected,
            color: selected ? t.color.accent : t.color.muted,
            inverse: selected,
            children: selected ? "\u25B8 " : "  "
          }), _jsx(Box, {
            width: 30,
            children: _jsxs(Text, {
              bold: selected,
              color: selected ? t.color.accent : t.color.muted,
              inverse: selected,
              children: [String(i_0 + 1).padStart(2), ". [", s_2.id, "]"]
            })
          }), _jsx(Box, {
            width: 30,
            children: _jsxs(Text, {
              bold: selected,
              color: selected ? t.color.accent : t.color.muted,
              inverse: selected,
              children: ["(", s_2.message_count, " msgs, ", age(s_2.started_at), ", ", s_2.source || "tui", ")"]
            })
          }), _jsx(Text, {
            bold: selected,
            color: pendingDelete ? t.color.label : selected ? t.color.accent : t.color.muted,
            inverse: selected,
            wrap: "truncate-end",
            children: pendingDelete ? "press d again to delete" : s_2.title || s_2.preview || "(untitled)"
          })]
        }, s_2.id);
      };
      $[32] = confirmDelete;
      $[33] = offset;
      $[34] = sel;
      $[35] = t.color.accent;
      $[36] = t.color.label;
      $[37] = t.color.muted;
      $[38] = t8;
    } else {
      t8 = $[38];
    }
    t7 = _jsxs(Box, {
      flexDirection: "column",
      width,
      children: [_jsx(Text, {
        bold: true,
        color: t.color.accent,
        children: "Resume Session"
      }), offset > 0 && _jsxs(Text, {
        color: t.color.muted,
        children: ["  \u2191 ", offset, " more"]
      }), items.slice(offset, offset + VISIBLE).map(t8), offset + VISIBLE < items.length && _jsxs(Text, {
        color: t.color.muted,
        children: ["  \u2193 ", items.length - offset - VISIBLE, " more"]
      }), err && _jsxs(Text, {
        color: t.color.label,
        children: ["error: ", err]
      }), deleting ? _jsx(OverlayHint, {
        t,
        children: "deleting\u2026"
      }) : _jsx(OverlayHint, {
        t,
        children: "\u2191/\u2193 select \xB7 Enter resume \xB7 1-9 quick \xB7 d delete \xB7 Esc/q cancel"
      })]
    });
    $[24] = confirmDelete;
    $[25] = deleting;
    $[26] = err;
    $[27] = items;
    $[28] = sel;
    $[29] = t;
    $[30] = width;
    $[31] = t7;
  } else {
    t7 = $[31];
  }
  return t7;
}
function _temp2(s_1) {
  return s_1 + 1;
}
function _temp(s_0) {
  return s_0 - 1;
}