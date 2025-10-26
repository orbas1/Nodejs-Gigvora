'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('appearance_component_profiles', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      themeId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'appearance_themes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      componentKey: { type: Sequelize.STRING(120), allowNull: false },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'archived'),
        allowNull: false,
        defaultValue: 'active',
      },
      definition: { type: jsonType, allowNull: false, defaultValue: {} },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      createdBy: { type: Sequelize.INTEGER, allowNull: true },
      updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('appearance_component_profiles', {
      fields: ['themeId', 'componentKey'],
      type: 'unique',
      name: 'appearance_component_profiles_theme_component_unique',
    });

    await queryInterface.addIndex('appearance_component_profiles', ['componentKey'], {
      name: 'appearance_component_profiles_component_key_idx',
    });
    await queryInterface.addIndex('appearance_component_profiles', ['status'], {
      name: 'appearance_component_profiles_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('appearance_component_profiles', 'appearance_component_profiles_status_idx');
    await queryInterface.removeIndex('appearance_component_profiles', 'appearance_component_profiles_component_key_idx');
    await queryInterface.removeConstraint(
      'appearance_component_profiles',
      'appearance_component_profiles_theme_component_unique',
    );
    await queryInterface.dropTable('appearance_component_profiles');

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_appearance_component_profiles_status";',
      );
    }
  },
};
