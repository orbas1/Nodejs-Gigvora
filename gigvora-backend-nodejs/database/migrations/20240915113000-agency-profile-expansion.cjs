'use strict';

const followerPolicyEnum = 'enum_agency_profiles_followerPolicy';
const connectionPolicyEnum = 'enum_agency_profiles_connectionPolicy';

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

async function ensureColumns(queryInterface, transaction, table, columns) {
  const definition = await queryInterface.describeTable(table, { transaction });
  const tasks = Object.entries(columns)
    .filter(([columnName]) => !definition[columnName])
    .map(([columnName, columnDefinition]) =>
      queryInterface.addColumn(table, columnName, columnDefinition, { transaction }),
    );
  await Promise.all(tasks);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = 'agency_profiles';
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await ensureColumns(queryInterface, transaction, table, {
        tagline: { type: Sequelize.STRING(160), allowNull: true },
        summary: { type: Sequelize.TEXT, allowNull: true },
        about: { type: Sequelize.TEXT, allowNull: true },
        services: { type: jsonType, allowNull: true },
        industries: { type: jsonType, allowNull: true },
        clients: { type: jsonType, allowNull: true },
        awards: { type: jsonType, allowNull: true },
        socialLinks: { type: jsonType, allowNull: true },
        teamSize: { type: Sequelize.INTEGER, allowNull: true },
        foundedYear: { type: Sequelize.INTEGER, allowNull: true },
        primaryContactName: { type: Sequelize.STRING(160), allowNull: true },
        primaryContactEmail: { type: Sequelize.STRING(255), allowNull: true },
        primaryContactPhone: { type: Sequelize.STRING(60), allowNull: true },
        brandColor: { type: Sequelize.STRING(12), allowNull: true },
        bannerUrl: { type: Sequelize.STRING(500), allowNull: true },
        avatarUrl: { type: Sequelize.STRING(500), allowNull: true },
        avatarStorageKey: { type: Sequelize.STRING(500), allowNull: true },
        autoAcceptFollowers: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        defaultConnectionMessage: { type: Sequelize.TEXT, allowNull: true },
        followerPolicy: {
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

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${connectionPolicyEnum}";`).catch(() => {});
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${followerPolicyEnum}";`).catch(() => {});
    }
  },
};
