import * as onboardingService from '../services/onboardingService.js';

export async function listPersonas(req, res) {
  const includeDeprecated = String(req.query?.includeDeprecated ?? '').toLowerCase() === 'true';
  const personas = await onboardingService.listPersonas({ includeDeprecated });
  return res.json({ personas });
}

export async function startJourney(req, res) {
  const journey = await onboardingService.startJourney({ actor: req.user, payload: req.body });
  return res.status(201).json({ journey });
}

export default {
  listPersonas,
  startJourney,
};
