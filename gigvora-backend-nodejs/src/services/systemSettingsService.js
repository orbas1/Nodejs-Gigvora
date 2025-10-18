import { SystemSetting } from '../models/systemSetting.js';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

const SETTINGS_KEY = 'core';

function coerceBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(lowered)) {
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

function coerceNumber(value, fallback, { min, max, precision, integer } = {}) {
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
  if (integer) {
    candidate = Math.trunc(candidate);
  }
  if (typeof precision === 'number' && precision >= 0) {
    const multiplier = 10 ** precision;
    candidate = Math.round(candidate * multiplier) / multiplier;
  }
  return candidate;
}

function coerceString(value, fallback = '') {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return fallback;
}

function sanitizeStringArray(values, { maxItems = 50, transform } = {}) {
  if (!Array.isArray(values)) {
    return [];
  }
  const collected = [];
  values.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const transformed = typeof transform === 'function' ? transform(trimmed) : trimmed;
    collected.push(transformed);
  });
  const unique = Array.from(new Set(collected));
  if (unique.length > maxItems) {
    return unique.slice(0, maxItems);
  }
  return unique;
}

function sanitizeDateTime(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

function generateIdentifier(prefix) {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}-${timestamp}-${random}`;
}

const DEFAULT_SETTINGS = Object.freeze({
  general: {
    appName: 'GigVora',
    companyName: 'Gigvora Ltd',
    supportEmail: 'support@gigvora.com',
    supportPhone: '',
    legalEntity: 'Gigvora Ltd',
    timezone: 'UTC',
    defaultLocale: 'en-US',
    logoUrl: '',
    incidentContact: 'ops@gigvora.com',
    allowedDomains: [],
  },
  security: {
    requireTwoFactor: true,
    passwordMinimumLength: 12,
    passwordRequireSymbols: true,
    passwordRotationDays: 90,
    sessionTimeoutMinutes: 60,
    allowedIpRanges: [],
    auditLogRetentionDays: 365,
    sso: {
      enabled: false,
      provider: 'okta',
      entityId: '',
      entryPoint: '',
      certificate: '',
    },
  },
  notifications: {
    emailProvider: 'resend',
    emailFromName: 'GigVora',
    emailFromAddress: 'no-reply@gigvora.com',
    smsProvider: 'twilio',
    smsFromNumber: '',
    incidentWebhookUrl: '',
    broadcastChannels: ['email', 'push'],
  },
  storage: {
    provider: 'cloudflare_r2',
    bucket: '',
    region: '',
    assetCdnUrl: '',
    assetMaxSizeMb: 50,
    backupRetentionDays: 30,
    encryptionKeyAlias: '',
  },
  integrations: {
    slackWebhookUrl: '',
    pagerdutyIntegrationKey: '',
    segmentWriteKey: '',
    mixpanelToken: '',
    statusPageUrl: '',
  },
  maintenance: {
    autoBroadcast: true,
    statusPageUrl: '',
    supportChannel: 'ops@gigvora.com',
    upcomingWindows: [],
  },
  updatedAt: null,
});

function normaliseGeneral(input = {}) {
  return {
    appName: coerceString(input.appName, DEFAULT_SETTINGS.general.appName),
    companyName: coerceString(input.companyName, DEFAULT_SETTINGS.general.companyName),
    supportEmail: coerceString(input.supportEmail, DEFAULT_SETTINGS.general.supportEmail).toLowerCase(),
    supportPhone: coerceString(input.supportPhone, DEFAULT_SETTINGS.general.supportPhone),
    legalEntity: coerceString(input.legalEntity, DEFAULT_SETTINGS.general.legalEntity),
    timezone: coerceString(input.timezone, DEFAULT_SETTINGS.general.timezone),
    defaultLocale: coerceString(input.defaultLocale, DEFAULT_SETTINGS.general.defaultLocale),
    logoUrl: coerceString(input.logoUrl, DEFAULT_SETTINGS.general.logoUrl),
    incidentContact: coerceString(input.incidentContact, DEFAULT_SETTINGS.general.incidentContact),
    allowedDomains: sanitizeStringArray(input.allowedDomains, {
      transform: (value) => value.toLowerCase(),
      maxItems: 100,
    }),
  };
}

function normaliseSecurity(input = {}) {
  const allowedIpRanges = sanitizeStringArray(input.allowedIpRanges, { maxItems: 120 });
  const rotationDays = coerceNumber(input.passwordRotationDays, DEFAULT_SETTINGS.security.passwordRotationDays, {
    min: 0,
    max: 365,
    integer: true,
  });

  if (rotationDays === 0 && coerceBoolean(input.requireTwoFactor, DEFAULT_SETTINGS.security.requireTwoFactor)) {
    throw new ValidationError('Password rotation can only be disabled if two-factor authentication is optional.');
  }

  const sessionTimeoutMinutes = coerceNumber(
    input.sessionTimeoutMinutes,
    DEFAULT_SETTINGS.security.sessionTimeoutMinutes,
    { min: 5, max: 1440, integer: true },
  );

  const ssoInput = input.sso ?? {};
  const ssoEnabled = coerceBoolean(ssoInput.enabled, DEFAULT_SETTINGS.security.sso.enabled);
  return {
    requireTwoFactor: coerceBoolean(input.requireTwoFactor, DEFAULT_SETTINGS.security.requireTwoFactor),
    passwordMinimumLength: coerceNumber(
      input.passwordMinimumLength,
      DEFAULT_SETTINGS.security.passwordMinimumLength,
      { min: 6, max: 128, integer: true },
    ),
    passwordRequireSymbols: coerceBoolean(
      input.passwordRequireSymbols,
      DEFAULT_SETTINGS.security.passwordRequireSymbols,
    ),
    passwordRotationDays: rotationDays,
    sessionTimeoutMinutes,
    allowedIpRanges,
    auditLogRetentionDays: coerceNumber(input.auditLogRetentionDays, DEFAULT_SETTINGS.security.auditLogRetentionDays, {
      min: 30,
      max: 3650,
      integer: true,
    }),
    sso: {
      enabled: ssoEnabled,
      provider: coerceString(ssoInput.provider, DEFAULT_SETTINGS.security.sso.provider).toLowerCase(),
      entityId: coerceString(ssoInput.entityId, DEFAULT_SETTINGS.security.sso.entityId),
      entryPoint: coerceString(ssoInput.entryPoint, DEFAULT_SETTINGS.security.sso.entryPoint),
      certificate: coerceString(ssoInput.certificate, DEFAULT_SETTINGS.security.sso.certificate),
    },
  };
}

function normaliseNotifications(input = {}) {
  return {
    emailProvider: coerceString(input.emailProvider, DEFAULT_SETTINGS.notifications.emailProvider).toLowerCase(),
    emailFromName: coerceString(input.emailFromName, DEFAULT_SETTINGS.notifications.emailFromName),
    emailFromAddress: coerceString(input.emailFromAddress, DEFAULT_SETTINGS.notifications.emailFromAddress).toLowerCase(),
    smsProvider: coerceString(input.smsProvider, DEFAULT_SETTINGS.notifications.smsProvider).toLowerCase(),
    smsFromNumber: coerceString(input.smsFromNumber, DEFAULT_SETTINGS.notifications.smsFromNumber),
    incidentWebhookUrl: coerceString(input.incidentWebhookUrl, DEFAULT_SETTINGS.notifications.incidentWebhookUrl),
    broadcastChannels: sanitizeStringArray(input.broadcastChannels, {
      maxItems: 20,
      transform: (value) => value.toLowerCase(),
    }),
  };
}

function normaliseStorage(input = {}) {
  return {
    provider: coerceString(input.provider, DEFAULT_SETTINGS.storage.provider).toLowerCase(),
    bucket: coerceString(input.bucket, DEFAULT_SETTINGS.storage.bucket),
    region: coerceString(input.region, DEFAULT_SETTINGS.storage.region),
    assetCdnUrl: coerceString(input.assetCdnUrl, DEFAULT_SETTINGS.storage.assetCdnUrl),
    assetMaxSizeMb: coerceNumber(input.assetMaxSizeMb, DEFAULT_SETTINGS.storage.assetMaxSizeMb, {
      min: 1,
      max: 2048,
      integer: true,
    }),
    backupRetentionDays: coerceNumber(input.backupRetentionDays, DEFAULT_SETTINGS.storage.backupRetentionDays, {
      min: 7,
      max: 3650,
      integer: true,
    }),
    encryptionKeyAlias: coerceString(input.encryptionKeyAlias, DEFAULT_SETTINGS.storage.encryptionKeyAlias),
  };
}

function normaliseIntegrations(input = {}) {
  return {
    slackWebhookUrl: coerceString(input.slackWebhookUrl, DEFAULT_SETTINGS.integrations.slackWebhookUrl),
    pagerdutyIntegrationKey: coerceString(
      input.pagerdutyIntegrationKey,
      DEFAULT_SETTINGS.integrations.pagerdutyIntegrationKey,
    ),
    segmentWriteKey: coerceString(input.segmentWriteKey, DEFAULT_SETTINGS.integrations.segmentWriteKey),
    mixpanelToken: coerceString(input.mixpanelToken, DEFAULT_SETTINGS.integrations.mixpanelToken),
    statusPageUrl: coerceString(input.statusPageUrl, DEFAULT_SETTINGS.integrations.statusPageUrl),
  };
}

function normaliseMaintenanceWindows(windows = []) {
  if (!Array.isArray(windows)) {
    return [];
  }
  const sanitized = windows
    .map((window, index) => {
      if (!window || typeof window !== 'object') {
        return null;
      }
      const title = coerceString(window.title);
      if (!title) {
        return null;
      }
      const startAt = sanitizeDateTime(window.startAt);
      const endAt = sanitizeDateTime(window.endAt);
      if (!startAt || !endAt) {
        return null;
      }
      const id = coerceString(window.id, generateIdentifier('maintenance'));
      return {
        id: id || generateIdentifier(`maintenance-${index + 1}`),
        title,
        startAt,
        endAt,
        impact: coerceString(window.impact),
        description: coerceString(window.description),
      };
    })
    .filter(Boolean);

  sanitized.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return sanitized.slice(0, 25);
}

function normaliseMaintenance(input = {}) {
  const autoBroadcast = coerceBoolean(input.autoBroadcast, DEFAULT_SETTINGS.maintenance.autoBroadcast);
  return {
    autoBroadcast,
    statusPageUrl: coerceString(input.statusPageUrl, DEFAULT_SETTINGS.maintenance.statusPageUrl),
    supportChannel: coerceString(input.supportChannel, DEFAULT_SETTINGS.maintenance.supportChannel),
    upcomingWindows: normaliseMaintenanceWindows(input.upcomingWindows ?? input.maintenanceWindows),
  };
}

function normaliseSystemSettings(raw = {}) {
  const general = normaliseGeneral(raw.general ?? {});
  const security = normaliseSecurity(raw.security ?? {});
  const notifications = normaliseNotifications(raw.notifications ?? {});
  const storage = normaliseStorage(raw.storage ?? {});
  const integrations = normaliseIntegrations(raw.integrations ?? {});
  const maintenance = normaliseMaintenance(raw.maintenance ?? {});

  return {
    general,
    security,
    notifications,
    storage,
    integrations,
    maintenance,
  };
}

export async function getSystemSettings() {
  const record = await SystemSetting.findOne({ where: { key: SETTINGS_KEY } });
  if (!record) {
    return { ...DEFAULT_SETTINGS, updatedAt: null };
  }
  const value = record.value ?? {};
  const normalised = normaliseSystemSettings(value);
  return {
    ...DEFAULT_SETTINGS,
    ...normalised,
    updatedAt: record.updatedAt?.toISOString?.() ?? null,
  };
}

export async function updateSystemSettings(payload = {}) {
  const normalized = normaliseSystemSettings(payload);
  const [record] = await SystemSetting.findOrCreate({
    where: { key: SETTINGS_KEY },
    defaults: { value: DEFAULT_SETTINGS, category: 'global' },
  });
  record.value = normalized;
  await record.save();

  logger.info({ event: 'system_settings.updated', keys: Object.keys(normalized) }, 'System settings updated');

  return {
    ...DEFAULT_SETTINGS,
    ...normalized,
    updatedAt: record.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export default {
  getSystemSettings,
  updateSystemSettings,
};
