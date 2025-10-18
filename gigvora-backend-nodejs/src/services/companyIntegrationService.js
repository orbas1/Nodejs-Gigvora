import crypto from 'node:crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  ProviderWorkspace,
  WorkspaceIntegration,
  WorkspaceIntegrationCredential,
  WorkspaceIntegrationFieldMapping,
  WorkspaceIntegrationRoleAssignment,
  WorkspaceIntegrationSyncRun,
  WorkspaceIntegrationIncident,
  WorkspaceIntegrationAuditEvent,
  WORKSPACE_INTEGRATION_STATUSES,
  WORKSPACE_INTEGRATION_SYNC_FREQUENCIES,
  WORKSPACE_INTEGRATION_AUTH_TYPES,
  WORKSPACE_INTEGRATION_ENVIRONMENTS,
  WORKSPACE_INTEGRATION_CREDENTIAL_TYPES,
  WORKSPACE_INTEGRATION_INCIDENT_SEVERITIES,
  WORKSPACE_INTEGRATION_INCIDENT_STATUSES,
  WORKSPACE_INTEGRATION_SYNC_RUN_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CRM_PROVIDERS = {
  salesforce: {
    providerKey: 'salesforce',
    displayName: 'Salesforce',
    category: 'crm',
    authType: 'oauth',
    defaultSyncFrequency: 'hourly',
    defaultScopes: ['accounts:read', 'opportunities:write', 'leads:read'],
    owner: 'Revenue Operations',
    compliance: ['SOC 2', 'GDPR', 'ISO 27001'],
    regions: ['us-east-1', 'eu-west-1'],
    modules: ['Opportunities', 'Accounts', 'Pipeline Alerts'],
    description: 'Two-way pipeline sync for opportunities, leads, and hiring attribution.',
    defaultSettings: {
      syncDirection: 'bidirectional',
      syncWindowDays: 45,
      leadAssignment: 'auto',
      pipelineStages: [
        { external: 'Prospecting', internal: 'sourcing' },
        { external: 'Qualification', internal: 'intake' },
        { external: 'Proposal', internal: 'interview' },
        { external: 'Negotiation', internal: 'offer' },
        { external: 'Closed Won', internal: 'hired' },
      ],
    },
    roleTemplates: [
      {
        roleKey: 'owner',
        roleLabel: 'CRM Owner',
        permissions: ['manage_connection', 'manage_mappings', 'manage_roles', 'trigger_sync'],
      },
      {
        roleKey: 'analyst',
        roleLabel: 'Revenue Operations Analyst',
        permissions: ['view_data', 'manage_mappings', 'trigger_sync'],
      },
      {
        roleKey: 'read_only',
        roleLabel: 'Read only',
        permissions: ['view_data'],
      },
    ],
    fieldMappingTemplate: [
      {
        externalObject: 'Lead',
        localObject: 'Candidate',
        mapping: {
          Email: 'email',
          FirstName: 'firstName',
          LastName: 'lastName',
          Company: 'companyName',
          Title: 'currentRole',
        },
      },
      {
        externalObject: 'Opportunity',
        localObject: 'HiringPipeline',
        mapping: {
          Name: 'requisitionTitle',
          StageName: 'stage',
          Amount: 'projectedValue',
          CloseDate: 'targetCloseDate',
        },
      },
    ],
  },
  hubspot: {
    providerKey: 'hubspot',
    displayName: 'HubSpot',
    category: 'crm',
    authType: 'oauth',
    defaultSyncFrequency: 'daily',
    defaultScopes: ['crm.objects.contacts.read', 'crm.objects.deals.write'],
    owner: 'Growth Marketing',
    compliance: ['SOC 2', 'GDPR'],
    regions: ['eu-central-1'],
    modules: ['Campaigns', 'Deals', 'Marketing Automation'],
    description: 'Nurture program sync, candidate marketing attribution, and list segmentation.',
    defaultSettings: {
      syncDirection: 'bidirectional',
      syncWindowDays: 30,
      marketingLifecycle: 'talent_nurture',
      dealStages: [
        { external: 'Appointment Scheduled', internal: 'intake' },
        { external: 'Qualified to buy', internal: 'screen' },
        { external: 'Presentation Scheduled', internal: 'panel' },
        { external: 'Contract Sent', internal: 'offer' },
      ],
    },
    roleTemplates: [
      {
        roleKey: 'marketing_owner',
        roleLabel: 'Marketing Owner',
        permissions: ['manage_connection', 'manage_mappings', 'trigger_sync'],
      },
      {
        roleKey: 'automation',
        roleLabel: 'Automation Manager',
        permissions: ['manage_mappings', 'trigger_sync', 'manage_incidents'],
      },
      {
        roleKey: 'viewer',
        roleLabel: 'Viewer',
        permissions: ['view_data'],
      },
    ],
    fieldMappingTemplate: [
      {
        externalObject: 'Contact',
        localObject: 'Candidate',
        mapping: {
          email: 'email',
          firstname: 'firstName',
          lastname: 'lastName',
          phone: 'phone',
        },
      },
      {
        externalObject: 'Deal',
        localObject: 'HiringPipeline',
        mapping: {
          dealname: 'requisitionTitle',
          dealstage: 'stage',
          pipeline: 'pipelineId',
          amount: 'projectedValue',
        },
      },
    ],
  },
  monday: {
    providerKey: 'monday',
    displayName: 'monday.com',
    category: 'work_management',
    authType: 'api_key',
    defaultSyncFrequency: 'daily',
    defaultScopes: ['boards:read', 'boards:write', 'webhooks:manage'],
    owner: 'Talent Operations',
    compliance: ['SOC 2', 'GDPR'],
    regions: ['us-east-1'],
    modules: ['Hiring Boards', 'Onboarding Plans', 'Automation Recipes'],
    description: 'Project plan sync for hiring pods, interview loops, and onboarding milestones.',
    defaultSettings: {
      syncDirection: 'bidirectional',
      syncWindowDays: 14,
      boardTemplates: ['Interview Plan', 'Onboarding Checklist'],
      automationRecipes: ['status_to_stage', 'sla_reminder'],
    },
    roleTemplates: [
      {
        roleKey: 'workspace_admin',
        roleLabel: 'Workspace Admin',
        permissions: ['manage_connection', 'manage_mappings', 'manage_roles', 'trigger_sync'],
      },
      {
        roleKey: 'pod_lead',
        roleLabel: 'Hiring Pod Lead',
        permissions: ['manage_mappings', 'trigger_sync'],
      },
      {
        roleKey: 'observer',
        roleLabel: 'Observer',
        permissions: ['view_data'],
      },
    ],
    fieldMappingTemplate: [
      {
        externalObject: 'BoardItem',
        localObject: 'HiringTask',
        mapping: {
          name: 'taskName',
          status: 'status',
          due_date: 'dueDate',
          owner: 'assignee',
        },
      },
    ],
  },
};

