'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const companyProfilesTable = 'company_profiles';

      await queryInterface.addColumn(
        companyProfilesTable,
        'tagline',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        companyProfilesTable,
        'logoUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        companyProfilesTable,
        'bannerUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        companyProfilesTable,
        'contactEmail',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        companyProfilesTable,
        'contactPhone',
        { type: Sequelize.STRING(60), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        companyProfilesTable,
        'socialLinks',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.createTable(
        'company_profile_followers',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          companyProfileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: companyProfilesTable, key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          followerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('pending', 'active', 'blocked'),
            allowNull: false,
            defaultValue: 'active',
          },
          notificationsEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          metadata: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('company_profile_followers', ['companyProfileId'], { transaction });
      await queryInterface.addIndex('company_profile_followers', ['followerId'], { transaction });
      await queryInterface.addIndex(
        'company_profile_followers',
        ['companyProfileId', 'followerId'],
        { unique: true, transaction },
      );

      await queryInterface.createTable(
        'company_profile_connections',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          companyProfileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: companyProfilesTable, key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          targetUserId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          targetCompanyProfileId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: companyProfilesTable, key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          relationshipType: { type: Sequelize.STRING(120), allowNull: true },
          status: {
            type: Sequelize.ENUM('pending', 'active', 'archived', 'blocked'),
            allowNull: false,
            defaultValue: 'pending',
          },
          contactEmail: { type: Sequelize.STRING(255), allowNull: true },
          contactPhone: { type: Sequelize.STRING(60), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          lastInteractedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('company_profile_connections', ['companyProfileId'], { transaction });
      await queryInterface.addIndex('company_profile_connections', ['targetUserId'], { transaction });
      await queryInterface.addIndex(
        'company_profile_connections',
        ['companyProfileId', 'targetUserId'],
        { unique: true, transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('company_profile_connections', ['companyProfileId'], { transaction });
      await queryInterface.removeIndex('company_profile_connections', ['targetUserId'], { transaction });
      await queryInterface.removeIndex('company_profile_connections', ['companyProfileId', 'targetUserId'], { transaction });
      await queryInterface.dropTable('company_profile_connections', { transaction });

      await queryInterface.removeIndex('company_profile_followers', ['companyProfileId'], { transaction });
      await queryInterface.removeIndex('company_profile_followers', ['followerId'], { transaction });
      await queryInterface.removeIndex('company_profile_followers', ['companyProfileId', 'followerId'], { transaction });
      await queryInterface.dropTable('company_profile_followers', { transaction });

      const companyProfilesTable = 'company_profiles';

      await queryInterface.removeColumn(companyProfilesTable, 'socialLinks', { transaction });
      await queryInterface.removeColumn(companyProfilesTable, 'contactPhone', { transaction });
      await queryInterface.removeColumn(companyProfilesTable, 'contactEmail', { transaction });
      await queryInterface.removeColumn(companyProfilesTable, 'bannerUrl', { transaction });
      await queryInterface.removeColumn(companyProfilesTable, 'logoUrl', { transaction });
      await queryInterface.removeColumn(companyProfilesTable, 'tagline', { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_company_profile_followers_status";', {
          transaction,
        });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_company_profile_connections_status";', {
          transaction,
        });
      }
    });
  },
};
