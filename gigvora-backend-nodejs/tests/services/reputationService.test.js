import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsModulePath = path.resolve(__dirname, '../../src/models/index.js');
await jest.unstable_mockModule(modelsModulePath, () => ({
  User: {},
  Profile: {},
  FreelancerProfile: {},
  ReputationTestimonial: {},
  ReputationSuccessStory: {},
  ReputationMetric: {},
  ReputationBadge: {},
  ReputationReviewWidget: {},
  REPUTATION_TESTIMONIAL_SOURCES: ['client', 'platform'],
  REPUTATION_TESTIMONIAL_STATUSES: ['pending', 'published'],
  REPUTATION_SUCCESS_STORY_STATUSES: ['draft', 'published'],
  REPUTATION_METRIC_TREND_DIRECTIONS: ['up', 'down', 'flat'],
  REPUTATION_REVIEW_WIDGET_STATUSES: ['draft', 'live'],
}));

const moderationServicePath = path.resolve(
  __dirname,
  '../../src/services/reputationModerationService.js',
);
await jest.unstable_mockModule(moderationServicePath, () => ({
  analyseTestimonial: jest.fn(),
  analyseSuccessStory: jest.fn(),
  verifyClientIdentity: jest.fn(),
}));

const renderWidgetHtml = jest.fn(() => '<div>widget</div>');
const widgetRendererPath = path.resolve(
  __dirname,
  '../../src/services/reputationWidgetRenderer.js',
);
await jest.unstable_mockModule(widgetRendererPath, () => ({
  renderWidgetHtml,
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/reputationService.js');
const {
  __testables: { summariseRatings, deriveReviewActivity },
} = await import(serviceModulePath);

describe('reputationService __testables', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('summariseRatings', () => {
    it('computes aggregates, distribution, and verified share', () => {
      const testimonials = [
        { rating: 5, verifiedClient: true },
        { score: 4.6, verified: true },
        { rating: 3.2 },
        { rating: 'invalid' },
      ];

      const summary = summariseRatings(testimonials);

      expect(summary).toEqual({
        average: 4.27,
        count: 3,
        verifiedShare: 2 / 3,
        distribution: [
          { rating: 5, count: 2, share: 2 / 3 },
          { rating: 4, count: 0, share: 0 },
          { rating: 3, count: 1, share: 1 / 3 },
          { rating: 2, count: 0, share: 0 },
          { rating: 1, count: 0, share: 0 },
        ],
      });
    });

    it('returns defaults when no testimonials contain ratings', () => {
      const summary = summariseRatings([{ rating: null }, { score: undefined }]);

      expect(summary).toEqual({
        average: null,
        count: 0,
        verifiedShare: 0,
        distribution: [
          { rating: 5, count: 0, share: 0 },
          { rating: 4, count: 0, share: 0 },
          { rating: 3, count: 0, share: 0 },
          { rating: 2, count: 0, share: 0 },
          { rating: 1, count: 0, share: 0 },
        ],
      });
    });
  });

  describe('deriveReviewActivity', () => {
    it('builds recent review velocity and timeline trend', () => {
      const testimonials = [
        { rating: 5, capturedAt: '2024-04-10T12:00:00Z' },
        { rating: 4.6, createdAt: '2024-03-05T09:30:00Z' },
        { rating: 3.2, updatedAt: '2023-12-15T08:00:00Z' },
        { rating: 5, capturedAt: 'invalid-date' },
      ];

      const activity = deriveReviewActivity(testimonials);

      expect(activity).toEqual({
        lastReviewAt: '2024-04-10T12:00:00.000Z',
        recentCount: 2,
        velocityPerMonth: 1,
        trend: 'accelerating',
        monthlyBreakdown: [
          { month: '2023-12', count: 1 },
          { month: '2024-03', count: 1 },
          { month: '2024-04', count: 1 },
        ],
      });
    });

    it('returns idle defaults when no testimonial timestamps are present', () => {
      const activity = deriveReviewActivity([{ rating: 5 }, { score: 4 }]);

      expect(activity).toEqual({
        lastReviewAt: null,
        recentCount: 0,
        velocityPerMonth: 0,
        trend: 'idle',
        monthlyBreakdown: [],
      });
    });
  });
});
