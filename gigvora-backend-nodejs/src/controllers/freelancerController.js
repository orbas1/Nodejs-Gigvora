import freelancerPurchasedGigService from '../services/freelancerPurchasedGigService.js';

export async function getPurchasedGigWorkspace(req, res) {
  const { id } = req.params;
  const dashboard = await freelancerPurchasedGigService.getFreelancerPurchasedGigDashboard(id, {
    bypassCache: req.query.fresh === 'true',
  });

  if (!dashboard.freelancer) {
    return res.status(404).json({ message: 'Freelancer not found' });
  }

  res.json(dashboard);
}

export default {
  getPurchasedGigWorkspace,
};
