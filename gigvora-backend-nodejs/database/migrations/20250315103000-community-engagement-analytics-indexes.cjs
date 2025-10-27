'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex('group_memberships', ['groupId', 'status'], {
        name: 'group_memberships_group_status_idx',
        transaction,
      });
      await queryInterface.addIndex('group_memberships', ['groupId', 'joinedAt'], {
        name: 'group_memberships_group_joined_at_idx',
        transaction,
      });
      await queryInterface.addIndex('group_posts', ['groupId', 'publishedAt'], {
        name: 'group_posts_group_published_at_idx',
        transaction,
      });
      await queryInterface.addIndex('group_posts', ['groupId', 'scheduledAt'], {
        name: 'group_posts_group_scheduled_at_idx',
        transaction,
      });
      await queryInterface.addIndex('group_invites', ['groupId', 'expiresAt'], {
        name: 'group_invites_group_expires_at_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('group_invites', 'group_invites_group_expires_at_idx', { transaction });
      await queryInterface.removeIndex('group_posts', 'group_posts_group_scheduled_at_idx', { transaction });
      await queryInterface.removeIndex('group_posts', 'group_posts_group_published_at_idx', { transaction });
      await queryInterface.removeIndex('group_memberships', 'group_memberships_group_joined_at_idx', { transaction });
      await queryInterface.removeIndex('group_memberships', 'group_memberships_group_status_idx', { transaction });
    });
  },
};
