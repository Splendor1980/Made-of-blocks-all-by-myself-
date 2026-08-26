export function emptyState() {
  return { launches: 0, png: 0, returns: 0, days: [] };
}

export function recordLaunch(state, now = new Date()) {
  const s = { ...state, days: [...state.days] };
  s.launches += 1;
  const d = now.toISOString().slice(0, 10);
  if (!s.days.includes(d)) {
    s.days.push(d);
    if (s.days.length > 1) s.returns += 1;
  }
  return s;
}

export function recordPng(state) {
  return { ...state, png: state.png + 1 };
}

export function gateStatus(
  state,
  t = { launches: 20, png: 10, returns: 5 },
) {
  return {
    launches: state.launches,
    png: state.png,
    returns: state.returns,
    thresholds: t,
    passed:
      state.launches >= t.launches &&
      state.png >= t.png &&
      state.returns >= t.returns,
  };
}