const STATIC_CONNECTORS = [
  {
    key: 'slack',
    displayName: 'Slack',
    category: 'communication',
    status: 'connected',
    description: 'Channel alerts, digests, and approvals delivered to recruiting teams.',
    regions: ['us-west-2'],
    scopes: ['chat:write', 'channels:manage'],
    owner: 'Internal Communications',
    compliance: ['SOC 2', 'HIPAA'],
    lastSyncedAt: null,
  },
  {
    key: 'google-drive',
    displayName: 'Google Drive',
    category: 'content',
    status: 'connected',
    description: 'Offer templates, playbooks, and collateral stored in Drive workspaces.',
    regions: ['us-west-1', 'asia-southeast1'],
    scopes: ['drive.file', 'drive.metadata.readonly'],
    owner: 'People Operations',
    compliance: ['SOC 2', 'ISO 27017'],
    lastSyncedAt: null,
  },
  {
    key: 'openai',
    displayName: 'OpenAI',
    category: 'ai',
    status: 'connected',
    description: 'Job description drafting and intelligence powered by GPT models.',
    regions: ['us-east-1'],
    scopes: ['chat.completions', 'embeddings'],
    owner: 'Intelligence Ops',
    compliance: ['SOC 2'],
    lastSyncedAt: null,
  },
  {
    key: 'claude',
    displayName: 'Claude',
    category: 'ai',
    status: 'not_connected',
    description: 'Interview summarisation and concierge workflows using Anthropic Claude.',
    regions: ['us-east-1'],
    scopes: ['text:generation'],
    owner: 'Intelligence Ops',
    compliance: ['SOC 2'],
    lastSyncedAt: null,
  },
  {
    key: 'deepseek',
    displayName: 'DeepSeek',
    category: 'ai',
    status: 'not_connected',
    description: 'Reasoning models for complex hiring analytics.',
    regions: ['ap-southeast-1'],
    scopes: ['analysis'],
    owner: 'Strategic Analytics',
    compliance: ['ISO 27001'],
    lastSyncedAt: null,
  },
  {
    key: 'x',
    displayName: 'X (Twitter)',
    category: 'communication',
    status: 'connected',
    description: 'Employer brand publishing and community engagement on X.',
    regions: ['us-east-1'],
    scopes: ['tweet.read', 'tweet.write'],
    owner: 'Employer Brand',
    compliance: ['SOC 2'],
    lastSyncedAt: null,
  },
];

