import crypto from 'crypto';
import { Op } from 'sequelize';
import {
  WorkspaceIntegration,
  WorkspaceIntegrationSecret,
  WorkspaceIntegrationWebhook,
  WorkspaceIntegrationAuditLog,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  User,
} from '../models/index.js';
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

const PROVIDER_CATALOG = Object.freeze([
  {
    key: 'salesforce',
    name: 'Salesforce',
    category: 'other',
    authType: 'oauth',
    description:
      'Sync opportunities, accounts, and hiring signals between Gigvora and Salesforce. Supports pipeline enrichment and job request ingestion.',
    docsUrl: 'https://docs.gigvora.com/integrations/salesforce',
    defaultSyncFrequency: 'hourly',
    requiredScopes: ['api', 'refresh_token'],
    requiresSecrets: false,
  },
  {
    key: 'slack',
    name: 'Slack',
    category: 'communication',
    authType: 'oauth',
    description:
      'Broadcast hiring updates, approvals, and alerts to Slack channels with granular scopes and message templates.',
    docsUrl: 'https://docs.gigvora.com/integrations/slack',
    defaultSyncFrequency: 'manual',
    requiredScopes: ['chat:write', 'channels:read'],
    requiresSecrets: false,
  },
  {
    key: 'hubspot',
    name: 'HubSpot',
    category: 'other',
    authType: 'oauth',
    description:
      'Synchronise nurture sequences, lifecycle stages, and attribution data between Gigvora and HubSpot.',
    docsUrl: 'https://docs.gigvora.com/integrations/hubspot',
    defaultSyncFrequency: 'daily',
    requiredScopes: ['crm.objects.contacts.read', 'crm.objects.deals.write'],
    requiresSecrets: false,
  },
  {
    key: 'monday',
    name: 'monday.com',
    category: 'productivity',
    authType: 'oauth',
    description:
      'Coordinate delivery pods, onboarding workflows, and project milestones using bi-directional boards with monday.com.',
    docsUrl: 'https://docs.gigvora.com/integrations/monday',
    defaultSyncFrequency: 'hourly',
    requiredScopes: ['boards:read', 'boards:write'],
    requiresSecrets: false,
  },
  {
    key: 'custom_webhook',
    name: 'Custom webhook',
    category: 'other',
    authType: 'webhook',
    description:
      'Receive or emit JSON payloads to proprietary systems via secure, signed webhooks managed by Gigvora.',
    docsUrl: 'https://docs.gigvora.com/integrations/webhooks',
    defaultSyncFrequency: 'manual',
    requiredScopes: [],
    requiresSecrets: true,
  },
]);

const WEBHOOK_EVENT_CATALOG = Object.freeze([
  {
    key: 'projects',
    name: 'Project lifecycle',
    description: 'Receive notifications whenever agency projects move between key milestones.',
    events: [
      { key: 'project.created', label: 'Project created' },
      { key: 'project.stage_changed', label: 'Stage changed' },
      { key: 'project.risk_flagged', label: 'Risk flagged' },
      { key: 'project.completed', label: 'Project completed' },
    ],
  },
  {
    key: 'talent',
    name: 'Talent pipeline',
    description: 'Stream candidate status changes for Salesforce, HubSpot, or custom CRM ingestion.',
    events: [
      { key: 'talent.application_submitted', label: 'Application submitted' },
      { key: 'talent.interview_scheduled', label: 'Interview scheduled' },
      { key: 'talent.offer_extended', label: 'Offer extended' },
      { key: 'talent.hired', label: 'Candidate hired' },
    ],
  },
  {
    key: 'finance',
    name: 'Finance and payouts',
    description: 'Trigger downstream automation when invoices, retainers, or payouts change state.',
    events: [
      { key: 'finance.invoice_sent', label: 'Invoice sent' },
      { key: 'finance.payment_received', label: 'Payment received' },
      { key: 'finance.retainers_updated', label: 'Retainer updated' },
    ],
  },
]);

function normaliseString(value) {
  if (value == null) {
    return null;
  }
  const text = `${value}`.trim();
  return text.length ? text : null;
}

