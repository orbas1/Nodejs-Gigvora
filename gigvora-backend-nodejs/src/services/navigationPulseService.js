import { Op } from 'sequelize';

import sequelize from '../models/sequelizeClient.js';
import { ValidationError, AuthorizationError } from '../utils/errors.js';

const DEFAULT_TIMEFRAME = '7d';
const DEFAULT_TRENDING_LIMIT = 6;
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

const DEFAULT_MODELS = {
  User: sequelize.models.User,
  NetworkingConnection: sequelize.models.NetworkingConnection,
  Project: sequelize.models.Project,
  Message: sequelize.models.Message,
  MessageParticipant: sequelize.models.MessageParticipant,
  DiscoveryTrendingTopic: sequelize.models.DiscoveryTrendingTopic,
};

function normalisePositiveInteger(value, fieldName) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return numeric;
}

function resolveWindowDays(timeframe = DEFAULT_TIMEFRAME) {
  switch (timeframe) {
    case '24h':
      return 1;
    case '30d':
      return 30;
    case '7d':
    default:
      return 7;
  }
}

function subtractDays(baseDate, days) {
  const result = new Date(baseDate);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

function formatCompactNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '';
  }
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatPercentage(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  const rounded = Math.round(value * 10) / 10;
  const prefix = rounded > 0 ? '+' : '';
  return `${prefix}${rounded}%`;
}

function timeframeLabel(timeframe) {
  switch (timeframe) {
    case '24h':
      return 'day';
    case '30d':
      return 'month';
    case '7d':
    default:
      return 'week';
  }
}

function resolvePersona(user, personaHint) {
  if (personaHint && typeof personaHint === 'string') {
    return personaHint.trim().toLowerCase();
  }

  const personaPriorities = [
    'founder',
    'company',
    'agency',
    'freelancer',
    'mentor',
    'headhunter',
    'community',
    'investor',
  ];

  const memberships = Array.isArray(user?.memberships) ? user.memberships : [];
  const preferredRoles = Array.isArray(user?.preferredRoles) ? user.preferredRoles : [];

  const candidateSet = new Set();
  memberships.forEach((entry) => {
    if (typeof entry === 'string' && entry.trim()) {
      candidateSet.add(entry.trim().toLowerCase());
    }
  });
  preferredRoles.forEach((entry) => {
    if (typeof entry === 'string' && entry.trim()) {
      candidateSet.add(entry.trim().toLowerCase());
    }
  });
  if (typeof user?.userType === 'string' && user.userType.trim()) {
    candidateSet.add(user.userType.trim().toLowerCase());
  }

  for (const priority of personaPriorities) {
    if (candidateSet.has(priority)) {
      return priority;
    }
  }

  const [firstCandidate] = candidateSet;
  return firstCandidate ?? null;
}

function buildTrendLink(topic) {
  if (topic?.metadata?.href) {
    return topic.metadata.href;
  }
  if (topic?.metadata?.link) {
    return topic.metadata.link;
  }
  const query = encodeURIComponent(topic.topic ?? 'trend');
  return `/search?q=${query}`;
}

async function fetchTrendingTopics({ models, persona, timeframe, limit }) {
  const order = [
    ['rank', 'ASC'],
    ['engagementScore', 'DESC'],
    ['createdAt', 'DESC'],
  ];

  const collected = [];
  const baseWhere = { timeframe };

  if (persona) {
    const personaResults = await models.DiscoveryTrendingTopic.findAll({
      where: { ...baseWhere, persona },
      order,
      limit,
    });
    collected.push(...personaResults);
  }

  if (collected.length < limit) {
    const remaining = limit - collected.length;
    const generalResults = await models.DiscoveryTrendingTopic.findAll({
      where: {
        ...baseWhere,
        [Op.or]: [{ persona: null }, { persona: '' }],
      },
      order,
      limit: remaining,
    });
    generalResults.forEach((entry) => {
      if (!collected.find((existing) => existing.id === entry.id)) {
        collected.push(entry);
      }
    });
  }

  if (collected.length < limit) {
    const fallbackResults = await models.DiscoveryTrendingTopic.findAll({
      where: { timeframe: '30d' },
      order,
      limit: limit - collected.length,
    });
    fallbackResults.forEach((entry) => {
      if (!collected.find((existing) => existing.id === entry.id)) {
        collected.push(entry);
      }
    });
  }

  return collected.slice(0, limit);
}

