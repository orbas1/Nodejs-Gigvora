'use strict';

const followerPolicyEnum = 'enum_agency_profiles_followerPolicy';
const connectionPolicyEnum = 'enum_agency_profiles_connectionPolicy';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function dropEnumIfExists(queryInterface, enumName) {
  const dialect = queryInterface.sequelize.getDialect();
  if (['postgres', 'postgresql'].includes(dialect)) {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = 'agency_profiles';

      await queryInterface.addColumn(
        table,
        'tagline',
        { type: Sequelize.STRING(160), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'summary',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'about',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'services',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'industries',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'clients',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'awards',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'socialLinks',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'teamSize',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'foundedYear',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'primaryContactName',
        { type: Sequelize.STRING(160), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'primaryContactEmail',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'primaryContactPhone',
        { type: Sequelize.STRING(60), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'brandColor',
        { type: Sequelize.STRING(12), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'bannerUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'avatarUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'avatarStorageKey',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'autoAcceptFollowers',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'defaultConnectionMessage',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        table,
        'followerPolicy',
        {
          type: Sequelize.ENUM('open', 'approval_required', 'closed'),
          allowNull: false,
          defaultValue: 'open',
        },
        connectionPolicy: {
          type: Sequelize.ENUM('open', 'invite_only', 'manual_review'),
          allowNull: false,
          defaultValue: 'open',
        },
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = 'agency_profiles';

      await queryInterface.removeColumn(table, 'connectionPolicy', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'followerPolicy', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'defaultConnectionMessage', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'autoAcceptFollowers', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'avatarStorageKey', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'avatarUrl', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'bannerUrl', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'brandColor', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'primaryContactPhone', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'primaryContactEmail', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'primaryContactName', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'foundedYear', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'teamSize', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'socialLinks', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'awards', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'clients', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'industries', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'services', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'about', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'summary', { transaction }).catch(() => {});
      await queryInterface.removeColumn(table, 'tagline', { transaction }).catch(() => {});
    });

    await dropEnumIfExists(queryInterface, connectionPolicyEnum);
    await dropEnumIfExists(queryInterface, followerPolicyEnum);
  },
};
