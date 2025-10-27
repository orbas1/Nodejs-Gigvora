'use strict';

const { resolveJsonType } = require('../utils/migrationHelpers.cjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('release_rollouts', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      version: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'draft' },
      generated_at: { type: Sequelize.DATE, allowNull: false },
      release_notes_path: { type: Sequelize.STRING(255), allowNull: true },
      pipeline_id: { type: Sequelize.STRING(80), allowNull: true },
      pipeline_name: { type: Sequelize.STRING(160), allowNull: true },
      pipeline_status: { type: Sequelize.STRING(32), allowNull: true },
      pipeline_finished_at: { type: Sequelize.DATE, allowNull: true },
      pipeline_duration_ms: { type: Sequelize.INTEGER, allowNull: true },
      quality_status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'unknown' },
      telemetry_error_budget_remaining: { type: Sequelize.DECIMAL(5, 4), allowNull: true },
      telemetry_p0_incidents: { type: Sequelize.INTEGER, allowNull: true },
      telemetry_latency_p99_ms: { type: Sequelize.INTEGER, allowNull: true },
      telemetry_regression_alerts: { type: jsonType, allowNull: false, defaultValue: [] },
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

    await queryInterface.addIndex('release_rollouts', ['status']);
    await queryInterface.addIndex('release_rollouts', ['generated_at']);

    await queryInterface.createTable('release_rollout_pipeline_steps', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      rollout_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'release_rollouts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sequence: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      step_id: { type: Sequelize.STRING(80), allowNull: false },
      name: { type: Sequelize.STRING(160), allowNull: false },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'pending' },
      duration_ms: { type: Sequelize.INTEGER, allowNull: true },
      commands: { type: jsonType, allowNull: false, defaultValue: [] },
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

    await queryInterface.addIndex('release_rollout_pipeline_steps', ['rollout_id']);
    await queryInterface.addIndex('release_rollout_pipeline_steps', ['sequence']);

    await queryInterface.createTable('release_rollout_quality_gates', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      rollout_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'release_rollouts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sequence: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      name: { type: Sequelize.STRING(160), allowNull: false },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'pending' },
      evidence: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('release_rollout_quality_gates', ['rollout_id']);
    await queryInterface.addIndex('release_rollout_quality_gates', ['sequence']);

    await queryInterface.createTable('release_rollout_cohorts', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      rollout_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'release_rollouts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sequence: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      name: { type: Sequelize.STRING(120), allowNull: false },
      target_percentage: { type: Sequelize.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
      current_percentage: { type: Sequelize.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
      error_budget_remaining: { type: Sequelize.DECIMAL(6, 4), allowNull: false, defaultValue: 1 },
      health: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'healthy' },
      notes: { type: jsonType, allowNull: false, defaultValue: [] },
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

    await queryInterface.addIndex('release_rollout_cohorts', ['rollout_id']);
    await queryInterface.addIndex('release_rollout_cohorts', ['sequence']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('release_rollout_cohorts');
    await queryInterface.dropTable('release_rollout_quality_gates');
    await queryInterface.dropTable('release_rollout_pipeline_steps');
    await queryInterface.dropTable('release_rollouts');
  },
};