function computeResponseMetrics({ inbound, outbound }) {
  const inboundByThread = new Map();
  inbound.forEach((message) => {
    const list = inboundByThread.get(message.threadId) ?? [];
    list.push(new Date(message.createdAt).getTime());
    inboundByThread.set(message.threadId, list);
  });

  const outboundByThread = new Map();
  outbound.forEach((message) => {
    const list = outboundByThread.get(message.threadId) ?? [];
    list.push(new Date(message.createdAt).getTime());
    outboundByThread.set(message.threadId, list);
  });

  let responded = 0;
  const responseDurations = [];

  inboundByThread.forEach((timestamps, threadId) => {
    const outbounds = outboundByThread.get(threadId) ?? [];
    if (!outbounds.length) {
      return;
    }
    let outboundIndex = 0;
    timestamps
      .sort((a, b) => a - b)
      .forEach((inboundTimestamp) => {
        while (outboundIndex < outbounds.length && outbounds[outboundIndex] < inboundTimestamp) {
          outboundIndex += 1;
        }
        const outboundTimestamp = outbounds[outboundIndex];
        if (!outboundTimestamp) {
          return;
        }
        const delta = outboundTimestamp - inboundTimestamp;
        if (delta >= 0 && delta <= TWELVE_HOURS_MS) {
          responded += 1;
          responseDurations.push(delta);
        }
      });
  });

  const totalInbound = inbound.length;
  const rate = totalInbound === 0 ? 1 : responded / totalInbound;
  const averageMs = responseDurations.length
    ? responseDurations.reduce((sum, duration) => sum + duration, 0) / responseDurations.length
    : null;
  const averageMinutes = averageMs == null ? null : Math.round(averageMs / 60000);

  return { rate, averageMinutes, totalInbound, responded };
}

