import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const PlatformSettingsAuditEvent = sequelize.define(
  'PlatformSettingsAuditEvent',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    actorEmail: { type: DataTypes.STRING(255), allowNull: true },
    actorName: { type: DataTypes.STRING(255), allowNull: true },
    summary: { type: DataTypes.STRING(255), allowNull: false },
    changedSections: { type: jsonType, allowNull: false, defaultValue: [] },
    changes: { type: jsonType, allowNull: false, defaultValue: [] },
  },
  {
    tableName: 'platform_settings_audit_events',
    indexes: [
      { fields: ['createdAt'] },
      { fields: ['actorId'] },
    ],
  },
);

PlatformSettingsAuditEvent.recordEvent = async function recordEvent({
  actorId = null,
  actorEmail = null,
  actorName = null,
  summary,
  changedSections = [],
  changes = [],
} = {}) {
  if (!summary) {
    throw new Error('summary is required to record a platform settings audit event');
  }

  return this.create({
    actorId,
    actorEmail,
    actorName,
    summary,
    changedSections,
    changes,
  });
};

PlatformSettingsAuditEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    actorId: plain.actorId ?? null,
    actorEmail: plain.actorEmail ?? null,
    actorName: plain.actorName ?? null,
    summary: plain.summary,
    changedSections: Array.isArray(plain.changedSections) ? plain.changedSections : [],
    changes: Array.isArray(plain.changes) ? plain.changes : [],
    createdAt: plain.createdAt ? plain.createdAt.toISOString() : null,
  };
};

export default PlatformSettingsAuditEvent;
