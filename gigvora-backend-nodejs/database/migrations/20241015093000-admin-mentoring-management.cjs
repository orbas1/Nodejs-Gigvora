'use strict';

const MENTORING_TABLE = 'peer_mentoring_sessions';
const NOTES_TABLE = 'mentoring_session_notes';
const ACTIONS_TABLE = 'mentoring_session_action_items';

const NOTE_VISIBILITIES = ['internal', 'mentor', 'mentee', 'public'];
const ACTION_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
const ACTION_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      const addColumn = (column, definition) =>
        queryInterface.addColumn(MENTORING_TABLE, column, definition, { transaction });

      await addColumn('adminOwnerId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      });

      await addColumn('followUpAt', { type: Sequelize.DATE, allowNull: true });
      await addColumn('feedbackRating', { type: Sequelize.DECIMAL(4, 2), allowNull: true });
      await addColumn('feedbackSummary', { type: Sequelize.TEXT, allowNull: true });
      await addColumn('cancellationReason', { type: Sequelize.TEXT, allowNull: true });
      await addColumn('meetingProvider', { type: Sequelize.STRING(120), allowNull: true });
      await addColumn('resourceLinks', { type: jsonType, allowNull: true });

      await queryInterface.createTable(
        NOTES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          sessionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: MENTORING_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          authorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          visibility: {
            type: Sequelize.ENUM(...NOTE_VISIBILITIES),
            allowNull: false,
            defaultValue: 'internal',
          },
          body: { type: Sequelize.TEXT, allowNull: false },
          attachments: { type: jsonType, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.createTable(
        ACTIONS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          sessionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: MENTORING_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM(...ACTION_STATUSES),
            allowNull: false,
            defaultValue: 'pending',
          },
          priority: {
            type: Sequelize.ENUM(...ACTION_PRIORITIES),
            allowNull: false,
            defaultValue: 'normal',
          },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          assigneeId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          completedAt: { type: Sequelize.DATE, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(NOTES_TABLE, ['sessionId', 'visibility'], { transaction });
      await queryInterface.addIndex(NOTES_TABLE, ['authorId'], { transaction });
      await queryInterface.addIndex(ACTIONS_TABLE, ['sessionId', 'status'], { transaction });
      await queryInterface.addIndex(ACTIONS_TABLE, ['assigneeId', 'status'], { transaction });
      await queryInterface.addIndex(ACTIONS_TABLE, ['dueAt'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dropIndex = async (table, fields) => {
        try {
          await queryInterface.removeIndex(table, fields, { transaction });
        } catch (error) {
          // ignore
        }
      };

      await dropIndex(ACTIONS_TABLE, ['dueAt']);
      await dropIndex(ACTIONS_TABLE, ['assigneeId', 'status']);
      await dropIndex(ACTIONS_TABLE, ['sessionId', 'status']);
      await dropIndex(NOTES_TABLE, ['authorId']);
      await dropIndex(NOTES_TABLE, ['sessionId', 'visibility']);

      await queryInterface.dropTable(ACTIONS_TABLE, { transaction });
      await queryInterface.dropTable(NOTES_TABLE, { transaction });

      const removeColumn = (column) =>
        queryInterface.removeColumn(MENTORING_TABLE, column, { transaction }).catch(() => {});

      await removeColumn('resourceLinks');
      await removeColumn('meetingProvider');
      await removeColumn('cancellationReason');
      await removeColumn('feedbackSummary');
      await removeColumn('feedbackRating');
      await removeColumn('followUpAt');
      await removeColumn('adminOwnerId');

      const dropEnum = async (enumName) => {
        const dialect = queryInterface.sequelize.getDialect();
        if (dialect === 'postgres' || dialect === 'postgresql') {
          await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
        }
      };

      await dropEnum('enum_mentoring_session_notes_visibility');
      await dropEnum('enum_mentoring_session_action_items_status');
      await dropEnum('enum_mentoring_session_action_items_priority');
    });
  },
};
