import apiClient from './apiClient.js';

export async function fetchPlatformWarRoomSnapshot({ windowMinutes, signal } = {}) {
  const params = {};
  if (Number.isFinite(windowMinutes)) {
    params.windowMinutes = windowMinutes;
  }
  return apiClient.get('/admin/war-room/platform-performance', { signal, params });
}

export async function fetchSecurityFabricSnapshot({ limit, signal } = {}) {
  const params = {};
  if (Number.isFinite(limit)) {
    params.limit = limit;
  }
  return apiClient.get('/admin/war-room/security-fabric', { signal, params });
}

export default {
  fetchPlatformWarRoomSnapshot,
  fetchSecurityFabricSnapshot,
};
