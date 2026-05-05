import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import * as Ink from '@hermes/ink';
import { useEffect, useMemo, useRef, useState } from 'react';
import { setInputSelection } from '../app/inputSelectionStore.js';
import { readClipboardText, writeClipboardText } from '../lib/clipboard.js';
import { cursorLayout, offsetFromPosition } from '../lib/inputMetrics.js';
import { isActionMod, isMac, isMacActionFallback } from '../lib/platform.js';
const ink = Ink;
const {
  Box,
  Text,
  useStdin,
  useInput,
  useStdout,
  stringWidth,
  useDeclaredCursor,
  useTerminalFocus
} = ink;
const ESC = '\x1b';
const INV = `${ESC}[7m`;
const INV_OFF = `${ESC}[27m`;
const DIM = `${ESC}[2m`;
const DIM_OFF = `${ESC}[22m`;
const FWD_DEL_RE = new RegExp(`${ESC}\\[3(?:[~$^]|;)`);
const PRINTABLE = /^[ -~\u00a0-\uffff]+$/;
const BRACKET_PASTE = new RegExp(`${ESC}?\\[20[01]~`, 'g');
const MULTI_CLICK_MS = 500;
const invert = s => INV + s + INV_OFF;
const dim = s => DIM + s + DIM_OFF;
let _seg = null;
const seg = () => _seg ??= new Intl.Segmenter(undefined, {
  granularity: 'grapheme'
});
const STOP_CACHE_MAX = 32;
const stopCache = new Map();
function graphemeStops(s) {
  const hit = stopCache.get(s);
  if (hit) {
    return hit;
  }
  const stops = [0];
  for (const {
    index
  } of seg().segment(s)) {
    if (index > 0) {
      stops.push(index);
    }
  }
  if (stops.at(-1) !== s.length) {
    stops.push(s.length);
  }
  stopCache.set(s, stops);
  if (stopCache.size > STOP_CACHE_MAX) {
    const oldest = stopCache.keys().next().value;
    if (oldest !== undefined) {
      stopCache.delete(oldest);
    }
  }
  return stops;
}
function snapPos(s, p) {
  const pos = Math.max(0, Math.min(p, s.length));
  let last = 0;
  for (const stop of graphemeStops(s)) {
    if (stop > pos) {
      break;
    }
    last = stop;
  }
  return last;
}
function prevPos(s, p) {
  const pos = snapPos(s, p);
  let prev = 0;
  for (const stop of graphemeStops(s)) {
    if (stop >= pos) {
      return prev;
    }
    prev = stop;
  }
  return prev;
}
function nextPos(s, p) {
  const pos = snapPos(s, p);
  for (const stop of graphemeStops(s)) {
    if (stop > pos) {
      return stop;
    }
  }
  return s.length;
}
function wordLeft(s, p) {
  let i = snapPos(s, p) - 1;
  while (i > 0 && /\s/.test(s[i])) {
    i--;
  }
  while (i > 0 && !/\s/.test(s[i - 1])) {
    i--;
  }
  return Math.max(0, i);
}
function wordRight(s, p) {
  let i = snapPos(s, p);
  while (i < s.length && !/\s/.test(s[i])) {
    i++;
  }
  while (i < s.length && /\s/.test(s[i])) {
    i++;
  }
  return i;
}
/**
 * Move cursor one logical line up or down inside `s` while preserving the
 * column offset from the current line's start. Returns `null` when the cursor
 * is already on the first line (up) or last line (down) — callers use that
 * signal to fall through to history cycling instead of eating the arrow key.
 */
