'use strict';

const { resolveJsonType, dropEnum, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

const PROFILE_TABLE = 'profiles';
const APPRECIATIONS_TABLE = 'profile_appreciations';
const FOLLOWERS_TABLE = 'profile_followers';
const JOBS_TABLE = 'profile_engagement_jobs';

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        PROFILE_TABLE,
        'engagementRefreshedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.createTable(
        APPRECIATIONS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: PROFILE_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          actorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          appreciationType: {
            type: Sequelize.ENUM('like', 'celebrate', 'support', 'endorse', 'applause'),
            allowNull: false,
            defaultValue: 'like',
          },
          source: { type: Sequelize.STRING(120), allowNull: true },
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

      await queryInterface.addConstraint(APPRECIATIONS_TABLE, {
        type: 'unique',
        fields: ['profileId', 'actorId', 'appreciationType'],
        name: 'profile_appreciations_unique_actor_type',
        transaction,
      });

      await queryInterface.createTable(
        FOLLOWERS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: PROFILE_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          followerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('active', 'muted', 'blocked'),
            allowNull: false,
            defaultValue: 'active',
          },
          notificationsEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          metadata: { type: jsonType, allowNull: true },
          followedAt: {
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

      await queryInterface.addConstraint(FOLLOWERS_TABLE, {
        type: 'unique',
        fields: ['profileId', 'followerId'],
        name: 'profile_followers_unique_pair',
        transaction,
      });

      await queryInterface.createTable(
        JOBS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: PROFILE_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          scheduledAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          priority: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          status: {
            type: Sequelize.ENUM('pending', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'pending',
          },
          lockedAt: { type: Sequelize.DATE, allowNull: true },
          lockedBy: { type: Sequelize.STRING(120), allowNull: true },
          lastError: { type: Sequelize.TEXT, allowNull: true },
          reason: { type: Sequelize.STRING(255), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          completedAt: { type: Sequelize.DATE, allowNull: true },
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

      await queryInterface.addIndex(JOBS_TABLE, ['status', 'scheduledAt'], { transaction });
      await queryInterface.addIndex(JOBS_TABLE, ['profileId'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await safeRemoveIndex(queryInterface, JOBS_TABLE, ['status', 'scheduledAt'], { transaction });
      await safeRemoveIndex(queryInterface, JOBS_TABLE, ['profileId'], { transaction });

      await queryInterface.dropTable(JOBS_TABLE, { transaction });
      await queryInterface.dropTable(FOLLOWERS_TABLE, { transaction });
      await queryInterface.dropTable(APPRECIATIONS_TABLE, { transaction });

      await queryInterface.removeColumn(PROFILE_TABLE, 'engagementRefreshedAt', { transaction });

      const enums = [
        'enum_profile_appreciations_appreciationType',
        'enum_profile_followers_status',
        'enum_profile_engagement_jobs_status',
      ];

      for (const enumName of enums) {
        await dropEnum(queryInterface, enumName, transaction);
      }
    });
  },
};
