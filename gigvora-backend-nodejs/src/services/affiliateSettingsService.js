import { PlatformSetting } from '../models/platformSetting.js';
import { ValidationError } from '../utils/errors.js';

const SETTINGS_KEY = 'affiliate-program';

const DEFAULT_SETTINGS = {
  enabled: true,
  defaultCommissionRate: 10,
  referralWindowDays: 90,
  currency: 'USD',
  payouts: {
    frequency: 'monthly',
    minimumPayoutThreshold: 50,
    autoApprove: false,
    recurrence: { type: 'infinite', limit: null },
  },
  tiers: [
    { id: 'starter', name: 'Starter', minValue: 0, maxValue: 999, rate: 8 },
    { id: 'growth', name: 'Growth', minValue: 1000, maxValue: 4999, rate: 10 },
    { id: 'elite', name: 'Elite', minValue: 5000, maxValue: null, rate: 12 },
  ],
  compliance: {
    requiredDocuments: ['taxForm', 'addressVerification'],
    twoFactorRequired: true,
    payoutKyc: true,
  },
  updatedAt: null,
};

function toNumber(value, { min = null, max = null, precision = null } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Numeric value expected.');
  }
  let candidate = numeric;
  if (typeof min === 'number' && candidate < min) {
    candidate = min;
  }
  if (typeof max === 'number' && candidate > max) {
    candidate = max;
  }
  if (typeof precision === 'number') {
    const multiplier = 10 ** precision;
    candidate = Math.round(candidate * multiplier) / multiplier;
  }
  return candidate;
}

function normaliseTier(tier, index) {
  if (!tier || typeof tier !== 'object') {
    throw new ValidationError(`Tier entry ${index + 1} is invalid.`);
  }
  const name = typeof tier.name === 'string' && tier.name.trim() ? tier.name.trim() : null;
  if (!name) {
    throw new ValidationError(`Tier ${index + 1} requires a name.`);
  }

  const minValue = toNumber(tier.minValue ?? tier.min ?? 0, { min: 0, precision: 2 }) ?? 0;
  const maxValue = toNumber(tier.maxValue ?? tier.max, { min: minValue, precision: 2 });
  const rate = toNumber(tier.rate ?? tier.commissionRate, { min: 0, max: 100, precision: 2 });
  if (rate == null) {
    throw new ValidationError(`Tier ${name} requires a commission rate.`);
  }

  const identifier =
    typeof tier.id === 'string' && tier.id.trim()
      ? tier.id.trim()
      : name.toLowerCase().replace(/\s+/g, '-');

  return {
    id: identifier,
    name,
    minValue,
    maxValue: maxValue ?? null,
    rate,
  };
}

function normaliseRecurrence(recurrence = {}) {
  const allowed = new Set(['one_time', 'finite', 'infinite']);
  const typeCandidate = typeof recurrence.type === 'string' ? recurrence.type.trim().toLowerCase() : '';
  const type = allowed.has(typeCandidate) ? typeCandidate : 'infinite';
  let limit = null;
  if (type === 'finite') {
    const parsed = toNumber(recurrence.limit, { min: 1, max: 120, precision: 0 });
    if (!parsed) {
      throw new ValidationError('Finite recurrence requires a limit between 1 and 120.');
    }
    limit = parsed;
  }
  return { type, limit };
}

function mergeSettings(raw = {}) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...raw,
    payouts: {
      ...DEFAULT_SETTINGS.payouts,
      ...(raw.payouts ?? {}),
      recurrence: normaliseRecurrence(raw.payouts?.recurrence ?? raw.recurrence),
    },
    compliance: {
      ...DEFAULT_SETTINGS.compliance,
      ...(raw.compliance ?? {}),
      requiredDocuments: Array.isArray(raw.compliance?.requiredDocuments)
        ? raw.compliance.requiredDocuments.filter((item) => typeof item === 'string' && item.trim().length)
        : DEFAULT_SETTINGS.compliance.requiredDocuments,
    },
  };

  merged.enabled = Boolean(raw.enabled ?? DEFAULT_SETTINGS.enabled);
  merged.defaultCommissionRate =
    toNumber(raw.defaultCommissionRate, { min: 0, max: 100, precision: 2 }) ?? DEFAULT_SETTINGS.defaultCommissionRate;
  merged.referralWindowDays = toNumber(raw.referralWindowDays, { min: 1, max: 365, precision: 0 }) ?? DEFAULT_SETTINGS.referralWindowDays;
  merged.currency = typeof raw.currency === 'string' && raw.currency.trim() ? raw.currency.trim().toUpperCase() : DEFAULT_SETTINGS.currency;
  merged.payouts.frequency =
    typeof merged.payouts.frequency === 'string' && merged.payouts.frequency.trim()
      ? merged.payouts.frequency.trim().toLowerCase()
      : DEFAULT_SETTINGS.payouts.frequency;
  merged.payouts.minimumPayoutThreshold =
    toNumber(merged.payouts.minimumPayoutThreshold, { min: 0, precision: 2 }) ?? DEFAULT_SETTINGS.payouts.minimumPayoutThreshold;
  merged.payouts.autoApprove = Boolean(merged.payouts.autoApprove);
  merged.compliance.twoFactorRequired = Boolean(merged.compliance.twoFactorRequired);
  merged.compliance.payoutKyc = Boolean(merged.compliance.payoutKyc);

  const tiersInput = Array.isArray(raw.tiers) ? raw.tiers : DEFAULT_SETTINGS.tiers;
  const tiers = tiersInput.map((tier, index) => normaliseTier(tier, index));
  tiers.sort((a, b) => a.minValue - b.minValue);
  merged.tiers = tiers;

  return merged;
}

export async function getAffiliateSettings() {
  const record = await PlatformSetting.findOne({ where: { key: SETTINGS_KEY } });
  if (!record) {
    return { ...DEFAULT_SETTINGS, updatedAt: null };
  }
  const value = record.value ?? {};
  const merged = mergeSettings(value);
  return { ...merged, updatedAt: record.updatedAt?.toISOString?.() ?? null };
}

export async function updateAffiliateSettings(payload = {}) {
  const nextSettings = mergeSettings(payload);
  const [record] = await PlatformSetting.findOrCreate({
    where: { key: SETTINGS_KEY },
    defaults: { value: DEFAULT_SETTINGS },
  });
  record.value = {
    ...nextSettings,
    updatedAt: undefined,
  };
  await record.save();
  return { ...nextSettings, updatedAt: record.updatedAt?.toISOString?.() ?? new Date().toISOString() };
}

export default {
  getAffiliateSettings,
  updateAffiliateSettings,
};
