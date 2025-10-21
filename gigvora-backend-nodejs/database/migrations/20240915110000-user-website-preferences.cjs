'use strict';

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

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
          settings: { allowNull: true, type: jsonType },
          theme: { allowNull: true, type: jsonType },
          hero: { allowNull: true, type: jsonType },
          about: { allowNull: true, type: jsonType },
          navigation: { allowNull: true, type: jsonType },
          services: { allowNull: true, type: jsonType },
          testimonials: { allowNull: true, type: jsonType },
          gallery: { allowNull: true, type: jsonType },
          contact: { allowNull: true, type: jsonType },
          seo: { allowNull: true, type: jsonType },
          social: { allowNull: true, type: jsonType },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
