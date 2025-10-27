'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'design_system_releases',
        {
          id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.UUIDV4 },
          themeId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'appearance_themes', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          version: { type: Sequelize.STRING(60), allowNull: false },
          preferences: { type: jsonType, allowNull: false, defaultValue: {} },
          snapshot: { type: jsonType, allowNull: false, defaultValue: {} },
          analytics: { type: jsonType, allowNull: false, defaultValue: {} },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          themeHash: { type: Sequelize.STRING(128), allowNull: false },
          checksum: { type: Sequelize.STRING(128), allowNull: false },
          releasedBy: { type: Sequelize.STRING(160), allowNull: true },
          releasedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          releaseNotes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'design_system_releases',
        ['themeId'],
        {
          name: 'design_system_releases_theme_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'design_system_releases',
        ['version'],
        {
          name: 'design_system_releases_version_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'design_system_releases',
        ['releasedAt'],
        {
          name: 'design_system_releases_released_at_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'design_system_releases',
        ['themeHash'],
        {
          name: 'design_system_releases_theme_hash_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'navigation_governance_audits',
        {
          id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.UUIDV4 },
          snapshotVersion: { type: Sequelize.STRING(60), allowNull: false },
          localeCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          personaCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          routeCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          duplicateRouteCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          personaCoverage: { type: jsonType, allowNull: false, defaultValue: [] },
          localeCoverage: { type: jsonType, allowNull: false, defaultValue: {} },
          taxonomy: { type: jsonType, allowNull: false, defaultValue: {} },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          checksum: { type: Sequelize.STRING(128), allowNull: false },
          generatedBy: { type: Sequelize.STRING(120), allowNull: true },
          generatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'navigation_governance_audits',
        ['snapshotVersion'],
        {
          name: 'navigation_governance_audits_version_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'navigation_governance_audits',
        ['generatedAt'],
        {
          name: 'navigation_governance_audits_generated_at_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'navigation_governance_audits',
        ['checksum'],
        {
          name: 'navigation_governance_audits_checksum_idx',
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('navigation_governance_audits', { transaction });
      await queryInterface.dropTable('design_system_releases', { transaction });
    });
  },
};
