'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.createTable('navigation_locales', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      code: { type: Sequelize.STRING(12), allowNull: false, unique: true },
      label: { type: Sequelize.STRING(160), allowNull: false },
      nativeLabel: { type: Sequelize.STRING(160), allowNull: false },
      flag: { type: Sequelize.STRING(16), allowNull: true },
      region: { type: Sequelize.STRING(180), allowNull: true },
      coverage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      status: { type: Sequelize.ENUM('ga', 'beta', 'preview'), allowNull: false, defaultValue: 'preview' },
      supportLead: { type: Sequelize.STRING(180), allowNull: true },
      lastUpdated: { type: Sequelize.DATE, allowNull: true },
      summary: { type: Sequelize.TEXT, allowNull: true },
      direction: { type: Sequelize.ENUM('ltr', 'rtl'), allowNull: false, defaultValue: 'ltr' },
      isDefault: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.createTable('navigation_personas', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      personaKey: { type: Sequelize.STRING(60), allowNull: false, unique: true },
      label: { type: Sequelize.STRING(160), allowNull: false },
      icon: { type: Sequelize.STRING(120), allowNull: true },
      tagline: { type: Sequelize.STRING(255), allowNull: true },
      focusAreas: { type: jsonType, allowNull: false, defaultValue: [] },
      metrics: { type: jsonType, allowNull: false, defaultValue: [] },
      primaryCta: { type: Sequelize.STRING(200), allowNull: true },
      defaultRoute: { type: Sequelize.STRING(2048), allowNull: true },
      timelineEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.createTable('navigation_chrome_configs', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      configKey: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(255), allowNull: true },
      payload: { type: jsonType, allowNull: false, defaultValue: {} },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('navigation_locales', ['sortOrder', 'code'], {
      name: 'navigation_locales_order_idx',
    });
    await queryInterface.addIndex('navigation_personas', ['sortOrder', 'personaKey'], {
      name: 'navigation_personas_order_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('navigation_personas', 'navigation_personas_order_idx');
    await queryInterface.removeIndex('navigation_locales', 'navigation_locales_order_idx');
    await queryInterface.dropTable('navigation_chrome_configs');
    await queryInterface.dropTable('navigation_personas');
    await queryInterface.dropTable('navigation_locales');

    const dropEnumStatements = [
      'DROP TYPE IF EXISTS "enum_navigation_locales_status"',
      'DROP TYPE IF EXISTS "enum_navigation_locales_direction"',
    ];

    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const statement of dropEnumStatements) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await queryInterface.sequelize.query(statement, { transaction });
        } catch (error) {
          // ignore when dialect does not support enum drops or type missing
        }
      }
    });
  },
};
