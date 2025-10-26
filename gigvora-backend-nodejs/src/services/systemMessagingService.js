import { fn, col, Op } from 'sequelize';
import models from '../models/index.js';
import logger from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

let modelsContainer = models;
let sequelizeInstance = models.sequelize;
let log = logger.child({ component: 'systemMessagingService' });

function getModels() {
  modelsContainer = modelsContainer ?? models;
  return modelsContainer;
}

function getSequelize(strict = false) {
  const instance = sequelizeInstance ?? getModels()?.sequelize ?? models.sequelize;
  if (strict && (!instance || typeof instance.transaction !== 'function')) {
    throw new Error('Sequelize instance is not configured for systemMessagingService.');
  }
  return instance;
}

function reinitialiseLogger(nextLogger) {
  if (nextLogger) {
    log = typeof nextLogger.child === 'function' ? nextLogger.child({ component: 'systemMessagingService' }) : nextLogger;
  } else {
    log = logger.child({ component: 'systemMessagingService' });
  }
}

export function __setDependencies({ models: overrides, sequelize: sequelizeOverride, logger: loggerOverride } = {}) {
  modelsContainer = overrides ?? models;
  sequelizeInstance = sequelizeOverride ?? modelsContainer?.sequelize ?? models.sequelize;
  reinitialiseLogger(loggerOverride);
}

export function __resetDependencies() {
  modelsContainer = models;
  sequelizeInstance = models.sequelize;
  reinitialiseLogger();
}

function getStatusEventModel() {
  const eventModel = getModels()?.SystemStatusEvent;
  if (!eventModel) {
    throw new Error('SystemStatusEvent model is not configured.');
  }
  return eventModel;
}

function getAcknowledgementModel() {
  const ackModel = getModels()?.SystemStatusAcknowledgement;
  if (!ackModel) {
    throw new Error('SystemStatusAcknowledgement model is not configured.');
  }
  return ackModel;
}

function getFeedbackPulseSurveyModel() {
  const surveyModel = getModels()?.FeedbackPulseSurvey;
  if (!surveyModel) {
    throw new Error('FeedbackPulseSurvey model is not configured.');
  }
  return surveyModel;
}

function getFeedbackPulseResponseModel() {
  const responseModel = getModels()?.FeedbackPulseResponse;
  if (!responseModel) {
    throw new Error('FeedbackPulseResponse model is not configured.');
  }
  return responseModel;
}

function normaliseKey(value) {
  if (!value) {
    return null;
  }
  const trimmed = `${value}`.trim().toLowerCase();
  return trimmed.length ? trimmed : null;
}

function coerceUserId(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (Number.isFinite(numeric) && `${numeric}` === `${value}`.trim()) {
    return numeric;
  }
  return value;
}

function sanitiseTags(candidateTags, allowedTags) {
  if (!Array.isArray(candidateTags) || !candidateTags.length) {
    return [];
  }
  const allowList = new Set((allowedTags || []).map((tag) => `${tag}`.trim().toLowerCase()).filter(Boolean));
  return candidateTags
    .map((tag) => `${tag}`.trim())
    .filter((tag) => tag.length > 0)
    .filter((tag) => (allowList.size ? allowList.has(tag.toLowerCase()) : true))
    .slice(0, 12);
}

function sanitiseComment(comment) {
  if (comment == null) {
    return '';
  }
  const trimmed = `${comment}`.trim();
  if (trimmed.length > 2000) {
    throw new ValidationError('comment must be 2000 characters or fewer.');
  }
  return trimmed;
}

function validateScore(score) {
  const numeric = Number.parseInt(score, 10);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('score must be a number between 1 and 5.');
  }
  if (numeric < 1 || numeric > 5) {
    throw new ValidationError('score must be between 1 and 5.');
  }
  return numeric;
}

