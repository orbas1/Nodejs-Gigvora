import { getVisibleAnnouncements } from '../services/runtimeMaintenanceService.js';

export async function maintenanceAnnouncements(req, res) {
  const { audience, channel, windowMinutes, includeResolved, limit } = req.query ?? {};
  const result = await getVisibleAnnouncements({
    audience,
    channel,
    windowMinutes,
    includeResolved,
    limit,
  });
  res.json(result);
}

export default {
  maintenanceAnnouncements,
};