const INTEGRATION_INCLUDE = [
  {
    model: WorkspaceIntegrationCredential,
    as: 'credentials',
    separate: true,
    order: [['lastRotatedAt', 'DESC']],
  },
  { model: WorkspaceIntegrationFieldMapping, as: 'fieldMappings' },
  { model: WorkspaceIntegrationRoleAssignment, as: 'roleAssignments' },
  {
    model: WorkspaceIntegrationSyncRun,
    as: 'syncRuns',
    separate: true,
    order: [['startedAt', 'DESC']],
    limit: 10,
  },
  {
    model: WorkspaceIntegrationIncident,
    as: 'incidents',
    order: [['openedAt', 'DESC']],
  },
  {
    model: WorkspaceIntegrationAuditEvent,
    as: 'auditEvents',
    separate: true,
    order: [['createdAt', 'DESC']],
    limit: 30,
  },
];

function normalizeActor(actor = {}) {
  if (!actor || typeof actor !== 'object') {
    return { id: null, name: null };
  }
  return {
    id: actor.id ?? actor.actorId ?? null,
    name: actor.name ?? actor.actorName ?? null,
  };
}

function digestSecret(secret) {
  if (typeof secret !== 'string' || !secret.trim()) {
    throw new ValidationError('A non-empty credential secret is required.');
  }
  return crypto.createHash('sha256').update(secret.trim()).digest('hex');
}

function computeNextSyncAt(syncFrequency, fromDate = new Date()) {
  if (!syncFrequency || syncFrequency === 'manual') {
    return null;
  }
  const base = fromDate instanceof Date ? fromDate : new Date(fromDate);
  const result = new Date(base.getTime());
  switch (syncFrequency) {
    case 'hourly':
      result.setHours(result.getHours() + 1);
      break;
    case 'daily':
      result.setDate(result.getDate() + 1);
      break;
    case 'weekly':
      result.setDate(result.getDate() + 7);
      break;
    default:
      return null;
  }
  return result;
}

function sanitizeFieldMapping(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const externalObject = String(entry.externalObject ?? '').trim();
  const localObject = String(entry.localObject ?? '').trim();
  if (!externalObject || !localObject) {
    return null;
  }
  const mappingSource = entry.mapping ?? entry.fields ?? {};
  const mapping = {};
  Object.entries(mappingSource || {})
    .filter(([localField, externalField]) => localField && externalField)
    .forEach(([localField, externalField]) => {
      const localKey = String(localField).trim();
      const externalKey = String(externalField).trim();
      if (localKey && externalKey) {
        mapping[localKey] = externalKey;
      }
    });
  return {
    externalObject,
    localObject,
    mapping,
    isActive: entry.isActive !== false,
  };
}

function sanitizeRoleAssignment(entry, templates = []) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const roleKey = String(entry.roleKey ?? '').trim();
  if (!roleKey) {
    return null;
  }
  const template = templates.find((item) => item.roleKey === roleKey) ?? null;
  const roleLabel = String(entry.roleLabel ?? template?.roleLabel ?? roleKey).trim();
  const assigneeName = entry.assigneeName ? String(entry.assigneeName).trim() : null;
  const assigneeEmail = entry.assigneeEmail ? String(entry.assigneeEmail).trim().toLowerCase() : null;
  const permissions = Array.isArray(entry.permissions)
    ? entry.permissions.filter((item) => typeof item === 'string')
    : Array.isArray(template?.permissions)
    ? template.permissions
    : [];
  return {
    roleKey,
    roleLabel,
    assigneeName: assigneeName || null,
    assigneeEmail: assigneeEmail || null,
    userId: entry.userId ?? null,
    permissions,
  };
}

