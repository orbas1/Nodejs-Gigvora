import { Op, fn, col } from 'sequelize';
import {
  SecurityAlert,
  SecurityIncident,
  SecurityPlaybook,
  SecurityPlaybookRun,
  SecurityPostureSnapshot,
  SecurityThreatSweep,
} from '../models/securityOperationsModels.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

function normaliseSignals(signals) {
  if (!signals) {
    return [];
  }
  if (Array.isArray(signals)) {
    return signals.map((value) => `${value}`.trim()).filter(Boolean);
  }
  if (typeof signals === 'string') {
    return [`${signals}`.trim()].filter(Boolean);
  }
  return [];
}

function resolvePostureStatus(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) {
    return 'guarded';
  }
  if (numeric >= 90) {
    return 'resilient';
  }
  if (numeric >= 80) {
    return 'guarded';
  }
  if (numeric >= 65) {
    return 'watch';
  }
  return 'critical';
}

function serialiseAlert(alert) {
  if (!alert) {
    return null;
  }
  return {
    id: alert.alertKey,
    severity: alert.severity,
    category: alert.category,
    source: alert.source,
    asset: alert.asset,
    location: alert.location,
    recommendedAction: alert.recommendedAction,
    status: alert.status,
    detectedAt: alert.detectedAt ? alert.detectedAt.toISOString() : null,
    resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
    metadata: alert.metadata ?? null,
  };
}

function serialiseIncident(incident) {
  if (!incident) {
    return null;
  }
  return {
    id: incident.incidentKey,
    title: incident.title,
    severity: incident.severity,
    status: incident.status,
    owner: incident.owner,
    summary: incident.summary,
    openedAt: incident.openedAt ? incident.openedAt.toISOString() : null,
    resolvedAt: incident.resolvedAt ? incident.resolvedAt.toISOString() : null,
    metadata: incident.metadata ?? null,
  };
}

function serialisePlaybook(playbook, runCount = 0) {
  if (!playbook) {
    return null;
  }
  return {
    id: playbook.slug,
    name: playbook.name,
    owner: playbook.owner,
    category: playbook.category,
    summary: playbook.summary,
    status: playbook.status,
    lastExecutedAt: playbook.lastRunAt ? playbook.lastRunAt.toISOString() : null,
    runCount,
    metadata: playbook.metadata ?? null,
  };
}

function deriveAlertOrder(severity) {
  switch (severity) {
    case 'critical':
      return 0;
    case 'high':
      return 1;
    case 'medium':
      return 2;
    default:
      return 3;
  }
}

function appendActionMetadata(alert, { status, actorId, note }) {
  const metadata = alert.metadata && typeof alert.metadata === 'object' ? { ...alert.metadata } : {};
  const history = Array.isArray(metadata.actions) ? metadata.actions.slice(-19) : [];
  history.push({
    status,
    actorId: actorId ?? null,
    note: note ?? null,
    at: new Date().toISOString(),
  });
  metadata.actions = history;
  if (note) {
    metadata.lastNote = note;
  }
  return metadata;
}

export async function getSecurityTelemetry({ includeResolvedAlerts = false } = {}) {
  const [posture, alerts, incidents, playbooks, runAggregates] = await Promise.all([
    SecurityPostureSnapshot.findOne({ order: [['capturedAt', 'DESC']] }),
    SecurityAlert.findAll({
      where: includeResolvedAlerts
        ? undefined
        : {
            status: {
              [Op.notIn]: ['resolved', 'closed'],
            },
          },
      order: [
        ['severity', 'ASC'],
        ['detectedAt', 'DESC'],
      ],
      limit: 12,
    }),
    SecurityIncident.findAll({ order: [['openedAt', 'DESC']], limit: 6 }),
    SecurityPlaybook.findAll({
      where: { status: { [Op.ne]: 'retired' } },
      order: [['name', 'ASC']],
      limit: 10,
    }),
    SecurityPlaybookRun.findAll({
      attributes: ['playbookId', [fn('COUNT', col('id')), 'runCount']],
      group: ['playbookId'],
    }),
  ]);

  const runCountByPlaybookId = new Map(
    runAggregates.map((row) => [row.get('playbookId'), Number(row.get('runCount')) || 0]),
  );

  const postureScore = posture?.attackSurfaceScore ?? null;
  const postureSignals = normaliseSignals(posture?.signals);

  return {
    posture: {
      status: resolvePostureStatus(postureScore),
      attackSurfaceScore: postureScore != null ? Number(postureScore) : null,
      attackSurfaceChange: posture?.attackSurfaceDelta != null ? Number(posture.attackSurfaceDelta) : null,
      signals: postureSignals,
    },
    metrics: {
      blockedIntrusions: posture?.blockedIntrusions ?? 0,
      quarantinedAssets: posture?.quarantinedAssets ?? 0,
      highRiskVulnerabilities: posture?.highRiskVulnerabilities ?? 0,
      meanTimeToRespondMinutes: posture?.meanTimeToRespondMinutes ?? null,
    },
    patchWindow: {
      nextWindow: posture?.nextPatchWindow ? posture.nextPatchWindow.toISOString() : null,
      backlog: posture?.patchBacklog ?? null,
      backlogChange: posture?.patchBacklogDelta ?? null,
    },
    alerts: alerts
      .map((alert) => ({ alert, sort: deriveAlertOrder(alert.severity) }))
      .sort((a, b) => (a.sort === b.sort ? 0 : a.sort - b.sort))
      .map(({ alert }) => serialiseAlert(alert)),
    incidents: incidents.map((incident) => serialiseIncident(incident)),
    playbooks: playbooks.map((playbook) => serialisePlaybook(playbook, runCountByPlaybookId.get(playbook.id) ?? 0)),
  };
}

async function mutateAlertStatus(alertKey, status, { actorId = null, note = null } = {}) {
  if (!alertKey) {
    throw new ValidationError('An alert identifier is required.');
  }
  const alert = await SecurityAlert.findOne({ where: { alertKey } });
  if (!alert) {
    throw new NotFoundError('Security alert not found.');
  }

  const metadata = appendActionMetadata(alert, { status, actorId, note });
  const resolvedAt = ['resolved', 'suppressed'].includes(status) ? new Date() : alert.resolvedAt;

  await alert.update({ status, resolvedAt, metadata });
  await alert.reload();
  return serialiseAlert(alert);
}

export async function acknowledgeSecurityAlert(alertKey, { actorId, note } = {}) {
  return mutateAlertStatus(alertKey, 'acknowledged', { actorId, note });
}

export async function suppressSecurityAlert(alertKey, { actorId, note } = {}) {
  return mutateAlertStatus(alertKey, 'suppressed', { actorId, note });
}

export async function queueThreatSweep({ requestedBy = null, sweepType = 'runtime-anomaly', reason, scope, metadata } = {}) {
  const payload = {};
  if (reason) {
    payload.reason = reason;
  }
  if (scope) {
    payload.scope = scope;
  }
  if (metadata && typeof metadata === 'object') {
    payload.metadata = metadata;
  }

  const sweep = await SecurityThreatSweep.create({
    requestedBy,
    sweepType,
    status: 'queued',
    payload,
  });

  return {
    id: sweep.id,
    status: sweep.status,
    requestedBy: sweep.requestedBy,
    sweepType: sweep.sweepType,
    payload: sweep.payload ?? null,
    createdAt: sweep.createdAt ? sweep.createdAt.toISOString() : null,
  };
}

export default {
  getSecurityTelemetry,
  acknowledgeSecurityAlert,
  suppressSecurityAlert,
  queueThreatSweep,
};