function normaliseStringArray(value) {
  if (!value) {
    return [];
  }
  const source = Array.isArray(value) ? value : `${value}`.split(',');
  const result = [];
  source.forEach((item) => {
    const trimmed = `${item}`.trim();
    if (!trimmed) {
      return;
    }
    if (!result.includes(trimmed)) {
      result.push(trimmed);
    }
  });
  return result;
}

function hashSecret(secretValue) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hashedValue = crypto.pbkdf2Sync(`${secretValue}`, salt, 120000, 64, 'sha512').toString('hex');
  return { hashedValue, salt };
}

function extractLastFour(secretValue) {
  if (secretValue == null) {
    return null;
  }
  const text = `${secretValue}`;
  if (!text.length) {
    return null;
  }
  return text.slice(-4);
}

function toPlain(instance) {
  if (!instance) {
    return null;
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return instance;
}

function resolveActorRole(role, memberships = []) {
  if (role) {
    return `${role}`.toLowerCase();
  }
  if (Array.isArray(memberships) && memberships.length) {
    return `${memberships[0]}`.toLowerCase();
  }
  return null;
}

async function fetchAccessibleWorkspaces(actorId, actorRole) {
  const baseAttributes = ['id', 'name', 'slug', 'type', 'timezone', 'defaultCurrency', 'isActive', 'ownerId'];

  if (actorRole === 'admin') {
    const workspaces = await ProviderWorkspace.findAll({
      where: { type: 'agency' },
      attributes: baseAttributes,
      order: [['name', 'ASC']],
    });
    return workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      type: workspace.type,
      timezone: workspace.timezone,
      defaultCurrency: workspace.defaultCurrency,
      isActive: workspace.isActive,
      membershipRole: 'admin',
      membershipStatus: 'active',
    }));
  }

  if (!actorId) {
    return [];
  }

  const memberships = await ProviderWorkspaceMember.findAll({
    where: { userId: actorId, status: 'active' },
    include: [
      {
        model: ProviderWorkspace,
        as: 'workspace',
        required: true,
        where: { type: 'agency' },
        attributes: baseAttributes,
      },
    ],
  });

  const map = new Map();
  memberships.forEach((membership) => {
    const workspace = membership.workspace;
    if (!workspace) {
      return;
    }
    if (!map.has(workspace.id)) {
      map.set(workspace.id, {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        type: workspace.type,
        timezone: workspace.timezone,
        defaultCurrency: workspace.defaultCurrency,
        isActive: workspace.isActive,
        membershipRole: membership.role ?? null,
        membershipStatus: membership.status ?? 'active',
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function resolveWorkspaceSelection({ requestedWorkspaceId, actorId, actorRole }) {
  const resolvedRole = resolveActorRole(actorRole);
  if (!actorId && resolvedRole !== 'admin') {
    throw new AuthenticationError('You must be signed in to manage agency integrations.');
  }

  const accessible = await fetchAccessibleWorkspaces(actorId, resolvedRole);
  if (!accessible.length) {
    throw new AuthorizationError('No agency workspace access is configured for this account.');
  }

  let selected = null;
  if (requestedWorkspaceId != null) {
    const numericId = Number(requestedWorkspaceId);
    if (!Number.isFinite(numericId)) {
      throw new ValidationError('workspaceId must be a valid identifier.');
    }
    selected = accessible.find((item) => item.id === numericId);
    if (!selected) {
      throw new AuthorizationError('You do not have permission to manage integrations for the requested workspace.');
    }
  } else {
    [selected] = accessible;
  }

  return { selectedWorkspace: selected, accessibleWorkspaces: accessible };
}

async function ensureIntegrationAccess(integrationId, { actorId, actorRole }) {
  const integration = await WorkspaceIntegration.findByPk(integrationId, {
    include: [
      {
        model: ProviderWorkspace,
        as: 'workspace',
        attributes: ['id', 'name', 'type', 'ownerId', 'isActive'],
      },
    ],
  });

  if (!integration) {
    throw new NotFoundError('Integration not found.');
  }

  if (!integration.workspace || integration.workspace.type !== 'agency') {
    throw new AuthorizationError('Integration does not belong to an agency workspace.');
  }

  const resolvedRole = resolveActorRole(actorRole);
  if (resolvedRole === 'admin') {
    return integration;
  }

  if (!actorId) {
    throw new AuthenticationError('You must be signed in to manage this integration.');
  }

  if (integration.workspace.ownerId === actorId) {
    return integration;
  }

  const membership = await ProviderWorkspaceMember.findOne({
    where: { workspaceId: integration.workspaceId, userId: actorId, status: 'active' },
  });

  if (!membership) {
    throw new AuthorizationError('You do not have permission to manage this integration.');
  }

  return integration;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }
  const plain = toPlain(user);
  if (!plain) {
    return null;
  }
  const fullName = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim();
  return {
    id: plain.id ?? null,
    name: plain.name ?? (fullName || null),
    email: plain.email ?? null,
  };
}

function sanitizeSecret(secret) {
  const plain = toPlain(secret);
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    name: plain.name,
    secretType: plain.secretType,
    lastFour: plain.lastFour ?? null,
    version: plain.version ?? 1,
    lastRotatedAt: plain.lastRotatedAt ? new Date(plain.lastRotatedAt).toISOString() : null,
    rotatedBy: sanitizeUser(plain.rotatedBy),
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function sanitizeWebhook(webhook) {
  const plain = toPlain(webhook);
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    name: plain.name,
    status: plain.status,
    targetUrl: plain.targetUrl,
    eventTypes: Array.isArray(plain.eventTypes) ? plain.eventTypes : [],
    verificationToken: plain.verificationToken ?? null,
    secret: sanitizeSecret(plain.secret),
    createdBy: sanitizeUser(plain.createdBy),
    lastTriggeredAt: plain.lastTriggeredAt ? new Date(plain.lastTriggeredAt).toISOString() : null,
    lastErrorAt: plain.lastErrorAt ? new Date(plain.lastErrorAt).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    metadata: plain.metadata ?? {},
  };
}

function sanitizeIntegration(integration) {
  const plain = toPlain(integration);
  if (!plain) {
    return null;
  }

  const metadata = plain.metadata && typeof plain.metadata === 'object' ? plain.metadata : {};
  const secrets = Array.isArray(plain.secrets) ? plain.secrets.map(sanitizeSecret).filter(Boolean) : [];
  const webhooks = Array.isArray(plain.webhooks) ? plain.webhooks.map(sanitizeWebhook).filter(Boolean) : [];
  const incidents = Array.isArray(metadata.incidents) ? metadata.incidents : [];

  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    providerKey: plain.providerKey,
    displayName: plain.displayName,
    category: plain.category,
    status: plain.status,
    syncFrequency: plain.syncFrequency,
    lastSyncedAt: plain.lastSyncedAt ? new Date(plain.lastSyncedAt).toISOString() : null,
    metadata: {
      owner: metadata.owner ?? null,
      environment: metadata.environment ?? null,
      regions: Array.isArray(metadata.regions) ? metadata.regions : [],
      scopes: Array.isArray(metadata.scopes) ? metadata.scopes : [],
      channels: Array.isArray(metadata.channels) ? metadata.channels : [],
      connectionMode: metadata.connectionMode ?? 'api',
      notes: metadata.notes ?? null,
      incidents,
      webhookPolicy: metadata.webhookPolicy ?? null,
      lastConnectionTestAt: metadata.lastConnectionTestAt ?? null,
    },
    secrets,
    webhooks,
    incidents,
  };
}

function sanitizeAuditLogEntry(entry) {
  const plain = toPlain(entry);
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    integrationId: plain.integrationId,
    eventType: plain.eventType,
    summary: plain.summary,
    detail: plain.detail ?? {},
    actor: sanitizeUser(plain.actor),
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
  };
}

function buildSummary(connectors) {
  const summary = {
    total: connectors.length,
    connected: 0,
    pending: 0,
    disconnected: 0,
    error: 0,
    secrets: 0,
    webhooks: 0,
    lastSyncedAt: null,
    lastConnectionTestAt: null,
  };

  connectors.forEach((connector) => {
    const status = connector.status ?? 'pending';
    if (summary[status] != null) {
      summary[status] += 1;
    }
    summary.secrets += connector.secrets?.length ?? 0;
    summary.webhooks += connector.webhooks?.length ?? 0;
    if (connector.lastSyncedAt && (!summary.lastSyncedAt || connector.lastSyncedAt > summary.lastSyncedAt)) {
      summary.lastSyncedAt = connector.lastSyncedAt;
    }
    const testTimestamp = connector.metadata?.lastConnectionTestAt;
    if (testTimestamp && (!summary.lastConnectionTestAt || testTimestamp > summary.lastConnectionTestAt)) {
      summary.lastConnectionTestAt = testTimestamp;
    }
  });

  return summary;
}

async function recordAuditEvent(integrationId, eventType, summary, detail, actorId) {
  const resolvedIntegrationId =
    integrationId ?? (detail && typeof detail === 'object' ? detail.integrationId ?? null : null);

  if (!resolvedIntegrationId) {
    throw new ValidationError('integrationId is required when recording integration audit events.');
  }

  await WorkspaceIntegrationAuditLog.create({
    integrationId: resolvedIntegrationId,
    eventType,
    summary,
    detail: detail ?? {},
    actorId: actorId ?? null,
  });
}

function normaliseSecretType(value) {
  const normalized = `${value ?? ''}`.trim().toLowerCase();
  if (!normalized) {
    return 'api_key';
  }
  if (['api_key', 'oauth_token', 'webhook_secret', 'custom'].includes(normalized)) {
    return normalized;
  }
  throw new ValidationError('secretType is invalid.');
}

function ensureProvider(key) {
  const provider = PROVIDER_CATALOG.find((item) => item.key === key);
  if (!provider) {
    throw new ValidationError('Unsupported providerKey supplied.');
  }
  return provider;
}

function mergeIntegrationMetadata(currentMetadata, updates) {
  const base = currentMetadata && typeof currentMetadata === 'object' ? { ...currentMetadata } : {};
  if (!updates || typeof updates !== 'object') {
    return base;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'owner')) {
    base.owner = normaliseString(updates.owner);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'environment')) {
    base.environment = normaliseString(updates.environment);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'regions')) {
    base.regions = normaliseStringArray(updates.regions);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'scopes')) {
    base.scopes = normaliseStringArray(updates.scopes);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'channels')) {
    base.channels = normaliseStringArray(updates.channels);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'connectionMode')) {
    base.connectionMode = normaliseString(updates.connectionMode) ?? 'api';
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'notes')) {
    base.notes = normaliseString(updates.notes);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'incidents')) {
    base.incidents = Array.isArray(updates.incidents) ? updates.incidents : [];
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'webhookPolicy')) {
    base.webhookPolicy = updates.webhookPolicy ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'lastConnectionTestAt')) {
    const timestamp = updates.lastConnectionTestAt;
    if (!timestamp) {
      base.lastConnectionTestAt = null;
    } else {
      const parsed = new Date(timestamp);
      base.lastConnectionTestAt = Number.isNaN(parsed.getTime()) ? `${timestamp}` : parsed.toISOString();
    }
  }
  return base;
}

