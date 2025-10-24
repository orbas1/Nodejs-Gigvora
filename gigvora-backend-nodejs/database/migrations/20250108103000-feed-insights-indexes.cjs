'use strict';

const TABLES = {
  groupMemberships: 'group_memberships',
  connections: 'connections',
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex(TABLES.groupMemberships, ['groupId', 'status'], {
        name: 'group_memberships_group_status_idx',
        transaction,
      });
      await queryInterface.addIndex(TABLES.groupMemberships, ['userId', 'status'], {
        name: 'group_memberships_user_status_idx',
        transaction,
      });
      await queryInterface.addIndex(TABLES.connections, ['requesterId'], {
        name: 'connections_requester_idx',
        transaction,
      });
      await queryInterface.addIndex(TABLES.connections, ['addresseeId'], {
        name: 'connections_addressee_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(TABLES.groupMemberships, 'group_memberships_group_status_idx', { transaction });
      await queryInterface.removeIndex(TABLES.groupMemberships, 'group_memberships_user_status_idx', { transaction });
      await queryInterface.removeIndex(TABLES.connections, 'connections_requester_idx', { transaction });
      await queryInterface.removeIndex(TABLES.connections, 'connections_addressee_idx', { transaction });
    });
  },
};
