import {
  createClientPortal,
  updateClientPortal,
  getClientPortalDashboard,
  addTimelineEvent,
  updateTimelineEvent,
  addScopeItem,
  updateScopeItem,
  recordDecision,
  createInsightWidget,
  updateInsightWidget,
} from '../services/clientPortalService.js';

function parseNumber(value, fallback = undefined) {
  if (value == null) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function store(req, res) {
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await createClientPortal(payload, { actorId });
  res.status(201).json(result);
}

export async function update(req, res) {
  const { portalId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await updateClientPortal(parseNumber(portalId, portalId), payload, { actorId });
  res.json(result);
}

export async function dashboard(req, res) {
  const { portalId } = req.params;
  const result = await getClientPortalDashboard(parseNumber(portalId, portalId));
  res.json(result);
}

export async function storeTimelineEvent(req, res) {
  const { portalId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await addTimelineEvent(parseNumber(portalId, portalId), payload, { actorId });
  res.status(201).json(result);
}

export async function updateTimeline(req, res) {
  const { portalId, eventId } = req.params;
  const payload = req.body ?? {};
  const result = await updateTimelineEvent(parseNumber(portalId, portalId), parseNumber(eventId, eventId), payload);
  res.json(result);
}

export async function storeScopeItem(req, res) {
  const { portalId } = req.params;
  const payload = req.body ?? {};
  const result = await addScopeItem(parseNumber(portalId, portalId), payload);
  res.status(201).json(result);
}

export async function updateScope(req, res) {
  const { portalId, itemId } = req.params;
  const payload = req.body ?? {};
  const result = await updateScopeItem(parseNumber(portalId, portalId), parseNumber(itemId, itemId), payload);
  res.json(result);
}

export async function storeDecision(req, res) {
  const { portalId } = req.params;
  const payload = req.body ?? {};
  const result = await recordDecision(parseNumber(portalId, portalId), payload);
  res.status(201).json(result);
}

export async function storeInsight(req, res) {
  const { portalId } = req.params;
  const payload = req.body ?? {};
  const result = await createInsightWidget(parseNumber(portalId, portalId), payload);
  res.status(201).json(result);
}

export async function updateInsight(req, res) {
  const { portalId, widgetId } = req.params;
  const payload = req.body ?? {};
  const result = await updateInsightWidget(
    parseNumber(portalId, portalId),
    parseNumber(widgetId, widgetId),
    payload,
  );
  res.json(result);
}

export default {
  store,
  update,
  dashboard,
  storeTimelineEvent,
  updateTimeline,
  storeScopeItem,
  updateScope,
  storeDecision,
  storeInsight,
  updateInsight,
};
