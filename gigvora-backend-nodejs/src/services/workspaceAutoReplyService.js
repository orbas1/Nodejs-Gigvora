import { Op } from 'sequelize';
import { AiAutoReplyRun, AiAutoReplyTemplate, AUTO_REPLY_TEMPLATE_STATUSES } from '../models/messagingModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import {
  getUserOpenAiSettings,
  updateUserOpenAiSettings,
  generateAutoReplyPreview,
} from './aiAutoReplyService.js';

const TEMPLATE_CHANNELS = ['direct', 'support', 'project', 'contract', 'group'];
const MAX_INSTRUCTIONS_LENGTH = 4000;
const MAX_SAMPLE_LENGTH = 2000;

function coerceOptionalString(value, fallback = null) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (typeof value === 'number') {
    return `${value}`;
  }
  return fallback;
}

function coerceBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no'].includes(lowered)) {
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

function coerceTemperature(value, fallback = 0.35) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0, Math.min(2, Math.round(numeric * 100) / 100));
}

function normalizeChannels(channels, fallback = ['direct', 'support']) {
  const input = Array.isArray(channels) ? channels : [];
  const normalised = [];
  input.forEach((value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim().toLowerCase();
    if (!TEMPLATE_CHANNELS.includes(trimmed)) return;
    if (!normalised.includes(trimmed)) {
      normalised.push(trimmed);
    }
  });
  if (normalised.length) {
    return normalised;
  }
  const fallbackList = Array.isArray(fallback) ? fallback : TEMPLATE_CHANNELS;
  return fallbackList.filter((channel, index) => fallbackList.indexOf(channel) === index);
}

function trimInstructions(value, limit = MAX_INSTRUCTIONS_LENGTH) {
  const normalized = coerceOptionalString(value, '');
  if (!normalized) {
    return '';
  }
  return normalized.slice(0, limit);
}

function trimSample(value) {
  const normalized = coerceOptionalString(value, null);
  if (!normalized) {
    return null;
  }
  return normalized.slice(0, MAX_SAMPLE_LENGTH);
}

