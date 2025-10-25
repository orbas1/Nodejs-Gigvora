'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      const tableExists = await queryInterface
        .showAllTables()
        .then((tables) => tables.map((table) => (typeof table === 'string' ? table : table.tableName)))
        .then((tables) => tables.includes('platform_settings_audit_events'));

      if (!tableExists) {
        await queryInterface.createTable(
          'platform_settings_audit_events',
          {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            actorId: { type: Sequelize.INTEGER, allowNull: true },
            actorEmail: { type: Sequelize.STRING(255), allowNull: true },
            actorName: { type: Sequelize.STRING(255), allowNull: true },
            summary: { type: Sequelize.STRING(255), allowNull: false },
            changedSections: { type: jsonType, allowNull: false, defaultValue: [] },
            changes: { type: jsonType, allowNull: false, defaultValue: [] },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          },
          { transaction },
        );

        await queryInterface.addIndex('platform_settings_audit_events', ['createdAt'], { transaction });
        await queryInterface.addIndex('platform_settings_audit_events', ['actorId'], { transaction });
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
      if (tables.includes('platform_settings_audit_events')) {
        await queryInterface.dropTable('platform_settings_audit_events', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
