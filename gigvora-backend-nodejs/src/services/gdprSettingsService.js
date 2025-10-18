import { PlatformSetting } from '../models/platformSetting.js';
import { ValidationError } from '../utils/errors.js';

const SETTINGS_KEY = 'gdpr-settings';

const DEFAULT_SETTINGS = {
  dpo: {
    name: 'Jane Calder',
    email: 'privacy@gigvora.com',
    phone: '+44 20 7123 4567',
    officeLocation: 'London, United Kingdom',
    address: 'Gigvora Privacy Office, 20 Bishopsgate, London EC2N 4AG',
    timezone: 'Europe/London',
    availability: 'Monday to Friday, 09:00-17:00 GMT',
  },
  dataSubjectRequests: {
    contactEmail: 'privacy@gigvora.com',
    escalationEmail: 'legal@gigvora.com',
    slaDays: 30,
    automatedIntake: true,
    intakeChannels: ['in-app portal', 'email'],
    privacyPortalUrl: 'https://gigvora.com/privacy-portal',
    exportFormats: ['JSON', 'CSV'],
    statusDashboardUrl: 'https://status.gigvora.com/privacy',
  },
  retentionPolicies: [
    {
      id: 'account-data',
      name: 'Account data',
      dataCategories: ['profile information', 'account security'],
      retentionDays: 730,
      notes: 'Account records are removed 24 months after account closure unless statutory obligations require extension.',
      legalBasis: 'Contractual necessity',
      appliesTo: ['members', 'companies'],
      reviewer: 'Privacy Operations',
      autoDelete: true,
    },
    {
      id: 'analytics-events',
      name: 'Product analytics',
      dataCategories: ['usage telemetry'],
      retentionDays: 365,
      notes: 'Telemetry is aggregated after 12 months and raw events are deleted.',
      legalBasis: 'Legitimate interest',
      appliesTo: ['members'],
      reviewer: 'Data Platform',
      autoDelete: true,
    },
  ],
  processors: [
    {
      id: 'aws',
      name: 'Amazon Web Services',
      purpose: 'Infrastructure hosting',
      dataCategories: ['all data classes'],
      dataTransferMechanism: 'UK IDTA',
      region: 'eu-west-2',
      dpaSigned: true,
      securityReviewDate: '2024-01-12',
      status: 'active',
      contactEmail: 'aws-security@amazon.com',
      subprocessor: false,
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      purpose: 'Transactional email delivery',
      dataCategories: ['contact information'],
      dataTransferMechanism: 'SCCs',
      region: 'United States',
      dpaSigned: true,
      securityReviewDate: '2023-11-02',
      status: 'active',
      contactEmail: 'privacy@sendgrid.com',
      subprocessor: true,
    },
  ],
  breachResponse: {
    notificationWindowHours: 72,
    onCallContact: 'security@gigvora.com',
    incidentRunbookUrl: 'https://gigvora.com/runbooks/gdpr-breach',
    tabletopLastRun: '2024-03-18',
    tooling: ['PagerDuty', 'Jira', 'Slack'],
    legalCounsel: 'counsel@gigvora.com',
    communicationsContact: 'press@gigvora.com',
  },
  consentFramework: {
    marketingOptInDefault: false,
    cookieBannerEnabled: true,
    cookieRefreshMonths: 12,
    consentLogRetentionDays: 1095,
    withdrawalChannels: ['privacy portal', 'account settings'],
    guardianContactEmail: 'guardian@gigvora.com',
    cookiePolicyUrl: 'https://gigvora.com/cookie-policy',
    preferenceCenterUrl: 'https://gigvora.com/preferences',
  },
  updatedAt: null,
};

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(lowered)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value !== 0;
    }
  }
  return fallback;
}

