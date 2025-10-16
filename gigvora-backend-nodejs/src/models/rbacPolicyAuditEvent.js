import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const RbacPolicyAuditEvent = sequelize.define(
  'RbacPolicyAuditEvent',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    policyKey: { type: DataTypes.STRING(80), allowNull: false },
    persona: { type: DataTypes.STRING(60), allowNull: false },
    action: { type: DataTypes.STRING(60), allowNull: false },
    resource: { type: DataTypes.STRING(120), allowNull: false },
    decision: { type: DataTypes.STRING(16), allowNull: false },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    actorId: { type: DataTypes.STRING(60), allowNull: true },
    actorType: { type: DataTypes.STRING(40), allowNull: true },
    actorEmail: { type: DataTypes.STRING(160), allowNull: true },
    requestId: { type: DataTypes.STRING(64), allowNull: true },
    ipAddress: { type: DataTypes.STRING(64), allowNull: true },
    userAgent: { type: DataTypes.STRING(255), allowNull: true },
    responseStatus: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    occurredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'rbac_policy_audit_events',
    indexes: [
      { fields: ['policyKey'] },
      { fields: ['persona'] },
      { fields: ['decision'] },
      { fields: ['occurredAt'] },
    ],
  },
);

RbacPolicyAuditEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    policyKey: plain.policyKey,
    persona: plain.persona,
    action: plain.action,
    resource: plain.resource,
    decision: plain.decision,
    reason: plain.reason ?? null,
    actorId: plain.actorId ?? null,
    actorType: plain.actorType ?? null,
    actorEmail: plain.actorEmail ?? null,
    requestId: plain.requestId ?? null,
    ipAddress: plain.ipAddress ?? null,
    userAgent: plain.userAgent ?? null,
    responseStatus: plain.responseStatus ?? null,
    metadata: plain.metadata ?? null,
    occurredAt: plain.occurredAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default RbacPolicyAuditEvent;
