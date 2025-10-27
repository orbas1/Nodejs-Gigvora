'use strict';

const CARD_TABLE = 'pgm_client_kanban_cards';
const CHECKLIST_TABLE = 'pgm_client_kanban_checklist_items';
const COLLABORATOR_TABLE = 'pgm_client_kanban_collaborators';
const WORKSPACE_TABLE = 'pgm_project_workspaces';
const CARD_HEALTH_ENUM = 'enum_pgm_client_kanban_cards_healthStatus';
const CARD_HEALTH_VALUES = ['healthy', 'monitor', 'at_risk'];

async function describeTable(queryInterface, tableName) {
  try {
    return await queryInterface.describeTable(tableName);
  } catch (error) {
    if (error && error.name === 'SequelizeDatabaseError') {
      return null;
    }
    throw error;
  }
}

async function ensureEnum(queryInterface, enumName, values, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  if (['postgres', 'postgresql'].includes(dialect)) {
    const existing = await queryInterface
      .sequelize
      .query('SELECT 1 FROM pg_type WHERE typname = :enumName', {
        type: queryInterface.sequelize.QueryTypes.SELECT,
        replacements: { enumName },
        transaction,
      });
    if (!existing.length) {
      const valueList = values.map((value) => `'${value}'`).join(', ');
      await queryInterface.sequelize.query(`CREATE TYPE "${enumName}" AS ENUM (${valueList});`, { transaction });
    }
    return;
  }

  // Other dialects create enum definitions as part of addColumn automatically.
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await ensureEnum(queryInterface, CARD_HEALTH_ENUM, CARD_HEALTH_VALUES, transaction);

      const cardColumns = (await describeTable(queryInterface, CARD_TABLE)) ?? {};

      const ensureCardColumn = async (column, definition) => {
        if (!cardColumns[column]) {
          await queryInterface.addColumn(CARD_TABLE, column, definition, { transaction });
          cardColumns[column] = true;
        }
      };

      if (cardColumns.value && !cardColumns.value_amount) {
        await queryInterface.renameColumn(CARD_TABLE, 'value', 'value_amount', { transaction });
        cardColumns.value_amount = cardColumns.value;
        delete cardColumns.value;
      }

      await ensureCardColumn('workspace_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: WORKSPACE_TABLE, key: 'id' },
        onDelete: 'SET NULL',
      });
      await ensureCardColumn('project_name', { type: Sequelize.STRING(180), allowNull: true });
      await ensureCardColumn('value_currency', { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' });
      await ensureCardColumn('value_amount', { type: Sequelize.DECIMAL(12, 2), allowNull: true });
      await ensureCardColumn('potential_monthly_value', { type: Sequelize.DECIMAL(12, 2), allowNull: true });
      await ensureCardColumn('contact_name', { type: Sequelize.STRING(180), allowNull: true });
      await ensureCardColumn('contact_email', { type: Sequelize.STRING(180), allowNull: true });
      await ensureCardColumn('owner_name', { type: Sequelize.STRING(180), allowNull: true });
      await ensureCardColumn('owner_email', { type: Sequelize.STRING(180), allowNull: true });
      await ensureCardColumn('owner_role', { type: Sequelize.STRING(120), allowNull: true });
      await ensureCardColumn('health_status', {
        type: Sequelize.ENUM(...CARD_HEALTH_VALUES),
        allowNull: false,
        defaultValue: 'healthy',
      });
      await ensureCardColumn('start_date', { type: Sequelize.DATE, allowNull: true });
      await ensureCardColumn('due_date', { type: Sequelize.DATE, allowNull: true });
      await ensureCardColumn('last_interaction_at', { type: Sequelize.DATE, allowNull: true });
      await ensureCardColumn('next_interaction_at', { type: Sequelize.DATE, allowNull: true });
      await ensureCardColumn('tags', { type: jsonType, allowNull: true });
      await ensureCardColumn('checklist_summary', { type: jsonType, allowNull: true });
      await ensureCardColumn('attachments', { type: jsonType, allowNull: true });
      await ensureCardColumn('sort_order', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
      await ensureCardColumn('archived_at', { type: Sequelize.DATE, allowNull: true });
      await ensureCardColumn('created_by_id', { type: Sequelize.INTEGER, allowNull: true });
      await ensureCardColumn('updated_by_id', { type: Sequelize.INTEGER, allowNull: true });
      await ensureCardColumn('notes', { type: Sequelize.TEXT, allowNull: true });

      const checklistColumns = (await describeTable(queryInterface, CHECKLIST_TABLE)) ?? {};
      const ensureChecklistColumn = async (column, definition) => {
        if (!checklistColumns[column]) {
          await queryInterface.addColumn(CHECKLIST_TABLE, column, definition, { transaction });
          checklistColumns[column] = true;
        }
      };

      if (checklistColumns.label && !checklistColumns.title) {
        await queryInterface.renameColumn(CHECKLIST_TABLE, 'label', 'title', { transaction });
        checklistColumns.title = checklistColumns.label;
        delete checklistColumns.label;
      }

      await ensureChecklistColumn('owner_id', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
      await ensureChecklistColumn('workspace_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: WORKSPACE_TABLE, key: 'id' },
        onDelete: 'SET NULL',
      });
      await ensureChecklistColumn('sort_order', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
      await ensureChecklistColumn('due_date', { type: Sequelize.DATE, allowNull: true });

      const collaboratorTable = await describeTable(queryInterface, COLLABORATOR_TABLE);
      if (!collaboratorTable) {
        await queryInterface.createTable(
          COLLABORATOR_TABLE,
          {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            card_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: CARD_TABLE, key: 'id' },
              onDelete: 'CASCADE',
            },
            owner_id: { type: Sequelize.INTEGER, allowNull: false },
            workspace_id: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: WORKSPACE_TABLE, key: 'id' },
              onDelete: 'SET NULL',
            },
            name: { type: Sequelize.STRING(180), allowNull: false },
            email: { type: Sequelize.STRING(180), allowNull: true },
            role: { type: Sequelize.STRING(120), allowNull: true },
            avatar_url: { type: Sequelize.STRING(255), allowNull: true },
            last_activity_at: { type: Sequelize.DATE, allowNull: true },
            metadata: { type: jsonType, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          },
          { transaction },
        );

        await queryInterface.addIndex(COLLABORATOR_TABLE, ['card_id'], { transaction });
        await queryInterface.addIndex(COLLABORATOR_TABLE, ['owner_id'], { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const cardColumns = (await describeTable(queryInterface, CARD_TABLE)) ?? {};
      const checklistColumns = (await describeTable(queryInterface, CHECKLIST_TABLE)) ?? {};

      const removeCardColumn = async (column) => {
        if (cardColumns[column]) {
          await queryInterface.removeColumn(CARD_TABLE, column, { transaction });
        }
      };

      const removeChecklistColumn = async (column) => {
        if (checklistColumns[column]) {
          await queryInterface.removeColumn(CHECKLIST_TABLE, column, { transaction });
        }
      };

      if (cardColumns.value_amount && !cardColumns.value) {
        await queryInterface.renameColumn(CARD_TABLE, 'value_amount', 'value', { transaction });
        delete cardColumns.value_amount;
        cardColumns.value = true;
      }

      await removeCardColumn('workspace_id');
      await removeCardColumn('project_name');
      await removeCardColumn('value_currency');
      await removeCardColumn('potential_monthly_value');
      await removeCardColumn('contact_name');
      await removeCardColumn('contact_email');
      await removeCardColumn('owner_name');
      await removeCardColumn('owner_email');
      await removeCardColumn('owner_role');
      await removeCardColumn('health_status');
      await removeCardColumn('start_date');
      await removeCardColumn('due_date');
      await removeCardColumn('last_interaction_at');
      await removeCardColumn('next_interaction_at');
      await removeCardColumn('tags');
      await removeCardColumn('checklist_summary');
      await removeCardColumn('attachments');
      await removeCardColumn('sort_order');
      await removeCardColumn('archived_at');
      await removeCardColumn('created_by_id');
      await removeCardColumn('updated_by_id');
      await removeCardColumn('notes');

      if (checklistColumns.title && !checklistColumns.label) {
        await queryInterface.renameColumn(CHECKLIST_TABLE, 'title', 'label', { transaction });
      }

      await removeChecklistColumn('owner_id');
      await removeChecklistColumn('workspace_id');
      await removeChecklistColumn('sort_order');
      await removeChecklistColumn('due_date');

      const collaboratorTable = await describeTable(queryInterface, COLLABORATOR_TABLE);
      if (collaboratorTable) {
        await queryInterface.dropTable(COLLABORATOR_TABLE, { transaction });
      }

      const dialect = queryInterface.sequelize.getDialect();
      if (['postgres', 'postgresql'].includes(dialect)) {
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${CARD_HEALTH_ENUM}";`, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
