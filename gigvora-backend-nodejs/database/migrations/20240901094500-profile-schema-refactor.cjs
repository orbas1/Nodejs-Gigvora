'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const profileTable = 'profiles';

      await queryInterface.addColumn(
        profileTable,
        'location',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'timezone',
        { type: Sequelize.STRING(120), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'missionStatement',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'areasOfFocus',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'availabilityStatus',
        {
          type: Sequelize.ENUM('available', 'limited', 'unavailable', 'on_leave'),
          allowNull: false,
          defaultValue: 'limited',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'availableHoursPerWeek',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'openToRemote',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'availabilityNotes',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'availabilityUpdatedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'trustScore',
        { type: Sequelize.DECIMAL(5, 2), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'likesCount',
        { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'followersCount',
        { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'qualifications',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'experienceEntries',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'statusFlags',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'launchpadEligibility',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'volunteerBadges',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'portfolioLinks',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'preferredEngagements',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'collaborationRoster',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'impactHighlights',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'pipelineInsights',
        { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'profileCompletion',
        { type: Sequelize.DECIMAL(5, 2), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        profileTable,
        'avatarSeed',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );

      await queryInterface.createTable(
        'profile_references',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: profileTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          referenceName: { type: Sequelize.STRING(255), allowNull: false },
          relationship: { type: Sequelize.STRING(255), allowNull: true },
          company: { type: Sequelize.STRING(255), allowNull: true },
          email: { type: Sequelize.STRING(255), allowNull: true },
          phone: { type: Sequelize.STRING(60), allowNull: true },
          endorsement: { type: Sequelize.TEXT, allowNull: true },
          isVerified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          weight: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          lastInteractedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('profile_references', ['profileId'], { transaction, name: 'profile_references_profile_id_idx' });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const profileTable = 'profiles';

      await queryInterface.removeIndex('profile_references', 'profile_references_profile_id_idx', { transaction });
      await queryInterface.dropTable('profile_references', { transaction });

      const enumFields = ['availabilityStatus'];
      const columns = [
        'location',
        'timezone',
        'missionStatement',
        'areasOfFocus',
        'availabilityStatus',
        'availableHoursPerWeek',
        'openToRemote',
        'availabilityNotes',
        'availabilityUpdatedAt',
        'trustScore',
        'likesCount',
        'followersCount',
        'qualifications',
        'experienceEntries',
        'statusFlags',
        'launchpadEligibility',
        'volunteerBadges',
        'portfolioLinks',
        'preferredEngagements',
        'collaborationRoster',
        'impactHighlights',
        'pipelineInsights',
        'profileCompletion',
        'avatarSeed',
      ];

      for (const column of columns) {
        // eslint-disable-next-line no-await-in-loop
        await queryInterface.removeColumn(profileTable, column, { transaction });
      }

      if (queryInterface.sequelize.getDialect() === 'postgres' || queryInterface.sequelize.getDialect() === 'postgresql') {
        for (const field of enumFields) {
          // eslint-disable-next-line no-await-in-loop
          await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_${profileTable}_${field}";`, { transaction });
        }
      }
    });
  },
};
