import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const COMPANY_PAGE_STATUSES = Object.freeze(['draft', 'in_review', 'scheduled', 'published', 'archived']);
export const COMPANY_PAGE_VISIBILITIES = Object.freeze(['private', 'internal', 'public']);
export const COMPANY_PAGE_SECTION_VARIANTS = Object.freeze([
  'hero',
  'story_block',
  'metrics_grid',
  'cta_banner',
  'media_gallery',
  'team_spotlight',
  'faq',
  'custom',
]);
export const COMPANY_PAGE_COLLABORATOR_ROLES = Object.freeze(['owner', 'editor', 'approver', 'viewer']);
export const COMPANY_PAGE_COLLABORATOR_STATUSES = Object.freeze(['invited', 'active', 'inactive']);
export const COMPANY_PAGE_MEDIA_TYPES = Object.freeze(['image', 'video', 'document']);

export const CompanyPage = sequelize.define(
  'CompanyPage',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false },
    headline: { type: DataTypes.STRING(240), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    blueprint: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'employer_brand' },
    status: { type: DataTypes.ENUM(...COMPANY_PAGE_STATUSES), allowNull: false, defaultValue: 'draft' },
    visibility: { type: DataTypes.ENUM(...COMPANY_PAGE_VISIBILITIES), allowNull: false, defaultValue: 'private' },
    heroImageUrl: { type: DataTypes.STRING(255), allowNull: true },
    socialPreviewUrl: { type: DataTypes.STRING(255), allowNull: true },
    scheduledFor: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    seo: { type: jsonType, allowNull: true },
    analytics: { type: jsonType, allowNull: true },
    settings: { type: jsonType, allowNull: true },
    allowedRoles: { type: jsonType, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    lastEditedById: { type: DataTypes.INTEGER, allowNull: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'company_pages',
    underscored: true,
    paranoid: false,
    indexes: [
      { unique: true, fields: ['workspace_id', 'slug'] },
      { fields: ['workspace_id', 'status'] },
      { fields: ['workspace_id', 'visibility'] },
      { fields: ['status'] },
    ],
  },
);

export const CompanyPageSection = sequelize.define(
  'CompanyPageSection',
  {
    pageId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: true },
    sectionKey: { type: DataTypes.STRING(120), allowNull: true },
    variant: { type: DataTypes.ENUM(...COMPANY_PAGE_SECTION_VARIANTS), allowNull: false, defaultValue: 'custom' },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    headline: { type: DataTypes.STRING(240), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: true },
    content: { type: jsonType, allowNull: true },
    media: { type: jsonType, allowNull: true },
    ctaLabel: { type: DataTypes.STRING(120), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(255), allowNull: true },
    visibility: { type: DataTypes.ENUM(...COMPANY_PAGE_VISIBILITIES), allowNull: false, defaultValue: 'public' },
    settings: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'company_page_sections',
    underscored: true,
    indexes: [
      { fields: ['page_id', 'order_index'] },
      { fields: ['variant'] },
    ],
  },
);

export const CompanyPageRevision = sequelize.define(
  'CompanyPageRevision',
  {
    pageId: { type: DataTypes.INTEGER, allowNull: false },
    version: { type: DataTypes.INTEGER, allowNull: false },
    snapshot: { type: jsonType, allowNull: false },
    notes: { type: DataTypes.STRING(500), allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'company_page_revisions',
    underscored: true,
    indexes: [
      { unique: true, fields: ['page_id', 'version'] },
    ],
  },
);

export const CompanyPageCollaborator = sequelize.define(
  'CompanyPageCollaborator',
  {
    pageId: { type: DataTypes.INTEGER, allowNull: false },
    collaboratorId: { type: DataTypes.INTEGER, allowNull: true },
    collaboratorEmail: { type: DataTypes.STRING(180), allowNull: true },
    collaboratorName: { type: DataTypes.STRING(180), allowNull: true },
    role: {
      type: DataTypes.ENUM(...COMPANY_PAGE_COLLABORATOR_ROLES),
      allowNull: false,
      defaultValue: 'editor',
    },
    status: {
      type: DataTypes.ENUM(...COMPANY_PAGE_COLLABORATOR_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
    },
    permissions: { type: jsonType, allowNull: true },
    invitedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'company_page_collaborators',
    underscored: true,
    indexes: [
      { fields: ['page_id', 'status'] },
      { fields: ['collaborator_id'] },
      { fields: ['collaborator_email'] },
    ],
  },
);

export const CompanyPageMedia = sequelize.define(
  'CompanyPageMedia',
  {
    pageId: { type: DataTypes.INTEGER, allowNull: false },
    url: { type: DataTypes.STRING(500), allowNull: false },
    mediaType: { type: DataTypes.ENUM(...COMPANY_PAGE_MEDIA_TYPES), allowNull: false, defaultValue: 'image' },
    label: { type: DataTypes.STRING(180), allowNull: true },
    altText: { type: DataTypes.STRING(255), allowNull: true },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: true },
    uploadedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'company_page_media',
    underscored: true,
    indexes: [
      { fields: ['page_id', 'is_primary'] },
      { fields: ['media_type'] },
    ],
  },
);

CompanyPage.hasMany(CompanyPageSection, { foreignKey: 'pageId', as: 'sections', onDelete: 'CASCADE', hooks: true });
CompanyPageSection.belongsTo(CompanyPage, { foreignKey: 'pageId', as: 'page' });

CompanyPage.hasMany(CompanyPageRevision, { foreignKey: 'pageId', as: 'revisions', onDelete: 'CASCADE', hooks: true });
CompanyPageRevision.belongsTo(CompanyPage, { foreignKey: 'pageId', as: 'page' });

CompanyPage.hasMany(CompanyPageCollaborator, { foreignKey: 'pageId', as: 'collaborators', onDelete: 'CASCADE', hooks: true });
CompanyPageCollaborator.belongsTo(CompanyPage, { foreignKey: 'pageId', as: 'page' });

CompanyPage.hasMany(CompanyPageMedia, { foreignKey: 'pageId', as: 'media', onDelete: 'CASCADE', hooks: true });
CompanyPageMedia.belongsTo(CompanyPage, { foreignKey: 'pageId', as: 'page' });

export default {
  CompanyPage,
  CompanyPageSection,
  CompanyPageRevision,
  CompanyPageCollaborator,
  CompanyPageMedia,
  COMPANY_PAGE_STATUSES,
  COMPANY_PAGE_VISIBILITIES,
  COMPANY_PAGE_SECTION_VARIANTS,
  COMPANY_PAGE_COLLABORATOR_ROLES,
  COMPANY_PAGE_COLLABORATOR_STATUSES,
  COMPANY_PAGE_MEDIA_TYPES,
};
