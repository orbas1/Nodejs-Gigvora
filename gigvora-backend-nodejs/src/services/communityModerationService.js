import { Op, fn, col, where, QueryTypes } from 'sequelize';
import { Message, sequelize } from '../models/messagingModels.js';
import {
  ModerationEvent,
  ModerationEventActions,
  ModerationEventSeverities,
  ModerationEventStatuses,
} from '../models/moderationModels.js';
import moderationEvents, { MODERATION_EVENT_TYPES } from '../events/moderationEvents.js';
import logger from '../utils/logger.js';

const log = logger.child({ component: 'communityModerationService' });

const PROFANITY_TERMS = [
  'abuse',
  'anal',
  'asshole',
  'bastard',
  'bitch',
  'bloody',
  'bollocks',
  'boner',
  'cock',
  'crap',
  'cunt',
  'damn',
  'dick',
  'dildo',
  'fuck',
  'motherfucker',
  'piss',
  'prick',
  'pussy',
  'rape',
  'shit',
  'slut',
  'spastic',
  'twat',
  'wanker',
];

const BLOCKED_DOMAINS = ['bit.ly', 'tinyurl.com', 'cutt.ly', 'grabify.link', 'iplogger.org', 'clk.sh'];
const HIGH_RISK_KEYWORDS = ['buy followers', 'crypto giveaway', 'double your money', 'work from home and earn'];

const MAX_LINKS_PER_MESSAGE = 3;
const MAX_DUPLICATE_WINDOW_MINUTES = 3;
const DUPLICATE_MESSAGE_THRESHOLD = 2;
const MAX_UPPERCASE_RATIO = 0.75;
const MAX_REPEATED_CHAR_RUN = 6;
const MAX_MENTIONS = 6;