async function recordAuditEvent(integrationId, action, actor, details = null, transaction) {
  const normalizedActor = normalizeActor(actor);
  await WorkspaceIntegrationAuditEvent.create(
    {
      integrationId,
      action,
      actorId: normalizedActor.id,
      actorName: normalizedActor.name,
      details: details && Object.keys(details).length ? details : null,
    },
    { transaction },
  );
}

async function resolveWorkspaceId({ workspaceId } = {}) {
  if (workspaceId != null) {
    const workspace = await ProviderWorkspace.findByPk(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found.');
    }
    return workspace.id;
  }

  const fallback = await ProviderWorkspace.findOne({ order: [['id', 'ASC']] });
  if (!fallback) {
    throw new NotFoundError('No company workspace is registered.');
  }
  return fallback.id;
}

async function loadIntegrationById(integrationId, { workspaceId } = {}) {
  const where = { id: integrationId };
  if (workspaceId != null) {
    where.workspaceId = workspaceId;
  }
  const integration = await WorkspaceIntegration.findOne({ where, include: INTEGRATION_INCLUDE });
  if (!integration) {
    throw new NotFoundError('Integration not found.');
  }
  return integration;
}

async function ensureIntegration(workspaceId, providerKey) {
  const config = CRM_PROVIDERS[providerKey];
  if (!config) {
    throw new ValidationError('Unsupported provider.');
  }

  const [integration] = await WorkspaceIntegration.findOrCreate({
    where: { workspaceId, providerKey },
    defaults: {
      displayName: config.displayName,
      category: config.category,
      status: 'disconnected',
      authType: config.authType,
      environment: 'production',
      syncFrequency: config.defaultSyncFrequency,
      metadata: {
        description: config.description,
        scopes: config.defaultScopes,
        modules: config.modules,
        owner: config.owner,
        compliance: config.compliance,
        regions: config.regions,
      },
      settings: config.defaultSettings,
    },
  });

  return loadIntegrationById(integration.id);
}

function getLatestCredential(credentials = []) {
  return credentials.length ? credentials[0] : null;
}

function serializeStaticConnector(entry) {
  return {
    id: null,
    key: entry.key,
    providerKey: entry.key,
    name: entry.displayName,
    category: entry.category,
    status: entry.status,
    authType: null,
    environment: 'production',
    lastSyncedAt: entry.lastSyncedAt,
    connectedAt: null,
    nextSyncAt: null,
    lastSyncStatus: entry.status === 'connected' ? 'success' : 'pending',
    syncFrequency: 'manual',
    scopes: entry.scopes ?? [],
    regions: entry.regions ?? [],
    compliance: entry.compliance ?? [],
    owner: entry.owner ?? null,
    description: entry.description ?? '',
    modules: entry.modules ?? [],
    settings: {},
    metadata: {},
    credential: null,
    credentials: [],
    fieldMappings: [],
    roleAssignments: [],
    incidents: [],
    syncRuns: [],
    auditEvents: [],
    isManaged: false,
  };
}

function serializeIntegration(instance, providerConfig) {
  const base = instance.toPublicObject();
  const credentials = (instance.credentials ?? []).map((item) => item.toPublicObject());
  const latestCredential = getLatestCredential(credentials);
  const fieldMappings = (instance.fieldMappings ?? []).map((item) => item.toPublicObject());
  const roleAssignments = (instance.roleAssignments ?? []).map((item) => item.toPublicObject());
  const incidents = (instance.incidents ?? []).map((item) => item.toPublicObject());
  const syncRuns = (instance.syncRuns ?? []).map((item) => item.toPublicObject());
  const auditEvents = (instance.auditEvents ?? []).map((item) => item.toPublicObject());

  const metadata = base.metadata ?? {};
  const scopes = Array.isArray(metadata.scopes) ? metadata.scopes : providerConfig.defaultScopes;
  const compliance = Array.isArray(metadata.compliance) ? metadata.compliance : providerConfig.compliance;
  const regions = Array.isArray(metadata.regions) ? metadata.regions : providerConfig.regions;
  const modules = Array.isArray(metadata.modules) ? metadata.modules : providerConfig.modules;

  return {
    id: base.id,
    key: base.providerKey,
    providerKey: base.providerKey,
    name: base.displayName,
    category: base.category,
    status: base.status,
    authType: base.authType,
    environment: base.environment,
    lastSyncedAt: base.lastSyncedAt,
    connectedAt: base.connectedAt,
    nextSyncAt: base.nextSyncAt,
    lastSyncStatus: base.lastSyncStatus,
    syncFrequency: base.syncFrequency,
    scopes,
    regions,
    compliance,
    owner: metadata.owner ?? providerConfig.owner,
    description: metadata.description ?? providerConfig.description,
    modules,
    settings: base.settings ?? providerConfig.defaultSettings,
    metadata,
    credential: latestCredential,
    credentials,
    fieldMappings,
    roleAssignments,
    incidents,
    syncRuns,
    auditEvents,
    isManaged: true,
  };
}

