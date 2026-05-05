import { c as _c } from "react/compiler-runtime";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text, useInput } from '@hermes/ink';
import { useState } from 'react';
import { isMac } from '../lib/platform.js';
import { TextInput } from './textInput.js';
const OPTS = ['once', 'session', 'always', 'deny'];
const LABELS = {
  always: 'Always allow',
  deny: 'Deny',
  once: 'Allow once',
  session: 'Allow this session'
};
const CMD_PREVIEW_LINES = 10;
export function ApprovalPrompt(t0) {
  const $ = _c(16);
  const {
    onChoice,
    req,
    t
  } = t0;
  const [sel, setSel] = useState(0);
  let t1;
  if ($[0] !== onChoice || $[1] !== sel) {
    t1 = (ch, key) => {
      if (key.upArrow && sel > 0) {
        setSel(_temp);
      }
      if (key.downArrow && sel < OPTS.length - 1) {
        setSel(_temp2);
      }
      const n = parseInt(ch, 10);
      if (n >= 1 && n <= OPTS.length) {
        onChoice(OPTS[n - 1]);
        return;
      }
      if (key.return) {
        onChoice(OPTS[sel]);
      }
    };
    $[0] = onChoice;
    $[1] = sel;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  useInput(t1);
  let t2;
  if ($[3] !== req.command || $[4] !== req.description || $[5] !== sel || $[6] !== t.color.muted || $[7] !== t.color.text || $[8] !== t.color.warn) {
    const rawLines = req.command.split("\n");
    const shown = rawLines.slice(0, CMD_PREVIEW_LINES);
    const overflow = rawLines.length - shown.length;
    let t3;
    if ($[10] !== t.color.text) {
      t3 = (line, i) => _jsx(Text, {
        color: t.color.text,
        wrap: "truncate-end",
        children: line || " "
      }, i);
      $[10] = t.color.text;
      $[11] = t3;
    } else {
      t3 = $[11];
    }
    let t4;
    if ($[12] !== sel || $[13] !== t.color.muted || $[14] !== t.color.warn) {
      t4 = (o, i_0) => _jsx(Text, {
        children: _jsxs(Text, {
          bold: sel === i_0,
          color: sel === i_0 ? t.color.warn : t.color.muted,
          inverse: sel === i_0,
          children: [sel === i_0 ? "\u25B8 " : "  ", i_0 + 1, ". ", LABELS[o]]
        })
      }, o);
      $[12] = sel;
      $[13] = t.color.muted;
      $[14] = t.color.warn;
      $[15] = t4;
    } else {
      t4 = $[15];
    }
    t2 = _jsxs(Box, {
      borderColor: t.color.warn,
      borderStyle: "double",
      flexDirection: "column",
      paddingX: 1,
      children: [_jsxs(Text, {
        bold: true,
        color: t.color.warn,
        children: ["\u26A0 approval required \xB7 ", req.description]
      }), _jsxs(Box, {
        flexDirection: "column",
        paddingLeft: 1,
        children: [shown.map(t3), overflow > 0 ? _jsxs(Text, {
          color: t.color.muted,
          children: ["\u2026 +", overflow, " more line", overflow === 1 ? "" : "s", " (full text above)"]
        }) : null]
      }), _jsx(Text, {}), OPTS.map(t4), _jsx(Text, {
        color: t.color.muted,
        children: "\u2191/\u2193 select \xB7 Enter confirm \xB7 1-4 quick pick \xB7 Ctrl+C deny"
      })]
    });
    $[3] = req.command;
    $[4] = req.description;
    $[5] = sel;
    $[6] = t.color.muted;
    $[7] = t.color.text;
    $[8] = t.color.warn;
    $[9] = t2;
  } else {
    t2 = $[9];
  }
  return t2;
}
function _temp2(s_0) {
  return s_0 + 1;
}
function _temp(s) {
  return s - 1;
}
export function ClarifyPrompt(t0) {
  const {
    cols: t1,
    onAnswer,
    onCancel,
    req,
    t
  } = t0;
  const cols = t1 === undefined ? 80 : t1;
  const [sel, setSel] = useState(0);
  const [custom, setCustom] = useState("");
  const [typing, setTyping] = useState(false);
  const choices = req.choices ?? [];
  const heading = _jsxs(Text, {
    bold: true,
    children: [_jsx(Text, {
      color: t.color.accent,
      children: "ask"
    }), _jsxs(Text, {
      color: t.color.text,
      children: [" ", req.question]
    })]
  });
  useInput((ch, key) => {
    if (key.escape) {
      typing && choices.length ? setTyping(false) : onCancel();
      return;
    }
    if (typing || !choices.length) {
      return;
    }
    if (key.upArrow && sel > 0) {
      setSel(_temp3);
    }
    if (key.downArrow && sel < choices.length) {
      setSel(_temp4);
    }
    if (key.return) {
      sel === choices.length ? setTyping(true) : choices[sel] && onAnswer(choices[sel]);
    }
    const n = parseInt(ch);
    if (n >= 1 && n <= choices.length) {
      onAnswer(choices[n - 1]);
    }
  });
  if (typing || !choices.length) {
    return _jsxs(Box, {
      flexDirection: "column",
      children: [heading, _jsxs(Box, {
        children: [_jsx(Text, {
          color: t.color.label,
          children: "> "
        }), _jsx(TextInput, {
          columns: Math.max(20, cols - 6),
          onChange: setCustom,
          onSubmit: onAnswer,
          value: custom
        })]
      }), _jsxs(Text, {
        color: t.color.muted,
        children: ["Enter send \xB7 Esc ", choices.length ? "back" : "cancel", " \xB7", " ", isMac ? "Cmd+C copy \xB7 Cmd+V paste \xB7 Ctrl+C cancel" : "Ctrl+C cancel"]
      })]
    });
  }
  return _jsxs(Box, {
    flexDirection: "column",
    children: [heading, [...choices, "Other (type your answer)"].map((c, i) => _jsx(Text, {
      children: _jsxs(Text, {
        bold: sel === i,
        color: sel === i ? t.color.label : t.color.muted,
        inverse: sel === i,
        children: [sel === i ? "\u25B8 " : "  ", i + 1, ". ", c]
      })
    }, i)), _jsxs(Text, {
      color: t.color.muted,
      children: ["\u2191/\u2193 select \xB7 Enter confirm \xB7 1-", choices.length, " quick pick \xB7 Esc/Ctrl+C cancel"]
    })]
  });
}
function _temp4(s_0) {
  return s_0 + 1;
}
function _temp3(s) {
  return s - 1;
}
export function ConfirmPrompt(t0) {
  const $ = _c(15);
  const {
    onCancel,
    onConfirm,
    req,
    t
  } = t0;
  const [sel, setSel] = useState(0);
  let t1;
  if ($[0] !== onCancel || $[1] !== onConfirm || $[2] !== sel) {
    t1 = (ch, key) => {
      const lower = ch.toLowerCase();
      if (key.escape || key.ctrl && lower === "c" || lower === "n") {
        return onCancel();
      }
      if (lower === "y") {
        return onConfirm();
      }
      if (key.upArrow) {
        setSel(0);
      }
      if (key.downArrow) {
        setSel(1);
      }
      if (key.return) {
        sel === 0 ? onCancel() : onConfirm();
      }
    };
    $[0] = onCancel;
    $[1] = onConfirm;
    $[2] = sel;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  useInput(t1);
  const accent = req.danger ? t.color.error : t.color.warn;
  const t2 = req.cancelLabel ?? "No";
  let t3;
  if ($[4] !== accent || $[5] !== req.confirmLabel || $[6] !== req.danger || $[7] !== req.detail || $[8] !== req.title || $[9] !== sel || $[10] !== t.color.error || $[11] !== t.color.muted || $[12] !== t.color.text || $[13] !== t2) {
    const rows = [{
      color: t.color.text,
      label: t2
    }, {
      color: req.danger ? t.color.error : t.color.text,
      label: req.confirmLabel ?? "Yes"
    }];
    t3 = _jsxs(Box, {
      borderColor: accent,
      borderStyle: "double",
      flexDirection: "column",
      paddingX: 1,
      children: [_jsxs(Text, {
        bold: true,
        color: accent,
        children: [req.danger ? "\u26A0" : "?", " ", req.title]
      }), req.detail ? _jsx(Box, {
        paddingLeft: 1,
        children: _jsx(Text, {
          color: t.color.text,
          wrap: "truncate-end",
          children: req.detail
        })
      }) : null, _jsx(Text, {}), rows.map((row, i) => _jsxs(Text, {
        children: [_jsx(Text, {
          color: sel === i ? accent : t.color.muted,
          children: sel === i ? "\u25B8 " : "  "
        }), _jsx(Text, {
          color: sel === i ? row.color : t.color.muted,
          children: row.label
        })]
      }, row.label)), _jsx(Text, {
        color: t.color.muted,
        children: "\u2191/\u2193 select \xB7 Enter confirm \xB7 Y/N quick \xB7 Esc cancel"
      })]
    });
    $[4] = accent;
    $[5] = req.confirmLabel;
    $[6] = req.danger;
    $[7] = req.detail;
    $[8] = req.title;
    $[9] = sel;
    $[10] = t.color.error;
    $[11] = t.color.muted;
    $[12] = t.color.text;
    $[13] = t2;
    $[14] = t3;
  } else {
    t3 = $[14];
  }
  return t3;
}