import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const findPageMock = jest.fn();
const createFeedbackMock = jest.fn();
const transactionMock = jest.fn(async (handler) => handler({}));
const navigationFindAllMock = jest.fn();

jest.unstable_mockModule('../../src/models/index.js', () => ({
  SiteSetting: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  SitePage: { findOne: findPageMock },
  SiteNavigationLink: { findAll: navigationFindAllMock, create: jest.fn(), update: jest.fn(), destroy: jest.fn() },
  SitePageFeedback: { create: createFeedbackMock },
  SITE_PAGE_STATUSES: ['draft', 'review', 'published', 'archived'],
  SITE_PAGE_FEEDBACK_RESPONSES: ['yes', 'partially', 'no'],
  sequelize: { transaction: transactionMock },
}));

const serviceModule = await import('../../src/services/siteManagementService.js');
const { submitSitePageFeedback } = serviceModule;

describe('submitSitePageFeedback', () => {
  beforeEach(() => {
    findPageMock.mockReset();
    createFeedbackMock.mockReset();
    transactionMock.mockReset().mockImplementation(async (handler) => handler({}));
    navigationFindAllMock.mockReset().mockResolvedValue([]);
  });

  it('hashes ip metadata and sanitises payload before persisting', async () => {
    const createdObject = {
      toPublicObject: () => ({ id: 44, response: 'yes', message: 'Great overview', actorRoles: ['member'] }),
    };
    findPageMock.mockResolvedValue({ id: 9 });
    createFeedbackMock.mockResolvedValue(createdObject);

    const result = await submitSitePageFeedback(
      'privacy-policy',
      { rating: 'YES', message: '  Great overview  ' },
      {
        actorId: 23,
        roles: ['Member', 'ADMIN'],
        ipAddress: '198.51.100.5',
        userAgent: 'JestSuite/1.0',
        referer: 'https://gigvora.com/privacy',
      },
    );

    expect(findPageMock).toHaveBeenCalledWith({ where: { slug: 'privacy-policy' } });
    expect(createFeedbackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pageId: 9,
        response: 'yes',
        message: 'Great overview',
        actorId: 23,
        actorRoles: ['member', 'admin'],
        ipHash: expect.any(String),
        userAgent: 'JestSuite/1.0',
      }),
    );
    expect(createFeedbackMock.mock.calls[0][0].ipHash).toHaveLength(64);
    expect(result).toEqual({ id: 44, response: 'yes', message: 'Great overview', actorRoles: ['member'] });
  });

  it('throws when rating is invalid', async () => {
    findPageMock.mockResolvedValue({ id: 4 });
    await expect(() => submitSitePageFeedback('terms', { rating: 'maybe' })).rejects.toThrow(/rating must be one of/);
  });

  it('throws when slug is missing or page not found', async () => {
    await expect(() => submitSitePageFeedback('', { rating: 'yes' })).rejects.toThrow(/slug is required/);
    findPageMock.mockResolvedValue(null);
    await expect(submitSitePageFeedback('unknown', { rating: 'yes' })).rejects.toThrow(/Page not found/);
  });
});
