import { Op } from 'sequelize';
import {
  AiAutoReplyRun,
  Message,
  MessageParticipant,
  MessageThread,
  User,
  UserAiProviderSetting,
} from '../models/messagingModels.js';
import { ValidationError } from '../utils/errors.js';
import { decryptSecret, encryptSecret, fingerprintSecret } from '../utils/secretStorage.js';

const SUPPORTED_PROVIDERS = new Set(['openai']);
const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';
const DEFAULT_CHANNELS = ['direct', 'support'];
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const VALID_CHANNELS = new Set(['direct', 'support', 'project', 'contract', 'group']);
const DEFAULT_TEMPERATURE = 0.35;
const MAX_INSTRUCTIONS_LENGTH = 2000;

let cachedFetch = null;

function coerceBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (lowered === 'true' || lowered === '1') return true;
    if (lowered === 'false' || lowered === '0') return false;
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value !== 0;
    }
  }
  return fallback;
}

function coerceOptionalString(value, fallback = null) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return fallback;
}

function coerceModel(value, fallback = DEFAULT_MODEL) {
  const normalized = coerceOptionalString(value, fallback) || DEFAULT_MODEL;
  return normalized.slice(0, 120);
}

function coerceTemperature(value, fallback = DEFAULT_TEMPERATURE) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  const bounded = Math.max(0, Math.min(numeric, 2));
  return Math.round(bounded * 100) / 100;
}

function normalizeChannels(values, fallback = DEFAULT_CHANNELS) {
  const input = Array.isArray(values) ? values : [];
  const normalized = [];
  input.forEach((value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim().toLowerCase();
    if (!VALID_CHANNELS.has(trimmed)) return;
    if (!normalized.includes(trimmed)) {
      normalized.push(trimmed);
    }
  });
  if (normalized.length) {
    return normalized;
  }
  const fallbackList = Array.isArray(fallback) ? fallback : DEFAULT_CHANNELS;
  return fallbackList.filter((channel, index) => VALID_CHANNELS.has(channel) && fallbackList.indexOf(channel) === index);
}

function trimInstructions(value, fallback = '') {
  const normalized = coerceOptionalString(value, fallback) || '';
  return normalized.slice(0, MAX_INSTRUCTIONS_LENGTH);
}

function extractAutoReplySettings(record) {
  if (!record) {
    return {
      enabled: false,
      instructions: '',
      channels: DEFAULT_CHANNELS,
      temperature: DEFAULT_TEMPERATURE,
    };
  }
  const metadata = record.metadata && typeof record.metadata === 'object' ? record.metadata : {};
  const channels = normalizeChannels(metadata.autoReplyChannels, DEFAULT_CHANNELS);
  const temperature = coerceTemperature(metadata.autoReplyTemperature, DEFAULT_TEMPERATURE);
  return {
    enabled: Boolean(record.autoReplyEnabled),
    instructions: trimInstructions(record.autoReplyInstructions ?? ''),
    channels,
    temperature,
  };
}

function sanitizeSetting(record) {
  const autoReplies = extractAutoReplySettings(record);
  return {
    id: record.id,
    userId: record.userId,
    provider: record.provider,
    model: record.model || DEFAULT_MODEL,
    autoReplies,
    apiKey: {
      configured: Boolean(record.apiKey),
      fingerprint: record.apiKey ? fingerprintSecret(record.apiKey) : null,
      updatedAt: record.updatedAt ?? record.createdAt ?? null,
    },
    connection: {
      baseUrl: record.metadata?.baseUrl || DEFAULT_BASE_URL,
      lastTestedAt: record.metadata?.lastTestedAt ?? null,
    },
    workspaceId: record.metadata?.workspaceId ?? null,
  };
}

function buildDefaultResponse() {
  return {
    provider: 'openai',
    model: DEFAULT_MODEL,
    autoReplies: {
      enabled: false,
      instructions: '',
      channels: DEFAULT_CHANNELS,
      temperature: DEFAULT_TEMPERATURE,
    },
    apiKey: {
      configured: false,
      fingerprint: null,
      updatedAt: null,
    },
    connection: {
      baseUrl: DEFAULT_BASE_URL,
      lastTestedAt: null,
    },
    workspaceId: null,
  };
}

