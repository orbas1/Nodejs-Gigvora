import apiClient from './apiClient.js';

export class AutoAssignServiceError extends Error {
  constructor(message, { cause, status, details } = {}) {
    super(message, { cause });
    this.name = 'AutoAssignServiceError';
    this.status = status ?? null;
    this.details = details ?? null;
  }
}

const AUTO_ASSIGN_STATUSES = Object.freeze([
  'pending',
  'notified',
  'accepted',
  'declined',
  'expired',
  'reassigned',
  'completed',
]);

const DEFAULT_QUEUE_STATUSES = Object.freeze(['pending', 'notified']);
const APPLICATION_TARGET_TYPES = Object.freeze(['job', 'gig', 'project', 'launchpad', 'volunteer']);
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function coercePositiveInteger(value) {
  if (value == null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  const rounded = Math.trunc(numeric);
  return rounded > 0 ? rounded : null;
}

function coerceNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.min(Math.max(numeric, min), max);
}

function requirePositiveInteger(value, fieldName) {
  const parsed = coercePositiveInteger(value);
  if (parsed == null) {
    throw new AutoAssignServiceError(`${fieldName} is required and must be a positive integer.`);
  }
  return parsed;
}

function ensurePlainObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...value };
  }
  return {};
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? date.toISOString() : null;
}

function normalizeStatuses(statuses, { includeHistorical = false } = {}) {
  let source;
  if (Array.isArray(statuses)) {
    source = statuses;
  } else if (typeof statuses === 'string') {
    source = statuses.split(',');
  }

  if (!source || !source.length) {
    return includeHistorical ? [...AUTO_ASSIGN_STATUSES] : [...DEFAULT_QUEUE_STATUSES];
  }

  const unique = new Set();
  source.forEach((status) => {
    const normalised = `${status}`.trim().toLowerCase();
    if (AUTO_ASSIGN_STATUSES.includes(normalised)) {
      unique.add(normalised);
    }
  });

  if (!unique.size) {
    return includeHistorical ? [...AUTO_ASSIGN_STATUSES] : [...DEFAULT_QUEUE_STATUSES];
  }

  return Array.from(unique);
}

function sanitizeWeights(weights) {
  const safeWeights = ensurePlainObject(weights);
  return Object.fromEntries(
    Object.entries(safeWeights).map(([key, value]) => {
      const numeric = Number(value);
      return [key, Number.isFinite(numeric) ? numeric : 0];
    }),
  );
}

function sanitizePagination(
  pagination = {},
  { entriesCount = 0, fallbackPageSize = DEFAULT_PAGE_SIZE, requestedPage = DEFAULT_PAGE } = {},
) {
  const page = coercePositiveInteger(pagination.page) ?? coercePositiveInteger(requestedPage) ?? DEFAULT_PAGE;
  const rawPageSize = coercePositiveInteger(pagination.pageSize) ?? fallbackPageSize;
  const pageSize = Math.max(1, Math.min(rawPageSize, MAX_PAGE_SIZE));
  const totalEntries = coercePositiveInteger(pagination.totalEntries);
  const resolvedTotalEntries = totalEntries != null ? totalEntries : entriesCount;
  const computedTotalPages = Math.ceil((resolvedTotalEntries || entriesCount || 0) / pageSize) || 1;
  const totalPages = coercePositiveInteger(pagination.totalPages) ?? computedTotalPages;

  return {
    page,
    pageSize,
    totalEntries: Math.max(0, resolvedTotalEntries ?? 0),
    totalPages: Math.max(1, totalPages),
  };
}

function sanitizeQueueEntry(entry, index = 0) {
  if (!entry || typeof entry !== 'object') {
    return {
      id: null,
      position: index + 1,
      status: DEFAULT_QUEUE_STATUSES[0],
      score: 0,
      priorityBucket: null,
      projectValue: null,
      weights: {},
      breakdown: {},
      metadata: {},
      response: null,
      freelancer: null,
      createdAt: null,
      updatedAt: null,
      expiresAt: null,
      resolvedAt: null,
    };
  }

  const {
    weights,
    breakdown,
    metadata,
    response,
    freelancer,
    status,
    score,
    position,
    priorityBucket,
    projectValue,
    expiresAt,
    createdAt,
    updatedAt,
    resolvedAt,
    ...rest
  } = entry;

  const normalisedStatus = (() => {
    if (typeof status !== 'string') {
      return DEFAULT_QUEUE_STATUSES[0];
    }
    const value = status.trim().toLowerCase();
    return AUTO_ASSIGN_STATUSES.includes(value) ? value : DEFAULT_QUEUE_STATUSES[0];
  })();

  const numericScore = Number(score);
  const safeScore = Number.isFinite(numericScore) ? Number(numericScore.toFixed(4)) : 0;
  const safePosition = coercePositiveInteger(position) ?? index + 1;
  const safePriorityBucket = coercePositiveInteger(priorityBucket);
  const safeProjectValue = coerceNumber(projectValue, { min: 0 });

  const safeWeights = sanitizeWeights(weights);
  const safeBreakdown = ensurePlainObject(breakdown);
  const safeMetadata = ensurePlainObject(metadata);
  const responseObject = ensurePlainObject(response);
  const freelancerObject = ensurePlainObject(freelancer);
  const safeResponse = Object.keys(responseObject).length ? responseObject : null;
  const safeFreelancer = Object.keys(freelancerObject).length ? freelancerObject : null;

  return {
    ...rest,
    status: normalisedStatus,
    score: safeScore,
    position: safePosition,
    priorityBucket: safePriorityBucket,
    projectValue: safeProjectValue,
    weights: safeWeights,
    breakdown: safeBreakdown,
    metadata: safeMetadata,
    response: safeResponse,
    freelancer: safeFreelancer,
    expiresAt: normalizeDate(expiresAt),
    createdAt: normalizeDate(createdAt),
    updatedAt: normalizeDate(updatedAt),
    resolvedAt: normalizeDate(resolvedAt),
  };
}

