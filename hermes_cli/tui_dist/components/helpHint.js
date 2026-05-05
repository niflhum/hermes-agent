import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '@hermes/ink';
import { HOTKEYS } from '../content/hotkeys.js';
const COMMON_COMMANDS = [['/help', 'full list of commands + hotkeys'], ['/clear', 'start a new session'], ['/resume', 'resume a prior session'], ['/details', 'control transcript detail level'], ['/copy', 'copy selection or last assistant message'], ['/quit', 'exit hermes']];
const HOTKEY_PREVIEW = HOTKEYS.slice(0, 8);
export function HelpHint({
  t
}) {
  const labelW = Math.max(...COMMON_COMMANDS.map(([k]) => k.length), ...HOTKEY_PREVIEW.map(([k]) => k.length));
  const pad = s => s + ' '.repeat(Math.max(0, labelW - s.length + 2));
  return _jsx(Box, {
    alignItems: "flex-start",
    bottom: "100%",
    flexDirection: "column",
    left: 0,
    position: "absolute",
    right: 0,
    children: _jsxs(Box, {
      alignSelf: "flex-start",
      borderColor: t.color.primary,
      borderStyle: "round",
      flexDirection: "column",
      marginBottom: 1,
      opaque: true,
      paddingX: 1,
      children: [_jsxs(Text, {
        children: [_jsx(Text, {
          bold: true,
          color: t.color.primary,
          children: "? quick help"
        }), _jsx(Text, {
          color: t.color.muted,
          children: '  ·  type /help for the full panel  ·  backspace to dismiss'
        })]
      }), _jsx(Box, {
        marginTop: 1,
        children: _jsx(Text, {
          bold: true,
          color: t.color.accent,
          children: "Common commands"
        })
      }), COMMON_COMMANDS.map(([k, v]) => _jsxs(Text, {
        children: [_jsx(Text, {
          color: t.color.label,
          children: pad(k)
        }), _jsx(Text, {
          color: t.color.muted,
          children: v
        })]
      }, k)), _jsx(Box, {
        marginTop: 1,
        children: _jsx(Text, {
          bold: true,
          color: t.color.accent,
          children: "Hotkeys"
        })
      }), HOTKEY_PREVIEW.map(([k, v]) => _jsxs(Text, {
        children: [_jsx(Text, {
          color: t.color.label,
          children: pad(k)
        }), _jsx(Text, {
          color: t.color.muted,
          children: v
        })]
      }, k))]
    })
  });
}