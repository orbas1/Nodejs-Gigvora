import { jest } from '@jest/globals';

const resolveModule = (relativePath) => new URL(relativePath, import.meta.url).pathname;

describe('runtimeOperationsService', () => {
  let service;
  const getRuntimeOperationalSnapshot = jest.fn();
  const getSystemSettings = jest.fn();
  const updateSystemSettings = jest.fn();
  const getSiteSettings = jest.fn();
  const saveSiteSettings = jest.fn();
  const loggerInfo = jest.fn();

  beforeEach(async () => {
    jest.resetModules();
    getRuntimeOperationalSnapshot.mockResolvedValue({
      readiness: { status: 'ready', score: 0.82 },
      maintenance: { counts: { active: 1 } },
    });
    getSystemSettings.mockResolvedValue({
      general: { appName: 'Gigvora', incidentContact: 'ops@gigvora.com', supportEmail: 'support@gigvora.com' },
      notifications: {
        emailProvider: 'resend',
        smsProvider: 'twilio',
        broadcastChannels: ['email', 'push'],
      },
      maintenance: {
        supportChannel: 'ops@gigvora.com',
        statusPageUrl: 'https://status.gigvora.com',
        upcomingWindows: [
          {
            id: 'upgrade-window',
            summary: 'Platform upgrade',
            startAt: '2025-05-01T10:00:00.000Z',
            endAt: '2025-05-01T12:00:00.000Z',
            timezone: 'UTC',
          },
        ],
      },
    });
    updateSystemSettings.mockResolvedValue({
      general: { incidentContact: 'updated@gigvora.com' },
      notifications: {},
      maintenance: {},
    });
    getSiteSettings.mockResolvedValue({
      heroHeadline: 'Launch with confidence',
      heroSubheading: 'Gigvora keeps mission-critical teams humming.',
      heroPersonaChips: ['Founders', 'Agencies', 'Mentors', 'Recruiters'],
      heroInsightStats: [
        { id: 'growth', label: 'Pipeline velocity', value: '120%' },
        { id: 'satisfaction', label: 'NPS', value: '+62' },
      ],
      heroValuePillars: [
        {
          id: 'ops-efficiency',
          title: 'Operational efficiency',
          description: 'Automate onboarding, payroll, and compliance.',
          highlights: ['Automated compliance'],
          icon: 'SparklesIcon',
        },
      ],
      announcement: { enabled: true, message: 'Gigvora runtime upgrades live now.' },
      operationsSummary: {
        hero: 'Runtime excellence',
        highlights: ['Global redundancy'],
        metrics: ['99.98% uptime'],
      },
    });
    saveSiteSettings.mockResolvedValue({
      settings: { heroPersonaChips: ['Founders', 'Agencies', 'Mentors', 'Recruiters', 'Executives'] },
      updatedAt: '2025-05-01T09:00:00.000Z',
    });

    jest.unstable_mockModule(resolveModule('../runtimeObservabilityService.js'), () => ({
      getRuntimeOperationalSnapshot,
    }));
    jest.unstable_mockModule(resolveModule('../systemSettingsService.js'), () => ({
      getSystemSettings,
      updateSystemSettings,
    }));
    jest.unstable_mockModule(resolveModule('../siteManagementService.js'), () => ({
      getSiteSettings,
      saveSiteSettings,
    }));
    jest.unstable_mockModule(resolveModule('../../utils/logger.js'), () => ({
      default: { info: loggerInfo },
    }));

    service = await import('../runtimeOperationsService.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns combined runtime operations summary with derived insights', async () => {
    const summary = await service.getRuntimeOperationsSummary();

    expect(getRuntimeOperationalSnapshot).toHaveBeenCalledTimes(1);
    expect(getSystemSettings).toHaveBeenCalledTimes(1);
    expect(getSiteSettings).toHaveBeenCalledTimes(1);

    expect(summary.system.general.incidentContact).toBe('ops@gigvora.com');
    expect(summary.site.hero.personaChips).toHaveLength(4);
    expect(summary.insights.personaChipCount).toBe(4);
    expect(summary.insights.operationsScore).toBeGreaterThanOrEqual(0);
    expect(summary.insights.broadcastChannels).toEqual(['email', 'push']);
    expect(summary.runtime.readiness.status).toBe('ready');
  });

  it('applies updates to system and site settings and logs the actor', async () => {
    const result = await service.updateRuntimeOperationsSettings(
      {
        system: { general: { incidentContact: 'updated@gigvora.com' } },
        site: { heroPersonaChips: ['Founders', 'Agencies', 'Mentors', 'Recruiters', 'Executives'] },
      },
      { actor: { reference: 'admin:1' } },
    );

    expect(updateSystemSettings).toHaveBeenCalledWith(
      expect.objectContaining({ general: expect.objectContaining({ incidentContact: 'updated@gigvora.com' }) }),
    );
    expect(saveSiteSettings).toHaveBeenCalledWith(
      expect.objectContaining({ heroPersonaChips: expect.arrayContaining(['Executives']) }),
    );
    expect(loggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'runtime.operations.settings_updated',
        actor: 'admin:1',
      }),
      'Runtime operations settings updated',
    );
    expect(result.summary).toBeDefined();
    expect(result.siteSettingsUpdatedAt).toBe('2025-05-01T09:00:00.000Z');
  });
});
