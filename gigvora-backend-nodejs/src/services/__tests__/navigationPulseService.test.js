import { Sequelize, DataTypes } from 'sequelize';

import { getNavigationPulse } from '../navigationPulseService.js';

describe('navigationPulseService', () => {
  const sequelize = new Sequelize('sqlite::memory:', { logging: false });

  const User = sequelize.define(
    'User',
    {
      memberships: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      preferredRoles: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      userType: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'user' },
    },
    { underscored: true, tableName: 'users' },
  );

  const NetworkingConnection = sequelize.define(
    'NetworkingConnection',
    {
      ownerId: { type: DataTypes.INTEGER, allowNull: true },
      connectionUserId: { type: DataTypes.INTEGER, allowNull: true },
    },
    { underscored: true, tableName: 'networking_connections', timestamps: true },
  );

  const Project = sequelize.define(
    'Project',
    {
      ownerId: { type: DataTypes.INTEGER, allowNull: false },
      lifecycleState: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'open' },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'planning' },
    },
    { underscored: true, tableName: 'projects', timestamps: true },
  );

  const MessageParticipant = sequelize.define(
    'MessageParticipant',
    {
      threadId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    { underscored: true, tableName: 'message_participants' },
  );

  const Message = sequelize.define(
    'Message',
    {
      threadId: { type: DataTypes.INTEGER, allowNull: false },
      senderId: { type: DataTypes.INTEGER, allowNull: true },
    },
    { underscored: true, tableName: 'messages', timestamps: true },
  );

  const DiscoveryTrendingTopic = sequelize.define(
    'DiscoveryTrendingTopic',
    {
      topic: { type: DataTypes.STRING(180), allowNull: false },
      summary: { type: DataTypes.TEXT, allowNull: true },
      category: { type: DataTypes.STRING(80), allowNull: true },
      timeframe: { type: DataTypes.STRING(16), allowNull: false },
      persona: { type: DataTypes.STRING(80), allowNull: true },
      rank: { type: DataTypes.INTEGER, allowNull: true },
      engagementScore: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      growthRate: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
      mentionCount: { type: DataTypes.INTEGER, allowNull: true },
      shareCount: { type: DataTypes.INTEGER, allowNull: true },
      followCount: { type: DataTypes.INTEGER, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true },
    },
    { underscored: true, tableName: 'discovery_trending_topics', timestamps: true },
  );

  const models = {
    User,
    NetworkingConnection,
    Project,
    Message,
    MessageParticipant,
    DiscoveryTrendingTopic,
  };

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Promise.all([
      NetworkingConnection.truncate({ cascade: true }),
      Project.truncate({ cascade: true }),
      Message.truncate({ cascade: true }),
      MessageParticipant.truncate({ cascade: true }),
      DiscoveryTrendingTopic.truncate({ cascade: true }),
    ]);
  });

  test('computes pulse metrics and trending topics for an active founder', async () => {
    const user = await User.create({
      memberships: ['founder'],
      preferredRoles: ['founder'],
      userType: 'company',
    });

    const now = new Date();
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    await NetworkingConnection.bulkCreate([
      { ownerId: user.id, createdAt: now, updatedAt: now },
      { ownerId: user.id, createdAt: sixDaysAgo, updatedAt: sixDaysAgo },
      { ownerId: user.id, createdAt: tenDaysAgo, updatedAt: tenDaysAgo },
    ]);

    await Project.bulkCreate([
      { ownerId: user.id, status: 'in_progress', lifecycleState: 'open', createdAt: now, updatedAt: now },
      { ownerId: user.id, status: 'completed', lifecycleState: 'closed', createdAt: tenDaysAgo, updatedAt: now },
    ]);

    await MessageParticipant.create({ threadId: 1, userId: user.id });
    await Message.bulkCreate([
      { threadId: 1, senderId: null, createdAt: sixDaysAgo, updatedAt: sixDaysAgo },
      { threadId: 1, senderId: user.id, createdAt: new Date(sixDaysAgo.getTime() + 5 * 60 * 1000), updatedAt: new Date(sixDaysAgo.getTime() + 5 * 60 * 1000) },
      { threadId: 1, senderId: null, createdAt: tenDaysAgo, updatedAt: tenDaysAgo },
    ]);

    await DiscoveryTrendingTopic.bulkCreate([
      {
        topic: 'AI-powered portfolio diagnostics',
        summary: 'Operators are co-building diagnostic canvases.',
        category: 'Launchpad',
        timeframe: '7d',
        persona: 'founder',
        rank: 1,
        engagementScore: 94.2,
        metadata: { href: '/explorer/trends/ai-diagnostics' },
      },
      {
        topic: 'Fractional GTM councils',
        summary: 'Revenue leaders forming councils.',
        category: 'Growth',
        timeframe: '7d',
        persona: null,
        rank: 2,
        engagementScore: 80.1,
      },
    ]);

    const payload = await getNavigationPulse(
      { userId: user.id, limitTrending: 3, timeframe: '7d' },
      { models },
    );

    expect(payload.generatedAt).toBeTruthy();
    expect(payload.persona).toBe('founder');
    expect(payload.pulse).toHaveLength(3);

    const connectionsMetric = payload.pulse.find((entry) => entry.id === 'connections');
    expect(connectionsMetric.value.raw).toBe(3);
    expect(connectionsMetric.delta.raw).toBe(2);
    expect(connectionsMetric.delta.formatted).toContain('week');

    const responseMetric = payload.pulse.find((entry) => entry.id === 'response');
    expect(responseMetric.value.raw).toBeGreaterThan(0.5);
    expect(responseMetric.delta.formatted).toContain('Avg');

    expect(payload.trending).toHaveLength(2);
    expect(payload.trending[0].label).toBe('AI-powered portfolio diagnostics');
    expect(payload.trending[0].to).toBe('/explorer/trends/ai-diagnostics');
  });
});
