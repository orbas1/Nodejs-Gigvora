'use strict';

const JOBS_TABLE = 'profile_engagement_jobs';
const JOBS_INDEX_NAME = 'profile_engagement_jobs_status_locked';
const FOLLOWERS_TABLE = 'profile_followers';
const FOLLOWERS_INDEX_NAME = 'profile_followers_follower_status';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex(JOBS_TABLE, ['status', 'lockedAt'], {
        name: JOBS_INDEX_NAME,
        transaction,
      });

      await queryInterface.addIndex(FOLLOWERS_TABLE, ['followerId', 'status'], {
        name: FOLLOWERS_INDEX_NAME,
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.removeIndex(JOBS_TABLE, JOBS_INDEX_NAME, { transaction });
      } catch (error) {
        // ignore missing index during rollback
      }

      try {
        await queryInterface.removeIndex(FOLLOWERS_TABLE, FOLLOWERS_INDEX_NAME, { transaction });
      } catch (error) {
        // ignore missing index during rollback
      }
    });
  },
};
