import freelancerProfileHubService from '../services/freelancerProfileHubService.js';

export async function getProfileHub(req, res) {
  const data = await freelancerProfileHubService.getFreelancerProfileHub(req.params.userId, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(data);
}

export async function updateProfileHub(req, res) {
  const data = await freelancerProfileHubService.updateFreelancerProfileHub(req.params.userId, req.body ?? {});
  res.json(data);
}

export async function updateExpertiseAreas(req, res) {
  const data = await freelancerProfileHubService.updateFreelancerExpertiseAreas(
    req.params.userId,
    req.body?.items ?? req.body ?? [],
  );
  res.json(data);
}

export async function updateSuccessMetrics(req, res) {
  const data = await freelancerProfileHubService.updateFreelancerSuccessMetrics(
    req.params.userId,
    req.body?.items ?? req.body ?? [],
  );
  res.json(data);
}

export async function updateTestimonials(req, res) {
  const data = await freelancerProfileHubService.updateFreelancerTestimonials(
    req.params.userId,
    req.body?.items ?? req.body ?? [],
  );
  res.json(data);
}

export async function updateHeroBanners(req, res) {
  const data = await freelancerProfileHubService.updateFreelancerHeroBanners(
    req.params.userId,
    req.body?.items ?? req.body ?? [],
  );
  res.json(data);
}

export default {
  getProfileHub,
  updateProfileHub,
  updateExpertiseAreas,
  updateSuccessMetrics,
  updateTestimonials,
  updateHeroBanners,
};
