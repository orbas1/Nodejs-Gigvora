import path from 'node:path';
import { promises as fs } from 'node:fs';

import { Op } from 'sequelize';

import baseModels from '../models/adminMonitoringModels.js';
import logger from '../utils/logger.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import systemSettingsService from './systemSettingsService.js';

let modelsContainer = baseModels;
let sequelizeInstance = baseModels.sequelize;
let log = logger.child({ component: 'adminMonitoringService' });

function getModels(strict = false) {
  const container = modelsContainer ?? baseModels;
  if (strict && (!container || !container.MonitoringInsightsSnapshot)) {
    throw new Error('Monitoring models are not configured.');
  }
  return container;
}

function getSequelize(strict = false) {
  const instance = sequelizeInstance ?? getModels(strict)?.sequelize ?? baseModels.sequelize;
  if (strict && (!instance || typeof instance.transaction !== 'function')) {
    throw new Error('Sequelize instance is not configured.');
  }
  return instance;
}

function reinitialiseLogger(nextLogger) {
  if (nextLogger) {
    log = typeof nextLogger.child === 'function' ? nextLogger.child({ component: 'adminMonitoringService' }) : nextLogger;
  } else {
    log = logger.child({ component: 'adminMonitoringService' });
  }
}

export function __setDependencies({ models: overrides, sequelize, logger: loggerOverride } = {}) {
  modelsContainer = overrides ?? baseModels;
  sequelizeInstance = sequelize ?? modelsContainer?.sequelize ?? baseModels.sequelize;
  reinitialiseLogger(loggerOverride);
}

export function __resetDependencies() {
  modelsContainer = baseModels;
  sequelizeInstance = baseModels.sequelize;
  reinitialiseLogger();
}

function normaliseTimeframe(value, { fallback = null } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const trimmed = `${value}`.trim();
  if (!/^\d+d$/i.test(trimmed)) {
    throw new ValidationError('timeframe must be expressed in days, e.g. 7d or 30d.');
  }
  return trimmed.toLowerCase();
}

function normaliseBoolean(value, fallback = undefined) {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'off'].includes(lowered)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return fallback;
}

function normaliseString(value, { max = 200, fallback = null, lower = false } = {}) {
  if (value == null) {
    return fallback;
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return fallback;
  }
  if (trimmed.length > max) {
    throw new ValidationError(`Value exceeds maximum length of ${max} characters.`);
  }
  return lower ? trimmed.toLowerCase() : trimmed;
}

function resolveLikeOperator() {
  const dialect = getSequelize()?.getDialect?.() ?? 'postgres';
  return dialect === 'postgres' || dialect === 'postgresql' ? Op.iLike : Op.like;
}

function buildSearchFilter(search, columns, { caseSensitive = false } = {}) {
  if (!search) {
    return null;
  }
  const like = resolveLikeOperator();
  const prepared = caseSensitive || like === Op.iLike ? `%${search}%` : `%${search.toLowerCase()}%`;
  const sequelize = getSequelize(true);
  if (like === Op.like && !caseSensitive) {
    return {
      [Op.or]: columns.map((column) =>
        sequelize.where(sequelize.fn('lower', sequelize.col(column)), {
          [Op.like]: prepared,
        }),
      ),
    };
  }
  return {
    [Op.or]: columns.map((column) => ({
      [column]: {
        [like]: prepared,
      },
    })),
  };
}

function computeTimeWindow(timeframe) {
  if (!timeframe) {
    return null;
  }
  const match = /^([0-9]+)d$/.exec(timeframe);
  if (!match) {
    return null;
  }
  const days = Number.parseInt(match[1], 10);
  if (!Number.isFinite(days)) {
    return null;
  }
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end };
}

function median(values) {
  const filtered = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!filtered.length) {
    return 0;
  }
  const mid = Math.floor(filtered.length / 2);
  if (filtered.length % 2 === 0) {
    return Math.round(((filtered[mid - 1] + filtered[mid]) / 2) * 100) / 100;
  }
  return Math.round(filtered[mid] * 100) / 100;
}

function ensureViewPayload(payload = {}) {
  const name = normaliseString(payload.name, { max: 160 });
  if (!name) {
    throw new ValidationError('name is required to create a saved view.');
  }
  const query = payload.query && typeof payload.query === 'object' ? { ...payload.query } : {};
  const timeframe = normaliseTimeframe(query.timeframe ?? payload.timeframe ?? '14d', { fallback: '14d' });
  const metric = normaliseString(query.metric, { max: 120, fallback: null, lower: false });
  const persona = normaliseString(query.persona, { max: 80, fallback: null, lower: true });
  const channel = normaliseString(query.channel, { max: 80, fallback: null, lower: true });
  const compareTo = normaliseString(query.compareTo ?? query.compare_to, {
    max: 80,
    fallback: 'previous_period',
    lower: true,
  });
  const includeBenchmarks = normaliseBoolean(query.includeBenchmarks ?? query.include_benchmarks, true);
  const search = normaliseString(query.search, { max: 200, fallback: '' });

  return {
    name,
    timeframe,
    query: {
      timeframe,
      metric,
      persona,
      channel,
      compareTo,
      includeBenchmarks,
      search,
    },
  };
}

