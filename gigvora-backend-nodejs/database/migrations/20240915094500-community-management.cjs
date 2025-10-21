'use strict';

const { resolveJsonType, dropEnum } = require('../utils/migrationHelpers.cjs');

const GROUP_MEMBERSHIP_ROLES = ['owner', 'moderator', 'member', 'observer'];
const COMMUNITY_INVITE_STATUSES = ['pending', 'accepted', 'declined', 'expired'];
const GROUP_POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
const GROUP_POST_VISIBILITIES = ['public', 'members', 'admins'];
const PAGE_VISIBILITIES = ['public', 'members', 'private'];
const PAGE_MEMBER_ROLES = ['owner', 'admin', 'editor', 'moderator', 'author', 'viewer'];
const PAGE_MEMBER_STATUSES = ['active', 'invited', 'pending', 'suspended'];
const PAGE_POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
const PAGE_POST_VISIBILITIES = ['public', 'followers', 'members', 'private'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable(
        'group_invites',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          groupId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'groups', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          email: { type: Sequelize.STRING(255), allowNull: false },
          role: {
            type: Sequelize.ENUM(...GROUP_MEMBERSHIP_ROLES),
            allowNull: false,
            defaultValue: 'member',
          },
          status: {
            type: Sequelize.ENUM(...COMMUNITY_INVITE_STATUSES),
            allowNull: false,
            defaultValue: 'pending',
          },
          token: { type: Sequelize.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4 },
          invitedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          message: { type: Sequelize.TEXT, allowNull: true },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('group_invites', ['groupId'], { transaction });
      await queryInterface.addIndex('group_invites', ['email'], { transaction });
      await queryInterface.addIndex('group_invites', ['token'], { unique: true, transaction });
      await queryInterface.addIndex('group_invites', ['status'], { transaction });

      await queryInterface.createTable(
        'group_posts',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          groupId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'groups', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          summary: { type: Sequelize.STRING(280), allowNull: true },
          content: { type: Sequelize.TEXT, allowNull: false },
          attachments: { type: jsonType, allowNull: true },
          status: {
            type: Sequelize.ENUM(...GROUP_POST_STATUSES),
            allowNull: false,
            defaultValue: 'draft',
          },
          visibility: {
            type: Sequelize.ENUM(...GROUP_POST_VISIBILITIES),
            allowNull: false,
            defaultValue: 'members',
          },
          scheduledAt: { type: Sequelize.DATE, allowNull: true },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('group_posts', ['groupId'], { transaction });
      await queryInterface.addIndex('group_posts', ['status'], { transaction });
      await queryInterface.addIndex('group_posts', ['createdById'], { transaction });

      await queryInterface.createTable(
        'pages',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          name: { type: Sequelize.STRING(255), allowNull: false },
          slug: { type: Sequelize.STRING(120), allowNull: false, unique: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          category: { type: Sequelize.STRING(120), allowNull: true },
          websiteUrl: { type: Sequelize.STRING(255), allowNull: true },
          contactEmail: { type: Sequelize.STRING(255), allowNull: true },
          visibility: {
            type: Sequelize.ENUM(...PAGE_VISIBILITIES),
            allowNull: false,
            defaultValue: 'public',
          },
          avatarColor: { type: Sequelize.STRING(7), allowNull: false, defaultValue: '#0f172a' },
          bannerImageUrl: { type: Sequelize.STRING(255), allowNull: true },
          callToAction: { type: Sequelize.STRING(255), allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          settings: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('pages', ['slug'], { unique: true, transaction });
      await queryInterface.addIndex('pages', ['createdById'], { transaction });
      await queryInterface.addIndex('pages', ['visibility'], { transaction });

      await queryInterface.createTable(
        'page_memberships',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          pageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pages', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          role: {
            type: Sequelize.ENUM(...PAGE_MEMBER_ROLES),
            allowNull: false,
            defaultValue: 'viewer',
          },
          status: {
            type: Sequelize.ENUM(...PAGE_MEMBER_STATUSES),
            allowNull: false,
            defaultValue: 'pending',
          },
          invitedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          joinedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('page_memberships', ['pageId'], { transaction });
      await queryInterface.addIndex('page_memberships', ['userId'], { transaction });
      await queryInterface.addIndex('page_memberships', ['role'], { transaction });
      await queryInterface.addIndex('page_memberships', ['status'], { transaction });

      await queryInterface.createTable(
        'page_invites',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          pageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pages', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          email: { type: Sequelize.STRING(255), allowNull: false },
          role: {
            type: Sequelize.ENUM(...PAGE_MEMBER_ROLES),
            allowNull: false,
            defaultValue: 'editor',
          },
          status: {
            type: Sequelize.ENUM(...COMMUNITY_INVITE_STATUSES),
            allowNull: false,
            defaultValue: 'pending',
          },
          token: { type: Sequelize.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4 },
          invitedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          message: { type: Sequelize.TEXT, allowNull: true },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('page_invites', ['pageId'], { transaction });
      await queryInterface.addIndex('page_invites', ['email'], { transaction });
      await queryInterface.addIndex('page_invites', ['token'], { unique: true, transaction });
      await queryInterface.addIndex('page_invites', ['status'], { transaction });

      await queryInterface.createTable(
        'page_posts',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          pageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pages', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          summary: { type: Sequelize.STRING(280), allowNull: true },
          content: { type: Sequelize.TEXT, allowNull: false },
          attachments: { type: jsonType, allowNull: true },
          status: {
            type: Sequelize.ENUM(...PAGE_POST_STATUSES),
            allowNull: false,
            defaultValue: 'draft',
          },
          visibility: {
            type: Sequelize.ENUM(...PAGE_POST_VISIBILITIES),
            allowNull: false,
            defaultValue: 'public',
          },
          scheduledAt: { type: Sequelize.DATE, allowNull: true },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('page_posts', ['pageId'], { transaction });
      await queryInterface.addIndex('page_posts', ['status'], { transaction });
      await queryInterface.addIndex('page_posts', ['createdById'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dropTable = (table) => queryInterface.dropTable(table, { transaction });

      await dropTable('page_posts');
      await dropTable('page_invites');
      await dropTable('page_memberships');
      await dropTable('pages');
      await dropTable('group_posts');
      await dropTable('group_invites');

      const typeNames = [
        'enum_group_invites_role',
        'enum_group_invites_status',
        'enum_group_posts_status',
        'enum_group_posts_visibility',
        'enum_pages_visibility',
        'enum_page_memberships_role',
        'enum_page_memberships_status',
        'enum_page_invites_role',
        'enum_page_invites_status',
        'enum_page_posts_status',
        'enum_page_posts_visibility',
      ];

      await Promise.all(typeNames.map((typeName) => dropEnum(queryInterface, typeName, transaction)));
    });
  },
};
