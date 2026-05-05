import { c as _c } from "react/compiler-runtime";
import { useCallback, useMemo, useSyncExternalStore } from 'react';
const EMPTY = {
  atBottom: true,
  bottom: 0,
  pending: 0,
  scrollHeight: 0,
  top: 0,
  viewportHeight: 0
};
export function getViewportSnapshot(s) {
  if (!s) {
    return EMPTY;
  }
  const pending = s.getPendingDelta();
  const top = Math.max(0, s.getScrollTop() + pending);
  const viewportHeight = Math.max(0, s.getViewportHeight());
  const cachedScrollHeight = Math.max(viewportHeight, s.getScrollHeight());
  let scrollHeight = cachedScrollHeight;
  const bottom = top + viewportHeight;
  let atBottom = s.isSticky() || bottom >= scrollHeight - 2;
  if (!atBottom) {
    scrollHeight = Math.max(viewportHeight, s.getFreshScrollHeight?.() ?? cachedScrollHeight);
    atBottom = s.isSticky() || bottom >= scrollHeight - 2;
  }
  return {
    atBottom,
    bottom,
    pending,
    scrollHeight,
    top,
    viewportHeight
  };
}
export function viewportSnapshotKey(v) {
  return `${v.atBottom ? 1 : 0}:${Math.ceil(v.top / 8) * 8}:${v.viewportHeight}:${Math.ceil(v.scrollHeight / 8) * 8}:${v.pending}`;
}
export function useViewportSnapshot(scrollRef) {
  const $ = _c(13);
  let t0;
  if ($[0] !== scrollRef) {
    t0 = cb => scrollRef.current?.subscribe(cb) ?? _temp;
    $[0] = scrollRef;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== scrollRef) {
    t1 = () => viewportSnapshotKey(getViewportSnapshot(scrollRef.current));
    $[2] = scrollRef;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const key = useSyncExternalStore(t0, t1, _temp2);
  let t2;
  if ($[4] !== key) {
    t2 = key.split(":");
    $[4] = key;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const [t3, t4, t5, t6, t7] = t2;
  const atBottom = t3 === undefined ? "1" : t3;
  const top = t4 === undefined ? "0" : t4;
  const viewportHeight = t5 === undefined ? "0" : t5;
  const scrollHeight = t6 === undefined ? "0" : t6;
  const pending = t7 === undefined ? "0" : t7;
  const t8 = atBottom === "1";
  const t9 = Number(top) + Number(viewportHeight);
  const t10 = Number(pending);
  const t11 = Number(scrollHeight);
  const t12 = Number(top);
  const t13 = Number(viewportHeight);
  let t14;
  if ($[6] !== t10 || $[7] !== t11 || $[8] !== t12 || $[9] !== t13 || $[10] !== t8 || $[11] !== t9) {
    t14 = {
      atBottom: t8,
      bottom: t9,
      pending: t10,
      scrollHeight: t11,
      top: t12,
      viewportHeight: t13
    };
    $[6] = t10;
    $[7] = t11;
    $[8] = t12;
    $[9] = t13;
    $[10] = t8;
    $[11] = t9;
    $[12] = t14;
  } else {
    t14 = $[12];
  }
  return t14;
}
function _temp2() {
  return viewportSnapshotKey(EMPTY);
}
function _temp() {}