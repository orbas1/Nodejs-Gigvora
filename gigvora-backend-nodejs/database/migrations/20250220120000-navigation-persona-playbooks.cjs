'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.addColumn('navigation_personas', 'playbooks', {
      type: jsonType,
      allowNull: false,
      defaultValue: [],
    });

    await queryInterface.addColumn('navigation_personas', 'lastReviewedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('navigation_personas', 'lastReviewedAt');
    await queryInterface.removeColumn('navigation_personas', 'playbooks');
  },
};
