import {
  getNavigationGovernanceSnapshot,
  __setDependencies,
  __resetDependencies,
} from '../navigationGovernanceService.js';

describe('navigationGovernanceService', () => {
  afterEach(() => {
    __resetDependencies();
  });

  it('builds a governance snapshot with analytics and duplicates', async () => {
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

    __setDependencies({
      fetchLocales: async () => locales,
      fetchPersonas: async () => personas,
      fetchRoutes: async () => routes,
      logger: { child: () => ({ warn: () => {} }) },
    });

    const snapshot = await getNavigationGovernanceSnapshot();

    expect(snapshot.version).toEqual(expect.any(String));
    expect(snapshot.analytics.totalRoutes).toBe(3);
    expect(snapshot.analytics.duplicatePathCount).toBe(1);
    expect(snapshot.analytics.localeCoverage).toMatchObject({ total: 2, rtlLocales: 1 });
    expect(snapshot.analytics.personaCoverage.find((entry) => entry.key === 'user').routes).toBeGreaterThan(0);
  });

  it('handles loader failures gracefully', async () => {
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
      logger: { child: () => ({ warn: () => {} }) },
    });

    const snapshot = await getNavigationGovernanceSnapshot();

    expect(snapshot.analytics.totalRoutes).toBe(0);
    expect(snapshot.analytics.localesTracked).toBe(0);
    expect(snapshot.analytics.personasTracked).toBe(0);
  });
});