function sanitizeQueueResponse(payload, { fallbackPageSize, requestedPage } = {}) {
  const { entries = [], pagination = {}, ...rest } = payload ?? {};
  const sanitizedEntries = Array.isArray(entries)
    ? entries.map((entry, index) => sanitizeQueueEntry(entry, index))
    : [];
  const sanitizedPagination = sanitizePagination(pagination, {
    entriesCount: sanitizedEntries.length,
    fallbackPageSize,
    requestedPage,
  });

  return {
    ...rest,
    entries: sanitizedEntries,
    pagination: sanitizedPagination,
  };
}

function normalizeTargetType(value) {
  if (!value) {
    return 'project';
  }
  const normalised = `${value}`.trim().toLowerCase();
  return APPLICATION_TARGET_TYPES.includes(normalised) ? normalised : 'project';
}

function sanitizeFairness(fairness) {
  const safeFairness = ensurePlainObject(fairness);
  const result = {};

  if (safeFairness.ensureNewcomer != null) {
    const value = safeFairness.ensureNewcomer;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['false', '0', 'no', 'off'].includes(normalized)) {
        result.ensureNewcomer = false;
      } else if (['true', '1', 'yes', 'on'].includes(normalized)) {
        result.ensureNewcomer = true;
      } else {
        result.ensureNewcomer = Boolean(normalized);
      }
    } else {
      result.ensureNewcomer = Boolean(value);
    }
  }

  const maxAssignments = coercePositiveInteger(safeFairness.maxAssignments);
  if (maxAssignments != null) {
    result.maxAssignments = maxAssignments;
  }

  const windowDays = coercePositiveInteger(safeFairness.windowDays);
  if (windowDays != null) {
    result.windowDays = windowDays;
  }

  return Object.keys(result).length ? result : undefined;
}

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function handleServiceError(error, actionDescription) {
  const ApiError = apiClient.ApiError;
  if (ApiError && error instanceof ApiError) {
    const status = error.status ?? null;
    let message = actionDescription ? `Unable to ${actionDescription}.` : 'Auto-assign service request failed.';

    if (status === 401) {
      message = 'Please sign in to manage auto-assign queues.';
    } else if (status === 403) {
      message = 'You do not have permission to manage auto-assign queues.';
    } else if (status === 404) {
      message = 'We could not find the requested auto-assign resource.';
    } else if (status === 409) {
      message = 'The auto-assign queue is already up to date.';
    } else if (status >= 500) {
      message = 'Our auto-assign service is temporarily unavailable. Please try again later.';
    }

    throw new AutoAssignServiceError(message, { cause: error, status, details: error.body ?? null });
  }

  throw error;
}

export async function fetchFreelancerQueue({
  freelancerId,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  statuses,
  includeHistorical = false,
  signal,
} = {}) {
  const resolvedFreelancerId = requirePositiveInteger(freelancerId, 'freelancerId');
  const safePage = coercePositiveInteger(page) ?? DEFAULT_PAGE;
  const safePageSize = Math.max(1, Math.min(coercePositiveInteger(pageSize) ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE));
  const statusFilter = normalizeStatuses(statuses, { includeHistorical });

  try {
    const response = await apiClient.get('/auto-assign/queue', {
      params: {
        freelancerId: resolvedFreelancerId,
        page: safePage,
        pageSize: safePageSize,
        statuses: statusFilter.join(','),
      },
      signal,
    });

    return sanitizeQueueResponse(response, { fallbackPageSize: safePageSize, requestedPage: safePage });
  } catch (error) {
    handleServiceError(error, 'load the auto-assign queue');
    return undefined;
  }
}

