'use strict';

const CREATION_STUDIO_TYPES = [
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
];

const CREATION_STUDIO_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
const CREATION_STUDIO_VISIBILITIES = ['private', 'connections', 'public'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'creation_studio_items',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          last_edited_by: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          type: { type: Sequelize.ENUM(...CREATION_STUDIO_TYPES), allowNull: false },
          title: { type: Sequelize.STRING(200), allowNull: false },
          tagline: { type: Sequelize.STRING(240), allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM(...CREATION_STUDIO_STATUSES),
            allowNull: false,
            defaultValue: 'draft',
          },
          visibility: {
            type: Sequelize.ENUM(...CREATION_STUDIO_VISIBILITIES),
            allowNull: false,
            defaultValue: 'private',
          },
          hero_image_url: { type: Sequelize.STRING(255), allowNull: true },
          location_label: { type: Sequelize.STRING(180), allowNull: true },
          location_mode: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'hybrid' },
          schedule: { type: jsonType, allowNull: true },
          settings: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          share_targets: { type: jsonType, allowNull: true },
          share_message: { type: Sequelize.TEXT, allowNull: true },
          tags: { type: jsonType, allowNull: true },
          launch_at: { type: Sequelize.DATE, allowNull: true },
          share_slug: { type: Sequelize.STRING(80), allowNull: true, unique: true },
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
        },
        { transaction },
      );

      await queryInterface.createTable(
        'creation_studio_steps',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          item_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'creation_studio_items', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          step_key: { type: Sequelize.STRING(60), allowNull: false },
          completed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          data: { type: jsonType, allowNull: true },
          completed_at: { type: Sequelize.DATE, allowNull: true },
          last_edited_by: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'creation_studio_items',
        ['user_id'],
        {
          name: 'creation_studio_items_user_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'creation_studio_items',
        ['type'],
        {
          name: 'creation_studio_items_type_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'creation_studio_items',
        ['status'],
        {
          name: 'creation_studio_items_status_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'creation_studio_steps',
        ['item_id', 'step_key'],
        {
          name: 'creation_studio_steps_item_step_uq',
          unique: true,
          transaction,
        },
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
      await queryInterface.removeIndex('creation_studio_steps', 'creation_studio_steps_item_step_uq', { transaction });
      await queryInterface.removeIndex('creation_studio_items', 'creation_studio_items_status_idx', { transaction });
      await queryInterface.removeIndex('creation_studio_items', 'creation_studio_items_type_idx', { transaction });
      await queryInterface.removeIndex('creation_studio_items', 'creation_studio_items_user_idx', { transaction });

      await queryInterface.dropTable('creation_studio_steps', { transaction });
      await queryInterface.dropTable('creation_studio_items', { transaction });

      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_creation_studio_items_type"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_creation_studio_items_status"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_creation_studio_items_visibility"', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
