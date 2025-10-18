'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'freelancer_reviews',
        {
          id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          reviewerName: { type: Sequelize.STRING(180), allowNull: true },
          reviewerRole: { type: Sequelize.STRING(180), allowNull: true },
          reviewerCompany: { type: Sequelize.STRING(180), allowNull: true },
          rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'pending', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          highlighted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          reviewSource: { type: Sequelize.STRING(120), allowNull: true },
          body: { type: Sequelize.TEXT, allowNull: false },
          capturedAt: { type: Sequelize.DATE, allowNull: true },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          previewUrl: { type: Sequelize.STRING(512), allowNull: true },
          heroImageUrl: { type: Sequelize.STRING(512), allowNull: true },
          tags: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          attachments: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          responses: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          privateNotes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('freelancer_reviews', ['freelancerId'], { transaction });
      await queryInterface.addIndex('freelancer_reviews', ['freelancerId', 'status'], { transaction });
      await queryInterface.addIndex('freelancer_reviews', ['status'], { transaction });
      await queryInterface.addIndex('freelancer_reviews', ['highlighted'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('freelancer_reviews', { transaction });
      await queryInterface.sequelize
        .query('DROP TYPE IF EXISTS "enum_freelancer_reviews_status";', { transaction })
        .catch(() => {});
    });
  },
};
