import { DataTypes, Sequelize } from 'sequelize';

function resolveJsonType(queryInterface) {
  const dialect = queryInterface.sequelize?.getDialect?.() ?? 'postgres';
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

/** @type {import('sequelize').QueryInterface} */
export async function up(queryInterface) {
  const jsonType = resolveJsonType(queryInterface);

  await queryInterface.addColumn('user_refresh_sessions', 'deviceFingerprint', {
    type: DataTypes.STRING(128),
    allowNull: true,
  });

  await queryInterface.addColumn('user_refresh_sessions', 'deviceLabel', {
    type: DataTypes.STRING(180),
    allowNull: true,
  });

  await queryInterface.addColumn('user_refresh_sessions', 'riskLevel', {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'low',
  });

  await queryInterface.addColumn('user_refresh_sessions', 'riskScore', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await queryInterface.addColumn('user_refresh_sessions', 'riskSignals', {
    type: jsonType,
    allowNull: true,
  });

  await queryInterface.addIndex('user_refresh_sessions', ['deviceFingerprint'], {
    name: 'user_refresh_sessions_device_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('user_refresh_sessions', 'user_refresh_sessions_device_idx');
  await queryInterface.removeColumn('user_refresh_sessions', 'riskSignals');
  await queryInterface.removeColumn('user_refresh_sessions', 'riskScore');
  await queryInterface.removeColumn('user_refresh_sessions', 'riskLevel');
  await queryInterface.removeColumn('user_refresh_sessions', 'deviceLabel');
  await queryInterface.removeColumn('user_refresh_sessions', 'deviceFingerprint');

  // Drop ENUM type if it exists (Postgres specific)
  const dialect = queryInterface.sequelize?.getDialect?.() ?? 'postgres';
  if (['postgres', 'postgresql'].includes(dialect)) {
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_user_refresh_sessions_riskLevel\";");
  }
}
