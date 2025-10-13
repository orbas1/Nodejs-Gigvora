'use strict';

const GROUP_VISIBILITIES = ['public', 'private', 'secret'];
const GROUP_MEMBER_POLICIES = ['open', 'request', 'invite'];
const GROUP_MEMBERSHIP_STATUSES = ['pending', 'active', 'invited', 'suspended'];

function slugify(value, fallback = 'group') {
  if (!value) {
    return fallback;
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || fallback;
}

function normalizeHexColor(input) {
  if (!input) {
    return '#2563eb';
  }
  const normalized = input.toString().trim().toLowerCase();
  if (!/^#([0-9a-f]{6})$/.test(normalized)) {
    throw new Error(`Invalid colour value: ${input}`);
  }
  return normalized;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.addColumn('groups', 'slug', {
      type: Sequelize.STRING(120),
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn('groups', 'avatarColor', {
      type: Sequelize.STRING(7),
      allowNull: false,
      defaultValue: '#2563eb',
    });
    await queryInterface.addColumn('groups', 'bannerImageUrl', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('groups', 'visibility', {
      type: Sequelize.ENUM(...GROUP_VISIBILITIES),
      allowNull: false,
      defaultValue: 'public',
    });
    await queryInterface.addColumn('groups', 'memberPolicy', {
      type: Sequelize.ENUM(...GROUP_MEMBER_POLICIES),
      allowNull: false,
      defaultValue: 'request',
    });
    await queryInterface.addColumn('groups', 'createdById', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('groups', 'updatedById', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('groups', 'settings', {
      type: jsonType,
      allowNull: true,
    });
    await queryInterface.addColumn('groups', 'metadata', {
      type: jsonType,
      allowNull: true,
    });

    const [existingGroups] = await queryInterface.sequelize.query('SELECT id, name, slug, avatarColor FROM groups');
    for (const group of existingGroups) {
      const slugBase = slugify(group.slug || group.name, `group-${group.id}`);
      await queryInterface.sequelize.query('UPDATE groups SET slug = :slug WHERE id = :id', {
        replacements: { slug: slugBase, id: group.id },
      });
      const color = (() => {
        try {
          return normalizeHexColor(group.avatarColor);
        } catch (error) {
          return '#2563eb';
        }
      })();
      await queryInterface.sequelize.query('UPDATE groups SET avatarColor = :color WHERE id = :id', {
        replacements: { color, id: group.id },
      });
    }

    await queryInterface.changeColumn('groups', 'slug', {
      type: Sequelize.STRING(120),
      allowNull: false,
      unique: true,
    });

    await queryInterface.addColumn('group_memberships', 'status', {
      type: Sequelize.ENUM(...GROUP_MEMBERSHIP_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    });
    await queryInterface.addColumn('group_memberships', 'joinedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('group_memberships', 'invitedById', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('group_memberships', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addConstraint('group_memberships', {
      fields: ['groupId', 'userId'],
      type: 'unique',
      name: 'group_memberships_group_user_unique',
    });
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    await queryInterface.removeConstraint('group_memberships', 'group_memberships_group_user_unique');

    await queryInterface.removeColumn('group_memberships', 'status');
    await queryInterface.removeColumn('group_memberships', 'joinedAt');
    await queryInterface.removeColumn('group_memberships', 'invitedById');
    await queryInterface.removeColumn('group_memberships', 'notes');

    await queryInterface.removeColumn('groups', 'slug');
    await queryInterface.removeColumn('groups', 'avatarColor');
    await queryInterface.removeColumn('groups', 'bannerImageUrl');
    await queryInterface.removeColumn('groups', 'visibility');
    await queryInterface.removeColumn('groups', 'memberPolicy');
    await queryInterface.removeColumn('groups', 'createdById');
    await queryInterface.removeColumn('groups', 'updatedById');
    await queryInterface.removeColumn('groups', 'settings');
    await queryInterface.removeColumn('groups', 'metadata');

    if (dialect === 'postgres' || dialect === 'postgresql') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_groups_visibility";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_groups_memberPolicy";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_group_memberships_status";');
    }
  },
};
