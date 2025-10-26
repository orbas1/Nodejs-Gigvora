'use strict';

const STATUS_ENUM = 'enum_system_status_events_status';
const SEVERITY_ENUM = 'enum_system_status_events_severity';
const PULSE_STATUS_ENUM = 'enum_feedback_pulse_surveys_status';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function dropEnum(queryInterface, enumName) {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('system_status_events', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      eventKey: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      status: {
        type: Sequelize.ENUM('operational', 'degraded', 'maintenance', 'incident', 'outage'),
        allowNull: false,
        defaultValue: 'operational',
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'notice', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'low',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: true },
      impactedServices: { type: jsonType, allowNull: false, defaultValue: [] },
      metadata: { type: jsonType, allowNull: false, defaultValue: [] },
      nextSteps: { type: jsonType, allowNull: false, defaultValue: [] },
      actions: { type: jsonType, allowNull: false, defaultValue: [] },
      acknowledgementRequired: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      publishedAt: { type: Sequelize.DATE, allowNull: true },
      expiresAt: { type: Sequelize.DATE, allowNull: true },
      resolvedAt: { type: Sequelize.DATE, allowNull: true },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
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

    await queryInterface.addIndex('system_status_events', ['publishedAt']);
    await queryInterface.addIndex('system_status_events', ['status']);
    await queryInterface.addIndex('system_status_events', ['severity']);

    await queryInterface.createTable('system_status_acknowledgements', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      statusEventId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'system_status_events', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      acknowledgedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      channel: { type: Sequelize.STRING(80), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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

    await queryInterface.addIndex('system_status_acknowledgements', ['statusEventId']);
    await queryInterface.addIndex('system_status_acknowledgements', ['userId']);
    await queryInterface.addConstraint('system_status_acknowledgements', {
      type: 'unique',
      fields: ['statusEventId', 'userId'],
      name: 'system_status_acknowledgements_unique_status_user',
    });

    await queryInterface.createTable('feedback_pulse_surveys', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      pulseKey: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'archived'),
        allowNull: false,
        defaultValue: 'active',
      },
      question: { type: Sequelize.STRING(500), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      tags: { type: jsonType, allowNull: false, defaultValue: [] },
      segments: { type: jsonType, allowNull: false, defaultValue: [] },
      insights: { type: jsonType, allowNull: false, defaultValue: [] },
      trendLabel: { type: Sequelize.STRING(160), allowNull: true },
      trendValue: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      trendDelta: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      trendSampleSize: { type: Sequelize.INTEGER, allowNull: true },
      responseCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      lastResponseAt: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
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

    await queryInterface.addIndex('feedback_pulse_surveys', ['status']);
    await queryInterface.addIndex('feedback_pulse_surveys', ['createdAt']);

    await queryInterface.createTable('feedback_pulse_responses', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      surveyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'feedback_pulse_surveys', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      score: { type: Sequelize.INTEGER, allowNull: false },
      tags: { type: jsonType, allowNull: false, defaultValue: [] },
      comment: { type: Sequelize.TEXT, allowNull: true },
      channel: { type: Sequelize.STRING(80), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      submittedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
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

    await queryInterface.addIndex('feedback_pulse_responses', ['surveyId']);
    await queryInterface.addIndex('feedback_pulse_responses', ['userId']);
    await queryInterface.addIndex('feedback_pulse_responses', ['submittedAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('feedback_pulse_responses');
    await queryInterface.dropTable('feedback_pulse_surveys');
    await queryInterface.dropTable('system_status_acknowledgements');
    await queryInterface.dropTable('system_status_events');

    await dropEnum(queryInterface, PULSE_STATUS_ENUM);
    await dropEnum(queryInterface, SEVERITY_ENUM);
    await dropEnum(queryInterface, STATUS_ENUM);
  },
};
