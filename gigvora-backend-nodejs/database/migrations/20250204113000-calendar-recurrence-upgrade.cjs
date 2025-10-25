import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.addColumn(
      'candidate_calendar_events',
      'recurrenceRule',
      { type: DataTypes.STRING(255), allowNull: true },
      { transaction },
    );
    await queryInterface.addColumn(
      'candidate_calendar_events',
      'recurrenceUntil',
      { type: DataTypes.DATE, allowNull: true },
      { transaction },
    );
    await queryInterface.addColumn(
      'candidate_calendar_events',
      'recurrenceCount',
      { type: DataTypes.INTEGER, allowNull: true },
      { transaction },
    );
    await queryInterface.addColumn(
      'candidate_calendar_events',
      'parentEventId',
      { type: DataTypes.INTEGER, allowNull: true },
      { transaction },
    );

    await queryInterface.addIndex(
      'candidate_calendar_events',
      { fields: ['recurrenceRule'] },
      { transaction },
    );
    await queryInterface.addIndex(
      'candidate_calendar_events',
      { fields: ['parentEventId'] },
      { transaction },
    );
  });
}

export async function down(queryInterface) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.removeIndex('candidate_calendar_events', ['parentEventId'], { transaction });
    await queryInterface.removeIndex('candidate_calendar_events', ['recurrenceRule'], { transaction });
    await queryInterface.removeColumn('candidate_calendar_events', 'parentEventId', { transaction });
    await queryInterface.removeColumn('candidate_calendar_events', 'recurrenceCount', { transaction });
    await queryInterface.removeColumn('candidate_calendar_events', 'recurrenceUntil', { transaction });
    await queryInterface.removeColumn('candidate_calendar_events', 'recurrenceRule', { transaction });
  });
}

