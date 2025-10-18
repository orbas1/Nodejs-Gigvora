import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import {
  ApiProvider,
  ApiClient,
  ApiClientKey,
  ApiClientAuditEvent,
  ApiClientUsageMetric,
} from '../models/apiIntegrationModels.js';
import sequelize from '../models/sequelizeClient.js';
import { WalletAccount, User, Profile } from '../models/index.js';
import { recordWalletLedgerEntry } from './complianceService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const SECRET_BYTE_LENGTH = 32;
const WEBHOOK_SECRET_LENGTH = 24;
const DEFAULT_USAGE_WINDOW_DAYS = 30;
const DEFAULT_CURRENCY = 'USD';

function slugify(value, fallback = 'api-client') {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, 160) || fallback
  );
}

function normaliseEmail(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed.toLowerCase() : null;
}

function normaliseOptionalUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function coerceStringArray(values) {
  if (!Array.isArray(values)) {
    if (typeof values === 'string') {
      const segments = values
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      return Array.from(new Set(segments));
    }
    return [];
  }
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0),
    ),
  );
}

function buildSecret(byteLength = SECRET_BYTE_LENGTH) {
  return crypto.randomBytes(byteLength).toString('base64url');
}

function buildWebhookSecret() {
  return `wh_${crypto.randomBytes(WEBHOOK_SECRET_LENGTH).toString('hex')}`.slice(0, 64);
}

function extractLastFour(secret) {
  if (typeof secret !== 'string') return null;
  const sanitized = secret.replace(/\s+/g, '');
  return sanitized.slice(-4) || sanitized;
}

function parseCurrencyToCents(value, fieldName = 'amount') {
  if (value == null || value === '') {
    return null;
  }

  const numeric = typeof value === 'number' ? value : Number.parseFloat(`${value}`.replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ValidationError(`${fieldName} must be zero or greater.`);
  }

  return Math.round(numeric * 100);
}

function resolveCallPriceCents(payload = {}, { required = false } = {}) {
  const { callPriceCents, callPrice } = payload ?? {};
  const centsCandidate = parseCurrencyToCents(callPriceCents, 'callPriceCents');
  if (centsCandidate != null) {
    return centsCandidate;
  }

  const priceCandidate = parseCurrencyToCents(callPrice, 'callPrice');
  if (priceCandidate != null) {
    return priceCandidate;
  }

  if (required) {
    throw new ValidationError('Call price is required.');
  }

  return null;
}

function centsToDecimal(cents) {
  const numeric = Number(cents ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric) / 100;
}

function buildWalletAccountSummary(account) {
  if (!account) {
    return null;
  }

  const plain = account.get({ plain: true });
  const ownerName = plain.user
    ? [plain.user.firstName, plain.user.lastName].filter(Boolean).join(' ')
    : null;
  const labelParts = [];
  if (ownerName) {
    labelParts.push(ownerName);
  }
  if (plain.profile?.headline) {
    labelParts.push(plain.profile.headline);
  }
  labelParts.push(`Acct ${plain.id}`);

  return {
    id: plain.id,
    accountType: plain.accountType,
    currencyCode: plain.currencyCode ?? DEFAULT_CURRENCY,
    availableBalance: Number.parseFloat(plain.availableBalance ?? plain.currentBalance ?? 0),
    label: labelParts.filter(Boolean).join(' • '),
  };
}

async function recordAuditEvent(clientId, eventType, description, actor, metadata = {}) {
  try {
    await ApiClientAuditEvent.create({
      clientId,
      eventType,
      description,
      actor,
      metadata,
    });
  } catch (error) {
    logger.warn({ error }, 'Failed to persist API client audit event');
  }
}

