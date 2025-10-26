'use strict';

const { resolveJsonType, dropEnum } = require('../utils/migrationHelpers.cjs');

const TABLE = 'freelancer_reviews';
const VISIBILITY_ENUM = 'enum_freelancer_reviews_visibility';

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        TABLE,
        'persona',
        { type: Sequelize.STRING(120), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLE,
        'visibility',
        {
          type: Sequelize.ENUM('public', 'members', 'private'),
          allowNull: false,
          defaultValue: 'public',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLE,
        'reviewerAvatarUrl',
        { type: Sequelize.STRING(512), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLE,
        'endorsementHighlights',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLE,
        'endorsementHeadline',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLE,
        'endorsementChannel',
        { type: Sequelize.STRING(180), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLE,
        'requestFollowUp',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLE,
        'shareToProfile',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        { transaction },
      );

      await queryInterface.addColumn(
        TABLE,
        'metadata',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addIndex(
        TABLE,
        ['freelancerId', 'persona'],
        { transaction, name: 'freelancer_reviews_freelancerId_persona' },
      );

      await queryInterface.addIndex(
        TABLE,
        ['freelancerId', 'visibility'],
        { transaction, name: 'freelancer_reviews_freelancerId_visibility' },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(TABLE, 'freelancer_reviews_freelancerId_persona', { transaction });
      await queryInterface.removeIndex(TABLE, 'freelancer_reviews_freelancerId_visibility', { transaction });

      await queryInterface.removeColumn(TABLE, 'metadata', { transaction });
      await queryInterface.removeColumn(TABLE, 'shareToProfile', { transaction });
      await queryInterface.removeColumn(TABLE, 'requestFollowUp', { transaction });
      await queryInterface.removeColumn(TABLE, 'endorsementChannel', { transaction });
      await queryInterface.removeColumn(TABLE, 'endorsementHeadline', { transaction });
      await queryInterface.removeColumn(TABLE, 'endorsementHighlights', { transaction });
      await queryInterface.removeColumn(TABLE, 'reviewerAvatarUrl', { transaction });
      await queryInterface.removeColumn(TABLE, 'visibility', { transaction });
      await queryInterface.removeColumn(TABLE, 'persona', { transaction });

      await dropEnum(queryInterface, VISIBILITY_ENUM, transaction);
    });
  },
};
