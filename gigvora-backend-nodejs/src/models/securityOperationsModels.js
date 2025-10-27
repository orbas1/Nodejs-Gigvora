import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const jsonType = ['postgres', 'postgresql'].includes(sequelize.getDialect()) ? DataTypes.JSONB : DataTypes.JSON;

function ensureModel(name, attributes, options = {}) {
  if (sequelize.models[name]) {
    return sequelize.models[name];
  }
  return sequelize.define(name, attributes, { underscored: true, ...options });
}

export const SECURITY_ALERT_SEVERITIES = ['critical', 'high', 'medium', 'low'];
export const SECURITY_ALERT_STATUSES = ['open', 'investigating', 'acknowledged', 'suppressed', 'resolved', 'closed'];
export const SECURITY_INCIDENT_STATUSES = ['open', 'investigating', 'mitigated', 'contained', 'resolved', 'monitoring'];
export const SECURITY_PLAYBOOK_STATUSES = ['draft', 'active', 'retired'];
export const SECURITY_THREAT_SWEEP_STATUSES = ['queued', 'running', 'completed', 'failed'];

export const SecurityPostureSnapshot = ensureModel(
  'SecurityPostureSnapshot',
  {
    capturedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    attackSurfaceScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    attackSurfaceDelta: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    signals: { type: jsonType, allowNull: true },
    blockedIntrusions: { type: DataTypes.INTEGER, allowNull: true },
    quarantinedAssets: { type: DataTypes.INTEGER, allowNull: true },
    highRiskVulnerabilities: { type: DataTypes.INTEGER, allowNull: true },
    meanTimeToRespondMinutes: { type: DataTypes.INTEGER, allowNull: true },
    patchBacklog: { type: DataTypes.INTEGER, allowNull: true },
    patchBacklogDelta: { type: DataTypes.INTEGER, allowNull: true },
    nextPatchWindow: { type: DataTypes.DATE, allowNull: true },
    notes: { type: jsonType, allowNull: true },
  },
  { tableName: 'security_posture_snapshots' },
);

export const SecurityAlert = ensureModel(
  'SecurityAlert',
  {
    alertKey: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    severity: { type: DataTypes.ENUM(...SECURITY_ALERT_SEVERITIES), allowNull: false, defaultValue: 'medium' },
    category: { type: DataTypes.STRING(160), allowNull: false },
    source: { type: DataTypes.STRING(160), allowNull: false },
    asset: { type: DataTypes.STRING(160), allowNull: true },
    location: { type: DataTypes.STRING(160), allowNull: true },
    recommendedAction: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...SECURITY_ALERT_STATUSES), allowNull: false, defaultValue: 'open' },
    detectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'security_alerts' },
);

export const SecurityIncident = ensureModel(
  'SecurityIncident',
  {
    incidentKey: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    severity: { type: DataTypes.ENUM(...SECURITY_ALERT_SEVERITIES), allowNull: false, defaultValue: 'medium' },
    status: { type: DataTypes.ENUM(...SECURITY_INCIDENT_STATUSES), allowNull: false, defaultValue: 'open' },
    owner: { type: DataTypes.STRING(160), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    openedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'security_incidents' },
);

export const SecurityPlaybook = ensureModel(
  'SecurityPlaybook',
  {
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    owner: { type: DataTypes.STRING(160), allowNull: true },
    category: { type: DataTypes.STRING(160), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...SECURITY_PLAYBOOK_STATUSES), allowNull: false, defaultValue: 'active' },
    lastRunAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'security_playbooks' },
);

export const SecurityPlaybookRun = ensureModel(
  'SecurityPlaybookRun',
  {
    playbookId: { type: DataTypes.INTEGER, allowNull: false },
    executedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    executor: { type: DataTypes.STRING(160), allowNull: true },
    result: { type: DataTypes.STRING(160), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'security_playbook_runs' },
);

export const SecurityThreatSweep = ensureModel(
  'SecurityThreatSweep',
  {
    requestedBy: { type: DataTypes.INTEGER, allowNull: true },
    sweepType: { type: DataTypes.STRING(160), allowNull: true },
    status: { type: DataTypes.ENUM(...SECURITY_THREAT_SWEEP_STATUSES), allowNull: false, defaultValue: 'queued' },
    payload: { type: jsonType, allowNull: true },
    result: { type: jsonType, allowNull: true },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'security_threat_sweeps' },
);

SecurityPlaybook.hasMany(SecurityPlaybookRun, { foreignKey: 'playbookId', as: 'runs' });
SecurityPlaybookRun.belongsTo(SecurityPlaybook, { foreignKey: 'playbookId', as: 'playbook' });

export default {
  SecurityPostureSnapshot,
  SecurityAlert,
  SecurityIncident,
  SecurityPlaybook,
  SecurityPlaybookRun,
  SecurityThreatSweep,
};