function summariseUsage(metrics = []) {
  const summary = {
    requestCount: 0,
    errorCount: 0,
    peakLatencyMs: null,
    avgLatencyMs: null,
    lastRequestAt: null,
    billableRequestCount: 0,
    billedAmountCents: 0,
  };

  if (!metrics.length) {
    return summary;
  }

  let weightedLatency = 0;
  let totalRequests = 0;

  metrics.forEach((metric) => {
    const requests = Number(metric.requestCount ?? 0);
    const errors = Number(metric.errorCount ?? 0);
    summary.requestCount += Number.isFinite(requests) ? requests : 0;
    summary.errorCount += Number.isFinite(errors) ? errors : 0;

    const avgLatency = Number(metric.avgLatencyMs ?? 0);
    if (Number.isFinite(avgLatency) && requests > 0) {
      weightedLatency += avgLatency * requests;
      totalRequests += requests;
    }

    const peakLatency = Number(metric.peakLatencyMs ?? 0);
    if (Number.isFinite(peakLatency)) {
      summary.peakLatencyMs = Math.max(summary.peakLatencyMs ?? 0, peakLatency);
    }

    if (metric.lastRequestAt) {
      const candidateDate = new Date(metric.lastRequestAt);
      if (!Number.isNaN(candidateDate.getTime())) {
        if (!summary.lastRequestAt || candidateDate > new Date(summary.lastRequestAt)) {
          summary.lastRequestAt = candidateDate.toISOString();
        }
      }
    }

    const billedRequests = Number(metric.billableRequestCount ?? 0);
    if (Number.isFinite(billedRequests) && billedRequests > 0) {
      summary.billableRequestCount += billedRequests;
    }

    const billedCents = Number(metric.billedAmountCents ?? 0);
    if (Number.isFinite(billedCents) && billedCents > 0) {
      summary.billedAmountCents += billedCents;
    }
  });

  if (totalRequests > 0) {
    summary.avgLatencyMs = Math.round(weightedLatency / totalRequests);
  }

  summary.unbilledRequestCount = Math.max(0, summary.requestCount - summary.billableRequestCount);

  return summary;
}

function buildProviderSummary(provider) {
  const clients = Array.isArray(provider.clients) ? provider.clients : [];
  const activeClients = clients.filter((client) => client.status === 'active');
  const suspendedClients = clients.filter((client) => client.status === 'suspended');

  const usageTotals = clients.reduce(
    (totals, client) => {
      const usage = summariseUsage(client.usage || client.usageMetrics || []);
      totals.requestCount += usage.requestCount;
      totals.errorCount += usage.errorCount;
      totals.billableRequestCount += usage.billableRequestCount ?? 0;
      totals.unbilledRequestCount += usage.unbilledRequestCount ?? 0;
      totals.billedAmountCents += usage.billedAmountCents ?? 0;
      totals.peakLatencyMs = Math.max(totals.peakLatencyMs ?? 0, usage.peakLatencyMs ?? 0);
      if (usage.avgLatencyMs != null) {
        totals.latencySamples.push(usage.avgLatencyMs);
      }
      return totals;
    },
    {
      requestCount: 0,
      errorCount: 0,
      billableRequestCount: 0,
      unbilledRequestCount: 0,
      billedAmountCents: 0,
      peakLatencyMs: null,
      latencySamples: [],
    },
  );

  return {
    activeClients: activeClients.length,
    suspendedClients: suspendedClients.length,
    requestCount30d: usageTotals.requestCount,
    errorCount30d: usageTotals.errorCount,
    billedAmountCents30d: usageTotals.billedAmountCents,
    billableRequestCount30d: usageTotals.billableRequestCount,
    unbilledRequestCount30d: usageTotals.unbilledRequestCount,
    avgLatencyMs30d:
      usageTotals.latencySamples.length
        ? Math.round(
            usageTotals.latencySamples.reduce((sum, value) => sum + value, 0) /
              usageTotals.latencySamples.length,
          )
        : null,
    peakLatencyMs30d: usageTotals.peakLatencyMs,
  };
}

