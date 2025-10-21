'use strict';

const PORTAL_STATUSES = ['draft', 'active', 'paused', 'archived'];
const TIMELINE_STATUSES = ['planned', 'in_progress', 'at_risk', 'completed', 'blocked'];
const SCOPE_STATUSES = ['committed', 'in_delivery', 'delivered', 'proposed', 'out_of_scope'];
const DECISION_VISIBILITIES = ['internal', 'client', 'public'];
const INSIGHT_TYPES = ['health', 'finance', 'engagement', 'risk', 'custom'];
const INSIGHT_VISIBILITIES = ['internal', 'shared'];

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable(
        'client_portals',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'projects', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          title: { type: Sequelize.STRING(255), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: true },
          status: { type: Sequelize.ENUM(...PORTAL_STATUSES), allowNull: false, defaultValue: 'draft' },
          brandColor: { type: Sequelize.STRING(12), allowNull: true },
          accentColor: { type: Sequelize.STRING(12), allowNull: true },
          preferences: { type: jsonType, allowNull: true },
          stakeholders: { type: jsonType, allowNull: true },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'client_portals',
        ['projectId', 'status'],
        {
          name: 'client_portals_project_status_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'client_portal_timeline_events',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          portalId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'client_portals', key: 'id' },
            onDelete: 'CASCADE',
          },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          eventType: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'milestone' },
          status: {
            type: Sequelize.ENUM(...TIMELINE_STATUSES),
            allowNull: false,
            defaultValue: 'planned',
          },
          startDate: { type: Sequelize.DATE, allowNull: true },
          dueDate: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'client_portal_timeline_events',
        ['portalId', 'dueDate'],
        {
          name: 'client_portal_timeline_events_due_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'client_portal_timeline_events',
        ['portalId', 'status'],
        {
          name: 'client_portal_timeline_events_status_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'client_portal_scope_items',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          portalId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'client_portals', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          category: { type: Sequelize.STRING(120), allowNull: true },
          status: {
            type: Sequelize.ENUM(...SCOPE_STATUSES),
            allowNull: false,
            defaultValue: 'committed',
          },
          effortHours: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          valueCurrency: { type: Sequelize.STRING(6), allowNull: true },
          valueAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          lastDecisionAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'client_portal_scope_items',
        ['portalId', 'status'],
        {
          name: 'client_portal_scope_items_status_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'client_portal_decision_logs',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          portalId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'client_portals', key: 'id' },
            onDelete: 'CASCADE',
          },
          decidedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          summary: { type: Sequelize.STRING(255), allowNull: false },
          decision: { type: Sequelize.TEXT, allowNull: false },
          decidedAt: { type: Sequelize.DATE, allowNull: false },
          category: { type: Sequelize.STRING(120), allowNull: true },
          impactSummary: { type: Sequelize.TEXT, allowNull: true },
          followUpDate: { type: Sequelize.DATE, allowNull: true },
          visibility: {
            type: Sequelize.ENUM(...DECISION_VISIBILITIES),
            allowNull: false,
            defaultValue: 'client',
          },
          attachments: { type: jsonType, allowNull: true },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'client_portal_decision_logs',
        ['portalId', 'decidedAt'],
        {
          name: 'client_portal_decision_logs_decided_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'client_portal_insight_widgets',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          portalId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'client_portals', key: 'id' },
            onDelete: 'CASCADE',
          },
          widgetType: {
            type: Sequelize.ENUM(...INSIGHT_TYPES),
            allowNull: false,
            defaultValue: 'custom',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          data: { type: jsonType, allowNull: true },
          visibility: {
            type: Sequelize.ENUM(...INSIGHT_VISIBILITIES),
            allowNull: false,
            defaultValue: 'shared',
          },
          orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'client_portal_insight_widgets',
        ['portalId', 'orderIndex'],
        {
          name: 'client_portal_insight_widgets_order_idx',
          transaction,
        },
      );

      await queryInterface.addConstraint('client_portals', {
        type: 'unique',
        fields: ['slug'],
        name: 'client_portals_slug_unique',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    const isPostgres = ['postgres', 'postgresql'].includes(dialect);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('client_portals', 'client_portals_slug_unique', { transaction });
      await queryInterface.removeIndex('client_portal_insight_widgets', 'client_portal_insight_widgets_order_idx', { transaction });
      await queryInterface.removeIndex('client_portal_decision_logs', 'client_portal_decision_logs_decided_idx', { transaction });
      await queryInterface.removeIndex('client_portal_scope_items', 'client_portal_scope_items_status_idx', { transaction });
      await queryInterface.removeIndex('client_portal_timeline_events', 'client_portal_timeline_events_status_idx', { transaction });
      await queryInterface.removeIndex('client_portal_timeline_events', 'client_portal_timeline_events_due_idx', { transaction });
      await queryInterface.removeIndex('client_portals', 'client_portals_project_status_idx', { transaction });

      await queryInterface.dropTable('client_portal_insight_widgets', { transaction });
      await queryInterface.dropTable('client_portal_decision_logs', { transaction });
      await queryInterface.dropTable('client_portal_scope_items', { transaction });
      await queryInterface.dropTable('client_portal_timeline_events', { transaction });
      await queryInterface.dropTable('client_portals', { transaction });

      if (isPostgres) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_client_portals_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_client_portal_timeline_events_status";', {
          transaction,
        });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_client_portal_scope_items_status";', {
          transaction,
        });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_client_portal_decision_logs_visibility";', {
          transaction,
        });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_client_portal_insight_widgets_widgetType";', {
          transaction,
        });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_client_portal_insight_widgets_visibility";', {
          transaction,
        });
      }
    });
  },
};
