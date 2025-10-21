import { apiClient } from './apiClient.js';
import {
  requireIdentifier,
  optionalString,
  mergeWorkspace,
  combineRequestOptions,
} from './serviceHelpers.js';

const CACHE_KEY_PREFIX = 'freelancer:compliance-locker';
const DEFAULT_CACHE_TTL = 1000 * 60;

function normaliseFrameworks(input) {
  if (!input) {
    return [];
  }
  if (typeof input === 'string') {
    const trimmed = optionalString(input);
    return trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(input)) {
    return [];
  }
  const seen = new Map();
  input
    .map(optionalString)
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, value);
      }
    });
  return Array.from(seen.values()).sort();
}

function buildCacheKey(userId, region, frameworks = []) {
  return `${CACHE_KEY_PREFIX}:${userId}:${region ?? 'global'}:${frameworks.join('|')}`;
}

export async function fetchComplianceLocker(
  { userId, region, frameworks, useCache = true, workspaceId, workspaceSlug } = {},
  options = {},
) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const normalisedRegion = optionalString(region);
  const normalisedFrameworks = normaliseFrameworks(frameworks);

  const cacheKey = buildCacheKey(resolvedUserId, normalisedRegion, normalisedFrameworks);
  if (useCache) {
    const cached = apiClient.readCache(cacheKey);
    if (cached?.data) {
      return cached.data;
    }
  }

  const params = {
    userId: resolvedUserId,
    ...mergeWorkspace({}, { workspaceId, workspaceSlug }),
  };

  if (normalisedRegion) {
    params.region = normalisedRegion;
  }
  if (normalisedFrameworks.length > 0) {
    params.frameworks = normalisedFrameworks.join(',');
  }
  if (!useCache) {
    params.useCache = 'false';
  }

  const response = await apiClient.get(
    '/compliance/locker',
    combineRequestOptions({ params }, options),
  );

  if (useCache) {
    apiClient.writeCache(cacheKey, response, DEFAULT_CACHE_TTL);
  }
  return response;
}

export async function acknowledgeComplianceReminder(
  reminderId,
  { actorId, status = 'acknowledged', workspaceId, workspaceSlug } = {},
  options = {},
) {
  const resolvedReminderId = requireIdentifier(reminderId, 'reminderId');
  const body = mergeWorkspace(
    {
      status: optionalString(status) || 'acknowledged',
      ...(optionalString(actorId) ? { actorId: optionalString(actorId) } : {}),
    },
    { workspaceId, workspaceSlug },
  );

  return apiClient.patch(
    `/compliance/reminders/${resolvedReminderId}`,
    body,
    combineRequestOptions({}, options),
  );
}

export default {
  fetchComplianceLocker,
  acknowledgeComplianceReminder,
};
