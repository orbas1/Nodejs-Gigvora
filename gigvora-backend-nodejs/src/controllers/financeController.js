import { getFinanceControlTowerOverview } from '../services/financeService.js';
import { getFreelancerFinanceInsights } from '../services/financeInsightsService.js';
import { ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
}

function resolveUserId(req, { required = true } = {}) {
  const candidates = [req.user?.id, req.user?.userId, req.query?.userId, req.body?.userId, req.params?.userId];

  for (const candidate of candidates) {
    const numeric = parsePositiveInteger(candidate);
    if (numeric) {
      return numeric;
    }
  }

  if (required) {
    throw new ValidationError('userId is required to load the finance overview.');
  }

  return null;
}

function normaliseDate(value) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('dateFrom and dateTo must be valid ISO 8601 strings.');
  }
  return date.toISOString();
}

export async function controlTowerOverview(req, res) {
  const userId = resolveUserId(req);
  const { dateFrom, dateTo, refresh } = req.query ?? {};
  const overview = await getFinanceControlTowerOverview(userId, {
    dateFrom: normaliseDate(dateFrom),
    dateTo: normaliseDate(dateTo),
    forceRefresh: refresh === 'true' || refresh === true,
  });
  res.json(overview);
}

export async function showFreelancerInsights(req, res) {
  const freelancerId = parsePositiveInteger(req.params?.freelancerId);
  if (!freelancerId) {
    throw new ValidationError('A valid freelancerId is required.');
  }
  const insights = await getFreelancerFinanceInsights(freelancerId);
  res.json(insights);
}

export default {
  controlTowerOverview,
  showFreelancerInsights,
};
