'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'user_website_preferences',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          userId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            unique: true,
          },
          settings: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          theme: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          hero: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          about: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          navigation: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          services: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          testimonials: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          gallery: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          contact: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          seo: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          social: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('NOW'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('NOW'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'user_website_preferences',
        ['userId'],
        {
          name: 'user_website_preferences_user_id_unique',
          unique: true,
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'user_website_preferences',
        'user_website_preferences_user_id_unique',
        { transaction },
      );
      await queryInterface.dropTable('user_website_preferences', { transaction });
    });
  },
};
