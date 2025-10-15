import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const RuntimeSecurityAuditEvent = sequelize.define(
  'RuntimeSecurityAuditEvent',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    eventType: { type: DataTypes.STRING(64), allowNull: false },
    level: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'info' },
    message: { type: DataTypes.STRING(512), allowNull: false },
    requestId: { type: DataTypes.STRING(64), allowNull: true },
    triggeredBy: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'runtime_security_audit_events',
    indexes: [
      { fields: ['eventType'] },
      { fields: ['level'] },
      { fields: ['createdAt'] },
    ],
  },
);

RuntimeSecurityAuditEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    eventType: plain.eventType,
    level: plain.level,
    message: plain.message,
    requestId: plain.requestId ?? null,
    triggeredBy: plain.triggeredBy ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default RuntimeSecurityAuditEvent;
