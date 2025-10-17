import apiClient from './apiClient.js';

function sanitizeParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

export async function fetchAgencyDashboard({ workspaceId, workspaceSlug, lookbackDays, signal, fresh } = {}) {
  const params = sanitizeParams({
    workspaceId,
    workspaceSlug,
    lookbackDays,
    fresh: fresh ? 'true' : undefined,
  });

  return apiClient.get('/agency/dashboard', { params, signal });
}

export default {
  fetchAgencyDashboard,
};
