import { getGovernanceOverview } from '../services/adminGovernanceService.js';

export async function overview(req, res) {
  const { lookbackDays, queueLimit, publicationLimit, timelineLimit } = req.query ?? {};

  const payload = await getGovernanceOverview({
    lookbackDays: lookbackDays ?? undefined,
    queueLimit: queueLimit ?? undefined,
    publicationLimit: publicationLimit ?? undefined,
    timelineLimit: timelineLimit ?? undefined,
  });

  res.json(payload);
}

export default {
  overview,
};
