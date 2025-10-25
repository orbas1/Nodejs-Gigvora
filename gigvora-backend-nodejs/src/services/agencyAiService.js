import crypto from 'crypto';
import { Op } from 'sequelize';
import { AgencyAiConfiguration, AgencyAutoBidTemplate, ProviderWorkspace, ProviderWorkspaceMember } from '../models/index.js';
import { encryptSecret } from '../utils/secretVault.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

const ALLOWED_CHANNELS = ['direct', 'support', 'project', 'contract', 'group'];
const ALLOWED_BID_STATUSES = new Set(['active', 'paused', 'archived']);
const WORKSPACE_MANAGER_ROLES = new Set(['owner', 'lead', 'manager', 'admin', 'operator']);

function normaliseRole(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase();
}

function isPlatformAdmin(role) {
  const normalized = normaliseRole(role);
  return normalized === 'admin' || normalized === 'agency_admin' || normalized === 'superadmin';
}

function normalizeWorkspaceId(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('workspaceId must be a positive integer.');
  }
  return numeric;
}

function normalizeTemplateId(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('templateId must be a positive integer.');
  }
  return numeric;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (lowered === 'true' || lowered === '1' || lowered === 'yes') return true;
    if (lowered === 'false' || lowered === '0' || lowered === 'no') return false;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value !== 0;
  }
  return fallback;
}

function normalizeTemperature(value, fallback = 0.35) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0, Math.min(2, Math.round(numeric * 100) / 100));
}

function normalizeChannels(value, fallback = ['direct', 'support']) {
  const list = Array.isArray(value) ? value : [];
  const result = [];
  list.forEach((entry) => {
    if (typeof entry !== 'string') return;
    const normalized = entry.trim().toLowerCase();
    if (!ALLOWED_CHANNELS.includes(normalized)) return;
    if (!result.includes(normalized)) {
      result.push(normalized);
    }
  });
  if (result.length) {
    return result;
  }
  const fallbackList = Array.isArray(fallback) ? fallback : [];
  return fallbackList.filter((channel, index) => ALLOWED_CHANNELS.includes(channel) && fallbackList.indexOf(channel) === index);
}

function normalizeInteger(value, { min = null, max = null, fallback = null } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  const rounded = Math.round(numeric);
  if (min != null && rounded < min) {
    return min;
  }
  if (max != null && rounded > max) {
    return max;
  }
  return rounded;
}

function normalizeDecimal(value, { min = null, max = null, fallback = null } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  const bounded = min != null && numeric < min ? min : max != null && numeric > max ? max : numeric;
  return Math.round(bounded * 100) / 100;
}

function maskFingerprint(value) {
  if (!value) return null;
  const normalized = String(value);
  if (normalized.length <= 4) {
    return normalized.replace(/./g, '•');
  }
  return `•••• ${normalized.slice(-4)}`;
}

function ensureActivityLog(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return { activityLog: [] };
  }
  if (!Array.isArray(metadata.activityLog)) {
    return { ...metadata, activityLog: [] };
  }
  return metadata;
}

function appendActivity(metadata, entry) {
  const base = ensureActivityLog(metadata);
  const now = new Date();
  const record = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
    ...entry,
    createdAt: now.toISOString(),
  };
  const nextLog = [record, ...base.activityLog].slice(0, 40);
  return { ...base, activityLog: nextLog };
}

