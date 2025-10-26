'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
      const describeUsers = await queryInterface.describeTable('users');

      const ensureColumn = async (columnName, definition) => {
        if (!describeUsers[columnName]) {
          await queryInterface.addColumn('users', columnName, definition, { transaction });
        }
      };

      await ensureColumn('preferredRoles', { type: jsonType, allowNull: false, defaultValue: [] });
      await ensureColumn('marketingOptIn', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
      await ensureColumn('marketingOptInAt', { type: Sequelize.DATE, allowNull: true });
      await ensureColumn('signupChannel', { type: Sequelize.STRING(120), allowNull: true });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const describeUsers = await queryInterface.describeTable('users');
      const columns = ['preferredRoles', 'marketingOptIn', 'marketingOptInAt', 'signupChannel'];
      for (const column of columns) {
        if (describeUsers[column]) {
          await queryInterface.removeColumn('users', column, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
