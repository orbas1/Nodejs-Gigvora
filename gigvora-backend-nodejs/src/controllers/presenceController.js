import {
  getPresenceSnapshot,
  getPresenceBatch,
  updatePresenceStatus,
  startFocusSession,
  endFocusSession,
  scheduleAvailabilityWindow,
  refreshCalendarSync,
} from '../services/presenceService.js';
import { ValidationError } from '../utils/errors.js';

function parseBoolean(value, fallback = undefined) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  throw new ValidationError('Boolean query parameters must be true or false.');
}

function parseMemberIds(queryValue) {
  if (!queryValue) {
    return [];
  }
  if (Array.isArray(queryValue)) {
    return queryValue;
  }
  return String(queryValue)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function show(req, res) {
  const { includeCalendar, includeTimeline, includeFocus } = req.query ?? {};
  const snapshot = await getPresenceSnapshot(req.params.userId, {
    includeCalendar: parseBoolean(includeCalendar, true),
    includeTimeline: parseBoolean(includeTimeline, true),
    includeFocus: parseBoolean(includeFocus, true),
  });
  res.json(snapshot);
}

export async function index(req, res) {
  const memberIds = parseMemberIds(req.query?.memberIds);
  const includeCalendar = parseBoolean(req.query?.includeCalendar, true);
  const includeTimeline = parseBoolean(req.query?.includeTimeline, false);
  const includeFocus = parseBoolean(req.query?.includeFocus, false);

  const snapshots = await getPresenceBatch({
    memberIds,
    includeCalendar,
    includeTimeline,
    includeFocus,
  });

  res.json({ items: snapshots });
}

export async function updateStatus(req, res) {
  const updated = await updatePresenceStatus(req.params.userId, req.body ?? {});
  res.json(updated);
}

export async function startFocus(req, res) {
  const session = await startFocusSession(req.params.userId, req.body ?? {});
  res.status(201).json(session);
}

export async function endFocus(req, res) {
  const session = await endFocusSession(req.params.userId);
  res.json(session);
}

export async function scheduleAvailability(req, res) {
  const window = await scheduleAvailabilityWindow(req.params.userId, req.body ?? {});
  res.status(201).json(window);
}

export async function refreshCalendar(req, res) {
  const job = await refreshCalendarSync(req.params.userId, { actorId: req.user?.id ?? null });
  res.status(202).json(job);
}

export default {
  show,
  index,
  updateStatus,
  startFocus,
  endFocus,
  scheduleAvailability,
  refreshCalendar,
};
