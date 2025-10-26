'use strict';

const { resolveJsonType, dropEnum } = require('../utils/migrationHelpers.cjs');

const DISPLAY_TYPE_ENUM = 'enum_site_navigation_links_displayType';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.changeColumn(
        'site_navigation_links',
        'url',
        {
          type: Sequelize.STRING(2048),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'site_navigation_links',
        'displayType',
        {
          type: Sequelize.ENUM('link', 'menu', 'section', 'search'),
          allowNull: false,
          defaultValue: 'link',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'site_navigation_links',
        'metadata',
        {
          type: jsonType,
          allowNull: false,
          defaultValue: {},
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('site_navigation_links', 'metadata', { transaction });
      await queryInterface.removeColumn('site_navigation_links', 'displayType', { transaction });

      await queryInterface.changeColumn(
        'site_navigation_links',
        'url',
        {
          type: Sequelize.STRING(2048),
          allowNull: false,
        },
        { transaction },
      );

      await dropEnum(queryInterface, DISPLAY_TYPE_ENUM, transaction);
    });
  },
};
