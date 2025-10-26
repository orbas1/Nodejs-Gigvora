'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const { JSONB, JSON } = Sequelize;
      const dialect = queryInterface.sequelize.getDialect();
      const isPostgres = dialect && dialect.toLowerCase().startsWith('postgres');
      const jsonType = isPostgres ? JSONB : JSON;

      await queryInterface.addColumn(
        'inbox_preferences',
        'pinnedThreadIds',
        {
          type: jsonType,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'saved_replies',
        'shortcuts',
        {
          type: jsonType,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      const setEmptyArray = isPostgres
        ? "UPDATE \"inbox_preferences\" SET \"pinnedThreadIds\" = '[]'::jsonb WHERE \"pinnedThreadIds\" IS NULL;"
        : "UPDATE `inbox_preferences` SET `pinnedThreadIds` = JSON_ARRAY() WHERE `pinnedThreadIds` IS NULL;";
      await queryInterface.sequelize.query(setEmptyArray, { transaction });

      const migrateShortcuts = isPostgres
        ? "UPDATE \"saved_replies\" SET \"shortcuts\" = CASE WHEN \"shortcut\" IS NOT NULL THEN jsonb_build_array(lower(\"shortcut\")) ELSE '[]'::jsonb END WHERE \"shortcuts\" IS NULL;"
        : "UPDATE `saved_replies` SET `shortcuts` = CASE WHEN `shortcut` IS NOT NULL THEN JSON_ARRAY(LOWER(`shortcut`)) ELSE JSON_ARRAY() END WHERE `shortcuts` IS NULL;";
      await queryInterface.sequelize.query(migrateShortcuts, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('saved_replies', 'shortcuts', { transaction });
      await queryInterface.removeColumn('inbox_preferences', 'pinnedThreadIds', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
