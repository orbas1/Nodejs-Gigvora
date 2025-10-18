import {
  getFreelancerDashboardOverview,
  updateFreelancerDashboardOverview,
} from '../services/freelancerDashboardOverviewService.js';

export async function showOverview(req, res) {
  const { freelancerId } = req.params;
  const overview = await getFreelancerDashboardOverview(freelancerId);
  res.json(overview);
}

export async function updateOverview(req, res) {
  const { freelancerId } = req.params;
  const overview = await updateFreelancerDashboardOverview(freelancerId, req.body ?? {});
  res.json(overview);
}

export default {
  showOverview,
  updateOverview,
};
