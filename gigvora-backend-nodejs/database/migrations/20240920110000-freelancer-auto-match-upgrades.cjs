'use strict';

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const timestampDefault = Sequelize.literal('CURRENT_TIMESTAMP');

      await queryInterface.createTable(
        'freelancer_auto_match_preferences',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          availabilityStatus: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'available' },
          availabilityMode: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'always_on' },
          timezone: { type: Sequelize.STRING(60), allowNull: true },
          dailyMatchLimit: { type: Sequelize.INTEGER, allowNull: true },
          autoAcceptThreshold: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          quietHoursStart: { type: Sequelize.STRING(5), allowNull: true },
          quietHoursEnd: { type: Sequelize.STRING(5), allowNull: true },
          snoozedUntil: { type: Sequelize.DATE, allowNull: true },
          receiveEmailNotifications: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          receiveInAppNotifications: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          escalationContact: { type: Sequelize.STRING(180), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addConstraint('freelancer_auto_match_preferences', {
        type: 'unique',
        fields: ['freelancerId'],
        name: 'freelancer_auto_match_preferences_freelancer_unique',
        transaction,
      });

      await queryInterface.createTable(
        'auto_assign_responses',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          queueEntryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'auto_assign_queue_entries', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('accepted', 'declined', 'reassigned'),
            allowNull: false,
          },
          respondedBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          respondedAt: { type: Sequelize.DATE, allowNull: false },
          reasonCode: { type: Sequelize.STRING(64), allowNull: true },
          reasonLabel: { type: Sequelize.STRING(180), allowNull: true },
          responseNotes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'auto_assign_queue_entries',
        'responseMetadata',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addIndex('auto_assign_responses', ['freelancerId', 'status', 'respondedAt'], {
        name: 'auto_assign_responses_freelancer_status_idx',
        transaction,
      });

      await queryInterface.addIndex('auto_assign_responses', ['queueEntryId'], {
        name: 'auto_assign_responses_queue_idx',
        unique: true,
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('auto_assign_queue_entries', 'responseMetadata', { transaction });
      await queryInterface.removeIndex('auto_assign_responses', 'auto_assign_responses_queue_idx', { transaction });
      await queryInterface.removeIndex('auto_assign_responses', 'auto_assign_responses_freelancer_status_idx', {
        transaction,
      });
      await queryInterface.dropTable('auto_assign_responses', { transaction });
      await queryInterface.removeConstraint(
        'freelancer_auto_match_preferences',
        'freelancer_auto_match_preferences_freelancer_unique',
        { transaction },
      );
      await queryInterface.dropTable('freelancer_auto_match_preferences', { transaction });

      if (['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_auto_assign_responses_status"', {
          transaction,
        });
      }
    });
  },
};
