import { getUserConsentSnapshot, recordUserConsentDecision } from '../services/consentService.js';

export async function snapshot(req, res) {
  const userId = Number(req.params?.id);
  const filters = {
    audience: req.query?.audience,
    region: req.query?.region,
  };
  const snapshotData = await getUserConsentSnapshot(userId, filters);
  res.json({
    userId,
    outstandingRequired: snapshotData.outstandingRequired,
    policies: snapshotData.policies,
  });
}

export async function update(req, res) {
  const userId = Number(req.params?.id);
  const { policyCode } = req.params ?? {};
  const payload = req.body ?? {};
  const consent = await recordUserConsentDecision(userId, policyCode, {
    status: payload.status,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    source: payload.source ?? 'self_service',
    metadata: payload.metadata,
    actorId: req.user?.id && req.user.id !== userId ? String(req.user.id) : null,
  });

  res.json({ consent: consent.toSnapshot() });
}

export default {
  snapshot,
  update,
};