export async function getApiRegistry({ usageWindowDays = DEFAULT_USAGE_WINDOW_DAYS } = {}) {
  const sinceDate = new Date();
  sinceDate.setUTCDate(sinceDate.getUTCDate() - Math.max(1, usageWindowDays));
  const whereUsage = { metricDate: { [Op.gte]: sinceDate.toISOString().slice(0, 10) } };

  const providers = await ApiProvider.findAll({
    include: [
      {
        model: ApiClient,
        as: 'clients',
        include: [
          { model: ApiClientKey, as: 'keys', separate: true, order: [['createdAt', 'DESC']] },
          {
            model: ApiClientUsageMetric,
            as: 'usageMetrics',
            where: whereUsage,
            required: false,
            order: [['metricDate', 'DESC']],
          },
        ],
        order: [['name', 'ASC']],
      },
    ],
    order: [['name', 'ASC']],
  });

  const walletAccountIds = new Set();
  const providerSummaries = providers.map((provider) => {
    const json = provider.toPublicObject();
    json.summary = buildProviderSummary(json);
    const providerCallPriceCents = Number(json.callPriceCents ?? 0);
    if (Array.isArray(json.clients)) {
      json.clients = json.clients.map((client) => {
        const usageMetrics = client.usage || client.usageMetrics || [];
        const summary = summariseUsage(usageMetrics);
        const clientCallPriceCents = Number.isFinite(client.callPriceCents)
          ? Number(client.callPriceCents)
          : null;
        const effectiveCallPriceCents = Number.isFinite(clientCallPriceCents)
          ? clientCallPriceCents
          : providerCallPriceCents;
        if (client.walletAccountId) {
          walletAccountIds.add(client.walletAccountId);
        }
        return {
          ...client,
          usageSummary: {
            ...summary,
            currencyCode: DEFAULT_CURRENCY,
          },
          billing: {
            walletAccountId: client.walletAccountId ?? null,
            callPriceCents: clientCallPriceCents,
            providerCallPriceCents,
            effectiveCallPriceCents,
            unbilledAmountCents: summary.unbilledRequestCount * effectiveCallPriceCents,
            currencyCode: DEFAULT_CURRENCY,
          },
        };
      });
    }
    return json;
  });

  let walletAccountLookup = new Map();
  if (walletAccountIds.size > 0) {
    const walletAccounts = await WalletAccount.findAll({
      where: { id: Array.from(walletAccountIds) },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Profile, as: 'profile', attributes: ['id', 'headline'] },
      ],
    });
    walletAccountLookup = new Map(
      walletAccounts.map((account) => [account.id, buildWalletAccountSummary(account)]),
    );
  }

  providerSummaries.forEach((provider) => {
    if (!Array.isArray(provider.clients)) {
      return;
    }
    provider.clients = provider.clients.map((client) => {
      if (client.billing) {
        client.billing.walletAccount = client.billing.walletAccountId
          ? walletAccountLookup.get(client.billing.walletAccountId) ?? null
          : null;
      }
      return client;
    });
  });

  const totals = providerSummaries.reduce(
    (accumulator, provider) => {
      const summary = provider.summary ?? {};
      accumulator.providers += 1;
      accumulator.activeClients += summary.activeClients ?? 0;
      accumulator.suspendedClients += summary.suspendedClients ?? 0;
      accumulator.requestCount += summary.requestCount30d ?? 0;
      accumulator.errorCount += summary.errorCount30d ?? 0;
      accumulator.billableRequestCount += summary.billableRequestCount30d ?? 0;
      accumulator.unbilledRequestCount += summary.unbilledRequestCount30d ?? 0;
      accumulator.revenueCents += summary.billedAmountCents30d ?? 0;
      if (summary.peakLatencyMs30d != null) {
        accumulator.peakLatencyMs = Math.max(
          accumulator.peakLatencyMs ?? 0,
          summary.peakLatencyMs30d ?? 0,
        );
      }
      if (summary.avgLatencyMs30d != null) {
        accumulator.latencySamples.push(summary.avgLatencyMs30d);
      }
      return accumulator;
    },
    {
      providers: 0,
      activeClients: 0,
      suspendedClients: 0,
      requestCount: 0,
      errorCount: 0,
      billableRequestCount: 0,
      unbilledRequestCount: 0,
      revenueCents: 0,
      peakLatencyMs: null,
      latencySamples: [],
    },
  );

  const averageLatency = totals.latencySamples.length
    ? Math.round(totals.latencySamples.reduce((sum, value) => sum + value, 0) / totals.latencySamples.length)
    : null;

  return {
    providers: providerSummaries,
    summary: {
      providerCount: totals.providers,
      activeClientCount: totals.activeClients,
      suspendedClientCount: totals.suspendedClients,
      requestsLast30Days: totals.requestCount,
      errorRateLast30Days:
        totals.requestCount > 0 ? (totals.errorCount / totals.requestCount) * 100 : 0,
      avgLatencyMsLast30Days: averageLatency,
      peakLatencyMsLast30Days: totals.peakLatencyMs,
      billableRequestCountLast30Days: totals.billableRequestCount,
      unbilledRequestCountLast30Days: totals.unbilledRequestCount,
      revenueLast30DaysCents: totals.revenueCents,
    },
  };
}

