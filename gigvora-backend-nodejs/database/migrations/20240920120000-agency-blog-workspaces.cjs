export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('blog_posts', 'workspace_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'provider_workspaces',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addColumn('blog_categories', 'workspace_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'provider_workspaces',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addColumn('blog_tags', 'workspace_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'provider_workspaces',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.removeIndex('blog_posts', ['slug']);
  await queryInterface.removeIndex('blog_categories', ['slug']);
  await queryInterface.removeIndex('blog_tags', ['slug']);

  await queryInterface.addIndex('blog_posts', ['workspace_id']);
  await queryInterface.addIndex('blog_posts', ['workspace_id', 'slug'], {
    name: 'blog_posts_workspace_slug_unique',
    unique: true,
  });

  await queryInterface.addIndex('blog_categories', ['workspace_id']);
  await queryInterface.addIndex('blog_categories', ['workspace_id', 'slug'], {
    name: 'blog_categories_workspace_slug_unique',
    unique: true,
  });

  await queryInterface.addIndex('blog_tags', ['workspace_id']);
  await queryInterface.addIndex('blog_tags', ['workspace_id', 'slug'], {
    name: 'blog_tags_workspace_slug_unique',
    unique: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex('blog_tags', 'blog_tags_workspace_slug_unique');
  await queryInterface.removeIndex('blog_tags', ['workspace_id']);
  await queryInterface.removeColumn('blog_tags', 'workspace_id');
  await queryInterface.addIndex('blog_tags', ['slug'], { unique: true });

  await queryInterface.removeIndex('blog_categories', 'blog_categories_workspace_slug_unique');
  await queryInterface.removeIndex('blog_categories', ['workspace_id']);
  await queryInterface.removeColumn('blog_categories', 'workspace_id');
  await queryInterface.addIndex('blog_categories', ['slug'], { unique: true });

  await queryInterface.removeIndex('blog_posts', 'blog_posts_workspace_slug_unique');
  await queryInterface.removeIndex('blog_posts', ['workspace_id']);
  await queryInterface.removeColumn('blog_posts', 'workspace_id');
  await queryInterface.addIndex('blog_posts', ['slug'], { unique: true });
}
