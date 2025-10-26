import { Op, literal } from 'sequelize';
import {
  GovernanceContentSubmission,
  GovernanceModerationAction,
  GOVERNANCE_ACTION_TYPES,
  GOVERNANCE_CONTENT_PRIORITIES,
  GOVERNANCE_CONTENT_SEVERITIES,
  GOVERNANCE_CONTENT_STATUSES,
} from '../models/contentGovernanceModels.js';
import { sequelize } from '../models/sequelizeClient.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const STATUS_SET = new Set(GOVERNANCE_CONTENT_STATUSES);
const PRIORITY_SET = new Set(GOVERNANCE_CONTENT_PRIORITIES);
const SEVERITY_SET = new Set(GOVERNANCE_CONTENT_SEVERITIES);
const ACTION_SET = new Set(GOVERNANCE_ACTION_TYPES);

const dialect = sequelize?.getDialect?.() ?? '';
const isPostgres = typeof dialect === 'string' && dialect.toLowerCase().startsWith('postgres');
const likeOperator = isPostgres && Op.iLike ? Op.iLike : Op.like;

const queryGenerator = sequelize?.getQueryInterface?.().queryGenerator;
const quoteIdentifier = (identifier) => {
  if (!queryGenerator?.quoteIdentifier) {
    return `"${identifier}"`;
  }
  return queryGenerator.quoteIdentifier(identifier);
};

const submissionAlias = quoteIdentifier('GovernanceContentSubmission');
const priorityColumnReference = `${submissionAlias}.${quoteIdentifier('priority')}`;
const severityColumnReference = `${submissionAlias}.${quoteIdentifier('severity')}`;

const priorityOrderExpression = literal(`
  CASE
    WHEN ${priorityColumnReference} = 'urgent' THEN 4
    WHEN ${priorityColumnReference} = 'high' THEN 3
    WHEN ${priorityColumnReference} = 'standard' THEN 2
    WHEN ${priorityColumnReference} = 'low' THEN 1
    ELSE 0
  END
`);

const severityOrderExpression = literal(`
  CASE
    WHEN ${severityColumnReference} = 'critical' THEN 4
    WHEN ${severityColumnReference} = 'high' THEN 3
    WHEN ${severityColumnReference} = 'medium' THEN 2
    WHEN ${severityColumnReference} = 'low' THEN 1
    ELSE 0
  END
`);

