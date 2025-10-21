'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const { INTEGER, STRING, TEXT, BOOLEAN, DATE, JSONB, JSON } = Sequelize;
      const isPostgres = queryInterface.sequelize.getDialect().startsWith('postgres');
      const jsonType = isPostgres ? JSONB : JSON;

      await queryInterface.createTable(
        'saved_replies',
        {
          id: { type: INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
          userId: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: STRING(160), allowNull: false },
          body: { type: TEXT, allowNull: false },
          category: { type: STRING(80), allowNull: true },
          shortcut: { type: STRING(40), allowNull: true },
          isDefault: { type: BOOLEAN, allowNull: false, defaultValue: false },
          metadata: { type: jsonType, allowNull: true },
          orderIndex: { type: INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: {
            type: DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('saved_replies', ['userId'], {
        name: 'saved_replies_user_idx',
        transaction,
      });
      await queryInterface.addIndex('saved_replies', ['userId', 'shortcut'], {
        unique: true,
        name: 'saved_replies_user_shortcut_unique',
        transaction,
      });
      await queryInterface.addIndex('saved_replies', ['userId', 'isDefault'], {
        name: 'saved_replies_user_default_idx',
        transaction,
      });

      await queryInterface.createTable(
        'inbox_preferences',
        {
          id: { type: INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
          userId: {
            type: INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          timezone: { type: STRING(80), allowNull: false, defaultValue: 'UTC' },
          workingHours: { type: jsonType, allowNull: true },
          notificationsEmail: { type: BOOLEAN, allowNull: false, defaultValue: true },
          notificationsPush: { type: BOOLEAN, allowNull: false, defaultValue: true },
          autoArchiveAfterDays: { type: INTEGER, allowNull: true },
          autoResponderEnabled: { type: BOOLEAN, allowNull: false, defaultValue: false },
          autoResponderMessage: { type: TEXT, allowNull: true },
          escalationKeywords: { type: jsonType, allowNull: true },
          defaultSavedReplyId: { type: INTEGER, allowNull: true },
          createdAt: {
            type: DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'inbox_routing_rules',
        {
          id: { type: INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
          userId: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          name: { type: STRING(160), allowNull: false },
          description: { type: TEXT, allowNull: true },
          matchType: { type: STRING(40), allowNull: false, defaultValue: 'keyword' },
          criteria: { type: jsonType, allowNull: true },
          action: { type: jsonType, allowNull: true },
          enabled: { type: BOOLEAN, allowNull: false, defaultValue: true },
          stopProcessing: { type: BOOLEAN, allowNull: false, defaultValue: false },
          priority: { type: INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: {
            type: DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('inbox_routing_rules', ['userId'], {
        name: 'inbox_routing_rules_user_idx',
        transaction,
      });
      await queryInterface.addIndex('inbox_routing_rules', ['userId', 'enabled'], {
        name: 'inbox_routing_rules_enabled_idx',
        transaction,
      });
      await queryInterface.addIndex('inbox_routing_rules', ['userId', 'priority'], {
        name: 'inbox_routing_rules_priority_idx',
        transaction,
      });

      await queryInterface.addConstraint(
        'inbox_preferences',
        {
          fields: ['defaultSavedReplyId'],
          type: 'foreign key',
          name: 'inbox_preferences_default_saved_reply_fk',
          references: {
            table: 'saved_replies',
            field: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          transaction,
        },
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
      const safeRemoveConstraint = async (table, constraint) => {
        try {
          await queryInterface.removeConstraint(table, constraint, { transaction });
        } catch (error) {
          if (!/does not exist/i.test(error.message)) {
            throw error;
          }
        }
      };

      await safeRemoveConstraint('inbox_preferences', 'inbox_preferences_default_saved_reply_fk');
      await queryInterface.dropTable('inbox_routing_rules', { transaction });
      await queryInterface.dropTable('inbox_preferences', { transaction });
      await queryInterface.dropTable('saved_replies', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
