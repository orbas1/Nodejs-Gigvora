'use strict';

const TABLE_NAME = 'page_settings';
const STATUS_ENUM = 'enum_page_settings_status';
const VISIBILITY_ENUM = 'enum_page_settings_visibility';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        TABLE_NAME,
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false,
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          slug: { type: Sequelize.STRING(180), allowNull: false, unique: true },
          description: { type: Sequelize.STRING(480), allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'review', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          visibility: {
            type: Sequelize.ENUM('private', 'members', 'public'),
            allowNull: false,
            defaultValue: 'private',
          },
          layout: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'standard' },
          hero: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          seo: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          callToAction: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          navigation: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          sections: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          theme: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          roleAccess: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          media: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          lastPublishedAt: { type: Sequelize.DATE, allowNull: true },
          updatedBy: { type: Sequelize.INTEGER, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex(TABLE_NAME, ['slug'], { unique: true, transaction }),
        queryInterface.addIndex(TABLE_NAME, ['status'], { transaction }),
        queryInterface.addIndex(TABLE_NAME, ['visibility'], { transaction }),
      ]);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable(TABLE_NAME, { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${STATUS_ENUM}";`, { transaction });
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${VISIBILITY_ENUM}";`, { transaction });
      }
    });
  },
};
