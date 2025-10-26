import { Sequelize, DataTypes } from 'sequelize';

const SYSTEM_STATUS_EVENT_STATUSES = ['operational', 'degraded', 'maintenance', 'incident', 'outage'];
const SYSTEM_STATUS_EVENT_SEVERITIES = ['low', 'medium', 'notice', 'high', 'critical'];
const FEEDBACK_PULSE_SURVEY_STATUSES = ['draft', 'active', 'archived'];

const testSequelize = new Sequelize('sqlite::memory:', { logging: false });

const jsonType = DataTypes.JSON;

const SystemStatusEvent = testSequelize.define(
  'SystemStatusEvent',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    eventKey: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM(...SYSTEM_STATUS_EVENT_STATUSES), allowNull: false, defaultValue: 'operational' },
    severity: { type: DataTypes.ENUM(...SYSTEM_STATUS_EVENT_SEVERITIES), allowNull: false, defaultValue: 'low' },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    impactedServices: { type: jsonType, allowNull: false, defaultValue: [] },
    metadata: { type: jsonType, allowNull: false, defaultValue: [] },
    nextSteps: { type: jsonType, allowNull: false, defaultValue: [] },
    actions: { type: jsonType, allowNull: false, defaultValue: [] },
    acknowledgementRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'system_status_events', underscored: true },
);

const SystemStatusAcknowledgement = testSequelize.define(
  'SystemStatusAcknowledgement',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    statusEventId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    acknowledgedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    channel: { type: DataTypes.STRING(80), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'system_status_acknowledgements', underscored: true },
);

SystemStatusEvent.hasMany(SystemStatusAcknowledgement, { foreignKey: 'statusEventId', as: 'acknowledgements' });
SystemStatusAcknowledgement.belongsTo(SystemStatusEvent, { foreignKey: 'statusEventId', as: 'event' });

SystemStatusEvent.prototype.toToastPayload = function toToastPayload() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    eventKey: plain.eventKey,
    status: plain.status,
    severity: plain.severity,
    title: plain.title,
    message: plain.message ?? null,
    impactedServices: Array.isArray(plain.impactedServices) ? plain.impactedServices : [],
    meta: Array.isArray(plain.metadata) ? plain.metadata : [],
    nextSteps: Array.isArray(plain.nextSteps) ? plain.nextSteps : [],
    actions: Array.isArray(plain.actions) ? plain.actions : [],
    acknowledgementRequired: Boolean(plain.acknowledgementRequired),
    publishedAt: plain.publishedAt ? new Date(plain.publishedAt).toISOString() : null,
    expiresAt: plain.expiresAt ? new Date(plain.expiresAt).toISOString() : null,
    resolvedAt: plain.resolvedAt ? new Date(plain.resolvedAt).toISOString() : null,
  };
};

SystemStatusAcknowledgement.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    statusEventId: plain.statusEventId,
    userId: plain.userId,
    acknowledgedAt: plain.acknowledgedAt ? new Date(plain.acknowledgedAt).toISOString() : null,
    channel: plain.channel ?? null,
    metadata: plain.metadata ?? {},
  };
};

const FeedbackPulseSurvey = testSequelize.define(
  'FeedbackPulseSurvey',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    pulseKey: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM(...FEEDBACK_PULSE_SURVEY_STATUSES), allowNull: false, defaultValue: 'active' },
    question: { type: DataTypes.STRING(500), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: jsonType, allowNull: false, defaultValue: [] },
    segments: { type: jsonType, allowNull: false, defaultValue: [] },
    insights: { type: jsonType, allowNull: false, defaultValue: [] },
    trendLabel: { type: DataTypes.STRING(160), allowNull: true },
    trendValue: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    trendDelta: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    trendSampleSize: { type: DataTypes.INTEGER, allowNull: true },
    responseCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastResponseAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'feedback_pulse_surveys', underscored: true },
);

const FeedbackPulseResponse = testSequelize.define(
  'FeedbackPulseResponse',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    surveyId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    score: { type: DataTypes.INTEGER, allowNull: false },
    tags: { type: jsonType, allowNull: false, defaultValue: [] },
    comment: { type: DataTypes.TEXT, allowNull: true },
    channel: { type: DataTypes.STRING(80), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: 'feedback_pulse_responses', underscored: true },
);

FeedbackPulseSurvey.hasMany(FeedbackPulseResponse, { foreignKey: 'surveyId', as: 'responses' });
FeedbackPulseResponse.belongsTo(FeedbackPulseSurvey, { foreignKey: 'surveyId', as: 'survey' });

FeedbackPulseSurvey.prototype.toPulsePayload = function toPulsePayload() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    pulseKey: plain.pulseKey,
    status: plain.status,
    question: plain.question,
    description: plain.description ?? null,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    segments: Array.isArray(plain.segments) ? plain.segments : [],
    insights: Array.isArray(plain.insights) ? plain.insights : [],
    trend: {
      label: plain.trendLabel ?? null,
      value: plain.trendValue == null ? null : Number.parseFloat(plain.trendValue),
      delta: plain.trendDelta == null ? null : Number.parseFloat(plain.trendDelta),
      sampleSize: plain.trendSampleSize == null ? null : Number.parseInt(plain.trendSampleSize, 10),
    },
    responseCount: Number.parseInt(plain.responseCount ?? 0, 10),
    lastResponseAt: plain.lastResponseAt ? new Date(plain.lastResponseAt).toISOString() : null,
    metadata: plain.metadata ?? {},
  };
};

