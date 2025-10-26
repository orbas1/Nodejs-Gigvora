'use strict';

const TABLE = 'networking_session_signups';

const addIndexSafely = (queryInterface, table, fields, options = {}) =>
  queryInterface.addIndex(table, fields, options).catch((error) => {
    if (!/already exists/i.test(error.message)) {
      throw error;
    }
  });

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
      const schema = await queryInterface.describeTable(TABLE).catch(() => ({}));

      const addColumnIfMissing = async (column, definition) => {
        if (!schema[column]) {
          await queryInterface.addColumn(TABLE, column, definition, { transaction });
        }
      };

      await addColumnIfMissing('profileSharedCount', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });

      await addColumnIfMissing('connectionsSaved', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });

      await addColumnIfMissing('messagesSent', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });

      await addColumnIfMissing('followUpsScheduled', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });

      await addColumnIfMissing('satisfactionScore', {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: true,
      });

      await addColumnIfMissing('feedbackNotes', {
        type: Sequelize.TEXT,
        allowNull: true,
      });

      await addColumnIfMissing('businessCardId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'networking_business_cards', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });

      await addColumnIfMissing('businessCardSnapshot', {
        type: jsonType,
        allowNull: true,
      });

      await addColumnIfMissing('profileSnapshot', {
        type: jsonType,
        allowNull: true,
      });

      await addColumnIfMissing('metadata', {
        type: jsonType,
        allowNull: true,
      });

      await addIndexSafely(queryInterface, TABLE, ['status'], {
        name: 'networking_session_signups_status_idx',
        transaction,
      });
      await addIndexSafely(queryInterface, TABLE, ['sessionId'], {
        name: 'networking_session_signups_session_idx',
        transaction,
      });
      await addIndexSafely(queryInterface, TABLE, ['participantId'], {
        name: 'networking_session_signups_participant_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const schema = await queryInterface.describeTable(TABLE).catch(() => ({}));
      const removeColumnIfPresent = async (column) => {
        if (schema[column]) {
          await queryInterface.removeColumn(TABLE, column, { transaction });
        }
      };

      await removeColumnIfPresent('metadata');
      await removeColumnIfPresent('profileSnapshot');
      await removeColumnIfPresent('businessCardSnapshot');
      await removeColumnIfPresent('businessCardId');
      await removeColumnIfPresent('feedbackNotes');
      await removeColumnIfPresent('satisfactionScore');
      await removeColumnIfPresent('followUpsScheduled');
      await removeColumnIfPresent('messagesSent');
      await removeColumnIfPresent('connectionsSaved');
      await removeColumnIfPresent('profileSharedCount');

      await queryInterface.removeIndex(TABLE, 'networking_session_signups_participant_idx', { transaction }).catch(() => {});
      await queryInterface.removeIndex(TABLE, 'networking_session_signups_session_idx', { transaction }).catch(() => {});
      await queryInterface.removeIndex(TABLE, 'networking_session_signups_status_idx', { transaction }).catch(() => {});
    });
  },
};
