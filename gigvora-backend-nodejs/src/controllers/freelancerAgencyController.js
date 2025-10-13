import { getCollaborationsOverview } from '../services/freelancerAgencyService.js';

function parseNumeric(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export async function collaborationsOverview(req, res) {
  const { freelancerId } = req.params;
  const { lookbackDays, includeInactive } = req.query ?? {};

  const payload = await getCollaborationsOverview({
    freelancerId,
    lookbackDays: parseNumeric(lookbackDays),
    includeInactive,
  });

  res.json(payload);
}

export default {
  collaborationsOverview,
};

