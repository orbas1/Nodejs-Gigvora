import { sampleLiveServiceTelemetry } from '../services/liveServiceTelemetryService.js';

export async function getLiveServiceTelemetry(req, res) {
  const { windowMinutes, forceRefresh } = req.query ?? {};
  const telemetry = await sampleLiveServiceTelemetry({
    windowMinutes,
    forceRefresh,
  });
  res.json({ telemetry });
}

export default {
  getLiveServiceTelemetry,
};
