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

const mockErrors = () => ({
  ValidationError: class ValidationError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
});

const withDefaultExport = (factory) => () => {
  const exports = factory();
  return Object.prototype.hasOwnProperty.call(exports, 'default') ? exports : { default: exports, ...exports };
};

describe('taxDocumentService', () => {
  it('aggregates filings, documents, and reminders into a compliance snapshot', async () => {
    const filings = [
      {
        id: 10,
        freelancerId: 5,
        name: 'US 1040',
        jurisdiction: 'United States',
        dueDate: '2025-04-10T00:00:00.000Z',
        status: 'in_progress',
        submittedAt: null,
        metadata: { taxYear: 2024, amount: 3200 },
        toPublicObject() {
          return this;
        },
      },
    ];

    const complianceDocument = {
      id: 77,
      storagePath: 'tax/2025/us-annual.pdf',
      latestVersionId: 91,
      title: 'US Annual Return',
      storageProvider: 'filesystem',
      metadata: { taxFilingId: 10, taxYear: 2024 },
      jurisdiction: 'United States',
      toPublicObject() {
        return this;
      },
    };

    const reminder = {
      id: 301,
      documentId: 77,
      reminderType: 'submission_deadline',
      dueAt: '2025-04-05T00:00:00.000Z',
      status: 'scheduled',
      metadata: { seedKey: 'unit-test' },
      toPublicObject() {
        return this;
      },
    };

    const modelsMock = {
      sequelize: {
        transaction: jest.fn((handler) => handler()),
      },
      FreelancerTaxFiling: {
        findAll: jest.fn().mockResolvedValue(filings),
      },
      FreelancerTaxEstimate: {
        findAll: jest.fn().mockResolvedValue([
          {
            id: 9,
            freelancerId: 5,
            dueDate: '2025-03-15',
            amount: 2800,
            currencyCode: 'USD',
            status: 'due_soon',
            notes: null,
            metadata: null,
            toPublicObject() {
              return this;
            },
          },
        ]),
      },
      ComplianceDocument: {
        findAll: jest.fn().mockResolvedValue([complianceDocument]),
      },
      ComplianceDocumentVersion: {
        max: jest.fn(),
        create: jest.fn(),
      },
      ComplianceReminder: {
        findAll: jest.fn().mockResolvedValue([reminder]),
      },
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => modelsMock));
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), withDefaultExport(mockErrors));
    jest.unstable_mockModule(resolveModule('../taxDocumentStorageService.js'), () => ({
      storeTaxDocument: jest.fn(),
      readTaxDocument: jest.fn(),
      default: { storeTaxDocument: jest.fn(), readTaxDocument: jest.fn() },
    }));

    const { listTaxDocuments } = await import('../taxDocumentService.js');

    const payload = await listTaxDocuments(5, { lookbackYears: 3 });

    expect(modelsMock.FreelancerTaxFiling.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ freelancerId: 5 }),
      }),
    );

    expect(payload.freelancerId).toBe(5);
    expect(payload.documents).toHaveLength(1);
    expect(payload.documents[0]).toEqual(
      expect.objectContaining({
        filingId: 10,
        documentId: 77,
        requiresAction: true,
        reminders: expect.arrayContaining([expect.objectContaining({ id: 301 })]),
      }),
    );
    expect(payload.summary.totalFilings).toBe(1);
    expect(payload.summary.outstandingFilings).toBe(1);
    expect(payload.estimates).toHaveLength(1);
  });
});
