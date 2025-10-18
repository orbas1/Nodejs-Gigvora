import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const EmailSmtpConfig = sequelize.define(
  'EmailSmtpConfig',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    label: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'Primary SMTP' },
    host: { type: DataTypes.STRING(255), allowNull: false },
    port: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 587, validate: { min: 1 } },
    secure: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    username: { type: DataTypes.STRING(255), allowNull: true },
    password: { type: DataTypes.STRING(255), allowNull: true },
    fromName: { type: DataTypes.STRING(120), allowNull: true },
    fromAddress: { type: DataTypes.STRING(255), allowNull: false },
    replyToAddress: { type: DataTypes.STRING(255), allowNull: true },
    bccAuditRecipients: { type: DataTypes.STRING(500), allowNull: true },
    rateLimitPerMinute: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 120, validate: { min: 1 } },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    lastVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'email_smtp_configs',
    indexes: [{ fields: ['active'] }],
  },
);

EmailSmtpConfig.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    label: plain.label,
    host: plain.host,
    port: plain.port,
    secure: Boolean(plain.secure),
    username: plain.username ?? '',
    fromName: plain.fromName ?? '',
    fromAddress: plain.fromAddress,
    replyToAddress: plain.replyToAddress ?? '',
    bccAuditRecipients: plain.bccAuditRecipients ?? '',
    rateLimitPerMinute: plain.rateLimitPerMinute ?? 0,
    metadata: plain.metadata ?? {},
    lastVerifiedAt: plain.lastVerifiedAt,
    active: Boolean(plain.active),
    hasPassword: Boolean(plain.password && plain.password.length > 0),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const EmailTemplate = sequelize.define(
  'EmailTemplate',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(80), allowNull: true },
    subject: { type: DataTypes.STRING(255), allowNull: false },
    preheader: { type: DataTypes.STRING(255), allowNull: true },
    fromName: { type: DataTypes.STRING(120), allowNull: true },
    fromAddress: { type: DataTypes.STRING(255), allowNull: true },
    replyToAddress: { type: DataTypes.STRING(255), allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    htmlBody: { type: DataTypes.TEXT('long'), allowNull: false },
    textBody: { type: DataTypes.TEXT('long'), allowNull: true },
    layout: { type: DataTypes.STRING(120), allowNull: true },
    tags: { type: jsonType, allowNull: false, defaultValue: [] },
    variables: { type: jsonType, allowNull: false, defaultValue: [] },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
    createdBy: { type: DataTypes.STRING(120), allowNull: true },
    updatedBy: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'email_templates',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['category'] },
      { fields: ['enabled'] },
    ],
  },
);

EmailTemplate.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    slug: plain.slug,
    name: plain.name,
    description: plain.description ?? '',
    category: plain.category ?? '',
    subject: plain.subject,
    preheader: plain.preheader ?? '',
    fromName: plain.fromName ?? '',
    fromAddress: plain.fromAddress ?? '',
    replyToAddress: plain.replyToAddress ?? '',
    heroImageUrl: plain.heroImageUrl ?? '',
    htmlBody: plain.htmlBody ?? '',
    textBody: plain.textBody ?? '',
    layout: plain.layout ?? '',
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    variables: Array.isArray(plain.variables) ? plain.variables : [],
    enabled: Boolean(plain.enabled),
    version: plain.version ?? 1,
    createdBy: plain.createdBy ?? '',
    updatedBy: plain.updatedBy ?? '',
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default { EmailSmtpConfig, EmailTemplate };
