import { getCollaborationsOverview } from '../services/freelancerAgencyService.js';
import { ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return undefined;
  }
  return numeric;
}

function parseBoolean(value) {
  if (value == null) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = `${value}`.toLowerCase().trim();
  return ['1', 'true', 'yes', 'on'].includes(normalised);
}

export async function collaborationsOverview(req, res) {
  const freelancerId = parsePositiveInteger(req.params?.freelancerId ?? req.params?.id);
  if (!freelancerId) {
    throw new ValidationError('A valid freelancerId is required.');
  }
  const { lookbackDays, includeInactive } = req.query ?? {};

  const payload = await getCollaborationsOverview({
    freelancerId,
    lookbackDays: parsePositiveInteger(lookbackDays),
    includeInactive: parseBoolean(includeInactive),
  });

  res.json(payload);
}

export default {
  collaborationsOverview,
};

