
'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function ensureColumn(queryInterface, transaction, table, column, definition, columnsCache) {
  if (!columnsCache[column]) {
    await queryInterface.addColumn(table, column, definition, { transaction });
    columnsCache[column] = true;
  }
}

async function removeColumnIfExists(queryInterface, transaction, table, column) {
  const columns = await queryInterface.describeTable(table, { transaction });
  if (columns[column]) {
    await queryInterface.removeColumn(table, column, { transaction });
  }
}



module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);
    await queryInterface.sequelize.transaction(async (transaction) => {
      const agencyProfilesTable = 'agency_profiles';
      const columns = await queryInterface.describeTable(agencyProfilesTable, { transaction });

      await ensureColumn(
        queryInterface,
        transaction,
        agencyProfilesTable,
        'description',
        { type: Sequelize.TEXT, allowNull: true },
        columns,
      );
      await ensureColumn(
        queryInterface,
        transaction,
        agencyProfilesTable,
        'introVideoUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        columns,
      );

      await ensureColumn(
        queryInterface,
        transaction,
        agencyProfilesTable,
        'bannerImageUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        columns,
      );

      await ensureColumn(
        queryInterface,
        transaction,
        agencyProfilesTable,
        'profileImageUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        columns,
      );

      await ensureColumn(
        queryInterface,
        transaction,
        agencyProfilesTable,
        'workforceAvailable',
        { type: Sequelize.INTEGER, allowNull: true },
        columns,
      );

      await ensureColumn(
        queryInterface,
        transaction,
        agencyProfilesTable,
        'workforceNotes',
        { type: Sequelize.STRING(255), allowNull: true },
        columns,
      );

      await queryInterface.createTable(
        'agency_profile_media',
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          agencyProfileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: agencyProfilesTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          type: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'image' },
          title: { type: Sequelize.STRING(160), allowNull: true },
          url: { type: Sequelize.STRING(2048), allowNull: false },
          altText: { type: Sequelize.STRING(255), allowNull: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );
      await queryInterface.addIndex('agency_profile_media', ['agencyProfileId'], { transaction });
      await queryInterface.addIndex('agency_profile_media', ['agencyProfileId', 'type'], { transaction });
      await queryInterface.addIndex('agency_profile_media', ['position'], { transaction });

      await queryInterface.createTable(
        'agency_profile_skills',
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          agencyProfileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: agencyProfilesTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(120), allowNull: false },
          category: { type: Sequelize.STRING(120), allowNull: true },
          proficiency: { type: Sequelize.INTEGER, allowNull: true },
          experienceYears: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          isFeatured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );
      await queryInterface.addIndex('agency_profile_skills', ['agencyProfileId'], { transaction });
      await queryInterface.addIndex('agency_profile_skills', ['agencyProfileId', 'name'], { transaction });

      await queryInterface.createTable(
        'agency_profile_credentials',
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          agencyProfileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: agencyProfilesTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          type: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'qualification' },
          title: { type: Sequelize.STRING(180), allowNull: false },
          issuer: { type: Sequelize.STRING(180), allowNull: true },
          issuedAt: { type: Sequelize.DATEONLY, allowNull: true },
          expiresAt: { type: Sequelize.DATEONLY, allowNull: true },
          credentialUrl: { type: Sequelize.STRING(500), allowNull: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          referenceId: { type: Sequelize.STRING(120), allowNull: true },
          verificationStatus: { type: Sequelize.STRING(60), allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );
      await queryInterface.addIndex('agency_profile_credentials', ['agencyProfileId'], { transaction });
      await queryInterface.addIndex('agency_profile_credentials', ['agencyProfileId', 'type'], { transaction });
      await queryInterface.addIndex('agency_profile_credentials', ['issuedAt'], { transaction });

      await queryInterface.createTable(
        'agency_profile_experiences',
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          agencyProfileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: agencyProfilesTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          client: { type: Sequelize.STRING(180), allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          startDate: { type: Sequelize.DATEONLY, allowNull: true },
          endDate: { type: Sequelize.DATEONLY, allowNull: true },
          isCurrent: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          impact: { type: Sequelize.TEXT, allowNull: true },
          tags: { type: jsonType, allowNull: true },
          heroImageUrl: { type: Sequelize.STRING(500), allowNull: true },
          position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );
      await queryInterface.addIndex('agency_profile_experiences', ['agencyProfileId'], { transaction });
      await queryInterface.addIndex('agency_profile_experiences', ['agencyProfileId', 'isCurrent'], { transaction });
      await queryInterface.addIndex('agency_profile_experiences', ['position'], { transaction });

      await queryInterface.createTable(
        'agency_profile_workforce_segments',
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          agencyProfileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: agencyProfilesTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          segmentName: { type: Sequelize.STRING(180), allowNull: false },
          specialization: { type: Sequelize.STRING(180), allowNull: true },
          availableCount: { type: Sequelize.INTEGER, allowNull: true },
          totalCount: { type: Sequelize.INTEGER, allowNull: true },
          deliveryModel: { type: Sequelize.STRING(60), allowNull: true },
          location: { type: Sequelize.STRING(255), allowNull: true },
          availabilityNotes: { type: Sequelize.TEXT, allowNull: true },
          averageBillRate: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          currency: { type: Sequelize.STRING(6), allowNull: true },
          leadTimeDays: { type: Sequelize.INTEGER, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );
      await queryInterface.addIndex('agency_profile_workforce_segments', ['agencyProfileId'], { transaction });
      await queryInterface.addIndex('agency_profile_workforce_segments', ['agencyProfileId', 'segmentName'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const agencyProfilesTable = 'agency_profiles';

      await queryInterface.dropTable('agency_profile_workforce_segments', { transaction });
      await queryInterface.dropTable('agency_profile_experiences', { transaction });
      await queryInterface.dropTable('agency_profile_credentials', { transaction });
      await queryInterface.dropTable('agency_profile_skills', { transaction });
      await queryInterface.dropTable('agency_profile_media', { transaction });

      await removeColumnIfExists(queryInterface, transaction, agencyProfilesTable, 'workforceNotes');
      await removeColumnIfExists(queryInterface, transaction, agencyProfilesTable, 'workforceAvailable');
      await removeColumnIfExists(queryInterface, transaction, agencyProfilesTable, 'profileImageUrl');
      await removeColumnIfExists(queryInterface, transaction, agencyProfilesTable, 'bannerImageUrl');
      await removeColumnIfExists(queryInterface, transaction, agencyProfilesTable, 'introVideoUrl');
      await removeColumnIfExists(queryInterface, transaction, agencyProfilesTable, 'description');
      await queryInterface.removeColumn(agencyProfilesTable, 'workforceNotes', { transaction }).catch(() => {});
      await queryInterface.removeColumn(agencyProfilesTable, 'workforceAvailable', { transaction }).catch(() => {});
      await queryInterface.removeColumn(agencyProfilesTable, 'profileImageUrl', { transaction }).catch(() => {});
      await queryInterface.removeColumn(agencyProfilesTable, 'bannerImageUrl', { transaction }).catch(() => {});
      await queryInterface.removeColumn(agencyProfilesTable, 'introVideoUrl', { transaction }).catch(() => {});
      await queryInterface.removeColumn(agencyProfilesTable, 'description', { transaction }).catch(() => {});
    });
  },
};
