'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await Promise.all([
        queryInterface.addColumn(
          'mentor_profiles',
          'languages',
          { type: jsonType, allowNull: true },
          { transaction },
        ),
        queryInterface.addColumn(
          'mentor_profiles',
          'industries',
          { type: jsonType, allowNull: true },
          { transaction },
        ),
        queryInterface.addColumn(
          'mentor_profiles',
          'goalTags',
          { type: jsonType, allowNull: true },
          { transaction },
        ),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.removeColumn('mentor_profiles', 'languages', { transaction }).catch(() => {}),
        queryInterface.removeColumn('mentor_profiles', 'industries', { transaction }).catch(() => {}),
        queryInterface.removeColumn('mentor_profiles', 'goalTags', { transaction }).catch(() => {}),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
