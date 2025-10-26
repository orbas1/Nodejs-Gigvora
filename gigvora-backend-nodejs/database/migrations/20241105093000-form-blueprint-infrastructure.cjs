'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('form_blueprints', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      key: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(180), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      persona: { type: Sequelize.STRING(120), allowNull: true },
      version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      status: { type: Sequelize.ENUM('draft', 'active', 'deprecated'), allowNull: false, defaultValue: 'draft' },
      analyticsChannel: { type: Sequelize.STRING(120), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      settings: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('form_blueprint_steps', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      blueprintId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'form_blueprints', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      stepKey: { type: Sequelize.STRING(120), allowNull: false },
      title: { type: Sequelize.STRING(180), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      gatingRules: { type: jsonType, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('form_blueprint_fields', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      blueprintId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'form_blueprints', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      stepId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'form_blueprint_steps', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      label: { type: Sequelize.STRING(200), allowNull: false },
      placeholder: { type: Sequelize.STRING(255), allowNull: true },
      helpText: { type: Sequelize.TEXT, allowNull: true },
      component: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'text' },
      dataType: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'string' },
      required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      defaultValue: { type: Sequelize.TEXT, allowNull: true },
      options: { type: jsonType, allowNull: true },
      normalizers: { type: jsonType, allowNull: true },
      analytics: { type: jsonType, allowNull: true },
      orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      visibility: { type: jsonType, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('form_blueprint_validations', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      fieldId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'form_blueprint_fields', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      type: { type: Sequelize.STRING(120), allowNull: false },
      message: { type: Sequelize.STRING(255), allowNull: false },
      severity: { type: Sequelize.ENUM('error', 'warning'), allowNull: false, defaultValue: 'error' },
      haltOnFail: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      config: { type: jsonType, allowNull: true },
      orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('form_blueprints', ['status']);
    await queryInterface.addIndex('form_blueprints', ['persona']);

    await queryInterface.addIndex('form_blueprint_steps', ['blueprintId', 'orderIndex']);
    await queryInterface.addIndex('form_blueprint_steps', ['blueprintId', 'stepKey'], { unique: true });

    await queryInterface.addIndex('form_blueprint_fields', ['blueprintId', 'orderIndex']);
    await queryInterface.addIndex('form_blueprint_fields', ['stepId', 'orderIndex']);
    await queryInterface.addIndex('form_blueprint_fields', ['blueprintId', 'name'], { unique: true });

    await queryInterface.addIndex('form_blueprint_validations', ['fieldId', 'orderIndex']);
    await queryInterface.addIndex('form_blueprint_validations', ['type']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('form_blueprint_validations', ['type']);
    await queryInterface.removeIndex('form_blueprint_validations', ['fieldId', 'orderIndex']);
    await queryInterface.removeIndex('form_blueprint_fields', ['blueprintId', 'name']);
    await queryInterface.removeIndex('form_blueprint_fields', ['stepId', 'orderIndex']);
    await queryInterface.removeIndex('form_blueprint_fields', ['blueprintId', 'orderIndex']);
    await queryInterface.removeIndex('form_blueprint_steps', ['blueprintId', 'stepKey']);
    await queryInterface.removeIndex('form_blueprint_steps', ['blueprintId', 'orderIndex']);
    await queryInterface.removeIndex('form_blueprints', ['persona']);
    await queryInterface.removeIndex('form_blueprints', ['status']);

    await queryInterface.dropTable('form_blueprint_validations');
    await queryInterface.dropTable('form_blueprint_fields');
    await queryInterface.dropTable('form_blueprint_steps');
    await queryInterface.dropTable('form_blueprints');

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres' || dialect === 'postgresql') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_form_blueprints_status"');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_form_blueprint_validations_severity"');
    }
  },
};
