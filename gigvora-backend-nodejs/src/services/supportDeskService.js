import { Op } from 'sequelize';
import {
  SupportCasePlaybook,
  SupportCaseLink,
  SupportCaseSatisfaction,
  SupportPlaybook,
  SupportPlaybookStep,
  SupportKnowledgeArticle,
  DisputeCase,
  DisputeEvent,
  EscrowTransaction,
  EscrowAccount,
} from '../models/index.js';
import {
  SupportCase,
  Message,
  MessageAttachment,
  MessageThread,
  MessageParticipant,
  User,
} from '../models/messagingModels.js';
import { ValidationError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const CACHE_NAMESPACE = 'supportDesk:freelancer';
const CACHE_TTL_SECONDS = 45;

function normalizeFreelancerId(value) {
  const normalized = Number.parseInt(value, 10);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return normalized;
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }
  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !/^(_|internal|private)/i.test(key)),
  );
}

function formatUser(instance) {
  if (!instance) return null;
  const plain = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  const name = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim();
  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    userType: plain.userType,
    name: name || plain.email || `User #${plain.id}`,
  };
}

function formatAttachment(attachment) {
  if (!attachment) return null;
  const plain = attachment.get ? attachment.get({ plain: true }) : attachment;
  return {
    id: plain.id,
    fileName: plain.fileName,
    mimeType: plain.mimeType,
    fileSize: plain.fileSize == null ? null : Number(plain.fileSize),
    storageKey: plain.storageKey,
    checksum: plain.checksum ?? null,
  };
}

function formatMessageRecord(message, freelancerId) {
  const base = message.toPublicObject();
  const senderInstance = message.get?.('sender') ?? message.sender;
  const sender = senderInstance
    ? {
        ...formatUser(senderInstance),
        isFreelancer: senderInstance.id === freelancerId,
      }
    : {
        id: null,
        name: 'Gigvora system',
        email: null,
        userType: 'system',
        isFreelancer: false,
      };

  const attachments = Array.isArray(message.attachments)
    ? message.attachments.map((attachment) => formatAttachment(attachment)).filter(Boolean)
    : [];

  return {
    ...base,
    sender,
    attachments,
  };
}

function resolveLinkedOrder(links = []) {
  if (!Array.isArray(links) || links.length === 0) {
    return null;
  }

  const transactionLink = links.find((link) => link.transaction);
  if (transactionLink) {
    const { transaction, account } = transactionLink;
    return {
      type: 'transaction',
      reference: transaction?.reference ?? transactionLink.reference ?? null,
      amount: transactionLink.orderAmount ?? transaction?.amount ?? null,
      currencyCode: transactionLink.currencyCode ?? transaction?.currencyCode ?? null,
      status: transaction?.status ?? null,
      gigId: transaction?.gigId ?? transactionLink.gigId ?? null,
      gigTitle: transactionLink.gigTitle ?? null,
      milestoneLabel: transaction?.milestoneLabel ?? null,
      clientName: transactionLink.clientName ?? account?.userId ?? null,
    };
  }

  const first = links[0];
  return {
    type: first.linkType,
    reference: first.reference ?? null,
    amount: first.orderAmount ?? null,
    currencyCode: first.currencyCode ?? null,
    gigId: first.gigId ?? null,
    gigTitle: first.gigTitle ?? null,
    clientName: first.clientName ?? null,
  };
}

function formatCasePlaybook(casePlaybook) {
  const plain = casePlaybook.get ? casePlaybook.get({ plain: true }) : casePlaybook;
  const playbookInstance = casePlaybook.get?.('playbook') ?? casePlaybook.playbook;
  let playbook = null;
  if (playbookInstance) {
    const base = playbookInstance.toPublicObject?.() ?? playbookInstance;
    const steps = Array.isArray(playbookInstance.steps)
      ? playbookInstance.steps
          .map((step) => step.toPublicObject?.() ?? step)
          .sort((a, b) => (a.stepNumber ?? 0) - (b.stepNumber ?? 0))
      : [];
    playbook = {
      ...base,
      steps,
    };
  }
  return {
    id: plain.id,
    status: plain.status,
    assignedAt: plain.assignedAt,
    completedAt: plain.completedAt,
    notes: plain.notes,
    playbook,
  };
}

function formatCaseLink(link) {
  const plain = link.get ? link.get({ plain: true }) : link;
  const transactionInstance = link.get?.('transaction') ?? link.transaction;
  const transaction = transactionInstance?.toPublicObject?.() ?? transactionInstance ?? null;
  const account = transactionInstance?.account?.toPublicObject?.() ?? transactionInstance?.account ?? null;
  return {
    ...plain,
    metadata: sanitizeMetadata(plain.metadata),
    orderAmount: plain.orderAmount == null ? null : Number.parseFloat(plain.orderAmount),
    transaction,
    account,
  };
}