async function resolveFetch() {
  if (typeof fetch === 'function') {
    return fetch;
  }
  if (!cachedFetch) {
    const mod = await import('node-fetch');
    cachedFetch = mod.default ?? mod;
  }
  return cachedFetch;
}

function logError(message, error, context = {}) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  // eslint-disable-next-line no-console
  console.error(`[aiAutoReplyService] ${message}`, {
    ...context,
    error: error?.message ?? error,
  });
}

function isAutoReplyMessage(message) {
  if (!message?.metadata || typeof message.metadata !== 'object') {
    return false;
  }
  return Boolean(message.metadata.autoReply);
}

function normalizeProvider(value, fallback = 'openai') {
  const candidate = coerceOptionalString(value, fallback)?.toLowerCase();
  if (!candidate || !SUPPORTED_PROVIDERS.has(candidate)) {
    throw new ValidationError(`Unsupported AI provider "${value}".`);
  }
  return candidate;
}

function normalizeBaseUrl(value, fallback = DEFAULT_BASE_URL) {
  const candidate = coerceOptionalString(value, fallback) || fallback;
  try {
    const url = new URL(candidate);
    return url.toString().replace(/\/$/, '');
  } catch (error) {
    throw new ValidationError('baseUrl must be a valid URL.');
  }
}

function normalizeAutoReplyPayload(input = {}, fallback = {}) {
  const enabled = coerceBoolean(input.enabled, fallback.enabled ?? false);
  const instructions = trimInstructions(input.instructions, fallback.instructions ?? '');
  const channels = normalizeChannels(input.channels ?? fallback.channels ?? DEFAULT_CHANNELS, fallback.channels ?? DEFAULT_CHANNELS);
  const temperature = coerceTemperature(input.temperature, fallback.temperature ?? DEFAULT_TEMPERATURE);
  return { enabled, instructions, channels, temperature };
}

export async function getUserOpenAiSettings(userId) {
  const numericId = Number(userId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }

  const record = await UserAiProviderSetting.findOne({
    where: { userId: numericId, provider: 'openai' },
  });
  if (!record) {
    return buildDefaultResponse();
  }
  return sanitizeSetting(record);
}

export async function updateUserOpenAiSettings(userId, payload = {}) {
  const numericId = Number(userId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }

  const provider = normalizeProvider(payload.provider, 'openai');
  const existing = await UserAiProviderSetting.findOne({ where: { userId: numericId, provider } });
  const fallback = extractAutoReplySettings(existing);
  const autoReplies = normalizeAutoReplyPayload(payload.autoReplies ?? {}, fallback);
  const model = coerceModel(payload.model, existing?.model ?? DEFAULT_MODEL);
  const baseUrl = normalizeBaseUrl(payload.connection?.baseUrl ?? existing?.metadata?.baseUrl, DEFAULT_BASE_URL);
  const workspaceIdValue = payload.workspaceId ?? payload.connection?.workspaceId ?? existing?.metadata?.workspaceId;
  const numericWorkspaceId =
    workspaceIdValue == null || workspaceIdValue === ''
      ? null
      : Number.isFinite(Number(workspaceIdValue)) && Number(workspaceIdValue) > 0
        ? Number(workspaceIdValue)
        : null;

  const updates = {
    userId: numericId,
    provider,
    model,
    autoReplyEnabled: Boolean(autoReplies.enabled),
    autoReplyInstructions: autoReplies.instructions || null,
    metadata: {
      ...(existing?.metadata && typeof existing.metadata === 'object' ? existing.metadata : {}),
      autoReplyChannels: autoReplies.channels,
      autoReplyTemperature: autoReplies.temperature,
      baseUrl,
    },
  };

  if (numericWorkspaceId != null) {
    updates.metadata.workspaceId = numericWorkspaceId;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'apiKey')) {
    if (payload.apiKey == null || payload.apiKey === '') {
      updates.apiKey = null;
    } else {
      const trimmed = coerceOptionalString(payload.apiKey);
      if (!trimmed || trimmed.length < 8) {
        throw new ValidationError('apiKey must be at least 8 characters when provided.');
      }
      updates.apiKey = encryptSecret(trimmed);
    }
  }

  let record;
  if (existing) {
    await existing.update(updates);
    record = existing;
  } else {
    record = await UserAiProviderSetting.create(updates);
  }

  return sanitizeSetting(record);
}

