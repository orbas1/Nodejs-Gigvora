'use strict';

const { safeRemoveIndex, tableHasColumn } = require('../utils/migrationHelpers.cjs');

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const profileVisibilityColumn = await tableHasColumn(
        queryInterface,
        'profiles',
        'profile_visibility',
        { aliases: ['profileVisibility'] },
      );

      await queryInterface.addIndex(
        'profiles',
        ['updatedAt'],
        { name: 'profiles_updated_at_idx', transaction },
      );
      if (profileVisibilityColumn) {
        await queryInterface.addIndex(
          'profiles',
          [profileVisibilityColumn, 'updatedAt'],
          { name: 'profiles_visibility_updated_idx', transaction },
        );
      }
      await queryInterface.addIndex(
        'company_profiles',
        ['companyName'],
        { name: 'company_profiles_name_idx', transaction },
      );
      await queryInterface.addIndex(
        'freelancer_profiles',
        ['title', 'availability'],
        { name: 'freelancer_profiles_title_availability_idx', transaction },
      );

      const memberVisibilityExpression = profileVisibilityColumn
        ? `"${profileVisibilityColumn}"`
        : `'members'`;

      const viewSql = `CREATE VIEW profile_directory AS
        SELECT id, "userId", 'member' AS "profileType", headline AS title, bio AS description, ${memberVisibilityExpression} AS visibility, "createdAt", "updatedAt"
        FROM profiles
      UNION ALL
        SELECT id, "userId", 'company' AS "profileType", "companyName" AS title, description, 'public' AS visibility, "createdAt", "updatedAt"
        FROM company_profiles
      UNION ALL
        SELECT id, "userId", 'agency' AS "profileType", "agencyName" AS title, "focusArea" AS description, 'public' AS visibility, "createdAt", "updatedAt"
        FROM agency_profiles
      UNION ALL
        SELECT id, "userId", 'freelancer' AS "profileType", title, availability AS description, 'public' AS visibility, "createdAt", "updatedAt"
        FROM freelancer_profiles;`;

      await queryInterface.sequelize.query(viewSql, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS profile_directory;', { transaction });
      await safeRemoveIndex(queryInterface, 'freelancer_profiles', 'freelancer_profiles_title_availability_idx', { transaction });
      await safeRemoveIndex(queryInterface, 'company_profiles', 'company_profiles_name_idx', { transaction });
      await safeRemoveIndex(queryInterface, 'profiles', 'profiles_visibility_updated_idx', { transaction });
      await safeRemoveIndex(queryInterface, 'profiles', 'profiles_updated_at_idx', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