function formatSupportCase(record, transcriptsByThread) {
  const plain = record.get({ plain: true });
  const threadInstance = record.get?.('thread') ?? record.thread;
  const participants = threadInstance?.participants
    ? threadInstance.participants.map((participant) => ({
        id: participant.id,
        userId: participant.userId,
        role: participant.role,
      }))
    : [];

  const casePlaybooks = Array.isArray(record.casePlaybooks)
    ? record.casePlaybooks.map((casePlaybook) => formatCasePlaybook(casePlaybook))
    : [];

  const surveys = Array.isArray(record.surveys)
    ? record.surveys.map((survey) => survey.toPublicObject())
    : [];

  const links = Array.isArray(record.links)
    ? record.links.map((link) => formatCaseLink(link))
    : [];

  const transcript = transcriptsByThread.get(plain.threadId) ?? [];

  return {
    ...plain,
    metadata: sanitizeMetadata(plain.metadata),
    assignedAgent: record.assignedAgent ? formatUser(record.assignedAgent) : null,
    escalatedByUser: record.escalatedByUser ? formatUser(record.escalatedByUser) : null,
    resolvedByUser: record.resolvedByUser ? formatUser(record.resolvedByUser) : null,
    participants,
    transcript,
    playbooks: casePlaybooks,
    surveys,
    links,
    linkedOrder: resolveLinkedOrder(links),
  };
}

function formatDispute(record) {
  const base = record.toPublicObject();
  const transactionInstance = record.get?.('transaction') ?? record.transaction;
  const transaction = transactionInstance?.toPublicObject?.() ?? transactionInstance ?? null;
  const events = Array.isArray(record.events)
    ? record.events.map((event) => event.toPublicObject())
    : [];
  return {
    ...base,
    transaction,
    events,
  };
}

function computeAverageDurationMinutes(records, startKey, endKey) {
  const durations = [];
  records.forEach((record) => {
    const startRaw = record[startKey] ?? record.get?.(startKey);
    const endRaw = record[endKey] ?? record.get?.(endKey);
    if (!startRaw || !endRaw) {
      return;
    }
    const start = new Date(startRaw);
    const end = new Date(endRaw);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (Number.isFinite(diffMinutes) && diffMinutes >= 0) {
      durations.push(diffMinutes);
    }
  });
  if (!durations.length) {
    return null;
  }
  const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return Number(average.toFixed(2));
}

function computeCsatMetrics(records) {
  const responses = [];
  const trailing = [];
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  records.forEach((record) => {
    const surveys = Array.isArray(record.surveys) ? record.surveys : [];
    surveys.forEach((survey) => {
      const plain = survey.toPublicObject();
      if (plain.score == null) {
        return;
      }
      const score = Number(plain.score);
      if (!Number.isFinite(score)) {
        return;
      }
      responses.push({ ...plain, score });
      const capturedAt = plain.capturedAt ? new Date(plain.capturedAt) : null;
      if (capturedAt && !Number.isNaN(capturedAt.getTime()) && now - capturedAt.getTime() <= THIRTY_DAYS_MS) {
        trailing.push(score);
      }
    });
  });

  if (!responses.length) {
    return {
      averageScore: null,
      responseRate: records.length ? 0 : null,
      trailing30DayAverage: null,
      totalResponses: 0,
    };
  }

  const totalScore = responses.reduce((sum, survey) => sum + survey.score, 0);
  const averageScore = Number((totalScore / responses.length).toFixed(2));
  const trailingAverage = trailing.length
    ? Number((trailing.reduce((sum, value) => sum + value, 0) / trailing.length).toFixed(2))
    : null;
  const responseRate = records.length
    ? Number(((responses.length / records.length) * 100).toFixed(1))
    : null;

  return {
    averageScore,
    responseRate,
    trailing30DayAverage: trailingAverage,
    totalResponses: responses.length,
  };
}

