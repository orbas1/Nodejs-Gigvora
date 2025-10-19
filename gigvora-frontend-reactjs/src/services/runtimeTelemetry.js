import { apiClient } from './apiClient.js';

export async function fetchRuntimeHealth(params = {}, options = {}) {
  return apiClient.get('/admin/runtime/health', { params, ...options });
}

export async function fetchLiveServiceTelemetry(params = {}, options = {}) {
  return apiClient.get('/admin/runtime/telemetry/live-services', { params, ...options });
}

export default {
  fetchRuntimeHealth,
  fetchLiveServiceTelemetry,
};

