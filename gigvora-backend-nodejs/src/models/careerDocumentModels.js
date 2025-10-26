import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

const USER_STATUSES = ['invited', 'active', 'suspended', 'archived', 'deleted'];
const USER_TYPES = ['user', 'company', 'freelancer', 'agency', 'admin'];
const TWO_FACTOR_METHODS = ['email', 'app', 'sms'];

function ensureModel(name, factory) {
  return sequelize.models[name] ?? factory();
}

export const User = ensureModel('User', () =>
  sequelize.define(
    'User',
    {
      firstName: { type: DataTypes.STRING(120), allowNull: false },
      lastName: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
      password: { type: DataTypes.STRING(255), allowNull: false },
      address: { type: DataTypes.STRING(255), allowNull: true },
      location: { type: DataTypes.STRING(255), allowNull: true },
      geoLocation: { type: jsonType, allowNull: true },
      age: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 13 } },
      phoneNumber: { type: DataTypes.STRING(30), allowNull: true },
      jobTitle: { type: DataTypes.STRING(120), allowNull: true },
      avatarUrl: { type: DataTypes.STRING(2048), allowNull: true },
      status: { type: DataTypes.ENUM(...USER_STATUSES), allowNull: false, defaultValue: 'active' },
      lastSeenAt: { type: DataTypes.DATE, allowNull: true },
      userType: {
        type: DataTypes.ENUM(...USER_TYPES),
        allowNull: false,
        defaultValue: 'user',
      },
      twoFactorEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      twoFactorMethod: {
        type: DataTypes.ENUM(...TWO_FACTOR_METHODS),
        allowNull: false,
        defaultValue: 'email',
      },
      lastLoginAt: { type: DataTypes.DATE, allowNull: true },
      googleId: { type: DataTypes.STRING(255), allowNull: true },
      appleId: { type: DataTypes.STRING(255), allowNull: true },
      linkedinId: { type: DataTypes.STRING(255), allowNull: true },
      memberships: { type: jsonType, allowNull: false, defaultValue: [] },
      primaryDashboard: { type: DataTypes.STRING(60), allowNull: true },
    },
    {
      tableName: 'users',
      indexes: [
        { fields: ['email'] },
        { fields: ['status'] },
        { fields: ['userType'] },
        { fields: ['googleId'], unique: true },
        { fields: ['appleId'], unique: true },
        { fields: ['linkedinId'], unique: true },
      ],
    },
  ),
);

