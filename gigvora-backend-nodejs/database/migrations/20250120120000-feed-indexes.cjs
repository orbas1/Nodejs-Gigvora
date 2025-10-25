/** @type {import('sequelize').QueryInterface} */

export async function up(queryInterface) {
  await queryInterface.addIndex('feed_posts', ['userId', 'createdAt'], {
    name: 'feed_posts_user_created_at',
  });
  await queryInterface.addIndex('feed_posts', ['publishedAt'], {
    name: 'feed_posts_published_at',
  });
  await queryInterface.addIndex('feed_posts', ['type'], {
    name: 'feed_posts_type',
  });

  await queryInterface.addIndex('feed_comments', ['postId', 'parentId'], {
    name: 'feed_comments_post_parent',
  });
  await queryInterface.addIndex('feed_comments', ['userId'], {
    name: 'feed_comments_user',
  });

  await queryInterface.addIndex('feed_reactions', ['postId', 'reactionType'], {
    name: 'feed_reactions_post_type',
  });
  await queryInterface.addIndex('feed_reactions', ['userId'], {
    name: 'feed_reactions_user',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('feed_posts', 'feed_posts_user_created_at');
  await queryInterface.removeIndex('feed_posts', 'feed_posts_published_at');
  await queryInterface.removeIndex('feed_posts', 'feed_posts_type');

  await queryInterface.removeIndex('feed_comments', 'feed_comments_post_parent');
  await queryInterface.removeIndex('feed_comments', 'feed_comments_user');

  await queryInterface.removeIndex('feed_reactions', 'feed_reactions_post_type');
  await queryInterface.removeIndex('feed_reactions', 'feed_reactions_user');
}
