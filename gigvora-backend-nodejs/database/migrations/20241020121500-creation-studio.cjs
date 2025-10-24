'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function ensureEnumValue(queryInterface, enumName, value) {
  const dialect = queryInterface.sequelize.getDialect();
  if (!['postgres', 'postgresql'].includes(dialect)) {
    return;
  }
  const [[existing]] = await queryInterface.sequelize.query(
    'SELECT 1 FROM pg_enum WHERE enumlabel = :value AND enumtypid = :enumName::regtype',
    { replacements: { value, enumName } },
  );
  if (!existing) {
    await queryInterface.sequelize.query(`ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${value}'`);
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await Promise.all([
      ensureEnumValue(queryInterface, 'enum_creation_studio_items_visibility', 'connections'),
      ensureEnumValue(queryInterface, 'enum_creation_studio_items_visibility', 'community'),
    ]);

    const table = await queryInterface.describeTable('creation_studio_items').catch(() => null);
    if (table) {
      const operations = [];
      if (!table.slug) {
        operations.push(
          queryInterface.addColumn('creation_studio_items', 'slug', {
            type: Sequelize.STRING(200),
            allowNull: true,
            unique: true,
          }),
        );
      }
      if (!table.owner_id) {
        operations.push(
          queryInterface.addColumn('creation_studio_items', 'owner_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          }),
        );
      }
      if (!table.updated_by_id) {
        operations.push(
          queryInterface.addColumn('creation_studio_items', 'updated_by_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          }),
        );
      }
      if (!table.description) {
        operations.push(queryInterface.addColumn('creation_studio_items', 'description', { type: Sequelize.TEXT, allowNull: true }));
      }
      if (!table.target_audience) {
        operations.push(
          queryInterface.addColumn('creation_studio_items', 'target_audience', {
            type: Sequelize.STRING(255),
            allowNull: true,
          }),
        );
      }
      if (!table.hero_image_url) {
        operations.push(
          queryInterface.addColumn('creation_studio_items', 'hero_image_url', {
            type: Sequelize.STRING(500),
            allowNull: true,
          }),
        );
      }
      if (!table.location_label && table.location == null) {
        operations.push(
          queryInterface.addColumn('creation_studio_items', 'location_label', {
            type: Sequelize.STRING(180),
            allowNull: true,
          }),
        );
      }
      if (table.location && !table.location_label) {
        operations.push(
          queryInterface.renameColumn('creation_studio_items', 'location', 'location_label'),
        );
      }
      if (!table.location_mode) {
        operations.push(
          queryInterface.addColumn('creation_studio_items', 'location_mode', {
            type: Sequelize.STRING(40),
            allowNull: false,
            defaultValue: 'hybrid',
          }),
        );
      }
      if (!table.metadata) {
        operations.push(queryInterface.addColumn('creation_studio_items', 'metadata', { type: jsonType, allowNull: true }));
      }
      if (!table.share_targets) {
        operations.push(queryInterface.addColumn('creation_studio_items', 'share_targets', { type: jsonType, allowNull: true }));
      }
      if (!table.share_message) {
        operations.push(queryInterface.addColumn('creation_studio_items', 'share_message', { type: Sequelize.TEXT, allowNull: true }));
      }
      if (!table.publish_at && table.publishAt) {
        operations.push(queryInterface.renameColumn('creation_studio_items', 'publishAt', 'publish_at'));
      }
      if (!table.published_at && table.publishedAt) {
        operations.push(queryInterface.renameColumn('creation_studio_items', 'publishedAt', 'published_at'));
      }
      if (!table.archived_at) {
        operations.push(queryInterface.addColumn('creation_studio_items', 'archived_at', { type: Sequelize.DATE, allowNull: true }));
      }
      if (!table.commitment_hours) {
        operations.push(
          queryInterface.addColumn('creation_studio_items', 'commitment_hours', {
            type: Sequelize.INTEGER,
            allowNull: true,
          }),
        );
      }
      if (!table.remote_eligible && table.remoteEligible == null) {
        operations.push(
          queryInterface.addColumn('creation_studio_items', 'remote_eligible', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          }),
        );
      }
      if (operations.length) {
        await Promise.all(operations);
      }
    }

    await queryInterface.createTable('creation_studio_collaborators', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      owner_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      workspace_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'provider_workspaces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'creation_studio_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      track_type: {
        type: Sequelize.ENUM(
          'project',
          'gig',
          'job',
          'launchpad_job',
          'launchpad_project',
          'volunteering',
          'networking_session',
          'group',
          'page',
          'ad',
          'blog_post',
          'event',
        ),
        allowNull: false,
      },
      email: { type: Sequelize.STRING(320), allowNull: false },
      role: { type: Sequelize.STRING(120), allowNull: false },
      status: {
        type: Sequelize.ENUM('invited', 'sent', 'accepted', 'declined', 'removed'),
        allowNull: false,
        defaultValue: 'invited',
      },
      invited_by_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
      },
      responded_at: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('creation_studio_collaborators', ['owner_id', 'track_type']);
    await queryInterface.addIndex('creation_studio_collaborators', ['item_id']);
    await queryInterface.addIndex('creation_studio_collaborators', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('creation_studio_collaborators');
    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_creation_studio_collaborators_status"');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_creation_studio_collaborators_track_type"');
    }
  },
};
