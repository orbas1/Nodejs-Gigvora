import { apiClient } from './apiClient.js';

function normaliseSurface(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === 'object' && value.surface) {
    return normaliseSurface(value.surface);
  }
  return null;
}

function serializeSurfaces(surfaces) {
  if (!Array.isArray(surfaces)) {
    return undefined;
  }

  const normalised = surfaces
    .map(normaliseSurface)
    .filter(Boolean);

  if (!normalised.length) {
    return undefined;
  }

  return Array.from(new Set(normalised)).join(',');
}

function serialiseContext(context) {
  if (!context || typeof context !== 'object') {
function serializeSurfaces(surfaces) {
  if (!Array.isArray(surfaces) || !surfaces.length) {
    return undefined;
  }

  try {
    return JSON.stringify(context);
  } catch (error) {
    console.warn('Unable to serialise ads context payload.');
    return undefined;
  }
}

function buildAdminHeaders(additionalHeaders = {}) {
  return {
    'x-user-type': 'admin',
    ...additionalHeaders,
  };
}

export async function getAdsDashboard({ surfaces, context, bypassCache = false, signal } = {}) {
  const params = {
    surfaces: serializeSurfaces(surfaces),
    bypassCache: bypassCache ? 'true' : undefined,
    context: serialiseContext(context),
  };

  return apiClient.get('/ads/dashboard', {
    params,
    signal,
    headers: buildAdminHeaders(),
  });
}

export async function listAdsPlacements({ surfaces, status, signal } = {}) {
  const params = {
    surfaces: serializeSurfaces(surfaces),
    status,
  };

  return apiClient.get('/ads/placements', {
    params,
    signal,
    headers: buildAdminHeaders(),
  });
}

export async function fetchAdPlacements(params = {}) {
  const { surface, surfaces, status } = params;
  const resolvedSurfaces = Array.isArray(surfaces)
    ? surfaces
    : surface
    ? [surface]
    : undefined;
  const response = await listAdsPlacements({ surfaces: resolvedSurfaces, status });
  if (Array.isArray(response?.placements)) {
    return response.placements;
  }
  if (Array.isArray(response?.surface?.placements)) {
    return response.surface.placements;
  }
  return Array.isArray(response) ? response : [];
}

export async function fetchAdDashboard(params = {}) {
  return apiClient.get('/ads/dashboard', {
    params,
    headers: {
      'x-user-type': 'admin',
    },
  });
}

const adsService = {
  fetchAdPlacements,
  fetchAdDashboard,
  getAdsDashboard,
  listAdsPlacements,
};

export default adsService;
