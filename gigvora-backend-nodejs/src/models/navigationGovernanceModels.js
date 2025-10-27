import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const NavigationGovernanceAudit = sequelize.define(
  'NavigationGovernanceAudit',
  {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    snapshotVersion: { type: DataTypes.STRING(60), allowNull: false },
    localeCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    personaCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    routeCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    duplicateRouteCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    personaCoverage: { type: jsonType, allowNull: false, defaultValue: [] },
    localeCoverage: { type: jsonType, allowNull: false, defaultValue: {} },
    taxonomy: { type: jsonType, allowNull: false, defaultValue: {} },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    checksum: { type: DataTypes.STRING(128), allowNull: false },
    generatedBy: { type: DataTypes.STRING(120), allowNull: true },
    generatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'navigation_governance_audits',
    indexes: [
      { fields: ['snapshotVersion'], name: 'navigation_governance_audits_version_idx' },
      { fields: ['generatedAt'], name: 'navigation_governance_audits_generated_at_idx' },
      { unique: false, fields: ['checksum'], name: 'navigation_governance_audits_checksum_idx' },
    ],
  },
);

NavigationGovernanceAudit.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    snapshotVersion: plain.snapshotVersion,
    localeCount: plain.localeCount ?? 0,
    personaCount: plain.personaCount ?? 0,
    routeCount: plain.routeCount ?? 0,
    duplicateRouteCount: plain.duplicateRouteCount ?? 0,
    personaCoverage: plain.personaCoverage ?? [],
    localeCoverage: plain.localeCoverage ?? {},
    taxonomy: plain.taxonomy ?? {},
    metadata: plain.metadata ?? {},
    checksum: plain.checksum,
    generatedBy: plain.generatedBy ?? null,
    generatedAt: plain.generatedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default {
  NavigationGovernanceAudit,
};