export async function createApiProvider(payload = {}, actor = null) {
  const name = `${payload.name ?? ''}`.trim();
  if (!name) {
    throw new ValidationError('Provider name is required.');
  }
  const slug = slugify(payload.slug ?? name, `provider-${crypto.randomUUID().slice(0, 8)}`);

  const existing = await ApiProvider.findOne({ where: { slug } });
  if (existing) {
    throw new ValidationError('A provider with this slug already exists.');
  }

  const callPriceCents = resolveCallPriceCents(payload) ?? 0;
  const provider = await ApiProvider.create({
    name,
    slug,
    status: payload.status ?? 'active',
    baseUrl: normaliseOptionalUrl(payload.baseUrl),
    sandboxBaseUrl: normaliseOptionalUrl(payload.sandboxBaseUrl),
    docsUrl: normaliseOptionalUrl(payload.docsUrl),
    iconUrl: normaliseOptionalUrl(payload.iconUrl),
    description: payload.description ?? null,
    contactEmail: normaliseEmail(payload.contactEmail),
    callPriceCents,
    metadata: payload.metadata ?? {},
  });

  return provider.toPublicObject({ includeClients: false });
}

export async function updateApiProvider(providerId, payload = {}, actor = null) {
  const provider = await ApiProvider.findByPk(providerId);
  if (!provider) {
    throw new NotFoundError('Provider not found.');
  }

  const updates = {};
  if (payload.name) {
    updates.name = `${payload.name}`.trim();
  }
  if (payload.slug) {
    const candidate = slugify(payload.slug, provider.slug);
    if (candidate !== provider.slug) {
      const existing = await ApiProvider.findOne({ where: { slug: candidate, id: { [Op.ne]: provider.id } } });
      if (existing) {
        throw new ValidationError('Another provider already uses this slug.');
      }
      updates.slug = candidate;
    }
  }
  if (payload.status) {
    updates.status = payload.status;
  }
  const updatedCallPriceCents = resolveCallPriceCents(payload);
  if (updatedCallPriceCents != null) {
    updates.callPriceCents = updatedCallPriceCents;
  }
  updates.baseUrl = normaliseOptionalUrl(payload.baseUrl);
  updates.sandboxBaseUrl = normaliseOptionalUrl(payload.sandboxBaseUrl);
  updates.docsUrl = normaliseOptionalUrl(payload.docsUrl);
  updates.iconUrl = normaliseOptionalUrl(payload.iconUrl);
  updates.description = payload.description ?? null;
  updates.contactEmail = normaliseEmail(payload.contactEmail);
  if (payload.metadata != null) {
    updates.metadata = payload.metadata;
  }

  await provider.update(updates);
  return provider.toPublicObject({ includeClients: false });
}

