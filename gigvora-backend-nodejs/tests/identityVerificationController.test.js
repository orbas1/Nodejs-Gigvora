import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const upsertIdentityVerification = jest.fn();
const submitIdentityVerification = jest.fn();
const reviewIdentityVerification = jest.fn();
const getIdentityVerificationOverview = jest.fn();
const storeIdentityDocument = jest.fn();
const readIdentityDocument = jest.fn();

const complianceModule = new URL('../src/services/complianceService.js', import.meta.url);
const storageModule = new URL('../src/services/identityDocumentStorageService.js', import.meta.url);

jest.unstable_mockModule(complianceModule.pathname, () => ({
  upsertIdentityVerification,
  submitIdentityVerification,
  reviewIdentityVerification,
  getIdentityVerificationOverview,
}));

jest.unstable_mockModule(storageModule.pathname, () => ({
  storeIdentityDocument,
  readIdentityDocument,
}));

let overview;
let save;
let submit;
let review;
let downloadDocument;
let ValidationError;

beforeAll(async () => {
  ({ overview, save, submit, review, downloadDocument } = await import(
    '../src/controllers/identityVerificationController.js'
  ));
  ({ ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  upsertIdentityVerification.mockReset();
  submitIdentityVerification.mockReset();
  reviewIdentityVerification.mockReset();
  getIdentityVerificationOverview.mockReset();
  storeIdentityDocument.mockReset();
  readIdentityDocument.mockReset();
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('identityVerificationController.overview', () => {
  it('merges actor metadata and coerces filters', async () => {
    const snapshot = { current: null };
    getIdentityVerificationOverview.mockResolvedValue(snapshot);

    const req = {
      query: { userId: '44', profileId: '78', includeHistory: 'false', actorRoles: ['admin'] },
      headers: { 'x-roles': 'compliance, reviewer ', 'x-user-id': '91' },
    };
    const res = createResponse();

    await overview(req, res);

    expect(getIdentityVerificationOverview).toHaveBeenCalledWith(44, {
      profileId: 78,
      includeHistory: false,
      actorRoles: ['compliance', 'reviewer', 'admin'],
    });
    expect(res.json).toHaveBeenCalledWith(snapshot);
  });

  it('rejects requests without a resolvable user id', async () => {
    const req = { query: {} };
    const res = createResponse();
    await expect(overview(req, res)).rejects.toThrow(ValidationError);
    expect(getIdentityVerificationOverview).not.toHaveBeenCalled();
  });
});

describe('identityVerificationController.save', () => {
  it('normalises identifiers and returns the refreshed snapshot', async () => {
    const record = { toPublicObject: () => ({ id: 5 }) };
    const snapshot = { current: { status: 'pending' } };
    upsertIdentityVerification.mockResolvedValue(record);
    getIdentityVerificationOverview.mockResolvedValue(snapshot);

    const req = { body: { userId: '12', profileId: '34', actorRoles: ['admin'] } };
    const res = createResponse();

    await save(req, res);

    expect(upsertIdentityVerification).toHaveBeenCalledWith(12, req.body);
    expect(getIdentityVerificationOverview).toHaveBeenCalledWith(12, {
      profileId: 34,
      actorRoles: ['admin'],
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ record: { id: 5 }, snapshot });
  });

  it('requires a user identifier', async () => {
    const req = { body: { profileId: '2' } };
    const res = createResponse();

    await expect(save(req, res)).rejects.toThrow(ValidationError);
    expect(upsertIdentityVerification).not.toHaveBeenCalled();
  });
});

describe('identityVerificationController.submit', () => {
  it('reuses validation helpers for submissions', async () => {
    const record = { toPublicObject: () => ({ id: 9 }) };
    const snapshot = { current: { status: 'submitted' } };
    submitIdentityVerification.mockResolvedValue(record);
    getIdentityVerificationOverview.mockResolvedValue(snapshot);

    const req = { body: { actorId: '51', profileId: '33', actorRoles: [] } };
    const res = createResponse();

    await submit(req, res);

    expect(submitIdentityVerification).toHaveBeenCalledWith(51, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ record: { id: 9 }, snapshot });
  });
});

describe('identityVerificationController.review', () => {
  it('ensures identifiers are numeric before delegating', async () => {
    const record = { toPublicObject: () => ({ id: 7 }) };
    const snapshot = { current: { status: 'approved' } };
    reviewIdentityVerification.mockResolvedValue(record);
    getIdentityVerificationOverview.mockResolvedValue(snapshot);

    const req = { body: { userId: '77', profileId: '88', actorRoles: ['trust'] } };
    const res = createResponse();

    await review(req, res);

    expect(reviewIdentityVerification).toHaveBeenCalledWith(77, req.body);
    expect(res.json).toHaveBeenCalledWith({ record: { id: 7 }, snapshot });
  });
});

describe('identityVerificationController.downloadDocument', () => {
  it('validates the storage key', async () => {
    readIdentityDocument.mockResolvedValue({ key: 'identity/2024/doc.pdf' });
    const req = { query: { key: 'identity/2024/doc.pdf' } };
    const res = createResponse();

    await downloadDocument(req, res);

    expect(readIdentityDocument).toHaveBeenCalledWith('identity/2024/doc.pdf', {
      storageRoot: process.env.IDENTITY_DOCUMENT_STORAGE_PATH,
    });
    expect(res.json).toHaveBeenCalledWith({ key: 'identity/2024/doc.pdf' });
  });

  it('rejects missing keys', async () => {
    const req = { query: {} };
    const res = createResponse();

    await expect(downloadDocument(req, res)).rejects.toThrow(ValidationError);
    expect(readIdentityDocument).not.toHaveBeenCalled();
  });
});