function buildSummary(connectors) {
  const summary = connectors.reduce(
    (accumulator, connector) => {
      accumulator.total += 1;
      if (connector.status === 'connected') {
        accumulator.connected += 1;
      }
      if (connector.status !== 'connected' || (connector.incidents ?? []).some((incident) => incident.status !== 'resolved')) {
        accumulator.requiresAttention += 1;
      }
      const openIncidents = (connector.incidents ?? []).filter((incident) => incident.status !== 'resolved');
      accumulator.openIncidents += openIncidents.length;
      const syncedAt = connector.lastSyncedAt ? new Date(connector.lastSyncedAt).getTime() : null;
      if (syncedAt && (!accumulator.lastSyncedAt || syncedAt > accumulator.lastSyncedAt)) {
        accumulator.lastSyncedAt = syncedAt;
      }
      const environmentKey = connector.environment ?? 'production';
      accumulator.environments[environmentKey] = (accumulator.environments[environmentKey] ?? 0) + 1;
      return accumulator;
    },
    {
      total: 0,
      connected: 0,
      requiresAttention: 0,
      openIncidents: 0,
      lastSyncedAt: null,
      environments: {},
    },
  );

  return {
    total: summary.total,
    connected: summary.connected,
    requiresAttention: summary.requiresAttention,
    openIncidents: summary.openIncidents,
    lastSyncedAt: summary.lastSyncedAt ? new Date(summary.lastSyncedAt) : null,
    environments: summary.environments,
  };
}

function flattenAuditLog(connectors) {
  return connectors
    .flatMap((connector) =>
      (connector.auditEvents ?? []).map((event) => ({
        ...event,
        connector: connector.providerKey,
        connectorName: connector.name,
      })),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 30);
}

export async function listCompanyIntegrations({ workspaceId } = {}) {
  const resolvedWorkspaceId = await resolveWorkspaceId({ workspaceId });
  const managedProviderKeys = Object.keys(CRM_PROVIDERS);

  const managedIntegrations = await WorkspaceIntegration.findAll({
    where: {
      workspaceId: resolvedWorkspaceId,
      providerKey: managedProviderKeys,
    },
    include: INTEGRATION_INCLUDE,
  });

  const integrationsByProvider = new Map();
  managedIntegrations.forEach((integration) => {
    integrationsByProvider.set(integration.providerKey, integration);
  });

  const connectors = [];

  for (const providerKey of managedProviderKeys) {
    const config = CRM_PROVIDERS[providerKey];
    const integrationInstance = integrationsByProvider.has(providerKey)
      ? integrationsByProvider.get(providerKey)
      : await ensureIntegration(resolvedWorkspaceId, providerKey);
    connectors.push(serializeIntegration(integrationInstance, config));
  }

  STATIC_CONNECTORS.forEach((entry) => {
    connectors.push(serializeStaticConnector(entry));
  });

  const summary = buildSummary(connectors);
  const auditLog = flattenAuditLog(connectors);

  return {
    workspaceId: resolvedWorkspaceId,
    summary,
    connectors,
    auditLog,
    lastSyncedAt: summary.lastSyncedAt,
    defaults: {
      providers: CRM_PROVIDERS,
      syncFrequencies: WORKSPACE_INTEGRATION_SYNC_FREQUENCIES,
      environments: WORKSPACE_INTEGRATION_ENVIRONMENTS,
      statuses: WORKSPACE_INTEGRATION_STATUSES,
      incidentSeverities: WORKSPACE_INTEGRATION_INCIDENT_SEVERITIES,
      incidentStatuses: WORKSPACE_INTEGRATION_INCIDENT_STATUSES,
    },
  };
}

