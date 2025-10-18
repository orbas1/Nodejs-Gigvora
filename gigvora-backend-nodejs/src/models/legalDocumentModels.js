import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const LegalDocument = sequelize.define(
  'LegalDocument',
  {
    slug: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 120],
        is: /^[a-z0-9_-]+$/i,
      },
    },
    title: {
      type: DataTypes.STRING(240),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('terms', 'privacy', 'data_processing', 'cookie'),
      allowNull: false,
      defaultValue: 'terms',
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    region: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'global',
    },
    defaultLocale: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'en',
    },
    audienceRoles: {
      type: jsonType,
      allowNull: false,
      defaultValue: [],
    },
    editorRoles: {
      type: jsonType,
      allowNull: false,
      defaultValue: [],
    },
    tags: {
      type: jsonType,
      allowNull: false,
      defaultValue: [],
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: jsonType,
      allowNull: false,
      defaultValue: {},
    },
    activeVersionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    retiredAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'legal_documents',
    indexes: [
      { fields: ['slug'] },
      { fields: ['category'] },
      { fields: ['status'] },
    ],
  },
);

export const LegalDocumentVersion = sequelize.define(
  'LegalDocumentVersion',
  {
    documentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: LegalDocument,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    locale: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'en',
    },
    status: {
      type: DataTypes.ENUM('draft', 'in_review', 'approved', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    effectiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    supersededAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changeSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    externalUrl: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      validate: {
        isUrl(value) {
          if (!value) return;
          try {
            // eslint-disable-next-line no-new
            new URL(value);
          } catch (error) {
            throw new Error('externalUrl must be a valid URL');
          }
        },
      },
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
    publishedBy: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
  },
  {
    tableName: 'legal_document_versions',
    indexes: [
      { fields: ['documentId'] },
      { fields: ['documentId', 'version', 'locale'], unique: true },
      { fields: ['status'] },
    ],
  },
);

export const LegalDocumentAuditEvent = sequelize.define(
  'LegalDocumentAuditEvent',
  {
    documentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: LegalDocument,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    versionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: LegalDocumentVersion,
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    action: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    actorId: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    actorType: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'admin',
    },
    metadata: {
      type: jsonType,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: 'legal_document_audit_events',
    indexes: [
      { fields: ['documentId'] },
      { fields: ['versionId'] },
      { fields: ['action'] },
    ],
  },
);

LegalDocument.hasMany(LegalDocumentVersion, { as: 'versions', foreignKey: 'documentId' });
LegalDocumentVersion.belongsTo(LegalDocument, { as: 'document', foreignKey: 'documentId' });

LegalDocument.hasMany(LegalDocumentAuditEvent, { as: 'auditEvents', foreignKey: 'documentId' });
LegalDocumentAuditEvent.belongsTo(LegalDocument, { as: 'document', foreignKey: 'documentId' });

LegalDocumentVersion.hasMany(LegalDocumentAuditEvent, { as: 'auditTrail', foreignKey: 'versionId' });
LegalDocumentAuditEvent.belongsTo(LegalDocumentVersion, { as: 'version', foreignKey: 'versionId' });

LegalDocument.prototype.toSummary = function toSummary({ includeVersions = false, includeAudit = false } = {}) {
  const base = {
    id: this.id,
    slug: this.slug,
    title: this.title,
    category: this.category,
    status: this.status,
    region: this.region,
    defaultLocale: this.defaultLocale,
    audienceRoles: Array.isArray(this.audienceRoles) ? this.audienceRoles : [],
    editorRoles: Array.isArray(this.editorRoles) ? this.editorRoles : [],
    tags: Array.isArray(this.tags) ? this.tags : [],
    summary: this.summary ?? null,
    metadata: this.metadata ?? {},
    activeVersionId: this.activeVersionId ?? null,
    publishedAt: this.publishedAt ?? null,
    retiredAt: this.retiredAt ?? null,
    createdAt: this.createdAt ?? null,
    updatedAt: this.updatedAt ?? null,
    createdBy: this.createdBy ?? null,
    updatedBy: this.updatedBy ?? null,
  };

  if (includeVersions) {
    const versions = Array.isArray(this.versions)
      ? this.versions.map((version) =>
          version instanceof LegalDocumentVersion ? version.toSummary?.({ includeAudit }) ?? version.toJSON() : version,
        )
      : [];
    base.versions = versions;
  }

  if (includeAudit) {
    base.auditEvents = Array.isArray(this.auditEvents)
      ? this.auditEvents.map((event) => (event instanceof LegalDocumentAuditEvent ? event.toJSON() : event))
      : [];
  }

  return base;
};

LegalDocumentVersion.prototype.toSummary = function toSummary({ includeAudit = false } = {}) {
  const payload = {
    id: this.id,
    documentId: this.documentId,
    version: this.version,
    locale: this.locale,
    status: this.status,
    effectiveAt: this.effectiveAt ?? null,
    publishedAt: this.publishedAt ?? null,
    supersededAt: this.supersededAt ?? null,
    summary: this.summary ?? null,
    changeSummary: this.changeSummary ?? null,
    content: this.content ?? null,
    externalUrl: this.externalUrl ?? null,
    metadata: this.metadata ?? {},
    createdAt: this.createdAt ?? null,
    updatedAt: this.updatedAt ?? null,
    createdBy: this.createdBy ?? null,
    publishedBy: this.publishedBy ?? null,
  };

  if (includeAudit) {
    payload.auditTrail = Array.isArray(this.auditTrail)
      ? this.auditTrail.map((event) => (event instanceof LegalDocumentAuditEvent ? event.toJSON() : event))
      : [];
  }

  return payload;
};

LegalDocumentAuditEvent.prototype.toSummary = function toSummary() {
  return {
    id: this.id,
    documentId: this.documentId,
    versionId: this.versionId ?? null,
    action: this.action,
    actorId: this.actorId ?? null,
    actorType: this.actorType ?? 'admin',
    metadata: this.metadata ?? {},
    createdAt: this.createdAt ?? null,
  };
};

export default LegalDocument;
