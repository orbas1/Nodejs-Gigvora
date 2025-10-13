import { getFreelancerSpotlight } from '../services/communitySpotlightService.js';

export async function communitySpotlight(req, res) {
  const { freelancerId } = req.params;
  const { profileId, includeDraft } = req.query ?? {};

  const result = await getFreelancerSpotlight({
    userId: freelancerId,
    profileId,
    includeDraft: includeDraft === 'true',
  });

  res.json(result);
}

export default {
  communitySpotlight,
};
