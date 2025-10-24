'use strict';

const TESTIMONIALS_TABLE = 'reputation_testimonials';
const SUCCESS_STORIES_TABLE = 'reputation_success_stories';
const WIDGETS_TABLE = 'reputation_review_widgets';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function ensureEnum(queryInterface, Sequelize, enumName, values, { transaction }) {
  const dialect = queryInterface.sequelize.getDialect();
  if (!['postgres', 'postgresql'].includes(dialect)) {
    return Sequelize.ENUM(...values);
  }

  const existing = await queryInterface.sequelize.query(
    `SELECT typname FROM pg_type WHERE typname = :name`,
    { replacements: { name: enumName }, type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
  );

  if (!existing.length) {
    await queryInterface.sequelize.query(
      `CREATE TYPE "${enumName}" AS ENUM (${values.map((value) => `'${value}'`).join(', ')});`,
      { transaction },
    );
  }

  return Sequelize.ENUM({ name: enumName, values });
}

async function dropEnum(queryInterface, enumName, { transaction }) {
  const dialect = queryInterface.sequelize.getDialect();
  if (!['postgres', 'postgresql'].includes(dialect)) {
    return;
  }

  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);
    const moderationStatuses = ['pending', 'approved', 'rejected', 'needs_review'];

    await queryInterface.sequelize.transaction(async (transaction) => {
      const moderationEnum = await ensureEnum(
        queryInterface,
        Sequelize,
        'enum_reputation_content_moderation_status',
        moderationStatuses,
        { transaction },
      );

      await queryInterface.addColumn(
        TESTIMONIALS_TABLE,
        'clientEmail',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TESTIMONIALS_TABLE,
        'sourceUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TESTIMONIALS_TABLE,
        'moderationStatus',
        { type: moderationEnum, allowNull: false, defaultValue: 'pending' },
        { transaction },
      );
      await queryInterface.addColumn(
        TESTIMONIALS_TABLE,
        'moderationScore',
        { type: Sequelize.DECIMAL(5, 4), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TESTIMONIALS_TABLE,
        'moderationSummary',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TESTIMONIALS_TABLE,
        'moderationLabels',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TESTIMONIALS_TABLE,
        'moderatedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TESTIMONIALS_TABLE,
        'verifiedClient',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );
      await queryInterface.addColumn(
        TESTIMONIALS_TABLE,
        'verificationMetadata',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        SUCCESS_STORIES_TABLE,
        'moderationStatus',
        { type: moderationEnum, allowNull: false, defaultValue: 'pending' },
        { transaction },
      );
      await queryInterface.addColumn(
        SUCCESS_STORIES_TABLE,
        'moderationScore',
        { type: Sequelize.DECIMAL(5, 4), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        SUCCESS_STORIES_TABLE,
        'moderationSummary',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        SUCCESS_STORIES_TABLE,
        'moderationLabels',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        SUCCESS_STORIES_TABLE,
        'moderatedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        WIDGETS_TABLE,
        'theme',
        { type: Sequelize.STRING(120), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        WIDGETS_TABLE,
        'themeTokens',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        WIDGETS_TABLE,
        'lastPublishedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        WIDGETS_TABLE,
        'lastRenderedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(TESTIMONIALS_TABLE, 'clientEmail', { transaction });
      await queryInterface.removeColumn(TESTIMONIALS_TABLE, 'sourceUrl', { transaction });
      await queryInterface.removeColumn(TESTIMONIALS_TABLE, 'moderationStatus', { transaction });
      await queryInterface.removeColumn(TESTIMONIALS_TABLE, 'moderationScore', { transaction });
      await queryInterface.removeColumn(TESTIMONIALS_TABLE, 'moderationSummary', { transaction });
      await queryInterface.removeColumn(TESTIMONIALS_TABLE, 'moderationLabels', { transaction });
      await queryInterface.removeColumn(TESTIMONIALS_TABLE, 'moderatedAt', { transaction });
      await queryInterface.removeColumn(TESTIMONIALS_TABLE, 'verifiedClient', { transaction });
      await queryInterface.removeColumn(TESTIMONIALS_TABLE, 'verificationMetadata', { transaction });

      await queryInterface.removeColumn(SUCCESS_STORIES_TABLE, 'moderationStatus', { transaction });
      await queryInterface.removeColumn(SUCCESS_STORIES_TABLE, 'moderationScore', { transaction });
      await queryInterface.removeColumn(SUCCESS_STORIES_TABLE, 'moderationSummary', { transaction });
      await queryInterface.removeColumn(SUCCESS_STORIES_TABLE, 'moderationLabels', { transaction });
      await queryInterface.removeColumn(SUCCESS_STORIES_TABLE, 'moderatedAt', { transaction });

      await queryInterface.removeColumn(WIDGETS_TABLE, 'theme', { transaction });
      await queryInterface.removeColumn(WIDGETS_TABLE, 'themeTokens', { transaction });
      await queryInterface.removeColumn(WIDGETS_TABLE, 'lastPublishedAt', { transaction });
      await queryInterface.removeColumn(WIDGETS_TABLE, 'lastRenderedAt', { transaction });

      await dropEnum(queryInterface, 'enum_reputation_content_moderation_status', { transaction });
    });
  },
};
