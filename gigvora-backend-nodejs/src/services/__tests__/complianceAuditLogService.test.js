import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

beforeAll(() => {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
});

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveModule = (specifier) => {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    return specifier;
  }
  return path.resolve(__dirname, specifier);
};

const withDefaultExport = (factory) => () => {
  const exports = factory();
  return Object.prototype.hasOwnProperty.call(exports, 'default') ? exports : { default: exports, ...exports };
};

const mockErrors = () => ({
  ValidationError: class ValidationError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
});

describe('complianceAuditLogService', () => {
  it('returns summary metrics with severity breakdown', async () => {
    const workspaceRecord = { id: 9, name: 'Lumen Analytics Talent', slug: 'lumen-analytics-ats' };

    const logRecords = [
      {
        get() {
          return {
            id: 1,
            workspaceId: 9,
            auditType: 'identity_review',
            status: 'in_progress',
            severityScore: 72.3,
            escalationLevel: 'priority',
            findingsCount: 2,
            openedAt: '2025-03-01T00:00:00.000Z',
            updatedAt: '2025-03-02T00:00:00.000Z',
            metadata: { seedKey: 'test' },
          };
        },
      },
      {
        get() {
          return {
            id: 2,
            workspaceId: 9,
            auditType: 'wallet_override',
            status: 'completed',
            severityScore: 92.1,
            escalationLevel: 'executive',
            findingsCount: 1,
            openedAt: '2025-02-01T00:00:00.000Z',
            updatedAt: '2025-02-10T00:00:00.000Z',
            metadata: { seedKey: 'test' },
          };
        },
      },
    ];

    const modelsMock = {
      ProviderWorkspace: {
        findByPk: jest.fn().mockResolvedValue(workspaceRecord),
      },
      ComplianceAuditLog: {
        findAll: jest.fn().mockResolvedValue(logRecords),
      },
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => modelsMock));
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), withDefaultExport(mockErrors));

    const { fetchComplianceAuditLogs } = await import('../complianceAuditLogService.js');

    const req = {
      query: { workspaceId: 9, status: ['in_progress'], severity: ['high', 'critical'] },
      user: { workspaceId: 9 },
    };

    const payload = await fetchComplianceAuditLogs(req, { limit: 50 });

    expect(modelsMock.ProviderWorkspace.findByPk).toHaveBeenCalledWith(9, expect.any(Object));
    expect(modelsMock.ComplianceAuditLog.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 9 }),
        limit: 50,
      }),
    );

    expect(payload.summary.total).toBe(2);
    expect(payload.summary.high).toBeGreaterThan(0);
    expect(payload.summary.critical).toBeGreaterThan(0);
    expect(payload.workspace.slug).toBe('lumen-analytics-ats');
  });
});
