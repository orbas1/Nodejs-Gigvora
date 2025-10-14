import { apiClient } from './apiClient.js';

function serializeSurfaces(surfaces) {
  if (!Array.isArray(surfaces) || !surfaces.length) {
    return undefined;
  }
  return surfaces.join(',');
}

export async function getAdsDashboard({ surfaces, context, bypassCache = false } = {}) {
  const params = {
    surfaces: serializeSurfaces(surfaces),
    bypassCache: bypassCache ? 'true' : undefined,
    context: context ? JSON.stringify(context) : undefined,
  };

  return apiClient.get('/ads/dashboard', {
    params,
    headers: {
      'x-user-type': 'admin',
    },
  });
}

export async function listAdsPlacements({ surfaces, status } = {}) {
  const params = {
    surfaces: serializeSurfaces(surfaces),
    status,
  };

  return apiClient.get('/ads/placements', {
    params,
    headers: {
      'x-user-type': 'admin',
    },
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
