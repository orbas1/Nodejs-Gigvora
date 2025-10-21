import { jest } from '@jest/globals';

const actualZod = await import('../../node_modules/zod/index.js');
jest.unstable_mockModule('zod', () => actualZod);

const {
  adminOverviewUpdateSchema,
  adminEmailTestBodySchema,
  adminTwoFactorEnrollmentActionBodySchema,
  databaseConnectionTestSchema,
  gdprSettingsBodySchema,
} = await import('../../src/validation/schemas/adminSchemas.js');

describe('adminSchemas validation', () => {
  test('adminOverviewUpdateSchema normalizes complex profile payloads', () => {
    const payload = {
      firstName: '  Ada ',
      contactEmail: 'ADMIN@Example.COM ',
      languages: ['English', ' spanish', 'English'],
      focusAreas: [' Security ', 'Security'],
      preferredContactMethods: ['Email', 'sms'],
      links: [{ label: 'Docs', url: 'https://example.com/docs ' }],
    };

    const parsed = adminOverviewUpdateSchema.parse(payload);

    expect(parsed.firstName).toBe('Ada');
    expect(parsed.contactEmail).toBe('admin@example.com');
    expect(parsed.languages).toEqual(['English', 'spanish']);
    expect(parsed.focusAreas).toEqual(['Security']);
    expect(parsed.preferredContactMethods).toEqual(['Email', 'sms']);
    expect(parsed.links?.[0]).toMatchObject({ label: 'Docs', url: 'https://example.com/docs' });
  });

  test('adminOverviewUpdateSchema rejects invalid contactEmail', () => {
    expect(() => adminOverviewUpdateSchema.parse({ contactEmail: 'not-an-email' })).toThrow(
      /contactEmail must be a valid email address\./,
    );
  });

  test('adminEmailTestBodySchema requires at least one recipient', () => {
    expect(() => adminEmailTestBodySchema.parse({ subject: 'Weekly update' })).toThrow(
      /At least one recipient email is required\./,
    );
  });

  test('adminTwoFactorEnrollmentActionBodySchema strips unknown keys', () => {
    const parsed = adminTwoFactorEnrollmentActionBodySchema.parse({
      note: 'Approved after verification',
      metadata: { reviewer: 'admin-user' },
      extra: 'ignored',
    });

    expect(parsed).toEqual({ note: 'Approved after verification', metadata: { reviewer: 'admin-user' } });
  });

  test('databaseConnectionTestSchema lowercases enum fields', () => {
    const parsed = databaseConnectionTestSchema.parse({
      connectionId: '15',
      environment: 'PROD',
      role: 'READ',
      dialect: 'POSTGRES',
      sslMode: 'REQUIRE',
      options: { poolMax: 12 },
    });

    expect(parsed.environment).toBe('prod');
    expect(parsed.role).toBe('read');
    expect(parsed.dialect).toBe('postgres');
    expect(parsed.sslMode).toBe('require');
    expect(parsed.options).toEqual({ poolMax: 12 });
  });

  test('gdprSettingsBodySchema accepts nested policy collections', () => {
    const payload = {
      retentionPolicies: [
        { name: 'Customer data', retentionDays: 365, dataCategories: ['profiles'], autoDelete: true },
      ],
      processors: [{ name: 'AnalyticsCo', status: 'approved' }],
      consentFramework: { marketingOptInDefault: true, cookieRefreshMonths: 12 },
    };

    expect(() => gdprSettingsBodySchema.parse(payload)).not.toThrow();
  });
});
