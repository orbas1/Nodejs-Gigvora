import apiClient from './apiClient.js';

function ensureKey(value, label) {
  if (!value || !`${value}`.trim()) {
    throw new Error(`${label} is required.`);
  }
  return `${value}`.trim().toLowerCase();
}

function normaliseBooleanQuery(value) {
  if (value === undefined) {
    return undefined;
  }
  return value ? 'true' : 'false';
}

export async function fetchLatestSystemStatus(options = {}) {
  const params = {};
  const includeResolved = normaliseBooleanQuery(options.includeResolved);
  const includeExpired = normaliseBooleanQuery(options.includeExpired);
  if (includeResolved !== undefined) {
    params.includeResolved = includeResolved;
  }
  if (includeExpired !== undefined) {
    params.includeExpired = includeExpired;
  }
  if (options.now) {
    params.now = options.now;
  }

  const response = await apiClient.get('/system/status/latest', {
    params,
    signal: options.signal,
  });
  return response?.event ?? null;
}

export async function acknowledgeSystemStatus(eventKey, payload = {}) {
  const key = ensureKey(eventKey, 'eventKey');
  const body = {};
  if (payload.channel) {
    body.channel = `${payload.channel}`.trim();
  }
  if (payload.metadata && typeof payload.metadata === 'object') {
    body.metadata = payload.metadata;
  }

  const response = await apiClient.post(`/system/status/${encodeURIComponent(key)}/acknowledgements`, body, {
    signal: payload.signal,
  });
  return response;
}

export async function fetchFeedbackPulse(pulseKey, options = {}) {
  const key = ensureKey(pulseKey, 'pulseKey');
  const params = {};
  const includeInactive = normaliseBooleanQuery(options.includeInactive);
  if (includeInactive !== undefined) {
    params.includeInactive = includeInactive;
  }

  const response = await apiClient.get(`/system/feedback-pulses/${encodeURIComponent(key)}`, {
    params,
    signal: options.signal,
  });
  return response?.pulse ?? null;
}

export async function submitFeedbackPulse(pulseKey, payload, options = {}) {
  const key = ensureKey(pulseKey, 'pulseKey');
  if (!payload || payload.score == null) {
    throw new Error('score is required to submit feedback.');
  }
  const body = {
    score: payload.score,
  };
  if (Array.isArray(payload.tags)) {
    body.tags = payload.tags;
  }
  if (payload.comment != null) {
    body.comment = payload.comment;
  }
  if (payload.channel) {
    body.channel = payload.channel;
  }
  if (payload.metadata && typeof payload.metadata === 'object') {
    body.metadata = payload.metadata;
  }

  const response = await apiClient.post(`/system/feedback-pulses/${encodeURIComponent(key)}/responses`, body, {
    signal: options.signal,
  });
  return response;
}

export default {
  fetchLatestSystemStatus,
  acknowledgeSystemStatus,
  fetchFeedbackPulse,
  submitFeedbackPulse,
};
