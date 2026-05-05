import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput, useStdout } from '@hermes/ink';
import { useEffect, useMemo, useState } from 'react';
import { providerDisplayNames } from '../domain/providers.js';
import { TUI_SESSION_MODEL_FLAG } from '../domain/slash.js';
import { asRpcResult, rpcErrorMessage } from '../lib/rpc.js';
import { OverlayHint, useOverlayKeys, windowItems } from './overlayControls.js';
const VISIBLE = 12;
const MIN_WIDTH = 40;
const MAX_WIDTH = 90;
export function ModelPicker(t0) {
  const $ = _c(44);
  const {
    gw,
    onCancel,
    onSelect,
    sessionId,
    t
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [providers, setProviders] = useState(t1);
  const [currentModel, setCurrentModel] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [persistGlobal, setPersistGlobal] = useState(false);
  const [providerIdx, setProviderIdx] = useState(0);
  const [modelIdx, setModelIdx] = useState(0);
  const [stage, setStage] = useState("provider");
  const [keyInput, setKeyInput] = useState("");
  const [keySaving, setKeySaving] = useState(false);
  const [keyError, setKeyError] = useState("");
  const {
    stdout
  } = useStdout();
  const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, (stdout?.columns ?? 80) - 6));
  let t2;
  let t3;
  if ($[1] !== gw || $[2] !== sessionId) {
    t2 = () => {
      gw.request("model.options", sessionId ? {
        session_id: sessionId
      } : {}).then(raw => {
        const r = asRpcResult(raw);
        if (!r) {
          setErr("invalid response: model.options");
          setLoading(false);
          return;
        }
        const next = r.providers ?? [];
        setProviders(next);
        setCurrentModel(String(r.model ?? ""));
        setProviderIdx(Math.max(0, next.findIndex(_temp)));
        setModelIdx(0);
        setStage("provider");
        setErr("");
        setLoading(false);
      }).catch(e => {
        setErr(rpcErrorMessage(e));
        setLoading(false);
      });
    };
    t3 = [gw, sessionId];
    $[1] = gw;
    $[2] = sessionId;
    $[3] = t2;
    $[4] = t3;
  } else {
    t2 = $[3];
    t3 = $[4];
  }
  useEffect(t2, t3);
  const provider = providers[providerIdx];
  const models = provider?.models ?? [];
  let t4;
  if ($[5] !== providers) {
    t4 = providerDisplayNames(providers);
    $[5] = providers;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  const names = t4;
  let t5;
  if ($[7] !== onCancel || $[8] !== stage) {
    t5 = () => {
      if (stage === "model" || stage === "key" || stage === "disconnect") {
        setStage("provider");
        setModelIdx(0);
        setKeyInput("");
        setKeyError("");
        setKeySaving(false);
        return;
      }
      onCancel();
    };
    $[7] = onCancel;
    $[8] = stage;
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  const back = t5;
  let t6;
  if ($[10] !== back || $[11] !== onCancel) {
    t6 = {
      onBack: back,
      onClose: onCancel
    };
    $[10] = back;
    $[11] = onCancel;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  useOverlayKeys(t6);
  useInput((ch, key) => {
    if (stage === "key") {
      if (keySaving) {
        return;
      }
      if (key.return) {
        if (!keyInput.trim()) {
          return;
        }
        setKeySaving(true);
        setKeyError("");
        gw.request("model.save_key", {
          slug: provider?.slug,
          api_key: keyInput.trim(),
          ...(sessionId ? {
            session_id: sessionId
          } : {})
        }).then(raw_0 => {
          const r_0 = asRpcResult(raw_0);
          if (!r_0?.provider) {
            setKeyError("failed to save key");
            setKeySaving(false);
            return;
          }
          setProviders(prev => prev.map(p_0 => p_0.slug === r_0.provider.slug ? r_0.provider : p_0));
          setKeyInput("");
          setKeySaving(false);
          setStage("model");
          setModelIdx(0);
        }).catch(e_0 => {
          setKeyError(rpcErrorMessage(e_0));
          setKeySaving(false);
        });
        return;
      }
      if (key.backspace || key.delete) {
        setKeyInput(_temp2);
        return;
      }
      if (ch === "\x15") {
        setKeyInput("");
        return;
      }
      if (ch && !key.ctrl && !key.meta) {
        setKeyInput(v_0 => v_0 + ch);
      }
      return;
    }
    if (stage === "disconnect") {
      if (ch.toLowerCase() === "y" || key.return) {
        if (!provider) {
          setStage("provider");
          return;
        }
        setKeySaving(true);
        gw.request("model.disconnect", {
          slug: provider.slug,
          ...(sessionId ? {
            session_id: sessionId
          } : {})
        }).then(raw_1 => {
          const r_1 = asRpcResult(raw_1);
          if (r_1?.disconnected) {
            setProviders(prev_0 => prev_0.map(p_1 => p_1.slug === provider.slug ? {
              ...p_1,
              authenticated: false,
              models: [],
              total_models: 0,
              warning: p_1.key_env ? `paste ${p_1.key_env} to activate` : "run `hermes model` to configure"
            } : p_1));
          }
          setKeySaving(false);
          setStage("provider");
        }).catch(() => {
          setKeySaving(false);
          setStage("provider");
        });
        return;
      }
      if (ch.toLowerCase() === "n" || key.escape) {
        setStage("provider");
        return;
      }
      return;
    }
    const count = stage === "provider" ? providers.length : models.length;
    const sel = stage === "provider" ? providerIdx : modelIdx;
    const setSel = stage === "provider" ? setProviderIdx : setModelIdx;
    if (key.upArrow && sel > 0) {
      setSel(_temp3);
      return;
    }
    if (key.downArrow && sel < count - 1) {
      setSel(_temp4);
      return;
    }
    if (key.return) {
      if (stage === "provider") {
        if (!provider) {
          return;
        }
        if (provider.authenticated === false) {
          if (provider.auth_type === "api_key" && provider.key_env) {
            setStage("key");
            setKeyInput("");
            setKeyError("");
          }
          return;
        }
        setStage("model");
        setModelIdx(0);
        return;
      }
      const model = models[modelIdx];
      if (provider && model) {
        onSelect(`${model} --provider ${provider.slug}${persistGlobal ? " --global" : ` ${TUI_SESSION_MODEL_FLAG}`}`);
      } else {
        setStage("provider");
      }
      return;
    }
    if (ch.toLowerCase() === "g") {
      setPersistGlobal(_temp5);
      return;
    }
    if (ch.toLowerCase() === "d" && stage === "provider" && provider?.authenticated !== false) {
      setStage("disconnect");
      return;
    }
  });
  if (loading) {
    let t7;
    if ($[13] !== t.color.muted) {
      t7 = _jsx(Text, {
        color: t.color.muted,
        children: "loading models\u2026"
      });
      $[13] = t.color.muted;
      $[14] = t7;
    } else {
      t7 = $[14];
    }
    return t7;
  }
  if (err) {
    let t7;
    if ($[15] !== err || $[16] !== t) {
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
      $[15] = err;
      $[16] = t;
      $[17] = t7;
    } else {
      t7 = $[17];
    }
    return t7;
  }
  if (!providers.length) {
    let t7;
    if ($[18] !== t) {
      t7 = _jsxs(Box, {
        flexDirection: "column",
        children: [_jsx(Text, {
          color: t.color.muted,
          children: "no providers available"
        }), _jsx(OverlayHint, {
          t,
          children: "Esc/q cancel"
        })]
      });
      $[18] = t;
      $[19] = t7;
    } else {
      t7 = $[19];
    }
    return t7;
  }
  if (stage === "key" && provider) {
    let t7;
    if ($[20] !== keyError || $[21] !== keyInput || $[22] !== keySaving || $[23] !== provider.key_env || $[24] !== provider.name || $[25] !== t || $[26] !== width) {
      const masked = keyInput ? "\u2022".repeat(Math.min(keyInput.length, 40)) : "";
      t7 = _jsxs(Box, {
        flexDirection: "column",
        width,
        children: [_jsxs(Text, {
          bold: true,
          color: t.color.accent,
          wrap: "truncate-end",
          children: ["Configure ", provider.name]
        }), _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: "Paste your API key below (saved to ~/.hermes/.env)"
        }), _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: " "
        }), _jsxs(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: [provider.key_env, ":"]
        }), _jsxs(Text, {
          color: t.color.accent,
          wrap: "truncate-end",
          children: ["  ", masked || "(empty)", keySaving ? "" : "\u258E"]
        }), _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: " "
        }), keyError ? _jsxs(Text, {
          color: t.color.label,
          wrap: "truncate-end",
          children: ["error: ", keyError]
        }) : keySaving ? _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: "saving\u2026"
        }) : _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: " "
        }), _jsx(OverlayHint, {
          t,
          children: "Enter save \xB7 Ctrl+U clear \xB7 Esc back"
        })]
      });
      $[20] = keyError;
      $[21] = keyInput;
      $[22] = keySaving;
      $[23] = provider.key_env;
      $[24] = provider.name;
      $[25] = t;
      $[26] = width;
      $[27] = t7;
    } else {
      t7 = $[27];
    }
    return t7;
  }
  if (stage === "disconnect" && provider) {
    let t7;
    if ($[28] !== keySaving || $[29] !== provider.name || $[30] !== t || $[31] !== width) {
      t7 = _jsxs(Box, {
        flexDirection: "column",
        width,
        children: [_jsxs(Text, {
          bold: true,
          color: t.color.accent,
          wrap: "truncate-end",
          children: ["Disconnect ", provider.name, "?"]
        }), _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: " "
        }), _jsxs(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: ["This removes saved credentials for ", provider.name, "."]
        }), _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: "You can re-authenticate later by selecting it again."
        }), _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: " "
        }), keySaving ? _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: "disconnecting\u2026"
        }) : _jsx(OverlayHint, {
          t,
          children: "y/Enter confirm \xB7 n/Esc cancel"
        })]
      });
      $[28] = keySaving;
      $[29] = provider.name;
      $[30] = t;
      $[31] = width;
      $[32] = t7;
    } else {
      t7 = $[32];
    }
    return t7;
  }
  if (stage === "provider") {
    let t7;
    if ($[33] !== currentModel || $[34] !== names || $[35] !== persistGlobal || $[36] !== provider || $[37] !== providerIdx || $[38] !== providers || $[39] !== t || $[40] !== width) {
      let t8;
      if ($[42] !== names) {
        t8 = (p_2, i) => {
          const authMark = p_2.authenticated === false ? "\u25CB" : p_2.is_current ? "*" : "\u25CF";
          const modelCount = p_2.total_models ?? p_2.models?.length ?? 0;
          const suffix = p_2.authenticated === false ? p_2.auth_type === "api_key" ? "(no key)" : "(needs setup)" : `${modelCount} models`;
          return `${authMark} ${names[i]} · ${suffix}`;
        };
        $[42] = names;
        $[43] = t8;
      } else {
        t8 = $[43];
      }
      const rows = providers.map(t8);
      const {
        items,
        offset
      } = windowItems(rows, providerIdx, VISIBLE);
      t7 = _jsxs(Box, {
        flexDirection: "column",
        width,
        children: [_jsx(Text, {
          bold: true,
          color: t.color.accent,
          wrap: "truncate-end",
          children: "Select provider (step 1/2)"
        }), _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: "Full model IDs on the next step \xB7 Enter to continue"
        }), _jsxs(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: ["Current: ", currentModel || "(unknown)"]
        }), _jsx(Text, {
          color: t.color.label,
          wrap: "truncate-end",
          children: provider?.warning ? `warning: ${provider.warning}` : " "
        }), _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: offset > 0 ? ` ↑ ${offset} more` : " "
        }), Array.from({
          length: VISIBLE
        }, (_, i_0) => {
          const row = items[i_0];
          const idx = offset + i_0;
          const p_3 = providers[idx];
          const dimmed = p_3?.authenticated === false;
          return row ? _jsxs(Text, {
            bold: providerIdx === idx,
            color: providerIdx === idx ? t.color.accent : dimmed ? t.color.label : t.color.muted,
            inverse: providerIdx === idx,
            wrap: "truncate-end",
            children: [providerIdx === idx ? "\u25B8 " : "  ", idx + 1, ". ", row]
          }, providers[idx]?.slug ?? `row-${idx}`) : _jsx(Text, {
            color: t.color.muted,
            wrap: "truncate-end",
            children: " "
          }, `pad-${i_0}`);
        }), _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: offset + VISIBLE < rows.length ? ` ↓ ${rows.length - offset - VISIBLE} more` : " "
        }), _jsxs(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: ["persist: ", persistGlobal ? "global" : "session", " \xB7 g toggle"]
        }), _jsx(OverlayHint, {
          t,
          children: "\u2191/\u2193 select \xB7 Enter choose \xB7 d disconnect \xB7 Esc/q cancel"
        })]
      });
      $[33] = currentModel;
      $[34] = names;
      $[35] = persistGlobal;
      $[36] = provider;
      $[37] = providerIdx;
      $[38] = providers;
      $[39] = t;
      $[40] = width;
      $[41] = t7;
    } else {
      t7 = $[41];
    }
    return t7;
  }
  const {
    items: items_0,
    offset: offset_0
  } = windowItems(models, modelIdx, VISIBLE);
  return _jsxs(Box, {
    flexDirection: "column",
    width,
    children: [_jsx(Text, {
      bold: true,
      color: t.color.accent,
      wrap: "truncate-end",
      children: "Select model (step 2/2)"
    }), _jsxs(Text, {
      color: t.color.muted,
      wrap: "truncate-end",
      children: [names[providerIdx] || "(unknown provider)", " \xB7 Esc back"]
    }), _jsx(Text, {
      color: t.color.label,
      wrap: "truncate-end",
      children: provider?.warning ? `warning: ${provider.warning}` : " "
    }), _jsx(Text, {
      color: t.color.muted,
      wrap: "truncate-end",
      children: offset_0 > 0 ? ` ↑ ${offset_0} more` : " "
    }), Array.from({
      length: VISIBLE
    }, (__0, i_1) => {
      const row_0 = items_0[i_1];
      const idx_0 = offset_0 + i_1;
      if (!row_0) {
        return !models.length && i_1 === 0 ? _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: "no models listed for this provider"
        }, "empty") : _jsx(Text, {
          color: t.color.muted,
          wrap: "truncate-end",
          children: " "
        }, `pad-${i_1}`);
      }
      const prefix = modelIdx === idx_0 ? "\u25B8 " : row_0 === currentModel ? "* " : "  ";
      return _jsxs(Text, {
        bold: modelIdx === idx_0,
        color: modelIdx === idx_0 ? t.color.accent : t.color.muted,
        inverse: modelIdx === idx_0,
        wrap: "truncate-end",
        children: [prefix, idx_0 + 1, ". ", row_0]
      }, `${provider?.slug ?? "prov"}:${idx_0}:${row_0}`);
    }), _jsx(Text, {
      color: t.color.muted,
      wrap: "truncate-end",
      children: offset_0 + VISIBLE < models.length ? ` ↓ ${models.length - offset_0 - VISIBLE} more` : " "
    }), _jsxs(Text, {
      color: t.color.muted,
      wrap: "truncate-end",
      children: ["persist: ", persistGlobal ? "global" : "session", " \xB7 g toggle"]
    }), _jsx(OverlayHint, {
      t,
      children: models.length ? "\u2191/\u2193 select \xB7 Enter switch \xB7 Esc back \xB7 q close" : "Enter/Esc back \xB7 q close"
    })]
  });
}
function _temp5(v_3) {
  return !v_3;
}
function _temp4(v_2) {
  return v_2 + 1;
}
function _temp3(v_1) {
  return v_1 - 1;
}
function _temp2(v) {
  return v.slice(0, -1);
}
function _temp(p) {
  return p.is_current;
}