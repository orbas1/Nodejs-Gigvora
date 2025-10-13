'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'project_workspaces',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'briefing' },
          healthScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          velocityScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          riskLevel: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'low' },
          progressPercent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          clientSatisfaction: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          automationCoverage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          billingStatus: { type: Sequelize.STRING(80), allowNull: true },
          nextMilestone: { type: Sequelize.STRING(255), allowNull: true },
          nextMilestoneDueAt: { type: Sequelize.DATE, allowNull: true },
          metricsSnapshot: { type: jsonType, allowNull: true },
          lastActivityAt: { type: Sequelize.DATE, allowNull: true },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'project_workspace_briefs',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'project_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: true },
          objectives: { type: jsonType, allowNull: true },
          deliverables: { type: jsonType, allowNull: true },
          successMetrics: { type: jsonType, allowNull: true },
          clientStakeholders: { type: jsonType, allowNull: true },
          lastUpdatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
          createdAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'project_workspace_whiteboards',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'project_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'active' },
          ownerName: { type: Sequelize.STRING(255), allowNull: true },
          thumbnailUrl: { type: Sequelize.STRING(500), allowNull: true },
          lastEditedAt: { type: Sequelize.DATE, allowNull: true },
          lastEditedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          activeCollaborators: { type: jsonType, allowNull: true },
          tags: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'project_workspace_whiteboards',
        ['workspaceId', 'status', 'updatedAt'],
        { name: 'workspace_whiteboards_workspace_status_idx', transaction },
      );

      await queryInterface.createTable(
        'project_workspace_files',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'project_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          category: { type: Sequelize.STRING(80), allowNull: true },
          fileType: { type: Sequelize.STRING(60), allowNull: true },
          storageProvider: { type: Sequelize.STRING(80), allowNull: true },
          storagePath: { type: Sequelize.STRING(500), allowNull: true },
          version: { type: Sequelize.STRING(40), allowNull: true },
          sizeBytes: { type: Sequelize.BIGINT, allowNull: true },
          checksum: { type: Sequelize.STRING(120), allowNull: true },
          tags: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          uploadedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          uploadedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'project_workspace_files',
        ['workspaceId', 'category', 'uploadedAt'],
        { name: 'workspace_files_workspace_category_idx', transaction },
      );

      await queryInterface.createTable(
        'project_workspace_conversations',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'project_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          channelType: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'project' },
          topic: { type: Sequelize.STRING(255), allowNull: false },
          priority: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'normal' },
          unreadCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          lastMessagePreview: { type: Sequelize.STRING(500), allowNull: true },
          lastMessageAt: { type: Sequelize.DATE, allowNull: true },
          lastReadAt: { type: Sequelize.DATE, allowNull: true },
          externalLink: { type: Sequelize.STRING(500), allowNull: true },
          participants: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'project_workspace_conversations',
        ['workspaceId', 'priority', 'updatedAt'],
        { name: 'workspace_conversations_workspace_priority_idx', transaction },
      );

      await queryInterface.createTable(
        'project_workspace_approvals',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'project_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          stage: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'discovery' },
          status: {
            type: Sequelize.ENUM('pending', 'in_review', 'approved', 'changes_requested', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
          },
          ownerName: { type: Sequelize.STRING(255), allowNull: true },
          approverEmail: { type: Sequelize.STRING(255), allowNull: true },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          submittedAt: { type: Sequelize.DATE, allowNull: true },
          decidedAt: { type: Sequelize.DATE, allowNull: true },
          decisionNotes: { type: Sequelize.TEXT, allowNull: true },
          attachments: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'project_workspace_approvals',
        ['workspaceId', 'status', 'dueAt'],
        { name: 'workspace_approvals_workspace_status_idx', transaction },
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
      await queryInterface.removeIndex('project_workspace_approvals', 'workspace_approvals_workspace_status_idx', { transaction });
      await queryInterface.removeIndex(
        'project_workspace_conversations',
        'workspace_conversations_workspace_priority_idx',
        { transaction },
      );
      await queryInterface.removeIndex('project_workspace_files', 'workspace_files_workspace_category_idx', { transaction });
      await queryInterface.removeIndex(
        'project_workspace_whiteboards',
        'workspace_whiteboards_workspace_status_idx',
        { transaction },
      );

      await queryInterface.dropTable('project_workspace_approvals', { transaction });
      await queryInterface.dropTable('project_workspace_conversations', { transaction });
      await queryInterface.dropTable('project_workspace_files', { transaction });
      await queryInterface.dropTable('project_workspace_whiteboards', { transaction });
      await queryInterface.dropTable('project_workspace_briefs', { transaction });
      await queryInterface.dropTable('project_workspaces', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_project_workspace_approvals_status"', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
