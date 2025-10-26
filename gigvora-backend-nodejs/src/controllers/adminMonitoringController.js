import {
  getInsightsOverview,
  listMetricsExplorer,
  listMetricsExplorerViews,
  createMetricsExplorerView,
  deleteMetricsExplorerView,
  listAuditTrail,
  exportAuditTrail,
} from '../services/adminMonitoringService.js';
import { resolveRequestUserId } from '../utils/requestContext.js';

function resolveActor(req) {
  const actorId = resolveRequestUserId(req);
  return actorId ? { actorId } : {};
}

export async function insights(req, res) {
  const overview = await getInsightsOverview(req.query ?? {});
  res.json(overview);
}

export async function metrics(req, res) {
  const explorer = await listMetricsExplorer(req.query ?? {});
  res.json(explorer);
}

export async function views(req, res) {
  const savedViews = await listMetricsExplorerViews();
  res.json({ views: savedViews });
}

export async function createView(req, res) {
  const view = await createMetricsExplorerView(req.body ?? {}, resolveActor(req));
  res.status(201).json(view);
}

export async function removeView(req, res) {
  await deleteMetricsExplorerView(req.params.viewId);
  res.status(204).send();
}

export async function auditTrail(req, res) {
  const result = await listAuditTrail(req.query ?? {});
  res.json(result);
}

export async function exportAudit(req, res) {
  const exportResult = await exportAuditTrail(req.query ?? {});
  res.json(exportResult);
}

export default {
  insights,
  metrics,
  views,
  createView,
  removeView,
  auditTrail,
  exportAudit,
};
