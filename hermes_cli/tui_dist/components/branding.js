import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text, useStdout } from '@hermes/ink';
import { useEffect, useState } from 'react';
import unicodeSpinners from 'unicode-animations';
import { artWidth, caduceus, CADUCEUS_WIDTH, logo, LOGO_WIDTH } from '../banner.js';
import { flat } from '../lib/text.js';
const LOADER_TICK_MS = 120;
function InlineLoader(t0) {
  const $ = _c(7);
  const {
    label,
    t
  } = t0;
  const [tick, setTick] = useState(0);
  const spinner = unicodeSpinners.braille;
  const frame = spinner.frames[tick % spinner.frames.length] ?? "\u280B";
  let t1;
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      const id = setInterval(() => setTick(_temp), Math.max(LOADER_TICK_MS, spinner.interval));
      return () => clearInterval(id);
    };
    t2 = [spinner.interval];
    $[0] = t1;
    $[1] = t2;
  } else {
    t1 = $[0];
    t2 = $[1];
  }
  useEffect(t1, t2);
  let t3;
  if ($[2] !== frame || $[3] !== label || $[4] !== t.color.accent || $[5] !== t.color.muted) {
    t3 = _jsxs(Text, {
      color: t.color.muted,
      wrap: "truncate",
      children: [_jsx(Text, {
        color: t.color.accent,
        children: frame
      }), " ", label]
    });
    $[2] = frame;
    $[3] = label;
    $[4] = t.color.accent;
    $[5] = t.color.muted;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}
