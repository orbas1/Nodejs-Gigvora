'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('domain_governance_reviews', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      contextName: { type: Sequelize.STRING(80), allowNull: false },
      ownerTeam: { type: Sequelize.STRING(120), allowNull: false },
      dataSteward: { type: Sequelize.STRING(120), allowNull: false },
      reviewStatus: {
        type: Sequelize.ENUM('in_progress', 'approved', 'remediation_required'),
        allowNull: false,
        defaultValue: 'in_progress',
      },
      reviewedAt: { type: Sequelize.DATE, allowNull: true },
      nextReviewDueAt: { type: Sequelize.DATE, allowNull: true },
      scorecard: { type: jsonType, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('domain_governance_reviews', ['contextName'], {
      unique: true,
      name: 'domain_governance_reviews_context_name_unique',
    });
    await queryInterface.addIndex('domain_governance_reviews', ['reviewStatus']);
    await queryInterface.addIndex('domain_governance_reviews', ['nextReviewDueAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('domain_governance_reviews', 'domain_governance_reviews_context_name_unique').catch(
      () => {},
    );
    await queryInterface.removeIndex('domain_governance_reviews', ['reviewStatus']).catch(() => {});
    await queryInterface.removeIndex('domain_governance_reviews', ['nextReviewDueAt']).catch(() => {});
    await queryInterface.dropTable('domain_governance_reviews');

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_domain_governance_reviews_reviewStatus";');
    }
  },
};
