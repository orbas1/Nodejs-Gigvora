import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const PAGE_SETTING_STATUSES = ['draft', 'review', 'published', 'archived'];
export const PAGE_SETTING_VISIBILITIES = ['private', 'members', 'public'];
export const PAGE_LAYOUT_VARIANTS = ['standard', 'spotlight', 'campaign'];

export const PageSetting = sequelize.define(
  'PageSetting',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(480), allowNull: true },
    status: {
      type: DataTypes.ENUM(...PAGE_SETTING_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    visibility: {
      type: DataTypes.ENUM(...PAGE_SETTING_VISIBILITIES),
      allowNull: false,
      defaultValue: 'private',
    },
    layout: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'standard' },
    hero: { type: jsonType, allowNull: true },
    seo: { type: jsonType, allowNull: true },
    callToAction: { type: jsonType, allowNull: true },
    navigation: { type: jsonType, allowNull: true },
    sections: { type: jsonType, allowNull: true },
    theme: { type: jsonType, allowNull: true },
    roleAccess: { type: jsonType, allowNull: true },
    media: { type: jsonType, allowNull: true },
    lastPublishedAt: { type: DataTypes.DATE, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'page_settings',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['visibility'] },
    ],
  },
);

PageSetting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description ?? null,
    status: plain.status,
    visibility: plain.visibility,
    layout: plain.layout,
    hero: plain.hero ?? {},
    seo: plain.seo ?? {},
    callToAction: plain.callToAction ?? {},
    navigation: plain.navigation ?? {},
    sections: Array.isArray(plain.sections) ? plain.sections : [],
    theme: plain.theme ?? {},
    roleAccess: plain.roleAccess ?? { allowedRoles: ['admin'] },
    media: plain.media ?? {},
    lastPublishedAt: plain.lastPublishedAt ? plain.lastPublishedAt.toISOString() : null,
    updatedBy: plain.updatedBy ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default PageSetting;
