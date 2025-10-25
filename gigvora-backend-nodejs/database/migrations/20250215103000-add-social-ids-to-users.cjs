'use strict';

/** @type {import('sequelize').QueryInterface} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'appleId', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'linkedinId', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addIndex('users', {
      fields: ['appleId'],
      unique: true,
      name: 'users_apple_id_unique',
    });
    await queryInterface.addIndex('users', {
      fields: ['linkedinId'],
      unique: true,
      name: 'users_linkedin_id_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_linkedin_id_unique');
    await queryInterface.removeIndex('users', 'users_apple_id_unique');
    await queryInterface.removeColumn('users', 'linkedinId');
    await queryInterface.removeColumn('users', 'appleId');
  },
};
