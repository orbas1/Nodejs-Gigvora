import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const ConsentPolicy = sequelize.define(
  'ConsentPolicy',
  {
    code: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9_.-]+$/i,
        len: [2, 80],
      },
    },
    title: {
      type: DataTypes.STRING(240),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    audience: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'user',
      validate: {
        is: /^[a-z0-9_.-]+$/i,
      },
    },
    region: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'global',
      validate: {
        is: /^[a-z0-9_.-]+$/i,
      },
    },
    legalBasis: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    revocable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    retentionPeriodDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 3650,
      },
    },
    activeVersionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    metadata: {
      type: jsonType,
      allowNull: false,
      defaultValue: {},
    },
    createdBy: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
  },
  {
    tableName: 'consent_policies',
    indexes: [
      { fields: ['audience', 'region'] },
      { fields: ['activeVersionId'] },
    ],
  },
);

export const ConsentPolicyVersion = sequelize.define(
  'ConsentPolicyVersion',
  {
    policyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ConsentPolicy,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    documentUrl: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      validate: {
        isUrl(value) {
          if (!value) return;
          try {
            // eslint-disable-next-line no-new
            new URL(value);
          } catch (error) {
            throw new Error('documentUrl must be a valid URL when provided.');
          }
        },
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    effectiveAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    supersededAt: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    createdBy: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    metadata: {
      type: jsonType,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: 'consent_policy_versions',
    indexes: [{ fields: ['policyId', 'effectiveAt'] }],
  },
);

export const UserConsent = sequelize.define(
  'UserConsent',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    policyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ConsentPolicy,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    policyVersionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ConsentPolicyVersion,
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('granted', 'withdrawn'),
      allowNull: false,
    },
    grantedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    withdrawnAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'self_service',
    },
    ipAddress: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    metadata: {
      type: jsonType,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: 'user_consents',
    indexes: [
      { fields: ['userId', 'policyId'], unique: true },
      { fields: ['policyId', 'status'] },
      { fields: ['policyVersionId'] },
    ],
  },
);

export const ConsentAuditEvent = sequelize.define(
  'ConsentAuditEvent',
  {
    policyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ConsentPolicy,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    policyVersionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: ConsentPolicyVersion,
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    userConsentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: UserConsent,
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    actorId: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    actorType: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'system',
    },
    action: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: jsonType,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: 'consent_audit_events',
    indexes: [{ fields: ['policyId', 'createdAt'] }],
  },
);

ConsentPolicy.hasMany(ConsentPolicyVersion, { foreignKey: 'policyId', as: 'versions' });
ConsentPolicyVersion.belongsTo(ConsentPolicy, { foreignKey: 'policyId', as: 'policy' });

ConsentPolicy.hasMany(UserConsent, { foreignKey: 'policyId', as: 'consents' });
UserConsent.belongsTo(ConsentPolicy, { foreignKey: 'policyId', as: 'policy' });

ConsentPolicyVersion.hasMany(UserConsent, { foreignKey: 'policyVersionId', as: 'userConsents' });
UserConsent.belongsTo(ConsentPolicyVersion, { foreignKey: 'policyVersionId', as: 'policyVersion' });

ConsentPolicy.hasMany(ConsentAuditEvent, { foreignKey: 'policyId', as: 'auditEvents' });
ConsentAuditEvent.belongsTo(ConsentPolicy, { foreignKey: 'policyId', as: 'policy' });

ConsentPolicyVersion.hasMany(ConsentAuditEvent, { foreignKey: 'policyVersionId', as: 'auditEvents' });
ConsentAuditEvent.belongsTo(ConsentPolicyVersion, { foreignKey: 'policyVersionId', as: 'policyVersion' });

UserConsent.hasMany(ConsentAuditEvent, { foreignKey: 'userConsentId', as: 'events' });
ConsentAuditEvent.belongsTo(UserConsent, { foreignKey: 'userConsentId', as: 'userConsent' });

ConsentPolicy.prototype.toSummary = function toSummary({ includeVersions = false } = {}) {
  const plain = this.get({ plain: true });
  const summary = {
    id: plain.id,
    code: plain.code,
    title: plain.title,
    description: plain.description,
    audience: plain.audience,
    region: plain.region,
    legalBasis: plain.legalBasis,
    required: Boolean(plain.required),
    revocable: Boolean(plain.revocable),
    retentionPeriodDays: plain.retentionPeriodDays ?? null,
    activeVersionId: plain.activeVersionId ?? null,
    metadata: plain.metadata ?? {},
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };

  if (includeVersions) {
    summary.versions = (plain.versions ?? []).map((version) => ({
      id: version.id,
      version: version.version,
      documentUrl: version.documentUrl ?? null,
      summary: version.summary ?? null,
      effectiveAt: version.effectiveAt ? new Date(version.effectiveAt).toISOString() : null,
      supersededAt: version.supersededAt ? new Date(version.supersededAt).toISOString() : null,
      metadata: version.metadata ?? {},
    }));
  }

  return summary;
};

UserConsent.prototype.toSnapshot = function toSnapshot() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    policyId: plain.policyId,
    policyVersionId: plain.policyVersionId,
    status: plain.status,
    grantedAt: plain.grantedAt ? new Date(plain.grantedAt).toISOString() : null,
    withdrawnAt: plain.withdrawnAt ? new Date(plain.withdrawnAt).toISOString() : null,
    source: plain.source,
    metadata: plain.metadata ?? {},
  };
};

export function normaliseConsentCode(value) {
  if (!value) return null;
  const trimmed = `${value}`.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed.replace(/[^a-z0-9_.-]/g, '-');
}

export async function activatePolicyVersion(policy, version, { transaction } = {}) {
  const activeAt = new Date();
  await policy.update({ activeVersionId: version.id }, { transaction });
  await ConsentAuditEvent.create(
    {
      policyId: policy.id,
      policyVersionId: version.id,
      action: 'policy_version_activated',
      metadata: { effectiveAt: version.effectiveAt ?? activeAt.toISOString() },
    },
    { transaction },
  );
}

export async function supersedePolicyVersion(version, { supersededAt = new Date(), actorId, transaction } = {}) {
  await version.update({ supersededAt }, { transaction });
  await ConsentAuditEvent.create(
    {
      policyId: version.policyId,
      policyVersionId: version.id,
      actorId: actorId ?? null,
      actorType: actorId ? 'admin' : 'system',
      action: 'policy_version_superseded',
      metadata: { supersededAt: supersededAt.toISOString() },
    },
    { transaction },
  );
}

export default {
  ConsentPolicy,
  ConsentPolicyVersion,
  UserConsent,
  ConsentAuditEvent,
};
