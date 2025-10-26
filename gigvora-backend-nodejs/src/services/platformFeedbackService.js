import crypto from 'node:crypto';
import { Op } from 'sequelize';
import {
  PlatformFeedbackPrompt,
  PlatformFeedbackPromptState,
  PlatformFeedbackResponse,
  findPromptStateForActor,
} from '../models/platformStatusModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normalisePromptIdentifier(value) {
  if (typeof value !== 'string') {
    return 'global-platform-health';
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed.toLowerCase() : 'global-platform-health';
}

function normaliseRating(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  return trimmed.length ? trimmed.slice(0, 64) : null;
}

function trimComment(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, 1000);
}

function buildFingerprint({ promptId, userId, sessionFingerprint, ipAddress, userAgent }) {
  if (sessionFingerprint) {
    return sessionFingerprint;
  }
  const hash = crypto.createHash('sha256');
  hash.update(promptId ?? 'global-platform-health');
  hash.update('::');
  hash.update(userId ? String(userId) : 'anonymous');
  hash.update('::');
  hash.update(ipAddress ?? '0.0.0.0');
  hash.update('::');
  hash.update(userAgent ?? 'unknown');
  return hash.digest('hex');
}

async function loadPromptBySlug(slug, { transaction } = {}) {
  return PlatformFeedbackPrompt.findOne({
    where: { slug: normalisePromptIdentifier(slug) },
    transaction,
  });
}

function isPromptActive(prompt) {
  if (!prompt) {
    return false;
  }
  if (prompt.status !== 'active') {
    return false;
  }
  const now = Date.now();
  if (prompt.activeFrom && new Date(prompt.activeFrom).getTime() > now) {
    return false;
  }
  if (prompt.activeUntil && new Date(prompt.activeUntil).getTime() < now) {
    return false;
  }
  return true;
}

function isRatingAllowed(prompt, rating) {
  if (!rating) {
    return false;
  }
  const options = Array.isArray(prompt?.responseOptions) ? prompt.responseOptions : [];
  if (!options.length) {
    return true;
  }
  return options.some((option) => option?.value === rating);
}

function computeSnoozeUntil(prompt, multiplierMinutes = null) {
  const minutes = multiplierMinutes ?? prompt?.snoozeMinutes ?? 240;
  const ms = Math.max(minutes, 15) * 60 * 1000;
  return new Date(Date.now() + ms);
}

function computeCooldownBoundary(prompt) {
  const hours = Number(prompt?.cooldownHours ?? 168);
  const ms = Math.max(hours, 1) * 60 * 60 * 1000;
  return Date.now() - ms;
}

function serializePrompt(prompt) {
  if (!prompt) {
    return null;
  }
  return prompt.toPublicObject();
}

export async function resolvePulseEligibility({
  promptId = 'global-platform-health',
  userId = null,
  sessionFingerprint = null,
  transaction,
} = {}) {
  const prompt = await loadPromptBySlug(promptId, { transaction });
  if (!prompt) {
    return { eligible: false, reason: 'prompt_not_found', prompt: null };
  }
  if (!isPromptActive(prompt)) {
    return { eligible: false, reason: 'inactive', prompt: serializePrompt(prompt) };
  }

  const state = await findPromptStateForActor({ promptId: prompt.id, userId, sessionFingerprint, transaction });
  if (state) {
    if (state.snoozedUntil) {
      const snoozedUntil = new Date(state.snoozedUntil);
      if (Number.isFinite(snoozedUntil.getTime()) && snoozedUntil > new Date()) {
        return { eligible: false, reason: 'snoozed', prompt: serializePrompt(prompt) };
      }
    }
    if (state.respondedAt) {
      const respondedAt = new Date(state.respondedAt);
      if (Number.isFinite(respondedAt.getTime()) && respondedAt.getTime() >= computeCooldownBoundary(prompt)) {
        return { eligible: false, reason: 'recent_response', prompt: serializePrompt(prompt) };
      }
    }
  }

  return { eligible: true, reason: null, prompt: serializePrompt(prompt) };
}

export async function recordPulseResponse({
  promptId = 'global-platform-health',
  userId = null,
  rating,
  comment,
  sessionFingerprint = null,
  ipAddress,
  userAgent,
  metadata = {},
  transaction,
} = {}) {
  const prompt = await loadPromptBySlug(promptId, { transaction });
  if (!prompt) {
    throw new NotFoundError('Feedback prompt not found.');
  }
  if (!isPromptActive(prompt)) {
    throw new ValidationError('Feedback prompt is not accepting responses right now.');
  }

  const normalizedRating = normaliseRating(rating);
  if (!isRatingAllowed(prompt, normalizedRating)) {
    throw new ValidationError('Invalid rating supplied for feedback prompt.', {
      allowed: prompt.responseOptions?.map((option) => option.value) ?? [],
    });
  }

  const trimmedComment = trimComment(comment);
  const fingerprint = buildFingerprint({ promptId, userId, sessionFingerprint, ipAddress, userAgent });

  const [state] = await PlatformFeedbackPromptState.findOrCreate({
    where: {
      promptId: prompt.id,
      [Op.or]: [
        ...(userId ? [{ userId }] : []),
        { sessionFingerprint: fingerprint },
      ],
    },
    defaults: {
      promptId: prompt.id,
      userId: userId || null,
      sessionFingerprint: fingerprint,
      snoozedUntil: computeSnoozeUntil(prompt, prompt.cooldownHours * 60),
      respondedAt: new Date(),
      totalResponses: 1,
      lastRating: normalizedRating,
      metadata: { ...metadata },
    },
    transaction,
  });

  if (state.userId == null && userId) {
    state.userId = userId;
  }
  state.sessionFingerprint = fingerprint;
  state.respondedAt = new Date();
  state.totalResponses = Number(state.totalResponses ?? 0) + 1;
  state.lastRating = normalizedRating;
  state.snoozedUntil = computeSnoozeUntil(prompt, prompt.cooldownHours * 60);
  state.metadata = { ...(state.metadata ?? {}), ...metadata };
  await state.save({ transaction });

  const response = await PlatformFeedbackResponse.create(
    {
      promptId: prompt.id,
      userId: userId || null,
      sessionFingerprint: fingerprint,
      rating: normalizedRating,
      comment: trimmedComment,
      metadata: {
        ...metadata,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    },
    { transaction },
  );

  return {
    prompt: serializePrompt(prompt),
    state: state.toPublicObject(),
    response: response.toPublicObject(),
  };
}

export default {
  resolvePulseEligibility,
  recordPulseResponse,
};