function sanitiseValue(value) {
  if (!value) {
    return '';
  }
  const stringified = `${value}`;
  return stringified
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalise(value) {
  return sanitiseValue(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractDomains(text) {
  if (!text) {
    return [];
  }
  const matches = `${text}`.match(/https?:\/\/([^\s/]+)[^\s]*/gi);
  if (!matches) {
    return [];
  }
  return matches
    .map((match) => {
      try {
        const url = new URL(match);
        return url.hostname.replace(/^www\./, '').toLowerCase();
      } catch (error) {
        log.debug({ err: error, match }, 'Failed to parse URL while extracting domains');
        return null;
      }
    })
    .filter(Boolean);
}

function countLinks(text) {
  return extractDomains(text).length;
}

function countMentions(text) {
  if (!text) {
    return 0;
  }
  const matches = `${text}`.match(/@[a-z0-9_.-]{2,}/gi);
  return matches ? matches.length : 0;
}

function uppercaseRatio(text) {
  if (!text) {
    return 0;
  }
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (!letters) {
    return 0;
  }
  const uppercase = letters.replace(/[^A-Z]/g, '');
  return uppercase.length / letters.length;
}

function hasLongCharacterRun(text) {
  return /(.)\1{5,}/.test(text);
}

function detectProfanity(text) {
  const analysed = normalise(text);
  return PROFANITY_TERMS.filter((term) => analysed.includes(term));
}

function detectHighRiskKeywords(text) {
  const analysed = normalise(text);
  return HIGH_RISK_KEYWORDS.filter((phrase) => analysed.includes(phrase));
}

function buildSignal({ code, message, severity, weight, data }) {
  return { code, message, severity, weight, data };
}

function determineSeverity(signals) {
  if (!signals.length) {
    return 'low';
  }
  if (signals.some((signal) => signal.severity === 'critical')) {
    return 'critical';
  }
  if (signals.some((signal) => signal.severity === 'high')) {
    return 'high';
  }
  if (signals.some((signal) => signal.severity === 'medium')) {
    return 'medium';
  }
  return 'low';
}

function determineDecision(severity, score) {
  if (severity === 'critical') {
    return 'block';
  }
  if (severity === 'high' || score >= 60) {
    return 'review';
  }
  if (score >= 35) {
    return 'review';
  }
  return 'allow';
}

function summariseSignals(signals) {
  return signals.map((signal) => ({
    code: signal.code,
    message: signal.message,
    severity: signal.severity,
    weight: signal.weight,
    data: signal.data,
  }));
}

async function evaluateDuplicateMessages({ threadId, userId, body, transaction }) {
  if (!threadId || !userId) {
    return null;
  }
  const since = new Date(Date.now() - MAX_DUPLICATE_WINDOW_MINUTES * 60 * 1000);
  const recentMessages = await Message.findAll({
    where: {
      threadId,
      senderId: userId,
      createdAt: { [Op.gte]: since },
    },
    order: [['createdAt', 'DESC']],
    limit: 5,
    transaction,
  });
  const normalisedBody = normalise(body);
  const duplicates = recentMessages.filter((message) => normalise(message.body) === normalisedBody);
  if (duplicates.length >= DUPLICATE_MESSAGE_THRESHOLD) {
    return buildSignal({
      code: 'duplicate_message',
      message: 'This message matches recent submissions and may be spam.',
      severity: 'medium',
      weight: 20,
      data: { duplicates: duplicates.length },
    });
  }
  return null;
}

export async function evaluateCommunityMessage({
  thread,
  participant,
  body,
  metadata = {},
  transaction,
}) {
  const sanitisedBody = sanitiseValue(body);
  const signals = [];

  if (!sanitisedBody) {
    return {
      sanitisedBody,
      decision: 'allow',
      severity: 'low',
      score: 0,
      signals: [],
      metadata,
    };
  }

  const profanityMatches = detectProfanity(sanitisedBody);
  if (profanityMatches.length) {
    signals.push(
      buildSignal({
        code: 'profanity',
        message: `Message contains disallowed language: ${profanityMatches.join(', ')}`,
        severity: 'critical',
        weight: 100,
        data: { matches: profanityMatches },
      }),
    );
  }

  const keywordMatches = detectHighRiskKeywords(sanitisedBody);
  if (keywordMatches.length) {
    signals.push(
      buildSignal({
        code: 'scam_keywords',
        message: `Message contains high-risk phrases: ${keywordMatches.join(', ')}`,
        severity: 'high',
        weight: 40,
        data: { matches: keywordMatches },
      }),
    );
  }

  const linkCount = countLinks(sanitisedBody);
  if (linkCount > MAX_LINKS_PER_MESSAGE) {
    signals.push(
      buildSignal({
        code: 'link_density',
        message: 'Message contains too many external links.',
        severity: 'high',
        weight: 30,
        data: { linkCount },
      }),
    );
  }

  const linkedDomains = extractDomains(sanitisedBody);
  const blockedMatches = linkedDomains.filter((domain) => BLOCKED_DOMAINS.includes(domain));
  if (blockedMatches.length) {
    signals.push(
      buildSignal({
        code: 'blocked_domain',
        message: `Message links to blocked domains: ${blockedMatches.join(', ')}`,
        severity: 'critical',
        weight: 100,
        data: { domains: blockedMatches },
      }),
    );
  }

  const mentionCount = countMentions(sanitisedBody);
  if (mentionCount > MAX_MENTIONS) {
    signals.push(
      buildSignal({
        code: 'mention_spam',
        message: 'Message tags too many members and may be spam.',
        severity: 'medium',
        weight: 15,
        data: { mentionCount },
      }),
    );
  }

  if (uppercaseRatio(sanitisedBody) > MAX_UPPERCASE_RATIO) {
    signals.push(
      buildSignal({
        code: 'uppercase_spam',
        message: 'Message uses aggressive uppercase formatting.',
        severity: 'medium',
        weight: 15,
      }),
    );
  }

  if (hasLongCharacterRun(sanitisedBody)) {
    signals.push(
      buildSignal({
        code: 'character_runs',
        message: 'Message contains repeated characters that look like spam.',
        severity: 'medium',
        weight: 10,
      }),
    );
  }

  const duplicateSignal = await evaluateDuplicateMessages({
    threadId: thread?.id,
    userId: participant?.userId,
    body: sanitisedBody,
    transaction,
  });
  if (duplicateSignal) {
    signals.push(duplicateSignal);
  }

  const score = signals.reduce((total, signal) => total + (signal.weight || 0), 0);
  const severity = determineSeverity(signals);
  const decision = determineDecision(severity, score);

  return {
    sanitisedBody,
    decision,
    severity,
    score,
    signals: summariseSignals(signals),
    metadata,
  };
}

export async function createModerationEvent(eventPayload, { transaction } = {}) {
  const payload = {
    ...eventPayload,
    reason: sanitiseValue(eventPayload.reason),
    status: eventPayload.status || 'open',
  };
  const event = await ModerationEvent.create(payload, { transaction });
  const serialised = event.toPublicObject();
  moderationEvents.emit(MODERATION_EVENT_TYPES.EVENT_CREATED, serialised);
  return serialised;
}

export async function recordMessageModeration({
  threadId,
  messageId,
  actorId,
  channelSlug,
  decision,
  severity,
  signals,
  score,
  metadata,
  transaction,
}) {
  if (decision === 'allow') {
    return null;
  }
  const event = await createModerationEvent(
    {
      threadId,
      messageId,
      actorId,
      channelSlug,
      action: decision === 'block' ? 'message_blocked' : 'message_flagged',
      severity: severity === 'low' ? 'medium' : severity,
      status: decision === 'block' ? 'resolved' : 'open',
      reason:
        decision === 'block'
          ? 'Message blocked by automated moderation policies.'
          : 'Message requires moderator review.',
      metadata: {
        score,
        signals,
        decision,
        source: 'automated_heuristics',
        ...(metadata || {}),
      },
      resolvedBy: decision === 'block' ? 0 : null,
      resolvedAt: decision === 'block' ? new Date() : null,
    },
    { transaction },
  );
  return event;
}

export async function recordModerationAction({
  threadId,
  messageId,
  actorId,
  channelSlug,
  action,
  severity = 'medium',
  status = 'open',
  reason,
  metadata,
  transaction,
}) {
  const event = await createModerationEvent(
    {
      threadId,
      messageId,
      actorId,
      channelSlug,
      action,
      severity,
      status,
      reason: reason || 'Moderator action recorded.',
      metadata: metadata || {},
    },
    { transaction },
  );
  return event;
}

export async function resolveModerationEvent(eventId, { status, resolvedBy, resolutionNotes } = {}) {
  const event = await ModerationEvent.findByPk(eventId);
  if (!event) {
    return null;
  }
  const normalisedStatus = status && ModerationEventStatuses.includes(status) ? status : 'resolved';
  const metadata = { ...(event.metadata ?? {}) };
  if (resolutionNotes) {
    metadata.resolutionNotes = sanitiseValue(resolutionNotes);
  }
  event.status = normalisedStatus;
  event.resolvedBy = resolvedBy ?? event.resolvedBy ?? null;
  event.resolvedAt = new Date();
  event.metadata = metadata;
  await event.save();
  const serialised = event.toPublicObject();
  moderationEvents.emit(MODERATION_EVENT_TYPES.EVENT_UPDATED, serialised);
  return serialised;
}

function buildQueueWhereClause({ severities, channels, statuses, search, defaultStatuses }) {
  const clauses = [];
  if (Array.isArray(severities) && severities.length) {
    clauses.push({ severity: { [Op.in]: severities } });
  }
  if (Array.isArray(channels) && channels.length) {
    clauses.push({ channelSlug: { [Op.in]: channels } });
  }
  if (Array.isArray(statuses) && statuses.length) {
    clauses.push({ status: { [Op.in]: statuses } });
  } else if (Array.isArray(defaultStatuses) && defaultStatuses.length) {
    clauses.push({ status: { [Op.in]: defaultStatuses } });
  }
  if (search) {
    const pattern = `%${search.toLowerCase()}%`;
    clauses.push(
      where(fn('LOWER', col('ModerationEvent.reason')), {
        [Op.like]: pattern,
      }),
    );
  }
  if (!clauses.length) {
    return {};
  }
  return { [Op.and]: clauses };
}

export async function listModerationQueue({
  page = 1,
  pageSize = 25,
  severities,
  channels,
  status,
  search,
} = {}) {
  const limit = Math.max(1, Math.min(pageSize, 100));
  const offset = (Math.max(page, 1) - 1) * limit;
  const whereClause = buildQueueWhereClause({
    severities,
    channels,
    statuses: status,
    search,
    defaultStatuses: ['open', 'acknowledged'],
  });

  const { rows, count } = await ModerationEvent.findAndCountAll({
    where: whereClause,
    order: [
      ['severity', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    offset,
    limit,
  });
  return {
    items: rows.map((row) => row.toPublicObject()),
    pagination: {
      page,
      pageSize: limit,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    },
  };
}

export async function listModerationEvents({
  page = 1,
  pageSize = 50,
  status,
  actorId,
  channelSlug,
} = {}) {
  const limit = Math.max(1, Math.min(pageSize, 200));
  const offset = (Math.max(page, 1) - 1) * limit;
  const whereClause = {};
  if (status) {
    whereClause.status = Array.isArray(status) ? { [Op.in]: status } : status;
  }
  if (actorId) {
    whereClause.actorId = actorId;
  }
  if (channelSlug) {
    whereClause.channelSlug = channelSlug;
  }

  const { rows, count } = await ModerationEvent.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    offset,
    limit,
  });
  return {
    items: rows.map((row) => row.toPublicObject()),
    pagination: {
      page,
      pageSize: limit,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    },
  };
}

export async function getModerationOverview({ days = 7 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const baseWhere = { createdAt: { [Op.gte]: since } };

  const [totals, resolutionStats] = await Promise.all([
    ModerationEvent.findAll({
      attributes: [
        'severity',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: baseWhere,
      group: ['severity'],
    }),
    ModerationEvent.findAll({
      attributes: [
        'action',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: baseWhere,
      group: ['action'],
    }),
  ]);

  const queueCounts = await ModerationEvent.count({
    where: { status: { [Op.in]: ['open', 'acknowledged'] } },
  });

  const groupedSeverity = ModerationEventSeverities.reduce((acc, severity) => {
    const match = totals.find((total) => total.get('severity') === severity);
    acc[severity] = match ? Number(match.get('count')) : 0;
    return acc;
  }, {});

  const groupedActions = ModerationEventActions.reduce((acc, action) => {
    const match = resolutionStats.find((total) => total.get('action') === action);
    acc[action] = match ? Number(match.get('count')) : 0;
    return acc;
  }, {});

  let averageResolutionSeconds = null;
  try {
    const [result] = await sequelize.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) AS avg_seconds
       FROM moderation_events
       WHERE resolved_at IS NOT NULL`,
      { type: QueryTypes.SELECT },
    );
    if (result && result.avg_seconds != null) {
      averageResolutionSeconds = Number(result.avg_seconds);
    }
  } catch (error) {
    log.warn({ err: error }, 'Failed to compute average resolution time for moderation events');
  }

  return {
    totals: groupedSeverity,
    actions: groupedActions,
    queue: {
      open: queueCounts,
    },
    averageResolutionSeconds,
  };
}

export default {
  evaluateCommunityMessage,
  recordMessageModeration,
  recordModerationAction,
  listModerationQueue,
  listModerationEvents,
  getModerationOverview,
  resolveModerationEvent,
  createModerationEvent,
};
