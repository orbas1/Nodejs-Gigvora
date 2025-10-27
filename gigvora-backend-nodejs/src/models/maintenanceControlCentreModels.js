import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const MaintenanceFeedbackSnapshot = sequelize.define(
  'MaintenanceFeedbackSnapshot',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    capturedAt: { type: DataTypes.DATE, allowNull: false },
    experienceScore: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
    trendDelta: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
    queueDepth: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    queueTarget: { type: DataTypes.INTEGER, allowNull: true },
    medianResponseMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sentimentNarrative: { type: DataTypes.TEXT, allowNull: true },
    reviewUrl: { type: DataTypes.STRING(500), allowNull: true },
    segments: { type: jsonType, allowNull: false, defaultValue: [] },
    highlights: { type: jsonType, allowNull: false, defaultValue: [] },
    alerts: { type: jsonType, allowNull: false, defaultValue: [] },
    responseBreakdown: { type: jsonType, allowNull: false, defaultValue: [] },
    topDrivers: { type: jsonType, allowNull: false, defaultValue: [] },
  },
  { tableName: 'maintenance_feedback_snapshots' },
);

export const MaintenanceOperationalSnapshot = sequelize.define(
  'MaintenanceOperationalSnapshot',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(240), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    severity: { type: DataTypes.STRING(32), allowNull: false },
    impactSurface: { type: DataTypes.STRING(160), allowNull: false },
    capturedAt: { type: DataTypes.DATE, allowNull: false },
    acknowledgedAt: { type: DataTypes.DATE, allowNull: true },
    acknowledgedBy: { type: DataTypes.STRING(160), allowNull: true },
    incidentRoomUrl: { type: DataTypes.STRING(500), allowNull: true },
    runbookUrl: { type: DataTypes.STRING(500), allowNull: true },
    metrics: { type: jsonType, allowNull: false, defaultValue: {} },
    incidents: { type: jsonType, allowNull: false, defaultValue: [] },
    channels: { type: jsonType, allowNull: false, defaultValue: [] },
    warnings: { type: jsonType, allowNull: false, defaultValue: [] },
    escalations: { type: jsonType, allowNull: false, defaultValue: [] },
    maintenanceWindow: { type: jsonType, allowNull: true },
  },
  { tableName: 'maintenance_operational_snapshots' },
);

MaintenanceOperationalSnapshot.belongsTo(MaintenanceFeedbackSnapshot, {
  as: 'feedbackSnapshot',
  foreignKey: 'feedbackSnapshotId',
});

export const MaintenanceWindow = sequelize.define(
  'MaintenanceWindow',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(240), allowNull: false },
    owner: { type: DataTypes.STRING(160), allowNull: true },
    impact: { type: DataTypes.STRING(160), allowNull: true },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: true },
    channels: { type: jsonType, allowNull: false, defaultValue: [] },
    notificationLeadMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
    rollbackPlan: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.STRING(160), allowNull: true },
    updatedBy: { type: DataTypes.STRING(160), allowNull: true },
  },
  { tableName: 'maintenance_windows' },
);

export const MaintenanceBroadcastLog = sequelize.define(
  'MaintenanceBroadcastLog',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    subject: { type: DataTypes.STRING(280), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    channels: { type: jsonType, allowNull: false, defaultValue: [] },
    audience: { type: DataTypes.STRING(160), allowNull: false },
    includeTimeline: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    includeStatusPage: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    dispatchedAt: { type: DataTypes.DATE, allowNull: false },
    dispatchedBy: { type: DataTypes.STRING(160), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'maintenance_broadcast_logs' },
);

export default {
  MaintenanceFeedbackSnapshot,
  MaintenanceOperationalSnapshot,
  MaintenanceWindow,
  MaintenanceBroadcastLog,
};