export async function getNavigationPulse(
  {
    userId,
    limitTrending = DEFAULT_TRENDING_LIMIT,
    timeframe = DEFAULT_TIMEFRAME,
    personaHint,
  },
  { models: providedModels } = {},
) {
  const models = providedModels ?? DEFAULT_MODELS;
  const actorId = normalisePositiveInteger(userId, 'userId');
  const safeLimit = Math.min(Math.max(Number(limitTrending) || DEFAULT_TRENDING_LIMIT, 1), 20);
  const windowDays = resolveWindowDays(timeframe);
  const now = new Date();
  const currentWindowStart = subtractDays(now, windowDays);
  const previousWindowStart = subtractDays(currentWindowStart, windowDays);

  const user = await models.User.findByPk(actorId, {
    attributes: ['id', 'memberships', 'preferredRoles', 'userType'],
  });

  if (!user) {
    throw new AuthorizationError('Authenticated user record is required to load navigation insights.');
  }

  const persona = resolvePersona(user?.get?.({ plain: true }) ?? user, personaHint);

  const connectionBaseWhere = {
    [Op.or]: [{ ownerId: actorId }, { connectionUserId: actorId }],
  };

  const [
    totalConnections,
    newConnections,
    previousConnections,
    activeProjects,
    projectsCreated,
    respondedPayload,
    trendingTopics,
  ] = await Promise.all([
    models.NetworkingConnection.count({ where: connectionBaseWhere }),
    models.NetworkingConnection.count({
      where: {
        ...connectionBaseWhere,
        createdAt: { [Op.gte]: currentWindowStart },
      },
    }),
    models.NetworkingConnection.count({
      where: {
        ...connectionBaseWhere,
        createdAt: {
          [Op.gte]: previousWindowStart,
          [Op.lt]: currentWindowStart,
        },
      },
    }),
    models.Project.count({
      where: {
        ownerId: actorId,
        lifecycleState: 'open',
        status: {
          [Op.in]: ['planning', 'in_progress', 'at_risk'],
        },
      },
    }),
    models.Project.count({
      where: {
        ownerId: actorId,
        createdAt: {
          [Op.gte]: currentWindowStart,
        },
      },
    }),
    (async () => {
      const participantThreads = await models.MessageParticipant.findAll({
        attributes: ['threadId'],
        where: { userId: actorId },
        raw: true,
      });
      const threadIds = [...new Set(participantThreads.map((row) => row.threadId).filter(Boolean))];
      if (!threadIds.length) {
        return { rate: 1, averageMinutes: null, totalInbound: 0, responded: 0 };
      }
      const inboundMessages = await models.Message.findAll({
        attributes: ['threadId', 'createdAt'],
        where: {
          threadId: { [Op.in]: threadIds },
          createdAt: { [Op.gte]: currentWindowStart },
          [Op.or]: [{ senderId: { [Op.ne]: actorId } }, { senderId: null }],
        },
        raw: true,
        order: [
          ['threadId', 'ASC'],
          ['createdAt', 'ASC'],
        ],
      });
      const outboundMessages = await models.Message.findAll({
        attributes: ['threadId', 'createdAt'],
        where: {
          threadId: { [Op.in]: threadIds },
          senderId: actorId,
          createdAt: { [Op.gte]: previousWindowStart },
        },
        raw: true,
        order: [
          ['threadId', 'ASC'],
          ['createdAt', 'ASC'],
        ],
      });
      return computeResponseMetrics({ inbound: inboundMessages, outbound: outboundMessages });
    })(),
    fetchTrendingTopics({ models, persona, timeframe, limit: safeLimit }),
  ]);

  const connectionChange = previousConnections > 0
    ? ((newConnections - previousConnections) / previousConnections) * 100
    : null;

  const responseRateFormatted = formatPercentage(respondedPayload.rate * 100);
  const responseAverageLabel = respondedPayload.averageMinutes == null
    ? 'Avg response under 15m'
    : `Avg ${respondedPayload.averageMinutes}m reply`;

  const projectsDeltaLabel = `${projectsCreated} new ${timeframeLabel(timeframe)}`;
  const connectionsDeltaLabel = `${newConnections} new ${timeframeLabel(timeframe)}`;

  const pulse = [
    {
      id: 'connections',
      label: 'Connections',
      value: {
        raw: totalConnections,
        formatted: formatCompactNumber(totalConnections),
      },
      delta: {
        raw: newConnections,
        formatted: connectionsDeltaLabel,
        percentage: connectionChange,
        percentageFormatted: connectionChange == null ? null : formatPercentage(connectionChange),
      },
      hint: `Network reach this ${timeframeLabel(timeframe)}`,
      status: 'connected',
    },
    {
      id: 'projects',
      label: 'Active projects',
      value: {
        raw: activeProjects,
        formatted: formatCompactNumber(activeProjects),
      },
      delta: {
        raw: projectsCreated,
        formatted: projectsDeltaLabel,
      },
      hint: 'Live engagements across teams',
      status: activeProjects > 0 ? 'connected' : 'idle',
    },
    {
      id: 'response',
      label: 'Response rate',
      value: {
        raw: respondedPayload.rate,
        formatted: responseRateFormatted ?? '100%',
      },
      delta: {
        raw: respondedPayload.averageMinutes,
        formatted: responseAverageLabel,
      },
      hint: respondedPayload.totalInbound
        ? `${respondedPayload.responded} of ${respondedPayload.totalInbound} replied`
        : 'No inbound this window',
      status: respondedPayload.totalInbound === 0 ? 'idle' : 'connected',
    },
  ];

  const trending = trendingTopics.map((topic) => ({
    id: `trending-${topic.id}`,
    label: topic.topic,
    description: topic.summary ?? '',
    to: buildTrendLink(topic),
    category: topic.category ?? null,
    timeframe: topic.timeframe ?? timeframe,
    persona: topic.persona ?? null,
    metrics: {
      engagementScore: topic.engagementScore == null ? null : Number(topic.engagementScore),
      growthRate: topic.growthRate == null ? null : Number(topic.growthRate),
      mentionCount: topic.mentionCount ?? null,
      shareCount: topic.shareCount ?? null,
      followCount: topic.followCount ?? null,
    },
  }));

  return {
    generatedAt: now.toISOString(),
    timeframe,
    persona,
    pulse,
    trending,
  };
}

export default {
  getNavigationPulse,
};
