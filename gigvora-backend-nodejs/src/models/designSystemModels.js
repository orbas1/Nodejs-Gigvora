import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const DesignSystemRelease = sequelize.define(
  'DesignSystemRelease',
  {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    themeId: { type: DataTypes.UUID, allowNull: true },
    version: { type: DataTypes.STRING(60), allowNull: false },
    preferences: { type: jsonType, allowNull: false, defaultValue: {} },
    snapshot: { type: jsonType, allowNull: false, defaultValue: {} },
    analytics: { type: jsonType, allowNull: false, defaultValue: {} },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    themeHash: { type: DataTypes.STRING(128), allowNull: false },
    checksum: { type: DataTypes.STRING(128), allowNull: false },
    releasedBy: { type: DataTypes.STRING(160), allowNull: true },
    releasedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    releaseNotes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'design_system_releases',
    indexes: [
      { fields: ['themeId'], name: 'design_system_releases_theme_idx' },
      { fields: ['version'], name: 'design_system_releases_version_idx' },
      { fields: ['releasedAt'], name: 'design_system_releases_released_at_idx' },
      { unique: false, fields: ['themeHash'], name: 'design_system_releases_theme_hash_idx' },
    ],
  },
);

DesignSystemRelease.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    themeId: plain.themeId ?? null,
    version: plain.version,
    preferences: plain.preferences ?? {},
    snapshot: plain.snapshot ?? {},
    analytics: plain.analytics ?? {},
    metadata: plain.metadata ?? {},
    themeHash: plain.themeHash,
    checksum: plain.checksum,
    releasedBy: plain.releasedBy ?? null,
    releasedAt: plain.releasedAt,
    releaseNotes: plain.releaseNotes ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default {
  DesignSystemRelease,
};
