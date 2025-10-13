import { getFreelancerFinanceInsights } from '../services/financeInsightsService.js';

function parseFreelancerId(value) {
  return Number.parseInt(value, 10);
}

export async function showFreelancerInsights(req, res) {
  const { freelancerId } = req.params;
  const normalizedId = parseFreelancerId(freelancerId);
  const insights = await getFreelancerFinanceInsights(normalizedId);
  res.json(insights);
}

export default {
  showFreelancerInsights,
};