export async function getInsightsOverview({ timeframe } = {}) {
  const models = getModels(true);
  const resolvedTimeframe = timeframe ? normaliseTimeframe(timeframe) : null;
  const where = {};
  if (resolvedTimeframe) {
    where.timeframe = resolvedTimeframe;
  }

  let snapshot = await models.MonitoringInsightsSnapshot.findOne({
    where,
    order: [['capturedAt', 'DESC']],
  });

  if (!snapshot && !resolvedTimeframe) {
    snapshot = await models.MonitoringInsightsSnapshot.findOne({ order: [['capturedAt', 'DESC']] });
  }

  if (!snapshot && resolvedTimeframe) {
    snapshot = await models.MonitoringInsightsSnapshot.findOne({ order: [['capturedAt', 'DESC']] });
  }

  if (!snapshot) {
    throw new NotFoundError('Monitoring insights snapshot not found.');
  }

  const payload = snapshot.toOverviewPayload();
  log.debug({ event: 'monitoring.insights.loaded', timeframe: resolvedTimeframe ?? payload.timeframe }, 'Loaded insights overview');
  return payload;
}

export async function listMetricsExplorer(query = {}) {
  const models = getModels(true);
  const timeframe = normaliseTimeframe(query.timeframe ?? '14d', { fallback: '14d' });
  const metricKey = normaliseString(query.metric ?? query.metricKey, { max: 120, fallback: null, lower: false });
  const persona = normaliseString(query.persona, { max: 80, fallback: null, lower: true });
  const channel = normaliseString(query.channel, { max: 80, fallback: null, lower: true });
  const compareTo = normaliseString(query.compareTo ?? query.compare_to, {
    max: 80,
    fallback: null,
    lower: true,
  });
  const includeBenchmarks = normaliseBoolean(query.includeBenchmarks ?? query.include_benchmarks, undefined);
  const search = normaliseString(query.search, { max: 200, fallback: '' });

  const where = { timeframe };
  if (metricKey) {
    where.metricKey = metricKey;
  }
  if (persona) {
    where.persona = persona;
  }
  if (channel) {
    where.channel = channel;
  }
  if (compareTo) {
    where.compareTo = compareTo;
  }
  if (includeBenchmarks !== undefined) {
    where.includeBenchmarks = includeBenchmarks;
  }

  const metricsRecords = await models.MonitoringMetric.findAll({
    where,
    order: [['label', 'ASC']],
  });

  let metrics = metricsRecords.map((record) => record.toExplorerMetric());
  if (search) {
    const needle = search.toLowerCase();
    metrics = metrics.filter(
      (metric) =>
        metric.label.toLowerCase().includes(needle) ||
        metric.narrative?.toLowerCase?.().includes(needle) ||
        metric.tags?.some?.((tag) => tag.toLowerCase().includes(needle)),
    );
  }

  const alertsRecords = await models.MonitoringMetricAlert.findAll({
    where: {
      timeframe,
      ...(metricKey ? { metricKey } : {}),
      ...(persona ? { persona } : {}),
      ...(channel ? { channel } : {}),
    },
    order: [['severity', 'DESC']],
  });
  const alerts = alertsRecords.map((record) => record.toExplorerAlert());

  const metricOptions = new Map();
  const personaOptions = new Map();
  const channelOptions = new Map();

  metricsRecords.forEach((record) => {
    const metric = record.toExplorerMetric();
    metricOptions.set(metric.key, metric.label);
    if (metric.persona) {
      personaOptions.set(metric.persona, metric.personaLabel ?? metric.persona);
    }
    if (metric.channel) {
      channelOptions.set(metric.channel, metric.channelLabel ?? metric.channel);
    }
  });

  const filters = {
    metrics: Array.from(metricOptions.entries()).map(([value, label]) => ({ value, label })),
    personas: Array.from(personaOptions.entries()).map(([value, label]) => ({ value, label })),
    channels: Array.from(channelOptions.entries()).map(([value, label]) => ({ value, label })),
  };

  return { metrics, alerts, filters };
}

export async function listMetricsExplorerViews() {
  const models = getModels(true);
  const views = await models.MonitoringMetricsSavedView.findAll({
    order: [['createdAt', 'DESC']],
  });
  return views.map((view) => view.toExplorerView());
}

