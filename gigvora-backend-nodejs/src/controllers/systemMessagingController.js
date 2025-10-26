import {
  getLatestSystemStatusEvent,
  acknowledgeSystemStatusEvent,
  getFeedbackPulse,
  submitFeedbackPulseResponse,
} from '../services/systemMessagingService.js';

function normaliseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value == null) {
    return false;
  }
  const normalised = `${value}`.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalised);
}

export async function fetchLatestSystemStatus(req, res) {
  const event = await getLatestSystemStatusEvent({
    includeResolved: normaliseBoolean(req.query?.includeResolved),
    includeExpired: normaliseBoolean(req.query?.includeExpired),
    now: req.query?.now,
    userId: req.user?.id ?? null,
  });
  res.json({ event });
}

export async function acknowledgeSystemStatus(req, res) {
  const actor = req.user ? { actorId: req.user.id, roles: req.user.roles ?? [] } : {};
  const { event, acknowledgement } = await acknowledgeSystemStatusEvent(req.params.eventKey, {
    actorId: actor.actorId,
    channel: req.body?.channel,
    metadata: req.body?.metadata,
  });
  res.status(201).json({ event, acknowledgement });
}

export async function showFeedbackPulse(req, res) {
  const pulse = await getFeedbackPulse(req.params.pulseKey, {
    includeInactive: normaliseBoolean(req.query?.includeInactive),
  });
  res.json({ pulse });
}

export async function createFeedbackPulseResponse(req, res) {
  const actor = req.user ? { actorId: req.user.id, roles: req.user.roles ?? [] } : {};
  const result = await submitFeedbackPulseResponse(req.params.pulseKey, req.body, actor);
  res.status(201).json(result);
}

export default {
  fetchLatestSystemStatus,
  acknowledgeSystemStatus,
  showFeedbackPulse,
  createFeedbackPulseResponse,
};
