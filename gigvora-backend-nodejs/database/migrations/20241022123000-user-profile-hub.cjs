'use strict';

const TABLES = {
  profiles: 'profiles',
  profileFollowers: 'profile_followers',
  connections: 'connections',
};

const ENUMS = {
  profileVisibility: 'enum_profiles_profile_visibility',
  networkVisibility: 'enum_profiles_network_visibility',
  followersVisibility: 'enum_profiles_followers_visibility',
  connectionVisibility: 'enum_connections_visibility',
};

const PROFILE_VISIBILITY_OPTIONS = ['public', 'members', 'private'];
const NETWORK_VISIBILITY_OPTIONS = ['public', 'connections', 'private'];
const FOLLOWERS_VISIBILITY_OPTIONS = ['public', 'connections', 'private'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        TABLES.profiles,
        'avatar_url',
        { type: Sequelize.STRING(1024), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.profiles,
        'avatar_storage_key',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.profiles,
        'avatar_updated_at',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.profiles,
        'profile_visibility',
        {
          type: Sequelize.ENUM(...PROFILE_VISIBILITY_OPTIONS),
          allowNull: false,
          defaultValue: 'members',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.profiles,
        'network_visibility',
        {
          type: Sequelize.ENUM(...NETWORK_VISIBILITY_OPTIONS),
          allowNull: false,
          defaultValue: 'connections',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.profiles,
        'followers_visibility',
        {
          type: Sequelize.ENUM(...FOLLOWERS_VISIBILITY_OPTIONS),
          allowNull: false,
          defaultValue: 'connections',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.profiles,
        'social_links',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.profileFollowers,
        'display_name',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.profileFollowers,
        'notes',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.profileFollowers,
        'tags',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.profileFollowers,
        'last_interacted_at',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.connections,
        'relationship_tag',
        { type: Sequelize.STRING(120), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.connections,
        'notes',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.connections,
        'favourite',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.connections,
        'visibility',
        {
          type: Sequelize.ENUM(...NETWORK_VISIBILITY_OPTIONS),
          allowNull: false,
          defaultValue: 'connections',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.connections,
        'connected_at',
        {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLES.connections,
        'last_interacted_at',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(TABLES.connections, 'last_interacted_at', { transaction });
      await queryInterface.removeColumn(TABLES.connections, 'connected_at', { transaction });
      await queryInterface.removeColumn(TABLES.connections, 'visibility', { transaction });
      await queryInterface.removeColumn(TABLES.connections, 'favourite', { transaction });
      await queryInterface.removeColumn(TABLES.connections, 'notes', { transaction });
      await queryInterface.removeColumn(TABLES.connections, 'relationship_tag', { transaction });

      await queryInterface.removeColumn(TABLES.profileFollowers, 'last_interacted_at', { transaction });
      await queryInterface.removeColumn(TABLES.profileFollowers, 'tags', { transaction });
      await queryInterface.removeColumn(TABLES.profileFollowers, 'notes', { transaction });
      await queryInterface.removeColumn(TABLES.profileFollowers, 'display_name', { transaction });

      await queryInterface.removeColumn(TABLES.profiles, 'social_links', { transaction });
      await queryInterface.removeColumn(TABLES.profiles, 'followers_visibility', { transaction });
      await queryInterface.removeColumn(TABLES.profiles, 'network_visibility', { transaction });
      await queryInterface.removeColumn(TABLES.profiles, 'profile_visibility', { transaction });
      await queryInterface.removeColumn(TABLES.profiles, 'avatar_updated_at', { transaction });
      await queryInterface.removeColumn(TABLES.profiles, 'avatar_storage_key', { transaction });
      await queryInterface.removeColumn(TABLES.profiles, 'avatar_url', { transaction });
    });

    if (['postgres', 'postgresql'].includes(dialect)) {
      await Promise.all([
        queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUMS.connectionVisibility}";`),
        queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUMS.followersVisibility}";`),
        queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUMS.networkVisibility}";`),
        queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUMS.profileVisibility}";`),
      ]);
    }
  },
};
