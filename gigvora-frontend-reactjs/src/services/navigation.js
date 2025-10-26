import apiClient from './apiClient.js';

function sanitiseParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

export function fetchNavigationPulse({ limit = 6, timeframe, persona, signal } = {}) {
  const params = sanitiseParams({ limit, timeframe, persona });
  return apiClient.get('/navigation/pulse', { params, signal });
}

export default {
  fetchNavigationPulse,
};
