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

const VOLUNTEER_ROLES = ['super-admin', 'platform-admin', 'operations-admin', 'volunteering-admin'];
const CACHE_TAGS = {
  insights: 'admin:volunteering:insights',
  programs: 'admin:volunteering:programs',
  program: (identifier) => `admin:volunteering:program:${identifier}`,
  roles: 'admin:volunteering:roles',
  role: (identifier) => `admin:volunteering:role:${identifier}`,
  shifts: (roleIdentifier) => `admin:volunteering:role:${roleIdentifier}:shifts`,
  shift: (roleIdentifier, shiftIdentifier) =>
    `admin:volunteering:role:${roleIdentifier}:shift:${shiftIdentifier}`,
  assignments: (roleIdentifier, shiftIdentifier) =>
    `admin:volunteering:role:${roleIdentifier}:shift:${shiftIdentifier}:assignments`,
};

function buildProgramsParams(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    ownerId: params.ownerId ?? params.owner_id,
    search: params.search,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

function buildRolesParams(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    programId: params.programId ?? params.program_id,
    search: params.search,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

function buildAssignmentsParams(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    search: params.search,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

function identifierFor(value, label) {
  return normaliseIdentifier(value, { label });
}

function cacheKeyForProgram(programId) {
  const identifier = identifierFor(programId, 'programId');
  return {
    key: buildAdminCacheKey('admin:volunteering:program', { programId: identifier }),
    tag: CACHE_TAGS.program(identifier),
  };
}

function cacheKeyForRole(roleId) {
  const identifier = identifierFor(roleId, 'roleId');
  return {
    key: buildAdminCacheKey('admin:volunteering:role', { roleId: identifier }),
    tag: CACHE_TAGS.role(identifier),
    identifier,
  };
}

function cacheKeyForShift(roleId, shiftId) {
  const roleIdentifier = identifierFor(roleId, 'roleId');
  const shiftIdentifier = identifierFor(shiftId, 'shiftId');
  return {
    key: buildAdminCacheKey('admin:volunteering:shift', {
      roleId: roleIdentifier,
      shiftId: shiftIdentifier,
    }),
    tag: CACHE_TAGS.shift(roleIdentifier, shiftIdentifier),
    roleIdentifier,
    shiftIdentifier,
  };
}

async function invalidateVolunteerCaches({
  programId,
  roleId,
  shiftId,
  includeRoles = false,
  includeShifts = false,
  includeAssignments = false,
}) {
  const tags = [CACHE_TAGS.insights, CACHE_TAGS.programs];
  if (includeRoles) {
    tags.push(CACHE_TAGS.roles);
  }
  if (programId) {
    tags.push(CACHE_TAGS.program(identifierFor(programId, 'programId')));
  }
  if (roleId) {
    const roleIdentifier = identifierFor(roleId, 'roleId');
    tags.push(CACHE_TAGS.role(roleIdentifier));
    if (includeShifts) {
      tags.push(CACHE_TAGS.shifts(roleIdentifier));
    }
    if (includeAssignments && shiftId) {
      const shiftIdentifier = identifierFor(shiftId, 'shiftId');
      tags.push(CACHE_TAGS.shift(roleIdentifier, shiftIdentifier));
      tags.push(CACHE_TAGS.assignments(roleIdentifier, shiftIdentifier));
    }
  }
  invalidateCacheByTag(tags);
}

async function performProgramMutation(programId, request) {
  const response = await request();
  await invalidateVolunteerCaches({ programId, includeRoles: true });
  return response;
}

async function performRoleMutation(programId, roleId, request) {
  const response = await request();
  await invalidateVolunteerCaches({ programId, roleId, includeRoles: true });
  return response;
}

async function performShiftMutation(programId, roleId, shiftId, request) {
  const response = await request();
  await invalidateVolunteerCaches({ programId, roleId, shiftId, includeRoles: true, includeShifts: true });
  return response;
}

async function performAssignmentMutation(programId, roleId, shiftId, request) {
  const response = await request();
  await invalidateVolunteerCaches({
    programId,
    roleId,
    shiftId,
    includeRoles: true,
    includeShifts: true,
    includeAssignments: true,
  });
  return response;
}

export function fetchVolunteerInsights(options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const { forceRefresh = false, cacheTtl = 5 * 60 * 1000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:volunteering:insights');

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/volunteering/insights', createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.insights,
    },
  );
}

export function fetchVolunteerPrograms(params = {}, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const cleanedParams = buildProgramsParams(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:volunteering:programs', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () =>
      apiClient.get(
        '/admin/volunteering/programs',
        createRequestOptions(requestOptions, cleanedParams),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.programs,
    },
  );
}

export function fetchVolunteerProgram(programId, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const { key, tag } = cacheKeyForProgram(programId);
  const identifier = encodeIdentifier(programId, { label: 'programId' });

  return fetchWithCache(
    key,
    () =>
      apiClient.get(`/admin/volunteering/programs/${identifier}`, createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag,
    },
  );
}

export function createVolunteerProgram(payload, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  return performProgramMutation(null, () =>
    apiClient.post('/admin/volunteering/programs', payload, options),
  );
}

export function updateVolunteerProgram(programId, payload, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const identifier = encodeIdentifier(programId, { label: 'programId' });
  return performProgramMutation(programId, () =>
    apiClient.put(`/admin/volunteering/programs/${identifier}`, payload, options),
  );
}

export function deleteVolunteerProgram(programId, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const identifier = encodeIdentifier(programId, { label: 'programId' });
  return performProgramMutation(programId, () =>
    apiClient.delete(`/admin/volunteering/programs/${identifier}`, options),
  );
}

export function fetchVolunteerRoles(params = {}, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const cleanedParams = buildRolesParams(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:volunteering:roles', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () =>
      apiClient.get('/admin/volunteering/roles', createRequestOptions(requestOptions, cleanedParams)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.roles,
    },
  );
}

export function fetchVolunteerRole(roleId, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const { key, tag } = cacheKeyForRole(roleId);
  const identifier = encodeIdentifier(roleId, { label: 'roleId' });

  return fetchWithCache(
    key,
    () =>
      apiClient.get(`/admin/volunteering/roles/${identifier}`, createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag,
    },
  );
}

export function createVolunteerRole(payload, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const programId = payload?.programId ?? payload?.program_id;
  return performRoleMutation(programId, null, () =>
    apiClient.post('/admin/volunteering/roles', payload, options),
  );
}

export function updateVolunteerRole(roleId, payload, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const identifier = encodeIdentifier(roleId, { label: 'roleId' });
  const programId = payload?.programId ?? payload?.program_id;
  return performRoleMutation(programId, roleId, () =>
    apiClient.put(`/admin/volunteering/roles/${identifier}`, payload, options),
  );
}

export function deleteVolunteerRole(roleId, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const identifier = encodeIdentifier(roleId, { label: 'roleId' });
  return performRoleMutation(null, roleId, () =>
    apiClient.delete(`/admin/volunteering/roles/${identifier}`, options),
  );
}

export function publishVolunteerRole(roleId, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const identifier = encodeIdentifier(roleId, { label: 'roleId' });
  return performRoleMutation(null, roleId, () =>
    apiClient.post(`/admin/volunteering/roles/${identifier}/publish`, undefined, options),
  );
}

export function fetchVolunteerShifts(roleId, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const roleIdentifier = identifierFor(roleId, 'roleId');

  return fetchWithCache(
    buildAdminCacheKey('admin:volunteering:shifts', { roleId: roleIdentifier }),
    () =>
      apiClient.get(
        `/admin/volunteering/roles/${encodeIdentifier(roleId, { label: 'roleId' })}/shifts`,
        createRequestOptions(requestOptions),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.shifts(roleIdentifier),
    },
  );
}

export function createVolunteerShift(roleId, payload, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const identifier = encodeIdentifier(roleId, { label: 'roleId' });
  return performShiftMutation(null, roleId, payload?.id, () =>
    apiClient.post(`/admin/volunteering/roles/${identifier}/shifts`, payload, options),
  );
}

export function updateVolunteerShift(roleId, shiftId, payload, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const roleIdentifier = encodeIdentifier(roleId, { label: 'roleId' });
  const shiftIdentifier = encodeIdentifier(shiftId, { label: 'shiftId' });
  return performShiftMutation(null, roleId, shiftId, () =>
    apiClient.put(
      `/admin/volunteering/roles/${roleIdentifier}/shifts/${shiftIdentifier}`,
      payload,
      options,
    ),
  );
}

export function deleteVolunteerShift(roleId, shiftId, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const roleIdentifier = encodeIdentifier(roleId, { label: 'roleId' });
  const shiftIdentifier = encodeIdentifier(shiftId, { label: 'shiftId' });
  return performShiftMutation(null, roleId, shiftId, () =>
    apiClient.delete(
      `/admin/volunteering/roles/${roleIdentifier}/shifts/${shiftIdentifier}`,
      options,
    ),
  );
}

export function fetchVolunteerAssignments(roleId, shiftId, params = {}, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const cleanedParams = buildAssignmentsParams(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const { roleIdentifier, shiftIdentifier, key } = cacheKeyForShift(roleId, shiftId);

  return fetchWithCache(
    key,
    () =>
      apiClient.get(
        `/admin/volunteering/roles/${encodeIdentifier(roleId, { label: 'roleId' })}/shifts/${encodeIdentifier(shiftId, { label: 'shiftId' })}/assignments`,
        createRequestOptions(requestOptions, cleanedParams),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.assignments(roleIdentifier, shiftIdentifier),
    },
  );
}

export function createVolunteerAssignment(roleId, shiftId, payload, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const roleIdentifier = encodeIdentifier(roleId, { label: 'roleId' });
  const shiftIdentifier = encodeIdentifier(shiftId, { label: 'shiftId' });
  return performAssignmentMutation(null, roleId, shiftId, () =>
    apiClient.post(
      `/admin/volunteering/roles/${roleIdentifier}/shifts/${shiftIdentifier}/assignments`,
      payload,
      options,
    ),
  );
}

export function updateVolunteerAssignment(roleId, shiftId, assignmentId, payload, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const roleIdentifier = encodeIdentifier(roleId, { label: 'roleId' });
  const shiftIdentifier = encodeIdentifier(shiftId, { label: 'shiftId' });
  const assignmentIdentifier = encodeIdentifier(assignmentId, { label: 'assignmentId' });
  return performAssignmentMutation(null, roleId, shiftId, () =>
    apiClient.put(
      `/admin/volunteering/roles/${roleIdentifier}/shifts/${shiftIdentifier}/assignments/${assignmentIdentifier}`,
      payload,
      options,
    ),
  );
}

export function deleteVolunteerAssignment(roleId, shiftId, assignmentId, options = {}) {
  assertAdminAccess(VOLUNTEER_ROLES);
  const roleIdentifier = encodeIdentifier(roleId, { label: 'roleId' });
  const shiftIdentifier = encodeIdentifier(shiftId, { label: 'shiftId' });
  const assignmentIdentifier = encodeIdentifier(assignmentId, { label: 'assignmentId' });
  return performAssignmentMutation(null, roleId, shiftId, () =>
    apiClient.delete(
      `/admin/volunteering/roles/${roleIdentifier}/shifts/${shiftIdentifier}/assignments/${assignmentIdentifier}`,
      options,
    ),
  );
}

export default {
  fetchVolunteerInsights,
  fetchVolunteerPrograms,
  fetchVolunteerProgram,
  createVolunteerProgram,
  updateVolunteerProgram,
  deleteVolunteerProgram,
  fetchVolunteerRoles,
  fetchVolunteerRole,
  createVolunteerRole,
  updateVolunteerRole,
  deleteVolunteerRole,
  publishVolunteerRole,
  fetchVolunteerShifts,
  createVolunteerShift,
  updateVolunteerShift,
  deleteVolunteerShift,
  fetchVolunteerAssignments,
  createVolunteerAssignment,
  updateVolunteerAssignment,
  deleteVolunteerAssignment,
};
