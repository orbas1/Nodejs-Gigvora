'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tables = await queryInterface
        .showAllTables()
        .then((list) => list.map((table) => (typeof table === 'string' ? table : table.tableName)));

      if (!tables.includes('platform_settings_watchers')) {
        const dialect = queryInterface.sequelize.getDialect();
        const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

        await queryInterface.createTable(
          'platform_settings_watchers',
          {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            userId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
            email: { type: Sequelize.STRING(255), allowNull: true },
            deliveryChannel: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'notification' },
            digestFrequency: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'immediate' },
            role: { type: Sequelize.STRING(120), allowNull: true },
            description: { type: Sequelize.STRING(500), allowNull: true },
            metadata: { type: jsonType, allowNull: false, defaultValue: {} },
            enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            lastDigestAt: { type: Sequelize.DATE, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          },
          { transaction },
        );

        await queryInterface.addIndex('platform_settings_watchers', ['enabled'], { transaction });
        await queryInterface.addConstraint('platform_settings_watchers', {
          fields: ['userId'],
          type: 'unique',
          name: 'platform_settings_watchers_user_id_unique',
          transaction,
        });
        await queryInterface.addConstraint('platform_settings_watchers', {
          fields: ['email'],
          type: 'unique',
          name: 'platform_settings_watchers_email_unique',
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tables = await queryInterface
        .showAllTables()
        .then((list) => list.map((table) => (typeof table === 'string' ? table : table.tableName)));
      if (tables.includes('platform_settings_watchers')) {
        await queryInterface.dropTable('platform_settings_watchers', { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