function _temp(n) {
  return n + 1;
}
export function ArtLines({
  lines
}) {
  return _jsx(_Fragment, {
    children: lines.map(([c, text], i) => _jsx(Text, {
      color: c,
      children: text
    }, i))
  });
}
export function Banner(t0) {
  const $ = _c(5);
  const {
    t
  } = t0;
  const cols = useStdout().stdout?.columns ?? 80;
  let t1;
  if ($[0] !== cols || $[1] !== t.bannerLogo || $[2] !== t.brand.icon || $[3] !== t.color) {
    const logoLines = logo(t.color, t.bannerLogo || undefined);
    t1 = _jsxs(Box, {
      flexDirection: "column",
      marginBottom: 1,
      children: [cols >= (t.bannerLogo ? artWidth(logoLines) : LOGO_WIDTH) ? _jsx(ArtLines, {
        lines: logoLines
      }) : _jsxs(Text, {
        bold: true,
        color: t.color.primary,
        children: [t.brand.icon, " NOUS HERMES"]
      }), _jsxs(Text, {
        color: t.color.muted,
        children: [t.brand.icon, " Nous Research \xB7 Messenger of the Digital Gods"]
      })]
    });
    $[0] = cols;
    $[1] = t.bannerLogo;
    $[2] = t.brand.icon;
    $[3] = t.color;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}
export function SessionPanel(t0) {
  const $ = _c(20);
  const {
    info,
    sid,
    t
  } = t0;
  const cols = useStdout().stdout?.columns ?? 100;
  let t1;
  if ($[0] !== cols || $[1] !== info.cwd || $[2] !== info.lazy || $[3] !== info.mcp_servers || $[4] !== info.model || $[5] !== info.release_date || $[6] !== info.skills || $[7] !== info.tools || $[8] !== info.update_behind || $[9] !== info.update_command || $[10] !== info.version || $[11] !== sid || $[12] !== t) {
    const heroLines = caduceus(t.color, t.bannerHero || undefined);
    const leftW = Math.min((artWidth(heroLines) || CADUCEUS_WIDTH) + 4, Math.floor(cols * 0.4));
    const wide = cols >= 90 && leftW + 40 < cols;
    const w = Math.max(20, wide ? cols - leftW - 14 : cols - 12);
    const lineBudget = Math.max(12, w - 2);
    const strip = _temp2;
    let t2;
    if ($[14] !== lineBudget) {
      t2 = (pfx, items) => {
        let line = "";
        let shown = 0;
        for (const item of [...items].sort()) {
          const next = line ? `${line}, ${item}` : item;
          if (pfx.length + next.length > lineBudget) {
            return line ? `${line}, …+${items.length - shown}` : `${item}, …`;
          }
          line = next;
          shown++;
        }
        return line;
      };
      $[14] = lineBudget;
      $[15] = t2;
    } else {
      t2 = $[15];
    }
    const truncLine = t2;
    let t3;
    if ($[16] !== info.lazy || $[17] !== t || $[18] !== truncLine) {
      t3 = (title, data, t4, t5) => {
        const max = t4 === undefined ? 8 : t4;
        const overflowLabel = t5 === undefined ? "more\u2026" : t5;
        const entries = Object.entries(data).sort();
        const shown_0 = entries.slice(0, max);
        const overflow = entries.length - max;
        const skeleton = info.lazy && entries.length === 0;
        return _jsxs(Box, {
          flexDirection: "column",
          marginTop: 1,
          children: [_jsxs(Text, {
            bold: true,
            color: t.color.accent,
            children: ["Available ", title]
          }), skeleton ? _jsx(InlineLoader, {
            label: title === "Tools" ? "discovering tools" : "scanning skills",
            t
          }) : shown_0.map(t6 => {
            const [k, vs] = t6;
            return _jsxs(Text, {
              wrap: "truncate",
              children: [_jsxs(Text, {
                color: t.color.muted,
                children: [strip(k), ": "]
              }), _jsx(Text, {
                color: t.color.text,
                children: truncLine(strip(k) + ": ", vs)
              })]
            }, k);
          }), overflow > 0 && _jsxs(Text, {
            color: t.color.muted,
            children: ["(and ", overflow, " ", overflowLabel, ")"]
          })]
        });
      };
      $[16] = info.lazy;
      $[17] = t;
      $[18] = truncLine;
      $[19] = t3;
    } else {
      t3 = $[19];
    }
    const section = t3;
    t1 = _jsxs(Box, {
      borderColor: t.color.border,
      borderStyle: "round",
      marginBottom: 1,
      paddingX: 2,
      paddingY: 1,
      children: [wide && _jsxs(Box, {
        flexDirection: "column",
        marginRight: 2,
        width: leftW,
        children: [_jsx(ArtLines, {
          lines: heroLines
        }), _jsx(Text, {}), _jsxs(Text, {
          color: t.color.accent,
          children: [info.model.split("/").pop(), _jsx(Text, {
            color: t.color.muted,
            children: " \xB7 Nous Research"
          })]
        }), _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: info.cwd || process.cwd()
        }), sid && _jsxs(Text, {
          children: [_jsx(Text, {
            color: t.color.sessionLabel,
            children: "Session: "
          }), _jsx(Text, {
            color: t.color.sessionBorder,
            children: sid
          })]
        })]
      }), _jsxs(Box, {
        flexDirection: "column",
        width: w,
        children: [_jsx(Box, {
          justifyContent: "center",
          marginBottom: 1,
          children: _jsxs(Text, {
            bold: true,
            color: t.color.primary,
            children: [t.brand.name, info.version ? ` v${info.version}` : "", info.release_date ? ` (${info.release_date})` : ""]
          })
        }), section("Tools", info.tools, 8, "more toolsets\u2026"), section("Skills", info.skills), info.mcp_servers && info.mcp_servers.length > 0 && _jsxs(Box, {
          flexDirection: "column",
          marginTop: 1,
          children: [_jsx(Text, {
            bold: true,
            color: t.color.accent,
            children: "MCP Servers"
          }), info.mcp_servers.map(s_0 => _jsxs(Text, {
            wrap: "truncate",
            children: [_jsx(Text, {
              color: t.color.muted,
              children: `  ${s_0.name} `
            }), _jsx(Text, {
              color: t.color.muted,
              children: `[${s_0.transport}]`
            }), _jsx(Text, {
              color: t.color.muted,
              children: ": "
            }), s_0.connected ? _jsxs(Text, {
              color: t.color.text,
              children: [s_0.tools, " tool", s_0.tools === 1 ? "" : "s"]
            }) : _jsx(Text, {
              color: t.color.error,
              children: "failed"
            })]
          }, s_0.name))]
        }), _jsx(Text, {}), _jsxs(Text, {
          color: t.color.text,
          children: [flat(info.tools).length, " tools", " \xB7 ", flat(info.skills).length, " skills", info.mcp_servers?.length ? ` · ${info.mcp_servers.length} MCP` : "", " \xB7 ", _jsx(Text, {
            color: t.color.muted,
            children: "/help for commands"
          })]
        }), typeof info.update_behind === "number" && info.update_behind > 0 && _jsxs(Text, {
          bold: true,
          color: t.color.warn,
          children: ["! ", info.update_behind, " ", info.update_behind === 1 ? "commit" : "commits", " behind", _jsxs(Text, {
            bold: false,
            color: t.color.warn,
            dimColor: true,
            children: [" ", "- run", " "]
          }), _jsx(Text, {
            bold: true,
            color: t.color.warn,
            children: info.update_command || "hermes update"
          }), _jsxs(Text, {
            bold: false,
            color: t.color.warn,
            dimColor: true,
            children: [" ", "to update"]
          })]
        })]
      })]
    });
    $[0] = cols;
    $[1] = info.cwd;
    $[2] = info.lazy;
    $[3] = info.mcp_servers;
    $[4] = info.model;
    $[5] = info.release_date;
    $[6] = info.skills;
    $[7] = info.tools;
    $[8] = info.update_behind;
    $[9] = info.update_command;
    $[10] = info.version;
    $[11] = sid;
    $[12] = t;
    $[13] = t1;
  } else {
    t1 = $[13];
  }
  return t1;
}
function _temp2(s) {
  return s.endsWith("_tools") ? s.slice(0, -6) : s;
}
export function Panel({
  sections,
  t,
  title
}) {
  return _jsxs(Box, {
    borderColor: t.color.border,
    borderStyle: "round",
    flexDirection: "column",
    paddingX: 2,
    paddingY: 1,
    children: [_jsx(Box, {
      justifyContent: "center",
      marginBottom: 1,
      children: _jsx(Text, {
        bold: true,
        color: t.color.primary,
        children: title
      })
    }), sections.map((sec, si) => _jsxs(Box, {
      flexDirection: "column",
      marginTop: si > 0 ? 1 : 0,
      children: [sec.title && _jsx(Text, {
        bold: true,
        color: t.color.accent,
        children: sec.title
      }), sec.rows?.map(([k, v], ri) => _jsxs(Text, {
        wrap: "truncate",
        children: [_jsx(Text, {
          color: t.color.muted,
          children: k.padEnd(20)
        }), _jsx(Text, {
          color: t.color.text,
          children: v
        })]
      }, ri)), sec.items?.map((item, ii) => _jsx(Text, {
        color: t.color.text,
        wrap: "truncate",
        children: item
      }, ii)), sec.text && _jsx(Text, {
        color: t.color.muted,
        children: sec.text
      })]
    }, si))]
  });
}