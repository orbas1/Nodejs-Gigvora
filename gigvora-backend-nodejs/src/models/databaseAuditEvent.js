import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const DatabaseAuditEvent = sequelize.define(
  'DatabaseAuditEvent',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eventType: { type: DataTypes.STRING(60), allowNull: false },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    initiatedBy: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    recordedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'database_audit_events',
    indexes: [
      { fields: ['eventType'] },
      { fields: ['recordedAt'] },
    ],
  },
);

DatabaseAuditEvent.recordEvent = async function recordEvent({
  eventType,
  reason = null,
  initiatedBy = null,
  metadata = {},
} = {}) {
  if (!eventType) {
    throw new Error('eventType is required to record a database audit event');
  }

  return this.create({
    eventType,
    reason,
    initiatedBy,
    metadata,
    recordedAt: new Date(),
  });
};

export default DatabaseAuditEvent;
