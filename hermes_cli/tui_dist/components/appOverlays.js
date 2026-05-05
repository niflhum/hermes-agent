import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '@hermes/ink';
import { useStore } from '@nanostores/react';
import { useGateway } from '../app/gatewayContext.js';
import { $overlayState, patchOverlayState } from '../app/overlayStore.js';
import { $uiState } from '../app/uiStore.js';
import { FloatBox } from './appChrome.js';
import { MaskedPrompt } from './maskedPrompt.js';
import { ModelPicker } from './modelPicker.js';
import { OverlayHint } from './overlayControls.js';
import { ApprovalPrompt, ClarifyPrompt, ConfirmPrompt } from './prompts.js';
import { SessionPicker } from './sessionPicker.js';
import { SkillsHub } from './skillsHub.js';
const COMPLETION_WINDOW = 16;
export function PromptZone(t0) {
  const $ = _c(27);
  const {
    cols,
    onApprovalChoice,
    onClarifyAnswer,
    onSecretSubmit,
    onSudoSubmit
  } = t0;
  const overlay = useStore($overlayState);
  const ui = useStore($uiState);
  if (overlay.approval) {
    let t1;
    if ($[0] !== onApprovalChoice || $[1] !== overlay.approval || $[2] !== ui.theme) {
      t1 = _jsx(Box, {
        flexDirection: "column",
        flexShrink: 0,
        paddingX: 1,
        paddingY: 1,
        children: _jsx(ApprovalPrompt, {
          onChoice: onApprovalChoice,
          req: overlay.approval,
          t: ui.theme
        })
      });
      $[0] = onApprovalChoice;
      $[1] = overlay.approval;
      $[2] = ui.theme;
      $[3] = t1;
    } else {
      t1 = $[3];
    }
    return t1;
  }
  if (overlay.confirm) {
    const req = overlay.confirm;
    let t1;
    if ($[4] !== req) {
      t1 = () => {
        patchOverlayState({
          confirm: null
        });
        req.onConfirm();
      };
      $[4] = req;
      $[5] = t1;
    } else {
      t1 = $[5];
    }
    const onConfirm = t1;
    const onCancel = _temp;
    let t2;
    if ($[6] !== onConfirm || $[7] !== req || $[8] !== ui.theme) {
      t2 = _jsx(Box, {
        flexDirection: "column",
        flexShrink: 0,
        paddingX: 1,
        paddingY: 1,
        children: _jsx(ConfirmPrompt, {
          onCancel,
          onConfirm,
          req,
          t: ui.theme
        })
      });
      $[6] = onConfirm;
      $[7] = req;
      $[8] = ui.theme;
      $[9] = t2;
    } else {
      t2 = $[9];
    }
    return t2;
  }
  if (overlay.clarify) {
    let t1;
    if ($[10] !== cols || $[11] !== onClarifyAnswer || $[12] !== overlay.clarify || $[13] !== ui.theme) {
      let t2;
      if ($[15] !== onClarifyAnswer) {
        t2 = () => onClarifyAnswer("");
        $[15] = onClarifyAnswer;
        $[16] = t2;
      } else {
        t2 = $[16];
      }
      t1 = _jsx(Box, {
        flexDirection: "column",
        flexShrink: 0,
        paddingX: 1,
        paddingY: 1,
        children: _jsx(ClarifyPrompt, {
          cols,
          onAnswer: onClarifyAnswer,
          onCancel: t2,
          req: overlay.clarify,
          t: ui.theme
        })
      });
      $[10] = cols;
      $[11] = onClarifyAnswer;
      $[12] = overlay.clarify;
      $[13] = ui.theme;
      $[14] = t1;
    } else {
      t1 = $[14];
    }
    return t1;
  }
  if (overlay.sudo) {
    let t1;
    if ($[17] !== cols || $[18] !== onSudoSubmit || $[19] !== ui.theme) {
      t1 = _jsx(Box, {
        flexDirection: "column",
        flexShrink: 0,
        paddingX: 1,
        paddingY: 1,
        children: _jsx(MaskedPrompt, {
          cols,
          icon: "\uD83D\uDD10",
          label: "sudo password required",
          onSubmit: onSudoSubmit,
          t: ui.theme
        })
      });
      $[17] = cols;
      $[18] = onSudoSubmit;
      $[19] = ui.theme;
      $[20] = t1;
    } else {
      t1 = $[20];
    }
    return t1;
  }
  if (overlay.secret) {
    let t1;
    if ($[21] !== cols || $[22] !== onSecretSubmit || $[23] !== overlay.secret.envVar || $[24] !== overlay.secret.prompt || $[25] !== ui.theme) {
      t1 = _jsx(Box, {
        flexDirection: "column",
        flexShrink: 0,
        paddingX: 1,
        paddingY: 1,
        children: _jsx(MaskedPrompt, {
          cols,
          icon: "\uD83D\uDD11",
          label: overlay.secret.prompt,
          onSubmit: onSecretSubmit,
          sub: `for ${overlay.secret.envVar}`,
          t: ui.theme
        })
      });
      $[21] = cols;
      $[22] = onSecretSubmit;
      $[23] = overlay.secret.envVar;
      $[24] = overlay.secret.prompt;
      $[25] = ui.theme;
      $[26] = t1;
    } else {
      t1 = $[26];
    }
    return t1;
  }
  return null;
}
function _temp() {
  return patchOverlayState({
    confirm: null
  });
}
export function FloatingOverlays(t0) {
  const $ = _c(15);
  const {
    cols,
    compIdx,
    completions,
    onModelSelect,
    onPickerSelect,
    pagerPageSize
  } = t0;
  const {
    gw
  } = useGateway();
  const overlay = useStore($overlayState);
  const ui = useStore($uiState);
  const hasAny = overlay.modelPicker || overlay.pager || overlay.picker || overlay.skillsHub || completions.length;
  if (!hasAny) {
    return null;
  }
  const viewportSize = Math.min(COMPLETION_WINDOW, completions.length);
  const start = Math.max(0, Math.min(compIdx - Math.floor(COMPLETION_WINDOW / 2), completions.length - viewportSize));
  let t1;
  if ($[0] !== cols || $[1] !== compIdx || $[2] !== completions || $[3] !== gw || $[4] !== onModelSelect || $[5] !== onPickerSelect || $[6] !== overlay.modelPicker || $[7] !== overlay.pager || $[8] !== overlay.picker || $[9] !== overlay.skillsHub || $[10] !== pagerPageSize || $[11] !== start || $[12] !== ui || $[13] !== viewportSize) {
    t1 = _jsxs(Box, {
      alignItems: "flex-start",
      bottom: "100%",
      flexDirection: "column",
      left: 0,
      position: "absolute",
      right: 0,
      children: [overlay.picker && _jsx(FloatBox, {
        color: ui.theme.color.border,
        children: _jsx(SessionPicker, {
          gw,
          onCancel: _temp2,
          onSelect: onPickerSelect,
          t: ui.theme
        })
      }), overlay.modelPicker && _jsx(FloatBox, {
        color: ui.theme.color.border,
        children: _jsx(ModelPicker, {
          gw,
          onCancel: _temp3,
          onSelect: onModelSelect,
          sessionId: ui.sid,
          t: ui.theme
        })
      }), overlay.skillsHub && _jsx(FloatBox, {
        color: ui.theme.color.border,
        children: _jsx(SkillsHub, {
          gw,
          onClose: _temp4,
          t: ui.theme
        })
      }), overlay.pager && _jsx(FloatBox, {
        color: ui.theme.color.border,
        children: _jsxs(Box, {
          flexDirection: "column",
          paddingX: 1,
          paddingY: 1,
          children: [overlay.pager.title && _jsx(Box, {
            justifyContent: "center",
            marginBottom: 1,
            children: _jsx(Text, {
              bold: true,
              color: ui.theme.color.primary,
              children: overlay.pager.title
            })
          }), overlay.pager.lines.slice(overlay.pager.offset, overlay.pager.offset + pagerPageSize).map(_temp5), _jsx(Box, {
            marginTop: 1,
            children: _jsx(OverlayHint, {
              t: ui.theme,
              children: overlay.pager.offset + pagerPageSize < overlay.pager.lines.length ? `↑↓/jk line · Enter/Space/PgDn page · b/PgUp back · g/G top/bottom · Esc/q close (${Math.min(overlay.pager.offset + pagerPageSize, overlay.pager.lines.length)}/${overlay.pager.lines.length})` : `end · ↑↓/jk · b/PgUp back · g top · Esc/q close (${overlay.pager.lines.length} lines)`
            })
          })]
        })
      }), !!completions.length && _jsx(FloatBox, {
        color: ui.theme.color.primary,
        children: _jsx(Box, {
          flexDirection: "column",
          width: Math.max(28, cols - 6),
          children: completions.slice(start, start + viewportSize).map((item, i_0) => {
            const active = start + i_0 === compIdx;
            return _jsxs(Box, {
              backgroundColor: active ? ui.theme.color.completionCurrentBg : undefined,
              flexDirection: "row",
              width: "100%",
              children: [_jsxs(Text, {
                bold: true,
                color: ui.theme.color.label,
                children: [" ", item.display]
              }), item.meta ? _jsxs(Text, {
                color: ui.theme.color.muted,
                children: [" ", item.meta]
              }) : null]
            }, `${start + i_0}:${item.text}:${item.display}:${item.meta ?? ""}`);
          })
        })
      })]
    });
    $[0] = cols;
    $[1] = compIdx;
    $[2] = completions;
    $[3] = gw;
    $[4] = onModelSelect;
    $[5] = onPickerSelect;
    $[6] = overlay.modelPicker;
    $[7] = overlay.pager;
    $[8] = overlay.picker;
    $[9] = overlay.skillsHub;
    $[10] = pagerPageSize;
    $[11] = start;
    $[12] = ui;
    $[13] = viewportSize;
    $[14] = t1;
  } else {
    t1 = $[14];
  }
  return t1;
}
function _temp5(line, i) {
  return _jsx(Text, {
    children: line
  }, i);
}
function _temp4() {
  return patchOverlayState({
    skillsHub: false
  });
}
function _temp3() {
  return patchOverlayState({
    modelPicker: false
  });
}
function _temp2() {
  return patchOverlayState({
    picker: false
  });
}