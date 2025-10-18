'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = Sequelize.JSONB ?? Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'mentorship_orders',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          packageName: { type: Sequelize.STRING(180), allowNull: false },
          packageDescription: { type: Sequelize.TEXT, allowNull: true },
          sessionsPurchased: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          sessionsRedeemed: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          totalAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          status: {
            type: Sequelize.ENUM('pending', 'active', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
          },
          purchasedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentorship_orders', ['userId'], { transaction, name: 'mentorship_orders_user_idx' });
      await queryInterface.addIndex('mentorship_orders', ['mentorId'], { transaction, name: 'mentorship_orders_mentor_idx' });

      await queryInterface.createTable(
        'mentor_favourites',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addConstraint('mentor_favourites', {
        fields: ['userId', 'mentorId'],
        type: 'unique',
        name: 'mentor_favourites_user_mentor_unique',
        transaction,
      });

      await queryInterface.createTable(
        'mentor_recommendations',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          score: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          source: { type: Sequelize.STRING(120), allowNull: true },
          reason: { type: Sequelize.TEXT, allowNull: true },
          generatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentor_recommendations', ['userId', 'score'], {
        transaction,
        name: 'mentor_recommendations_user_score_idx',
      });

      await queryInterface.createTable(
        'mentor_reviews',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          sessionId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'peer_mentoring_sessions', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          orderId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'mentorship_orders', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          rating: { type: Sequelize.INTEGER, allowNull: false },
          wouldRecommend: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          headline: { type: Sequelize.STRING(200), allowNull: true },
          feedback: { type: Sequelize.TEXT, allowNull: true },
          praiseHighlights: { type: jsonType, allowNull: true },
          improvementAreas: { type: jsonType, allowNull: true },
          publishedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          isPublic: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentor_reviews', ['mentorId', 'rating'], {
        transaction,
        name: 'mentor_reviews_mentor_rating_idx',
      });

      await queryInterface.addColumn(
        'peer_mentoring_sessions',
        'orderId',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'mentorship_orders', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'peer_mentoring_sessions',
        'meetingLocation',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'peer_mentoring_sessions',
        'meetingType',
        { type: Sequelize.STRING(80), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'peer_mentoring_sessions',
        'pricePaid',
        { type: Sequelize.DECIMAL(12, 2), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'peer_mentoring_sessions',
        'currency',
        { type: Sequelize.STRING(3), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'peer_mentoring_sessions',
        'cancelledAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'peer_mentoring_sessions',
        'completedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'peer_mentoring_sessions',
        'feedbackRequested',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('peer_mentoring_sessions', 'feedbackRequested', { transaction });
      await queryInterface.removeColumn('peer_mentoring_sessions', 'completedAt', { transaction });
      await queryInterface.removeColumn('peer_mentoring_sessions', 'cancelledAt', { transaction });
      await queryInterface.removeColumn('peer_mentoring_sessions', 'currency', { transaction });
      await queryInterface.removeColumn('peer_mentoring_sessions', 'pricePaid', { transaction });
      await queryInterface.removeColumn('peer_mentoring_sessions', 'meetingType', { transaction });
      await queryInterface.removeColumn('peer_mentoring_sessions', 'meetingLocation', { transaction });
      await queryInterface.removeColumn('peer_mentoring_sessions', 'orderId', { transaction });

      await queryInterface.dropTable('mentor_reviews', { transaction });
      await queryInterface.dropTable('mentor_recommendations', { transaction });
      await queryInterface.dropTable('mentor_favourites', { transaction });
      await queryInterface.dropTable('mentorship_orders', { transaction });
    });

    await queryInterface.sequelize
      .query('DROP TYPE IF EXISTS "enum_mentorship_orders_status";', { raw: true })
      .catch(() => {});
  },
};
