import { useCallback, useEffect, useRef } from 'react';
import { TYPING_IDLE_MS } from '../config/timing.js';
import { attachedImageNotice } from '../domain/messages.js';
import { looksLikeSlashCommand } from '../domain/slash.js';
import { asRpcResult } from '../lib/rpc.js';
import { hasInterpolation, INTERPOLATION_RE } from '../protocol/interpolation.js';
import { PASTE_SNIPPET_RE } from '../protocol/paste.js';
import { turnController } from './turnController.js';
import { getUiState, patchUiState } from './uiStore.js';
const DOUBLE_ENTER_MS = 450;
const SESSION_BUSY_RE = /session busy|waiting for model response/i;
const isSessionBusyError = e => e instanceof Error && SESSION_BUSY_RE.test(e.message);
const expandSnips = snips => {
  const byLabel = new Map();
  for (const {
    label,
    text
  } of snips) {
    const hit = byLabel.get(label);
    hit ? hit.push(text) : byLabel.set(label, [text]);
  }
  return value => value.replace(PASTE_SNIPPET_RE, tok => byLabel.get(tok)?.shift() ?? tok);
};
const spliceMatches = (text, matches, results) => matches.reduceRight((acc, m, i) => acc.slice(0, m.index) + results[i] + acc.slice(m.index + m[0].length), text);
export function useSubmission(opts) {
  const {
    appendMessage,
    composerActions,
    composerRefs,
    composerState,
    gw,
    maybeGoodVibes,
    setLastUserMsg,
    slashRef,
    submitRef,
    sys
  } = opts;
  const lastEmptyAt = useRef(0);
  const typingIdleTimer = useRef(null);
  useEffect(() => {
    if (typingIdleTimer.current) {
      clearTimeout(typingIdleTimer.current);
      typingIdleTimer.current = null;
    }
    if (!composerState.input && !composerState.inputBuf.length) {
      turnController.relaxStreaming();
      return;
    }
    if (getUiState().busy) {
      turnController.boostStreamingForTyping();
    }
    typingIdleTimer.current = setTimeout(() => {
      typingIdleTimer.current = null;
      turnController.relaxStreaming();
    }, TYPING_IDLE_MS);
    return () => {
      if (typingIdleTimer.current) {
        clearTimeout(typingIdleTimer.current);
        typingIdleTimer.current = null;
      }
    };
  }, [composerState.input, composerState.inputBuf]);
  const send = useCallback((text, showUserMessage = true) => {
    const expand = expandSnips(composerState.pasteSnips);
    const startSubmit = (displayText, submitText, showUserMessage_0 = true) => {
      const sid = getUiState().sid;
      if (!sid) {
        return sys('session not ready yet');
      }
      turnController.clearStatusTimer();
      maybeGoodVibes(submitText);
      setLastUserMsg(text);
      if (showUserMessage_0) {
        appendMessage({
          role: 'user',
          text: displayText
        });
      }
      patchUiState({
        busy: true,
        status: 'running…'
      });
      turnController.bufRef = '';
      turnController.interrupted = false;
      gw.request('prompt.submit', {
        session_id: sid,
        text: submitText
      }).catch(e => {
        if (isSessionBusyError(e)) {
          composerActions.enqueue(submitText);
          patchUiState({
            busy: true,
            status: 'queued for next turn'
          });
          return sys(`queued: "${submitText.slice(0, 50)}${submitText.length > 50 ? '…' : ''}"`);
        }
        sys(`error: ${e.message}`);
        patchUiState({
          busy: false,
          status: 'ready'
        });
      });
    };
    const sid_0 = getUiState().sid;
    if (!sid_0) {
      return sys('session not ready yet');
    }
    // Always ask the backend whether this looks like a file drop.
    // The backend's _detect_file_drop handles paths with spaces, quotes,
    // Windows drive letters, and escaped characters correctly.
    gw.request('input.detect_drop', {
      session_id: sid_0,
      text
    }).then(r => {
      if (!r?.matched) {
        return startSubmit(text, expand(text), showUserMessage);
      }
      if (r.is_image) {
        turnController.pushActivity(attachedImageNotice(r));
      } else {
        turnController.pushActivity(`detected file: ${r.name}`);
      }
      startSubmit(r.text || text, expand(r.text || text), showUserMessage);
    }).catch(() => startSubmit(text, expand(text), showUserMessage));
  }, [appendMessage, composerActions, composerState.pasteSnips, gw, maybeGoodVibes, setLastUserMsg, sys]);
  const shellExec = useCallback(cmd => {
    appendMessage({
      role: 'user',
      text: `!${cmd}`
    });
    patchUiState({
      busy: true,
      status: 'running…'
    });
    gw.request('shell.exec', {
      command: cmd
    }).then(raw => {
      const r_0 = asRpcResult(raw);
      if (!r_0) {
        return sys('error: invalid response: shell.exec');
      }
      const out = [r_0.stdout, r_0.stderr].filter(Boolean).join('\n').trim();
      if (out) {
        sys(out);
      }
      if (r_0.code !== 0 || !out) {
        sys(`exit ${r_0.code}`);
      }
    }).catch(e_0 => sys(`error: ${e_0.message}`)).finally(() => patchUiState({
      busy: false,
      status: 'ready'
    }));
  }, [appendMessage, gw, sys]);
  const interpolate = useCallback((text_0, then) => {
    patchUiState({
      status: 'interpolating…'
    });
    const matches = [...text_0.matchAll(new RegExp(INTERPOLATION_RE.source, 'g'))];
    Promise.all(matches.map(m => gw.request('shell.exec', {
      command: m[1]
    }).then(raw_0 => {
      const r_1 = asRpcResult(raw_0);
      return [r_1?.stdout, r_1?.stderr].filter(Boolean).join('\n').trim();
    }).catch(() => '(error)'))).then(results => then(spliceMatches(text_0, matches, results)));
  }, [gw]);
  const sendQueued = useCallback(text_1 => {
    if (text_1.startsWith('!')) {
      return shellExec(text_1.slice(1).trim());
    }
    if (hasInterpolation(text_1)) {
      patchUiState({
        busy: true
      });
      return interpolate(text_1, send);
    }
    send(text_1);
  }, [interpolate, send, shellExec]);
  // Honors `display.busy_input_mode` from config.yaml (CLI parity):
  //   - 'queue'     (legacy): append to queueRef; drains on busy → false
  //   - 'steer'     : inject into the current turn via session.steer; falls
  //                   back to queue when steer is rejected (no agent / no
  //                   tool window).
  //   - 'interrupt' (default): cancel the in-flight turn, then send the
  //                   new text as a fresh prompt so it actually moves.
  //
  // `opts.fallbackToFront` controls whether a steer fallback re-inserts
  // at the front of the queue (used by the queue-edit path to preserve
  // a picked item's position); the mainline submit path always appends.
  const handleBusyInput = useCallback((full, opts_0 = {}) => {
    const live = getUiState();
    const mode = live.busyInputMode;
    const fallback = note => {
      if (opts_0.fallbackToFront) {
        composerRefs.queueRef.current.unshift(full);
        composerActions.syncQueue();
      } else {
        composerActions.enqueue(full);
      }
      sys(note);
    };
    if (mode === 'queue') {
      return composerActions.enqueue(full);
    }
    if (mode === 'steer' && live.sid) {
      gw.request('session.steer', {
        session_id: live.sid,
        text: full
      }).then(raw_1 => {
        const r_2 = asRpcResult(raw_1);
        if (r_2?.status !== 'queued') {
          fallback('steer rejected — message queued for next turn');
        }
      }).catch(() => fallback('steer failed — message queued for next turn'));
      return;
    }
    // 'interrupt' (default): tear down the current turn, then send.
    // `interruptTurn` fires `session.interrupt` without awaiting; if
    // the gateway is still mid-response when `prompt.submit` lands,
    // `send()`'s catch path re-queues with a "queued: ..." sys note
    // (`isSessionBusyError`) — so a lost race degrades to queue
    // semantics, not a dropped message.
    if (live.sid) {
      turnController.interruptTurn({
        appendMessage,
        gw,
        sid: live.sid,
        sys
      });
    }
    if (hasInterpolation(full)) {
      patchUiState({
        busy: true
      });
      return interpolate(full, send);
    }
    send(full);
  }, [appendMessage, composerActions, composerRefs, gw, interpolate, send, sys]);
  const dispatchSubmission = useCallback(full_0 => {
    if (!full_0.trim()) {
      return;
    }
    if (looksLikeSlashCommand(full_0)) {
      appendMessage({
        kind: 'slash',
        role: 'system',
        text: full_0
      });
      composerActions.pushHistory(full_0);
      slashRef.current(full_0);
      composerActions.clearIn();
      return;
    }
    if (full_0.startsWith('!')) {
      composerActions.clearIn();
      return shellExec(full_0.slice(1).trim());
    }
    const live_0 = getUiState();
    if (!live_0.sid) {
      composerActions.pushHistory(full_0);
      composerActions.enqueue(full_0);
      composerActions.clearIn();
      return;
    }
    const editIdx = composerRefs.queueEditRef.current;
    composerActions.clearIn();
    if (editIdx !== null) {
      composerActions.replaceQueue(editIdx, full_0);
      const picked = composerRefs.queueRef.current.splice(editIdx, 1)[0];
      composerActions.syncQueue();
      composerActions.setQueueEdit(null);
      if (!picked || !live_0.sid) {
        return;
      }
      if (getUiState().busy) {
        // 'interrupt' / 'steer' should reach the live turn instead of
        // silently going back to the queue.  handleBusyInput resolves
        // mode-specific behavior (interrupt-and-send, steer, or queue).
        if (getUiState().busyInputMode === 'queue') {
          composerRefs.queueRef.current.unshift(picked);
          return composerActions.syncQueue();
        }
        return handleBusyInput(picked, {
          fallbackToFront: true
        });
      }
      return sendQueued(picked);
    }
    composerActions.pushHistory(full_0);
    if (getUiState().busy) {
      return handleBusyInput(full_0);
    }
    if (hasInterpolation(full_0)) {
      patchUiState({
        busy: true
      });
      return interpolate(full_0, send);
    }
    send(full_0);
  }, [appendMessage, composerActions, composerRefs, handleBusyInput, interpolate, send, sendQueued, shellExec, slashRef]);
  const submit = useCallback(value => {
    if (composerState.completions.length) {
      const row = composerState.completions[composerState.compIdx];
      if (row?.text) {
        const text_2 = value.startsWith('/') && row.text.startsWith('/') ? row.text.slice(1) : row.text;
        const next = value.slice(0, composerState.compReplace) + text_2;
        if (next !== value) {
          return composerActions.setInput(next);
        }
      }
    }
    if (!value.trim() && !composerState.inputBuf.length) {
      const live_1 = getUiState();
      const now = Date.now();
      const doubleTap = now - lastEmptyAt.current < DOUBLE_ENTER_MS;
      lastEmptyAt.current = now;
      if (doubleTap && live_1.busy && live_1.sid) {
        return turnController.interruptTurn({
          appendMessage,
          gw,
          sid: live_1.sid,
          sys
        });
      }
      if (doubleTap && live_1.sid && composerRefs.queueRef.current.length) {
        const next_0 = composerActions.dequeue();
        composerActions.syncQueue();
        if (next_0) {
          composerActions.setQueueEdit(null);
          dispatchSubmission(next_0);
        }
      }
      return;
    }
    lastEmptyAt.current = 0;
    if (value.endsWith('\\')) {
      composerActions.setInputBuf(prev => [...prev, value.slice(0, -1)]);
      return composerActions.setInput('');
    }
    dispatchSubmission([...composerState.inputBuf, value].join('\n'));
  }, [appendMessage, composerActions, composerRefs, composerState, dispatchSubmission, gw, sys]);
  submitRef.current = submit;
  return {
    dispatchSubmission,
    send,
    sendQueued,
    submit
  };
}