export async function createMetricsExplorerView(payload = {}, { actorId } = {}) {
  const models = getModels(true);
  const prepared = ensureViewPayload(payload);

  const existing = await models.MonitoringMetricsSavedView.findOne({ where: { name: prepared.name } });
  if (existing) {
    throw new ConflictError(`A monitoring view named "${prepared.name}" already exists.`);
  }

  const created = await models.MonitoringMetricsSavedView.create({
    name: prepared.name,
    timeframe: prepared.timeframe,
    query: prepared.query,
    createdBy: actorId ? `${actorId}` : payload.createdBy ?? null,
  });

  log.info({ event: 'monitoring.metrics.view.created', name: prepared.name, actorId }, 'Saved monitoring metrics view');
  return created.toExplorerView();
}

export async function deleteMetricsExplorerView(viewId) {
  const models = getModels(true);
  if (!viewId) {
    throw new ValidationError('viewId is required.');
  }
  const view = await models.MonitoringMetricsSavedView.findByPk(viewId);
  if (!view) {
    throw new NotFoundError('Monitoring metrics view not found.');
  }
  await view.destroy();
  log.info({ event: 'monitoring.metrics.view.deleted', viewId }, 'Deleted monitoring metrics view');
  return { success: true };
}

export async function listAuditTrail(query = {}) {
  const models = getModels(true);
  const sequelize = getSequelize(true);
  const timeframe = query.timeframe ? normaliseTimeframe(query.timeframe) : null;
  const severity = normaliseString(query.severity, { max: 32, fallback: null, lower: true });
  const actorType = normaliseString(query.actorType ?? query.actor_type, { max: 80, fallback: null, lower: true });
  const resourceType = normaliseString(query.resourceType ?? query.resource_type, { max: 80, fallback: null, lower: true });
  const search = normaliseString(query.search, { max: 200, fallback: '' });
  const startDate = query.startDate ? new Date(query.startDate) : null;
  const endDate = query.endDate ? new Date(query.endDate) : null;
  const page = Number.isFinite(Number(query.page)) ? Math.max(1, Number.parseInt(query.page, 10)) : 1;
  const pageSizeCandidate = Number.isFinite(Number(query.pageSize)) ? Number.parseInt(query.pageSize, 10) : 50;
  const pageSize = Math.min(Math.max(1, pageSizeCandidate), 200);

  const where = {};
  if (timeframe) {
    const window = computeTimeWindow(timeframe);
    if (window) {
      where.occurredAt = { [Op.between]: [window.start, window.end] };
    }
  }
  if (startDate && !Number.isNaN(startDate.valueOf())) {
    where.occurredAt = where.occurredAt || {};
    where.occurredAt[Op.gte] = startDate;
  }
  if (endDate && !Number.isNaN(endDate.valueOf())) {
    where.occurredAt = where.occurredAt || {};
    where.occurredAt[Op.lte] = endDate;
  }
  if (severity) {
    where.severity = severity;
  }
  if (actorType) {
    where.actorType = actorType;
  }
  if (resourceType) {
    where.resourceType = resourceType;
  }
  if (search) {
    const filter = buildSearchFilter(search, ['summary', 'action', 'actor_name', 'resource_label']);
    if (filter) {
      where[Op.and] = where[Op.and] ? [...where[Op.and], filter] : [filter];
    }
  }

  const offset = (page - 1) * pageSize;
  const { rows, count } = await models.MonitoringAuditEvent.findAndCountAll({
    where,
    order: [['occurredAt', 'DESC']],
    offset,
    limit: pageSize,
  });

  const items = rows.map((row) => row.toViewerEvent());

  const summaryRecord = timeframe
    ? await models.MonitoringAuditSummary.findOne({ where: { timeframe } })
    : await models.MonitoringAuditSummary.findOne({ order: [['updatedAt', 'DESC']] });

  let summary;
  if (summaryRecord) {
    summary = summaryRecord.toViewerSummary();
  } else {
    const criticalWhere = { ...where, severity: 'critical' };
    const critical = await models.MonitoringAuditEvent.count({ where: criticalWhere });
    const responseMinutes = rows
      .map((row) => Number.parseFloat(row.metadata?.responseMinutes ?? row.metadata?.response_minutes ?? NaN))
      .filter((value) => Number.isFinite(value));
    summary = {
      timeframe: timeframe ?? null,
      total: count,
      critical,
      medianResponseMinutes: median(responseMinutes),
      compliancePosture: 'Compliance posture: review pending',
      residualRiskNarrative: 'Collect more audit activity to craft a governance narrative.',
    };
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const severityOptionsRaw = await models.MonitoringAuditEvent.findAll({
    attributes: ['severity'],
    group: ['severity'],
    raw: true,
  });
  const actorOptionsRaw = await models.MonitoringAuditEvent.findAll({
    attributes: ['actorType'],
    group: ['actorType'],
    raw: true,
  });
  const resourceOptionsRaw = await models.MonitoringAuditEvent.findAll({
    attributes: ['resourceType'],
    group: ['resourceType'],
    raw: true,
  });

  const filters = {
    severities: severityOptionsRaw
      .map((entry) => entry.severity)
      .filter(Boolean)
      .sort()
      .map((value) => ({ value, label: value.replace(/_/g, ' ') })),
    actorTypes: actorOptionsRaw
      .map((entry) => entry.actorType)
      .filter(Boolean)
      .sort()
      .map((value) => ({ value, label: value.replace(/_/g, ' ') })),
    resources: resourceOptionsRaw
      .map((entry) => entry.resourceType)
      .filter(Boolean)
      .sort()
      .map((value) => ({ value, label: value.replace(/_/g, ' ') })),
  };

  return {
    items,
    summary,
    filters,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalItems: count,
    },
  };
}

