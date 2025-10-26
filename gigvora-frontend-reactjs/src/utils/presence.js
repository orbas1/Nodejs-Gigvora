const STATE_PRIORITIES = ['in_meeting', 'focus', 'do_not_disturb', 'away', 'available', 'offline'];

const STATE_LABELS = {
  in_meeting: 'In meeting',
  focus: 'Focus mode',
  do_not_disturb: 'Do not disturb',
  away: 'Away',
  available: 'Available',
  offline: 'Offline',
};

const STATE_TONES = {
  in_meeting: 'bg-amber-50 text-amber-700 ring-amber-500/40',
  focus: 'bg-indigo-50 text-indigo-700 ring-indigo-500/40',
  do_not_disturb: 'bg-rose-50 text-rose-700 ring-rose-500/40',
  away: 'bg-slate-100 text-slate-600 ring-slate-400/40',
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-500/40',
  offline: 'bg-slate-50 text-slate-500 ring-slate-300/40',
};

export function resolvePresenceState(snapshot = {}) {
  const states = Array.isArray(snapshot.states) ? snapshot.states : [];
  const explicit = snapshot.availability || snapshot.state;
  if (explicit && STATE_PRIORITIES.includes(explicit)) {
    return explicit;
  }

  if (states.length > 0) {
    const ranked = [...STATE_PRIORITIES];
    const found = ranked.find((candidate) => states.includes(candidate));
    if (found) {
      return found;
    }
  }

  return snapshot.online ? 'available' : 'offline';
}

export function getPresenceLabel(state) {
  return STATE_LABELS[state] || 'Unknown';
}

export function getPresenceTone(state) {
  return STATE_TONES[state] || STATE_TONES.offline;
}

export function buildTimeline(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => ({
      id: entry.id || entry.startAt || entry.timestamp || Math.random().toString(36).slice(2),
      type: entry.type || 'status',
      startAt: entry.startAt || entry.timestamp || null,
      endAt: entry.endAt || null,
      title: entry.title || entry.summary || '',
      description: entry.description || entry.details || entry.note || '',
    }))
    .sort((a, b) => {
      const left = a.startAt ? new Date(a.startAt).getTime() : 0;
      const right = b.startAt ? new Date(b.startAt).getTime() : 0;
      return left - right;
    });
}

export function extractNextCalendarEvent(calendar = {}) {
  const events = Array.isArray(calendar?.upcoming) ? calendar.upcoming : [];
  if (!events.length) {
    return null;
  }
  return events
    .map((event) => ({
      id: event.id,
      title: event.title || event.summary || 'Upcoming session',
      startsAt: event.startsAt || event.startAt || event.start,
      endsAt: event.endsAt || event.endAt || event.end,
      location: event.location || event.room || null,
      attendees: Array.isArray(event.attendees) ? event.attendees : [],
    }))
    .filter((event) => event.startsAt)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
}

export function buildPresenceSummary(snapshot = {}) {
  const state = resolvePresenceState(snapshot);
  const label = getPresenceLabel(state);
  const tone = getPresenceTone(state);
  const timeline = buildTimeline(snapshot.timeline || snapshot.history || []);
  const nextEvent = extractNextCalendarEvent(snapshot.calendar || {});
  const lastSeenAt = snapshot.lastSeenAt || snapshot.lastActiveAt || null;
  const customMessage = snapshot.message || snapshot.note || snapshot.statusMessage || '';
  const focusUntil = snapshot.focusUntil || snapshot.activeFocusSession?.endsAt || null;

  return {
    state,
    label,
    tone,
    timeline,
    nextEvent,
    lastSeenAt,
    customMessage,
    focusUntil,
    online: Boolean(snapshot.online ?? state !== 'offline'),
    actor: snapshot.actor || snapshot.user || null,
    calendar: snapshot.calendar || { upcoming: [] },
    activeFocusSession: snapshot.activeFocusSession || null,
    raw: snapshot,
  };
}

export function deriveAvailableStatuses(snapshot = {}) {
  const supported = Array.isArray(snapshot.supportedStates)
    ? snapshot.supportedStates
    : ['available', 'away', 'do_not_disturb', 'focus'];
  const unique = Array.from(new Set(supported.filter((value) => STATE_PRIORITIES.includes(value))));
  return unique.map((value) => ({
    value,
    label: getPresenceLabel(value),
    tone: getPresenceTone(value),
  }));
}

export default {
  resolvePresenceState,
  getPresenceLabel,
  getPresenceTone,
  buildTimeline,
  extractNextCalendarEvent,
  buildPresenceSummary,
  deriveAvailableStatuses,
};
