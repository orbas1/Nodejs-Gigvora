import { sequelize, UserSecurityPreference } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { getIdentityVerificationOverview } from './complianceService.js';
import { recordRuntimeSecurityEvent } from './securityAuditService.js';

const MIN_TIMEOUT_MINUTES = 5;
const MAX_TIMEOUT_MINUTES = 1440;

function normaliseUserId(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function normaliseTimeout(value, fallback) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('sessionTimeoutMinutes must be a valid number.');
  }
  const rounded = Math.round(numeric);
  if (rounded < MIN_TIMEOUT_MINUTES || rounded > MAX_TIMEOUT_MINUTES) {
    throw new ValidationError(
      `sessionTimeoutMinutes must be between ${MIN_TIMEOUT_MINUTES} and ${MAX_TIMEOUT_MINUTES} minutes.`,
    );
  }
  return rounded;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalised)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalised)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return fallback;
}

function sanitizePreference(record, userId) {
  if (!record) {
    return {
      userId,
      sessionTimeoutMinutes: 30,
      biometricApprovalsEnabled: false,
      deviceApprovalsEnabled: true,
    };
  }
  return record.toPublicObject();
}

function buildIdentitySummary(snapshot) {
  if (!snapshot) {
    return null;
  }

  const documents = snapshot.current?.documents ?? {};
  return {
    status: snapshot.current?.status ?? 'pending',
    submitted: Boolean(snapshot.current?.submitted),
    verificationProvider: snapshot.current?.verificationProvider ?? 'manual_review',
    submittedAt: snapshot.current?.submittedAt ?? null,
    reviewedAt: snapshot.current?.reviewedAt ?? null,
    expiresAt: snapshot.current?.expiresAt ?? null,
    lastUpdated: snapshot.current?.lastUpdated ?? null,
    reviewerId: snapshot.current?.reviewerId ?? null,
    declinedReason: snapshot.current?.declinedReason ?? null,
    complianceFlags: Array.isArray(snapshot.current?.complianceFlags)
      ? snapshot.current.complianceFlags
      : [],
    documents: {
      frontUploaded: Boolean(documents.front),
      backUploaded: Boolean(documents.back),
      selfieUploaded: Boolean(documents.selfie),
    },
    nextActions: Array.isArray(snapshot.nextActions) ? snapshot.nextActions : [],
    reviewSlaHours: snapshot.requirements?.reviewSlaHours ?? null,
    supportContact: snapshot.requirements?.supportContact ?? null,
  };
}

function buildSecurityInsights(preference, identitySummary) {
  const recommendations = [];
  let score = 50;

  const timeout = preference.sessionTimeoutMinutes ?? 30;
  if (timeout <= 15) {
    score += 20;
  } else if (timeout <= 30) {
    score += 10;
  } else if (timeout > 60) {
    score -= 10;
    recommendations.push('Reduce the session timeout to limit unattended access risk.');
  }

  if (preference.biometricApprovalsEnabled) {
    score += 20;
  } else {
    recommendations.push('Enable biometric approvals to protect payouts and data exports.');
  }

  if (preference.deviceApprovalsEnabled) {
    score += 15;
  } else {
    score -= 5;
    recommendations.push('Activate trusted device approvals to catch unfamiliar sign-ins.');
  }

  if (identitySummary?.status === 'verified') {
    score += 20;
  } else if (identitySummary?.submitted) {
    score += 5;
    recommendations.push('Finish identity review to unlock enterprise workspaces.');
  } else {
    score -= 5;
    recommendations.push('Submit government ID and proof of address to complete verification.');
  }

  if (identitySummary?.complianceFlags?.includes('identity_documents_incomplete')) {
    score -= 5;
    recommendations.push('Upload missing front, back, or selfie documents for identity checks.');
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  let label = 'Fair';
  if (normalizedScore >= 90) {
    label = 'Excellent';
  } else if (normalizedScore >= 75) {
    label = 'Strong';
  } else if (normalizedScore < 55) {
    label = 'Needs attention';
  }

  return {
    score: normalizedScore,
    label,
    identityStatus: identitySummary?.status ?? 'pending',
    recommendations,
  };
}

async function loadIdentitySnapshot(userId) {
  try {
    const snapshot = await getIdentityVerificationOverview(userId, {
      includeHistory: false,
      actorRoles: ['user'],
    });
    return buildIdentitySummary(snapshot);
  } catch (error) {
    if (error instanceof NotFoundError || error?.status === 404 || error?.statusCode === 404) {
      return null;
    }
    if (error?.name === 'ValidationError') {
      return null;
    }
    throw error;
  }
}

async function buildSecurityPreferenceResponse(userId, preferenceRecord) {
  const preference = sanitizePreference(preferenceRecord, userId);
  const identity = await loadIdentitySnapshot(userId);
  const insights = buildSecurityInsights(preference, identity);
  return { ...preference, identity, insights };
}

export async function getUserSecurityPreferences(userId) {
  const numericId = normaliseUserId(userId);
  const record = await UserSecurityPreference.findOne({ where: { userId: numericId } });
  return buildSecurityPreferenceResponse(numericId, record);
}

export async function upsertUserSecurityPreferences(userId, patch = {}, { actorId } = {}) {
  const numericId = normaliseUserId(userId);
  if (patch == null || typeof patch !== 'object') {
    throw new ValidationError('Payload must be an object.');
  }

  const current = await UserSecurityPreference.findOne({ where: { userId: numericId } });
  const nextTimeout = normaliseTimeout(patch.sessionTimeoutMinutes ?? patch.sessionTimeout, current?.sessionTimeoutMinutes ?? 30);
  const nextBiometric = toBoolean(
    patch.biometricApprovalsEnabled ?? patch.requireBiometrics ?? patch.biometrics,
    current?.biometricApprovalsEnabled ?? false,
  );
  const nextDevice = toBoolean(
    patch.deviceApprovalsEnabled ?? patch.deviceAlertsEnabled ?? patch.deviceApprovals,
    current?.deviceApprovalsEnabled ?? true,
  );

  const preference = await sequelize.transaction(async (transaction) => {
    if (current) {
      current.sessionTimeoutMinutes = nextTimeout;
      current.biometricApprovalsEnabled = nextBiometric;
      current.deviceApprovalsEnabled = nextDevice;
      await current.save({ transaction });
      return current;
    }

    return UserSecurityPreference.create(
      {
        userId: numericId,
        sessionTimeoutMinutes: nextTimeout,
        biometricApprovalsEnabled: nextBiometric,
        deviceApprovalsEnabled: nextDevice,
      },
      { transaction },
    );
  });

  await recordRuntimeSecurityEvent(
    {
      eventType: 'security.preferences.updated',
      message: 'Security preferences updated via account settings.',
      level: 'info',
      triggeredBy: actorId ? String(actorId) : String(numericId),
      metadata: {
        userId: numericId,
        sessionTimeoutMinutes: preference.sessionTimeoutMinutes,
        biometricApprovalsEnabled: preference.biometricApprovalsEnabled,
        deviceApprovalsEnabled: preference.deviceApprovalsEnabled,
      },
    },
    { logger: null },
  );

  return buildSecurityPreferenceResponse(numericId, preference);
}

export default {
  getUserSecurityPreferences,
  upsertUserSecurityPreferences,
};

export const __testables = {
  buildIdentitySummary,
  buildSecurityInsights,
};
