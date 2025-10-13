'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.sequelize.transaction(async (transaction) => {
      const ensureColumn = async (tableName, columnName, definition) => {
        const columns = await queryInterface.describeTable(tableName);
        if (!columns[columnName]) {
          await queryInterface.addColumn(tableName, columnName, definition, { transaction });
        }
      };

      await ensureColumn('profiles', 'geoLocation', { type: jsonType, allowNull: true });

      await ensureColumn('company_profiles', 'location', { type: Sequelize.STRING(255), allowNull: true });
      await ensureColumn('company_profiles', 'geoLocation', { type: jsonType, allowNull: true });

      await ensureColumn('agency_profiles', 'location', { type: Sequelize.STRING(255), allowNull: true });
      await ensureColumn('agency_profiles', 'geoLocation', { type: jsonType, allowNull: true });

      await ensureColumn('freelancer_profiles', 'location', { type: Sequelize.STRING(255), allowNull: true });
      await ensureColumn('freelancer_profiles', 'geoLocation', { type: jsonType, allowNull: true });

      await ensureColumn('users', 'location', { type: Sequelize.STRING(255), allowNull: true });
      await ensureColumn('users', 'geoLocation', { type: jsonType, allowNull: true });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dropColumnIfExists = async (tableName, columnName) => {
        const columns = await queryInterface.describeTable(tableName);
        if (columns[columnName]) {
          await queryInterface.removeColumn(tableName, columnName, { transaction });
        }
      };

      await dropColumnIfExists('profiles', 'geoLocation');

      await dropColumnIfExists('company_profiles', 'geoLocation');
      await dropColumnIfExists('company_profiles', 'location');

      await dropColumnIfExists('agency_profiles', 'geoLocation');
      await dropColumnIfExists('agency_profiles', 'location');

      await dropColumnIfExists('freelancer_profiles', 'geoLocation');
      await dropColumnIfExists('freelancer_profiles', 'location');

      await dropColumnIfExists('users', 'geoLocation');
      await dropColumnIfExists('users', 'location');
    });
  },
};
