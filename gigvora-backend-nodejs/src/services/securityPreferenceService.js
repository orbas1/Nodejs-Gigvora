import { sequelize, UserSecurityPreference } from '../models/index.js';
import { ValidationError } from '../utils/errors.js';
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

export async function getUserSecurityPreferences(userId) {
  const numericId = normaliseUserId(userId);
  const record = await UserSecurityPreference.findOne({ where: { userId: numericId } });
  return sanitizePreference(record, numericId);
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

  return sanitizePreference(preference, numericId);
}

export default {
  getUserSecurityPreferences,
  upsertUserSecurityPreferences,
};