function validateStatus(nextStatus) {
  if (!WORKSPACE_INTEGRATION_STATUSES.includes(nextStatus)) {
    throw new ValidationError('Invalid integration status.');
  }
}

function validateSyncFrequency(frequency) {
  if (!WORKSPACE_INTEGRATION_SYNC_FREQUENCIES.includes(frequency)) {
    throw new ValidationError('Invalid sync frequency.');
  }
}

function validateEnvironment(environment) {
  if (!WORKSPACE_INTEGRATION_ENVIRONMENTS.includes(environment)) {
    throw new ValidationError('Invalid integration environment.');
  }
}

export async function updateCrmIntegration(workspaceId, providerKey, updates = {}, actor = {}) {
  const resolvedWorkspaceId = await resolveWorkspaceId({ workspaceId });
  const integration = await ensureIntegration(resolvedWorkspaceId, providerKey);
  const config = CRM_PROVIDERS[providerKey];

  const payload = {};
  const metadata = { ...(integration.metadata ?? {}) };
  const settings = { ...(integration.settings ?? {}) };

  if (updates.status) {
    validateStatus(updates.status);
    payload.status = updates.status;
  }
  if (updates.syncFrequency) {
    validateSyncFrequency(updates.syncFrequency);
    payload.syncFrequency = updates.syncFrequency;
    payload.nextSyncAt = computeNextSyncAt(updates.syncFrequency);
  }
  if (updates.environment) {
    validateEnvironment(updates.environment);
    payload.environment = updates.environment;
  }
  if (Array.isArray(updates.scopes)) {
    metadata.scopes = updates.scopes.filter((scope) => typeof scope === 'string' && scope.trim());
  }
  if (Array.isArray(updates.modules)) {
    metadata.modules = updates.modules.filter((module) => typeof module === 'string' && module.trim());
  }
  if (updates.owner) {
    metadata.owner = String(updates.owner).trim();
  }
  if (Array.isArray(updates.compliance)) {
    metadata.compliance = updates.compliance.filter((value) => typeof value === 'string' && value.trim());
  }
  if (Array.isArray(updates.regions)) {
    metadata.regions = updates.regions.filter((value) => typeof value === 'string' && value.trim());
  }
  if (updates.description) {
    metadata.description = String(updates.description).trim();
  }
  if (updates.settings && typeof updates.settings === 'object') {
    Object.assign(settings, updates.settings);
  }

  payload.metadata = metadata;
  payload.settings = settings;

  payload.lastSyncStatus = payload.status === 'connected' ? 'success' : integration.lastSyncStatus;

  await WorkspaceIntegration.update(payload, { where: { id: integration.id } });
  const reloaded = await loadIntegrationById(integration.id);
  await recordAuditEvent(
    integration.id,
    'integration_updated',
    actor,
    {
      status: payload.status ?? integration.status,
      syncFrequency: payload.syncFrequency ?? integration.syncFrequency,
      environment: payload.environment ?? integration.environment,
    },
  );

  return serializeIntegration(reloaded, config);
}

export async function rotateCrmIntegrationCredential(
  workspaceId,
  integrationId,
  { providerKey, secret, credentialType = 'api_key', expiresAt } = {},
  actor = {},
) {
  const resolvedWorkspaceId = await resolveWorkspaceId({ workspaceId });
  const integration = await loadIntegrationById(integrationId, { workspaceId: resolvedWorkspaceId });
  const config = CRM_PROVIDERS[providerKey ?? integration.providerKey];
  if (!config) {
    throw new ValidationError('Credential rotation is only supported for managed CRM connectors.');
  }

  const normalizedType = credentialType && WORKSPACE_INTEGRATION_CREDENTIAL_TYPES.includes(credentialType)
    ? credentialType
    : integration.authType === 'api_key'
    ? 'api_key'
    : integration.authType === 'service_account'
    ? 'service_account'
    : 'oauth_refresh_token';

  const nextAuthType =
    normalizedType === 'api_key'
      ? 'api_key'
      : normalizedType === 'service_account'
      ? 'service_account'
      : 'oauth';

  const secretDigest = digestSecret(secret);
  const fingerprint = `****-${secretDigest.slice(-8)}`;
  const expiresOn = expiresAt ? new Date(expiresAt) : null;

  await sequelize.transaction(async (transaction) => {
    await WorkspaceIntegrationCredential.create(
      {
        integrationId: integration.id,
        credentialType: normalizedType,
        secretDigest,
        fingerprint,
        expiresAt: expiresOn,
        createdById: normalizeActor(actor).id,
        metadata: { rotatedAt: new Date().toISOString() },
      },
      { transaction },
    );

    await WorkspaceIntegration.update(
      {
        status: 'connected',
        authType: WORKSPACE_INTEGRATION_AUTH_TYPES.includes(nextAuthType)
          ? nextAuthType
          : integration.authType,
        connectedAt: new Date(),
        lastSyncedAt: new Date(),
        lastSyncStatus: 'success',
        nextSyncAt: computeNextSyncAt(integration.syncFrequency),
      },
      { where: { id: integration.id }, transaction },
    );

    await recordAuditEvent(
      integration.id,
      'credential_rotated',
      actor,
      { credentialType: normalizedType, fingerprint },
      transaction,
    );
  });

  const reloaded = await loadIntegrationById(integration.id);
  return serializeIntegration(reloaded, config);
}