function sanitizeTemplate(record) {
  if (!record) {
    return null;
  }
  if (typeof record.toPublicObject === 'function') {
    return record.toPublicObject();
  }
  const plain = record.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    ownerId: plain.ownerId,
    title: plain.title,
    summary: plain.summary ?? null,
    tone: plain.tone ?? null,
    model: plain.model ?? null,
    temperature: plain.temperature ?? 0.35,
    channels: Array.isArray(plain.channels) ? plain.channels : [],
    instructions: plain.instructions ?? '',
    sampleReply: plain.sampleReply ?? null,
    isDefault: Boolean(plain.isDefault),
    status: plain.status,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function sanitizeRun(record) {
  if (!record) {
    return null;
  }
  if (typeof record.toPublicObject === 'function') {
    return record.toPublicObject();
  }
  const plain = record.get({ plain: true });
  return {
    id: plain.id,
    templateId: plain.templateId,
    workspaceId: plain.workspaceId,
    userId: plain.userId,
    threadId: plain.threadId,
    messageId: plain.messageId,
    provider: plain.provider,
    model: plain.model,
    status: plain.status,
    responseLatencyMs: plain.responseLatencyMs ?? null,
    responsePreview: plain.responsePreview ?? null,
    errorMessage: plain.errorMessage ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function assertUser(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('A valid userId is required.');
  }
  return numeric;
}

function resolveWorkspaceId(workspaceId) {
  if (workspaceId == null || workspaceId === '') {
    return null;
  }
  const numeric = Number(workspaceId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('workspaceId must be a positive integer when provided.');
  }
  return numeric;
}

function normalizeTemplatePayload(payload = {}, existing = {}) {
  const title = coerceOptionalString(payload.title, existing.title);
  const summary = coerceOptionalString(payload.summary, existing.summary ?? null);
  const tone = coerceOptionalString(payload.tone, existing.tone ?? null);
  const model = coerceOptionalString(payload.model, existing.model ?? null);
  const instructions = trimInstructions(payload.instructions ?? existing.instructions ?? '');
  const sampleReply = trimSample(payload.sampleReply ?? existing.sampleReply ?? null);
  const temperature = coerceTemperature(payload.temperature, existing.temperature ?? 0.35);
  const channels = normalizeChannels(payload.channels ?? existing.channels, existing.channels ?? TEMPLATE_CHANNELS);
  const status = coerceOptionalString(payload.status, existing.status ?? 'active');
  const isDefault = coerceBoolean(payload.isDefault, existing.isDefault ?? false);

  if (!title) {
    throw new ValidationError('Template title is required.');
  }
  if (!instructions) {
    throw new ValidationError('Template instructions are required.');
  }
  if (status && !AUTO_REPLY_TEMPLATE_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${AUTO_REPLY_TEMPLATE_STATUSES.join(', ')}`);
  }

  return {
    title: title.slice(0, 120),
    summary: summary ? summary.slice(0, 280) : null,
    tone: tone ? tone.slice(0, 40) : null,
    model: model ? model.slice(0, 120) : null,
    instructions,
    sampleReply,
    temperature,
    channels,
    status: status ?? 'active',
    isDefault,
  };
}

async function enforceDefaultTemplate(ownerId, workspaceId, templateId) {
  await AiAutoReplyTemplate.update(
    { isDefault: false },
    {
      where: {
        ownerId,
        id: { [Op.ne]: templateId },
        ...(workspaceId ? { workspaceId } : {}),
      },
    },
  );
}

export async function getWorkspaceAutoReplyOverview({ userId, workspaceId }) {
  const ownerId = assertUser(userId);
  const resolvedWorkspaceId = resolveWorkspaceId(workspaceId);

  const [settings, templates, activity, totals] = await Promise.all([
    getUserOpenAiSettings(ownerId),
    AiAutoReplyTemplate.findAll({
      where: {
        ownerId,
        ...(resolvedWorkspaceId ? { [Op.or]: [{ workspaceId: resolvedWorkspaceId }, { workspaceId: null }] } : {}),
      },
      order: [
        ['isDefault', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
      limit: 40,
    }),
    AiAutoReplyRun.findAll({
      where: {
        userId: ownerId,
        ...(resolvedWorkspaceId ? { workspaceId: resolvedWorkspaceId } : {}),
      },
      order: [['createdAt', 'DESC']],
      limit: 20,
    }),
    AiAutoReplyTemplate.count({
      where: {
        ownerId,
        ...(resolvedWorkspaceId ? { workspaceId: resolvedWorkspaceId } : {}),
      },
    }),
  ]);

  const activeTemplates = templates.filter((template) => template.status === 'active').length;

  return {
    settings,
    templates: templates.map((template) => sanitizeTemplate(template)),
    stats: {
      totalTemplates: totals,
      activeTemplates,
      recentRuns: activity.length,
      lastTestedAt: settings?.connection?.lastTestedAt ?? null,
    },
    activity: activity.map((run) => sanitizeRun(run)),
  };
}

export async function listWorkspaceTemplates({ userId, workspaceId }) {
  const ownerId = assertUser(userId);
  const resolvedWorkspaceId = resolveWorkspaceId(workspaceId);
  const templates = await AiAutoReplyTemplate.findAll({
    where: {
      ownerId,
      ...(resolvedWorkspaceId ? { [Op.or]: [{ workspaceId: resolvedWorkspaceId }, { workspaceId: null }] } : {}),
    },
    order: [
      ['isDefault', 'DESC'],
      ['updatedAt', 'DESC'],
    ],
  });
  return templates.map((template) => sanitizeTemplate(template));
}

export async function createWorkspaceTemplate({ userId, workspaceId, payload }) {
  const ownerId = assertUser(userId);
  const resolvedWorkspaceId = resolveWorkspaceId(workspaceId);
  const normalised = normalizeTemplatePayload(payload);

  const record = await AiAutoReplyTemplate.create({
    ownerId,
    workspaceId: resolvedWorkspaceId,
    ...normalised,
  });

  if (normalised.isDefault) {
    await enforceDefaultTemplate(ownerId, resolvedWorkspaceId, record.id);
  }

  return sanitizeTemplate(record);
}

export async function updateWorkspaceTemplate({ userId, workspaceId, templateId, payload }) {
  const ownerId = assertUser(userId);
  const resolvedWorkspaceId = resolveWorkspaceId(workspaceId);
  const numericTemplateId = Number(templateId);
  if (!Number.isInteger(numericTemplateId) || numericTemplateId <= 0) {
    throw new ValidationError('templateId must be a positive integer.');
  }

  const existing = await AiAutoReplyTemplate.findOne({
    where: {
      id: numericTemplateId,
      ownerId,
      ...(resolvedWorkspaceId ? { [Op.or]: [{ workspaceId: resolvedWorkspaceId }, { workspaceId: null }] } : {}),
    },
  });

  if (!existing) {
    throw new NotFoundError('Template not found.');
  }

  const normalised = normalizeTemplatePayload(payload, existing);
  await existing.update(normalised);

  if (normalised.isDefault) {
    await enforceDefaultTemplate(ownerId, resolvedWorkspaceId, existing.id);
  }

  return sanitizeTemplate(existing);
}

export async function deleteWorkspaceTemplate({ userId, workspaceId, templateId }) {
  const ownerId = assertUser(userId);
  const resolvedWorkspaceId = resolveWorkspaceId(workspaceId);
  const numericTemplateId = Number(templateId);
  if (!Number.isInteger(numericTemplateId) || numericTemplateId <= 0) {
    throw new ValidationError('templateId must be a positive integer.');
  }

  const deleted = await AiAutoReplyTemplate.destroy({
    where: {
      id: numericTemplateId,
      ownerId,
      ...(resolvedWorkspaceId ? { workspaceId: resolvedWorkspaceId } : {}),
    },
  });

  if (!deleted) {
    throw new NotFoundError('Template not found or already removed.');
  }

  return { success: true };
}

export async function updateWorkspaceProviderSettings({ userId, payload }) {
  const ownerId = assertUser(userId);
  const settings = await updateUserOpenAiSettings(ownerId, payload);
  return settings;
}

export async function generateWorkspaceAutoReplyPreview({ userId, payload }) {
  const ownerId = assertUser(userId);
  const preview = await generateAutoReplyPreview(ownerId, payload);
  return preview;
}

export default {
  getWorkspaceAutoReplyOverview,
  listWorkspaceTemplates,
  createWorkspaceTemplate,
  updateWorkspaceTemplate,
  deleteWorkspaceTemplate,
  updateWorkspaceProviderSettings,
  generateWorkspaceAutoReplyPreview,
};
