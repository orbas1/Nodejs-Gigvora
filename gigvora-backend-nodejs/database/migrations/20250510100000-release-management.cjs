'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'release_pipelines',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          key: { type: Sequelize.STRING(120), allowNull: false, unique: true },
          name: { type: Sequelize.STRING(200), allowNull: false },
          version: { type: Sequelize.STRING(60), allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          owner_name: { type: Sequelize.STRING(160), allowNull: true },
          owner_email: { type: Sequelize.STRING(160), allowNull: true },
          status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'in_progress' },
          is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          active_phase_key: { type: Sequelize.STRING(120), allowNull: true },
          started_at: { type: Sequelize.DATE, allowNull: true },
          target_release_at: { type: Sequelize.DATE, allowNull: true },
          released_at: { type: Sequelize.DATE, allowNull: true },
          release_notes_url: { type: Sequelize.STRING(255), allowNull: true },
          release_notes_ref: { type: Sequelize.STRING(160), allowNull: true },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'release_pipelines',
        ['status'],
        { transaction, name: 'release_pipelines_status_idx' },
      );

      await queryInterface.createTable(
        'release_phases',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          release_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'release_pipelines', key: 'id' },
            onDelete: 'CASCADE',
          },
          key: { type: Sequelize.STRING(120), allowNull: false },
          name: { type: Sequelize.STRING(160), allowNull: false },
          summary: { type: Sequelize.STRING(400), allowNull: true },
          owner_name: { type: Sequelize.STRING(160), allowNull: true },
          status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'pending' },
          coverage_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          order_index: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          started_at: { type: Sequelize.DATE, allowNull: true },
          completed_at: { type: Sequelize.DATE, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'release_phases',
        ['release_id', 'key'],
        { unique: true, transaction, name: 'release_phases_release_key_idx' },
      );

      await queryInterface.addIndex(
        'release_phases',
        ['release_id', 'order_index'],
        { transaction, name: 'release_phases_order_idx' },
      );

      await queryInterface.createTable(
        'release_segments',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          release_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'release_pipelines', key: 'id' },
            onDelete: 'CASCADE',
          },
          key: { type: Sequelize.STRING(120), allowNull: false },
          name: { type: Sequelize.STRING(160), allowNull: false },
          summary: { type: Sequelize.STRING(400), allowNull: true },
          owner_name: { type: Sequelize.STRING(160), allowNull: true },
          status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'pending' },
          coverage_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'release_segments',
        ['release_id', 'key'],
        { unique: true, transaction, name: 'release_segments_release_key_idx' },
      );

      await queryInterface.createTable(
        'release_checklist_items',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          release_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'release_pipelines', key: 'id' },
            onDelete: 'CASCADE',
          },
          key: { type: Sequelize.STRING(120), allowNull: false },
          name: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.STRING(400), allowNull: true },
          owner_name: { type: Sequelize.STRING(160), allowNull: true },
          status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'pending' },
          due_at: { type: Sequelize.DATE, allowNull: true },
          completed_at: { type: Sequelize.DATE, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'release_checklist_items',
        ['release_id', 'key'],
        { unique: true, transaction, name: 'release_checklist_release_key_idx' },
      );

      await queryInterface.createTable(
        'release_monitors',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          release_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'release_pipelines', key: 'id' },
            onDelete: 'SET NULL',
          },
          monitor_key: { type: Sequelize.STRING(120), allowNull: false, unique: true },
          name: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.STRING(400), allowNull: true },
          environment: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'production' },
          status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'unknown' },
          coverage_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          metrics: { type: jsonType, allowNull: false, defaultValue: {} },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          last_sampled_at: { type: Sequelize.DATE, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'release_monitors',
        ['environment'],
        { transaction, name: 'release_monitors_environment_idx' },
      );

      await queryInterface.createTable(
        'release_events',
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
          release_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'release_pipelines', key: 'id' },
            onDelete: 'SET NULL',
          },
          event_type: { type: Sequelize.STRING(80), allowNull: false },
          resource_key: { type: Sequelize.STRING(160), allowNull: true },
          status: { type: Sequelize.STRING(32), allowNull: true },
          summary: { type: Sequelize.STRING(400), allowNull: true },
          actor_name: { type: Sequelize.STRING(160), allowNull: true },
          actor_role: { type: Sequelize.STRING(120), allowNull: true },
          payload: { type: jsonType, allowNull: false, defaultValue: {} },
          occurred_at: { type: Sequelize.DATE, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'release_events',
        ['release_id', 'event_type'],
        { transaction, name: 'release_events_release_type_idx' },
      );

      await queryInterface.addIndex(
        'release_events',
        ['occurred_at'],
        { transaction, name: 'release_events_occurred_at_idx' },
      );

      await queryInterface.createTable(
        'release_pipeline_runs',
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
          release_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'release_pipelines', key: 'id' },
            onDelete: 'SET NULL',
          },
          pipeline_key: { type: Sequelize.STRING(120), allowNull: false },
          status: { type: Sequelize.STRING(32), allowNull: false },
          started_at: { type: Sequelize.DATE, allowNull: false },
          completed_at: { type: Sequelize.DATE, allowNull: true },
          duration_ms: { type: Sequelize.INTEGER, allowNull: true },
          tasks: { type: jsonType, allowNull: false, defaultValue: [] },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'release_pipeline_runs',
        ['pipeline_key', 'started_at'],
        { transaction, name: 'release_pipeline_runs_key_started_idx' },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('release_pipeline_runs', { transaction });
      await queryInterface.dropTable('release_events', { transaction });
      await queryInterface.dropTable('release_monitors', { transaction });
      await queryInterface.dropTable('release_checklist_items', { transaction });
      await queryInterface.dropTable('release_segments', { transaction });
      await queryInterface.dropTable('release_phases', { transaction });
      await queryInterface.dropTable('release_pipelines', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
