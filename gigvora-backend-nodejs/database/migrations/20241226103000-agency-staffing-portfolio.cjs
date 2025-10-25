'use strict';

const PROJECT_TABLE = 'pgm_projects';
const AUTOMATCH_TABLE = 'pgm_project_automatch_freelancers';
const LIFECYCLE_ENUM = 'enum_pgm_projects_lifecycle_state';
const FREELANCER_STATUS_ENUM = 'enum_pgm_project_automatch_freelancers_status';

const withDescribe = async (queryInterface, tableName, transaction) => {
  try {
    return await queryInterface.describeTable(tableName, { transaction });
  } catch (error) {
    if (error && (error.message?.includes('does not exist') || error.message?.includes('Unknown table'))) {
      return null;
    }
    throw error;
  }
};

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

      const projectTable = await withDescribe(queryInterface, PROJECT_TABLE, transaction);

      const ensureColumn = async (columnName, definition) => {
        if (!projectTable || !projectTable[columnName]) {
          await queryInterface.addColumn(PROJECT_TABLE, columnName, definition, { transaction });
        }
      };

      if (!projectTable) {
        await queryInterface.createTable(
          PROJECT_TABLE,
          {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            owner_id: { type: Sequelize.INTEGER, allowNull: false },
            title: { type: Sequelize.STRING(180), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: false },
            category: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'General' },
            skills: { type: jsonType, allowNull: false, defaultValue: [] },
            duration_weeks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 4 },
            status: {
              type: Sequelize.ENUM('planning', 'in_progress', 'at_risk', 'completed', 'on_hold'),
              allowNull: false,
              defaultValue: 'planning',
            },
            lifecycle_state: { type: Sequelize.ENUM('open', 'closed'), allowNull: false, defaultValue: 'open' },
            start_date: { type: Sequelize.DATE, allowNull: true },
            due_date: { type: Sequelize.DATE, allowNull: true },
            budget_currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
            budget_allocated: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
            budget_spent: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
            auto_match_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            auto_match_accept_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            auto_match_reject_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            auto_match_budget_min: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
            auto_match_budget_max: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
            auto_match_weekly_hours_min: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
            auto_match_weekly_hours_max: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
            auto_match_duration_weeks_min: { type: Sequelize.INTEGER, allowNull: true },
            auto_match_duration_weeks_max: { type: Sequelize.INTEGER, allowNull: true },
            auto_match_skills: { type: jsonType, allowNull: true },
            auto_match_notes: { type: Sequelize.TEXT, allowNull: true },
            auto_match_updated_by: { type: Sequelize.INTEGER, allowNull: true },
            archived_at: { type: Sequelize.DATE, allowNull: true },
            metadata: { type: jsonType, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          },
          { transaction },
        );
      } else {
        await ensureColumn('category', { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'General' });
        await ensureColumn('skills', { type: jsonType, allowNull: false, defaultValue: [] });
        await ensureColumn('duration_weeks', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 4 });
        await ensureColumn('lifecycle_state', {
          type: Sequelize.ENUM('open', 'closed'),
          allowNull: false,
          defaultValue: 'open',
        });
        await ensureColumn('auto_match_enabled', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
        await ensureColumn('auto_match_accept_enabled', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
        await ensureColumn('auto_match_reject_enabled', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
        await ensureColumn('auto_match_budget_min', { type: Sequelize.DECIMAL(12, 2), allowNull: true });
        await ensureColumn('auto_match_budget_max', { type: Sequelize.DECIMAL(12, 2), allowNull: true });
        await ensureColumn('auto_match_weekly_hours_min', { type: Sequelize.DECIMAL(6, 2), allowNull: true });
        await ensureColumn('auto_match_weekly_hours_max', { type: Sequelize.DECIMAL(6, 2), allowNull: true });
        await ensureColumn('auto_match_duration_weeks_min', { type: Sequelize.INTEGER, allowNull: true });
        await ensureColumn('auto_match_duration_weeks_max', { type: Sequelize.INTEGER, allowNull: true });
        await ensureColumn('auto_match_skills', { type: jsonType, allowNull: true });
        await ensureColumn('auto_match_notes', { type: Sequelize.TEXT, allowNull: true });
        await ensureColumn('auto_match_updated_by', { type: Sequelize.INTEGER, allowNull: true });
      }

      await queryInterface.addIndex(PROJECT_TABLE, ['owner_id', 'lifecycle_state'], {
        name: 'pgm_projects_owner_lifecycle_idx',
        transaction,
      }).catch(() => {});
      await queryInterface.addIndex(PROJECT_TABLE, ['auto_match_enabled'], {
        name: 'pgm_projects_auto_match_enabled_idx',
        transaction,
      }).catch(() => {});

      const autoMatchTable = await withDescribe(queryInterface, AUTOMATCH_TABLE, transaction);
      if (!autoMatchTable) {
        await queryInterface.createTable(
          AUTOMATCH_TABLE,
          {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            project_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: PROJECT_TABLE, key: 'id' },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE',
            },
            freelancer_id: { type: Sequelize.INTEGER, allowNull: false },
            freelancer_name: { type: Sequelize.STRING(180), allowNull: false },
            freelancer_role: { type: Sequelize.STRING(120), allowNull: true },
            score: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
            auto_match_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            status: { type: Sequelize.ENUM('pending', 'accepted', 'rejected'), allowNull: false, defaultValue: 'pending' },
            notes: { type: Sequelize.TEXT, allowNull: true },
            metadata: { type: jsonType, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          },
          { transaction },
        );
      }

      await queryInterface.addConstraint(AUTOMATCH_TABLE, {
        type: 'unique',
        name: 'pgm_project_automatch_freelancers_unique_project_freelancer',
        fields: ['project_id', 'freelancer_id'],
        transaction,
      }).catch(() => {});
      await queryInterface.addIndex(AUTOMATCH_TABLE, ['status'], {
        name: 'pgm_project_automatch_freelancers_status_idx',
        transaction,
      }).catch(() => {});
      await queryInterface.addIndex(AUTOMATCH_TABLE, ['auto_match_enabled'], {
        name: 'pgm_project_automatch_freelancers_enabled_idx',
        transaction,
      }).catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex(PROJECT_TABLE, 'pgm_projects_owner_lifecycle_idx', { transaction }).catch(() => {});
      await queryInterface.removeIndex(PROJECT_TABLE, 'pgm_projects_auto_match_enabled_idx', {
        transaction,
      }).catch(() => {});

      const projectTable = await withDescribe(queryInterface, PROJECT_TABLE, transaction);
      const dropColumn = async (columnName) => {
        if (projectTable && projectTable[columnName]) {
          await queryInterface.removeColumn(PROJECT_TABLE, columnName, { transaction });
        }
      };

      await dropColumn('auto_match_updated_by');
      await dropColumn('auto_match_notes');
      await dropColumn('auto_match_skills');
      await dropColumn('auto_match_duration_weeks_max');
      await dropColumn('auto_match_duration_weeks_min');
      await dropColumn('auto_match_weekly_hours_max');
      await dropColumn('auto_match_weekly_hours_min');
      await dropColumn('auto_match_budget_max');
      await dropColumn('auto_match_budget_min');
      await dropColumn('auto_match_reject_enabled');
      await dropColumn('auto_match_accept_enabled');
      await dropColumn('auto_match_enabled');
      await dropColumn('lifecycle_state');
      await dropColumn('duration_weeks');
      await dropColumn('skills');
      await dropColumn('category');

      const autoMatchTable = await withDescribe(queryInterface, AUTOMATCH_TABLE, transaction);
      if (autoMatchTable) {
        await queryInterface.dropTable(AUTOMATCH_TABLE, { transaction });
      }

      await dropEnumType(queryInterface, FREELANCER_STATUS_ENUM, transaction);
      await dropEnumType(queryInterface, LIFECYCLE_ENUM, transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
