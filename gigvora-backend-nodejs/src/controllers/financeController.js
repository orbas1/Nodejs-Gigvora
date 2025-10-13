import { getFinanceControlTowerOverview } from '../services/financeService.js';
import { ValidationError } from '../utils/errors.js';

function resolveUserId(req, { required = true } = {}) {
  const candidates = [
    req.user?.id,
    req.query?.userId,
    req.body?.userId,
    req.params?.userId,
  ];

  for (const candidate of candidates) {
    if (candidate == null) continue;
    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  if (required) {
    throw new ValidationError('userId is required to load the finance overview.');
  }

  return null;
}

export async function controlTowerOverview(req, res) {
  const userId = resolveUserId(req);
  const { dateFrom, dateTo, refresh } = req.query ?? {};
  const overview = await getFinanceControlTowerOverview(userId, {
    dateFrom,
    dateTo,
    forceRefresh: String(refresh ?? '').toLowerCase() === 'true',
  });
  res.json(overview);
}

export default {
  controlTowerOverview,
};
