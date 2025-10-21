'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const addColumnIfMissing = async (table, column, definition) => {
        const definitionSnapshot = await queryInterface.describeTable(table, { transaction });
        if (!Object.prototype.hasOwnProperty.call(definitionSnapshot, column)) {
          await queryInterface.addColumn(table, column, definition, { transaction });
        }
      };

      await addColumnIfMissing('blog_posts', 'workspace_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'provider_workspaces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });

      await addColumnIfMissing('blog_categories', 'workspace_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'provider_workspaces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });

      await addColumnIfMissing('blog_tags', 'workspace_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'provider_workspaces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });

      const removeIndexIfExists = async (table, index) => {
        const indexes = await queryInterface.showIndex(table, { transaction });
        const matches = indexes.filter((entry) => entry.name === index || entry.fields?.map((f) => f.attribute).join(',') === index);
        if (matches.length > 0) {
          await queryInterface.removeIndex(table, matches[0].name || index, { transaction });
        }
      };

      await removeIndexIfExists('blog_posts', 'slug');
      await removeIndexIfExists('blog_categories', 'slug');
      await removeIndexIfExists('blog_tags', 'slug');

      await queryInterface.addIndex('blog_posts', ['workspace_id'], {
        name: 'blog_posts_workspace_idx',
        transaction,
      });
      await queryInterface.addIndex('blog_posts', ['workspace_id', 'slug'], {
        name: 'blog_posts_workspace_slug_unique',
        unique: true,
        transaction,
      });

      await queryInterface.addIndex('blog_categories', ['workspace_id'], {
        name: 'blog_categories_workspace_idx',
        transaction,
      });
      await queryInterface.addIndex('blog_categories', ['workspace_id', 'slug'], {
        name: 'blog_categories_workspace_slug_unique',
        unique: true,
        transaction,
      });

      await queryInterface.addIndex('blog_tags', ['workspace_id'], {
        name: 'blog_tags_workspace_idx',
        transaction,
      });
      await queryInterface.addIndex('blog_tags', ['workspace_id', 'slug'], {
        name: 'blog_tags_workspace_slug_unique',
        unique: true,
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('blog_tags', 'blog_tags_workspace_slug_unique', { transaction });
      await queryInterface.removeIndex('blog_tags', 'blog_tags_workspace_idx', { transaction });
      await queryInterface.removeColumn('blog_tags', 'workspace_id', { transaction });
      await queryInterface.addIndex('blog_tags', ['slug'], { unique: true, transaction });

      await queryInterface.removeIndex('blog_categories', 'blog_categories_workspace_slug_unique', { transaction });
      await queryInterface.removeIndex('blog_categories', 'blog_categories_workspace_idx', { transaction });
      await queryInterface.removeColumn('blog_categories', 'workspace_id', { transaction });
      await queryInterface.addIndex('blog_categories', ['slug'], { unique: true, transaction });

      await queryInterface.removeIndex('blog_posts', 'blog_posts_workspace_slug_unique', { transaction });
      await queryInterface.removeIndex('blog_posts', 'blog_posts_workspace_idx', { transaction });
      await queryInterface.removeColumn('blog_posts', 'workspace_id', { transaction });
      await queryInterface.addIndex('blog_posts', ['slug'], { unique: true, transaction });
    });
  },
};