export const CareerDocument = ensureModel('CareerDocument', () =>
  sequelize.define(
    'CareerDocument',
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      documentType: {
        type: DataTypes.ENUM('cv', 'cover_letter', 'story_block', 'portfolio', 'brand_asset'),
        allowNull: false,
        defaultValue: 'cv',
      },
      title: { type: DataTypes.STRING(180), allowNull: false },
      slug: { type: DataTypes.STRING(200), allowNull: true },
      status: {
        type: DataTypes.ENUM('draft', 'in_review', 'approved', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      roleTag: { type: DataTypes.STRING(120), allowNull: true },
      geographyTag: { type: DataTypes.STRING(120), allowNull: true },
      aiAssisted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      baselineVersionId: { type: DataTypes.INTEGER, allowNull: true },
      latestVersionId: { type: DataTypes.INTEGER, allowNull: true },
      tags: { type: jsonType, allowNull: true },
      shareUrl: { type: DataTypes.STRING(500), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
    },
    {
      tableName: 'career_documents',
      indexes: [
        { fields: ['userId'] },
        { fields: ['documentType'] },
        { fields: ['status'] },
        { fields: ['roleTag'] },
        { fields: ['geographyTag'] },
      ],
    },
  ),
);

export const CareerDocumentVersion = ensureModel('CareerDocumentVersion', () =>
  sequelize.define(
    'CareerDocumentVersion',
    {
      documentId: { type: DataTypes.INTEGER, allowNull: false },
      versionNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      title: { type: DataTypes.STRING(180), allowNull: true },
      summary: { type: DataTypes.TEXT, allowNull: true },
      content: { type: DataTypes.TEXT('long'), allowNull: true },
      contentPath: { type: DataTypes.STRING(500), allowNull: true },
      aiSummary: { type: DataTypes.TEXT, allowNull: true },
      changeSummary: { type: DataTypes.TEXT, allowNull: true },
      diffHighlights: { type: jsonType, allowNull: true },
      metrics: { type: jsonType, allowNull: true },
      aiSuggestionUsed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      approvalStatus: {
        type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'draft',
      },
      createdById: { type: DataTypes.INTEGER, allowNull: true },
      approvedById: { type: DataTypes.INTEGER, allowNull: true },
      approvedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'career_document_versions',
      indexes: [
        { fields: ['documentId'] },
        { fields: ['approvalStatus'] },
        { unique: true, fields: ['documentId', 'versionNumber'] },
      ],
    },
  ),
);

export const CareerDocumentCollaborator = ensureModel('CareerDocumentCollaborator', () =>
  sequelize.define(
    'CareerDocumentCollaborator',
    {
      documentId: { type: DataTypes.INTEGER, allowNull: false },
      collaboratorId: { type: DataTypes.INTEGER, allowNull: false },
      role: { type: DataTypes.STRING(120), allowNull: true },
      permissions: { type: jsonType, allowNull: true },
      lastActiveAt: { type: DataTypes.DATE, allowNull: true },
      addedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'career_document_collaborators',
      indexes: [
        { fields: ['documentId'] },
        { fields: ['collaboratorId'] },
        { unique: true, fields: ['documentId', 'collaboratorId'] },
      ],
    },
  ),
);

export const CareerDocumentExport = ensureModel('CareerDocumentExport', () =>
  sequelize.define(
    'CareerDocumentExport',
    {
      documentId: { type: DataTypes.INTEGER, allowNull: false },
      versionId: { type: DataTypes.INTEGER, allowNull: true },
      format: {
        type: DataTypes.ENUM('pdf', 'docx', 'markdown', 'html'),
        allowNull: false,
        defaultValue: 'pdf',
      },
      exportedById: { type: DataTypes.INTEGER, allowNull: true },
      exportedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deliveryUrl: { type: DataTypes.STRING(500), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
    },
    {
      tableName: 'career_document_exports',
      indexes: [
        { fields: ['documentId'] },
        { fields: ['format'] },
      ],
    },
  ),
);

if (!CareerDocument.associations?.versions) {
  CareerDocument.hasMany(CareerDocumentVersion, { foreignKey: 'documentId', as: 'versions' });
}
if (!CareerDocumentVersion.associations?.document) {
  CareerDocumentVersion.belongsTo(CareerDocument, { foreignKey: 'documentId', as: 'document' });
}
if (!CareerDocument.associations?.collaborators) {
  CareerDocument.hasMany(CareerDocumentCollaborator, { foreignKey: 'documentId', as: 'collaborators' });
}
if (!CareerDocumentCollaborator.associations?.document) {
  CareerDocumentCollaborator.belongsTo(CareerDocument, { foreignKey: 'documentId', as: 'document' });
}
if (!CareerDocument.associations?.exports) {
  CareerDocument.hasMany(CareerDocumentExport, { foreignKey: 'documentId', as: 'exports' });
}
if (!CareerDocumentExport.associations?.document) {
  CareerDocumentExport.belongsTo(CareerDocument, { foreignKey: 'documentId', as: 'document' });
}
if (!CareerDocumentExport.associations?.version) {
  CareerDocumentExport.belongsTo(CareerDocumentVersion, { foreignKey: 'versionId', as: 'version' });
}

export { sequelize };

export default {
  sequelize,
  User,
  CareerDocument,
  CareerDocumentVersion,
  CareerDocumentCollaborator,
  CareerDocumentExport,
};
