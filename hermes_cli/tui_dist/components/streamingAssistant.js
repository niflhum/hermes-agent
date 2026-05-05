import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from '@nanostores/react';
import { memo } from 'react';
import { toggleTodoCollapsed, useTurnSelector } from '../app/turnStore.js';
import { $uiState } from '../app/uiStore.js';
import { appendToolShelfMessage } from '../lib/liveProgress.js';
import { MessageLine } from './messageLine.js';
import { TodoPanel } from './todoPanel.js';
const groupedSegments = segments => segments.reduce((acc, msg) => appendToolShelfMessage(acc, msg), []);
export const StreamingAssistant = memo(function StreamingAssistant(t0) {
  const $ = _c(19);
  const {
    cols,
    compact,
    detailsMode,
    detailsModeCommandOverride,
    progress,
    sections
  } = t0;
  const ui = useStore($uiState);
  const streamSegments = useTurnSelector(_temp);
  const streamPendingTools = useTurnSelector(_temp2);
  const streaming = useTurnSelector(_temp3);
  const activeTools = useTurnSelector(_temp4);
  const showStreamingArea = Boolean(streaming);
  if (!progress.showProgressArea && !showStreamingArea && !activeTools.length) {
    return null;
  }
  let t1;
  if ($[0] !== activeTools || $[1] !== cols || $[2] !== compact || $[3] !== detailsMode || $[4] !== detailsModeCommandOverride || $[5] !== sections || $[6] !== showStreamingArea || $[7] !== streamPendingTools || $[8] !== streamSegments || $[9] !== streaming || $[10] !== ui) {
    let t2;
    if ($[12] !== cols || $[13] !== compact || $[14] !== detailsMode || $[15] !== detailsModeCommandOverride || $[16] !== sections || $[17] !== ui) {
      t2 = (msg, i) => _jsx(MessageLine, {
        cols,
        compact,
        detailsMode,
        detailsModeCommandOverride,
        msg,
        sections,
        t: ui.theme
      }, `seg:${i}`);
      $[12] = cols;
      $[13] = compact;
      $[14] = detailsMode;
      $[15] = detailsModeCommandOverride;
      $[16] = sections;
      $[17] = ui;
      $[18] = t2;
    } else {
      t2 = $[18];
    }
    t1 = _jsxs(_Fragment, {
      children: [groupedSegments(streamSegments).map(t2), !!activeTools.length && _jsx(MessageLine, {
        cols,
        compact,
        detailsMode,
        detailsModeCommandOverride,
        msg: {
          kind: "trail",
          role: "system",
          text: ""
        },
        sections,
        t: ui.theme,
        tools: activeTools
      }), showStreamingArea && _jsx(MessageLine, {
        cols,
        compact,
        detailsMode,
        detailsModeCommandOverride,
        isStreaming: true,
        msg: {
          role: "assistant",
          text: streaming,
          ...(streamPendingTools.length && {
            tools: streamPendingTools
          })
        },
        sections,
        t: ui.theme
      }), !showStreamingArea && !!streamPendingTools.length && _jsx(MessageLine, {
        cols,
        compact,
        detailsMode,
        detailsModeCommandOverride,
        msg: {
          kind: "trail",
          role: "system",
          text: "",
          tools: streamPendingTools
        },
        sections,
        t: ui.theme
      })]
    });
    $[0] = activeTools;
    $[1] = cols;
    $[2] = compact;
    $[3] = detailsMode;
    $[4] = detailsModeCommandOverride;
    $[5] = sections;
    $[6] = showStreamingArea;
    $[7] = streamPendingTools;
    $[8] = streamSegments;
    $[9] = streaming;
    $[10] = ui;
    $[11] = t1;
  } else {
    t1 = $[11];
  }
  return t1;
});
export const LiveTodoPanel = memo(function LiveTodoPanel() {
  const $ = _c(4);
  const ui = useStore($uiState);
  const todos = useTurnSelector(_temp5);
  const collapsed = useTurnSelector(_temp6);
  let t0;
  if ($[0] !== collapsed || $[1] !== todos || $[2] !== ui.theme) {
    t0 = _jsx(TodoPanel, {
      collapsed,
      onToggle: toggleTodoCollapsed,
      t: ui.theme,
      todos
    });
    $[0] = collapsed;
    $[1] = todos;
    $[2] = ui.theme;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
});
function _temp(state) {
  return state.streamSegments;
}
function _temp2(state_0) {
  return state_0.streamPendingTools;
}
function _temp3(state_1) {
  return state_1.streaming;
}
function _temp4(state_2) {
  return state_2.tools;
}
function _temp5(state) {
  return state.todos;
}
function _temp6(state_0) {
  return state_0.todoCollapsed;
}