function buildSystemPrompt(user = {}, thread = {}, autoReplies = {}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'the recipient';
  let prompt = `You are ${fullName}, responding inside the GigVora workspace. Provide concise, considerate, and professional replies in the first person.`;
  if (thread.subject) {
    prompt += ` The conversation subject is "${thread.subject}".`;
  }
  if (autoReplies.instructions) {
    prompt += ` Follow these personal preferences: ${autoReplies.instructions}`;
  }
  prompt += ' If information is missing, ask clarifying questions instead of assuming. Keep replies under 8 sentences and include specific next steps when helpful.';
  return prompt;
}

async function buildConversationHistory(threadId, userId, skipMessageId, limit = 12) {
  const records = await Message.findAll({
    where: { threadId },
    order: [['createdAt', 'DESC']],
    limit: limit + 4,
  });

  return records
    .filter((record) => record.id !== skipMessageId)
    .reverse()
    .map((record) => {
      if (record.messageType !== 'text') return null;
      const body = coerceOptionalString(record.body, '') || '';
      if (!body.trim()) return null;
      if (isAutoReplyMessage(record)) return null;
      const role = record.senderId === userId ? 'assistant' : 'user';
      return { role, content: body };
    })
    .filter(Boolean)
    .slice(-limit);
}

async function callOpenAi(apiKey, { model, messages, temperature, baseUrl = DEFAULT_BASE_URL }) {
  if (!apiKey || !messages.length) {
    return null;
  }

  if (process.env.NODE_ENV === 'test') {
    const latest = messages[messages.length - 1];
    const preview = latest?.content ? String(latest.content).slice(0, 120) : '';
    return preview ? `(auto-reply) ${preview}` : '(auto-reply) Thanks for the update!';
  }

  const fetchImpl = await resolveFetch();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 320,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    return null;
  }
  return content.trim();
}

async function processSettingAutoReply(setting, { thread, message, participantsByUserId }) {
  const autoReplies = extractAutoReplySettings(setting);
  if (!autoReplies.enabled) return;
  if (!setting.apiKey) return;
  if (!autoReplies.channels.includes(thread.channelType)) return;

  const participant = participantsByUserId.get(setting.userId);
  if (!participant || !participant.user) return;

  const history = await buildConversationHistory(thread.id, setting.userId, message.id, 12);
  const systemPrompt = buildSystemPrompt(participant.user, thread, autoReplies);
  const messages = [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message.body }];

  const decryptedKey = decryptSecret(setting.apiKey);
  const baseUrl = setting.metadata?.baseUrl || DEFAULT_BASE_URL;

  const startedAt = Date.now();
  let status = 'success';
  let reply = null;
  let errorMessage = null;

  try {
    reply = await callOpenAi(decryptedKey, {
      model: setting.model || DEFAULT_MODEL,
      messages,
      temperature: autoReplies.temperature,
      baseUrl,
    });
    if (!reply) {
      status = 'skipped';
      return;
    }
  } catch (error) {
    status = 'error';
    errorMessage = error?.message ?? 'Unknown error';
    throw error;
  } finally {
    try {
      await AiAutoReplyRun.create({
        workspaceId: setting.metadata?.workspaceId ?? null,
        userId: setting.userId,
        threadId: thread.id,
        messageId: message.id,
        provider: setting.provider,
        model: setting.model || DEFAULT_MODEL,
        status,
        responseLatencyMs: Date.now() - startedAt,
        responsePreview: reply ? reply.slice(0, 160) : null,
        errorMessage,
        metadata: {
          channels: autoReplies.channels,
        },
      });
    } catch (loggingError) {
      logError('failed to persist auto reply run', loggingError, {
        userId: setting.userId,
        threadId: thread.id,
      });
    }
  }

  const { appendMessage } = await import('./messagingService.js');
  await appendMessage(thread.id, setting.userId, {
    messageType: 'text',
    body: reply,
    metadata: {
      autoReply: {
        provider: setting.provider,
        generatedFor: setting.userId,
        sourceMessageId: message.id,
        model: setting.model || DEFAULT_MODEL,
      },
    },
  });
}