export async function updateCrmIntegrationFieldMappings(
  workspaceId,
  integrationId,
  providerKey,
  mappings = [],
  actor = {},
) {
  const resolvedWorkspaceId = await resolveWorkspaceId({ workspaceId });
  const integration = await loadIntegrationById(integrationId, { workspaceId: resolvedWorkspaceId });
  const config = CRM_PROVIDERS[providerKey ?? integration.providerKey];
  if (!config) {
    throw new ValidationError('Field mapping updates are only supported for managed CRM connectors.');
  }

  const sanitized = mappings
    .map((entry) => sanitizeFieldMapping(entry))
    .filter(Boolean);

  await sequelize.transaction(async (transaction) => {
    await WorkspaceIntegrationFieldMapping.destroy({ where: { integrationId: integration.id }, transaction });
    if (sanitized.length) {
      await WorkspaceIntegrationFieldMapping.bulkCreate(
        sanitized.map((entry) => ({ integrationId: integration.id, ...entry })),
        { transaction },
      );
    }
    await recordAuditEvent(
      integration.id,
      'field_mappings_updated',
      actor,
      { mappingCount: sanitized.length },
      transaction,
    );
  });

  const reloaded = await loadIntegrationById(integration.id);
  return serializeIntegration(reloaded, config);
}

export async function updateCrmIntegrationRoleAssignments(
  workspaceId,
  integrationId,
  providerKey,
  assignments = [],
  actor = {},
) {
  const resolvedWorkspaceId = await resolveWorkspaceId({ workspaceId });
  const integration = await loadIntegrationById(integrationId, { workspaceId: resolvedWorkspaceId });
  const config = CRM_PROVIDERS[providerKey ?? integration.providerKey];
  if (!config) {
    throw new ValidationError('Role assignment updates are only supported for managed CRM connectors.');
  }

  const sanitized = assignments
    .map((entry) => sanitizeRoleAssignment(entry, config.roleTemplates))
    .filter(Boolean);

  await sequelize.transaction(async (transaction) => {
    await WorkspaceIntegrationRoleAssignment.destroy({ where: { integrationId: integration.id }, transaction });
    if (sanitized.length) {
      await WorkspaceIntegrationRoleAssignment.bulkCreate(
        sanitized.map((entry) => ({ integrationId: integration.id, ...entry })),
        { transaction },
      );
    }
    await recordAuditEvent(
      integration.id,
      'role_assignments_updated',
      actor,
      { assignmentCount: sanitized.length },
      transaction,
    );
  });

  const reloaded = await loadIntegrationById(integration.id);
  return serializeIntegration(reloaded, config);
}

