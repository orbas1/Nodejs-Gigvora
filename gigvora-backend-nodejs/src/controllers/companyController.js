import { getCompanyDashboard } from '../services/companyDashboardService.js';
import * as workspaceAutoReplyService from '../services/workspaceAutoReplyService.js';
import {
  getTimelineManagementSnapshot,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  createTimelinePost,
  updateTimelinePost,
  changeTimelinePostStatus,
  deleteTimelinePost,
  recordTimelinePostMetrics,
} from '../services/companyTimelineService.js';
import { upsertCompanyDashboardOverview } from '../services/companyDashboardOverviewService.js';
import { normalizeLocationPayload } from '../utils/location.js';
import { ValidationError } from '../utils/errors.js';

function parseNumber(value) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveWorkspaceId(req) {
  const candidates = [
    req.body?.workspaceId,
    req.query?.workspaceId,
    req.params?.workspaceId,
    req.body?.workspace_id,
  ];
  for (const candidate of candidates) {
    const parsed = parseNumber(candidate);
    if (parsed != null) {
      return parsed;
    }
  }
  throw new ValidationError('workspaceId is required.');
}

export async function dashboard(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query ?? {};

  const payload = {
    workspaceId: parseNumber(workspaceId),
    workspaceSlug: workspaceSlug ?? undefined,
    lookbackDays: parseNumber(lookbackDays),
  };

  const result = await getCompanyDashboard(payload);
  res.json(result);
}

export async function byokAutoReplyOverview(req, res) {
  const overview = await workspaceAutoReplyService.getWorkspaceAutoReplyOverview({
    userId: req.user?.id ?? req.auth?.userId,
    workspaceId: req.query?.workspaceId,
  });
  res.json(overview);
}

export async function updateByokAutoReplySettings(req, res) {
  const settings = await workspaceAutoReplyService.updateWorkspaceProviderSettings({
    userId: req.user?.id ?? req.auth?.userId,
    payload: req.body ?? {},
  });
  res.json(settings);
}

export async function listByokAutoReplyTemplates(req, res) {
  const templates = await workspaceAutoReplyService.listWorkspaceTemplates({
    userId: req.user?.id ?? req.auth?.userId,
    workspaceId: req.query?.workspaceId,
  });
  res.json({ templates });
}

export async function createByokAutoReplyTemplate(req, res) {
  const template = await workspaceAutoReplyService.createWorkspaceTemplate({
    userId: req.user?.id ?? req.auth?.userId,
    workspaceId: req.body?.workspaceId ?? req.query?.workspaceId,
    payload: req.body ?? {},
  });
  res.status(201).json(template);
}

export async function updateByokAutoReplyTemplate(req, res) {
  const template = await workspaceAutoReplyService.updateWorkspaceTemplate({
    userId: req.user?.id ?? req.auth?.userId,
    workspaceId: req.body?.workspaceId ?? req.query?.workspaceId,
    templateId: req.params?.templateId,
    payload: req.body ?? {},
  });
  res.json(template);
}

export async function deleteByokAutoReplyTemplate(req, res) {
  await workspaceAutoReplyService.deleteWorkspaceTemplate({
    userId: req.user?.id ?? req.auth?.userId,
    workspaceId: req.query?.workspaceId,
    templateId: req.params?.templateId,
  });
  res.status(204).send();
}

