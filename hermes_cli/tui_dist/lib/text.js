import { HISTORY_RENDER_MAX_CHARS, HISTORY_RENDER_MAX_LINES, LIVE_RENDER_MAX_CHARS, LIVE_RENDER_MAX_LINES, THINKING_COT_MAX } from '../config/limits.js';
import { VERBS } from '../content/verbs.js';
const ESC = String.fromCharCode(27);
const ANSI_RE = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');
const WS_RE = /\s+/g;
export const stripAnsi = s => s.replace(ANSI_RE, '');
export const hasAnsi = s => s.includes(`${ESC}[`) || s.includes(`${ESC}]`);
const renderEstimateLine = line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('|')) {
    return trimmed.split('|').filter(Boolean).map(cell => cell.trim()).join('  ');
  }
  return line.replace(/!\[(.*?)\]\(([^)\s]+)\)/g, '[image: $1]').replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/(?<!\w)__(.+?)__(?!\w)/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1').replace(/~~(.+?)~~/g, '$1').replace(/==(.+?)==/g, '$1').replace(/\[\^([^\]]+)\]/g, '[$1]').replace(/^#{1,6}\s+/, '').replace(/^\s*[-*+]\s+\[( |x|X)\]\s+/, (_m, checked) => `• [${checked.toLowerCase() === 'x' ? 'x' : ' '}] `).replace(/^\s*[-*+]\s+/, '• ').replace(/^\s*(\d+)\.\s+/, '$1. ').replace(/^\s*(?:>\s*)+/, '│ ');
};
export const compactPreview = (s, max) => {
  const one = s.replace(WS_RE, ' ').trim();
  return !one ? '' : one.length > max ? one.slice(0, max - 1) + '…' : one;
};
export const estimateTokensRough = text => !text ? 0 : text.length + 3 >> 2;
export const edgePreview = (s, head = 16, tail = 28) => {
  const one = s.replace(WS_RE, ' ').trim().replace(/\]\]/g, '] ]');
  return !one ? '' : one.length <= head + tail + 4 ? one : `${one.slice(0, head).trimEnd()}.. ${one.slice(-tail).trimStart()}`;
};
export const pasteTokenLabel = (text, lineCount) => {
  const preview = edgePreview(text);
  if (!preview) {
    return `[[ [${fmtK(lineCount)} lines] ]]`;
  }
  const [head = preview, tail = ''] = preview.split('.. ', 2);
  return tail ? `[[ ${head.trimEnd()}.. [${fmtK(lineCount)} lines] .. ${tail.trimStart()} ]]` : `[[ ${preview} [${fmtK(lineCount)} lines] ]]`;
};
const THINKING_STATUS_RE = new RegExp(`^(?:${VERBS.join('|')})\\.{0,3}$`, 'i');
const THINKING_STATUS_CHUNK_RE = new RegExp(`[^A-Za-z\n]+\\s*(?:${VERBS.join('|')})\\.{0,3}\\s*`, 'giu');
export const cleanThinkingText = reasoning => reasoning.split('\n').map(line => line.replace(THINKING_STATUS_CHUNK_RE, '').trim()).filter(line => line && !THINKING_STATUS_RE.test(line.replace(/\.\.\.$/, '').trim())).join('\n').replace(/([^\n])(?=\*\*[^*\n][^\n]*?\*\*)/g, '$1\n\n').replace(/\n{3,}/g, '\n\n').trim();
export const thinkingPreview = (reasoning, mode, max = THINKING_COT_MAX) => {
  const raw = cleanThinkingText(reasoning);
  return !raw || mode === 'collapsed' ? '' : mode === 'full' ? raw : compactPreview(raw.replace(WS_RE, ' '), max);
};
export const boundedLiveRenderText = (text, {
  maxChars = LIVE_RENDER_MAX_CHARS,
  maxLines = LIVE_RENDER_MAX_LINES
} = {}) => boundedRenderText(text, 'showing live tail', {
  maxChars,
  maxLines
});
export const boundedHistoryRenderText = (text, {
  maxChars = HISTORY_RENDER_MAX_CHARS,
  maxLines = HISTORY_RENDER_MAX_LINES
} = {}) => boundedRenderText(text, 'showing tail', {
  maxChars,
  maxLines
});
const boundedRenderText = (text, labelPrefix, {
  maxChars,
  maxLines
}) => {
  if (text.length <= maxChars && text.split('\n', maxLines + 1).length <= maxLines) {
    return text;
  }
  let start = 0;
  let idx = text.length;
  for (let seen = 0; seen < maxLines && idx > 0; seen++) {
    idx = text.lastIndexOf('\n', idx - 1);
    start = idx < 0 ? 0 : idx + 1;
    if (idx < 0) {
      break;
    }
  }
  const lineStart = start;
  start = Math.max(lineStart, text.length - maxChars);
  if (start > lineStart) {
    const nextBreak = text.indexOf('\n', start);
    if (nextBreak >= 0 && nextBreak < text.length - 1) {
      start = nextBreak + 1;
    }
  }
  const tail = text.slice(start).trimStart();
  const omittedLines = countNewlines(text, start);
  const omittedChars = Math.max(0, text.length - tail.length);
  const label = omittedLines > 0 ? `[${labelPrefix}; omitted ${fmtK(omittedLines)} lines / ${fmtK(omittedChars)} chars]\n` : `[${labelPrefix}; omitted ${fmtK(omittedChars)} chars]\n`;
  return `${label}${tail}`;
};
const countNewlines = (text, end) => {
  let count = 0;
  for (let i = 0; i < end; i++) {
    if (text.charCodeAt(i) === 10) {
      count++;
    }
  }
  return count;
};
export const stripTrailingPasteNewlines = text => /[^\n]/.test(text) ? text.replace(/\n+$/, '') : text;
export const toolTrailLabel = name => name.split('_').filter(Boolean).map(p => p[0].toUpperCase() + p.slice(1)).join(' ') || name;
export const formatToolCall = (name, context = '') => {
  const label = toolTrailLabel(name);
  const preview = compactPreview(context, 64);
  return preview ? `${label}("${preview}")` : label;
};
export const buildToolTrailLine = (name, context, error, note, duration) => {
  const detail = compactPreview(note ?? '', 72);
  const took = duration !== undefined ? ` (${duration.toFixed(1)}s)` : '';
  return `${formatToolCall(name, context)}${took}${detail ? ` :: ${detail}` : ''} ${error ? '✗' : '✓'}`;
};
export const isToolTrailResultLine = line => line.endsWith(' ✓') || line.endsWith(' ✗');
export const parseToolTrailResultLine = line => {
  if (!isToolTrailResultLine(line)) {
    return null;
  }
  const mark = line.endsWith(' ✗') ? '✗' : '✓';
  const body = line.slice(0, -2);
  const [call, detail] = body.split(' :: ', 2);
  if (detail != null) {
    return {
      call,
      detail,
      mark
    };
  }
  const legacy = body.indexOf(': ');
  if (legacy > 0) {
    return {
      call: body.slice(0, legacy),
      detail: body.slice(legacy + 2),
      mark
    };
  }
  return {
    call: body,
    detail: '',
    mark
  };
};
export const splitToolDuration = call => {
  const match = call.match(/^(.*?)( \(\d+(?:\.\d)?s\))$/);
  return match ? {
    label: match[1],
    duration: match[2]
  } : {
    label: call,
    duration: ''
  };
};
export const isTransientTrailLine = line => line.startsWith('drafting ') || line === 'analyzing tool output…';
export const sameToolTrailGroup = (label, entry) => entry === `${label} ✓` || entry === `${label} ✗` || entry.startsWith(`${label}(`) || entry.startsWith(`${label} ::`) || entry.startsWith(`${label}:`);
export const lastCotTrailIndex = trail => {
  for (let i = trail.length - 1; i >= 0; i--) {
    if (!isToolTrailResultLine(trail[i])) {
      return i;
    }
  }
  return -1;
};
export const estimateRows = (text, w, compact = false) => {
  let fence = null;
  let rows = 0;
  for (const raw of text.split('\n')) {
    const line = stripAnsi(raw);
    const maybeFence = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (maybeFence) {
      const marker = maybeFence[1];
      const lang = maybeFence[2].trim();
      if (!fence) {
        fence = {
          char: marker[0],
          len: marker.length
        };
        if (lang) {
          rows += Math.ceil((`─ ${lang}`.length || 1) / w);
        }
      } else if (marker[0] === fence.char && marker.length >= fence.len) {
        fence = null;
      }
      continue;
    }
    const inCode = Boolean(fence);
    const trimmed = line.trim();
    if (!inCode && trimmed.startsWith('|') && /^[|\s:-]+$/.test(trimmed)) {
      continue;
    }
    const rendered = inCode ? line : renderEstimateLine(line);
    if (compact && !rendered.trim()) {
      continue;
    }
    rows += Math.ceil((rendered.length || 1) / w);
  }
  return Math.max(1, rows);
};
export const flat = r => Object.values(r).flat();
const COMPACT_NUMBER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  notation: 'compact'
});
export const fmtK = n => COMPACT_NUMBER.format(n).replace(/[KMBT]$/, s => s.toLowerCase());
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const isPasteBackedText = text => /\[\[paste:\d+(?:[^\n]*?)\]\]|\[paste #\d+ (?:attached|excerpt)(?:[^\n]*?)\]/.test(text);