import sequelize from '../models/sequelizeClient.js';
import { getPlatformStatusSummary } from '../services/platformStatusService.js';
import { resolvePulseEligibility, recordPulseResponse } from '../services/platformFeedbackService.js';

export async function statusSummary(req, res) {
  const summary = await getPlatformStatusSummary();
  return res.json(summary);
}

export async function feedbackPulseEligibility(req, res) {
  const promptId = req.query.promptId || 'global-platform-health';
  const sessionFingerprint = req.query.sessionFingerprint || null;
  const userId = req.user?.id ?? null;

  const payload = await resolvePulseEligibility({
    promptId,
    userId,
    sessionFingerprint,
  });

  return res.json({
    eligible: payload.eligible,
    reason: payload.reason,
    prompt: payload.prompt,
  });
}

export async function submitFeedbackPulse(req, res) {
  const { promptId = 'global-platform-health', rating, comment = null, sessionFingerprint = null } = req.body ?? {};
  const userId = req.user?.id ?? null;
  const fingerprint = sessionFingerprint || req.query?.sessionFingerprint || null;
  const ipAddress = (req.headers['x-forwarded-for'] || req.ip || '')?.toString().split(',')[0].trim();
  const userAgent = req.get('user-agent') || null;

  const result = await sequelize.transaction(async (transaction) =>
    recordPulseResponse({
      promptId,
      rating,
      comment,
      userId,
      sessionFingerprint: fingerprint,
      ipAddress,
      userAgent,
      metadata: {
        origin: 'platform-web',
        requestId: req.id ?? null,
      },
      transaction,
    }),
  );

  return res.status(201).json({
    prompt: result.prompt,
    state: result.state,
    response: result.response,
  });
}

export default {
  statusSummary,
  feedbackPulseEligibility,
  submitFeedbackPulse,
};
