import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const createLegalDocument = jest.fn();

const serviceModule = new URL('../src/services/legalPolicyService.js', import.meta.url);

jest.unstable_mockModule(serviceModule.pathname, () => ({
  listLegalDocuments: jest.fn(),
  getLegalDocument: jest.fn(),
  createLegalDocument,
  updateLegalDocument: jest.fn(),
  createDocumentVersion: jest.fn(),
  updateDocumentVersion: jest.fn(),
  publishDocumentVersion: jest.fn(),
  activateDocumentVersion: jest.fn(),
  archiveDocumentVersion: jest.fn(),
}));

let controller;
let AuthorizationError;

beforeAll(async () => {
  controller = await import('../src/controllers/legalPolicyController.js');
  ({ AuthorizationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
});

describe('legalPolicyController.store', () => {
  it('requires administrative privileges', async () => {
    await expect(controller.store({ body: {}, user: { id: 1 } }, {})).rejects.toThrow(AuthorizationError);
    expect(createLegalDocument).not.toHaveBeenCalled();
  });
});