function toTemplatePublicObject(template) {
  if (!template) {
    return null;
  }
  if (typeof template.toPublicObject === 'function') {
    return template.toPublicObject();
  }

  const plain = typeof template.get === 'function' ? template.get({ plain: true }) : { ...template };

  return {
    id: plain.id ?? null,
    workspaceId: plain.workspaceId ?? null,
    name: plain.name ?? null,
    description: plain.description ?? null,
    status: plain.status ?? null,
    responseSlaHours: plain.responseSlaHours ?? null,
    deliveryWindowDays: plain.deliveryWindowDays ?? null,
    bidCeiling: plain.bidCeiling ?? null,
    markupPercent:
      plain.markupPercent == null ? null : Number.parseFloat(plain.markupPercent),
    targetRoles: Array.isArray(plain.targetRoles) ? [...plain.targetRoles] : [],
    scopeKeywords: Array.isArray(plain.scopeKeywords) ? [...plain.scopeKeywords] : [],
    guardrails: plain.guardrails ?? null,
    attachments: Array.isArray(plain.attachments) ? [...plain.attachments] : [],
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

async function listAccessibleWorkspaces(actorId, { includeInactive = false, allowGlobal = false } = {}) {
  if (!actorId) {
    if (!allowGlobal) {
      return [];
    }
  }
  const membershipQuery = actorId
    ? await ProviderWorkspaceMember.findAll({
        where: { userId: actorId, status: { [Op.in]: ['active'] } },
        include: [
          {
            model: ProviderWorkspace,
            as: 'workspace',
            required: true,
            where: includeInactive ? { type: 'agency' } : { type: 'agency', isActive: true },
          },
        ],
        order: [[{ model: ProviderWorkspace, as: 'workspace' }, 'name', 'ASC']],
      })
    : [];

  if (!membershipQuery.length && allowGlobal) {
    const workspaces = await ProviderWorkspace.findAll({
      where: includeInactive ? { type: 'agency' } : { type: 'agency', isActive: true },
      order: [['name', 'ASC']],
      limit: 20,
    });
    return workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: 'admin',
    }));
  }

  return membershipQuery
    .map((membership) => {
      const workspace = membership.workspace;
      if (!workspace) return null;
      const plain = workspace.get({ plain: true });
      return {
        id: plain.id,
        name: plain.name,
        slug: plain.slug,
        role: membership.role,
      };
    })
    .filter(Boolean);
}

async function resolveWorkspace({ workspaceId, workspaceSlug, actorId, actorRole }) {
  let targetId = workspaceId != null ? normalizeWorkspaceId(workspaceId) : null;
  let workspace = null;

  if (!targetId && workspaceSlug) {
    workspace = await ProviderWorkspace.findOne({
      where: { slug: workspaceSlug, type: 'agency' },
    });
    if (workspace) {
      targetId = workspace.id;
    }
  }

  if (!targetId && (actorId || isPlatformAdmin(actorRole))) {
    const memberships = await listAccessibleWorkspaces(actorId, {
      includeInactive: isPlatformAdmin(actorRole),
      allowGlobal: isPlatformAdmin(actorRole),
    });
    if (memberships.length) {
      targetId = memberships[0].id;
    }
  }

  if (!targetId) {
    throw new ValidationError('workspaceId is required.');
  }

  if (!workspace) {
    workspace = await ProviderWorkspace.findOne({ where: { id: targetId, type: 'agency' } });
  }

  if (!workspace) {
    throw new NotFoundError('Agency workspace not found.');
  }

  return workspace;
}

async function ensureWorkspaceAccess(workspace, { actorId, actorRole }) {
  if (!workspace) {
    throw new NotFoundError('Agency workspace not found.');
  }
  if (isPlatformAdmin(actorRole)) {
    return { role: 'admin' };
  }
  if (!actorId) {
    throw new AuthorizationError('Authentication required.');
  }
  const membership = await ProviderWorkspaceMember.findOne({
    where: { workspaceId: workspace.id, userId: actorId, status: { [Op.in]: ['active', 'owner', 'admin'] } },
  });
  if (!membership) {
    throw new AuthorizationError('You do not have access to this agency workspace.');
  }
  return membership;
}