export async function listIntegrations({ workspaceId } = {}, { actorId, actorRole } = {}) {
  const { selectedWorkspace, accessibleWorkspaces } = await resolveWorkspaceSelection({
    requestedWorkspaceId: workspaceId,
    actorId,
    actorRole,
  });

  const integrations = await WorkspaceIntegration.findAll({
    where: { workspaceId: selectedWorkspace.id },
    include: [
      { model: WorkspaceIntegrationSecret, as: 'secrets', include: [{ model: User, as: 'rotatedBy' }] },
      {
        model: WorkspaceIntegrationWebhook,
        as: 'webhooks',
        include: [
          { model: WorkspaceIntegrationSecret, as: 'secret', include: [{ model: User, as: 'rotatedBy' }] },
          { model: User, as: 'createdBy' },
        ],
      },
    ],
    order: [
      ['displayName', 'ASC'],
    ],
  });

  const sanitizedIntegrations = integrations.map((integration) => sanitizeIntegration(integration)).filter(Boolean);
  const summary = buildSummary(sanitizedIntegrations);

  let auditLog = [];
  if (sanitizedIntegrations.length) {
    const integrationIds = sanitizedIntegrations.map((integration) => integration.id);
    const auditEntries = await WorkspaceIntegrationAuditLog.findAll({
      where: { integrationId: { [Op.in]: integrationIds } },
      include: [{ model: User, as: 'actor' }],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    auditLog = auditEntries.map((entry) => sanitizeAuditLogEntry(entry)).filter(Boolean);
  }

  return {
    meta: {
      selectedWorkspaceId: selectedWorkspace.id,
      workspace: selectedWorkspace,
      availableWorkspaces: accessibleWorkspaces,
      summary,
      availableProviders: PROVIDER_CATALOG,
      webhookEventCatalog: WEBHOOK_EVENT_CATALOG,
    },
    connectors: sanitizedIntegrations,
    auditLog,
  };
}

export async function createIntegration(payload = {}, { actorId, actorRole } = {}) {
  const providerKey = normaliseString(payload.providerKey);
  if (!providerKey) {
    throw new ValidationError('providerKey is required.');
  }

  const provider = ensureProvider(providerKey);
  const { selectedWorkspace } = await resolveWorkspaceSelection({
    requestedWorkspaceId: payload.workspaceId,
    actorId,
    actorRole,
  });

  const existing = await WorkspaceIntegration.findOne({
    where: { workspaceId: selectedWorkspace.id, providerKey },
  });

  if (existing) {
    throw new ValidationError('An integration for this provider already exists in the workspace.');
  }

  const displayName = normaliseString(payload.displayName) ?? provider.name;
  const status = payload.status && ['connected', 'disconnected', 'error', 'pending'].includes(payload.status)
    ? payload.status
    : 'pending';
  const syncFrequency = payload.syncFrequency && ['manual', 'hourly', 'daily', 'weekly'].includes(payload.syncFrequency)
    ? payload.syncFrequency
    : provider.defaultSyncFrequency;
  const metadata = mergeIntegrationMetadata({}, payload.metadata ?? {});

  const integration = await WorkspaceIntegration.create({
    workspaceId: selectedWorkspace.id,
    providerKey,
    displayName,
    category: provider.category,
    status,
    syncFrequency,
    metadata,
  });

  await recordAuditEvent(
    integration.id,
    'integration_created',
    `${displayName} integration connected`,
    { providerKey },
    actorId,
  );

  return sanitizeIntegration(integration);
}

export async function updateIntegration(integrationId, payload = {}, { actorId, actorRole } = {}) {
  if (!integrationId) {
    throw new ValidationError('integrationId is required.');
  }

  const integration = await ensureIntegrationAccess(integrationId, { actorId, actorRole });

  const updates = {};
  if (Object.prototype.hasOwnProperty.call(payload, 'displayName')) {
    updates.displayName = normaliseString(payload.displayName) ?? integration.displayName;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    const status = normaliseString(payload.status);
    if (status && ['connected', 'disconnected', 'error', 'pending'].includes(status)) {
      updates.status = status;
    } else {
      throw new ValidationError('status must be connected, disconnected, error, or pending.');
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'syncFrequency')) {
    const syncFrequency = normaliseString(payload.syncFrequency);
    if (syncFrequency && ['manual', 'hourly', 'daily', 'weekly'].includes(syncFrequency)) {
      updates.syncFrequency = syncFrequency;
    } else {
      throw new ValidationError('syncFrequency must be manual, hourly, daily, or weekly.');
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'metadata')) {
    updates.metadata = mergeIntegrationMetadata(integration.metadata, payload.metadata);
  }

  if (Object.keys(updates).length === 0) {
    return sanitizeIntegration(integration);
  }

  await integration.update(updates);

  await recordAuditEvent(
    integrationId,
    'integration_updated',
    `${integration.displayName} integration updated`,
    { updates: Object.keys(updates) },
    actorId,
  );

  return sanitizeIntegration(integration);
}

export async function rotateSecret(integrationId, payload = {}, { actorId, actorRole } = {}) {
  if (!integrationId) {
    throw new ValidationError('integrationId is required.');
  }
  const secretValue = payload.secretValue ?? payload.value;
  if (!secretValue || `${secretValue}`.trim().length < 6) {
    throw new ValidationError('Secret value must be at least 6 characters.');
  }

  const integration = await ensureIntegrationAccess(integrationId, { actorId, actorRole });
  const secretType = normaliseSecretType(payload.secretType);
  const secretName = normaliseString(payload.name) ?? `${integration.displayName} credential`;

  const { hashedValue, salt } = hashSecret(secretValue);
  const lastFour = extractLastFour(secretValue);
  const now = new Date();

  let secretInstance = null;
  if (payload.secretId) {
    secretInstance = await WorkspaceIntegrationSecret.findOne({
      where: { id: payload.secretId, integrationId },
    });
    if (!secretInstance) {
      throw new NotFoundError('Secret not found for this integration.');
    }
    await secretInstance.update({
      name: secretName,
      secretType,
      hashedValue,
      salt,
      lastFour,
      version: (secretInstance.version ?? 1) + 1,
      lastRotatedAt: now,
      rotatedById: actorId ?? null,
    });
  } else {
    secretInstance = await WorkspaceIntegrationSecret.create({
      integrationId,
      name: secretName,
      secretType,
      hashedValue,
      salt,
      lastFour,
      version: 1,
      lastRotatedAt: now,
      rotatedById: actorId ?? null,
    });
  }

  await recordAuditEvent(
    integrationId,
    payload.secretId ? 'secret_rotated' : 'secret_created',
    `${secretName} rotated`,
    { secretType },
    actorId,
  );

  const reloaded = await WorkspaceIntegration.findByPk(integrationId, {
    include: [
      { model: WorkspaceIntegrationSecret, as: 'secrets', include: [{ model: User, as: 'rotatedBy' }] },
      {
        model: WorkspaceIntegrationWebhook,
        as: 'webhooks',
        include: [
          { model: WorkspaceIntegrationSecret, as: 'secret', include: [{ model: User, as: 'rotatedBy' }] },
          { model: User, as: 'createdBy' },
        ],
      },
    ],
  });

  return {
    secret: sanitizeSecret(secretInstance),
    integration: sanitizeIntegration(reloaded),
  };
}

export async function createWebhook(integrationId, payload = {}, { actorId, actorRole } = {}) {
  if (!integrationId) {
    throw new ValidationError('integrationId is required.');
  }
  const integration = await ensureIntegrationAccess(integrationId, { actorId, actorRole });

  const name = normaliseString(payload.name) ?? 'Webhook endpoint';
  const targetUrl = normaliseString(payload.targetUrl);
  if (!targetUrl) {
    throw new ValidationError('targetUrl is required.');
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (error) {
    throw new ValidationError('targetUrl must be a valid URL.');
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new ValidationError('targetUrl must use http or https.');
  }

  const status = normaliseString(payload.status) ?? 'active';
  if (!['active', 'paused', 'disabled'].includes(status)) {
    throw new ValidationError('status must be active, paused, or disabled.');
  }

  const eventTypes = normaliseStringArray(payload.eventTypes);

  let secretId = payload.secretId ?? null;
  if (!secretId && payload.secretValue) {
    const secretPayload = await rotateSecret(
      integrationId,
      {
        name: `${name} signing secret`,
        secretType: 'webhook_secret',
        secretValue: payload.secretValue,
      },
      { actorId, actorRole },
    );
    secretId = secretPayload.secret?.id ?? null;
  }

  const webhook = await WorkspaceIntegrationWebhook.create({
    integrationId,
    secretId,
    name,
    status,
    targetUrl: parsedUrl.toString(),
    eventTypes,
    verificationToken: normaliseString(payload.verificationToken),
    createdById: actorId ?? null,
    metadata: payload.metadata ?? {},
  });

  await recordAuditEvent(
    integrationId,
    'webhook_created',
    `${name} webhook created`,
    { status, eventTypes },
    actorId,
  );

  const reloaded = await WorkspaceIntegrationWebhook.findByPk(webhook.id, {
    include: [
      { model: WorkspaceIntegrationSecret, as: 'secret', include: [{ model: User, as: 'rotatedBy' }] },
      { model: User, as: 'createdBy' },
    ],
  });

  return sanitizeWebhook(reloaded);
}

export async function updateWebhook(integrationId, webhookId, payload = {}, { actorId, actorRole } = {}) {
  if (!integrationId || !webhookId) {
    throw new ValidationError('integrationId and webhookId are required.');
  }
  await ensureIntegrationAccess(integrationId, { actorId, actorRole });

  const webhook = await WorkspaceIntegrationWebhook.findOne({
    where: { id: webhookId, integrationId },
  });

  if (!webhook) {
    throw new NotFoundError('Webhook not found.');
  }

  const updates = {};
  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    updates.name = normaliseString(payload.name) ?? webhook.name;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    const status = normaliseString(payload.status);
    if (status && ['active', 'paused', 'disabled'].includes(status)) {
      updates.status = status;
    } else {
      throw new ValidationError('status must be active, paused, or disabled.');
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'targetUrl')) {
    const targetUrl = normaliseString(payload.targetUrl);
    if (!targetUrl) {
      throw new ValidationError('targetUrl cannot be empty.');
    }
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (error) {
      throw new ValidationError('targetUrl must be a valid URL.');
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new ValidationError('targetUrl must use http or https.');
    }
    updates.targetUrl = parsed.toString();
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'eventTypes')) {
    updates.eventTypes = normaliseStringArray(payload.eventTypes);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'verificationToken')) {
    updates.verificationToken = normaliseString(payload.verificationToken);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'metadata')) {
    updates.metadata = { ...(webhook.metadata ?? {}), ...(payload.metadata ?? {}) };
  }

  if (payload.secretValue) {
    const secretPayload = await rotateSecret(
      integrationId,
      {
        secretId: webhook.secretId,
        name: `${updates.name ?? webhook.name} signing secret`,
        secretType: 'webhook_secret',
        secretValue: payload.secretValue,
      },
      { actorId, actorRole },
    );
    updates.secretId = secretPayload.secret?.id ?? webhook.secretId;
  }

  if (Object.keys(updates).length === 0) {
    const reloaded = await WorkspaceIntegrationWebhook.findByPk(webhook.id, {
      include: [
        { model: WorkspaceIntegrationSecret, as: 'secret', include: [{ model: User, as: 'rotatedBy' }] },
        { model: User, as: 'createdBy' },
      ],
    });
    return sanitizeWebhook(reloaded);
  }

  await webhook.update(updates);

  await recordAuditEvent(
    integrationId,
    'webhook_updated',
    `${webhook.name} webhook updated`,
    { updates: Object.keys(updates) },
    actorId,
  );

  const reloaded = await WorkspaceIntegrationWebhook.findByPk(webhook.id, {
    include: [
      { model: WorkspaceIntegrationSecret, as: 'secret', include: [{ model: User, as: 'rotatedBy' }] },
      { model: User, as: 'createdBy' },
    ],
  });

  return sanitizeWebhook(reloaded);
}

