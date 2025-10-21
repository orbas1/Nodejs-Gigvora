import {
  getFreelancerDashboardOverview,
  updateFreelancerDashboardOverview,
} from '../services/freelancerDashboardOverviewService.js';
import { ValidationError } from '../utils/errors.js';

function parseFreelancerId(value) {
  const numeric = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return numeric;
}

export async function showOverview(req, res) {
  const freelancerId = parseFreelancerId(req.params?.freelancerId);
  const overview = await getFreelancerDashboardOverview(freelancerId);
  res.json(overview);
}

export async function updateOverview(req, res) {
  const freelancerId = parseFreelancerId(req.params?.freelancerId);
  const overview = await updateFreelancerDashboardOverview(freelancerId, req.body ?? {});
  res.json(overview);
}

export default {
  showOverview,
  updateOverview,
};