export async function previewByokAutoReply(req, res) {
  const preview = await workspaceAutoReplyService.generateWorkspaceAutoReplyPreview({
    userId: req.user?.id ?? req.auth?.userId,
    payload: req.body ?? {},
  });
  res.json(preview);
export async function timeline(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const lookbackDays = parseNumber(req.query?.lookbackDays ?? req.body?.lookbackDays);
  const snapshot = await getTimelineManagementSnapshot({ workspaceId, lookbackDays });
  res.json(snapshot);
}

export async function storeTimelineEvent(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = parseNumber(req.body?.actorId ?? req.user?.id);
  const payload = { ...req.body };
  delete payload.workspaceId;
  delete payload.actorId;
  const event = await createTimelineEvent({ workspaceId, actorId, payload });
  res.status(201).json(event);
}

export async function updateTimelineEventController(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const eventId = parseNumber(req.params?.eventId);
  const payload = { ...req.body };
  delete payload.workspaceId;
  delete payload.actorId;
  const event = await updateTimelineEvent(eventId, { workspaceId, payload });
  res.json(event);
}

export async function destroyTimelineEvent(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const eventId = parseNumber(req.params?.eventId);
  await deleteTimelineEvent(eventId, { workspaceId });
  res.status(204).send();
}

export async function storeTimelinePost(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = parseNumber(req.body?.actorId ?? req.user?.id);
  const payload = { ...req.body };
  delete payload.workspaceId;
  delete payload.actorId;
  const post = await createTimelinePost({ workspaceId, actorId, payload });
  res.status(201).json(post);
}

export async function updateTimelinePostController(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const postId = parseNumber(req.params?.postId);
  const payload = { ...req.body };
  delete payload.workspaceId;
  delete payload.actorId;
  const post = await updateTimelinePost(postId, { workspaceId, payload });
  res.json(post);
}

export async function changeTimelinePostStatusController(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const postId = parseNumber(req.params?.postId);
  const status = req.body?.status;
  const publishedAt = req.body?.publishedAt;
  const scheduledFor = req.body?.scheduledFor;
  const post = await changeTimelinePostStatus(postId, {
    workspaceId,
    status,
    publishedAt,
    scheduledFor,
  });
  res.json(post);
}

export async function destroyTimelinePost(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const postId = parseNumber(req.params?.postId);
  await deleteTimelinePost(postId, { workspaceId });
  res.status(204).send();
}

export async function recordTimelineMetrics(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const postId = parseNumber(req.params?.postId);
  const metricDate = req.body?.metricDate;
  const metrics = req.body?.metrics ?? req.body;
  const metadata = req.body?.metadata;
  const result = await recordTimelinePostMetrics(postId, {
    workspaceId,
    metricDate,
    metrics,
    metadata,
  });
  res.status(201).json(result);
function sanitizeString(value, { maxLength, required = false } = {}) {
  if (value == null) {
    if (required) {
      throw new ValidationError('A required field is missing.');
    }
    return undefined;
  }
  const text = `${value}`.trim();
  if (!text) {
    if (required) {
      throw new ValidationError('This field cannot be empty.');
    }
    return null;
  }
  if (maxLength && text.length > maxLength) {
    throw new ValidationError(`Text must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function sanitizeNumber(value, { min, max, allowNull = false, round = false } = {}) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return allowNull ? null : undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Expected a numeric value.');
  }
  if (min != null && numeric < min) {
    throw new ValidationError(`Value must be at least ${min}.`);
  }
  if (max != null && numeric > max) {
    throw new ValidationError(`Value must be at most ${max}.`);
  }
  return round ? Math.round(numeric) : numeric;
}

function sanitizePreferences(preferences) {
  if (!preferences || typeof preferences !== 'object') {
    return undefined;
  }
  const result = {};
  if (preferences.locationOverride) {
    const locationPayload = normalizeLocationPayload(preferences.locationOverride);
    const timezoneCandidate =
      preferences.locationOverride?.timezone ??
      preferences.locationOverride?.timeZone ??
      locationPayload.geoLocation?.timezone ??
      null;

    const locationOverride = {};
    if (locationPayload.location) {
      locationOverride.location = locationPayload.location;
    }
    if (locationPayload.geoLocation) {
      locationOverride.geoLocation = locationPayload.geoLocation;
      if (
        Number.isFinite(locationPayload.geoLocation.latitude) &&
        Number.isFinite(locationPayload.geoLocation.longitude)
      ) {
        locationOverride.coordinates = {
          latitude: Number(locationPayload.geoLocation.latitude),
          longitude: Number(locationPayload.geoLocation.longitude),
        };
      }
    }
    const label =
      preferences.locationOverride?.label ??
      locationPayload.geoLocation?.label ??
      locationPayload.location ??
      null;
    if (label) {
      locationOverride.label = `${label}`.trim().slice(0, 255);
    }
    if (timezoneCandidate) {
      locationOverride.timezone = `${timezoneCandidate}`.trim().slice(0, 120);
    }

    result.locationOverride = locationOverride;
  }

  if (preferences.customGreeting) {
    const greeting = sanitizeString(preferences.customGreeting, { maxLength: 120 });
    if (greeting) {
      result.customGreeting = greeting;
    }
  }

  return Object.keys(result).length ? result : undefined;
}

export async function updateDashboardOverview(req, res) {
  const rawWorkspaceId = req.body.workspaceId ?? req.query.workspaceId;
  const workspaceId = Number.parseInt(rawWorkspaceId, 10);
  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    throw new ValidationError('workspaceId must be a positive integer.');
  }

  const displayName = sanitizeString(req.body.displayName, { maxLength: 150 });
  const summaryRaw = sanitizeString(req.body.summary, { maxLength: 2000 });
  const summary = summaryRaw === undefined ? undefined : summaryRaw;

  let avatarUrl;
  if (req.body.avatarUrl !== undefined) {
    const raw = `${req.body.avatarUrl}`.trim();
    if (!raw) {
      avatarUrl = null;
    } else {
      try {
        const url = new URL(raw);
        avatarUrl = url.toString().slice(0, 1024);
      } catch (error) {
        throw new ValidationError('avatarUrl must be a valid URL.');
      }
    }
  }

  const followerCount = sanitizeNumber(req.body.followerCount, { min: 0, round: true });
  const trustScore = sanitizeNumber(req.body.trustScore, { min: 0, max: 100, allowNull: true });
  const rating = sanitizeNumber(req.body.rating, { min: 0, max: 5, allowNull: true });

  const preferences = sanitizePreferences(req.body.preferences);

  const overview = await upsertCompanyDashboardOverview({
    workspaceId,
    displayName,
    summary,
    avatarUrl,
    followerCount,
    trustScore,
    rating,
    preferences,
    actorId: req.user?.id ?? null,
  });

  res.json({ overview });
}

export default {
  dashboard,
  byokAutoReplyOverview,
  updateByokAutoReplySettings,
  listByokAutoReplyTemplates,
  createByokAutoReplyTemplate,
  updateByokAutoReplyTemplate,
  deleteByokAutoReplyTemplate,
  previewByokAutoReply,
  timeline,
  storeTimelineEvent,
  updateTimelineEvent: updateTimelineEventController,
  destroyTimelineEvent,
  storeTimelinePost,
  updateTimelinePost: updateTimelinePostController,
  changeTimelinePostStatus: changeTimelinePostStatusController,
  destroyTimelinePost,
  recordTimelineMetrics,
  updateDashboardOverview,
};

