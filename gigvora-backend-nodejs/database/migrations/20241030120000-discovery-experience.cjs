'use strict';

const TABLE_SUGGESTIONS = 'discovery_suggestions';
const TABLE_TOPICS = 'discovery_trending_topics';
const TABLE_CONNECTIONS = 'discovery_connection_profiles';
const TABLE_ENGAGEMENTS = 'discovery_suggestion_engagements';
const TABLE_SUBSCRIPTIONS = 'discovery_suggestion_subscriptions';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function ensureEnum(queryInterface, Sequelize, name, values) {
  const dialect = queryInterface.sequelize.getDialect();
  if (!['postgres', 'postgresql'].includes(dialect)) {
    return null;
  }
  const existing = await queryInterface.sequelize.query(
    `SELECT 1 FROM pg_type WHERE typname = :name`,
    { type: queryInterface.sequelize.QueryTypes.SELECT, replacements: { name } },
  );
  if (existing.length) {
    return Sequelize.ENUM(...values);
  }
  await queryInterface.sequelize.query(
    `CREATE TYPE "${name}" AS ENUM (${values.map((value) => ` '${value.replace(/'/g, "''")}'`).join(',')})`,
  );
  return Sequelize.ENUM(...values);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    const timeframeEnum = await ensureEnum(queryInterface, Sequelize, 'discovery_topic_timeframe', [
      '24h',
      '7d',
      '30d',
      '90d',
    ]);

    await queryInterface.createTable(TABLE_SUGGESTIONS, {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      type: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'opportunity' },
      title: { type: Sequelize.STRING(160), allowNull: false },
      subtitle: { type: Sequelize.STRING(240), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      avatarUrl: { type: Sequelize.STRING(500), allowNull: true },
      coverImageUrl: { type: Sequelize.STRING(500), allowNull: true },
      reason: { type: Sequelize.STRING(255), allowNull: true },
      personalizationScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      mutualConnections: { type: Sequelize.INTEGER, allowNull: true },
      pinned: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      shareUrl: { type: Sequelize.STRING(500), allowNull: true },
      href: { type: Sequelize.STRING(500), allowNull: true },
      contextTags: { type: jsonType, allowNull: true },
      statSnapshot: { type: jsonType, allowNull: true },
      primaryActionLabel: { type: Sequelize.STRING(120), allowNull: true },
      secondaryActionLabel: { type: Sequelize.STRING(120), allowNull: true },
      targetPersona: { type: Sequelize.STRING(80), allowNull: true },
      targetSegments: { type: jsonType, allowNull: true },
      sortOrder: { type: Sequelize.INTEGER, allowNull: true },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      followCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      saveCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      viewCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      shareCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      dismissCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      metadata: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex(TABLE_SUGGESTIONS, ['type']);
    await queryInterface.addIndex(TABLE_SUGGESTIONS, ['active', 'targetPersona']);
    await queryInterface.addIndex(TABLE_SUGGESTIONS, ['sortOrder']);

    await queryInterface.createTable(TABLE_TOPICS, {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      topic: { type: Sequelize.STRING(180), allowNull: false },
      summary: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.STRING(80), allowNull: true },
      timeframe: timeframeEnum || Sequelize.STRING(12),
      persona: { type: Sequelize.STRING(80), allowNull: true },
      icon: { type: Sequelize.STRING(16), allowNull: true },
      accentColor: { type: Sequelize.STRING(16), allowNull: true },
      rank: { type: Sequelize.INTEGER, allowNull: true },
      engagementScore: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      growthRate: { type: Sequelize.DECIMAL(7, 2), allowNull: true },
      mentionCount: { type: Sequelize.INTEGER, allowNull: true },
      shareCount: { type: Sequelize.INTEGER, allowNull: true },
      followCount: { type: Sequelize.INTEGER, allowNull: true },
      sentimentScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      metrics: { type: jsonType, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex(TABLE_TOPICS, ['timeframe', 'persona']);
    await queryInterface.addIndex(TABLE_TOPICS, ['rank']);

    await queryInterface.createTable(TABLE_CONNECTIONS, {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      fullName: { type: Sequelize.STRING(160), allowNull: false },
      headline: { type: Sequelize.STRING(200), allowNull: true },
      location: { type: Sequelize.STRING(160), allowNull: true },
      bio: { type: Sequelize.TEXT, allowNull: true },
      avatarUrl: { type: Sequelize.STRING(500), allowNull: true },
      verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      trustSignal: { type: Sequelize.STRING(160), allowNull: true },
      sharedContexts: { type: jsonType, allowNull: true },
      tags: { type: jsonType, allowNull: true },
      successStory: { type: Sequelize.TEXT, allowNull: true },
      primaryAction: { type: jsonType, allowNull: true },
      secondaryAction: { type: jsonType, allowNull: true },
      persona: { type: Sequelize.STRING(80), allowNull: true },
      industryFocus: { type: Sequelize.STRING(120), allowNull: true },
      relationshipStatus: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'new' },
      priorityScore: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      metadata: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex(TABLE_CONNECTIONS, ['persona']);
    await queryInterface.addIndex(TABLE_CONNECTIONS, ['relationshipStatus']);
    await queryInterface.addIndex(TABLE_CONNECTIONS, ['active']);

    await queryInterface.createTable(TABLE_ENGAGEMENTS, {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      suggestionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: TABLE_SUGGESTIONS, key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      action: { type: Sequelize.STRING(40), allowNull: false },
      metadata: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex(TABLE_ENGAGEMENTS, ['suggestionId', 'action']);
    await queryInterface.addIndex(TABLE_ENGAGEMENTS, ['userId', 'action']);

    await queryInterface.createTable(TABLE_SUBSCRIPTIONS, {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      suggestionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: TABLE_SUGGESTIONS, key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      followed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      metadata: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex(TABLE_SUBSCRIPTIONS, ['suggestionId']);
    await queryInterface.addIndex(TABLE_SUBSCRIPTIONS, ['userId']);
    await queryInterface.addConstraint(TABLE_SUBSCRIPTIONS, {
      fields: ['suggestionId', 'userId'],
      type: 'unique',
      name: 'discovery_suggestion_subscriptions_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable(TABLE_SUBSCRIPTIONS);
    await queryInterface.dropTable(TABLE_ENGAGEMENTS);
    await queryInterface.dropTable(TABLE_CONNECTIONS);
    await queryInterface.dropTable(TABLE_TOPICS);
    await queryInterface.dropTable(TABLE_SUGGESTIONS);
  },
};
