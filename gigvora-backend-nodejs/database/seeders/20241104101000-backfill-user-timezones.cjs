'use strict';

module.exports = {
  async up(queryInterface) {
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
    ).catch(async () => {
      await queryInterface.sequelize.query(
        'UPDATE users SET timezone = (SELECT timezone FROM profiles WHERE profiles.userId = users.id AND profiles.timezone IS NOT NULL ORDER BY profiles.updatedAt DESC LIMIT 1) WHERE timezone IS NULL',
      );
    });
  },

  async down() {
    // no-op rollback: seed data is non-destructive
  },
};
