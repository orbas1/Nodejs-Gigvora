import { getAgencyDashboard } from '../services/agencyDashboardService.js';
import { getAgencyOverview, updateAgencyOverview } from '../services/agencyOverviewService.js';

function parseNumber(value) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function dashboard(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query ?? {};
  const actorId = req.user?.id ?? null;
  const actorRole = req.user?.type ?? null;

  const payload = {
    workspaceId: parseNumber(workspaceId),
    workspaceSlug: workspaceSlug ?? undefined,
    lookbackDays: parseNumber(lookbackDays),
  };

  const result = await getAgencyDashboard(payload, { actorId, actorRole });
  res.json(result);
}

export async function overview(req, res) {
  const { workspaceId, workspaceSlug } = req.query ?? {};
  const actorId = req.user?.id ?? null;
  const actorRole = req.user?.type ?? null;
  const actorRoles = req.user?.roles ?? [];

  const payload = {
    workspaceId: parseNumber(workspaceId),
    workspaceSlug: workspaceSlug ?? undefined,
  };

  const result = await getAgencyOverview(payload, { actorId, actorRole, actorRoles });
  res.json(result);
}

export async function updateOverview(req, res) {
  const actorId = req.user?.id ?? null;
  const actorRole = req.user?.type ?? null;
  const actorRoles = req.user?.roles ?? [];

  const result = await updateAgencyOverview(req.body ?? {}, { actorId, actorRole, actorRoles });
  res.json(result);
}

export default {
  dashboard,
  overview,
  updateOverview,
};

