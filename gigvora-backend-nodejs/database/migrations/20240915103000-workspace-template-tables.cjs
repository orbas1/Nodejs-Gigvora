'use strict';

const { resolveJsonType, dropEnum, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

const CATEGORY_TABLE = 'workspace_template_categories';
const TEMPLATE_TABLE = 'workspace_templates';
const STAGE_TABLE = 'workspace_template_stages';
const RESOURCE_TABLE = 'workspace_template_resources';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      await queryInterface.createTable(
        CATEGORY_TABLE,
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          slug: {
            type: Sequelize.STRING(120),
            allowNull: false,
            unique: true,
          },
          name: {
            type: Sequelize.STRING(180),
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          icon: {
            type: Sequelize.STRING(120),
            allowNull: true,
          },
          sortOrder: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
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

      await queryInterface.createTable(
        TEMPLATE_TABLE,
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          categoryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: CATEGORY_TABLE, key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          slug: {
            type: Sequelize.STRING(150),
            allowNull: false,
            unique: true,
          },
          name: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          tagline: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          industry: {
            type: Sequelize.STRING(120),
            allowNull: true,
          },
          workflowType: {
            type: Sequelize.STRING(120),
            allowNull: true,
          },
          recommendedTeamSize: {
            type: Sequelize.STRING(60),
            allowNull: true,
          },
          estimatedDurationDays: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          automationLevel: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          qualityScore: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: true,
          },
          status: {
            type: Sequelize.ENUM('draft', 'active', 'deprecated'),
            allowNull: false,
            defaultValue: 'active',
          },
          visibility: {
            type: Sequelize.ENUM('public', 'private'),
            allowNull: false,
            defaultValue: 'public',
          },
          clientExperience: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          requirementChecklist: {
            type: jsonType,
            allowNull: true,
          },
          onboardingSequence: {
            type: jsonType,
            allowNull: true,
          },
          deliverables: {
            type: jsonType,
            allowNull: true,
          },
          metrics: {
            type: jsonType,
            allowNull: true,
          },
          metadata: {
            type: jsonType,
            allowNull: true,
          },
          lastPublishedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          archivedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
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

      await queryInterface.createTable(
        STAGE_TABLE,
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          templateId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TEMPLATE_TABLE, key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          slug: {
            type: Sequelize.STRING(150),
            allowNull: false,
          },
          title: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          stageType: {
            type: Sequelize.ENUM('intake', 'strategy', 'production', 'delivery', 'retainer', 'quality', 'retro'),
            allowNull: false,
            defaultValue: 'production',
          },
          sortOrder: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          checklists: {
            type: jsonType,
            allowNull: true,
          },
          questionnaires: {
            type: jsonType,
            allowNull: true,
          },
          automations: {
            type: jsonType,
            allowNull: true,
          },
          deliverables: {
            type: jsonType,
            allowNull: true,
          },
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

      await queryInterface.createTable(
        RESOURCE_TABLE,
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          templateId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TEMPLATE_TABLE, key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          resourceType: {
            type: Sequelize.ENUM('sop', 'checklist', 'questionnaire', 'automation', 'asset', 'video', 'integration'),
            allowNull: false,
            defaultValue: 'asset',
          },
          url: {
            type: Sequelize.STRING(500),
            allowNull: true,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          metadata: {
            type: jsonType,
            allowNull: true,
          },
          sortOrder: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
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

      await queryInterface.addIndex(CATEGORY_TABLE, ['sortOrder'], { transaction });
      await queryInterface.addIndex(TEMPLATE_TABLE, ['categoryId', 'status'], { transaction });
      await queryInterface.addIndex(TEMPLATE_TABLE, ['slug'], { unique: true, transaction });
      await queryInterface.addIndex(TEMPLATE_TABLE, ['industry'], { transaction });
      await queryInterface.addIndex(STAGE_TABLE, ['templateId', 'sortOrder'], { transaction });
      await queryInterface.addIndex(RESOURCE_TABLE, ['templateId', 'resourceType'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await safeRemoveIndex(queryInterface, RESOURCE_TABLE, ['templateId', 'resourceType'], { transaction });
      await safeRemoveIndex(queryInterface, STAGE_TABLE, ['templateId', 'sortOrder'], { transaction });
      await safeRemoveIndex(queryInterface, TEMPLATE_TABLE, ['industry'], { transaction });
      await safeRemoveIndex(queryInterface, TEMPLATE_TABLE, ['slug'], { transaction });
      await safeRemoveIndex(queryInterface, TEMPLATE_TABLE, ['categoryId', 'status'], { transaction });
      await safeRemoveIndex(queryInterface, CATEGORY_TABLE, ['sortOrder'], { transaction });

      await queryInterface.dropTable(RESOURCE_TABLE, { transaction });
      await queryInterface.dropTable(STAGE_TABLE, { transaction });
      await queryInterface.dropTable(TEMPLATE_TABLE, { transaction });
      await queryInterface.dropTable(CATEGORY_TABLE, { transaction });

      const enumNames = [
        'enum_workspace_templates_status',
        'enum_workspace_templates_visibility',
        'enum_workspace_template_stages_stageType',
        'enum_workspace_template_resources_resourceType',
      ];

      await Promise.all(enumNames.map((enumName) => dropEnum(queryInterface, enumName, transaction)));
    });
  },
};
