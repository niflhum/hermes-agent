import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Ansi, Box, NoSelect, Text } from '@hermes/ink';
import { memo } from 'react';
import { LONG_MSG } from '../config/limits.js';
import { sectionMode } from '../domain/details.js';
import { userDisplay } from '../domain/messages.js';
import { ROLE } from '../domain/roles.js';
import { boundedHistoryRenderText, boundedLiveRenderText, compactPreview, hasAnsi, isPasteBackedText, stripAnsi } from '../lib/text.js';
import { Md } from './markdown.js';
import { StreamingMd } from './streamingMarkdown.js';
import { ToolTrail } from './thinking.js';
import { TodoPanel } from './todoPanel.js';
export const MessageLine = memo(function MessageLine({
  cols,
  compact,
  detailsMode = 'collapsed',
  detailsModeCommandOverride = false,
  isStreaming = false,
  limitHistoryRender = false,
  msg,
  sections,
  t,
  tools = []
}) {
  // Per-section overrides win over the global mode, so resolve each section
  // we might consume here once and gate visibility on the *content-bearing*
  // sections only — never on the global mode.  A `trail` message feeds Tool
  // calls + Activity; an assistant message with thinking/tools metadata
  // feeds Thinking + Tool calls.  Gating on every section would let
  // `thinking` (expanded by default) keep an empty wrapper alive when only
  // `tools` is hidden — exactly the empty-Box bug Copilot caught.
  const thinkingMode = sectionMode('thinking', detailsMode, sections, detailsModeCommandOverride);
  const toolsMode = sectionMode('tools', detailsMode, sections, detailsModeCommandOverride);
  const activityMode = sectionMode('activity', detailsMode, sections, detailsModeCommandOverride);
  const thinking = msg.thinking?.trim() ?? '';
  if (msg.kind === 'trail' && msg.todos?.length) {
    return _jsx(TodoPanel, {
      defaultCollapsed: msg.todoCollapsedByDefault,
      incomplete: msg.todoIncomplete,
      t: t,
      todos: msg.todos
    });
  }
  if (msg.kind === 'trail' && (msg.tools?.length || tools.length || thinking)) {
    return thinkingMode !== 'hidden' || toolsMode !== 'hidden' || activityMode !== 'hidden' ? _jsx(Box, {
      flexDirection: "column",
      children: _jsx(ToolTrail, {
        commandOverride: detailsModeCommandOverride,
        detailsMode: detailsMode,
        reasoning: thinking,
        reasoningTokens: msg.thinkingTokens,
        sections: sections,
        t: t,
        tools: tools,
        toolTokens: msg.toolTokens,
        trail: msg.tools ?? []
      })
    }) : null;
  }
  if (msg.role === 'tool') {
    const maxChars = Math.max(24, cols - 14);
    const stripped = hasAnsi(msg.text) ? stripAnsi(msg.text) : msg.text;
    const preview = compactPreview(stripped, maxChars) || '(empty tool result)';
    return _jsx(Box, {
      alignSelf: "flex-start",
      borderColor: t.color.muted,
      borderStyle: "round",
      marginLeft: 3,
      paddingX: 1,
      children: hasAnsi(msg.text) ? _jsx(Text, {
        wrap: "truncate-end",
        children: _jsx(Ansi, {
          children: msg.text
        })
      }) : _jsx(Text, {
        color: t.color.muted,
        wrap: "truncate-end",
        children: preview
      })
    });
  }
  const {
    body,
    glyph,
    prefix
  } = ROLE[msg.role](t);
  const showDetails = toolsMode !== 'hidden' && Boolean(msg.tools?.length) || thinkingMode !== 'hidden' && Boolean(thinking);
  const content = (() => {
    if (msg.kind === 'slash') {
      return _jsx(Text, {
        color: t.color.muted,
        children: msg.text
      });
    }
    if (msg.role !== 'user' && hasAnsi(msg.text)) {
      return _jsx(Ansi, {
        children: msg.text
      });
    }
    if (msg.role === 'assistant') {
      return isStreaming ?
      // Incremental markdown: split at the last stable block boundary so
      // only the in-flight tail re-tokenizes per delta. See
      // streamingMarkdown.tsx for the cost model.
      _jsx(StreamingMd, {
        compact: compact,
        t: t,
        text: boundedLiveRenderText(msg.text)
      }) : _jsx(Md, {
        compact: compact,
        t: t,
        text: limitHistoryRender ? boundedHistoryRenderText(msg.text) : msg.text
      });
    }
    if (msg.role === 'user' && msg.text.length > LONG_MSG && isPasteBackedText(msg.text)) {
      const [head, ...rest] = userDisplay(msg.text).split('[long message]');
      return _jsxs(Text, {
        color: body,
        children: [head, _jsx(Text, {
          color: t.color.muted,
          dimColor: true,
          children: "[long message]"
        }), rest.join('')]
      });
    }
    return _jsx(Text, {
      ...(body ? {
        color: body
      } : {}),
      children: msg.text
    });
  })();
  // Diff segments (emitted by pushInlineDiffSegment between narration
  // segments) need a blank line on both sides so the patch doesn't butt up
  // against the prose around it.
  const isDiffSegment = msg.kind === 'diff';
  return _jsxs(Box, {
    flexDirection: "column",
    marginBottom: msg.role === 'user' || isDiffSegment ? 1 : 0,
    marginTop: msg.role === 'user' || msg.kind === 'slash' || isDiffSegment ? 1 : 0,
    children: [showDetails && _jsx(Box, {
      flexDirection: "column",
      marginBottom: 1,
      children: _jsx(ToolTrail, {
        commandOverride: detailsModeCommandOverride,
        detailsMode: detailsMode,
        reasoning: thinking,
        reasoningTokens: msg.thinkingTokens,
        sections: sections,
        t: t,
        toolTokens: msg.toolTokens,
        trail: msg.tools
      })
    }), _jsxs(Box, {
      children: [_jsx(NoSelect, {
        flexShrink: 0,
        fromLeftEdge: true,
        width: 3,
        children: _jsxs(Text, {
          bold: msg.role === 'user',
          color: prefix,
          children: [glyph, ' ']
        })
      }), _jsx(Box, {
        width: Math.max(20, cols - 5),
        children: content
      })]
    })]
  });
});