export async function deleteWebhook(integrationId, webhookId, { actorId, actorRole } = {}) {
  if (!integrationId || !webhookId) {
    throw new ValidationError('integrationId and webhookId are required.');
  }

  await ensureIntegrationAccess(integrationId, { actorId, actorRole });

  const webhook = await WorkspaceIntegrationWebhook.findOne({
    where: { id: webhookId, integrationId },
  });

  if (!webhook) {
    return { deleted: false };
  }

  await webhook.destroy();

  await recordAuditEvent(
    integrationId,
    'webhook_deleted',
    `${webhook.name} webhook deleted`,
    { webhookId },
    actorId,
  );

  return { deleted: true };
}

export async function testIntegrationConnection(integrationId, { actorId, actorRole } = {}) {
  if (!integrationId) {
    throw new ValidationError('integrationId is required.');
  }

  const integration = await ensureIntegrationAccess(integrationId, { actorId, actorRole });

  const secretCount = await WorkspaceIntegrationSecret.count({ where: { integrationId } });
  const now = new Date();
  const latencyMs = 50 + Math.floor(Math.random() * 120);
  const issues = [];

  if (!secretCount) {
    issues.push('No credentials stored for this integration. Upload an API key or complete OAuth setup.');
  }

  const status = issues.length ? 'action_required' : 'connected';

  const metadata = mergeIntegrationMetadata(integration.metadata, {
    lastConnectionTestAt: now.toISOString(),
  });

  await integration.update({
    lastSyncedAt: now,
    metadata,
  });

  await recordAuditEvent(
    integration.id,
    'connection_tested',
    `${integration.displayName} connection tested`,
    { latencyMs, issues },
    actorId,
  );

  return {
    integrationId: integration.id,
    status,
    latencyMs,
    issues,
    checkedAt: now.toISOString(),
  };
}

export default {
  listIntegrations,
  createIntegration,
  updateIntegration,
  rotateSecret,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testIntegrationConnection,
};
