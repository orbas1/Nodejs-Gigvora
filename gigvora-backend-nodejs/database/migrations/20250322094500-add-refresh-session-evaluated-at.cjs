import { DataTypes } from 'sequelize';

async function columnExists(queryInterface, tableName, columnName) {
  const description = await queryInterface.describeTable(tableName);
  return Object.prototype.hasOwnProperty.call(description, columnName);
}

/** @type {import('sequelize').QueryInterface} */
export async function up(queryInterface) {
  const hasColumn = await columnExists(queryInterface, 'user_refresh_sessions', 'evaluatedAt');
  if (!hasColumn) {
    await queryInterface.addColumn('user_refresh_sessions', 'evaluatedAt', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  await queryInterface.sequelize.query(
    'UPDATE user_refresh_sessions SET "evaluatedAt" = COALESCE("evaluatedAt", "updatedAt")',
  );
}

export async function down(queryInterface) {
  const hasColumn = await columnExists(queryInterface, 'user_refresh_sessions', 'evaluatedAt');
  if (hasColumn) {
    await queryInterface.removeColumn('user_refresh_sessions', 'evaluatedAt');
  }
}