function parseInteger(value, label, { allowNull = false, min = Number.MIN_SAFE_INTEGER } = {}) {
  if (value == null) {
    if (allowNull) return null;
    throw new ValidationError(`${label} is required.`);
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${label} must be a number.`);
  }
  if (numeric < min) {
    throw new ValidationError(`${label} must be greater than or equal to ${min}.`);
  }
  return numeric;
}

function sanitizeSearch(value) {
  if (!value) return null;
  return value.trim().slice(0, 200);
}

function mapSubmission(instance) {
  if (!instance) return null;
  const plain = instance.get({ plain: true });
  return {
    id: plain.id,
    referenceId: plain.referenceId,
    referenceType: plain.referenceType,
    channel: plain.channel,
    submittedById: plain.submittedById,
    submittedByType: plain.submittedByType,
    assignedReviewerId: plain.assignedReviewerId,
    assignedTeam: plain.assignedTeam,
    status: plain.status,
    priority: plain.priority,
    severity: plain.severity,
    riskScore: plain.riskScore == null ? null : Number(plain.riskScore),
    title: plain.title,
    summary: plain.summary,
    submittedAt: plain.submittedAt,
    lastActivityAt: plain.lastActivityAt,
    slaMinutes: plain.slaMinutes,
    region: plain.region,
    language: plain.language,
    metadata: plain.metadata ?? {},
    rejectionReason: plain.rejectionReason,
    resolutionNotes: plain.resolutionNotes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    actions: Array.isArray(plain.actions)
      ? plain.actions.map((action) => ({
          id: action.id,
          submissionId: action.submissionId,
          actorId: action.actorId,
          actorType: action.actorType,
          action: action.action,
          severity: action.severity,
          riskScore: action.riskScore == null ? null : Number(action.riskScore),
          reason: action.reason,
          guidanceLink: action.guidanceLink,
          metadata: action.metadata ?? {},
          resolutionSummary: action.resolutionSummary,
          createdAt: action.createdAt,
          updatedAt: action.updatedAt,
        }))
      : undefined,
  };
}

function buildQueueWhere({ status, priority, severity, reviewerId, team, search, region }) {
  const where = {};

  if (status && STATUS_SET.has(status)) {
    where.status = status;
  }
  if (priority && PRIORITY_SET.has(priority)) {
    where.priority = priority;
  }
  if (severity && SEVERITY_SET.has(severity)) {
    where.severity = severity;
  }
  if (team) {
    where.assignedTeam = team.trim();
  }
  if (reviewerId) {
    const numericReviewer = Number.parseInt(reviewerId, 10);
    if (Number.isFinite(numericReviewer)) {
      where.assignedReviewerId = numericReviewer;
    }
  }
  if (region) {
    where.region = region.trim().toLowerCase();
  }

  const sanitizedSearch = sanitizeSearch(search);
  if (sanitizedSearch) {
    where[Op.or] = [
      { title: { [likeOperator]: `%${sanitizedSearch}%` } },
      { summary: { [likeOperator]: `%${sanitizedSearch}%` } },
      { referenceId: { [likeOperator]: `%${sanitizedSearch}%` } },
    ];
  }

  return where;
}

export async function listContentSubmissions(filters = {}) {
  const page = parseInteger(filters.page ?? 1, 'page', { min: 1 });
  const pageSize = parseInteger(filters.pageSize ?? 25, 'pageSize', { min: 1 });
  const offset = (page - 1) * pageSize;

  const where = buildQueueWhere(filters);

  const [
    { count, rows },
    metrics,
  ] = await Promise.all([
    GovernanceContentSubmission.findAndCountAll({
      where,
      order: [
        [priorityOrderExpression, 'DESC'],
        [severityOrderExpression, 'DESC'],
        ['submittedAt', 'ASC'],
      ],
      limit: pageSize,
      offset,
      include: [
        {
          model: GovernanceModerationAction,
          as: 'actions',
          separate: false,
          order: [['createdAt', 'DESC']],
        },
      ],
    }),
    GovernanceContentSubmission.findAll({
      attributes: [
        'status',
        'severity',
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where,
      group: ['status', 'severity', 'priority'],
    }),
  ]);

  const summary = metrics.reduce(
    (acc, metric) => {
      const plain = metric.get({ plain: true });
      const countValue = Number.parseInt(plain.count, 10) || 0;
      acc.total += countValue;
      if (plain.status === 'pending' || plain.status === 'in_review') {
        acc.awaitingReview += countValue;
      }
      if (plain.severity === 'high' || plain.severity === 'critical') {
        acc.highSeverity += countValue;
      }
      if (plain.priority === 'urgent') {
        acc.urgent += countValue;
      }
      return acc;
    },
    { total: 0, awaitingReview: 0, highSeverity: 0, urgent: 0 },
  );

  return {
    items: rows.map(mapSubmission),
    pagination: {
      page,
      pageSize,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
    },
    summary,
  };
}

export async function getSubmission(id) {
  const submission = await GovernanceContentSubmission.findByPk(id, {
    include: [{ model: GovernanceModerationAction, as: 'actions', separate: false, order: [['createdAt', 'DESC']] }],
  });
  if (!submission) {
    throw new NotFoundError('Submission not found.');
  }
  return mapSubmission(submission);
}

function normalizeMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value;
}

export async function updateSubmissionStatus(id, payload = {}, { actorId } = {}) {
  const submission = await GovernanceContentSubmission.findByPk(id);
  if (!submission) {
    throw new NotFoundError('Submission not found.');
  }

  const updates = {};

  if (payload.status) {
    if (!STATUS_SET.has(payload.status)) {
      throw new ValidationError('Invalid status value.');
    }
    updates.status = payload.status;
  }

  if (payload.priority) {
    if (!PRIORITY_SET.has(payload.priority)) {
      throw new ValidationError('Invalid priority value.');
    }
    updates.priority = payload.priority;
  }

  if (payload.severity) {
    if (!SEVERITY_SET.has(payload.severity)) {
      throw new ValidationError('Invalid severity value.');
    }
    updates.severity = payload.severity;
  }

  if (payload.riskScore != null) {
    const riskScore = Number.parseFloat(payload.riskScore);
    if (!Number.isFinite(riskScore) || riskScore < 0 || riskScore > 999.99) {
      throw new ValidationError('riskScore must be between 0 and 999.99');
    }
    updates.riskScore = riskScore;
  }

  if (payload.assignedReviewerId !== undefined) {
    updates.assignedReviewerId = payload.assignedReviewerId == null ? null : parseInteger(payload.assignedReviewerId, 'assignedReviewerId');
  }

  if (payload.assignedTeam !== undefined) {
    updates.assignedTeam = payload.assignedTeam ? `${payload.assignedTeam}`.trim().slice(0, 120) : null;
  }

  if (payload.rejectionReason !== undefined) {
    updates.rejectionReason = payload.rejectionReason ? `${payload.rejectionReason}`.trim().slice(0, 600) : null;
  }

  if (payload.resolutionNotes !== undefined) {
    updates.resolutionNotes = payload.resolutionNotes ? `${payload.resolutionNotes}`.trim() : null;
  }

  if (payload.metadata !== undefined) {
    updates.metadata = normalizeMetadata(payload.metadata);
  }

  if (Object.keys(updates).length === 0) {
    return mapSubmission(submission);
  }

  updates.lastActivityAt = new Date();

  await submission.update(updates);

  if (payload.status && ['approved', 'rejected', 'needs_changes'].includes(payload.status)) {
    await GovernanceModerationAction.create({
      submissionId: submission.id,
      actorId: actorId ?? null,
      actorType: 'admin',
      action: payload.status === 'approved' ? 'approve' : payload.status === 'rejected' ? 'reject' : 'request_changes',
      severity: submission.severity,
      riskScore: submission.riskScore,
      reason: payload.rejectionReason ?? payload.resolutionNotes ?? null,
      metadata: normalizeMetadata(payload.metadata),
      resolutionSummary: payload.resolutionNotes ?? null,
    });
  }

  return getSubmission(submission.id);
}

export async function assignSubmission(id, { reviewerId, team }, { actorId } = {}) {
  const submission = await GovernanceContentSubmission.findByPk(id);
  if (!submission) {
    throw new NotFoundError('Submission not found.');
  }

  const updates = {};
  if (reviewerId !== undefined) {
    updates.assignedReviewerId = reviewerId == null ? null : parseInteger(reviewerId, 'reviewerId');
  }
  if (team !== undefined) {
    updates.assignedTeam = team ? `${team}`.trim().slice(0, 120) : null;
  }
  updates.lastActivityAt = new Date();

  await submission.update(updates);

  await GovernanceModerationAction.create({
    submissionId: submission.id,
    actorId: actorId ?? null,
    actorType: 'admin',
    action: 'assign',
    severity: submission.severity,
    riskScore: submission.riskScore,
    reason: team ? `Assigned to ${team}` : 'Assignment updated',
    metadata: { reviewerId: submission.assignedReviewerId, team: submission.assignedTeam },
  });

  return getSubmission(submission.id);
}

export async function recordModerationAction(id, payload = {}, { actorId } = {}) {
  const submission = await GovernanceContentSubmission.findByPk(id);
  if (!submission) {
    throw new NotFoundError('Submission not found.');
  }

  const action = `${payload.action ?? ''}`.trim();
  if (!ACTION_SET.has(action)) {
    throw new ValidationError('Invalid action type.');
  }

  const severity = payload.severity && SEVERITY_SET.has(payload.severity) ? payload.severity : submission.severity;

  const riskScore = payload.riskScore != null ? Number.parseFloat(payload.riskScore) : submission.riskScore;
  if (riskScore != null && (!Number.isFinite(riskScore) || riskScore < 0 || riskScore > 999.99)) {
    throw new ValidationError('riskScore must be between 0 and 999.99');
  }

  const actionRecord = await GovernanceModerationAction.create({
    submissionId: submission.id,
    actorId: actorId ?? null,
    actorType: 'admin',
    action,
    severity,
    riskScore,
    reason: payload.reason ? `${payload.reason}`.trim().slice(0, 600) : null,
    guidanceLink: payload.guidanceLink ? `${payload.guidanceLink}`.trim().slice(0, 500) : null,
    metadata: normalizeMetadata(payload.metadata),
    resolutionSummary: payload.resolutionSummary ? `${payload.resolutionSummary}`.trim() : null,
  });

  const updates = {};
  if (payload.status && STATUS_SET.has(payload.status)) {
    updates.status = payload.status;
  }
  if (payload.priority && PRIORITY_SET.has(payload.priority)) {
    updates.priority = payload.priority;
  }
  if (payload.severity && SEVERITY_SET.has(payload.severity)) {
    updates.severity = payload.severity;
  }
  if (payload.slaMinutes != null) {
    updates.slaMinutes = parseInteger(payload.slaMinutes, 'slaMinutes', { allowNull: true, min: 0 });
  }
  if (Object.keys(updates).length > 0) {
    updates.lastActivityAt = new Date();
    updates.riskScore = riskScore;
    await submission.update(updates);
  }

  return {
    action: mapSubmission(await GovernanceContentSubmission.findByPk(submission.id, { include: [{ model: GovernanceModerationAction, as: 'actions', separate: false, order: [['createdAt', 'DESC']] }] })).actions?.[0],
    submission: await getSubmission(submission.id),
  };
}

export async function listModerationActions(id) {
  const submission = await GovernanceContentSubmission.findByPk(id);
  if (!submission) {
    throw new NotFoundError('Submission not found.');
  }

  const actions = await GovernanceModerationAction.findAll({
    where: { submissionId: submission.id },
    order: [['createdAt', 'DESC']],
  });

  return actions.map((action) => ({
    id: action.id,
    submissionId: action.submissionId,
    actorId: action.actorId,
    actorType: action.actorType,
    action: action.action,
    severity: action.severity,
    riskScore: action.riskScore == null ? null : Number(action.riskScore),
    reason: action.reason,
    guidanceLink: action.guidanceLink,
    metadata: action.metadata ?? {},
    resolutionSummary: action.resolutionSummary,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
  }));
}

export default {
  listContentSubmissions,
  getSubmission,
  updateSubmissionStatus,
  assignSubmission,
  recordModerationAction,
  listModerationActions,
};