export async function processAutoReplies({ threadId, messageId, senderId }) {
  const numericThreadId = Number(threadId);
  const numericMessageId = Number(messageId);
  if (!Number.isInteger(numericThreadId) || numericThreadId <= 0) return;
  if (!Number.isInteger(numericMessageId) || numericMessageId <= 0) return;

  const message = await Message.findByPk(numericMessageId);
  if (!message) return;
  if (message.messageType !== 'text') return;
  if (!message.body || !String(message.body).trim()) return;
  if (isAutoReplyMessage(message)) return;

  const thread = await MessageThread.findByPk(numericThreadId);
  if (!thread) return;

  const participants = await MessageParticipant.findAll({
    where: { threadId: numericThreadId },
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });

  if (!participants.length) return;

  const participantsByUserId = new Map();
  participants.forEach((participant) => {
    if (participant?.userId != null) {
      participantsByUserId.set(participant.userId, participant);
    }
  });

  const targetUserIds = participants
    .map((participant) => participant.userId)
    .filter((id) => Number.isInteger(id) && id > 0 && id !== Number(senderId));

  if (!targetUserIds.length) {
    return;
  }

  const settings = await UserAiProviderSetting.findAll({
    where: {
      userId: { [Op.in]: targetUserIds },
      provider: 'openai',
    },
  });

  await Promise.all(
    settings.map((setting) =>
      processSettingAutoReply(setting, { thread, message, participantsByUserId }).catch((error) =>
        logError('failed to generate auto reply', error, { userId: setting.userId, threadId: thread.id }),
      ),
    ),
  );
}

export function enqueueAutoReplies({ threadId, messageId, senderId }) {
  const numericThreadId = Number(threadId);
  const numericMessageId = Number(messageId);
  if (!Number.isInteger(numericThreadId) || numericThreadId <= 0) return;
  if (!Number.isInteger(numericMessageId) || numericMessageId <= 0) return;

  setImmediate(() => {
    processAutoReplies({ threadId: numericThreadId, messageId: numericMessageId, senderId }).catch((error) =>
      logError('unhandled auto-reply failure', error, { threadId: numericThreadId, messageId: numericMessageId }),
    );
  });
}

export async function generateAutoReplyPreview(userId, { message, model, temperature, instructions, channels }) {
  const numericId = Number(userId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  const setting = await UserAiProviderSetting.findOne({ where: { userId: numericId, provider: 'openai' } });
  if (!setting || !setting.apiKey) {
    throw new ValidationError('Configure an OpenAI API key before running a preview.');
  }

  const autoReplies = extractAutoReplySettings(setting);
  if (!message || !String(message).trim()) {
    throw new ValidationError('message is required to generate a preview.');
  }

  const systemPrompt = buildSystemPrompt(
    { firstName: 'You' },
    { subject: 'Preview conversation' },
    {
      ...autoReplies,
      instructions: instructions ?? autoReplies.instructions,
      channels: channels ?? autoReplies.channels,
      temperature: temperature ?? autoReplies.temperature,
    },
  );

  const decryptedKey = decryptSecret(setting.apiKey);
  const baseUrl = setting.metadata?.baseUrl || DEFAULT_BASE_URL;

  const reply = await callOpenAi(decryptedKey, {
    model: model || setting.model || DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: String(message) },
    ],
    temperature: temperature ?? autoReplies.temperature,
    baseUrl,
  });

  if (!reply) {
    throw new ValidationError('Unable to generate preview, verify the model and message.');
  }

  setting.metadata = {
    ...(setting.metadata && typeof setting.metadata === 'object' ? setting.metadata : {}),
    lastTestedAt: new Date().toISOString(),
  };
  await setting.save();

  return {
    reply,
    model: model || setting.model || DEFAULT_MODEL,
    temperature: temperature ?? autoReplies.temperature,
    testedAt: setting.metadata.lastTestedAt,
  };
}

export default {
  getUserOpenAiSettings,
  updateUserOpenAiSettings,
  enqueueAutoReplies,
  processAutoReplies,
  generateAutoReplyPreview,
};
