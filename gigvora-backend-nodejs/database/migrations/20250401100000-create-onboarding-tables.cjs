'use strict';

const PERSONA_STATUSES = ['draft', 'active', 'deprecated'];
const JOURNEY_STATUSES = ['draft', 'launching', 'active', 'completed', 'archived'];
const INVITE_STATUSES = ['pending', 'accepted', 'declined', 'bounced', 'cancelled'];

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('onboarding_personas', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      slug: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(180), allowNull: false },
      subtitle: { type: Sequelize.STRING(255), allowNull: false },
      headline: { type: Sequelize.STRING(255), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      benefits: { type: jsonType, allowNull: false, defaultValue: [] },
      metrics: { type: jsonType, allowNull: false, defaultValue: [] },
      signatureMoments: { type: jsonType, allowNull: false, defaultValue: [] },
      recommendedModules: { type: jsonType, allowNull: false, defaultValue: [] },
      heroMedia: { type: jsonType, allowNull: false, defaultValue: {} },
      status: { type: Sequelize.ENUM(...PERSONA_STATUSES), allowNull: false, defaultValue: 'active' },
      sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('onboarding_journeys', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      personaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'onboarding_personas', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      personaKey: { type: Sequelize.STRING(120), allowNull: false },
      personaTitle: { type: Sequelize.STRING(180), allowNull: false },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      status: { type: Sequelize.ENUM(...JOURNEY_STATUSES), allowNull: false, defaultValue: 'launching' },
      profileCompanyName: { type: Sequelize.STRING(180), allowNull: false },
      profileRole: { type: Sequelize.STRING(120), allowNull: false },
      profileTimezone: { type: Sequelize.STRING(80), allowNull: false },
      profileHeadline: { type: Sequelize.STRING(255), allowNull: true },
      profileNorthStar: { type: Sequelize.TEXT, allowNull: true },
      preferencesDigestCadence: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'weekly' },
      preferencesUpdatesEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      preferencesEnableAiDrafts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      preferencesFocusSignals: { type: jsonType, allowNull: false, defaultValue: [] },
      preferencesStoryThemes: { type: jsonType, allowNull: false, defaultValue: [] },
      invitedCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      launchedAt: { type: Sequelize.DATE, allowNull: true },
      completedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('onboarding_journeys', ['userId', 'status']);
    await queryInterface.addIndex('onboarding_journeys', ['personaKey']);

    await queryInterface.createTable('onboarding_journey_invites', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      journeyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'onboarding_journeys', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      email: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.STRING(120), allowNull: true },
      status: { type: Sequelize.ENUM(...INVITE_STATUSES), allowNull: false, defaultValue: 'pending' },
      invitedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      respondedAt: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('onboarding_journey_invites', ['journeyId']);
    await queryInterface.addIndex('onboarding_journey_invites', ['email']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('onboarding_journey_invites', ['journeyId']);
    await queryInterface.removeIndex('onboarding_journey_invites', ['email']);
    await queryInterface.dropTable('onboarding_journey_invites');

    await queryInterface.removeIndex('onboarding_journeys', ['userId', 'status']);
    await queryInterface.removeIndex('onboarding_journeys', ['personaKey']);
    await queryInterface.dropTable('onboarding_journeys');

    await queryInterface.dropTable('onboarding_personas');

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_onboarding_personas_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_onboarding_journeys_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_onboarding_journey_invites_status";');
    }
  },
};
