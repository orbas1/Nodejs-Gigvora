'use strict';

const USER_TYPES = ['user', 'company', 'freelancer', 'agency', 'admin'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
        ? Sequelize.JSONB
        : Sequelize.JSON;

      await queryInterface.createTable(
        'users',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          firstName: { type: Sequelize.STRING(120), allowNull: true },
          lastName: { type: Sequelize.STRING(120), allowNull: true },
          email: { type: Sequelize.STRING(191), allowNull: false, unique: true },
          password: { type: Sequelize.STRING(191), allowNull: false },
          address: { type: Sequelize.STRING(255), allowNull: true },
          age: { type: Sequelize.INTEGER, allowNull: true },
          userType: {
            type: Sequelize.ENUM(...USER_TYPES),
            allowNull: false,
            defaultValue: 'user',
          },
          status: {
            type: Sequelize.ENUM('active', 'invited', 'suspended', 'deleted'),
            allowNull: false,
            defaultValue: 'active',
          },
          lastLoginAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('users', ['email'], { unique: true, transaction });
      await queryInterface.addIndex('users', ['userType'], { transaction });
      await queryInterface.addIndex('users', ['status'], { transaction });

      await queryInterface.createTable(
        'profiles',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            allowNull: false,
            unique: true,
          },
          headline: { type: Sequelize.STRING(200), allowNull: true },
          bio: { type: Sequelize.TEXT, allowNull: true },
          skills: { type: Sequelize.TEXT, allowNull: true },
          experience: { type: Sequelize.TEXT, allowNull: true },
          education: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'company_profiles',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            allowNull: false,
            unique: true,
          },
          companyName: { type: Sequelize.STRING(191), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          website: { type: Sequelize.STRING(255), allowNull: true },
          headquarters: { type: Sequelize.STRING(191), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'agency_profiles',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            allowNull: false,
            unique: true,
          },
          agencyName: { type: Sequelize.STRING(191), allowNull: false },
          focusArea: { type: Sequelize.STRING(191), allowNull: true },
          website: { type: Sequelize.STRING(255), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'freelancer_profiles',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            allowNull: false,
            unique: true,
          },
          title: { type: Sequelize.STRING(191), allowNull: true },
          hourlyRate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          availability: { type: Sequelize.STRING(120), allowNull: true },
          currency: { type: Sequelize.STRING(3), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'two_factor_tokens',
        {
          email: { type: Sequelize.STRING(191), allowNull: false, primaryKey: true },
          code: { type: Sequelize.STRING(8), allowNull: false },
          attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          expiresAt: { type: Sequelize.DATE, allowNull: false },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('two_factor_tokens', { transaction });
      await queryInterface.dropTable('freelancer_profiles', { transaction });
      await queryInterface.dropTable('agency_profiles', { transaction });
      await queryInterface.dropTable('company_profiles', { transaction });
      await queryInterface.dropTable('profiles', { transaction });
      await queryInterface.dropTable('users', { transaction });
      if (['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_userType";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";', { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
