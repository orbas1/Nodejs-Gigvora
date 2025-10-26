import { DataTypes, Sequelize } from 'sequelize';

function resolveJsonType(queryInterface) {
  const dialect = queryInterface.sequelize?.getDialect?.() ?? 'postgres';
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

/** @type {import('sequelize').QueryInterface} */
export async function up(queryInterface) {
  const jsonType = resolveJsonType(queryInterface);

  await queryInterface.createTable('user_refresh_sessions', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    ipAddress: { type: DataTypes.STRING(128), allowNull: true },
    userAgent: { type: DataTypes.STRING(1024), allowNull: true },
    context: { type: jsonType, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    evaluatedAt: { type: DataTypes.DATE, allowNull: true },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    revokedReason: { type: DataTypes.STRING(120), allowNull: true },
    revokedById: { type: DataTypes.INTEGER, allowNull: true },
    revocationContext: { type: jsonType, allowNull: true },
    replacedByTokenHash: { type: DataTypes.STRING(128), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex('user_refresh_sessions', ['userId'], {
    name: 'user_refresh_sessions_user_idx',
  });
  await queryInterface.addIndex('user_refresh_sessions', ['expiresAt'], {
    name: 'user_refresh_sessions_expires_idx',
  });
  await queryInterface.addIndex('user_refresh_sessions', ['revokedAt'], {
    name: 'user_refresh_sessions_revoked_idx',
  });
  await queryInterface.addIndex('user_refresh_sessions', ['replacedByTokenHash'], {
    name: 'user_refresh_sessions_replaced_by_idx',
  });

  await queryInterface.createTable('user_refresh_invalidations', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING(120), allowNull: true },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    context: { type: jsonType, allowNull: true },
    invalidatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex('user_refresh_invalidations', ['userId', 'invalidatedAt'], {
    name: 'user_refresh_invalidations_user_invalidated_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('user_refresh_invalidations', 'user_refresh_invalidations_user_invalidated_idx');
  await queryInterface.dropTable('user_refresh_invalidations');

  await queryInterface.removeIndex('user_refresh_sessions', 'user_refresh_sessions_replaced_by_idx');
  await queryInterface.removeIndex('user_refresh_sessions', 'user_refresh_sessions_revoked_idx');
  await queryInterface.removeIndex('user_refresh_sessions', 'user_refresh_sessions_expires_idx');
  await queryInterface.removeIndex('user_refresh_sessions', 'user_refresh_sessions_user_idx');
  await queryInterface.dropTable('user_refresh_sessions');
}
