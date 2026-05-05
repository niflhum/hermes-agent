import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { AlternateScreen, Box, NoSelect, ScrollBox, Text } from '@hermes/ink';
import { useStore } from '@nanostores/react';
import { Fragment, memo, useMemo, useRef } from 'react';
import { useGateway } from '../app/gatewayContext.js';
import { $isBlocked, $overlayState, patchOverlayState } from '../app/overlayStore.js';
import { $uiState } from '../app/uiStore.js';
import { INLINE_MODE, SHOW_FPS } from '../config/env.js';
import { FULL_RENDER_TAIL_ITEMS } from '../config/limits.js';
import { PLACEHOLDER } from '../content/placeholders.js';
import { COMPOSER_PROMPT_GAP_WIDTH, composerPromptWidth, inputVisualHeight, stableComposerColumns } from '../lib/inputMetrics.js';
import { PerfPane } from '../lib/perfPane.js';
import { AgentsOverlay } from './agentsOverlay.js';
import { GoodVibesHeart, StatusRule, StickyPromptTracker, TranscriptScrollbar } from './appChrome.js';
import { FloatingOverlays, PromptZone } from './appOverlays.js';
import { Banner, Panel, SessionPanel } from './branding.js';
import { FpsOverlay } from './fpsOverlay.js';
import { HelpHint } from './helpHint.js';
import { MessageLine } from './messageLine.js';
import { QueuedMessages } from './queuedMessages.js';
import { LiveTodoPanel, StreamingAssistant } from './streamingAssistant.js';
import { TextInput } from './textInput.js';
import { TokenHUD } from './tokenHUD.js';
const PromptPrefix = memo(function PromptPrefix({
  bold = false,
  color,
  promptText,
  width
}) {
  const glyphWidth = Math.max(1, width - COMPOSER_PROMPT_GAP_WIDTH);
  return _jsxs(Box, {
    width: width,
    children: [_jsx(Box, {
      width: glyphWidth,
      children: _jsx(Text, {
        bold: bold,
        color: color,
        children: promptText
      })
    }), _jsx(Box, {
      width: COMPOSER_PROMPT_GAP_WIDTH
    })]
  });
});
const TranscriptPane = memo(function TranscriptPane(t0) {
  const $ = _c(28);
  const {
    actions,
    composer,
    progress,
    transcript
  } = t0;
  const ui = useStore($uiState);
  let t1;
  bb0: {
    const items = transcript.historyItems;
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].role === "user") {
        t1 = i;
        break bb0;
      }
    }
    t1 = -1;
  }
  const lastUserIdx = t1;
  let t2;
  if ($[0] !== actions || $[1] !== composer.cols || $[2] !== lastUserIdx || $[3] !== progress || $[4] !== transcript.historyItems || $[5] !== transcript.scrollRef || $[6] !== transcript.virtualHistory || $[7] !== transcript.virtualRows || $[8] !== ui.compact || $[9] !== ui.detailsMode || $[10] !== ui.detailsModeCommandOverride || $[11] !== ui.sections || $[12] !== ui.sid || $[13] !== ui.theme) {
    let t3;
    if ($[15] !== actions) {
      t3 = e => {
        if (e.cellIsBlank) {
          actions.clearSelection();
        }
      };
      $[15] = actions;
      $[16] = t3;
    } else {
      t3 = $[16];
    }
    let t4;
    if ($[17] !== composer.cols || $[18] !== lastUserIdx || $[19] !== transcript.historyItems || $[20] !== transcript.virtualHistory || $[21] !== ui.compact || $[22] !== ui.detailsMode || $[23] !== ui.detailsModeCommandOverride || $[24] !== ui.sections || $[25] !== ui.sid || $[26] !== ui.theme) {
      t4 = row => _jsxs(Box, {
        flexDirection: "column",
        ref: transcript.virtualHistory.measureRef(row.key),
        children: [row.msg.kind === "intro" ? _jsxs(Box, {
          flexDirection: "column",
          paddingTop: 1,
          children: [_jsx(Banner, {
            t: ui.theme
          }), row.msg.info && _jsx(SessionPanel, {
            info: row.msg.info,
            sid: ui.sid,
            t: ui.theme
          })]
        }) : row.msg.kind === "panel" && row.msg.panelData ? _jsx(Panel, {
          sections: row.msg.panelData.sections,
          t: ui.theme,
          title: row.msg.panelData.title
        }) : _jsx(MessageLine, {
          cols: composer.cols,
          compact: ui.compact,
          detailsMode: ui.detailsMode,
          detailsModeCommandOverride: ui.detailsModeCommandOverride,
          limitHistoryRender: row.index < transcript.historyItems.length - FULL_RENDER_TAIL_ITEMS,
          msg: row.msg,
          sections: ui.sections,
          t: ui.theme
        }), row.index === lastUserIdx && _jsx(LiveTodoPanel, {})]
      }, row.key);
      $[17] = composer.cols;
      $[18] = lastUserIdx;
      $[19] = transcript.historyItems;
      $[20] = transcript.virtualHistory;
      $[21] = ui.compact;
      $[22] = ui.detailsMode;
      $[23] = ui.detailsModeCommandOverride;
      $[24] = ui.sections;
      $[25] = ui.sid;
      $[26] = ui.theme;
      $[27] = t4;
    } else {
      t4 = $[27];
    }
    t2 = _jsxs(_Fragment, {
      children: [_jsx(ScrollBox, {
        flexDirection: "column",
        flexGrow: 1,
        flexShrink: 1,
        onClick: t3,
        ref: transcript.scrollRef,
        stickyScroll: true,
        children: _jsxs(Box, {
          flexDirection: "column",
          paddingX: 1,
          children: [transcript.virtualHistory.topSpacer > 0 ? _jsx(Box, {
            height: transcript.virtualHistory.topSpacer
          }) : null, transcript.virtualRows.slice(transcript.virtualHistory.start, transcript.virtualHistory.end).map(t4), transcript.virtualHistory.bottomSpacer > 0 ? _jsx(Box, {
            height: transcript.virtualHistory.bottomSpacer
          }) : null, _jsx(StreamingAssistant, {
            cols: composer.cols,
            compact: ui.compact,
            detailsMode: ui.detailsMode,
            detailsModeCommandOverride: ui.detailsModeCommandOverride,
            progress,
            sections: ui.sections
          })]
        })
      }), _jsx(NoSelect, {
        flexShrink: 0,
        marginLeft: 1,
        children: _jsx(TranscriptScrollbar, {
          scrollRef: transcript.scrollRef,
          t: ui.theme
        })
      }), _jsx(StickyPromptTracker, {
        messages: transcript.historyItems,
        offsets: transcript.virtualHistory.offsets,
        onChange: actions.setStickyPrompt,
        scrollRef: transcript.scrollRef
      })]
    });
    $[0] = actions;
    $[1] = composer.cols;
    $[2] = lastUserIdx;
    $[3] = progress;
    $[4] = transcript.historyItems;
    $[5] = transcript.scrollRef;
    $[6] = transcript.virtualHistory;
    $[7] = transcript.virtualRows;
    $[8] = ui.compact;
    $[9] = ui.detailsMode;
    $[10] = ui.detailsModeCommandOverride;
    $[11] = ui.sections;
    $[12] = ui.sid;
    $[13] = ui.theme;
    $[14] = t2;
  } else {
    t2 = $[14];
  }
  return t2;
});
const ComposerPane = memo(function ComposerPane({
  actions,
  composer,
  status
}) {
  const ui = useStore($uiState);
  const isBlocked = useStore($isBlocked);
  const sh = (composer.inputBuf[0] ?? composer.input).startsWith('!');
  const promptText = sh ? '$' : ui.theme.brand.prompt;
  const promptWidth = composerPromptWidth(promptText);
  const promptBlank = ' '.repeat(promptWidth);
  const inputColumns = stableComposerColumns(composer.cols, promptWidth);
  const inputHeight = inputVisualHeight(composer.input, inputColumns);
  const inputMouseRef = useRef(null);
  const captureInputDrag = e => {
    if (e.button !== 0) {
      return;
    }
    e.stopImmediatePropagation?.();
    inputMouseRef.current?.startAtBeginning();
  };
  // Drag origin matches the input box's top-left, so localRow / localCol
  // map directly into TextInput coords (after backing out the prompt cell).
  const dragFromPromptRow = e_0 => {
    if (e_0.button !== 0) {
      return;
    }
    e_0.stopImmediatePropagation?.();
    inputMouseRef.current?.dragAt(e_0.localRow ?? 0, (e_0.localCol ?? 0) - promptWidth);
  };
  // Spacer rows live on a different vertical origin; only the column is
  // parent-aligned with the input. Force row=0 so vertical drags can't
  // jump the cursor to the wrong wrapped line.
  const dragFromSpacer = e_1 => {
    if (e_1.button !== 0) {
      return;
    }
    e_1.stopImmediatePropagation?.();
    inputMouseRef.current?.dragAt(0, (e_1.localCol ?? 0) - promptWidth);
  };
  const endInputDrag = () => inputMouseRef.current?.end();
  return _jsxs(NoSelect, {
    flexDirection: "column",
    flexShrink: 0,
    fromLeftEdge: true,
    onClick: e_2 => {
      if (e_2.cellIsBlank) {
        actions.clearSelection();
      }
    },
    paddingX: 1,
    children: [_jsx(QueuedMessages, {
      cols: composer.cols,
      queued: composer.queuedDisplay,
      queueEditIdx: composer.queueEditIdx,
      t: ui.theme
    }), ui.bgTasks.size > 0 && _jsxs(Text, {
      color: ui.theme.color.muted,
      children: [ui.bgTasks.size, " background ", ui.bgTasks.size === 1 ? 'task' : 'tasks', " running"]
    }), status.showStickyPrompt ? _jsxs(Text, {
      color: ui.theme.color.muted,
      wrap: "truncate-end",
      children: [_jsx(Text, {
        color: ui.theme.color.label,
        children: "\u21B3 "
      }), status.stickyPrompt]
    }) : _jsx(Box, {
      height: 1,
      onMouseDown: captureInputDrag,
      onMouseDrag: dragFromSpacer,
      onMouseUp: endInputDrag
    }), _jsx(StatusRulePane, {
      at: "top",
      composer: composer,
      status: status
    }), _jsxs(Box, {
      flexDirection: "column",
      marginTop: ui.statusBar === 'top' ? 0 : 1,
      position: "relative",
      children: [_jsx(FloatingOverlays, {
        cols: composer.cols,
        compIdx: composer.compIdx,
        completions: composer.completions,
        onModelSelect: actions.onModelSelect,
        onPickerSelect: actions.resumeById,
        pagerPageSize: composer.pagerPageSize
      }), composer.input === '?' && !composer.inputBuf.length && _jsx(HelpHint, {
        t: ui.theme
      }), !isBlocked && _jsxs(_Fragment, {
        children: [composer.inputBuf.map((line, i) => _jsxs(Box, {
          children: [_jsx(Box, {
            width: promptWidth,
            children: i === 0 ? _jsx(PromptPrefix, {
              color: ui.theme.color.muted,
              promptText: promptText,
              width: promptWidth
            }) : _jsx(Text, {
              color: ui.theme.color.muted,
              children: promptBlank
            })
          }), _jsx(Text, {
            color: ui.theme.color.text,
            children: line || ' '
          })]
        }, i)), _jsxs(Box, {
          onMouseDown: captureInputDrag,
          onMouseDrag: dragFromPromptRow,
          onMouseUp: endInputDrag,
          position: "relative",
          width: Math.max(1, composer.cols - 2),
          children: [_jsx(Box, {
            width: promptWidth,
            children: sh ? _jsx(PromptPrefix, {
              color: ui.theme.color.shellDollar,
              promptText: promptText,
              width: promptWidth
            }) : composer.inputBuf.length ? _jsx(Text, {
              color: ui.theme.color.prompt,
              children: promptBlank
            }) : _jsx(PromptPrefix, {
              bold: true,
              color: ui.theme.color.prompt,
              promptText: promptText,
              width: promptWidth
            })
          }), _jsx(Box, {
            flexGrow: 0,
            flexShrink: 0,
            height: inputHeight,
            width: inputColumns,
            children: _jsx(TextInput, {
              columns: inputColumns,
              mouseApiRef: inputMouseRef,
              onChange: composer.updateInput,
              onPaste: composer.handleTextPaste,
              onSubmit: composer.submit,
              placeholder: composer.empty ? PLACEHOLDER : ui.busy ? 'Ctrl+C to interrupt…' : '',
              value: composer.input
            })
          }), _jsx(Box, {
            position: "absolute",
            right: 0,
            children: _jsx(GoodVibesHeart, {
              t: ui.theme,
              tick: status.goodVibesTick
            })
          })]
        })]
      })]
    }), !composer.empty && !ui.sid && _jsxs(Text, {
      color: ui.theme.color.muted,
      children: ["\u2695 ", ui.status]
    }), _jsx(StatusRulePane, {
      at: "bottom",
      composer: composer,
      status: status
    })]
  });
});
const AgentsOverlayPane = memo(function AgentsOverlayPane() {
  const $ = _c(4);
  const {
    gw
  } = useGateway();
  const ui = useStore($uiState);
  const overlay = useStore($overlayState);
  let t0;
  if ($[0] !== gw || $[1] !== overlay.agentsInitialHistoryIndex || $[2] !== ui.theme) {
    t0 = _jsx(AgentsOverlay, {
      gw,
      initialHistoryIndex: overlay.agentsInitialHistoryIndex,
      onClose: _temp,
      t: ui.theme
    });
    $[0] = gw;
    $[1] = overlay.agentsInitialHistoryIndex;
    $[2] = ui.theme;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
});
const StatusRulePane = memo(function StatusRulePane(t0) {
  const $ = _c(18);
  const {
    at,
    composer,
    status
  } = t0;
  const ui = useStore($uiState);
  if (ui.statusBar !== at) {
    return null;
  }
  const t1 = at === "top" ? 1 : 0;
  let t2;
  if ($[0] !== composer.cols || $[1] !== status.cwdLabel || $[2] !== status.sessionStartedAt || $[3] !== status.statusColor || $[4] !== status.turnStartedAt || $[5] !== status.voiceLabel || $[6] !== t1 || $[7] !== ui.bgTasks.size || $[8] !== ui.busy || $[9] !== ui.info?.fast || $[10] !== ui.info?.model || $[11] !== ui.info?.reasoning_effort || $[12] !== ui.info?.service_tier || $[13] !== ui.showCost || $[14] !== ui.status || $[15] !== ui.theme || $[16] !== ui.usage) {
    t2 = _jsx(Box, {
      marginTop: t1,
      children: _jsx(StatusRule, {
        bgCount: ui.bgTasks.size,
        busy: ui.busy,
        cols: composer.cols,
        cwdLabel: status.cwdLabel,
        model: ui.info?.model ?? "",
        modelFast: ui.info?.fast || ui.info?.service_tier === "priority",
        modelReasoningEffort: ui.info?.reasoning_effort,
        sessionStartedAt: status.sessionStartedAt,
        showCost: ui.showCost,
        status: ui.status,
        statusColor: status.statusColor,
        t: ui.theme,
        turnStartedAt: status.turnStartedAt,
        usage: ui.usage,
        voiceLabel: status.voiceLabel
      })
    });
    $[0] = composer.cols;
    $[1] = status.cwdLabel;
    $[2] = status.sessionStartedAt;
    $[3] = status.statusColor;
    $[4] = status.turnStartedAt;
    $[5] = status.voiceLabel;
    $[6] = t1;
    $[7] = ui.bgTasks.size;
    $[8] = ui.busy;
    $[9] = ui.info?.fast;
    $[10] = ui.info?.model;
    $[11] = ui.info?.reasoning_effort;
    $[12] = ui.info?.service_tier;
    $[13] = ui.showCost;
    $[14] = ui.status;
    $[15] = ui.theme;
    $[16] = ui.usage;
    $[17] = t2;
  } else {
    t2 = $[17];
  }
  return t2;
});
export const AppLayout = memo(function AppLayout(t0) {
  const $ = _c(9);
  const {
    actions,
    composer,
    mouseTracking,
    progress,
    status,
    transcript
  } = t0;
  const overlay = useStore($overlayState);
  const ui = useStore($uiState);
  const Shell = INLINE_MODE ? Fragment : AlternateScreen;
  let t1;
  if ($[0] !== actions || $[1] !== composer || $[2] !== mouseTracking || $[3] !== overlay.agents || $[4] !== progress || $[5] !== status || $[6] !== transcript || $[7] !== ui.theme) {
    const shellProps = INLINE_MODE ? {} : {
      mouseTracking
    };
    t1 = _jsx(Shell, {
      ...shellProps,
      children: _jsxs(Box, {
        flexDirection: "column",
        flexGrow: 1,
        children: [_jsx(TokenHUD, {
          t: ui.theme
        }), _jsx(Box, {
          flexDirection: "row",
          flexGrow: 1,
          children: overlay.agents ? _jsx(PerfPane, {
            id: "agents",
            children: _jsx(AgentsOverlayPane, {})
          }) : _jsx(PerfPane, {
            id: "transcript",
            children: _jsx(TranscriptPane, {
              actions,
              composer,
              progress,
              transcript
            })
          })
        }), !overlay.agents && _jsxs(_Fragment, {
          children: [_jsx(PerfPane, {
            id: "prompt",
            children: _jsx(PromptZone, {
              cols: composer.cols,
              onApprovalChoice: actions.answerApproval,
              onClarifyAnswer: actions.answerClarify,
              onSecretSubmit: actions.answerSecret,
              onSudoSubmit: actions.answerSudo
            })
          }), _jsx(PerfPane, {
            id: "composer",
            children: _jsx(ComposerPane, {
              actions,
              composer,
              status
            })
          }), SHOW_FPS && _jsx(Box, {
            flexShrink: 0,
            justifyContent: "flex-end",
            paddingRight: 1,
            children: _jsx(FpsOverlay, {
              t: ui.theme
            })
          })]
        })]
      })
    });
    $[0] = actions;
    $[1] = composer;
    $[2] = mouseTracking;
    $[3] = overlay.agents;
    $[4] = progress;
    $[5] = status;
    $[6] = transcript;
    $[7] = ui.theme;
    $[8] = t1;
  } else {
    t1 = $[8];
  }
  return t1;
});
function _temp() {
  return patchOverlayState({
    agents: false,
    agentsInitialHistoryIndex: 0
  });
}