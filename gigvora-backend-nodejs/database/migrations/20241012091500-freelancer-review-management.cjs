'use strict';

const STATUS_VALUES = ['draft', 'pending', 'published', 'archived'];
const TABLE_NAME = 'freelancer_reviews';
const RATING_CONSTRAINT = 'freelancer_reviews_rating_range';

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

const dropEnum = async (queryInterface, enumName, transaction) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
  }
};

const addRatingConstraint = async (queryInterface, Sequelize, transaction) => {
  const dialect = queryInterface.sequelize.getDialect();

  if (['sqlite', 'sqljs'].includes(dialect)) {
    return;
  }

  const { Op } = Sequelize;

  await queryInterface.addConstraint(TABLE_NAME, {
    type: 'check',
    fields: ['rating'],
    name: RATING_CONSTRAINT,
    where: {
      [Op.or]: [
        { rating: null },
        { rating: { [Op.between]: [0, 5] } },
      ],
    },
    transaction,
  });
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        TABLE_NAME,
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
          reviewerEmail: { type: Sequelize.STRING(255), allowNull: true },
          rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          status: {
            type: Sequelize.ENUM(...STATUS_VALUES),
            allowNull: false,
            defaultValue: 'draft',
          },
          highlighted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          reviewSource: { type: Sequelize.STRING(180), allowNull: true },
          body: { type: Sequelize.TEXT, allowNull: false },
          capturedAt: { type: Sequelize.DATE, allowNull: true },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          previewUrl: { type: Sequelize.STRING(512), allowNull: true },
          heroImageUrl: { type: Sequelize.STRING(512), allowNull: true },
          tags: { type: jsonType, allowNull: true, defaultValue: [] },
          attachments: { type: jsonType, allowNull: true, defaultValue: [] },
          responses: { type: jsonType, allowNull: true, defaultValue: [] },
          privateNotes: { type: Sequelize.TEXT, allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await addRatingConstraint(queryInterface, Sequelize, transaction);

      await queryInterface.addIndex(TABLE_NAME, ['freelancerId'], {
        transaction,
        name: 'freelancer_reviews_freelancer_idx',
      });
      await queryInterface.addIndex(TABLE_NAME, ['status'], {
        transaction,
        name: 'freelancer_reviews_status_idx',
      });
      await queryInterface.addIndex(TABLE_NAME, ['highlighted'], {
        transaction,
        name: 'freelancer_reviews_highlighted_idx',
      });
      await queryInterface.addIndex(TABLE_NAME, ['publishedAt'], {
        transaction,
        name: 'freelancer_reviews_published_at_idx',
      });
      await queryInterface.addConstraint(TABLE_NAME, {
        type: 'unique',
        fields: ['freelancerId', 'title'],
        name: 'freelancer_reviews_freelancer_title_unique',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable(TABLE_NAME, { transaction });
      await dropEnum(queryInterface, 'enum_freelancer_reviews_status', transaction);
    });
  },
};
