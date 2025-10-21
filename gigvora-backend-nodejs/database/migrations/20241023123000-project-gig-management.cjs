'use strict';

const ENUM_TYPES = [
  'enum_pgm_projects_status',
  'enum_pgm_project_workspaces_status',
  'enum_pgm_project_workspaces_riskLevel',
  'enum_pgm_project_milestones_status',
  'enum_pgm_project_collaborators_status',
  'enum_pgm_project_integrations_status',
  'enum_pgm_gig_orders_status',
  'enum_pgm_gig_order_requirements_status',
  'enum_pgm_gig_order_revisions_status',
];

const dropEnumType = async (queryInterface, typeName, transaction) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${typeName}";`, { transaction });
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'pgm_projects',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          status: { type: Sequelize.ENUM('planning', 'in_progress', 'at_risk', 'completed', 'on_hold'), allowNull: false, defaultValue: 'planning' },
          startDate: { type: Sequelize.DATE, allowNull: true },
          dueDate: { type: Sequelize.DATE, allowNull: true },
          budgetCurrency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          budgetAllocated: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          budgetSpent: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          archivedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex('pgm_projects', ['ownerId', 'status'], { name: 'pgm_projects_owner_status_idx', transaction });
      await queryInterface.addIndex('pgm_projects', ['ownerId', 'archivedAt'], { name: 'pgm_projects_owner_archived_idx', transaction });

      await queryInterface.createTable(
        'pgm_project_workspaces',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'pgm_projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('planning', 'in_progress', 'at_risk', 'completed', 'on_hold'),
            allowNull: false,
            defaultValue: 'planning',
          },
          progressPercent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          riskLevel: { type: Sequelize.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'low' },
          nextMilestone: { type: Sequelize.STRING(180), allowNull: true },
          nextMilestoneDueAt: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metrics: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_milestones',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          ordinal: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          dueDate: { type: Sequelize.DATE, allowNull: true },
          completedAt: { type: Sequelize.DATE, allowNull: true },
          status: {
            type: Sequelize.ENUM('planned', 'in_progress', 'waiting_on_client', 'completed'),
            allowNull: false,
            defaultValue: 'planned',
          },
          budget: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          metrics: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex('pgm_project_milestones', ['projectId', 'ordinal'], {
        name: 'pgm_project_milestones_project_ordinal_idx',
        transaction,
      });

      await queryInterface.createTable(
        'pgm_project_collaborators',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          fullName: { type: Sequelize.STRING(180), allowNull: false },
          email: { type: Sequelize.STRING(180), allowNull: true },
          role: { type: Sequelize.STRING(120), allowNull: false },
          status: {
            type: Sequelize.ENUM('invited', 'active', 'inactive'),
            allowNull: false,
            defaultValue: 'invited',
          },
          hourlyRate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          permissions: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_integrations',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          provider: { type: Sequelize.STRING(80), allowNull: false },
          status: {
            type: Sequelize.ENUM('connected', 'disconnected', 'error'),
            allowNull: false,
            defaultValue: 'connected',
          },
          connectedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_retrospectives',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          milestoneTitle: { type: Sequelize.STRING(180), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: false },
          sentiment: { type: Sequelize.STRING(40), allowNull: true },
          generatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          highlights: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_assets',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          label: { type: Sequelize.STRING(180), allowNull: false },
          category: { type: Sequelize.STRING(80), allowNull: false },
          storageUrl: { type: Sequelize.STRING(255), allowNull: false },
          thumbnailUrl: { type: Sequelize.STRING(255), allowNull: true },
          sizeBytes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          permissionLevel: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'internal' },
          watermarkEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          checksum: { type: Sequelize.STRING(120), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_templates',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          name: { type: Sequelize.STRING(180), allowNull: false },
          category: { type: Sequelize.STRING(80), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: true },
          durationWeeks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 4 },
          recommendedBudgetMin: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          recommendedBudgetMax: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          toolkit: { type: jsonType, allowNull: true },
          prompts: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_gig_orders',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          orderNumber: { type: Sequelize.STRING(32), allowNull: false, unique: true },
          vendorName: { type: Sequelize.STRING(180), allowNull: false },
          serviceName: { type: Sequelize.STRING(180), allowNull: false },
          status: {
            type: Sequelize.ENUM('requirements', 'in_delivery', 'in_revision', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'requirements',
          },
          progressPercent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          kickoffAt: { type: Sequelize.DATE, allowNull: true },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex('pgm_gig_orders', ['ownerId', 'status'], { name: 'pgm_gig_orders_owner_status_idx', transaction });

      await queryInterface.createTable(
        'pgm_gig_order_requirements',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          orderId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          status: {
            type: Sequelize.ENUM('pending', 'received', 'approved'),
            allowNull: false,
            defaultValue: 'pending',
          },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_gig_order_revisions',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          orderId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          roundNumber: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          status: {
            type: Sequelize.ENUM('requested', 'in_progress', 'submitted', 'approved'),
            allowNull: false,
            defaultValue: 'requested',
          },
          requestedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          submittedAt: { type: Sequelize.DATE, allowNull: true },
          approvedAt: { type: Sequelize.DATE, allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex('pgm_gig_order_revisions', ['orderId', 'roundNumber'], {
        name: 'pgm_gig_order_revisions_order_round_idx',
        transaction,
      });

      await queryInterface.createTable(
        'pgm_vendor_scorecards',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          orderId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          qualityScore: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          communicationScore: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          reliabilityScore: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          overallScore: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_story_blocks',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          outcome: { type: Sequelize.TEXT, allowNull: false },
          impact: { type: Sequelize.STRING(180), allowNull: true },
          metrics: { type: jsonType, allowNull: true },
          lastUsedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex('pgm_story_blocks', ['ownerId', 'updatedAt'], {
        name: 'pgm_story_blocks_owner_updated_idx',
        transaction,
      });

      await queryInterface.createTable(
        'pgm_brand_assets',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          assetType: { type: Sequelize.STRING(60), allowNull: false },
          visibility: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'private' },
          mediaUrl: { type: Sequelize.STRING(255), allowNull: false },
          watermarkEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex('pgm_brand_assets', ['ownerId', 'assetType'], {
        name: 'pgm_brand_assets_owner_type_idx',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dropOrder = [
        'pgm_brand_assets',
        'pgm_story_blocks',
        'pgm_vendor_scorecards',
        'pgm_gig_order_revisions',
        'pgm_gig_order_requirements',
        'pgm_gig_orders',
        'pgm_project_templates',
        'pgm_project_assets',
        'pgm_project_retrospectives',
        'pgm_project_integrations',
        'pgm_project_collaborators',
        'pgm_project_milestones',
        'pgm_project_workspaces',
        'pgm_projects',
      ];

      for (const table of dropOrder) {
        await queryInterface.dropTable(table, { transaction });
      }

      for (const enumType of ENUM_TYPES) {
        await dropEnumType(queryInterface, enumType, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
