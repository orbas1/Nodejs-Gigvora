import { apiClient } from './apiClient.js';

const MAX_QUERY_LIMIT = 200;

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Request options must be an object.');
  }
  const rest = { ...options };
  if (Object.prototype.hasOwnProperty.call(rest, 'params')) {
    delete rest.params;
  }
  return rest;
}

function normaliseQuery(params = {}) {
  if (params === null || typeof params !== 'object') {
    throw new Error('Query parameters must be provided as an object.');
  }

  return Object.fromEntries(
    Object.entries(params)
      .map(([key, value]) => {
        if (value === undefined || value === null) {
          return [key, undefined];
        }

        if (typeof value === 'number') {
          if (!Number.isFinite(value)) {
            return [key, undefined];
          }
          if (/limit|pageSize/i.test(key)) {
            const bounded = Math.min(Math.max(Math.trunc(value), 1), MAX_QUERY_LIMIT);
            return [key, bounded];
          }
          if (/offset|page/i.test(key)) {
            const bounded = Math.max(0, Math.trunc(value));
            return [key, bounded];
          }
          return [key, value];
        }

        const trimmed = `${value}`.trim();
        if (!trimmed) {
          return [key, undefined];
        }
        return [key, trimmed];
      })
      .filter(([, value]) => value !== undefined),
  );
}

function buildRequestOptions(params, options) {
  const safeOptions = ensureOptions(options);
  const { signal, ...rest } = safeOptions;
  const requestOptions = {
    params: normaliseQuery(params),
    ...rest,
  };
  if (signal) {
    requestOptions.signal = signal;
  }
  return requestOptions;
}

export async function fetchRuntimeHealth(params = {}, options = {}) {
  return apiClient.get('/admin/runtime/health', buildRequestOptions(params, options));
}

export async function fetchLiveServiceTelemetry(params = {}, options = {}) {
  return apiClient.get('/admin/runtime/telemetry/live-services', buildRequestOptions(params, options));
}

export default {
  fetchRuntimeHealth,
  fetchLiveServiceTelemetry,
};

