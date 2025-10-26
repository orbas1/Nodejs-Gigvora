'use strict';

async function columnExists(queryInterface, tableName, columnName) {
  const columns = await queryInterface.describeTable(tableName);
  return Boolean(columns[columnName]);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const hasColumn = await columnExists(queryInterface, 'users', 'timezone');
    if (!hasColumn) {
      await queryInterface.addColumn('users', 'timezone', {
        type: Sequelize.STRING(120),
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(
      `UPDATE users
        SET timezone = sub.timezone
      FROM (
        SELECT DISTINCT ON ("userId") "userId", timezone
        FROM profiles
        WHERE timezone IS NOT NULL
        ORDER BY "userId", "updatedAt" DESC
      ) AS sub
      WHERE users.id = sub."userId" AND users.timezone IS NULL`,
    ).catch(async (error) => {
      if (error?.original?.code === '42601') {
        throw error;
      }
      await queryInterface.sequelize.query(
        'UPDATE users SET timezone = (SELECT timezone FROM profiles WHERE profiles.userId = users.id AND profiles.timezone IS NOT NULL ORDER BY profiles.updatedAt DESC LIMIT 1) WHERE timezone IS NULL',
      );
    });
  },

  async down(queryInterface) {
    const hasColumn = await columnExists(queryInterface, 'users', 'timezone');
    if (hasColumn) {
      await queryInterface.removeColumn('users', 'timezone');
    }
  },
};