export async function getLatestSystemStatusEvent({ includeResolved = false, includeExpired = false, userId, now } = {}) {
  const StatusEvent = getStatusEventModel();
  const Acknowledgement = getAcknowledgementModel();
  const currentTime = now ? new Date(now) : new Date();

  const where = {
    publishedAt: { [Op.lte]: currentTime },
  };

  if (!includeExpired) {
    where[Op.or] = [{ expiresAt: null }, { expiresAt: { [Op.gt]: currentTime } }];
  }

  if (!includeResolved) {
    where.resolvedAt = { [Op.is]: null };
  }

  const event = await StatusEvent.findOne({
    where,
    order: [
      ['publishedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });

  if (!event) {
    return null;
  }

  const payload = event.toToastPayload();

  if (userId != null) {
    const acknowledgement = await Acknowledgement.findOne({
      where: { statusEventId: event.id, userId: coerceUserId(userId) },
    });
    payload.acknowledged = acknowledgement ? acknowledgement.toPublicObject() : null;
  }

  return payload;
}

export async function acknowledgeSystemStatusEvent(eventKey, { actorId, channel, metadata } = {}) {
  const key = normaliseKey(eventKey);
  if (!key) {
    throw new ValidationError('eventKey is required to acknowledge a system status event.');
  }
  const userId = coerceUserId(actorId);
  if (userId == null) {
    throw new ValidationError('actorId is required to acknowledge a system status event.');
  }

  const StatusEvent = getStatusEventModel();
  const Acknowledgement = getAcknowledgementModel();

  const event = await StatusEvent.findOne({ where: { eventKey: key } });
  if (!event) {
    throw new NotFoundError(`System status event ${key} was not found.`);
  }

  const [record] = await Acknowledgement.findOrCreate({
    where: { statusEventId: event.id, userId },
    defaults: {
      channel: channel ? `${channel}`.trim() || null : null,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    },
  });

  const updates = {};
  updates.acknowledgedAt = new Date();
  if (channel) {
    updates.channel = `${channel}`.trim() || null;
  }
  if (metadata && typeof metadata === 'object') {
    updates.metadata = metadata;
  }
  if (Object.keys(updates).length) {
    await record.update(updates);
  }

  log.debug({ eventKey: key, userId }, 'System status event acknowledged.');

  return {
    event: event.toToastPayload(),
    acknowledgement: await record.reload().then((ack) => ack.toPublicObject()),
  };
}

export async function getFeedbackPulse(pulseKey, { includeInactive = false } = {}) {
  const key = normaliseKey(pulseKey);
  if (!key) {
    throw new ValidationError('pulseKey is required.');
  }

  const Survey = getFeedbackPulseSurveyModel();
  const survey = await Survey.findOne({ where: { pulseKey: key } });
  if (!survey || (!includeInactive && survey.status !== 'active')) {
    throw new NotFoundError(`Feedback pulse ${key} was not found.`);
  }

  return survey.toPulsePayload();
}

export async function submitFeedbackPulseResponse(pulseKey, payload = {}, actor = {}) {
  const key = normaliseKey(pulseKey);
  if (!key) {
    throw new ValidationError('pulseKey is required to submit feedback.');
  }
  const score = validateScore(payload.score);
  const channel = payload.channel ? `${payload.channel}`.trim() || null : null;
  const actorId = coerceUserId(actor.actorId ?? actor.userId ?? actor.id ?? null);

  const Survey = getFeedbackPulseSurveyModel();
  const Response = getFeedbackPulseResponseModel();
  const sequelize = getSequelize(true);

  const survey = await Survey.findOne({ where: { pulseKey: key } });
  if (!survey || survey.status !== 'active') {
    throw new NotFoundError(`Feedback pulse ${key} is not available.`);
  }

  const tags = sanitiseTags(payload.tags, survey.tags);
  const comment = sanitiseComment(payload.comment);
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};

  return sequelize.transaction(async (transaction) => {
    const response = await Response.create(
      {
        surveyId: survey.id,
        userId: actorId ?? null,
        score,
        tags,
        comment: comment || null,
        channel,
        metadata,
      },
      { transaction },
    );

    const aggregates = await Response.findOne({
      attributes: [
        [fn('AVG', col('score')), 'averageScore'],
        [fn('COUNT', col('id')), 'sampleSize'],
      ],
      where: { surveyId: survey.id },
      raw: true,
      transaction,
    });

    const averageScore = aggregates?.averageScore == null ? null : Number.parseFloat(aggregates.averageScore);
    const sampleSize = aggregates?.sampleSize == null ? 0 : Number.parseInt(aggregates.sampleSize, 10);
    const previousTrendValue = survey.trendValue == null ? null : Number.parseFloat(survey.trendValue);

    await survey.update(
      {
        responseCount: sampleSize,
        lastResponseAt: response.submittedAt,
        trendValue: averageScore,
        trendSampleSize: sampleSize,
        trendDelta: previousTrendValue == null || averageScore == null ? survey.trendDelta : averageScore - previousTrendValue,
      },
      { transaction },
    );

    log.info(
      {
        pulseKey: key,
        score,
        tagsCount: tags.length,
        hasComment: Boolean(comment),
        actorId,
      },
      'Feedback pulse response submitted.',
    );

    await survey.reload({ transaction });

    return {
      response: response.toPublicObject(),
      survey: survey.toPulsePayload(),
    };
  });
}

export default {
  getLatestSystemStatusEvent,
  acknowledgeSystemStatusEvent,
  getFeedbackPulse,
  submitFeedbackPulseResponse,
};
