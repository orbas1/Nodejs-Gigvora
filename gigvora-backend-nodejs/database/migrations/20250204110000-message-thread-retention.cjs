import { DataTypes } from 'sequelize';

const THREAD_RETENTION_DEFAULTS = {
  support: { policy: 'support_3_year', days: 1_095 },
  project: { policy: 'project_2_year', days: 730 },
  contract: { policy: 'contract_7_year', days: 2_555 },
  group: { policy: 'standard_18_month', days: 548 },
  direct: { policy: 'standard_18_month', days: 548 },
};

const DEFAULT_POLICY = { policy: 'standard_18_month', days: 548 };

function resolveDefaults(channelType) {
  return THREAD_RETENTION_DEFAULTS[channelType] ?? DEFAULT_POLICY;
}

export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.addColumn(
      'message_threads',
      'retentionPolicy',
      {
        type: DataTypes.STRING(60),
        allowNull: false,
        defaultValue: DEFAULT_POLICY.policy,
      },
      { transaction },
    );

    await queryInterface.addColumn(
      'message_threads',
      'retentionDays',
      {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: DEFAULT_POLICY.days,
      },
      { transaction },
    );

    const [results] = await queryInterface.sequelize.query(
      'SELECT id, "channelType" FROM message_threads',
      { transaction },
    );

    await Promise.all(
      results.map(async (thread) => {
        const defaults = resolveDefaults(thread.channelType);
        await queryInterface.bulkUpdate(
          'message_threads',
          {
            retentionPolicy: defaults.policy,
            retentionDays: defaults.days,
          },
          { id: thread.id },
          { transaction },
        );
      }),
    );

    await queryInterface.addIndex(
      'message_threads',
      {
        fields: ['retentionPolicy'],
        name: 'message_threads_retentionPolicy_idx',
      },
      { transaction },
    );

    await queryInterface.addIndex(
      'message_threads',
      {
        fields: ['retentionDays'],
        name: 'message_threads_retentionDays_idx',
      },
      { transaction },
    );
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.removeIndex('message_threads', 'message_threads_retentionDays_idx', { transaction });
    await queryInterface.removeIndex('message_threads', 'message_threads_retentionPolicy_idx', { transaction });
    await queryInterface.removeColumn('message_threads', 'retentionDays', { transaction });
    await queryInterface.removeColumn('message_threads', 'retentionPolicy', { transaction });
  });
}

