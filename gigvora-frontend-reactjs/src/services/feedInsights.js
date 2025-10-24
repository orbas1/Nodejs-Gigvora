import apiClient from './apiClient.js';

function buildParams({ viewerId, limit } = {}) {
  const params = {};
  if (viewerId != null) {
    params.viewerId = viewerId;
  }
  if (limit != null) {
    params.limit = limit;
  }
  return params;
}

export async function fetchFeedInsights({ viewerId, limit, signal } = {}) {
  const params = buildParams({ viewerId, limit });
  const response = await apiClient.get('/feed/insights', { params, signal });
  return response?.data ?? response;
}

export default {
  fetchFeedInsights,
};
