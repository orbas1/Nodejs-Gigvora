import navigationPulseService from '../services/navigationPulseService.js';
import { resolveRequestUserId } from '../utils/requestContext.js';
import { AuthorizationError } from '../utils/errors.js';

function normaliseTimeframe(value) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }
  return ['24h', '7d', '30d'].includes(trimmed) ? trimmed : undefined;
}

export async function pulse(req, res) {
  const userId = resolveRequestUserId(req);
  if (!userId) {
    throw new AuthorizationError('Authentication is required to load navigation insights.');
  }

  const timeframe = normaliseTimeframe(req.query?.timeframe) ?? undefined;
  const limit = req.query?.limit;
  const personaHint = req.query?.persona;

  const payload = await navigationPulseService.getNavigationPulse({
    userId,
    limitTrending: limit,
    timeframe,
    personaHint,
  });

  res.json(payload);
}

export default {
  pulse,
};