export function lineNav(s, p, dir) {
  const pos = snapPos(s, p);
  const curStart = s.lastIndexOf('\n', pos - 1) + 1;
  const col = pos - curStart;
  if (dir < 0) {
    if (curStart === 0) {
      return null;
    }
    const prevStart = s.lastIndexOf('\n', curStart - 2) + 1;
    return snapPos(s, Math.min(prevStart + col, curStart - 1));
  }
  const nextBreak = s.indexOf('\n', pos);
  if (nextBreak < 0) {
    return null;
  }
  const nextEnd = s.indexOf('\n', nextBreak + 1);
  const lineEnd = nextEnd < 0 ? s.length : nextEnd;
  return snapPos(s, Math.min(nextBreak + 1 + col, lineEnd));
}
export { offsetFromPosition };
function renderWithCursor(value, cursor) {
  const pos = Math.max(0, Math.min(cursor, value.length));
  let out = '',
    done = false;
  for (const {
    segment,
    index
  } of seg().segment(value)) {
    if (!done && index >= pos) {
      out += invert(index === pos && segment !== '\n' ? segment : ' ');
      done = true;
      if (index === pos && segment !== '\n') {
        continue;
      }
    }
    out += segment;
  }
  return done ? out : out + invert(' ');
}
function renderWithSelection(value, start, end) {
  if (start >= end) {
    return value;
  }
  return value.slice(0, start) + invert(value.slice(start, end) || ' ') + value.slice(end);
}
function useFwdDelete(active) {
  const $ = _c(4);
  const ref = useRef(false);
  const {
    inputEmitter: ee
  } = useStdin();
  let t0;
  let t1;
  if ($[0] !== active || $[1] !== ee) {
    t0 = () => {
      if (!active) {
        return;
      }
      const h = d => {
        ref.current = FWD_DEL_RE.test(d);
      };
      ee.prependListener("input", h);
      return () => {
        ee.removeListener("input", h);
      };
    };
    t1 = [active, ee];
    $[0] = active;
    $[1] = ee;
    $[2] = t0;
    $[3] = t1;
  } else {
    t0 = $[2];
    t1 = $[3];
  }
  useEffect(t0, t1);
  return ref;
}
const isPasteResultPromise = value => !!value && typeof value.then === 'function';
export function TextInput({
  columns = 80,
  value,
  onChange,
  onPaste,
  onSubmit,
  mask,
  mouseApiRef,
  placeholder = '',
  focus = true
}) {
  const [cur, setCur] = useState(value.length);
  const [sel, setSel] = useState(null);
  const fwdDel = useFwdDelete(focus);
  const termFocus = useTerminalFocus();
  const {
    stdout
  } = useStdout();
  const curRef = useRef(cur);
  const selRef = useRef(null);
  const vRef = useRef(value);
  const self = useRef(false);
  const pasteBuf = useRef('');
  const pasteEnd = useRef(null);
  const pasteTimer = useRef(null);
  const pastePos = useRef(0);
  const editVersionRef = useRef(0);
  const parentChangeTimer = useRef(null);
  const pendingParentValue = useRef(null);
  const localRenderTimer = useRef(null);
  const lineWidthRef = useRef(stringWidth(value.includes('\n') ? value.slice(value.lastIndexOf('\n') + 1) : value));
  const mouseAnchorRef = useRef(null);
  const lastClickRef = useRef({
    at: 0,
    offset: -1
  });
  const undo = useRef([]);
  const redo = useRef([]);
  const cbChange = useRef(onChange);
  const cbSubmit = useRef(onSubmit);
  const cbPaste = useRef(onPaste);
  cbChange.current = onChange;
  cbSubmit.current = onSubmit;
  cbPaste.current = onPaste;
  const raw = self.current ? vRef.current : value;
  const display = mask ? raw.replace(/[^\n]/g, mask[0] ?? '*') : raw;
  const selected = useMemo(() => sel && sel.start !== sel.end ? {
    end: Math.max(sel.start, sel.end),
    start: Math.min(sel.start, sel.end)
  } : null, [sel]);
  const layout = useMemo(() => cursorLayout(display, cur, columns), [columns, cur, display]);
  const boxRef = useDeclaredCursor({
    line: layout.line,
    column: layout.column,
    active: focus && termFocus && !selected
  });
  // Hide the hardware cursor while a selection is active (prevents
  // auto-wrap onto the next row when inverted text fills the column
  // exactly) or when the terminal loses focus (suppresses the hollow-rect
  // ghost most terminals draw at the parked position).
  const hideHardwareCursor = focus && !!stdout?.isTTY && (!!selected || !termFocus);
  useEffect(() => {
    if (!hideHardwareCursor || !stdout) {
      return;
    }
    stdout.write('\x1b[?25l');
    return () => {
      stdout.write('\x1b[?25h');
    };
  }, [hideHardwareCursor, stdout]);
  const nativeCursor = focus && termFocus && !selected && !!stdout?.isTTY;
  // Placeholder text is just a hint, not a selection — render it dim
  // without inverse styling. In a TTY the hardware cursor parks at column
  // 0 and visually marks the input start. Non-TTY surfaces still need the
  // synthetic inverse first-char to draw a cursor at all.
  const rendered = useMemo(() => {
    if (!focus) {
      return display || dim(placeholder);
    }
    if (!display && placeholder) {
      return nativeCursor ? dim(placeholder) : invert(placeholder[0] ?? ' ') + dim(placeholder.slice(1));
    }
    if (selected) {
      return renderWithSelection(display, selected.start, selected.end);
    }
    return nativeCursor ? display || ' ' : renderWithCursor(display, cur);
  }, [cur, display, focus, nativeCursor, placeholder, selected]);
  useEffect(() => {
    if (self.current) {
      self.current = false;
    } else {
      setCur(value.length);
      setSel(null);
      curRef.current = value.length;
      selRef.current = null;
      vRef.current = value;
      lineWidthRef.current = stringWidth(value.includes('\n') ? value.slice(value.lastIndexOf('\n') + 1) : value);
      undo.current = [];
      redo.current = [];
    }
  }, [value]);
  useEffect(() => {
    if (!focus) {
      return;
    }
    const dropSel = () => {
      if (!selRef.current) {
        return;
      }
      selRef.current = null;
      setSel(null);
    };
    setInputSelection({
      clear: dropSel,
      collapseToEnd: () => {
        dropSel();
        setCur(vRef.current.length);
        curRef.current = vRef.current.length;
      },
      end: selected?.end ?? curRef.current,
      start: selected?.start ?? curRef.current,
      value: vRef.current
    });
    return () => setInputSelection(null);
  }, [cur, focus, selected]);
  useEffect(() => () => {
    if (pasteTimer.current) {
      clearTimeout(pasteTimer.current);
    }
    if (parentChangeTimer.current) {
      clearTimeout(parentChangeTimer.current);
    }
    if (localRenderTimer.current) {
      clearTimeout(localRenderTimer.current);
    }
  }, []);
  const flushParentChange = () => {
    if (parentChangeTimer.current) {
      clearTimeout(parentChangeTimer.current);
      parentChangeTimer.current = null;
    }
    const next = pendingParentValue.current;
    pendingParentValue.current = null;
    if (next !== null) {
      self.current = true;
      cbChange.current(next);
    }
  };
  const scheduleParentChange = next_0 => {
    pendingParentValue.current = next_0;
    if (parentChangeTimer.current) {
      return;
    }
    parentChangeTimer.current = setTimeout(flushParentChange, 16);
  };
  const cancelLocalRender = () => {
    if (localRenderTimer.current) {
      clearTimeout(localRenderTimer.current);
      localRenderTimer.current = null;
    }
  };
  const scheduleLocalRender = () => {
    if (localRenderTimer.current) {
      return;
    }
    localRenderTimer.current = setTimeout(() => {
      localRenderTimer.current = null;
      setCur(curRef.current);
    }, 16);
  };
  const canFastEchoBase = () => focus && termFocus && !selected && !mask && !!stdout?.isTTY;
  const canFastAppend = (current, cursor, text) => {
    const sw = stringWidth(text);
    return canFastEchoBase() && cursor === current.length && current.length > 0 && !current.includes('\n') && sw === text.length && lineWidthRef.current + sw < Math.max(1, columns);
  };
  const canFastBackspace = (current_0, cursor_0) => {
    if (!canFastEchoBase() || cursor_0 !== current_0.length || cursor_0 <= 0 || current_0.includes('\n')) {
      return false;
    }
    return stringWidth(current_0.slice(prevPos(current_0, cursor_0), cursor_0)) === 1;
  };
  const commit = (next_1, nextCur, track = true, syncParent = true, syncLocal = true, nextLineWidth) => {
    const prev = vRef.current;
    const c = snapPos(next_1, nextCur);
    editVersionRef.current += 1;
    if (selRef.current) {
      selRef.current = null;
      setSel(null);
    }
    if (track && next_1 !== prev) {
      undo.current.push({
        cursor: curRef.current,
        value: prev
      });
      if (undo.current.length > 200) {
        undo.current.shift();
      }
      redo.current = [];
    }
    if (syncLocal) {
      cancelLocalRender();
      setCur(c);
    } else {
      scheduleLocalRender();
    }
    curRef.current = c;
    vRef.current = next_1;
    lineWidthRef.current = nextLineWidth ?? stringWidth(next_1.includes('\n') ? next_1.slice(next_1.lastIndexOf('\n') + 1) : next_1);
    if (next_1 !== prev) {
      if (syncParent) {
        flushParentChange();
        self.current = true;
        cbChange.current(next_1);
      } else {
        self.current = true;
        scheduleParentChange(next_1);
      }
    }
  };
  const swap = (from, to) => {
    const entry = from.current.pop();
    if (!entry) {
      return;
    }
    to.current.push({
      cursor: curRef.current,
      value: vRef.current
    });
    commit(entry.value, entry.cursor, false);
  };
  const emitPaste = e => {
    const startVersion = editVersionRef.current;
    const h = cbPaste.current?.(e);
    if (isPasteResultPromise(h)) {
      const fallbackText = e.text;
      void h.then(result => {
        if (result && editVersionRef.current === startVersion) {
          commit(result.value, result.cursor);
        } else if (result && fallbackText && PRINTABLE.test(fallbackText)) {
          // User typed while async paste was in-flight — fall back to raw text insert
          // so the pasted content is not silently lost.
          const cur_0 = curRef.current;
          const v = vRef.current;
          commit(v.slice(0, cur_0) + fallbackText + v.slice(cur_0), cur_0 + fallbackText.length);
        }
      }).catch(() => {});
      return true;
    }
    if (h) {
      commit(h.value, h.cursor);
    }
    return !!h;
  };
  const flushPaste = () => {
    const text_0 = pasteBuf.current;
    const at = pastePos.current;
    const end = pasteEnd.current ?? at;
    pasteBuf.current = '';
    pasteEnd.current = null;
    pasteTimer.current = null;
    if (!text_0) {
      return;
    }
    if (!emitPaste({
      cursor: at,
      text: text_0,
      value: vRef.current
    }) && PRINTABLE.test(text_0)) {
      commit(vRef.current.slice(0, at) + text_0 + vRef.current.slice(end), at + text_0.length);
    }
  };
  const clearSel = () => {
    if (!selRef.current) {
      return;
    }
    selRef.current = null;
    setSel(null);
  };
  const selectAll = () => {
    const end_0 = vRef.current.length;
    if (!end_0) {
      return;
    }
    const next_2 = {
      end: end_0,
      start: 0
    };
    selRef.current = next_2;
    setSel(next_2);
    setCur(end_0);
    curRef.current = end_0;
  };
  const moveCursor = (next_3, extend = false) => {
    const c_0 = snapPos(vRef.current, next_3);
    const anchor = selRef.current?.start ?? curRef.current;
    if (!extend || anchor === c_0) {
      clearSel();
    } else {
      const nextSel = {
        end: c_0,
        start: anchor
      };
      selRef.current = nextSel;
      setSel(nextSel);
    }
    setCur(c_0);
    curRef.current = c_0;
  };
  const selRange = () => {
    const range = selRef.current;
    return range && range.start !== range.end ? {
      end: Math.max(range.start, range.end),
      start: Math.min(range.start, range.end)
    } : null;
  };
  const ins = (v_0, c_1, s) => v_0.slice(0, c_1) + s + v_0.slice(c_1);
  const pastePlainText = text_1 => {
    const cleaned = text_1.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (!cleaned) {
      return;
    }
    const range_0 = selRange();
    const nextValue = range_0 ? vRef.current.slice(0, range_0.start) + cleaned + vRef.current.slice(range_0.end) : vRef.current.slice(0, curRef.current) + cleaned + vRef.current.slice(curRef.current);
    const nextCursor = range_0 ? range_0.start + cleaned.length : curRef.current + cleaned.length;
    commit(nextValue, nextCursor);
  };
  const startMouseSelection = next_4 => {
    const c_2 = snapPos(vRef.current, next_4);
    mouseAnchorRef.current = c_2;
    selRef.current = {
      end: c_2,
      start: c_2
    };
    setSel(null);
    setCur(c_2);
    curRef.current = c_2;
  };
  const dragMouseSelection = next_5 => {
    if (mouseAnchorRef.current === null) {
      return;
    }
    const c_3 = snapPos(vRef.current, next_5);
    const range_1 = {
      end: c_3,
      start: mouseAnchorRef.current
    };
    selRef.current = range_1;
    setSel(range_1.start === range_1.end ? null : range_1);
    setCur(c_3);
    curRef.current = c_3;
  };
  const endMouseSelection = () => {
    mouseAnchorRef.current = null;
    const range_2 = selRef.current;
    if (range_2 && range_2.start === range_2.end) {
      selRef.current = null;
      setSel(null);
      return;
    }
    const normalized = selRange();
    if (isMac && normalized) {
      void writeClipboardText(vRef.current.slice(normalized.start, normalized.end));
    }
  };
  const offsetAt = e_0 => offsetFromPosition(display, e_0.localRow ?? 0, e_0.localCol ?? 0, columns);
  const isMultiClickAt = offset => {
    const now = Date.now();
    const last = lastClickRef.current;
    lastClickRef.current = {
      at: now,
      offset
    };
    return now - last.at < MULTI_CLICK_MS && offset === last.offset;
  };
  if (mouseApiRef) {
    mouseApiRef.current = {
      dragAt: (row, col) => dragMouseSelection(offsetFromPosition(display, row, col, columns)),
      end: endMouseSelection,
      startAtBeginning: () => startMouseSelection(0)
    };
  }
  useInput((inp, k, event) => {
    const eventRaw = event.keypress.raw;
    if (eventRaw === '\x1bv' || eventRaw === '\x1bV' || eventRaw === '\x16' || isMac && isActionMod(k) && inp.toLowerCase() === 'v') {
      if (cbPaste.current) {
        return void emitPaste({
          cursor: curRef.current,
          hotkey: true,
          text: '',
          value: vRef.current
        });
      }
      if (isMac) {
        void readClipboardText().then(text_2 => {
          if (text_2) {
            pastePlainText(text_2);
          }
        });
      }
      return;
    }
    if (isMac && isActionMod(k) && inp.toLowerCase() === 'c') {
      const range_3 = selRange();
      if (range_3) {
        const text_3 = vRef.current.slice(range_3.start, range_3.end);
        void writeClipboardText(text_3);
      }
      return;
    }
    if (k.upArrow || k.downArrow) {
      const next_6 = lineNav(vRef.current, curRef.current, k.upArrow ? -1 : 1);
      if (next_6 !== null) {
        moveCursor(next_6, k.shift);
        return;
      }
      return;
    }
    // Ctrl chords claimed by useInputHandlers — pass through instead of
    // letting them fall into readline-style nav or a literal char insert.
    // Ctrl+B = voice toggle, Ctrl+X = delete queued message while editing.
    if (k.ctrl && inp === 'c' || k.ctrl && inp === 'b' || k.ctrl && inp === 'x' || k.tab || k.shift && k.tab || k.pageUp || k.pageDown || k.escape) {
      return;
    }
    if (k.return) {
      if (k.shift || k.ctrl || (isMac ? isActionMod(k) : k.meta)) {
        flushParentChange();
        commit(ins(vRef.current, curRef.current, '\n'), curRef.current + 1);
      } else {
        flushParentChange();
        cbSubmit.current?.(vRef.current);
      }
      return;
    }
    let c_4 = curRef.current;
    let v_1 = vRef.current;
    const mod = isActionMod(k);
    const wordMod = mod || k.meta;
    const actionHome = k.home || !isMac && mod && inp === 'a' || isMacActionFallback(k, inp, 'a');
    const actionEnd = k.end || mod && inp === 'e' || isMacActionFallback(k, inp, 'e');
    const actionDeleteToStart = mod && inp === 'u' || isMacActionFallback(k, inp, 'u');
    const actionKillToEnd = mod && inp === 'k' || isMacActionFallback(k, inp, 'k');
    const actionDeleteWord = mod && inp === 'w' || isMacActionFallback(k, inp, 'w');
    const range_4 = selRange();
    const delFwd = k.delete || fwdDel.current;
    if (mod && inp === 'z') {
      return swap(undo, redo);
    }
    if (mod && inp === 'y' || mod && k.shift && inp === 'z') {
      return swap(redo, undo);
    }
    if (isMac && mod && inp === 'a') {
      return selectAll();
    }
    if (actionHome) {
      c_4 = 0;
      moveCursor(c_4, k.shift);
      return;
    } else if (actionEnd) {
      c_4 = v_1.length;
      moveCursor(c_4, k.shift);
      return;
    } else if (k.leftArrow) {
      if (range_4 && !wordMod && !k.shift) {
        clearSel();
        c_4 = range_4.start;
      } else {
        c_4 = wordMod ? wordLeft(v_1, c_4) : prevPos(v_1, c_4);
      }
      moveCursor(c_4, k.shift);
      return;
    } else if (k.rightArrow) {
      if (range_4 && !wordMod && !k.shift) {
        clearSel();
        c_4 = range_4.end;
      } else {
        c_4 = wordMod ? wordRight(v_1, c_4) : nextPos(v_1, c_4);
      }
      moveCursor(c_4, k.shift);
      return;
    } else if (wordMod && inp === 'b') {
      clearSel();
      c_4 = wordLeft(v_1, c_4);
    } else if (wordMod && inp === 'f') {
      clearSel();
      c_4 = wordRight(v_1, c_4);
    } else if (range_4 && (k.backspace || delFwd)) {
      v_1 = v_1.slice(0, range_4.start) + v_1.slice(range_4.end);
      c_4 = range_4.start;
    } else if (k.backspace && c_4 > 0) {
      if (wordMod) {
        const t = wordLeft(v_1, c_4);
        v_1 = v_1.slice(0, t) + v_1.slice(c_4);
        c_4 = t;
      } else if (canFastBackspace(v_1, c_4)) {
        const t_0 = prevPos(v_1, c_4);
        v_1 = v_1.slice(0, t_0) + v_1.slice(c_4);
        c_4 = t_0;
        stdout.write('\b \b');
        commit(v_1, c_4, true, false, false, Math.max(0, lineWidthRef.current - 1));
        return;
      } else {
        const t_1 = prevPos(v_1, c_4);
        v_1 = v_1.slice(0, t_1) + v_1.slice(c_4);
        c_4 = t_1;
      }
    } else if (delFwd && c_4 < v_1.length) {
      if (wordMod) {
        const t_2 = wordRight(v_1, c_4);
        v_1 = v_1.slice(0, c_4) + v_1.slice(t_2);
      } else {
        v_1 = v_1.slice(0, c_4) + v_1.slice(nextPos(v_1, c_4));
      }
    } else if (actionDeleteWord) {
      if (range_4) {
        v_1 = v_1.slice(0, range_4.start) + v_1.slice(range_4.end);
        c_4 = range_4.start;
      } else if (c_4 > 0) {
        clearSel();
        const t_3 = wordLeft(v_1, c_4);
        v_1 = v_1.slice(0, t_3) + v_1.slice(c_4);
        c_4 = t_3;
      } else {
        return;
      }
    } else if (actionDeleteToStart) {
      if (range_4) {
        v_1 = v_1.slice(0, range_4.start) + v_1.slice(range_4.end);
        c_4 = range_4.start;
      } else {
        v_1 = v_1.slice(c_4);
        c_4 = 0;
      }
    } else if (actionKillToEnd) {
      if (range_4) {
        v_1 = v_1.slice(0, range_4.start) + v_1.slice(range_4.end);
        c_4 = range_4.start;
      } else {
        v_1 = v_1.slice(0, c_4);
      }
    } else if (event.keypress.isPasted || inp.length > 0) {
      const bracketed = event.keypress.isPasted || inp.includes('[200~');
      const text_4 = inp.replace(BRACKET_PASTE, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      if (bracketed && emitPaste({
        bracketed: true,
        cursor: c_4,
        text: text_4,
        value: v_1
      })) {
        return;
      }
      if (!text_4) {
        return;
      }
      if (text_4 === '\n') {
        return commit(ins(v_1, c_4, '\n'), c_4 + 1);
      }
      if (text_4.length > 1 || text_4.includes('\n')) {
        if (!pasteBuf.current) {
          pastePos.current = range_4 ? range_4.start : c_4;
          pasteEnd.current = range_4 ? range_4.end : pastePos.current;
        }
        pasteBuf.current += text_4;
        if (pasteTimer.current) {
          clearTimeout(pasteTimer.current);
        }
        pasteTimer.current = setTimeout(flushPaste, 50);
        return;
      }
      if (PRINTABLE.test(text_4)) {
        if (range_4) {
          v_1 = v_1.slice(0, range_4.start) + text_4 + v_1.slice(range_4.end);
          c_4 = range_4.start + text_4.length;
        } else {
          const simpleAppend = canFastAppend(v_1, c_4, text_4);
          v_1 = v_1.slice(0, c_4) + text_4 + v_1.slice(c_4);
          c_4 += text_4.length;
          if (simpleAppend) {
            stdout.write(text_4);
            commit(v_1, c_4, true, false, false, lineWidthRef.current + stringWidth(text_4));
            return;
          }
        }
      } else {
        return;
      }
    } else {
      return;
    }
    commit(v_1, c_4);
  }, {
    isActive: focus
  });
  return _jsx(Box, {
    onClick: e_1 => {
      if (!focus) {
        return;
      }
      e_1.stopImmediatePropagation?.();
      clearSel();
      const next_7 = offsetAt(e_1);
      setCur(next_7);
      curRef.current = next_7;
    },
    onMouseDown: e_2 => {
      if (!focus) {
        return;
      }
      // Right-click → route through the same path as Alt+V so the composer
      // clipboard RPC (text or image) handles it.
      if (e_2.button === 2) {
        e_2.stopImmediatePropagation?.();
        emitPaste({
          cursor: curRef.current,
          hotkey: true,
          text: '',
          value: vRef.current
        });
        return;
      }
      if (e_2.button !== 0) {
        return;
      }
      e_2.stopImmediatePropagation?.();
      const offset_0 = offsetAt(e_2);
      if (isMultiClickAt(offset_0)) {
        mouseAnchorRef.current = null;
        selectAll();
        return;
      }
      startMouseSelection(offset_0);
    },
    onMouseDrag: e_3 => {
      if (!focus || e_3.button !== 0 || mouseAnchorRef.current === null) {
        return;
      }
      e_3.stopImmediatePropagation?.();
      dragMouseSelection(offsetAt(e_3));
    },
    onMouseUp: e_4 => {
      e_4.stopImmediatePropagation?.();
      endMouseSelection();
    },
    ref: boxRef,
    width: columns,
    children: _jsx(Text, {
      wrap: "wrap",
      children: rendered
    })
  });
}