FeedbackPulseResponse.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    surveyId: plain.surveyId,
    userId: plain.userId ?? null,
    score: Number.parseInt(plain.score ?? 0, 10),
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    comment: plain.comment ?? null,
    channel: plain.channel ?? null,
    metadata: plain.metadata ?? {},
    submittedAt: plain.submittedAt ? new Date(plain.submittedAt).toISOString() : null,
  };
};

const serviceModule = await import('../systemMessagingService.js');

serviceModule.__setDependencies({
  models: {
    SystemStatusEvent,
    SystemStatusAcknowledgement,
    FeedbackPulseSurvey,
    FeedbackPulseResponse,
    sequelize: testSequelize,
  },
  sequelize: testSequelize,
});

const {
  getLatestSystemStatusEvent,
  acknowledgeSystemStatusEvent,
  getFeedbackPulse,
  submitFeedbackPulseResponse,
} = serviceModule;

describe('systemMessagingService', () => {
  beforeAll(async () => {
    await testSequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await FeedbackPulseResponse.destroy({ where: {} });
    await FeedbackPulseSurvey.destroy({ where: {} });
    await SystemStatusAcknowledgement.destroy({ where: {} });
    await SystemStatusEvent.destroy({ where: {} });
  });

  afterAll(async () => {
    await testSequelize.close();
    serviceModule.__resetDependencies();
  });

  it('returns the latest active system status event and acknowledgement state', async () => {
    const now = new Date();
    const older = await SystemStatusEvent.create({
      eventKey: 'legacy-maintenance',
      status: 'maintenance',
      severity: 'notice',
      title: 'Legacy maintenance',
      impactedServices: ['legacy-api'],
      publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    });

    const current = await SystemStatusEvent.create({
      eventKey: 'critical-outage',
      status: 'outage',
      severity: 'critical',
      title: 'Critical outage',
      impactedServices: ['graph-api', 'web-app'],
      nextSteps: ['Failover to backup region'],
      publishedAt: new Date(now.getTime() - 10 * 60 * 1000),
    });

    await SystemStatusAcknowledgement.create({
      statusEventId: current.id,
      userId: 42,
      channel: 'web',
    });

    const payload = await getLatestSystemStatusEvent({ userId: 42 });
    expect(payload).toMatchObject({
      eventKey: 'critical-outage',
      severity: 'critical',
      impactedServices: ['graph-api', 'web-app'],
    });
    expect(payload.acknowledged).toBeTruthy();
    expect(payload.acknowledged.channel).toBe('web');

    const anonymousPayload = await getLatestSystemStatusEvent();
    expect(anonymousPayload.acknowledged).toBeUndefined();

    older.resolvedAt = new Date();
    await older.save();
    const latestAfterResolve = await getLatestSystemStatusEvent({ includeResolved: false });
    expect(latestAfterResolve.eventKey).toBe('critical-outage');
  });

  it('creates acknowledgements with channel metadata', async () => {
    await SystemStatusEvent.create({
      eventKey: 'degraded-api',
      status: 'degraded',
      severity: 'medium',
      title: 'API latency',
      impactedServices: ['rest-api'],
      publishedAt: new Date(),
    });

    const result = await acknowledgeSystemStatusEvent('degraded-api', {
      actorId: 21,
      channel: 'dashboard',
      metadata: { acknowledgedFrom: 'incident-center' },
    });

    expect(result.acknowledgement).toMatchObject({
      userId: 21,
      channel: 'dashboard',
    });
  });

  it('returns feedback pulse payloads and records responses', async () => {
    const survey = await FeedbackPulseSurvey.create({
      pulseKey: 'weekly-health',
      question: 'How confident are you in this week\'s delivery plan?',
      tags: ['scope clarity', 'team morale', 'exec visibility'],
      segments: [
        { id: 'engineering', label: 'Engineering', value: 68 },
        { id: 'marketing', label: 'Marketing', value: 74 },
      ],
      trendLabel: 'Confidence',
      trendValue: 72.5,
      trendSampleSize: 10,
    });

    const pulse = await getFeedbackPulse('weekly-health');
    expect(pulse.pulseKey).toBe('weekly-health');
    expect(pulse.tags).toContain('scope clarity');

    const submission = await submitFeedbackPulseResponse(
      'weekly-health',
      {
        score: 5,
        tags: ['team morale', 'scope clarity', 'untracked'],
        comment: 'The new rituals are working well.',
        channel: 'web',
      },
      { actorId: 77 },
    );

    expect(submission.response).toMatchObject({ score: 5, userId: 77 });
    expect(submission.response.tags).toEqual(['team morale', 'scope clarity']);
    expect(submission.survey.responseCount).toBe(1);
    expect(Number.parseFloat(submission.survey.trend.value)).toBeCloseTo(5);
    expect(submission.survey.trend.sampleSize).toBe(1);

    const second = await submitFeedbackPulseResponse(
      'weekly-health',
      { score: 3, tags: ['exec visibility'] },
      { actorId: 99 },
    );

    expect(second.survey.responseCount).toBe(2);
    expect(second.survey.trend.sampleSize).toBe(2);
    expect(Number.parseFloat(second.survey.trend.value)).toBeCloseTo(4);
  });
});
