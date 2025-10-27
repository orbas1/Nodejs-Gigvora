import { jest } from '@jest/globals';

import {
  getNavigationGovernanceSnapshot,
  __setDependencies,
  __resetDependencies,
} from '../navigationGovernanceService.js';

describe('navigationGovernanceService', () => {
  const locales = [
    { code: 'en', label: 'English', nativeLabel: 'English', coverage: 100, status: 'ga', isDefault: true },
    { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', coverage: 78, status: 'preview', direction: 'rtl' },
  ];
  const personas = [
    { key: 'user', label: 'Member workspace', defaultRoute: '/dashboard/user' },
    { key: 'company', label: 'Company HQ', defaultRoute: '/dashboard/company' },
  ];
  const routes = [
    { collection: 'userDashboards', absolutePath: '/dashboard/user', persona: 'user' },
    { collection: 'userDashboards', absolutePath: '/dashboard/user', persona: 'user' },
    { collection: 'company', absolutePath: '/dashboard/company', persona: 'company', featureFlag: 'company.hub' },
  ];

  let auditRecords;
  let auditModel;

  beforeEach(() => {
    auditRecords = [];
    auditModel = {
      findOne: jest.fn(async () => {
        if (!auditRecords.length) {
          return null;
        }
        const record = auditRecords[auditRecords.length - 1];
        return { get: () => ({ ...record }) };
      }),
      create: jest.fn(async (payload) => {
        const record = { id: `audit-${auditRecords.length + 1}`, ...payload };
        auditRecords.push(record);
        return { get: () => ({ ...record }) };
      }),
    };

    __setDependencies({
      fetchLocales: async () => locales,
      fetchPersonas: async () => personas,
      fetchRoutes: async () => routes,
      auditModel,
      logger: { child: () => ({ warn: jest.fn(), error: jest.fn() }) },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    __resetDependencies();
  });

  it('builds a governance snapshot with analytics and persists audits', async () => {
    const snapshot = await getNavigationGovernanceSnapshot();

    expect(snapshot.version).toEqual(expect.any(String));
    expect(snapshot.analytics.totalRoutes).toBe(3);
    expect(snapshot.analytics.duplicatePathCount).toBe(1);
    expect(snapshot.analytics.localeCoverage).toMatchObject({ total: 2, rtlLocales: 1 });
    expect(snapshot.analytics.personaCoverage.find((entry) => entry.key === 'user').routes).toBeGreaterThan(0);
    expect(auditModel.create).toHaveBeenCalledTimes(1);
  });

  it('does not create duplicate audits when the snapshot is unchanged', async () => {
    await getNavigationGovernanceSnapshot();
    await getNavigationGovernanceSnapshot();

    expect(auditModel.create).toHaveBeenCalledTimes(1);
  });

  it('handles loader failures gracefully and still records an audit entry', async () => {
    __setDependencies({
      fetchLocales: async () => {
        throw new Error('fail locales');
      },
      fetchPersonas: async () => {
        throw new Error('fail personas');
      },
      fetchRoutes: async () => {
        throw new Error('fail routes');
      },
      auditModel,
      logger: { child: () => ({ warn: jest.fn(), error: jest.fn() }) },
    });

    const snapshot = await getNavigationGovernanceSnapshot();

    expect(snapshot.analytics.totalRoutes).toBe(0);
    expect(snapshot.analytics.localesTracked).toBe(0);
    expect(snapshot.analytics.personasTracked).toBe(0);
    expect(auditModel.create).toHaveBeenCalledTimes(1);
  });

  it('skips audit persistence when routes are excluded', async () => {
    await getNavigationGovernanceSnapshot({ includeRoutes: false });

    expect(auditModel.create).not.toHaveBeenCalled();
  });
});
