'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const duplicates = await queryInterface.sequelize.query(
        'SELECT googleId, COUNT(*) AS count FROM users WHERE googleId IS NOT NULL GROUP BY googleId HAVING COUNT(*) > 1',
        { type: QueryTypes.SELECT, transaction },
      );

      if (duplicates.length > 0) {
        const conflictingIds = duplicates.map((entry) => entry.googleId).join(', ');
        throw new Error(
          `Cannot create unique index on users.googleId due to duplicate values: ${conflictingIds}`,
        );
      }

      await queryInterface.addIndex(
        'users',
        {
          fields: ['googleId'],
          unique: true,
          name: 'users_google_id_unique',
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_google_id_unique');
  },
};
