import { DataTypes } from 'sequelize';
import sequelizeClient from './sequelizeClient.js';

const dialect = sequelizeClient.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const COMPLIANCE_FRAMEWORK_STATUSES = ['planning', 'active', 'draft', 'retired'];
export const COMPLIANCE_FRAMEWORK_TYPES = ['certification', 'attestation', 'regulation', 'policy'];
export const COMPLIANCE_AUDIT_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
export const COMPLIANCE_OBLIGATION_STATUSES = [
  'backlog',
  'in_progress',
  'awaiting_evidence',
  'complete',
  'cancelled',
];
export const COMPLIANCE_RISK_RATINGS = ['low', 'medium', 'high', 'critical'];

function normaliseStringArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (item == null ? null : `${item}`.trim()))
      .filter((item) => item && item.length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

function toIso(dateValue) {
  if (!dateValue) {
    return null;
  }
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function ensureMetadata(metadata) {
  if (metadata == null) {
    return null;
  }
  if (typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata;
  }
  try {
    return JSON.parse(metadata);
  } catch (error) {
    return null;
  }
}

export const ComplianceFramework = sequelizeClient.define(
  'AdminComplianceFramework',
  {
    slug: { type: DataTypes.STRING(120), allowNull: true, unique: true },
    name: { type: DataTypes.STRING(180), allowNull: false },
    owner: { type: DataTypes.STRING(180), allowNull: false },
    region: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...COMPLIANCE_FRAMEWORK_STATUSES),
      allowNull: false,
      defaultValue: 'planning',
    },
    type: {
      type: DataTypes.ENUM(...COMPLIANCE_FRAMEWORK_TYPES),
      allowNull: false,
      defaultValue: 'attestation',
    },
    automationCoverage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    renewalCadenceMonths: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
    controls: { type: jsonType, allowNull: false, defaultValue: [] },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'admin_compliance_frameworks',
    underscored: true,
  },
);

ComplianceFramework.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    slug: plain.slug ?? null,
    name: plain.name,
    owner: plain.owner,
    region: plain.region ?? 'Global',
    status: plain.status,
    type: plain.type,
    automationCoverage: plain.automationCoverage ?? 0,
    renewalCadenceMonths: plain.renewalCadenceMonths ?? 12,
    controls: normaliseStringArray(plain.controls),
    metadata: ensureMetadata(plain.metadata),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

export const ComplianceAudit = sequelizeClient.define(
  'AdminComplianceAudit',
  {
    frameworkId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'admin_compliance_frameworks', key: 'id' },
      onDelete: 'CASCADE',
    },
    name: { type: DataTypes.STRING(180), allowNull: false },
    auditFirm: { type: DataTypes.STRING(180), allowNull: true },
    status: {
      type: DataTypes.ENUM(...COMPLIANCE_AUDIT_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    scope: { type: DataTypes.TEXT, allowNull: true },
    deliverables: { type: jsonType, allowNull: false, defaultValue: [] },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'admin_compliance_audits',
    underscored: true,
  },
);

ComplianceAudit.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    frameworkId: plain.frameworkId,
    name: plain.name,
    auditFirm: plain.auditFirm,
    status: plain.status,
    startDate: toIso(plain.startDate),
    endDate: toIso(plain.endDate),
    scope: plain.scope,
    deliverables: normaliseStringArray(plain.deliverables),
    metadata: ensureMetadata(plain.metadata),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

export const ComplianceObligation = sequelizeClient.define(
  'AdminComplianceObligation',
  {
    title: { type: DataTypes.STRING(200), allowNull: false },
    owner: { type: DataTypes.STRING(180), allowNull: false },
    status: {
      type: DataTypes.ENUM(...COMPLIANCE_OBLIGATION_STATUSES),
      allowNull: false,
      defaultValue: 'backlog',
    },
    riskRating: {
      type: DataTypes.ENUM(...COMPLIANCE_RISK_RATINGS),
      allowNull: false,
      defaultValue: 'medium',
    },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    frameworkIds: { type: jsonType, allowNull: false, defaultValue: [] },
    notes: { type: DataTypes.TEXT, allowNull: true },
    evidenceRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'admin_compliance_obligations',
    underscored: true,
  },
);

ComplianceObligation.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const frameworks = Array.isArray(plain.frameworkIds)
    ? plain.frameworkIds
    : normaliseStringArray(plain.frameworkIds);
  return {
    id: plain.id,
    title: plain.title,
    owner: plain.owner,
    status: plain.status,
    riskRating: plain.riskRating,
    dueDate: toIso(plain.dueDate),
    frameworkIds: frameworks,
    notes: plain.notes,
    evidenceRequired: Boolean(plain.evidenceRequired),
    metadata: ensureMetadata(plain.metadata),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

export const ComplianceEvidence = sequelizeClient.define(
  'AdminComplianceEvidence',
  {
    obligationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'admin_compliance_obligations', key: 'id' },
      onDelete: 'CASCADE',
    },
    submittedById: { type: DataTypes.INTEGER, allowNull: true },
    submittedByName: { type: DataTypes.STRING(180), allowNull: true },
    source: { type: DataTypes.STRING(120), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    fileUrl: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'admin_compliance_evidence',
    underscored: true,
  },
);

ComplianceEvidence.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    obligationId: plain.obligationId,
    submittedById: plain.submittedById,
    submittedByName: plain.submittedByName,
    source: plain.source,
    description: plain.description,
    fileUrl: plain.fileUrl,
    metadata: ensureMetadata(plain.metadata),
    submittedAt: toIso(plain.submittedAt),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

export const sequelize = sequelizeClient;

export default {
  ComplianceFramework,
  ComplianceAudit,
  ComplianceObligation,
  ComplianceEvidence,
  COMPLIANCE_FRAMEWORK_STATUSES,
  COMPLIANCE_FRAMEWORK_TYPES,
  COMPLIANCE_AUDIT_STATUSES,
  COMPLIANCE_OBLIGATION_STATUSES,
  COMPLIANCE_RISK_RATINGS,
  sequelize,
};
