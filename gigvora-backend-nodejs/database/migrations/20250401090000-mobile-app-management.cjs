'use strict';

const APP_PLATFORMS = ['ios', 'android'];
const APP_STATUSES = ['active', 'paused', 'retired'];
const RELEASE_CHANNELS = ['production', 'beta', 'internal'];
const COMPLIANCE_STATUSES = ['ok', 'review', 'blocked'];
const VERSION_STATUSES = ['draft', 'in_review', 'released', 'deprecated'];
const VERSION_TYPES = ['major', 'minor', 'patch', 'hotfix'];
const FEATURE_ROLLOUT_TYPES = ['global', 'percentage', 'cohort'];

const ENUM_TYPES = [
  'enum_mobile_apps_platform',
  'enum_mobile_apps_status',
  'enum_mobile_apps_releaseChannel',
  'enum_mobile_apps_complianceStatus',
  'enum_mobile_app_versions_status',
  'enum_mobile_app_versions_releaseType',
  'enum_mobile_app_versions_releaseChannel',
  'enum_mobile_app_features_rolloutType',
];

async function dropEnumTypes(queryInterface, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  if (!['postgres', 'postgresql'].includes(dialect)) {
    return;
  }

  for (const typeName of ENUM_TYPES) {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${typeName}"`, { transaction });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'mobile_apps',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          displayName: { type: Sequelize.STRING(255), allowNull: false },
          slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          platform: {
            type: Sequelize.ENUM(...APP_PLATFORMS),
            allowNull: false,
            defaultValue: 'ios',
          },
          status: {
            type: Sequelize.ENUM(...APP_STATUSES),
            allowNull: false,
            defaultValue: 'active',
          },
          releaseChannel: {
            type: Sequelize.ENUM(...RELEASE_CHANNELS),
            allowNull: false,
            defaultValue: 'production',
          },
          complianceStatus: {
            type: Sequelize.ENUM(...COMPLIANCE_STATUSES),
            allowNull: false,
            defaultValue: 'ok',
          },
          currentVersion: { type: Sequelize.STRING(40), allowNull: true },
          latestBuildNumber: { type: Sequelize.STRING(40), allowNull: true },
          minimumSupportedVersion: { type: Sequelize.STRING(40), allowNull: true },
          storeUrl: { type: Sequelize.STRING(500), allowNull: true },
          supportEmail: { type: Sequelize.STRING(255), allowNull: true },
          supportUrl: { type: Sequelize.STRING(500), allowNull: true },
          marketingUrl: { type: Sequelize.STRING(500), allowNull: true },
          iconUrl: { type: Sequelize.STRING(500), allowNull: true },
          heroImageUrl: { type: Sequelize.STRING(500), allowNull: true },
          rolloutNotes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mobile_apps', ['platform'], { transaction });
      await queryInterface.addIndex('mobile_apps', ['status'], { transaction });
      await queryInterface.addIndex('mobile_apps', ['releaseChannel'], { transaction });

      await queryInterface.createTable(
        'mobile_app_versions',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          appId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'mobile_apps', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          version: { type: Sequelize.STRING(40), allowNull: false },
          buildNumber: { type: Sequelize.STRING(40), allowNull: true },
          status: {
            type: Sequelize.ENUM(...VERSION_STATUSES),
            allowNull: false,
            defaultValue: 'draft',
          },
          releaseType: {
            type: Sequelize.ENUM(...VERSION_TYPES),
            allowNull: false,
            defaultValue: 'patch',
          },
          releaseChannel: {
            type: Sequelize.ENUM(...RELEASE_CHANNELS),
            allowNull: false,
            defaultValue: 'production',
          },
          rolloutPercentage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          downloadUrl: { type: Sequelize.STRING(500), allowNull: true },
          releaseNotes: { type: Sequelize.TEXT, allowNull: true },
          releaseNotesUrl: { type: Sequelize.STRING(500), allowNull: true },
          checksum: { type: Sequelize.STRING(120), allowNull: true },
          minOsVersion: { type: Sequelize.STRING(40), allowNull: true },
          sizeBytes: { type: Sequelize.BIGINT, allowNull: true },
          scheduledAt: { type: Sequelize.DATE, allowNull: true },
          releasedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mobile_app_versions', ['appId', 'version'], { unique: true, transaction });
      await queryInterface.addIndex('mobile_app_versions', ['status'], { transaction });
      await queryInterface.addIndex('mobile_app_versions', ['scheduledAt'], { transaction });
      await queryInterface.addIndex('mobile_app_versions', ['releaseChannel'], { transaction });

      await queryInterface.createTable(
        'mobile_app_features',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          appId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'mobile_apps', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          key: { type: Sequelize.STRING(160), allowNull: false },
          name: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          rolloutType: {
            type: Sequelize.ENUM(...FEATURE_ROLLOUT_TYPES),
            allowNull: false,
            defaultValue: 'global',
          },
          rolloutValue: { type: jsonType, allowNull: true },
          minAppVersion: { type: Sequelize.STRING(40), allowNull: true },
          maxAppVersion: { type: Sequelize.STRING(40), allowNull: true },
          audienceRoles: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mobile_app_features', ['appId', 'key'], { unique: true, transaction });
      await queryInterface.addIndex('mobile_app_features', ['enabled'], { transaction });
      await queryInterface.addIndex('mobile_app_features', ['rolloutType'], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('mobile_app_features', { transaction });
      await queryInterface.dropTable('mobile_app_versions', { transaction });
      await queryInterface.dropTable('mobile_apps', { transaction });

      await dropEnumTypes(queryInterface, transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
