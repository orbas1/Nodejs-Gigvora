import { apiClient } from './apiClient.js';
import {
  assertAdminAccess,
  buildAdminCacheKey,
  createRequestOptions,
  encodeIdentifier,
  fetchWithCache,
  invalidateCacheByTag,
  normaliseIdentifier,
  sanitiseQueryParams,
} from './adminServiceHelpers.js';

const PROJECT_ROLES = ['super-admin', 'platform-admin', 'operations-admin', 'project-admin'];
const CACHE_TAGS = {
  portfolio: 'admin:project-management:portfolio',
  summary: 'admin:project-management:summary',
  project: (identifier) => `admin:project-management:project:${identifier}`,
};

function buildPortfolioParams(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    ownerId: params.ownerId ?? params.owner_id,
    clientId: params.clientId ?? params.client_id,
    search: params.search,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

function projectCacheKey(projectId) {
  const identifier = normaliseIdentifier(projectId, { label: 'projectId' });
  return {
    key: buildAdminCacheKey('admin:project-management:project', { projectId: identifier }),
    tag: CACHE_TAGS.project(identifier),
  };
}

async function performProjectMutation(projectId, request) {
  const response = await request();
  const tags = [CACHE_TAGS.portfolio, CACHE_TAGS.summary];
  if (projectId) {
    const identifier = normaliseIdentifier(projectId, { label: 'projectId' });
    tags.push(CACHE_TAGS.project(identifier));
  }
  invalidateCacheByTag(tags);
  return response;
}

export function fetchProjectPortfolio(params = {}, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const cleanedParams = buildPortfolioParams(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:project-management:portfolio', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () =>
      apiClient.get(
        '/admin/project-management',
        createRequestOptions(requestOptions, cleanedParams),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.portfolio,
    },
  );
}

export function fetchProjectSummary(options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:project-management:summary');

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/project-management/summary', createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.summary,
    },
  );
}

export function fetchProject(projectId, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const { forceRefresh = false, cacheTtl = 30000, ...requestOptions } = options ?? {};
  const { key, tag } = projectCacheKey(projectId);
  const identifier = encodeIdentifier(projectId, { label: 'projectId' });

  return fetchWithCache(
    key,
    () =>
      apiClient.get(
        `/admin/project-management/projects/${identifier}`,
        createRequestOptions(requestOptions),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag,
    },
  );
}

export function createProject(payload, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  return performProjectMutation(null, () => apiClient.post('/admin/project-management', payload, options));
}

export function updateProject(projectId, payload, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const identifier = encodeIdentifier(projectId, { label: 'projectId' });
  return performProjectMutation(projectId, () =>
    apiClient.put(`/admin/project-management/projects/${identifier}`, payload, options),
  );
}

export function updateProjectWorkspace(projectId, payload, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const identifier = encodeIdentifier(projectId, { label: 'projectId' });
  return performProjectMutation(projectId, () =>
    apiClient.patch(`/admin/project-management/projects/${identifier}/workspace`, payload, options),
  );
}

export function createMilestone(projectId, payload, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const identifier = encodeIdentifier(projectId, { label: 'projectId' });
  return performProjectMutation(projectId, () =>
    apiClient.post(`/admin/project-management/projects/${identifier}/milestones`, payload, options),
  );
}

export function updateMilestone(projectId, milestoneId, payload, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const projectIdentifier = encodeIdentifier(projectId, { label: 'projectId' });
  const milestoneIdentifier = encodeIdentifier(milestoneId, { label: 'milestoneId' });
  return performProjectMutation(projectId, () =>
    apiClient.put(
      `/admin/project-management/projects/${projectIdentifier}/milestones/${milestoneIdentifier}`,
      payload,
      options,
    ),
  );
}