async function getFreelancerSupportDesk(freelancerId, { bypassCache = false } = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { freelancerId: normalizedId });

  if (!bypassCache) {
    const cached = appCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const supportCases = await SupportCase.findAll({
    include: [
      {
        model: MessageThread,
        as: 'thread',
        required: true,
        include: [
          {
            model: MessageParticipant,
            as: 'participants',
            where: { userId: normalizedId },
            attributes: ['id', 'userId', 'role'],
            required: true,
          },
        ],
      },
      { model: User, as: 'assignedAgent', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'escalatedByUser', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'resolvedByUser', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      {
        model: SupportCasePlaybook,
        as: 'casePlaybooks',
        include: [
          {
            model: SupportPlaybook,
            as: 'playbook',
            include: [{ model: SupportPlaybookStep, as: 'steps' }],
          },
        ],
      },
      { model: SupportCaseSatisfaction, as: 'surveys' },
      {
        model: SupportCaseLink,
        as: 'links',
        include: [
          {
            model: EscrowTransaction,
            as: 'transaction',
            include: [{ model: EscrowAccount, as: 'account' }],
          },
        ],
      },
    ],
    order: [['escalatedAt', 'DESC']],
    distinct: true,
  });

  const threadIds = supportCases.map((supportCase) => supportCase.threadId).filter(Boolean);

  const messageRecords = threadIds.length
    ? await Message.findAll({
        where: { threadId: { [Op.in]: threadIds } },
        include: [
          { model: MessageAttachment, as: 'attachments' },
          { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        ],
        order: [['createdAt', 'ASC']],
      })
    : [];

  const transcriptsByThread = new Map();
  messageRecords.forEach((message) => {
    const formatted = formatMessageRecord(message, normalizedId);
    if (!transcriptsByThread.has(formatted.threadId)) {
      transcriptsByThread.set(formatted.threadId, []);
    }
    transcriptsByThread.get(formatted.threadId).push(formatted);
  });

  const supportCasePayload = supportCases.map((record) => formatSupportCase(record, transcriptsByThread));

  const averageFirstResponseMinutes = computeAverageDurationMinutes(supportCases, 'escalatedAt', 'firstResponseAt');
  const averageResolutionMinutes = computeAverageDurationMinutes(supportCases, 'escalatedAt', 'resolvedAt');
  const csatMetrics = computeCsatMetrics(supportCases);
  const openSupportCases = supportCasePayload.filter(
    (supportCase) => !['resolved', 'closed'].includes(supportCase.status),
  ).length;

  const disputeRecords = await DisputeCase.findAll({
    include: [
      {
        model: EscrowTransaction,
        as: 'transaction',
        required: true,
        include: [
          {
            model: EscrowAccount,
            as: 'account',
            where: { userId: normalizedId },
            required: true,
          },
        ],
      },
      { model: DisputeEvent, as: 'events', separate: true, order: [['eventAt', 'ASC']] },
    ],
    order: [['openedAt', 'DESC']],
    distinct: true,
  });

  const disputePayload = disputeRecords.map((record) => formatDispute(record));
  const openDisputes = disputePayload.filter((dispute) => !['settled', 'closed'].includes(dispute.status)).length;

  const playbookRecords = await SupportPlaybook.findAll({
    include: [{ model: SupportPlaybookStep, as: 'steps' }],
    order: [
      ['stage', 'ASC'],
      ['title', 'ASC'],
    ],
  });

  const playbooks = playbookRecords.map((playbook) => {
    const base = playbook.toPublicObject();
    const steps = Array.isArray(playbook.steps)
      ? playbook.steps
          .map((step) => step.toPublicObject())
          .sort((a, b) => (a.stepNumber ?? 0) - (b.stepNumber ?? 0))
      : [];
    return {
      ...base,
      steps,
    };
  });

  const knowledgeArticles = await SupportKnowledgeArticle.findAll({
    where: { audience: { [Op.in]: ['freelancer', 'support_team'] } },
    order: [
      ['category', 'ASC'],
      ['title', 'ASC'],
    ],
  });

  const knowledgeBase = knowledgeArticles.map((article) => {
    const base = article.toPublicObject();
    let tags = base.tags;
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (error) {
        tags = [tags];
      }
    }
    if (!Array.isArray(tags) && tags != null) {
      tags = [String(tags)];
    }
    let resourceLinks = base.resourceLinks;
    if (typeof resourceLinks === 'string') {
      try {
        resourceLinks = JSON.parse(resourceLinks);
      } catch (error) {
        resourceLinks = resourceLinks ? [{ label: 'Resource', url: resourceLinks }] : [];
      }
    }
    return {
      ...base,
      tags: Array.isArray(tags) ? tags : [],
      resourceLinks: Array.isArray(resourceLinks) ? resourceLinks : [],
    };
  });

  const payload = {
    refreshedAt: new Date().toISOString(),
    metrics: {
      openSupportCases,
      openDisputes,
      averageFirstResponseMinutes,
      averageResolutionMinutes,
      csatScore: csatMetrics.averageScore,
      csatResponseRate: csatMetrics.responseRate,
      csatTrailing30DayScore: csatMetrics.trailing30DayAverage,
      csatResponses: csatMetrics.totalResponses,
    },
    supportCases: supportCasePayload,
    disputes: disputePayload,
    playbooks,
    knowledgeBase,
  };

  appCache.set(cacheKey, payload, CACHE_TTL_SECONDS);
  return payload;
}

export default {
  getFreelancerSupportDesk,
};
