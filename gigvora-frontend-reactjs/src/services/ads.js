import { apiClient } from './apiClient.js';

export async function fetchAdPlacements(params = {}) {
  const response = await apiClient.get('/ads/placements', { params });
  const placements = Array.isArray(response?.placements) ? response.placements : [];
  return placements;
}

export async function fetchAdDashboard(params = {}) {
  return apiClient.get('/ads/dashboard', { params });
}

export default {
  fetchAdPlacements,
  fetchAdDashboard,
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

export default {
  getAdsDashboard,
  listAdsPlacements,
};