export function deleteMilestone(projectId, milestoneId, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const projectIdentifier = encodeIdentifier(projectId, { label: 'projectId' });
  const milestoneIdentifier = encodeIdentifier(milestoneId, { label: 'milestoneId' });
  return performProjectMutation(projectId, () =>
    apiClient.delete(
      `/admin/project-management/projects/${projectIdentifier}/milestones/${milestoneIdentifier}`,
      options,
    ),
  );
}

export function createCollaborator(projectId, payload, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const identifier = encodeIdentifier(projectId, { label: 'projectId' });
  return performProjectMutation(projectId, () =>
    apiClient.post(`/admin/project-management/projects/${identifier}/collaborators`, payload, options),
  );
}

export function updateCollaborator(projectId, collaboratorId, payload, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const projectIdentifier = encodeIdentifier(projectId, { label: 'projectId' });
  const collaboratorIdentifier = encodeIdentifier(collaboratorId, { label: 'collaboratorId' });
  return performProjectMutation(projectId, () =>
    apiClient.put(
      `/admin/project-management/projects/${projectIdentifier}/collaborators/${collaboratorIdentifier}`,
      payload,
      options,
    ),
  );
}

export function deleteCollaborator(projectId, collaboratorId, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const projectIdentifier = encodeIdentifier(projectId, { label: 'projectId' });
  const collaboratorIdentifier = encodeIdentifier(collaboratorId, { label: 'collaboratorId' });
  return performProjectMutation(projectId, () =>
    apiClient.delete(
      `/admin/project-management/projects/${projectIdentifier}/collaborators/${collaboratorIdentifier}`,
      options,
    ),
  );
}

export function createIntegration(projectId, payload, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const identifier = encodeIdentifier(projectId, { label: 'projectId' });
  return performProjectMutation(projectId, () =>
    apiClient.post(`/admin/project-management/projects/${identifier}/integrations`, payload, options),
  );
}

export function updateIntegration(projectId, integrationId, payload, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const projectIdentifier = encodeIdentifier(projectId, { label: 'projectId' });
  const integrationIdentifier = encodeIdentifier(integrationId, { label: 'integrationId' });
  return performProjectMutation(projectId, () =>
    apiClient.put(
      `/admin/project-management/projects/${projectIdentifier}/integrations/${integrationIdentifier}`,
      payload,
      options,
    ),
  );
}

export function deleteIntegration(projectId, integrationId, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const projectIdentifier = encodeIdentifier(projectId, { label: 'projectId' });
  const integrationIdentifier = encodeIdentifier(integrationId, { label: 'integrationId' });
  return performProjectMutation(projectId, () =>
    apiClient.delete(
      `/admin/project-management/projects/${projectIdentifier}/integrations/${integrationIdentifier}`,
      options,
    ),
  );
}

export function createAsset(projectId, payload, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const identifier = encodeIdentifier(projectId, { label: 'projectId' });
  return performProjectMutation(projectId, () =>
    apiClient.post(`/admin/project-management/projects/${identifier}/assets`, payload, options),
  );
}

export function deleteAsset(projectId, assetId, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const projectIdentifier = encodeIdentifier(projectId, { label: 'projectId' });
  const assetIdentifier = encodeIdentifier(assetId, { label: 'assetId' });
  return performProjectMutation(projectId, () =>
    apiClient.delete(
      `/admin/project-management/projects/${projectIdentifier}/assets/${assetIdentifier}`,
      options,
    ),
  );
}

export function createRetrospective(projectId, payload, options = {}) {
  assertAdminAccess(PROJECT_ROLES);
  const identifier = encodeIdentifier(projectId, { label: 'projectId' });
  return performProjectMutation(projectId, () =>
    apiClient.post(`/admin/project-management/projects/${identifier}/retrospectives`, payload, options),
  );
}

export default {
  fetchProjectPortfolio,
  fetchProjectSummary,
  fetchProject,
  createProject,
  updateProject,
  updateProjectWorkspace,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  createAsset,
  deleteAsset,
  createRetrospective,
};