function toOptionalString(value, { maxLength } = {}) {
  if (value == null) {
    return '';
  }
  const str = typeof value === 'string' ? value : String(value);
  const trimmed = str.trim();
  if (!trimmed) {
    return '';
  }
  if (typeof maxLength === 'number' && maxLength > 0 && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function toNumber(value, fallback = null, { min = null, max = null, precision = null } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
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

function toInteger(value, fallback = null, options = {}) {
  const numeric = toNumber(value, fallback, options);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.trunc(numeric);
}

function normaliseStringArray(values, { unique = true, maxLength } = {}) {
  if (!Array.isArray(values)) {
    return [];
  }
  const mapped = values
    .map((value) => toOptionalString(value, { maxLength }))
    .filter((value) => value.length > 0);
  if (unique) {
    return Array.from(new Set(mapped));
  }
  return mapped;
}

function createIdentifier(value, fallback) {
  const candidate = toOptionalString(value, { maxLength: 120 })
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  const trimmed = candidate.replace(/^-+|-+$/g, '');
  if (trimmed) {
    return trimmed.slice(0, 120);
  }
  return fallback;
}

function normaliseRetentionPolicy(policy, index) {
  if (!policy || typeof policy !== 'object') {
    throw new ValidationError(`Retention policy ${index + 1} is invalid.`);
  }
  const name = toOptionalString(policy.name, { maxLength: 180 });
  if (!name) {
    throw new ValidationError(`Retention policy ${index + 1} requires a name.`);
  }
  const retentionDays = toInteger(policy.retentionDays ?? policy.retentionPeriodDays, 365, {
    min: 1,
    max: 3650,
  });
  if (!retentionDays) {
    throw new ValidationError(`Retention policy ${name} requires a retention period in days.`);
  }
  const id = createIdentifier(policy.id ?? policy.key ?? name, `policy-${index + 1}`);
  const dataCategories = normaliseStringArray(policy.dataCategories ?? policy.categories, {
    maxLength: 120,
  });
  const appliesTo = normaliseStringArray(policy.appliesTo ?? policy.subjects, {
    maxLength: 120,
  });

  return {
    id,
    name,
    dataCategories,
    retentionDays,
    notes: toOptionalString(policy.notes, { maxLength: 1000 }),
    legalBasis: toOptionalString(policy.legalBasis ?? policy.basis, { maxLength: 180 }),
    appliesTo,
    reviewer: toOptionalString(policy.reviewer ?? policy.owner, { maxLength: 180 }),
    autoDelete: toBoolean(policy.autoDelete ?? policy.automatedDestruction, true),
  };
}

function normaliseProcessor(processor, index) {
  if (!processor || typeof processor !== 'object') {
    throw new ValidationError(`Processor ${index + 1} is invalid.`);
  }
  const name = toOptionalString(processor.name, { maxLength: 180 });
  if (!name) {
    throw new ValidationError(`Processor ${index + 1} requires a name.`);
  }
  const id = createIdentifier(processor.id ?? processor.key ?? name, `processor-${index + 1}`);
  return {
    id,
    name,
    purpose: toOptionalString(processor.purpose, { maxLength: 255 }),
    dataCategories: normaliseStringArray(processor.dataCategories ?? processor.categories, {
      maxLength: 120,
    }),
    dataTransferMechanism: toOptionalString(processor.dataTransferMechanism ?? processor.transferMechanism, {
      maxLength: 180,
    }),
    region: toOptionalString(processor.region ?? processor.location, { maxLength: 120 }),
    dpaSigned: toBoolean(processor.dpaSigned ?? processor.hasDpa, true),
    securityReviewDate: toOptionalString(processor.securityReviewDate ?? processor.lastReview, {
      maxLength: 40,
    }),
    status: toOptionalString(processor.status ?? processor.state, { maxLength: 120 }) || 'active',
    contactEmail: toOptionalString(processor.contactEmail ?? processor.contact, { maxLength: 255 }),
    subprocessor: toBoolean(processor.subprocessor ?? processor.isSubprocessor, false),
  };
}

function mergeSettings(raw = {}) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...raw,
    dpo: {
      ...DEFAULT_SETTINGS.dpo,
      ...(raw.dpo ?? {}),
    },
    dataSubjectRequests: {
      ...DEFAULT_SETTINGS.dataSubjectRequests,
      ...(raw.dataSubjectRequests ?? {}),
    },
    breachResponse: {
      ...DEFAULT_SETTINGS.breachResponse,
      ...(raw.breachResponse ?? {}),
    },
    consentFramework: {
      ...DEFAULT_SETTINGS.consentFramework,
      ...(raw.consentFramework ?? {}),
    },
  };

  merged.dpo.name = toOptionalString(merged.dpo.name, { maxLength: 180 });
  merged.dpo.email = toOptionalString(merged.dpo.email, { maxLength: 255 });
  merged.dpo.phone = toOptionalString(merged.dpo.phone, { maxLength: 64 });
  merged.dpo.officeLocation = toOptionalString(merged.dpo.officeLocation, { maxLength: 255 });
  merged.dpo.address = toOptionalString(merged.dpo.address, { maxLength: 500 });
  merged.dpo.timezone = toOptionalString(merged.dpo.timezone, { maxLength: 120 });
  merged.dpo.availability = toOptionalString(merged.dpo.availability, { maxLength: 255 });

  merged.dataSubjectRequests.contactEmail = toOptionalString(merged.dataSubjectRequests.contactEmail, {
    maxLength: 255,
  });
  merged.dataSubjectRequests.escalationEmail = toOptionalString(merged.dataSubjectRequests.escalationEmail, {
    maxLength: 255,
  });
  merged.dataSubjectRequests.slaDays = toInteger(merged.dataSubjectRequests.slaDays, 30, {
    min: 1,
    max: 180,
  });
  merged.dataSubjectRequests.automatedIntake = toBoolean(merged.dataSubjectRequests.automatedIntake, true);
  merged.dataSubjectRequests.intakeChannels = normaliseStringArray(
    merged.dataSubjectRequests.intakeChannels,
    { maxLength: 120 },
  );
  merged.dataSubjectRequests.exportFormats = normaliseStringArray(
    merged.dataSubjectRequests.exportFormats,
    { maxLength: 120 },
  );
  merged.dataSubjectRequests.privacyPortalUrl = toOptionalString(
    merged.dataSubjectRequests.privacyPortalUrl,
    { maxLength: 2048 },
  );
  merged.dataSubjectRequests.statusDashboardUrl = toOptionalString(
    merged.dataSubjectRequests.statusDashboardUrl,
    { maxLength: 2048 },
  );

  const retentionInput = Array.isArray(raw.retentionPolicies) ? raw.retentionPolicies : merged.retentionPolicies;
  merged.retentionPolicies = retentionInput.map((policy, index) => normaliseRetentionPolicy(policy, index));

  const processorsInput = Array.isArray(raw.processors) ? raw.processors : merged.processors;
  merged.processors = processorsInput.map((processor, index) => normaliseProcessor(processor, index));

  merged.breachResponse.notificationWindowHours = toInteger(
    merged.breachResponse.notificationWindowHours,
    72,
    { min: 1, max: 168 },
  );
  merged.breachResponse.onCallContact = toOptionalString(merged.breachResponse.onCallContact, { maxLength: 255 });
  merged.breachResponse.incidentRunbookUrl = toOptionalString(merged.breachResponse.incidentRunbookUrl, {
    maxLength: 2048,
  });
  merged.breachResponse.tabletopLastRun = toOptionalString(merged.breachResponse.tabletopLastRun, { maxLength: 40 });
  merged.breachResponse.tooling = normaliseStringArray(merged.breachResponse.tooling, { maxLength: 120 });
  merged.breachResponse.legalCounsel = toOptionalString(merged.breachResponse.legalCounsel, { maxLength: 255 });
  merged.breachResponse.communicationsContact = toOptionalString(
    merged.breachResponse.communicationsContact,
    { maxLength: 255 },
  );

  merged.consentFramework.marketingOptInDefault = toBoolean(merged.consentFramework.marketingOptInDefault, false);
  merged.consentFramework.cookieBannerEnabled = toBoolean(merged.consentFramework.cookieBannerEnabled, true);
  merged.consentFramework.cookieRefreshMonths = toInteger(merged.consentFramework.cookieRefreshMonths, 12, {
    min: 1,
    max: 36,
  });
  merged.consentFramework.consentLogRetentionDays = toInteger(
    merged.consentFramework.consentLogRetentionDays,
    1095,
    { min: 30, max: 3650 },
  );
  merged.consentFramework.withdrawalChannels = normaliseStringArray(
    merged.consentFramework.withdrawalChannels,
    { maxLength: 120 },
  );
  merged.consentFramework.guardianContactEmail = toOptionalString(
    merged.consentFramework.guardianContactEmail,
    { maxLength: 255 },
  );
  merged.consentFramework.cookiePolicyUrl = toOptionalString(
    merged.consentFramework.cookiePolicyUrl,
    { maxLength: 2048 },
  );
  merged.consentFramework.preferenceCenterUrl = toOptionalString(
    merged.consentFramework.preferenceCenterUrl,
    { maxLength: 2048 },
  );

  return merged;
}

export async function getGdprSettings() {
  const record = await PlatformSetting.findOne({ where: { key: SETTINGS_KEY } });
  if (!record) {
    return { ...DEFAULT_SETTINGS, updatedAt: null };
  }
  const value = record.value ?? {};
  const merged = mergeSettings(value);
  return { ...merged, updatedAt: record.updatedAt?.toISOString?.() ?? null };
}

export async function updateGdprSettings(payload = {}) {
  const nextSettings = mergeSettings(payload);
  const [record] = await PlatformSetting.findOrCreate({
    where: { key: SETTINGS_KEY },
    defaults: { value: DEFAULT_SETTINGS },
  });
  record.value = { ...nextSettings, updatedAt: undefined };
  await record.save();
  return { ...nextSettings, updatedAt: record.updatedAt?.toISOString?.() ?? new Date().toISOString() };
}

export default {
  getGdprSettings,
  updateGdprSettings,
};