function sanitizeConfiguration(config, workspace, templates, availableWorkspaces) {
  const metadata = ensureActivityLog(config.metadata ?? {});
  const analytics = config.analyticsSnapshot && typeof config.analyticsSnapshot === 'object' ? config.analyticsSnapshot : {};
  const defaultAnalytics = {
    autoRepliesLast7Days: 0,
    autoReplyMedianSeconds: 90,
    bidsSubmittedLast30Days: 0,
    bidWinRate: 0,
    avgBidTurnaroundMinutes: 60,
  };

  const response = {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    availableWorkspaces,
    autoReply: {
      enabled: Boolean(config.autoReplyEnabled),
      instructions: config.autoReplyInstructions ?? '',
      channels: Array.isArray(config.autoReplyChannels) ? config.autoReplyChannels : ['direct', 'support'],
      temperature:
        config.autoReplyTemperature == null ? 0.35 : Number.parseFloat(config.autoReplyTemperature) || 0.35,
      responseTimeGoalMinutes: config.autoReplyResponseTimeGoal ?? 5,
      model: config.defaultModel ?? 'gpt-4o-mini',
    },
    bidding: {
      enabled: Boolean(config.autoBidEnabled),
      strategy: config.autoBidStrategy ?? 'balanced',
      minBudget: config.autoBidMinBudget ?? null,
      maxBudget: config.autoBidMaxBudget ?? null,
      markupPercent: config.autoBidMarkup == null ? null : Number.parseFloat(config.autoBidMarkup),
      autoSubmit: Boolean(config.autoBidAutoSubmit),
      guardrails: config.autoBidGuardrails ?? {},
    },
    apiKey: {
      configured: Boolean(config.apiKeyCiphertext),
      fingerprint: config.apiKeyFingerprint ?? null,
      updatedAt: config.apiKeyUpdatedAt ? new Date(config.apiKeyUpdatedAt).toISOString() : null,
    },
    analytics: {
      ...defaultAnalytics,
      ...analytics,
      activeTemplates: templates.filter((template) => template.status === 'active').length,
    },
    templates: templates.map((template) => toTemplatePublicObject(template)).filter(Boolean),
    activityLog: metadata.activityLog,
  };

  response.settings = {
    autoReply: response.autoReply,
    bidding: response.bidding,
    apiKey: response.apiKey,
    analytics: response.analytics,
  };

  return response;
}

async function loadConfiguration(workspaceId) {
  const [config] = await AgencyAiConfiguration.findOrCreate({
    where: { workspaceId },
    defaults: {
      autoReplyChannels: ['direct', 'support'],
      autoReplyTemperature: 0.35,
      autoReplyResponseTimeGoal: 5,
      autoBidStrategy: 'balanced',
      autoBidGuardrails: { requireBriefReview: true, notifyOwner: true },
      analyticsSnapshot: {
        autoRepliesLast7Days: 0,
        autoReplyMedianSeconds: 90,
        bidsSubmittedLast30Days: 0,
        bidWinRate: 0,
        avgBidTurnaroundMinutes: 60,
      },
      metadata: { activityLog: [] },
    },
  });
  return config;
}

function normalizeGuardrails(payload, fallback = {}) {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }
  const guardrails = { ...fallback };
  if (Object.prototype.hasOwnProperty.call(payload, 'requireHumanReview')) {
    guardrails.requireHumanReview = normalizeBoolean(payload.requireHumanReview, fallback.requireHumanReview ?? true);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'notifyOwner')) {
    guardrails.notifyOwner = normalizeBoolean(payload.notifyOwner, fallback.notifyOwner ?? true);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'maxConcurrentBids')) {
    guardrails.maxConcurrentBids = normalizeInteger(payload.maxConcurrentBids, {
      min: 1,
      max: 25,
      fallback: fallback.maxConcurrentBids ?? 5,
    });
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'minRatingThreshold')) {
    guardrails.minRatingThreshold = normalizeDecimal(payload.minRatingThreshold, {
      min: 0,
      max: 5,
      fallback: fallback.minRatingThreshold ?? 4.2,
    });
  }
  return guardrails;
}

