import { getFreelancerDashboard } from '../services/freelancerDashboardService.js';
import { ValidationError } from '../utils/errors.js';

function parseNumber(value) {
  if (value == null) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function dashboard(req, res) {
  const { freelancerId } = req.query ?? {};
  const id = parseNumber(freelancerId);

  if (!id) {
    throw new ValidationError('freelancerId query parameter is required.');
  }

  const payload = await getFreelancerDashboard(id, {
    bypassCache: req.query.fresh === 'true',
  });

  res.json(payload);
}

export default {
  dashboard,
};