export async function createApiClient(payload = {}, actor = null) {
  const providerId = payload.providerId;
  if (!providerId) {
    throw new ValidationError('Provider is required.');
  }
  const provider = await ApiProvider.findByPk(providerId);
  if (!provider) {
    throw new ValidationError('Provider does not exist.');
  }

  const name = `${payload.name ?? ''}`.trim();
  if (!name) {
    throw new ValidationError('Client name is required.');
  }

  const slug = slugify(payload.slug ?? name, `client-${crypto.randomUUID().slice(0, 8)}`);
  const existing = await ApiClient.findOne({ where: { slug } });
  if (existing) {
    throw new ValidationError('A client with this slug already exists.');
  }

  const secret = buildSecret();
  const secretHash = await bcrypt.hash(secret, 12);
  const secretLastFour = extractLastFour(secret);

  const webhookSecret = buildWebhookSecret();
  const webhookSecretHash = await bcrypt.hash(webhookSecret, 12);

  let walletAccountId = null;
  if (payload.walletAccountId != null && payload.walletAccountId !== '') {
    const walletAccount = await WalletAccount.findByPk(payload.walletAccountId);
    if (!walletAccount) {
      throw new ValidationError('Wallet account not found.');
    }
    walletAccountId = walletAccount.id;
  }

  const clientCallPriceCents = resolveCallPriceCents(payload);
  const transaction = await sequelize.transaction();
  try {
    const client = await ApiClient.create(
      {
        providerId: provider.id,
        name,
        slug,
        description: payload.description ?? null,
        contactEmail: normaliseEmail(payload.contactEmail),
        status: payload.status ?? 'active',
        accessLevel: payload.accessLevel ?? 'read',
        rateLimitPerMinute: payload.rateLimitPerMinute ?? null,
        ipAllowList: coerceStringArray(payload.ipAllowList),
        scopes: coerceStringArray(payload.scopes),
        webhookUrl: normaliseOptionalUrl(payload.webhookUrl),
        webhookSecretHash,
        webhookSecretLastFour: extractLastFour(webhookSecret),
        walletAccountId,
        callPriceCents: clientCallPriceCents,
        metadata: payload.metadata ?? {},
        createdBy: actor ?? null,
      },
      { transaction },
    );

    await ApiClientKey.create(
      {
        clientId: client.id,
        label: payload.keyLabel ?? 'Primary key',
        secretHash,
        secretLastFour,
        createdBy: actor ?? null,
      },
      { transaction },
    );

    await client.reload({
      include: [{ model: ApiClientKey, as: 'keys', order: [['createdAt', 'DESC']] }],
      transaction,
    });

    await transaction.commit();

    await recordAuditEvent(client.id, 'client_created', `Client ${client.name} created`, actor);

    return {
      client: client.toPublicObject({ includeKeys: true }),
      credentials: {
        apiKey: secret,
        webhookSecret,
      },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateApiClient(clientId, payload = {}, actor = null) {
  const client = await ApiClient.findByPk(clientId);
  if (!client) {
    throw new NotFoundError('Client not found.');
  }

  const updates = {};
  if (payload.name) {
    updates.name = `${payload.name}`.trim();
  }
  if (payload.slug) {
    const candidate = slugify(payload.slug, client.slug);
    if (candidate !== client.slug) {
      const existing = await ApiClient.findOne({ where: { slug: candidate, id: { [Op.ne]: client.id } } });
      if (existing) {
        throw new ValidationError('Another client already uses this slug.');
      }
      updates.slug = candidate;
    }
  }
  if (payload.status) {
    updates.status = payload.status;
  }
  if (payload.accessLevel) {
    updates.accessLevel = payload.accessLevel;
  }
  if (payload.providerId && payload.providerId !== client.providerId) {
    const provider = await ApiProvider.findByPk(payload.providerId);
    if (!provider) {
      throw new ValidationError('Target provider not found.');
    }
    updates.providerId = provider.id;
  }
  if (payload.rateLimitPerMinute != null) {
    const value = Number(payload.rateLimitPerMinute);
    if (!Number.isFinite(value) || value < 0) {
      throw new ValidationError('Rate limit must be a positive number.');
    }
    updates.rateLimitPerMinute = Math.round(value);
  }
  updates.description = payload.description ?? null;
  updates.contactEmail = normaliseEmail(payload.contactEmail);
  updates.ipAllowList = coerceStringArray(payload.ipAllowList);
  updates.scopes = coerceStringArray(payload.scopes);
  updates.webhookUrl = normaliseOptionalUrl(payload.webhookUrl);
  if (payload.metadata != null) {
    updates.metadata = payload.metadata;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'walletAccountId')) {
    if (payload.walletAccountId == null || payload.walletAccountId === '') {
      updates.walletAccountId = null;
    } else {
      const walletAccount = await WalletAccount.findByPk(payload.walletAccountId);
      if (!walletAccount) {
        throw new ValidationError('Wallet account not found.');
      }
      updates.walletAccountId = walletAccount.id;
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(payload, 'callPrice') ||
    Object.prototype.hasOwnProperty.call(payload, 'callPriceCents')
  ) {
    updates.callPriceCents = resolveCallPriceCents(payload);
  }

  await client.update(updates);
  await client.reload({
    include: [{ model: ApiClientKey, as: 'keys', order: [['createdAt', 'DESC']] }],
  });
  await recordAuditEvent(client.id, 'client_updated', `Client ${client.name} updated`, actor, updates);

  return client.toPublicObject({ includeKeys: true });
}

export async function createApiClientKey(clientId, payload = {}, actor = null) {
  const client = await ApiClient.findByPk(clientId);
  if (!client) {
    throw new NotFoundError('Client not found.');
  }

  const secret = buildSecret();
  const secretHash = await bcrypt.hash(secret, 12);
  const secretLastFour = extractLastFour(secret);
  const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;

  const key = await ApiClientKey.create({
    clientId: client.id,
    label: payload.label ?? 'API key',
    secretHash,
    secretLastFour,
    createdBy: actor ?? null,
    expiresAt: Number.isNaN(expiresAt?.getTime()) ? null : expiresAt,
    metadata: payload.metadata ?? {},
  });

  await recordAuditEvent(client.id, 'key_created', `Key ${key.id} issued`, actor, {
    label: key.label,
    expiresAt: key.expiresAt,
  });

  return {
    key: key.toPublicObject(),
    plaintextKey: secret,
  };
}

export async function revokeApiClientKey(clientId, keyId, actor = null) {
  const key = await ApiClientKey.findOne({ where: { id: keyId, clientId } });
  if (!key) {
    throw new NotFoundError('API key not found.');
  }

  if (key.revokedAt) {
    return key.toPublicObject();
  }

  await key.update({ revokedAt: new Date() });
  await recordAuditEvent(clientId, 'key_revoked', `Key ${key.id} revoked`, actor);

  return key.toPublicObject();
}

export async function rotateWebhookSecret(clientId, actor = null) {
  const client = await ApiClient.findByPk(clientId);
  if (!client) {
    throw new NotFoundError('Client not found.');
  }

  const webhookSecret = buildWebhookSecret();
  const webhookSecretHash = await bcrypt.hash(webhookSecret, 12);
  const webhookSecretLastFour = extractLastFour(webhookSecret);

  await client.update({ webhookSecretHash, webhookSecretLastFour });
  await client.reload({
    include: [{ model: ApiClientKey, as: 'keys', order: [['createdAt', 'DESC']] }],
  });
  await recordAuditEvent(client.id, 'webhook_rotated', 'Webhook secret rotated', actor);

  return {
    client: client.toPublicObject({ includeKeys: true }),
    webhookSecret,
  };
}

export async function getClientAuditEvents(clientId, { limit = 50 } = {}) {
  const events = await ApiClientAuditEvent.findAll({
    where: { clientId },
    order: [['createdAt', 'DESC']],
    limit: Math.max(1, Math.min(200, limit)),
  });
  return events.map((event) => event.toPublicObject());
}

export async function listWalletAccounts({ query, limit = 20 } = {}) {
  const sanitizedQuery = typeof query === 'string' ? query.trim() : '';
  const filters = [];
  if (sanitizedQuery) {
    const numericId = Number.parseInt(sanitizedQuery, 10);
    if (Number.isInteger(numericId)) {
      filters.push({ id: numericId });
    }
    const likeOperator = Op.iLike ?? Op.like;
    const pattern = `%${sanitizedQuery}%`;
    filters.push(
      { '$user.email$': { [likeOperator]: pattern } },
      { '$user.firstName$': { [likeOperator]: pattern } },
      { '$user.lastName$': { [likeOperator]: pattern } },
      { '$profile.headline$': { [likeOperator]: pattern } },
    );
  }

  const accounts = await WalletAccount.findAll({
    where: filters.length ? { [Op.or]: filters } : undefined,
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Profile, as: 'profile', attributes: ['id', 'headline'] },
    ],
    order: [['id', 'DESC']],
    limit: Math.max(1, Math.min(50, Number(limit) || 20)),
  });

  return accounts.map((account) => {
    const summary = buildWalletAccountSummary(account);
    return {
      ...summary,
      ownerEmail: account.user?.email ?? null,
    };
  });
}

export async function recordClientUsage(clientId, payload = {}, actor = null) {
  const client = await ApiClient.findByPk(clientId, {
    include: [{ model: ApiProvider, as: 'provider' }],
  });
  if (!client) {
    throw new NotFoundError('Client not found.');
  }

  const requestIncrement = Number(payload.requestCount ?? 0);
  if (!Number.isFinite(requestIncrement) || requestIncrement < 0) {
    throw new ValidationError('requestCount must be zero or greater.');
  }
  const errorIncrement = Number(payload.errorCount ?? 0);
  if (!Number.isFinite(errorIncrement) || errorIncrement < 0) {
    throw new ValidationError('errorCount must be zero or greater.');
  }

  const metricDateValue = payload.metricDate ? new Date(payload.metricDate) : new Date();
  if (Number.isNaN(metricDateValue.getTime())) {
    throw new ValidationError('metricDate must be a valid date.');
  }
  const metricDate = metricDateValue.toISOString().slice(0, 10);

  const avgLatency =
    payload.avgLatencyMs != null && payload.avgLatencyMs !== ''
      ? Math.max(0, Math.round(Number(payload.avgLatencyMs)))
      : null;
  const peakLatency =
    payload.peakLatencyMs != null && payload.peakLatencyMs !== ''
      ? Math.max(0, Math.round(Number(payload.peakLatencyMs)))
      : null;

  const lastRequestAt = payload.lastRequestAt ? new Date(payload.lastRequestAt) : null;
  if (lastRequestAt && Number.isNaN(lastRequestAt.getTime())) {
    throw new ValidationError('lastRequestAt must be a valid date.');
  }

  const overrideCallPriceCents = resolveCallPriceCents(payload);
  const effectiveCallPriceCents = Number.isFinite(overrideCallPriceCents)
    ? overrideCallPriceCents
    : Number.isFinite(client.callPriceCents)
      ? Number(client.callPriceCents)
      : Number(client.provider?.callPriceCents ?? 0);

  if (effectiveCallPriceCents > 0 && !client.walletAccountId) {
    throw new ValidationError('Assign a wallet account before billing usage.');
  }

  const transaction = await sequelize.transaction();
  try {
    const [usage] = await ApiClientUsageMetric.findOrCreate({
      where: { clientId: client.id, metricDate },
      defaults: {
        clientId: client.id,
        metricDate,
        requestCount: 0,
        errorCount: 0,
        avgLatencyMs: null,
        peakLatencyMs: null,
        lastRequestAt: lastRequestAt ?? null,
        billableRequestCount: 0,
        billedAmountCents: 0,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const nextValues = {
      requestCount: Math.max(0, Math.round(usage.requestCount ?? 0)) + Math.round(requestIncrement),
      errorCount: Math.max(0, Math.round(usage.errorCount ?? 0)) + Math.round(errorIncrement),
      billableRequestCount: Math.max(0, Math.round(usage.billableRequestCount ?? 0)),
      billedAmountCents: Math.max(0, Math.round(usage.billedAmountCents ?? 0)),
    };

    if (avgLatency != null) {
      nextValues.avgLatencyMs = avgLatency;
    }
    if (peakLatency != null) {
      nextValues.peakLatencyMs = peakLatency;
    }
    if (lastRequestAt) {
      const currentLast = usage.lastRequestAt ? new Date(usage.lastRequestAt) : null;
      if (!currentLast || lastRequestAt > currentLast) {
        nextValues.lastRequestAt = lastRequestAt;
      }
    }

    const totalRequests = nextValues.requestCount;
    const billedRequestsDelta = Math.max(0, totalRequests - nextValues.billableRequestCount);
    let billedAmountDeltaCents = 0;
    if (effectiveCallPriceCents > 0 && billedRequestsDelta > 0) {
      billedAmountDeltaCents = billedRequestsDelta * effectiveCallPriceCents;
      nextValues.billableRequestCount += billedRequestsDelta;
      nextValues.billedAmountCents += billedAmountDeltaCents;
    }

    await usage.update(nextValues, { transaction });

    if (lastRequestAt) {
      const existingLastUsed = client.lastUsedAt ? new Date(client.lastUsedAt) : null;
      if (!existingLastUsed || lastRequestAt > existingLastUsed) {
        await client.update({ lastUsedAt }, { transaction });
      }
    } else if (!client.lastUsedAt) {
      await client.update({ lastUsedAt: new Date() }, { transaction });
    }

    let ledgerEntry = null;
    if (billedAmountDeltaCents > 0) {
      ledgerEntry = await recordWalletLedgerEntry(
        client.walletAccountId,
        {
          entryType: 'debit',
          amount: centsToDecimal(billedAmountDeltaCents),
          currencyCode: DEFAULT_CURRENCY,
          reference: `api-usage-${client.id}-${metricDate}-${crypto.randomUUID().slice(0, 8)}`,
          description: `API usage ${client.name} ${metricDate}`,
          metadata: {
            apiClientId: client.id,
            apiProviderId: client.providerId,
            metricDate,
            requestsBilled: billedRequestsDelta,
            callPriceCents: effectiveCallPriceCents,
          },
        },
        { transaction },
      );
    }

    await transaction.commit();

    await recordAuditEvent(client.id, 'usage_recorded', `Usage recorded for ${metricDate}`, actor, {
      metricDate,
      requestCount: requestIncrement,
      billedRequests: billedRequestsDelta,
      billedAmountCents: billedAmountDeltaCents,
      callPriceCents: effectiveCallPriceCents,
    });

    const refreshed = await ApiClientUsageMetric.findByPk(usage.id);
    return {
      usage: refreshed ? refreshed.toPublicObject() : usage.toPublicObject(),
      billedRequests: billedRequestsDelta,
      billedAmountCents: billedAmountDeltaCents,
      effectiveCallPriceCents,
      ledgerEntryId: ledgerEntry?.id ?? null,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export default {
  getApiRegistry,
  createApiProvider,
  updateApiProvider,
  createApiClient,
  updateApiClient,
  createApiClientKey,
  revokeApiClientKey,
  rotateWebhookSecret,
  getClientAuditEvents,
  listWalletAccounts,
  recordClientUsage,
};
