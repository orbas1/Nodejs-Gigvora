import { getAgencyDashboard } from '../services/agencyDashboardService.js';

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

export default {
  dashboard,
};

