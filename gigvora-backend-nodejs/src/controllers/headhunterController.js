import { getDashboardSnapshot } from '../services/headhunterService.js';

export async function dashboard(req, res) {
  const { workspaceId, lookbackDays } = req.query ?? {};
  const result = await getDashboardSnapshot({ workspaceId, lookbackDays });
  res.json(result);
}

export default {
  dashboard,
};
