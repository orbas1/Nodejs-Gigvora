import { jest } from '@jest/globals';

beforeAll(() => {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
});

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('feedbackPulseService', () => {
  const modelsModulePath = new URL('../../models/index.js', import.meta.url).pathname;
  const systemStatusModulePath = new URL('../systemStatusService.js', import.meta.url).pathname;

  it('returns a mapped snapshot with system status data', async () => {
    const findOne = jest.fn().mockResolvedValue({
      timeframe: '7d',
      toPublicObject: () => ({
        id: 42,
        reference: 'pulse-ref',
        timeframe: '7d',
        overallScore: 84.6,
        scoreChange: 2.1,
        responseRate: 63.4,
        responseDelta: -0.7,
        sampleSize: 186,
        lastUpdated: '2025-03-15T15:10:00Z',
        alerts: { unresolved: 3, critical: 1, acknowledged: 5 },
        themes: [
          { id: 1, name: 'Onboarding clarity', score: 88.4, change: 3.1, position: 0 },
        ],
        highlights: [
          {
            id: 10,
            quote: 'The concierge onboarding calls set us up for success.',
            persona: 'COO · Atlas Marketplaces',
            channel: 'Pulse survey',
            sentiment: 'positive',
            driver: 'Onboarding',
            submittedAt: '2025-03-14T20:45:00Z',
          },
        ],
        systemStatusIncident: {
          id: 9,
          reference: 'demo-incident',
          status: 'degraded',
          headline: 'Realtime analytics latency',
          services: [
            { id: 1, name: 'Realtime analytics API', status: 'degraded', impact: 'Delays', eta: null, confidence: 0.6 },
          ],
        },
      }),
    });
    const findAll = jest.fn().mockResolvedValue([{ timeframe: '7d' }, { timeframe: '30d' }]);
    const serialiseIncident = jest.fn((incident) => ({ ...incident, serialised: true }));

    jest.unstable_mockModule(modelsModulePath, () => ({
      FeedbackPulseSnapshot: { findOne, findAll },
      FeedbackPulseTheme: {},
      FeedbackPulseHighlight: {},
      SystemStatusIncident: {},
      SystemStatusService: {},
      sequelize: {
        fn: jest.fn(() => ({})),
        col: jest.fn(() => ({})),
        literal: jest.fn((value) => value),
      },
    }));

    jest.unstable_mockModule(systemStatusModulePath, () => ({
      serialiseSystemStatusIncident: serialiseIncident,
    }));

    const { getFeedbackPulseSnapshot } = await import('../feedbackPulseService.js');
    const result = await getFeedbackPulseSnapshot({ timeframe: '7d' });

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(result.requestedTimeframe).toBe('7d');
    expect(result.timeframe).toBe('7d');
    expect(result.availableTimeframes).toEqual(['7d', '30d']);
    expect(result.snapshot).toMatchObject({
      overallScore: 84.6,
      alerts: { unresolved: 3, critical: 1, acknowledged: 5 },
    });
    expect(result.snapshot.systemStatus).toEqual(
      expect.objectContaining({ reference: 'demo-incident', serialised: true }),
    );
    expect(result.snapshot.themes[0]).toEqual(
      expect.objectContaining({ name: 'Onboarding clarity', score: 88.4 }),
    );
    expect(result.snapshot.highlights[0]).toEqual(
      expect.objectContaining({ sentiment: 'positive', driver: 'Onboarding' }),
    );
  });

  it('falls back to the latest snapshot when timeframe data is unavailable', async () => {
    const findOne = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        timeframe: '30d',
        toPublicObject: () => ({
          timeframe: '30d',
          overallScore: 81.2,
          scoreChange: -1.1,
          responseRate: 58.2,
          responseDelta: -3.5,
          alerts: { unresolved: 2, critical: 0, acknowledged: 4 },
          themes: [],
          highlights: [],
          systemStatusIncident: null,
        }),
      });
    const findAll = jest.fn().mockResolvedValue([{ timeframe: '7d' }, { timeframe: '30d' }]);

    jest.unstable_mockModule(modelsModulePath, () => ({
      FeedbackPulseSnapshot: { findOne, findAll },
      FeedbackPulseTheme: {},
      FeedbackPulseHighlight: {},
      SystemStatusIncident: {},
      SystemStatusService: {},
      sequelize: {
        fn: jest.fn(() => ({})),
        col: jest.fn(() => ({})),
        literal: jest.fn((value) => value),
      },
    }));

    jest.unstable_mockModule(systemStatusModulePath, () => ({
      serialiseSystemStatusIncident: jest.fn(),
    }));

    const { getFeedbackPulseSnapshot } = await import('../feedbackPulseService.js');
    const result = await getFeedbackPulseSnapshot({ timeframe: '90d' });

    expect(findOne).toHaveBeenCalledTimes(2);
    expect(result.requestedTimeframe).toBe('90d');
    expect(result.timeframe).toBe('30d');
    expect(result.snapshot.overallScore).toBe(81.2);
  });
});