export async function exportAuditTrail(query = {}) {
  const models = getModels(true);
  const timeframe = query.timeframe ? normaliseTimeframe(query.timeframe) : null;
  const baseWhere = {};
  if (timeframe) {
    const window = computeTimeWindow(timeframe);
    if (window) {
      baseWhere.occurredAt = { [Op.between]: [window.start, window.end] };
    }
  }
  if (query.severity) {
    baseWhere.severity = normaliseString(query.severity, { max: 32, fallback: null, lower: true });
  }
  if (query.actorType) {
    baseWhere.actorType = normaliseString(query.actorType, { max: 80, fallback: null, lower: true });
  }
  if (query.resourceType) {
    baseWhere.resourceType = normaliseString(query.resourceType, { max: 80, fallback: null, lower: true });
  }
  if (query.startDate || query.endDate) {
    baseWhere.occurredAt = baseWhere.occurredAt || {};
    if (query.startDate) {
      const start = new Date(query.startDate);
      if (!Number.isNaN(start.valueOf())) {
        baseWhere.occurredAt[Op.gte] = start;
      }
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      if (!Number.isNaN(end.valueOf())) {
        baseWhere.occurredAt[Op.lte] = end;
      }
    }
  }
  if (query.search) {
    const filter = buildSearchFilter(normaliseString(query.search, { max: 200 }), [
      'summary',
      'action',
      'actor_name',
      'resource_label',
    ]);
    if (filter) {
      baseWhere[Op.and] = baseWhere[Op.and] ? [...baseWhere[Op.and], filter] : [filter];
    }
  }

  const events = await models.MonitoringAuditEvent.findAll({
    where: baseWhere,
    order: [['occurredAt', 'DESC']],
    limit: 2000,
  });

  const rows = events.map((event) => event.toViewerEvent());
  const headers = ['id', 'severity', 'action', 'summary', 'actor', 'actorType', 'resource', 'resourceType', 'timestamp', 'responseMinutes'];
  const csvLines = [headers.join(',')];
  rows.forEach((event) => {
    const responseMinutes = Number.parseFloat(event.metadata?.responseMinutes ?? event.metadata?.response_minutes ?? NaN);
    const values = [
      event.id,
      event.severity,
      event.action,
      event.summary,
      event.actor?.name ?? '',
      event.actor?.type ?? '',
      event.resource?.label ?? '',
      event.resource?.type ?? '',
      event.timestamp ?? '',
      Number.isFinite(responseMinutes) ? responseMinutes : '',
    ].map((value) => {
      if (value == null) {
        return '';
      }
      const stringValue = `${value}`.replace(/"/g, '""');
      return /[",\n]/.test(stringValue) ? `"${stringValue}"` : stringValue;
    });
    csvLines.push(values.join(','));
  });

  const csvContent = `${csvLines.join('\n')}\n`;
  const exportRoot = path.join(process.cwd(), 'storage', 'exports', 'monitoring');
  await fs.mkdir(exportRoot, { recursive: true });
  const fileName = `audit-trail-${Date.now()}.csv`;
  const filePath = path.join(exportRoot, fileName);
  await fs.writeFile(filePath, csvContent, 'utf8');

  const settings = await systemSettingsService.getSystemSettings();
  const baseUrl = settings?.storage?.assetCdnUrl?.replace(/\/$/, '') || 'https://cdn.gigvora.com';
  const fileUrl = `${baseUrl}/exports/monitoring/${fileName}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  log.info({ event: 'monitoring.audit.exported', filePath, fileUrl, rows: rows.length }, 'Exported monitoring audit trail');
  return { fileUrl, filePath, expiresAt };
}

export default {
  getInsightsOverview,
  listMetricsExplorer,
  listMetricsExplorerViews,
  createMetricsExplorerView,
  deleteMetricsExplorerView,
  listAuditTrail,
  exportAuditTrail,
};
