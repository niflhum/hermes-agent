import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Link, Text } from '@hermes/ink';
import { Fragment, memo, useMemo } from 'react';
import { ensureEmojiPresentation } from '../lib/emoji.js';
import { BOX_CLOSE, BOX_OPEN, texToUnicode } from '../lib/mathUnicode.js';
import { highlightLine, isHighlightable } from '../lib/syntax.js';
// `\boxed{X}` regions in `texToUnicode` output are marked with the
// non-printable U+0001 / U+0002 sentinels. Split on them and render the
// boxed segment with `inverse + bold` so it reads as a highlighter-pen
// emphasis on top of whatever color the parent `<Text>` is using (the
// theme accent for math). The leading / trailing space inside the
// highlight gives a one-cell visual margin so the highlight reads as a
// block, not a hug.
const renderMath = text => {
  if (!text.includes(BOX_OPEN)) {
    return text;
  }
  const out = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const start = text.indexOf(BOX_OPEN, i);
    if (start < 0) {
      out.push(text.slice(i));
      break;
    }
    if (start > i) {
      out.push(text.slice(i, start));
    }
    const end = text.indexOf(BOX_CLOSE, start + 1);
    if (end < 0) {
      out.push(text.slice(start));
      break;
    }
    out.push(_jsxs(Text, {
      bold: true,
      inverse: true,
      children: [' ', text.slice(start + 1, end), ' ']
    }, key++));
    i = end + 1;
  }
  return out;
};
const FENCE_RE = /^\s*(`{3,}|~{3,})(.*)$/;
const FENCE_CLOSE_RE = /^\s*(`{3,}|~{3,})\s*$/;
const HR_RE = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const HEADING_RE = /^\s{0,3}(#{1,6})\s+(.*?)(?:\s+#+\s*)?$/;
const SETEXT_RE = /^\s{0,3}(=+|-+)\s*$/;
const FOOTNOTE_RE = /^\[\^([^\]]+)\]:\s*(.*)$/;
const DEF_RE = /^\s*:\s+(.+)$/;
const BULLET_RE = /^(\s*)[-+*]\s+(.*)$/;
const TASK_RE = /^\[( |x|X)\]\s+(.*)$/;
const NUMBERED_RE = /^(\s*)(\d+)[.)]\s+(.*)$/;
const QUOTE_RE = /^\s*(?:>\s*)+/;
const TABLE_DIVIDER_CELL_RE = /^:?-{3,}:?$/;
const MD_URL_RE = '((?:[^\\s()]|\\([^\\s()]*\\))+?)';
// Display math openers: `$$ ... $$` (TeX) and `\[ ... \]` (LaTeX). The
// opener is matched only when `$$` / `\[` appears at the very start of the
// trimmed line — `startsWith('$$')` used to fire on prose like
// `$$x+y$$ followed by more`, opening a block that never closed because the
// trailing `$$` on the same line was invisible to the close-scan loop.
const MATH_BLOCK_OPEN_RE = /^\s*(\$\$|\\\[)(.*)$/;
const MATH_BLOCK_CLOSE_DOLLAR_RE = /^(.*?)\$\$\s*$/;
const MATH_BLOCK_CLOSE_BRACKET_RE = /^(.*?)\\\]\s*$/;
export const MEDIA_LINE_RE = /^\s*[`"']?MEDIA:\s*(\S+?)[`"']?\s*$/;
export const AUDIO_DIRECTIVE_RE = /^\s*\[\[audio_as_voice\]\]\s*$/;
// Inline markdown tokens, in priority order. The outer regex picks the
// leftmost match at each position, preferring earlier alternatives on tie —
// so `**` must come before `*`, `__` before `_`, etc. Each pattern owns its
// own capture groups; MdInline dispatches on which group matched.
//
// Subscript (`~x~`) is restricted to short alphanumeric runs so prose like
// `thing ~! more ~?` from Kimi / Qwen / GLM (kaomoji-style decorators)
// doesn't pair up the first `~` with the next one on the line and swallow
// the text between them as a dim `_`-prefixed span.
//
// Inline math (`$x$` and `\(x\)`) takes precedence over emphasis at the
// same start position because regex alternation is leftmost-first; a
// dollar-delimited span at column N wins over a `*` at column N+1, so
// `$P=a*b*c$` renders as math instead of having `*b*` corrupted into
// italics. Single-character minimums and "no space adjacent to delimiter"
// rules keep currency prose like `$5 to $10` from being swallowed.
export const INLINE_RE = new RegExp([`!\\[(.*?)\\]\\(${MD_URL_RE}\\)`,
// 1,2  image
`\\[(.+?)\\]\\(${MD_URL_RE}\\)`,
// 3,4  link
`<((?:https?:\\/\\/|mailto:)[^>\\s]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,})>`,
// 5   autolink
`~~(.+?)~~`,
// 6    strike
`\`([^\\\`]+)\``,
// 7    code
`\\*\\*(.+?)\\*\\*`,
// 8    bold *
`(?<!\\w)__(.+?)__(?!\\w)`,
// 9    bold _
`\\*(.+?)\\*`,
// 10   italic *
`(?<!\\w)_(.+?)_(?!\\w)`,
// 11   italic _
`==(.+?)==`,
// 12   highlight
`\\[\\^([^\\]]+)\\]`,
// 13   footnote ref
`\\^([^^\\s][^^]*?)\\^`,
// 14   superscript
`~([A-Za-z0-9]{1,8})~`,
// 15   subscript
`(https?:\\/\\/[^\\s<]+)`,
// 16   bare URL — wrapped so it owns its own
//                                capture group; without this, the math
//                                spans below would land in m[16] and the
//                                MdInline dispatcher would treat them as
//                                bare URLs and render them as autolinks.
`(?<!\\$)\\$([^\\s$](?:[^$\\n]*?[^\\s$])?)\\$(?!\\$)`,
// 17   inline math $...$
`\\\\\\(([^\\n]+?)\\\\\\)` // 18   inline math \(...\)
].join('|'), 'g');
const indentDepth = s => Math.floor(s.replace(/\t/g, '  ').length / 2);
const splitRow = row => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
const isTableDivider = row => {
  const cells = splitRow(row);
  return cells.length > 1 && cells.every(c => TABLE_DIVIDER_CELL_RE.test(c));
};
const autolinkUrl = raw => raw.startsWith('mailto:') || raw.startsWith('http') || !raw.includes('@') ? raw : `mailto:${raw}`;
const renderAutolink = (k, t, raw) => _jsx(Link, {
  url: autolinkUrl(raw),
  children: _jsx(Text, {
    color: t.color.accent,
    underline: true,
    children: raw.replace(/^mailto:/, '')
  })
}, k);
export const stripInlineMarkup = v => v.replace(/!\[(.*?)\]\(((?:[^\s()]|\([^\s()]*\))+?)\)/g, '[image: $1] $2').replace(/\[(.+?)\]\(((?:[^\s()]|\([^\s()]*\))+?)\)/g, '$1').replace(/<((?:https?:\/\/|mailto:)[^>\s]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})>/g, '$1').replace(/~~(.+?)~~/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/(?<!\w)__(.+?)__(?!\w)/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1').replace(/==(.+?)==/g, '$1').replace(/\[\^([^\]]+)\]/g, '[$1]').replace(/\^([^^\s][^^]*?)\^/g, '^$1').replace(/~([A-Za-z0-9]{1,8})~/g, '_$1').replace(/(?<!\$)\$([^\s$](?:[^$\n]*?[^\s$])?)\$(?!\$)/g, '$1').replace(/\\\(([^\n]+?)\\\)/g, '$1');
const renderTable = (k, rows, t) => {
  const widths = rows[0].map((_, ci) => Math.max(...rows.map(r => stripInlineMarkup(r[ci] ?? '').length)));
  // Thin divider under the header.  Without it tables look like prose
  // with extra spacing because the header is just accent-coloured text
  // (#15534).  We avoid full borders on purpose — column widths come
  // from `stripInlineMarkup(...).length` (UTF-16 code units, not
  // display width), so a real outline often misaligns on emoji and
  // East-Asian wide characters; one dim solid rule (`─`) under row 0
  // plus tab-style column gaps reads cleanly on every terminal we
  // tested.
  const sep = widths.map(w => '─'.repeat(Math.max(1, w))).join('  ');
  return _jsx(Box, {
    flexDirection: "column",
    paddingLeft: 2,
    children: rows.map((row, ri) => _jsxs(Fragment, {
      children: [_jsx(Box, {
        children: widths.map((w, ci) => _jsxs(Text, {
          bold: ri === 0,
          color: ri === 0 ? t.color.accent : undefined,
          children: [_jsx(MdInline, {
            t: t,
            text: row[ci] ?? ''
          }), ' '.repeat(Math.max(0, w - stripInlineMarkup(row[ci] ?? '').length)), ci < widths.length - 1 ? '  ' : '']
        }, ci))
      }), ri === 0 && rows.length > 1 ? _jsx(Text, {
        color: t.color.muted,
        dimColor: true,
        children: sep
      }) : null]
    }, ri))
  }, k);
};
function MdInline({
  t,
  text
}) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    const i = m.index ?? 0;
    const k = parts.length;
    if (i > last) {
      parts.push(_jsx(Text, {
        children: text.slice(last, i)
      }, k));
    }
    if (m[1] && m[2]) {
      parts.push(_jsxs(Text, {
        color: t.color.muted,
        children: ["[image: ", m[1], "] ", m[2]]
      }, parts.length));
    } else if (m[3] && m[4]) {
      parts.push(_jsx(Link, {
        url: m[4],
        children: _jsx(Text, {
          color: t.color.accent,
          underline: true,
          children: m[3]
        })
      }, parts.length));
    } else if (m[5]) {
      parts.push(renderAutolink(parts.length, t, m[5]));
    } else if (m[6]) {
      parts.push(_jsx(Text, {
        strikethrough: true,
        children: _jsx(MdInline, {
          t: t,
          text: m[6]
        })
      }, parts.length));
    } else if (m[7]) {
      // Code is the one wrap that does NOT recurse — inline `code` spans
      // are verbatim by definition. Letting MdInline reprocess them
      // would corrupt regex examples and shell snippets.
      parts.push(_jsx(Text, {
        color: t.color.accent,
        dimColor: true,
        children: m[7]
      }, parts.length));
    } else if (m[8] ?? m[9]) {
      // Recurse into bold / italic / strike / highlight so nested
      // `$...$` math (and other inline tokens) inside a `**bolded
      // statement with $\mathbb{Z}$ math**` actually render. Without
      // this the inner content is dropped into a single `<Text bold>`
      // verbatim and the math renderer never sees it.
      parts.push(_jsx(Text, {
        bold: true,
        children: _jsx(MdInline, {
          t: t,
          text: m[8] ?? m[9]
        })
      }, parts.length));
    } else if (m[10] ?? m[11]) {
      parts.push(_jsx(Text, {
        italic: true,
        children: _jsx(MdInline, {
          t: t,
          text: m[10] ?? m[11]
        })
      }, parts.length));
    } else if (m[12]) {
      parts.push(_jsx(Text, {
        backgroundColor: t.color.diffAdded,
        color: t.color.diffAddedWord,
        children: _jsx(MdInline, {
          t: t,
          text: m[12]
        })
      }, parts.length));
    } else if (m[13]) {
      parts.push(_jsxs(Text, {
        color: t.color.muted,
        children: ["[", m[13], "]"]
      }, parts.length));
    } else if (m[14]) {
      parts.push(_jsxs(Text, {
        color: t.color.muted,
        children: ["^", m[14]]
      }, parts.length));
    } else if (m[15]) {
      parts.push(_jsxs(Text, {
        color: t.color.muted,
        children: ["_", m[15]]
      }, parts.length));
    } else if (m[16]) {
      // Bare URL — trim trailing prose punctuation into a sibling text node
      // so `see https://x.com/, which…` keeps the comma outside the link.
      const url = m[16].replace(/[),.;:!?]+$/g, '');
      parts.push(renderAutolink(parts.length, t, url));
      if (url.length < m[16].length) {
        parts.push(_jsx(Text, {
          children: m[16].slice(url.length)
        }, parts.length));
      }
    } else if (m[17] ?? m[18]) {
      // Inline math is run through `texToUnicode` (Greek letters, ℕℤℚℝ,
      // operators, sub/superscripts, fractions) and rendered in italic
      // accent. Italic is the disambiguator — links use accent+underline,
      // so without italic readers can't tell `\mathbb{R}` (math) from a
      // hyperlinked word. Anything `texToUnicode` doesn't recognise is
      // preserved verbatim, so unfamiliar commands just look like their
      // raw LaTeX rather than vanishing.
      parts.push(_jsx(Text, {
        color: t.color.accent,
        italic: true,
        children: renderMath(texToUnicode(m[17] ?? m[18]))
      }, parts.length));
    }
    last = i + m[0].length;
  }
  if (last < text.length) {
    parts.push(_jsx(Text, {
      children: text.slice(last)
    }, parts.length));
  }
  return _jsx(Text, {
    children: parts.length ? parts : _jsx(Text, {
      children: text
    })
  });
}
// Cross-instance parsed-children cache: useMemo's per-instance cache dies
// on remount, so virtualization re-parses every row that scrolls back into
// view. Theme-keyed WeakMap drops stale palettes; inner Map is LRU-bounded.
const MD_CACHE_LIMIT = 512;
const mdCache = new WeakMap();
const cacheBucket = t => {
  const b = mdCache.get(t);
  if (b) {
    return b;
  }
  const fresh = new Map();
  mdCache.set(t, fresh);
  return fresh;
};
const cacheGet = (b, key) => {
  const v = b.get(key);
  if (v) {
    b.delete(key);
    b.set(key, v);
  }
  return v;
};
const cacheSet = (b, key, v) => {
  b.set(key, v);
  if (b.size > MD_CACHE_LIMIT) {
    b.delete(b.keys().next().value);
  }
};
function MdImpl({
  compact,
  t,
  text
}) {
  const nodes_0 = useMemo(() => {
    const bucket = cacheBucket(t);
    const cacheKey = `${compact ? '1' : '0'}|${text}`;
    const cached = cacheGet(bucket, cacheKey);
    if (cached) {
      return cached;
    }
    const lines = ensureEmojiPresentation(text).split('\n');
    const nodes = [];
    let prevKind = null;
    let i = 0;
    const gap = () => {
      if (nodes.length && prevKind !== 'blank') {
        nodes.push(_jsx(Text, {
          children: " "
        }, `gap-${nodes.length}`));
        prevKind = 'blank';
      }
    };
    const start = kind => {
      if (prevKind && prevKind !== 'blank' && prevKind !== kind) {
        gap();
      }
      prevKind = kind;
    };
    while (i < lines.length) {
      const line = lines[i];
      const key = nodes.length;
      if (!line.trim()) {
        if (!compact) {
          gap();
        }
        i++;
        continue;
      }
      if (AUDIO_DIRECTIVE_RE.test(line)) {
        i++;
        continue;
      }
      const media = line.match(MEDIA_LINE_RE)?.[1];
      if (media) {
        start('paragraph');
        nodes.push(_jsxs(Text, {
          color: t.color.muted,
          children: ['▸ ', _jsx(Link, {
            url: /^(?:\/|[a-z]:[\\/])/i.test(media) ? `file://${media}` : media,
            children: _jsx(Text, {
              color: t.color.accent,
              underline: true,
              children: media
            })
          })]
        }, key));
        i++;
        continue;
      }
      const fence = line.match(FENCE_RE);
      if (fence) {
        const char = fence[1][0];
        const len = fence[1].length;
        const lang = fence[2].trim().toLowerCase();
        const block = [];
        for (i++; i < lines.length; i++) {
          const close = lines[i].match(FENCE_CLOSE_RE)?.[1];
          if (close && close[0] === char && close.length >= len) {
            break;
          }
          block.push(lines[i]);
        }
        if (i < lines.length) {
          i++;
        }
        if (['md', 'markdown'].includes(lang)) {
          start('paragraph');
          nodes.push(_jsx(Md, {
            compact: compact,
            t: t,
            text: block.join('\n')
          }, key));
          continue;
        }
        start('code');
        const isDiff = lang === 'diff';
        const highlighted = !isDiff && isHighlightable(lang);
        nodes.push(_jsxs(Box, {
          flexDirection: "column",
          paddingLeft: 2,
          children: [lang && !isDiff && _jsx(Text, {
            color: t.color.muted,
            children: '─ ' + lang
          }), block.map((l, j) => {
            if (highlighted) {
              return _jsx(Text, {
                children: highlightLine(l, lang, t).map(([color, text_0], kk) => color ? _jsx(Text, {
                  color: color,
                  children: text_0
                }, kk) : _jsx(Text, {
                  children: text_0
                }, kk))
              }, j);
            }
            const add = isDiff && l.startsWith('+');
            const del = isDiff && l.startsWith('-');
            const hunk = isDiff && l.startsWith('@@');
            return _jsx(Text, {
              backgroundColor: add ? t.color.diffAdded : del ? t.color.diffRemoved : undefined,
              color: add ? t.color.diffAddedWord : del ? t.color.diffRemovedWord : hunk ? t.color.muted : undefined,
              dimColor: isDiff && !add && !del && !hunk && l.startsWith(' '),
              children: l
            }, j);
          })]
        }, key));
        continue;
      }
      const mathOpen = line.match(MATH_BLOCK_OPEN_RE);
      if (mathOpen) {
        const opener = mathOpen[1];
        const closeRe = opener === '$$' ? MATH_BLOCK_CLOSE_DOLLAR_RE : MATH_BLOCK_CLOSE_BRACKET_RE;
        const headRest = mathOpen[2] ?? '';
        const block_0 = [];
        // Single-line block: `$$x + y = z$$` or `\[x\]`. Capture inner content
        // and emit the block immediately. Without this, the close-scan loop
        // skips line `i` and treats the next opener as our closer, swallowing
        // every paragraph in between.
        const sameLineClose = headRest.match(closeRe);
        if (sameLineClose) {
          const inner = sameLineClose[1].trim();
          start('code');
          nodes.push(_jsx(Box, {
            flexDirection: "column",
            paddingLeft: 2,
            children: inner ? _jsx(Text, {
              color: t.color.accent,
              children: renderMath(texToUnicode(inner))
            }) : null
          }, key));
          i++;
          continue;
        }
        // Multi-line block: scan ahead for a real closer before committing.
        // If none exists in the rest of the document, render this line as a
        // paragraph instead of consuming everything that follows.
        let closeIdx = -1;
        for (let j_0 = i + 1; j_0 < lines.length; j_0++) {
          if (closeRe.test(lines[j_0])) {
            closeIdx = j_0;
            break;
          }
        }
        if (closeIdx < 0) {
          start('paragraph');
          nodes.push(_jsx(MdInline, {
            t: t,
            text: line
          }, key));
          i++;
          continue;
        }
        if (headRest.trim()) {
          block_0.push(headRest);
        }
        for (let j_1 = i + 1; j_1 < closeIdx; j_1++) {
          block_0.push(lines[j_1]);
        }
        const tail = lines[closeIdx].match(closeRe)[1].trimEnd();
        if (tail.trim()) {
          block_0.push(tail);
        }
        start('code');
        nodes.push(_jsx(Box, {
          flexDirection: "column",
          paddingLeft: 2,
          children: block_0.map((l_0, j_2) => _jsx(Text, {
            color: t.color.accent,
            children: renderMath(texToUnicode(l_0))
          }, j_2))
        }, key));
        i = closeIdx + 1;
        continue;
      }
      const heading = line.match(HEADING_RE)?.[2];
      if (heading) {
        start('heading');
        nodes.push(_jsx(Text, {
          bold: true,
          color: t.color.accent,
          children: _jsx(MdInline, {
            t: t,
            text: heading
          })
        }, key));
        i++;
        continue;
      }
      if (i + 1 < lines.length && SETEXT_RE.test(lines[i + 1])) {
        start('heading');
        nodes.push(_jsx(Text, {
          bold: true,
          color: t.color.accent,
          children: _jsx(MdInline, {
            t: t,
            text: line.trim()
          })
        }, key));
        i += 2;
        continue;
      }
      if (HR_RE.test(line)) {
        start('rule');
        nodes.push(_jsx(Text, {
          color: t.color.muted,
          children: '─'.repeat(36)
        }, key));
        i++;
        continue;
      }
      const footnote = line.match(FOOTNOTE_RE);
      if (footnote) {
        start('list');
        nodes.push(_jsxs(Text, {
          color: t.color.muted,
          children: ["[", footnote[1], "] ", _jsx(MdInline, {
            t: t,
            text: footnote[2] ?? ''
          })]
        }, key));
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) {
          nodes.push(_jsx(Box, {
            paddingLeft: 2,
            children: _jsx(Text, {
              color: t.color.muted,
              children: _jsx(MdInline, {
                t: t,
                text: lines[i].trim()
              })
            })
          }, `${key}-cont-${i}`));
          i++;
        }
        continue;
      }
      if (i + 1 < lines.length && DEF_RE.test(lines[i + 1])) {
        start('list');
        nodes.push(_jsx(Text, {
          bold: true,
          children: line.trim()
        }, key));
        i++;
        while (i < lines.length) {
          const def = lines[i].match(DEF_RE)?.[1];
          if (!def) {
            break;
          }
          nodes.push(_jsxs(Text, {
            children: [_jsx(Text, {
              color: t.color.muted,
              children: " \u00B7 "
            }), _jsx(MdInline, {
              t: t,
              text: def
            })]
          }, `${key}-def-${i}`));
          i++;
        }
        continue;
      }
      const bullet = line.match(BULLET_RE);
      if (bullet) {
        start('list');
        const task = bullet[2].match(TASK_RE);
        const marker = task ? task[1].toLowerCase() === 'x' ? '☑' : '☐' : '•';
        nodes.push(_jsxs(Text, {
          children: [_jsxs(Text, {
            color: t.color.muted,
            children: [' '.repeat(indentDepth(bullet[1]) * 2), marker, ' ']
          }), _jsx(MdInline, {
            t: t,
            text: task ? task[2] : bullet[2]
          })]
        }, key));
        i++;
        continue;
      }
      const numbered = line.match(NUMBERED_RE);
      if (numbered) {
        start('list');
        nodes.push(_jsxs(Text, {
          children: [_jsxs(Text, {
            color: t.color.muted,
            children: [' '.repeat(indentDepth(numbered[1]) * 2), numbered[2], ".", ' ']
          }), _jsx(MdInline, {
            t: t,
            text: numbered[3]
          })]
        }, key));
        i++;
        continue;
      }
      if (QUOTE_RE.test(line)) {
        start('quote');
        const quoteLines = [];
        while (i < lines.length && QUOTE_RE.test(lines[i])) {
          const prefix = lines[i].match(QUOTE_RE)?.[0] ?? '';
          quoteLines.push({
            depth: (prefix.match(/>/g) ?? []).length,
            text: lines[i].slice(prefix.length)
          });
          i++;
        }
        nodes.push(_jsx(Box, {
          flexDirection: "column",
          children: quoteLines.map((ql, qi) => _jsxs(Text, {
            color: t.color.muted,
            children: [' '.repeat(Math.max(0, ql.depth - 1) * 2), '│ ', _jsx(MdInline, {
              t: t,
              text: ql.text
            })]
          }, qi))
        }, key));
        continue;
      }
      if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
        start('table');
        const rows = [splitRow(line)];
        for (i += 2; i < lines.length && lines[i].includes('|') && lines[i].trim(); i++) {
          rows.push(splitRow(lines[i]));
        }
        nodes.push(renderTable(key, rows, t));
        continue;
      }
      if (/^<\/?details\b/i.test(line)) {
        i++;
        continue;
      }
      const summary = line.match(/^<summary>(.*?)<\/summary>$/i)?.[1];
      if (summary) {
        start('paragraph');
        nodes.push(_jsxs(Text, {
          color: t.color.muted,
          children: ["\u25B6 ", summary]
        }, key));
        i++;
        continue;
      }
      if (/^<\/?[^>]+>$/.test(line.trim())) {
        start('paragraph');
        nodes.push(_jsx(Text, {
          color: t.color.muted,
          children: line.trim()
        }, key));
        i++;
        continue;
      }
      if (line.includes('|') && line.trim().startsWith('|')) {
        start('table');
        const rows_0 = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          const row = lines[i].trim();
          if (!/^[|\s:-]+$/.test(row)) {
            rows_0.push(splitRow(row));
          }
          i++;
        }
        if (rows_0.length) {
          nodes.push(renderTable(key, rows_0, t));
        }
        continue;
      }
      start('paragraph');
      nodes.push(_jsx(MdInline, {
        t: t,
        text: line
      }, key));
      i++;
    }
    cacheSet(bucket, cacheKey, nodes);
    return nodes;
  }, [compact, t, text]);
  return _jsx(Box, {
    flexDirection: "column",
    children: nodes_0
  });
}
export const Md = memo(MdImpl);