function normalizeTemplatePayload(payload = {}, defaults = {}) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name) {
    throw new ValidationError('Template name is required.');
  }
  const status = typeof payload.status === 'string' ? payload.status.trim().toLowerCase() : defaults.status ?? 'active';
  if (!ALLOWED_BID_STATUSES.has(status)) {
    throw new ValidationError('Invalid template status.');
  }
  return {
    name,
    description: typeof payload.description === 'string' ? payload.description.trim() : defaults.description ?? null,
    status,
    responseSlaHours: normalizeInteger(payload.responseSlaHours, { min: 1, max: 168, fallback: defaults.responseSlaHours }),
    deliveryWindowDays: normalizeInteger(payload.deliveryWindowDays, {
      min: 1,
      max: 365,
      fallback: defaults.deliveryWindowDays,
    }),
    bidCeiling: normalizeInteger(payload.bidCeiling, { min: 0, max: 1000000, fallback: defaults.bidCeiling ?? null }),
    markupPercent: normalizeDecimal(payload.markupPercent, { min: 0, max: 400, fallback: defaults.markupPercent ?? 25 }),
    targetRoles: Array.isArray(payload.targetRoles)
      ? payload.targetRoles.filter((role) => typeof role === 'string' && role.trim())
      : defaults.targetRoles ?? [],
    scopeKeywords: Array.isArray(payload.scopeKeywords)
      ? payload.scopeKeywords.filter((keyword) => typeof keyword === 'string' && keyword.trim())
      : defaults.scopeKeywords ?? [],
    guardrails: normalizeGuardrails(payload.guardrails, defaults.guardrails ?? {}),
    attachments: Array.isArray(payload.attachments)
      ? payload.attachments.filter((attachment) => typeof attachment === 'string' && attachment.trim())
      : defaults.attachments ?? [],
  };
}

function computeApiKeyUpdates(payload, config) {
  const updates = {};
  if (Object.prototype.hasOwnProperty.call(payload, 'apiKey')) {
    const apiKey = payload.apiKey;
    if (apiKey == null || apiKey === '') {
      updates.apiKeyCiphertext = null;
      updates.apiKeyDigest = null;
      updates.apiKeyFingerprint = null;
      updates.apiKeyUpdatedAt = new Date();
      return updates;
    }
    const trimmed = String(apiKey).trim();
    if (trimmed.length < 16) {
      throw new ValidationError('API key must be at least 16 characters.');
    }
    const digest = crypto.createHash('sha256').update(trimmed).digest('hex');
    const fingerprint = maskFingerprint(trimmed);
    updates.apiKeyCiphertext = encryptSecret(trimmed);
    updates.apiKeyDigest = digest;
    updates.apiKeyFingerprint = fingerprint;
    updates.apiKeyUpdatedAt = new Date();
    return updates;
  }
  if (normalizeBoolean(payload.removeApiKey, false)) {
    if (config.apiKeyCiphertext) {
      updates.apiKeyCiphertext = null;
      updates.apiKeyDigest = null;
      updates.apiKeyFingerprint = null;
      updates.apiKeyUpdatedAt = new Date();
    }
  }
  return updates;
}

export async function getAgencyAiControl(payload = {}, actor = {}) {
  const workspace = await resolveWorkspace(payload, actor);
  await ensureWorkspaceAccess(workspace, actor);
  const config = await loadConfiguration(workspace.id);
  const templates = await AgencyAutoBidTemplate.findAll({
    where: { workspaceId: workspace.id },
    order: [['name', 'ASC']],
  });
  const availableWorkspaces = await listAccessibleWorkspaces(actor.actorId ?? actor.id ?? null, {
    includeInactive: isPlatformAdmin(actor.actorRole),
    allowGlobal: isPlatformAdmin(actor.actorRole),
  });
  return sanitizeConfiguration(config, workspace, templates, availableWorkspaces);
}

