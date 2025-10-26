'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'monitoring_insight_snapshots',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
          timeframe: { type: Sequelize.STRING(16), allowNull: false },
          captured_at: { type: Sequelize.DATE, allowNull: false },
          total_reach: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
          total_reach_delta: { type: Sequelize.DECIMAL(8, 4), allowNull: false, defaultValue: 0 },
          engagement_rate: { type: Sequelize.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
          engagement_rate_delta: { type: Sequelize.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
          conversion_lift: { type: Sequelize.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
          conversion_lift_delta: { type: Sequelize.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
          anomaly_coverage: { type: Sequelize.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
          anomaly_coverage_delta: { type: Sequelize.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
          timeline: { type: jsonType, allowNull: false, defaultValue: [] },
          personas: { type: jsonType, allowNull: false, defaultValue: [] },
          anomalies: { type: jsonType, allowNull: false, defaultValue: [] },
          roadmap: { type: jsonType, allowNull: false, defaultValue: [] },
          narratives: { type: jsonType, allowNull: false, defaultValue: [] },
          journeys: { type: jsonType, allowNull: false, defaultValue: [] },
          qa: { type: jsonType, allowNull: false, defaultValue: {} },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('monitoring_insight_snapshots', ['timeframe'], { transaction });
      await queryInterface.addIndex('monitoring_insight_snapshots', ['captured_at'], { transaction });

      await queryInterface.createTable(
        'monitoring_metrics',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
          metric_key: { type: Sequelize.STRING(80), allowNull: false },
          label: { type: Sequelize.STRING(160), allowNull: false },
          value: { type: Sequelize.DECIMAL(10, 4), allowNull: false, defaultValue: 0 },
          delta: { type: Sequelize.DECIMAL(8, 4), allowNull: false, defaultValue: 0 },
          sample_size: { type: Sequelize.INTEGER, allowNull: true },
          narrative: { type: Sequelize.TEXT, allowNull: true },
          sparkline: { type: jsonType, allowNull: false, defaultValue: [] },
          tags: { type: jsonType, allowNull: false, defaultValue: [] },
          persona: { type: Sequelize.STRING(80), allowNull: true },
          persona_label: { type: Sequelize.STRING(160), allowNull: true },
          channel: { type: Sequelize.STRING(80), allowNull: true },
          channel_label: { type: Sequelize.STRING(160), allowNull: true },
          timeframe: { type: Sequelize.STRING(16), allowNull: false, defaultValue: '30d' },
          compare_to: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'previous_period' },
          include_benchmarks: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('monitoring_metrics', ['metric_key'], { transaction });
      await queryInterface.addIndex('monitoring_metrics', ['persona'], { transaction });
      await queryInterface.addIndex('monitoring_metrics', ['channel'], { transaction });
      await queryInterface.addIndex('monitoring_metrics', ['timeframe'], { transaction });

      await queryInterface.createTable(
        'monitoring_metric_alerts',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
          metric_key: { type: Sequelize.STRING(80), allowNull: false },
          title: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'watching' },
          threshold: { type: Sequelize.DECIMAL(10, 4), allowNull: true },
          value: { type: Sequelize.DECIMAL(10, 4), allowNull: true },
          severity: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'medium' },
          timeframe: { type: Sequelize.STRING(16), allowNull: false, defaultValue: '30d' },
          persona: { type: Sequelize.STRING(80), allowNull: true },
          channel: { type: Sequelize.STRING(80), allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('monitoring_metric_alerts', ['metric_key'], { transaction });
      await queryInterface.addIndex('monitoring_metric_alerts', ['timeframe'], { transaction });
      await queryInterface.addIndex('monitoring_metric_alerts', ['severity'], { transaction });

      await queryInterface.createTable(
        'monitoring_metric_views',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
          name: { type: Sequelize.STRING(160), allowNull: false },
          timeframe: { type: Sequelize.STRING(16), allowNull: false, defaultValue: '30d' },
          query: { type: jsonType, allowNull: false, defaultValue: {} },
          created_by: { type: Sequelize.STRING(120), allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('monitoring_metric_views', ['name'], { unique: true, transaction });

      await queryInterface.createTable(
        'monitoring_audit_events',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
          severity: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'medium' },
          action: { type: Sequelize.STRING(160), allowNull: false },
          summary: { type: Sequelize.STRING(400), allowNull: false },
          actor_name: { type: Sequelize.STRING(160), allowNull: false },
          actor_type: { type: Sequelize.STRING(80), allowNull: false },
          resource_key: { type: Sequelize.STRING(160), allowNull: false },
          resource_label: { type: Sequelize.STRING(160), allowNull: false },
          resource_type: { type: Sequelize.STRING(80), allowNull: false },
          occurred_at: { type: Sequelize.DATE, allowNull: false },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          related_incidents: { type: jsonType, allowNull: false, defaultValue: [] },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('monitoring_audit_events', ['severity'], { transaction });
      await queryInterface.addIndex('monitoring_audit_events', ['actor_type'], { transaction });
      await queryInterface.addIndex('monitoring_audit_events', ['resource_type'], { transaction });
      await queryInterface.addIndex('monitoring_audit_events', ['occurred_at'], { transaction });

      await queryInterface.createTable(
        'monitoring_audit_summaries',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
          timeframe: { type: Sequelize.STRING(16), allowNull: false, unique: true },
          total_events: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          critical_events: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          median_response_minutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          compliance_posture: { type: Sequelize.STRING(320), allowNull: false },
          residual_risk_narrative: { type: Sequelize.STRING(400), allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
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
      await queryInterface.dropTable('monitoring_audit_summaries', { transaction });
      await queryInterface.dropTable('monitoring_audit_events', { transaction });
      await queryInterface.dropTable('monitoring_metric_views', { transaction });
      await queryInterface.dropTable('monitoring_metric_alerts', { transaction });
      await queryInterface.dropTable('monitoring_metrics', { transaction });
      await queryInterface.dropTable('monitoring_insight_snapshots', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
