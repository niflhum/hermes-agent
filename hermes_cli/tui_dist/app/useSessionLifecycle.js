import { c as _c } from "react/compiler-runtime";
import { writeFileSync } from 'node:fs';
import { evictInkCaches } from '@hermes/ink';
import { useCallback } from 'react';
import { buildSetupRequiredSections, SETUP_REQUIRED_TITLE } from '../content/setup.js';
import { introMsg, toTranscriptMessages } from '../domain/messages.js';
import { ZERO } from '../domain/usage.js';
import { asRpcResult } from '../lib/rpc.js';
import { patchOverlayState } from './overlayStore.js';
import { turnController } from './turnController.js';
import { patchTurnState } from './turnStore.js';
import { getUiState, patchUiState } from './uiStore.js';
const usageFrom = info => info?.usage ? {
  ...ZERO,
  ...info.usage
} : ZERO;
export const writeActiveSessionFile = (sessionId, file = process.env.HERMES_TUI_ACTIVE_SESSION_FILE) => {
  if (!file || !sessionId) {
    return;
  }
  try {
    writeFileSync(file, JSON.stringify({
      session_id: sessionId
    }), {
      mode: 0o600
    });
  } catch {
    // Best-effort shell epilogue hint only; never break live session changes.
  }
};
const trimTail = items => {
  const q = [...items];
  while (q.at(-1)?.role === 'assistant' || q.at(-1)?.role === 'tool') {
    q.pop();
  }
  if (q.at(-1)?.role === 'user') {
    q.pop();
  }
  return q;
};
export function useSessionLifecycle(opts) {
  const $ = _c(43);
  const {
    colsRef,
    composerActions,
    gw,
    panel,
    rpc,
    scrollRef,
    setHistoryItems,
    setLastUserMsg,
    setSessionStartedAt,
    setStickyPrompt,
    setVoiceProcessing,
    setVoiceRecording,
    sys
  } = opts;
  let t0;
  if ($[0] !== rpc) {
    t0 = targetSid => targetSid ? rpc("session.close", {
      session_id: targetSid
    }) : Promise.resolve(null);
    $[0] = rpc;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const closeSession = t0;
  let t1;
  if ($[2] !== composerActions || $[3] !== setHistoryItems || $[4] !== setLastUserMsg || $[5] !== setStickyPrompt || $[6] !== setVoiceProcessing || $[7] !== setVoiceRecording) {
    t1 = () => {
      turnController.fullReset();
      setVoiceRecording(false);
      setVoiceProcessing(false);
      patchUiState({
        bgTasks: new Set(),
        info: null,
        sid: null,
        usage: ZERO
      });
      setHistoryItems([]);
      setLastUserMsg("");
      setStickyPrompt("");
      composerActions.setPasteSnips([]);
      evictInkCaches("half");
    };
    $[2] = composerActions;
    $[3] = setHistoryItems;
    $[4] = setLastUserMsg;
    $[5] = setStickyPrompt;
    $[6] = setVoiceProcessing;
    $[7] = setVoiceRecording;
    $[8] = t1;
  } else {
    t1 = $[8];
  }
  const resetSession = t1;
  let t2;
  if ($[9] !== composerActions || $[10] !== setHistoryItems || $[11] !== setLastUserMsg || $[12] !== setStickyPrompt) {
    t2 = t3 => {
      const info = t3 === undefined ? null : t3;
      turnController.idle();
      turnController.clearReasoning();
      turnController.turnTools = [];
      turnController.persistedToolLabels.clear();
      setHistoryItems(info ? [introMsg(info)] : []);
      setStickyPrompt("");
      setLastUserMsg("");
      composerActions.setPasteSnips([]);
      patchTurnState({
        activity: []
      });
      patchUiState({
        info,
        usage: usageFrom(info)
      });
    };
    $[9] = composerActions;
    $[10] = setHistoryItems;
    $[11] = setLastUserMsg;
    $[12] = setStickyPrompt;
    $[13] = t2;
  } else {
    t2 = $[13];
  }
  const resetVisibleHistory = t2;
  let t3;
  if ($[14] !== closeSession || $[15] !== colsRef || $[16] !== panel || $[17] !== resetSession || $[18] !== rpc || $[19] !== setHistoryItems || $[20] !== setSessionStartedAt || $[21] !== sys) {
    t3 = async msg => {
      const setup = await rpc("setup.status", {});
      if (setup?.provider_configured === false) {
        panel(SETUP_REQUIRED_TITLE, buildSetupRequiredSections());
        patchUiState({
          status: "setup required"
        });
        return;
      }
      await closeSession(getUiState().sid);
      const r = await rpc("session.create", {
        cols: colsRef.current
      });
      if (!r) {
        return patchUiState({
          status: "ready"
        });
      }
      const info_0 = r.info ?? null;
      resetSession();
      setSessionStartedAt(Date.now());
      writeActiveSessionFile(r.session_id);
      patchUiState({
        info: info_0,
        sid: r.session_id,
        status: info_0?.version ? "ready" : "starting agent\u2026",
        usage: usageFrom(info_0)
      });
      if (info_0) {
        setHistoryItems([introMsg(info_0)]);
      }
      if (info_0?.credential_warning) {
        sys(`warning: ${info_0.credential_warning}`);
      }
      if (info_0?.config_warning) {
        sys(`warning: ${info_0.config_warning}`);
      }
      if (msg) {
        sys(msg);
      }
    };
    $[14] = closeSession;
    $[15] = colsRef;
    $[16] = panel;
    $[17] = resetSession;
    $[18] = rpc;
    $[19] = setHistoryItems;
    $[20] = setSessionStartedAt;
    $[21] = sys;
    $[22] = t3;
  } else {
    t3 = $[22];
  }
  const newSession = t3;
  let t4;
  if ($[23] !== closeSession || $[24] !== colsRef || $[25] !== gw || $[26] !== panel || $[27] !== resetSession || $[28] !== rpc || $[29] !== scrollRef || $[30] !== setHistoryItems || $[31] !== setSessionStartedAt || $[32] !== sys) {
    t4 = id => {
      patchOverlayState({
        picker: false
      });
      patchUiState({
        status: "resuming\u2026"
      });
      rpc("setup.status", {}).then(setup_0 => {
        if (setup_0?.provider_configured === false) {
          panel(SETUP_REQUIRED_TITLE, buildSetupRequiredSections());
          patchUiState({
            status: "setup required"
          });
          return;
        }
        closeSession(getUiState().sid === id ? null : getUiState().sid).then(() => gw.request("session.resume", {
          cols: colsRef.current,
          session_id: id
        }).then(raw => {
          const r_0 = asRpcResult(raw);
          if (!r_0) {
            sys("error: invalid response: session.resume");
            return patchUiState({
              status: "ready"
            });
          }
          resetSession();
          setSessionStartedAt(Date.now());
          const resumed = toTranscriptMessages(r_0.messages);
          setHistoryItems(r_0.info ? [introMsg(r_0.info), ...resumed] : resumed);
          writeActiveSessionFile(r_0.resumed ?? r_0.session_id);
          patchUiState({
            info: r_0.info ?? null,
            sid: r_0.session_id,
            status: "ready",
            usage: usageFrom(r_0.info ?? null)
          });
          setTimeout(() => scrollRef.current?.scrollToBottom(), 0);
        }).catch(e => {
          sys(`error: ${e.message}`);
          patchUiState({
            status: "ready"
          });
        }));
      });
    };
    $[23] = closeSession;
    $[24] = colsRef;
    $[25] = gw;
    $[26] = panel;
    $[27] = resetSession;
    $[28] = rpc;
    $[29] = scrollRef;
    $[30] = setHistoryItems;
    $[31] = setSessionStartedAt;
    $[32] = sys;
    $[33] = t4;
  } else {
    t4 = $[33];
  }
  const resumeById = t4;
  let t5;
  if ($[34] !== sys) {
    t5 = t6 => {
      const what = t6 === undefined ? "switch sessions" : t6;
      if (!getUiState().busy) {
        return false;
      }
      sys(`interrupt the current turn before trying to ${what}`);
      return true;
    };
    $[34] = sys;
    $[35] = t5;
  } else {
    t5 = $[35];
  }
  const guardBusySessionSwitch = t5;
  let t6;
  if ($[36] !== closeSession || $[37] !== guardBusySessionSwitch || $[38] !== newSession || $[39] !== resetSession || $[40] !== resetVisibleHistory || $[41] !== resumeById) {
    t6 = {
      closeSession,
      guardBusySessionSwitch,
      newSession,
      resetSession,
      resetVisibleHistory,
      resumeById,
      trimLastExchange: trimTail
    };
    $[36] = closeSession;
    $[37] = guardBusySessionSwitch;
    $[38] = newSession;
    $[39] = resetSession;
    $[40] = resetVisibleHistory;
    $[41] = resumeById;
    $[42] = t6;
  } else {
    t6 = $[42];
  }
  return t6;
}