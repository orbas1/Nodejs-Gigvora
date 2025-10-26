import { Op } from 'sequelize';
import { ComplianceAuditLog, ProviderWorkspace } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_LIMIT = 200;

function ensureWorkspaceId(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('workspaceId must be a positive integer.');
  }
  return parsed;
}

function resolveWorkspaceId(req) {
  const explicit = req.query?.workspaceId ?? req.body?.workspaceId;
  if (explicit != null && explicit !== '') {
    return ensureWorkspaceId(explicit);
  }
  const sessionWorkspace = req.user?.workspaceId ?? req.user?.primaryWorkspaceId ?? null;
  if (sessionWorkspace == null) {
    throw new ValidationError('workspaceId is required.');
  }
  return ensureWorkspaceId(sessionWorkspace);
}

function computeSeverity(score) {
  if (score == null) {
    return 'low';
  }
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) {
    return 'low';
  }
  if (numeric >= 90) {
    return 'critical';
  }
  if (numeric >= 70) {
    return 'high';
  }
  if (numeric >= 40) {
    return 'medium';
  }
  return 'low';
}

function buildWhere({ workspaceId, status, severity, search, since }) {
  const where = { workspaceId };
  if (status?.length) {
    where.status = { [Op.in]: status.map((item) => `${item}`.trim().toLowerCase()) };
  }
  if (since) {
    where.openedAt = { [Op.gte]: since };
  }
  if (search) {
    const term = `%${search.trim().toLowerCase()}%`;
    const stringOperators = [Op.iLike, Op.like, Op.substring].filter(Boolean);
    const operator = stringOperators[0] ?? null;
    if (operator) {
      const value = operator === Op.substring ? term.replace(/%/g, '') : term;
      where[Op.or] = [
        { auditType: { [operator]: value } },
        { escalationLevel: { [operator]: value } },
      ];
    }
  }
  if (severity?.length) {
    const severityRanges = severity.map((level) => {
      switch (`${level}`.trim().toLowerCase()) {
        case 'critical':
          return { [Op.gte]: 90 };
        case 'high':
          return { [Op.and]: [{ [Op.gte]: 70 }, { [Op.lt]: 90 }] };
        case 'medium':
          return { [Op.and]: [{ [Op.gte]: 40 }, { [Op.lt]: 70 }] };
        default:
          return { [Op.lt]: 40 };
      }
    });
    where.severityScore = { [Op.or]: severityRanges };
  }
  return where;
}

function normaliseAuditRecord(record) {
  const plain = record.get({ plain: true });
  const severity = computeSeverity(plain.severityScore);
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    auditType: plain.auditType,
    status: plain.status,
    severityScore: plain.severityScore == null ? null : Number(plain.severityScore),
    severity,
    escalationLevel: plain.escalationLevel,
    findingsCount: plain.findingsCount,
    openedAt: plain.openedAt,
    closedAt: plain.closedAt,
    region: plain.region,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function buildSummary(records) {
  const summary = {
    total: records.length,
    open: 0,
    closed: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    latestEventAt: null,
  };

  for (const record of records) {
    if (record.status === 'completed' || record.status === 'cancelled') {
      summary.closed += 1;
    } else {
      summary.open += 1;
    }
    summary[record.severity] = (summary[record.severity] ?? 0) + 1;
    const candidateDate = record.updatedAt ?? record.openedAt ?? null;
    if (candidateDate) {
      const time = new Date(candidateDate).getTime();
      if (Number.isFinite(time)) {
        if (!summary.latestEventAt || time > summary.latestEventAt) {
          summary.latestEventAt = time;
        }
      }
    }
  }

  return {
    ...summary,
    latestEventAt: summary.latestEventAt ? new Date(summary.latestEventAt).toISOString() : null,
  };
}

export async function fetchComplianceAuditLogs(req, { limit = DEFAULT_LIMIT } = {}) {
  const workspaceId = resolveWorkspaceId(req);
  const normalizedLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), 500);

  const workspace = await ProviderWorkspace.findByPk(workspaceId, {
    attributes: ['id', 'name', 'slug'],
  });
  if (!workspace) {
    throw new NotFoundError('Workspace not found.');
  }

  const sinceDate = req.query?.since ? new Date(req.query.since) : undefined;
  const resolvedSince = sinceDate && Number.isFinite(sinceDate.getTime()) ? sinceDate : undefined;

  const rawWhere = buildWhere({
    workspaceId,
    status: req.query?.status,
    severity: req.query?.severity,
    search: req.query?.search,
    since: resolvedSince,
  });
  const logs = await ComplianceAuditLog.findAll({
    where: rawWhere,
    order: [
      ['openedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit: normalizedLimit,
  });

  const events = logs.map((record) => normaliseAuditRecord(record));
  const summary = buildSummary(events);

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    summary,
    filters: {
      statuses: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      severities: ['low', 'medium', 'high', 'critical'],
    },
    events,
  };
}

export default {
  fetchComplianceAuditLogs,
};
