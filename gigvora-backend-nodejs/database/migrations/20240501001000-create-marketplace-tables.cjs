'use strict';

const VISIBILITY_ENUM = ['public', 'connections'];
const CONNECTION_STATUS = ['pending', 'accepted', 'rejected'];
const FEED_TYPES = ['public', 'connections'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
        ? Sequelize.JSONB
        : Sequelize.JSON;

      await queryInterface.createTable(
        'feed_posts',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          content: { type: Sequelize.TEXT, allowNull: false },
          visibility: { type: Sequelize.ENUM(...VISIBILITY_ENUM), defaultValue: 'public', allowNull: false },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('feed_posts', ['userId'], { transaction });
      await queryInterface.addIndex('feed_posts', ['visibility'], { transaction });

      await queryInterface.createTable(
        'jobs',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          slug: { type: Sequelize.STRING(191), allowNull: false, unique: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(191), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          location: { type: Sequelize.STRING(191), allowNull: true },
          employmentType: { type: Sequelize.STRING(120), allowNull: true },
          compensationCurrency: { type: Sequelize.STRING(3), allowNull: true },
          compensationMin: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          compensationMax: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          status: { type: Sequelize.ENUM('draft', 'published', 'archived'), allowNull: false, defaultValue: 'draft' },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('jobs', ['ownerId'], { transaction });
      await queryInterface.addIndex('jobs', ['status'], { transaction });

      await queryInterface.createTable(
        'gigs',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          slug: { type: Sequelize.STRING(191), allowNull: false, unique: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(191), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          budgetCurrency: { type: Sequelize.STRING(3), allowNull: true },
          budgetAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          duration: { type: Sequelize.STRING(120), allowNull: true },
          status: { type: Sequelize.ENUM('draft', 'published', 'archived'), allowNull: false, defaultValue: 'draft' },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('gigs', ['ownerId'], { transaction });
      await queryInterface.addIndex('gigs', ['status'], { transaction });

      await queryInterface.createTable(
        'projects',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          slug: { type: Sequelize.STRING(191), allowNull: false, unique: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(191), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          status: { type: Sequelize.ENUM('planning', 'active', 'completed', 'archived'), allowNull: false, defaultValue: 'planning' },
          budgetCurrency: { type: Sequelize.STRING(3), allowNull: true },
          budgetAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('projects', ['ownerId'], { transaction });
      await queryInterface.addIndex('projects', ['status'], { transaction });

      await queryInterface.createTable(
        'experience_launchpads',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          slug: { type: Sequelize.STRING(191), allowNull: false, unique: true },
          title: { type: Sequelize.STRING(191), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          track: { type: Sequelize.STRING(120), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'volunteering_roles',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          slug: { type: Sequelize.STRING(191), allowNull: false, unique: true },
          title: { type: Sequelize.STRING(191), allowNull: false },
          organization: { type: Sequelize.STRING(191), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          status: { type: Sequelize.ENUM('draft', 'published', 'archived'), allowNull: false, defaultValue: 'draft' },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'groups',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          slug: { type: Sequelize.STRING(191), allowNull: false, unique: true },
          name: { type: Sequelize.STRING(191), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          visibility: { type: Sequelize.ENUM(...FEED_TYPES), allowNull: false, defaultValue: 'public' },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'group_memberships',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          groupId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'groups', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          role: { type: Sequelize.ENUM('member', 'moderator', 'owner'), allowNull: false, defaultValue: 'member' },
          joinedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('group_memberships', ['userId', 'groupId'], { unique: true, transaction });

      await queryInterface.createTable(
        'connections',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          requesterId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          addresseeId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          status: { type: Sequelize.ENUM(...CONNECTION_STATUS), allowNull: false, defaultValue: 'pending' },
          respondedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('connections', ['requesterId', 'addresseeId'], { unique: true, transaction });
      await queryInterface.addIndex('connections', ['status'], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('connections', { transaction });
      await queryInterface.dropTable('group_memberships', { transaction });
      await queryInterface.dropTable('groups', { transaction });
      await queryInterface.dropTable('volunteering_roles', { transaction });
      await queryInterface.dropTable('experience_launchpads', { transaction });
      await queryInterface.dropTable('projects', { transaction });
      await queryInterface.dropTable('gigs', { transaction });
      await queryInterface.dropTable('jobs', { transaction });
      await queryInterface.dropTable('feed_posts', { transaction });
      if (['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_feed_posts_visibility";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_jobs_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_gigs_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_projects_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_volunteering_roles_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_groups_visibility";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_group_memberships_role";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_connections_status";', { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
