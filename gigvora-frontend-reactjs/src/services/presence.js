import apiClient from './apiClient.js';

const DEFAULT_INCLUDE = {
  includeCalendar: true,
  includeTimeline: true,
  includeFocus: true,
};

function normaliseMemberIds(memberIds) {
  if (!Array.isArray(memberIds)) {
    return [];
  }
  return memberIds.map((value) => `${value}`.trim()).filter(Boolean);
}

export function fetchPresenceSnapshot(memberId, options = {}) {
  if (!memberId) {
    throw new Error('memberId is required to load presence.');
  }

  const params = { ...DEFAULT_INCLUDE, ...options };
  return apiClient.get(`/presence/${memberId}`, { params });
}

export function fetchPresenceBatch({ memberIds, includeCalendar = true, includeTimeline = false, includeFocus = true } = {}) {
  const ids = normaliseMemberIds(memberIds);
  if (!ids.length) {
    throw new Error('memberIds are required to fetch presence batch.');
  }

  return apiClient.get('/presence', {
    params: {
      memberIds: ids.join(','),
      includeCalendar,
      includeTimeline,
      includeFocus,
    },
  });
}

export function updatePresenceStatus(memberId, { availability, message, focusUntil, metadata = {} } = {}) {
  if (!memberId) {
    throw new Error('memberId is required to update presence.');
  }

  return apiClient.post(`/presence/${memberId}/status`, {
    availability,
    message,
    focusUntil,
    metadata,
  });
}

export function startFocusSession(memberId, { durationMinutes = 25, note, autoMute = true } = {}) {
  if (!memberId) {
    throw new Error('memberId is required to start focus session.');
  }

  return apiClient.post(`/presence/${memberId}/focus`, {
    durationMinutes,
    note,
    autoMute,
  });
}

export function endFocusSession(memberId) {
  if (!memberId) {
    throw new Error('memberId is required to end focus session.');
  }

  return apiClient.post(`/presence/${memberId}/focus/end`);
}

export function scheduleAvailabilityWindow(memberId, payload = {}) {
  if (!memberId) {
    throw new Error('memberId is required to schedule availability.');
  }

  const { startAt, endAt, recurringRule, note, timezone } = payload;
  return apiClient.post(`/presence/${memberId}/availability`, {
    startAt,
    endAt,
    recurringRule,
    note,
    timezone,
  });
}

export function refreshCalendarSync(memberId) {
  if (!memberId) {
    throw new Error('memberId is required to refresh calendar sync.');
  }

  return apiClient.post(`/presence/${memberId}/calendar/refresh`);
}

export default {
  fetchPresenceSnapshot,
  fetchPresenceBatch,
  updatePresenceStatus,
  startFocusSession,
  endFocusSession,
  scheduleAvailabilityWindow,
  refreshCalendarSync,
};