function sanitizeAssignmentPayload(payload = {}) {
  const safePayload = ensurePlainObject(payload);
  const projectValue = coerceNumber(safePayload.projectValue, { min: 0 });
  const limit = coercePositiveInteger(safePayload.limit);
  const expiresInMinutes = coercePositiveInteger(safePayload.expiresInMinutes);
  const targetType = normalizeTargetType(safePayload.targetType);
  const weights = sanitizeWeights(safePayload.weights);
  const fairness = sanitizeFairness(safePayload.fairness);

  return compactObject({
    projectValue: projectValue != null ? projectValue : undefined,
    limit: limit != null ? limit : undefined,
    expiresInMinutes: expiresInMinutes != null ? expiresInMinutes : undefined,
    targetType,
    weights: Object.keys(weights).length ? weights : undefined,
    fairness,
  });
}

export async function enqueueProjectAssignments(projectId, payload = {}, { signal } = {}) {
  const resolvedProjectId = requirePositiveInteger(projectId, 'projectId');
  const body = sanitizeAssignmentPayload(payload);

  try {
    return await apiClient.post(`/auto-assign/projects/${resolvedProjectId}/enqueue`, body, { signal });
  } catch (error) {
    handleServiceError(error, 'regenerate the auto-assign queue');
    return undefined;
  }
}

function sanitizeQueueUpdatePayload(payload = {}) {
  const safePayload = ensurePlainObject(payload);

  if (safePayload.status != null) {
    const normalised = `${safePayload.status}`.trim().toLowerCase();
    if (!AUTO_ASSIGN_STATUSES.includes(normalised)) {
      throw new AutoAssignServiceError('status must be a valid auto-assign state.');
    }
    safePayload.status = normalised;
  }

  const rating = coerceNumber(safePayload.rating, { min: 0, max: 5 });
  const completionValue = coerceNumber(safePayload.completionValue, { min: 0 });
  const freelancerId = coercePositiveInteger(safePayload.freelancerId);
  const metadata = ensurePlainObject(safePayload.metadata);

  const responseNotes = typeof safePayload.responseNotes === 'string' ? safePayload.responseNotes.trim() : undefined;
  const reasonCode = typeof safePayload.reasonCode === 'string' && safePayload.reasonCode.trim().length
    ? safePayload.reasonCode.trim()
    : undefined;
  const reasonLabel = typeof safePayload.reasonLabel === 'string' && safePayload.reasonLabel.trim().length
    ? safePayload.reasonLabel.trim()
    : undefined;

  return compactObject({
    status: safePayload.status,
    rating: rating != null ? rating : undefined,
    completionValue: completionValue != null ? completionValue : undefined,
    freelancerId: freelancerId != null ? freelancerId : undefined,
    reasonCode,
    reasonLabel,
    responseNotes,
    metadata: Object.keys(metadata).length ? metadata : undefined,
  });
}

export async function updateQueueEntry(entryId, payload = {}, { signal } = {}) {
  const resolvedEntryId = requirePositiveInteger(entryId, 'entryId');
  const body = sanitizeQueueUpdatePayload(payload);

  try {
    return await apiClient.patch(`/auto-assign/queue/${resolvedEntryId}`, body, { signal });
  } catch (error) {
    handleServiceError(error, 'update the queue entry');
    return undefined;
  }
}

export async function fetchProjectQueue(projectId, { targetType, signal } = {}) {
  const resolvedProjectId = requirePositiveInteger(projectId, 'projectId');
  const normalizedTargetType = normalizeTargetType(targetType);

  try {
    const response = await apiClient.get(`/auto-assign/projects/${resolvedProjectId}/queue`, {
      params: { targetType: normalizedTargetType },
      signal,
    });

    return sanitizeQueueResponse(response, { fallbackPageSize: DEFAULT_PAGE_SIZE, requestedPage: DEFAULT_PAGE });
  } catch (error) {
    handleServiceError(error, 'load the project auto-assign queue');
    return undefined;
  }
}

export async function fetchProjectAutoAssignMetrics({ signal } = {}) {
  try {
    return await apiClient.get('/auto-assign/projects/metrics', { signal });
  } catch (error) {
    handleServiceError(error, 'load auto-assign metrics');
    return undefined;
  }
}

function buildStreamUrl(path, params = {}) {
  const base = apiClient.API_BASE_URL ?? '';
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalisedPath}`);
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0)
    .forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  return url.toString();
}

export function getProjectQueueStreamUrl(projectId, { targetType } = {}) {
  const resolvedProjectId = requirePositiveInteger(projectId, 'projectId');
  const params = {};
  if (targetType) {
    params.targetType = normalizeTargetType(targetType);
  }
  return buildStreamUrl(`/auto-assign/projects/${resolvedProjectId}/queue/stream`, params);
}

export default {
  fetchFreelancerQueue,
  enqueueProjectAssignments,
  updateQueueEntry,
  fetchProjectQueue,
  fetchProjectAutoAssignMetrics,
  getProjectQueueStreamUrl,
};