export async function triggerCrmIntegrationSync(
  workspaceId,
  integrationId,
  providerKey,
  { trigger = 'manual', notes = null } = {},
  actor = {},
) {
  const resolvedWorkspaceId = await resolveWorkspaceId({ workspaceId });
  const integration = await loadIntegrationById(integrationId, { workspaceId: resolvedWorkspaceId });
  const config = CRM_PROVIDERS[providerKey ?? integration.providerKey];
  if (!config) {
    throw new ValidationError('Manual sync is only supported for managed CRM connectors.');
  }

  const startedAt = new Date();
  const finishedAt = new Date();

  await sequelize.transaction(async (transaction) => {
    await WorkspaceIntegrationSyncRun.create(
      {
        integrationId: integration.id,
        status: 'success',
        trigger,
        triggeredById: normalizeActor(actor).id,
        startedAt,
        finishedAt,
        recordsProcessed: null,
        notes: notes ?? null,
      },
      { transaction },
    );

    await WorkspaceIntegration.update(
      {
        lastSyncedAt: finishedAt,
        lastSyncStatus: 'success',
        status: 'connected',
        nextSyncAt: computeNextSyncAt(integration.syncFrequency, finishedAt),
      },
      { where: { id: integration.id }, transaction },
    );

    await recordAuditEvent(
      integration.id,
      'sync_run_completed',
      actor,
      { trigger, startedAt, finishedAt },
      transaction,
    );
  });

  const reloaded = await loadIntegrationById(integration.id);
  return serializeIntegration(reloaded, config);
}

export async function createCrmIntegrationIncident(
  workspaceId,
  integrationId,
  providerKey,
  { severity = 'low', summary, description = null } = {},
  actor = {},
) {
  const resolvedWorkspaceId = await resolveWorkspaceId({ workspaceId });
  const integration = await loadIntegrationById(integrationId, { workspaceId: resolvedWorkspaceId });
  const config = CRM_PROVIDERS[providerKey ?? integration.providerKey];
  if (!config) {
    throw new ValidationError('Incidents can only be recorded for managed CRM connectors.');
  }
  if (!summary || !summary.trim()) {
    throw new ValidationError('Incident summary is required.');
  }
  if (!WORKSPACE_INTEGRATION_INCIDENT_SEVERITIES.includes(severity)) {
    throw new ValidationError('Invalid incident severity.');
  }

  await sequelize.transaction(async (transaction) => {
    await WorkspaceIntegrationIncident.create(
      {
        integrationId: integration.id,
        severity,
        status: 'open',
        summary: summary.trim(),
        description: description ? String(description).trim() : null,
      },
      { transaction },
    );

    await WorkspaceIntegration.update(
      {
        status: severity === 'low' ? integration.status : 'error',
        lastSyncStatus: severity === 'low' ? integration.lastSyncStatus : 'error',
      },
      { where: { id: integration.id }, transaction },
    );

    await recordAuditEvent(
      integration.id,
      'incident_opened',
      actor,
      { severity, summary: summary.trim() },
      transaction,
    );
  });

  const reloaded = await loadIntegrationById(integration.id);
  return serializeIntegration(reloaded, config);
}

export async function resolveCrmIntegrationIncident(
  workspaceId,
  integrationId,
  providerKey,
  incidentId,
  actor = {},
) {
  const resolvedWorkspaceId = await resolveWorkspaceId({ workspaceId });
  const integration = await loadIntegrationById(integrationId, { workspaceId: resolvedWorkspaceId });
  const config = CRM_PROVIDERS[providerKey ?? integration.providerKey];
  if (!config) {
    throw new ValidationError('Incident resolution is only supported for managed CRM connectors.');
  }

  const incident = await WorkspaceIntegrationIncident.findOne({
    where: { id: incidentId, integrationId: integration.id },
  });
  if (!incident) {
    throw new NotFoundError('Incident not found.');
  }

  await sequelize.transaction(async (transaction) => {
    await incident.update(
      {
        status: 'resolved',
        resolvedAt: new Date(),
      },
      { transaction },
    );

    const remainingOpen = await WorkspaceIntegrationIncident.count({
      where: {
        integrationId: integration.id,
        status: { [Op.ne]: 'resolved' },
      },
      transaction,
    });

    await WorkspaceIntegration.update(
      {
        status: remainingOpen ? 'error' : integration.status,
        lastSyncStatus: remainingOpen ? 'warning' : integration.lastSyncStatus,
      },
      { where: { id: integration.id }, transaction },
    );

    await recordAuditEvent(
      integration.id,
      'incident_resolved',
      actor,
      { incidentId },
      transaction,
    );
  });

  const reloaded = await loadIntegrationById(integration.id);
  return serializeIntegration(reloaded, config);
}

export default {
  listCompanyIntegrations,
  updateCrmIntegration,
  rotateCrmIntegrationCredential,
  updateCrmIntegrationFieldMappings,
  updateCrmIntegrationRoleAssignments,
  triggerCrmIntegrationSync,
  createCrmIntegrationIncident,
  resolveCrmIntegrationIncident,
};
