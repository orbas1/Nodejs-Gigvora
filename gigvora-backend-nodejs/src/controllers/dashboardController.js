import { getDashboardOverview } from '../services/dashboardService.js';
import { resolveRequestUserId } from '../utils/requestContext.js';
import { ValidationError } from '../utils/errors.js';

export async function overview(req, res) {
  const userId = resolveRequestUserId(req) ?? req.user?.id;
  if (!userId) {
    throw new ValidationError('Authentication required to load dashboard.');
  }

  const data = await getDashboardOverview(userId);
  res.json({ overview: data });
}

export default {
  overview,
};