export async function updateAgencyAiSettings(payload = {}, actor = {}) {
  const workspace = await resolveWorkspace(payload, actor);
  const membership = await ensureWorkspaceAccess(workspace, actor);
  const config = await loadConfiguration(workspace.id);

  const membershipRole = normaliseRole(membership.role);
  if (!WORKSPACE_MANAGER_ROLES.has(membershipRole) && !isPlatformAdmin(actor.actorRole)) {
    throw new AuthorizationError('You do not have permission to update automation settings.');
  }

  const updates = {};
  const autoReply = payload.autoReply ?? {};
  if (autoReply) {
    updates.autoReplyEnabled = normalizeBoolean(autoReply.enabled, config.autoReplyEnabled);
    if (Object.prototype.hasOwnProperty.call(autoReply, 'instructions')) {
      if (typeof autoReply.instructions === 'string') {
        const trimmed = autoReply.instructions.trim();
        updates.autoReplyInstructions = trimmed ? trimmed.slice(0, 2000) : null;
      } else {
        updates.autoReplyInstructions = config.autoReplyInstructions ?? null;
      }
    }
    if (Object.prototype.hasOwnProperty.call(autoReply, 'channels')) {
      updates.autoReplyChannels = normalizeChannels(autoReply.channels, config.autoReplyChannels ?? ['direct', 'support']);
    }
    if (Object.prototype.hasOwnProperty.call(autoReply, 'temperature')) {
      updates.autoReplyTemperature = normalizeTemperature(autoReply.temperature, config.autoReplyTemperature ?? 0.35);
    }
    if (Object.prototype.hasOwnProperty.call(autoReply, 'responseTimeGoalMinutes')) {
      updates.autoReplyResponseTimeGoal = normalizeInteger(autoReply.responseTimeGoalMinutes, {
        min: 1,
        max: 240,
        fallback: config.autoReplyResponseTimeGoal ?? 5,
      });
    }
    if (Object.prototype.hasOwnProperty.call(autoReply, 'model')) {
      const model = typeof autoReply.model === 'string' ? autoReply.model.trim() : '';
      if (model) {
        updates.defaultModel = model.slice(0, 120);
      }
    }
  }

  const bidding = payload.bidding ?? {};
  if (bidding) {
    updates.autoBidEnabled = normalizeBoolean(bidding.enabled, config.autoBidEnabled);
    if (Object.prototype.hasOwnProperty.call(bidding, 'strategy')) {
      const strategy = typeof bidding.strategy === 'string' ? bidding.strategy.trim().toLowerCase() : '';
      updates.autoBidStrategy = strategy || config.autoBidStrategy || 'balanced';
    }
    if (Object.prototype.hasOwnProperty.call(bidding, 'minBudget')) {
      updates.autoBidMinBudget = normalizeInteger(bidding.minBudget, { min: 0, max: 1000000, fallback: null });
    }
    if (Object.prototype.hasOwnProperty.call(bidding, 'maxBudget')) {
      updates.autoBidMaxBudget = normalizeInteger(bidding.maxBudget, { min: 0, max: 5000000, fallback: null });
    }
    if (
      updates.autoBidMinBudget != null &&
      updates.autoBidMaxBudget != null &&
      updates.autoBidMaxBudget < updates.autoBidMinBudget
    ) {
      updates.autoBidMaxBudget = updates.autoBidMinBudget;
    }
    if (Object.prototype.hasOwnProperty.call(bidding, 'markupPercent')) {
      updates.autoBidMarkup = normalizeDecimal(bidding.markupPercent, {
        min: 0,
        max: 400,
        fallback: config.autoBidMarkup ?? 25,
      });
    }
    if (Object.prototype.hasOwnProperty.call(bidding, 'autoSubmit')) {
      updates.autoBidAutoSubmit = normalizeBoolean(bidding.autoSubmit, config.autoBidAutoSubmit ?? false);
    }
    if (Object.prototype.hasOwnProperty.call(bidding, 'guardrails')) {
      updates.autoBidGuardrails = normalizeGuardrails(bidding.guardrails, config.autoBidGuardrails ?? {});
    }
  }

  if (payload.analytics && typeof payload.analytics === 'object') {
    updates.analyticsSnapshot = {
      ...(config.analyticsSnapshot && typeof config.analyticsSnapshot === 'object' ? config.analyticsSnapshot : {}),
      ...payload.analytics,
    };
  }

  Object.assign(updates, computeApiKeyUpdates(payload, config));

  const metadata = appendActivity(config.metadata ?? {}, {
    type: 'settings_update',
    actorId: actor.actorId ?? actor.id ?? null,
    summary: 'Automation settings updated',
  });
  updates.metadata = metadata;

  await config.update(updates);
  const templates = await AgencyAutoBidTemplate.findAll({ where: { workspaceId: workspace.id }, order: [['name', 'ASC']] });
  const availableWorkspaces = await listAccessibleWorkspaces(actor.actorId ?? actor.id ?? null, {
    includeInactive: isPlatformAdmin(actor.actorRole),
    allowGlobal: isPlatformAdmin(actor.actorRole),
  });
  return sanitizeConfiguration(config, workspace, templates, availableWorkspaces);
}

