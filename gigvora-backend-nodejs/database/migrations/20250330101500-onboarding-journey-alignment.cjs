'use strict';

const { QueryTypes } = require('sequelize');
const { resolveJsonType } = require('../utils/migrationHelpers.cjs');

function normaliseRole(value) {
  if (!value) {
    return null;
  }
  const trimmed = `${value}`.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/\s+/g, '_');
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);
    await queryInterface.addColumn('users', 'dateOfBirth', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'preferredRoles', {
      type: jsonType,
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('users', 'marketingOptIn', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.sequelize.transaction(async (transaction) => {
      const users = await queryInterface.sequelize.query(
        'SELECT id, "userType", memberships, "primaryDashboard" FROM users',
        { type: QueryTypes.SELECT, transaction },
      );

      for (const row of users) {
        const userType = normaliseRole(row.userType) || 'user';
        const memberships = new Set(ensureArray(row.memberships).map(normaliseRole).filter(Boolean));
        memberships.add(userType);
        const membershipList = Array.from(memberships);
        const preferredRoles = membershipList.filter((role) => role && role !== 'user');

        let primaryDashboard = normaliseRole(row.primaryDashboard);
        if (!primaryDashboard || !memberships.has(primaryDashboard)) {
          primaryDashboard = preferredRoles[0] || membershipList[0] || 'user';
        }

        await queryInterface.bulkUpdate(
          'users',
          {
            memberships: membershipList,
            preferredRoles,
            primaryDashboard,
            marketingOptIn: true,
          },
          { id: row.id },
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'marketingOptIn');
    await queryInterface.removeColumn('users', 'preferredRoles');
    await queryInterface.removeColumn('users', 'dateOfBirth');
  },
};
