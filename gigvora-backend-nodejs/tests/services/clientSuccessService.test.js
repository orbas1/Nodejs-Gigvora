import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ValidationError } from '../../src/utils/errors.js';

describe('clientSuccessService', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const modelsModulePath = pathToFileURL(path.resolve(__dirname, '../../src/models/index.js')).pathname;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('prevents duplicate affiliate codes for the same freelancer', async () => {
    await jest.unstable_mockModule(modelsModulePath, () => ({
      User: { findByPk: jest.fn().mockResolvedValue({ id: 15, userType: 'freelancer' }) },
      ClientSuccessAffiliateLink: {
        findOne: jest.fn().mockResolvedValue({ id: 99 }),
        create: jest.fn(),
      },
      ClientSuccessPlaybook: {},
      ClientSuccessStep: {},
      ClientSuccessEnrollment: {},
      ClientSuccessEvent: {},
      ClientSuccessReferral: {},
      ClientSuccessReviewNudge: {},
      ClientSuccessAffiliateLinkMetric: {},
      ClientSuccessPlaybookRun: {},
      ClientSuccessAnalyticsSnapshot: {},
      ClientSuccessPlaybookTrigger: {},
      Gig: {},
      CLIENT_SUCCESS_PLAYBOOK_TRIGGERS: ['automation'],
      CLIENT_SUCCESS_STEP_TYPES: ['email', 'review_nudge', 'referral_invite'],
      CLIENT_SUCCESS_STEP_CHANNELS: ['email', 'sms'],
      CLIENT_SUCCESS_REFERRAL_STATUSES: ['pending', 'approved'],
      CLIENT_SUCCESS_AFFILIATE_STATUSES: ['active', 'paused', 'revoked'],
      sequelize: { transaction: (fn) => fn({}) },
    }));

    const { createAffiliateLink } = await import('../../src/services/clientSuccessService.js');

    await expect(createAffiliateLink(15, { code: 'DUPLICATE' })).rejects.toThrow(
      'Affiliate code already exists for this freelancer.',
    );
  });

  it('creates and sanitizes a new affiliate link with generated code', async () => {
    const createdLink = {
      toPublicObject: () => ({
        id: 201,
        freelancerId: 42,
        gigId: 88,
        label: 'Podcast launch',
        code: 'AFF-1234',
        destinationUrl: 'https://gigvora.com/offers/podcast',
        commissionRate: 0.12,
        status: 'active',
        metadata: { cohort: 'spring' },
        totalRevenueCents: 12345,
      }),
      get: (field) => {
        if (field === 'gig') {
          return { id: 88, name: 'Podcast Production', toPublicObject: () => ({ id: 88, name: 'Podcast Production' }) };
        }
        return undefined;
      },
      reload: jest.fn().mockImplementation(() => {
        createdLink.gig = { toPublicObject: () => ({ id: 88, name: 'Podcast Production' }) };
        return Promise.resolve(createdLink);
      }),
    };

    await jest.unstable_mockModule(modelsModulePath, () => ({
      User: { findByPk: jest.fn().mockResolvedValue({ id: 42, userType: 'freelancer' }) },
      ClientSuccessAffiliateLink: {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(createdLink),
      },
      ClientSuccessPlaybook: {},
      ClientSuccessStep: {},
      ClientSuccessEnrollment: {},
      ClientSuccessEvent: {},
      ClientSuccessReferral: {},
      ClientSuccessReviewNudge: {},
      ClientSuccessAffiliateLinkMetric: {},
      ClientSuccessPlaybookRun: {},
      ClientSuccessAnalyticsSnapshot: {},
      ClientSuccessPlaybookTrigger: {},
      Gig: {},
      CLIENT_SUCCESS_PLAYBOOK_TRIGGERS: ['automation'],
      CLIENT_SUCCESS_STEP_TYPES: ['email', 'review_nudge', 'referral_invite'],
      CLIENT_SUCCESS_STEP_CHANNELS: ['email', 'sms'],
      CLIENT_SUCCESS_REFERRAL_STATUSES: ['pending', 'approved'],
      CLIENT_SUCCESS_AFFILIATE_STATUSES: ['active', 'paused', 'revoked'],
      sequelize: { transaction: (fn) => fn({}) },
    }));

    const { createAffiliateLink } = await import('../../src/services/clientSuccessService.js');

    const result = await createAffiliateLink(42, {
      label: 'Podcast launch',
      destinationUrl: 'https://gigvora.com/offers/podcast',
      commissionRate: 0.12,
    });

    expect(createdLink.reload).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 201,
      code: expect.stringMatching(/^AFF/),
      gig: { id: 88, name: 'Podcast Production' },
      totalRevenue: 123.45,
    });
  });
});
