import { ValidationError } from '../utils/errors.js';

export const THREAD_RETENTION_DEFAULTS = Object.freeze({
  direct: { policy: 'standard_18_month', days: 548 },
  group: { policy: 'standard_18_month', days: 548 },
  support: { policy: 'support_3_year', days: 1_095 },
  project: { policy: 'project_2_year', days: 730 },
  contract: { policy: 'contract_7_year', days: 2_555 },
});

export const DEFAULT_RETENTION_POLICY = THREAD_RETENTION_DEFAULTS.direct;

export const MIN_RETENTION_DAYS = 30;
export const MAX_RETENTION_DAYS = 3_650;
export const RETENTION_AUDIT_TTL_DAYS = 540;
export const RETENTION_AUDIT_PURGE_GRACE_DAYS = 30;

export function resolveRetentionDefaults(channelType) {
  const normalized = typeof channelType === 'string' ? channelType.trim().toLowerCase() : null;
  return THREAD_RETENTION_DEFAULTS[normalized] ?? DEFAULT_RETENTION_POLICY;
}

export function clampRetentionDays(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Retention days must be a number.');
  }
  return Math.min(Math.max(numeric, MIN_RETENTION_DAYS), MAX_RETENTION_DAYS);
}

export function normaliseRetentionInput({ channelType, retentionPolicy, retentionDays }) {
  const defaults = resolveRetentionDefaults(channelType);
  const normalizedPolicy = retentionPolicy
    ? String(retentionPolicy).trim().slice(0, 60) || defaults.policy
    : defaults.policy;
  const normalizedDays = clampRetentionDays(retentionDays ?? defaults.days) ?? defaults.days;
  return {
    retentionPolicy: normalizedPolicy,
    retentionDays: normalizedDays,
  };
}

export function isPolicyOverride(channelType, policy, days) {
  const defaults = resolveRetentionDefaults(channelType);
  return defaults.policy !== policy || defaults.days !== Number(days);
}

export default {
  THREAD_RETENTION_DEFAULTS,
  DEFAULT_RETENTION_POLICY,
  MIN_RETENTION_DAYS,
  MAX_RETENTION_DAYS,
  RETENTION_AUDIT_TTL_DAYS,
  RETENTION_AUDIT_PURGE_GRACE_DAYS,
  resolveRetentionDefaults,
  clampRetentionDays,
  normaliseRetentionInput,
  isPolicyOverride,
};