export async function createAgencyBidTemplate(payload = {}, actor = {}) {
  const workspace = await resolveWorkspace(payload, actor);
  const membership = await ensureWorkspaceAccess(workspace, actor);
  if (!WORKSPACE_MANAGER_ROLES.has(normaliseRole(membership.role)) && !isPlatformAdmin(actor.actorRole)) {
    throw new AuthorizationError('You do not have permission to create templates.');
  }
  const config = await loadConfiguration(workspace.id);
  const normalized = normalizeTemplatePayload(payload, {});
  const template = await AgencyAutoBidTemplate.create({
    workspaceId: workspace.id,
    ...normalized,
    createdBy: actor.actorId ?? actor.id ?? null,
    updatedBy: actor.actorId ?? actor.id ?? null,
  });
  const metadata = appendActivity(config.metadata ?? {}, {
    type: 'template_created',
    actorId: actor.actorId ?? actor.id ?? null,
    summary: `Template ${template.name} created`,
  });
  await config.update({ metadata });
  return toTemplatePublicObject(template);
}

export async function updateAgencyBidTemplate(templateId, payload = {}, actor = {}) {
  const numericTemplateId = normalizeTemplateId(templateId);
  const template = await AgencyAutoBidTemplate.findByPk(numericTemplateId);
  if (!template) {
    throw new NotFoundError('Template not found.');
  }
  const workspace = await ProviderWorkspace.findByPk(template.workspaceId);
  if (!workspace) {
    throw new NotFoundError('Agency workspace not found.');
  }
  const membership = await ensureWorkspaceAccess(workspace, actor);
  if (!WORKSPACE_MANAGER_ROLES.has(normaliseRole(membership.role)) && !isPlatformAdmin(actor.actorRole)) {
    throw new AuthorizationError('You do not have permission to update templates.');
  }
  const normalized = normalizeTemplatePayload(payload, template.get({ plain: true }));
  await template.update({ ...normalized, updatedBy: actor.actorId ?? actor.id ?? null });
  const config = await loadConfiguration(workspace.id);
  const metadata = appendActivity(config.metadata ?? {}, {
    type: 'template_updated',
    actorId: actor.actorId ?? actor.id ?? null,
    summary: `Template ${template.name} updated`,
  });
  await config.update({ metadata });
  return toTemplatePublicObject(template);
}

export async function deleteAgencyBidTemplate(templateId, actor = {}) {
  const numericTemplateId = normalizeTemplateId(templateId);
  const template = await AgencyAutoBidTemplate.findByPk(numericTemplateId);
  if (!template) {
    return { success: true };
  }
  const workspace = await ProviderWorkspace.findByPk(template.workspaceId);
  if (!workspace) {
    throw new NotFoundError('Agency workspace not found.');
  }
  const membership = await ensureWorkspaceAccess(workspace, actor);
  if (!WORKSPACE_MANAGER_ROLES.has(normaliseRole(membership.role)) && !isPlatformAdmin(actor.actorRole)) {
    throw new AuthorizationError('You do not have permission to delete templates.');
  }
  await template.destroy();
  const config = await loadConfiguration(workspace.id);
  const metadata = appendActivity(config.metadata ?? {}, {
    type: 'template_deleted',
    actorId: actor.actorId ?? actor.id ?? null,
    summary: `Template ${template.name} deleted`,
  });
  await config.update({ metadata });
  return { success: true };
}

export default {
  getAgencyAiControl,
  updateAgencyAiSettings,
  createAgencyBidTemplate,
  updateAgencyBidTemplate,
  deleteAgencyBidTemplate,
};
