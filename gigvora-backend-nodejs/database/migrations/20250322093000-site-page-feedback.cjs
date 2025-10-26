'use strict';

const { resolveJsonType, dropEnum, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable(
        'site_page_feedback',
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          pageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'site_pages', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          response: {
            type: Sequelize.ENUM('yes', 'partially', 'no'),
            allowNull: false,
          },
          message: {
            type: Sequelize.TEXT('long'),
            allowNull: true,
          },
          actorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          actorRoles: {
            type: jsonType,
            allowNull: true,
            defaultValue: [],
          },
          ipHash: {
            type: Sequelize.STRING(128),
            allowNull: true,
          },
          userAgent: {
            type: Sequelize.STRING(512),
            allowNull: true,
          },
          metadata: {
            type: jsonType,
            allowNull: true,
            defaultValue: {},
          },
          submittedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('site_page_feedback', ['pageId'], { transaction });
      await queryInterface.addIndex('site_page_feedback', ['response'], { transaction });
      await queryInterface.addIndex('site_page_feedback', ['submittedAt'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await safeRemoveIndex(queryInterface, 'site_page_feedback', ['pageId'], { transaction });
      await safeRemoveIndex(queryInterface, 'site_page_feedback', ['response'], { transaction });
      await safeRemoveIndex(queryInterface, 'site_page_feedback', ['submittedAt'], { transaction });
      await queryInterface.dropTable('site_page_feedback', { transaction });
      await dropEnum(queryInterface, 'enum_site_page_feedback_response', transaction);
    });
  },
};
