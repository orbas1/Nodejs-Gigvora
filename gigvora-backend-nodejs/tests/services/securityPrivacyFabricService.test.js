process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import '../setupTestEnv.js';

const securityServiceUrl = new URL('../../src/services/securityAuditService.js', import.meta.url);
const complianceServiceUrl = new URL('../../src/services/adminComplianceManagementService.js', import.meta.url);
const gdprServiceUrl = new URL('../../src/services/gdprSettingsService.js', import.meta.url);

const securityEvents = [
  { id: 1, eventType: 'waf.block', level: 'critical', message: 'WAF blocked credential stuffing', createdAt: '2024-05-01T11:50:00.000Z' },
  { id: 2, eventType: 'login.alert', level: 'warn', message: 'Suspicious login patterns detected', createdAt: '2024-05-01T11:45:00.000Z' },
];

const complianceOverview = {
  frameworks: [
    { id: 1, name: 'SOC2', owner: 'Trust', status: 'active', renewalDueAt: '2024-06-15T00:00:00.000Z' },
    { id: 2, name: 'ISO27001', owner: 'Security', status: 'paused', renewalDueAt: '2024-10-01T00:00:00.000Z' },
  ],
  audits: [
    { id: 10, name: 'SOC2 Type II', status: 'scheduled', startDate: '2024-05-20T00:00:00.000Z' },
    { id: 11, name: 'Penetration test', status: 'completed', startDate: '2024-03-01T00:00:00.000Z' },
  ],
  obligations: [
    {
      id: 200,
      title: 'Vendor risk review',
      owner: 'Risk',
      status: 'in_progress',
      riskRating: 'high',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      evidenceRequired: true,
    },
    {
      id: 201,
      title: 'Access recertification',
      owner: 'Security',
      status: 'in_progress',
      riskRating: 'medium',
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      evidenceRequired: false,
    },
  ],
  metrics: {
    automationCoverage: 68,
    controlsAutomated: 42,
  },
};

const gdprSettings = {
  dpo: {
    name: 'Alex Morgan',
    email: 'privacy@gigvora.test',
    phone: '+44 20 5555 5555',
    officeLocation: 'London',
    availability: 'Mon-Fri 09:00-17:00 GMT',
  },
  dataSubjectRequests: {
    contactEmail: 'dsr@gigvora.test',
    escalationEmail: 'legal@gigvora.test',
    slaDays: 60,
    automatedIntake: true,
    intakeChannels: ['portal', 'email'],
    privacyPortalUrl: 'https://gigvora.test/privacy-portal',
  },
  breachResponse: {
    notificationWindowHours: 72,
    onCallContact: 'security@gigvora.test',
    incidentRunbookUrl: 'https://gigvora.test/runbooks/breach',
    tabletopLastRun: '2023-12-01T00:00:00.000Z',
    tooling: ['PagerDuty', 'Slack'],
  },
  consentFramework: {
    marketingOptInDefault: false,
    cookieBannerEnabled: false,
    cookieRefreshMonths: 12,
    consentLogRetentionDays: 1095,
  },
};

const securityServiceMock = {
  getRecentRuntimeSecurityEvents: jest.fn(async () => securityEvents),
};

const complianceServiceMock = {
  getComplianceOverview: jest.fn(async () => complianceOverview),
};

const gdprServiceMock = {
  getGdprSettings: jest.fn(async () => gdprSettings),
};

jest.unstable_mockModule(securityServiceUrl.pathname, () => securityServiceMock);

jest.unstable_mockModule(complianceServiceUrl.pathname, () => complianceServiceMock);

jest.unstable_mockModule(gdprServiceUrl.pathname, () => gdprServiceMock);

let service;

beforeEach(async () => {
  jest.resetModules();
  securityServiceMock.getRecentRuntimeSecurityEvents.mockResolvedValue(securityEvents);
  complianceServiceMock.getComplianceOverview.mockResolvedValue(complianceOverview);
  gdprServiceMock.getGdprSettings.mockResolvedValue(gdprSettings);
  ({ default: service } = await import('../../src/services/securityPrivacyFabricService.js'));
});

describe('securityPrivacyFabricService', () => {
  it('summarises security, compliance, and privacy posture', async () => {
    const snapshot = await service.getSecurityPrivacyFabricSnapshot({ limit: 10 });
    expect(snapshot.security.events).toHaveLength(2);
    expect(snapshot.compliance.frameworks.total).toBe(2);
    expect(snapshot.compliance.obligations.atRisk.length).toBeGreaterThan(0);
    expect(snapshot.privacy.dpo.email).toBe('privacy@gigvora.test');
    expect(snapshot.focus.recommendations.length).toBeGreaterThan(0);
    expect(snapshot.fabricScore).toBeLessThan(100);
    expect(['fortified', 'steady', 'watch', 'at-risk']).toContain(snapshot.posture);
  });

  it('returns defaults when dependent services fail', async () => {
    securityServiceMock.getRecentRuntimeSecurityEvents.mockRejectedValueOnce(new Error('events unavailable'));
    complianceServiceMock.getComplianceOverview.mockRejectedValueOnce(new Error('compliance offline'));
    gdprServiceMock.getGdprSettings.mockRejectedValueOnce(new Error('gdpr offline'));

    const snapshot = await service.getSecurityPrivacyFabricSnapshot({ limit: 6 });

    expect(snapshot.security.events).toEqual([]);
    expect(snapshot.compliance.frameworks.total).toBe(0);
    expect(snapshot.compliance.obligations.atRisk).toEqual([]);
    expect(snapshot.privacy.dpo.email).toBeNull();
    expect(typeof snapshot.fabricScore).toBe('number');
    expect(['fortified', 'steady', 'watch', 'at-risk']).toContain(snapshot.posture);
  });
});
