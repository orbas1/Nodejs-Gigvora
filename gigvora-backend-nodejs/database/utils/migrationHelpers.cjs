'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface?.sequelize?.getDialect?.();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function dropEnum(queryInterface, enumName, transaction) {
  const dialect = queryInterface?.sequelize?.getDialect?.();
  if (['postgres', 'postgresql'].includes(dialect)) {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, transaction ? { transaction } : undefined);
  }
}

async function safeRemoveIndex(queryInterface, tableName, fields, options = {}) {
  try {
    await queryInterface.removeIndex(tableName, fields, options);
  } catch (error) {
    const message = error?.message || '';
    if (!/does not exist|Unknown index|no such index/i.test(message)) {
      throw error;
    }
  }
}

module.exports = {
  resolveJsonType,
  dropEnum,
  safeRemoveIndex,
};
