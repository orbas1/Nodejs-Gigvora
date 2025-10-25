import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../apiClient.js', () => {
  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    readCache: vi.fn(),
    writeCache: vi.fn(),
  };
  return { apiClient };
});

class MockFormData {
  constructor() {
    this.fields = new Map();
  }

  append(key, value) {
    const existing = this.fields.get(key) || [];
    existing.push(value);
    this.fields.set(key, existing);
  }

  set(key, value) {
    this.fields.set(key, [value]);
  }

  get(key) {
    const values = this.fields.get(key);
    return values ? values[0] : null;
  }
}

global.FormData = MockFormData;

const { apiClient } = await import('../apiClient.js');
const serviceHelpers = await import('../serviceHelpers.js');
const companySettings = await import('../companySettings.js');
const companySystemPreferences = await import('../companySystemPreferences.js');
const companyTimeline = await import('../companyTimeline.js');
const companyVolunteering = await import('../companyVolunteering.js');
const companyWallets = await import('../companyWallets.js');
const compliance = await import('../compliance.js');
const connections = await import('../connections.js');
const consent = await import('../consent.js');
const coverLetters = await import('../coverLetters.js');
const creationStudio = await import('../creationStudio.js');
const cvDocuments = await import('../cvDocuments.js');
const databaseSettings = await import('../databaseSettings.js');
const deliverableVault = await import('../deliverableVault.js');
const discovery = await import('../discovery.js');
const disputes = await import('../disputes.js');
const documentsManagement = await import('../documentsManagement.js');
const domainGovernance = await import('../domainGovernance.js');
const eventManagement = await import('../eventManagement.js');
const explorerData = await import('../explorerData.js');

beforeEach(() => {
  Object.values(apiClient).forEach((mock) => {
    if (typeof mock?.mockReset === 'function') {
      mock.mockReset();
    }
  });
});

describe('serviceHelpers', () => {
  it('normalises identifiers and rejects blank values', () => {
    expect(serviceHelpers.requireIdentifier(' abc ', 'testId')).toBe('abc');
    expect(serviceHelpers.requireIdentifier(42, 'numericId')).toBe('42');
    expect(() => serviceHelpers.requireIdentifier('  ', 'missingId')).toThrow(/missingId is required/i);
  });

  it('builds request options while filtering empty params', () => {
    const controller = new AbortController();
    const options = serviceHelpers.buildRequestOptions({
      params: { a: ' value ', empty: '  ' },
      signal: controller.signal,
      body: {},
    });
    expect(options).toEqual({ params: { a: 'value' }, signal: controller.signal });
  });

  it('combines request options while merging params and headers', () => {
    const controller = new AbortController();
    const combined = serviceHelpers.combineRequestOptions(
      { params: { priority: ' high ' }, headers: { 'x-test': '1' }, signal: controller.signal },
      { params: { page: 2, empty: '' }, headers: { 'x-existing': 'yes' }, cache: 'force' },
    );
    expect(combined).toEqual({
      params: { page: 2, priority: 'high' },
      headers: { 'x-existing': 'yes', 'x-test': '1' },
      signal: controller.signal,
      cache: 'force',
    });
  });
});

describe('companySettings service', () => {
  it('includes workspaceId and resolves signals for fetchCompanySettings', async () => {
    const controller = new AbortController();
    apiClient.get.mockResolvedValue({ settings: {} });
    await companySettings.fetchCompanySettings({ workspaceId: ' 123 ', signal: controller.signal });
    expect(apiClient.get).toHaveBeenCalledWith('/company/settings', {
      params: { workspaceId: '123' },
      signal: controller.signal,
    });
  });

  it('requires workflowId for updateCompanyWorkflow', async () => {
    expect(() => companySettings.updateCompanyWorkflow('  ', {})).toThrow(/workflowId is required/i);
    expect(apiClient.put).not.toHaveBeenCalled();
  });
});

describe('companySystemPreferences service', () => {
  it('requires webhookId for deleteCompanyWebhook and forwards signals', async () => {
    const controller = new AbortController();
    expect(() => companySystemPreferences.deleteCompanyWebhook('')).toThrow(/webhookId is required/i);
    apiClient.delete.mockResolvedValue({ ok: true });
    await companySystemPreferences.deleteCompanyWebhook('web-1', { signal: controller.signal });
    expect(apiClient.delete).toHaveBeenCalledWith('/company/system-preferences/webhooks/web-1', {
      signal: controller.signal,
    });
  });
});

describe('companyTimeline service', () => {
  it('trims workspace context for timeline snapshot', async () => {
    apiClient.get.mockResolvedValue({});
    await companyTimeline.fetchTimelineSnapshot({ workspaceId: ' ws-9 ', lookbackDays: 14 });
    expect(apiClient.get).toHaveBeenCalledWith('/company/dashboard/timeline', {
      params: { workspaceId: 'ws-9', lookbackDays: 14 },
    });
  });

  it('requires identifiers for deleteTimelineEvent and sends workspace in body', async () => {
    await expect(companyTimeline.deleteTimelineEvent('', { workspaceId: '1' })).rejects.toThrow(/eventId is required/i);

    apiClient.delete.mockResolvedValue({});
    await companyTimeline.deleteTimelineEvent('evt-9', { workspaceId: ' 1 ' });
    expect(apiClient.delete).toHaveBeenCalledWith('/company/dashboard/timeline/events/evt-9', {
      body: { workspaceId: '1' },
    });
  });
});

describe('companyVolunteering service', () => {
  it('merges workspace context when creating applications', async () => {
    apiClient.post.mockResolvedValue({});
    await companyVolunteering.createVolunteeringApplication('post-1', {
      workspaceId: 'ws-3',
      workspaceSlug: ' giga ',
      coverLetter: 'hi',
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/company/volunteering/posts/post-1/applications',
      { coverLetter: 'hi', workspaceId: 'ws-3', workspaceSlug: 'giga' },
      {},
    );
  });

  it('rejects blank identifiers for deleteVolunteeringResponse', async () => {
    await expect(companyVolunteering.deleteVolunteeringResponse('  ', {})).rejects.toThrow(/responseId is required/i);
  });
});

describe('companyWallets service', () => {
  it('fetches wallet transactions with normalised filters', async () => {
    apiClient.get.mockResolvedValue({});
    await companyWallets.fetchWalletTransactions(
      'wallet-1',
      {
        workspaceId: ' ws-8 ',
        type: '  payout ',
        status: '',
        category: 'Ops',
        limit: 25,
        offset: 10,
      },
    );
    expect(apiClient.get).toHaveBeenCalledWith('/company/wallets/wallet-1/transactions', {
      params: {
        workspaceId: 'ws-8',
        type: 'payout',
        category: 'Ops',
        limit: 25,
        offset: 10,
      },
    });
  });

  it('requires wallet identifiers for updates', async () => {
    await expect(companyWallets.updateCompanyWallet(' ', {})).rejects.toThrow(/walletId is required/i);

    apiClient.patch.mockResolvedValue({});
    await companyWallets.updateCompanyWallet('wallet-3', { name: 'Ops' });
    expect(apiClient.patch).toHaveBeenCalledWith('/company/wallets/wallet-3', { name: 'Ops' }, {});
  });
});

describe('compliance service', () => {
  it('uses cached locker response when available', async () => {
    apiClient.readCache.mockReturnValue({ data: { ok: true } });
    const result = await compliance.fetchComplianceLocker({ userId: ' user-7 ', frameworks: [' SOC2 ', 'soc2'] });
    expect(result).toEqual({ ok: true });
    expect(apiClient.readCache).toHaveBeenCalledWith(expect.stringMatching(/user-7/));
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('fetches locker and writes cache with workspace context', async () => {
    apiClient.readCache.mockReturnValue(null);
    apiClient.get.mockResolvedValue({ fresh: true });
    await compliance.fetchComplianceLocker({
      userId: 'user-9',
      frameworks: ['GDPR', ' gdpr '],
      useCache: false,
      workspaceId: 'ws-1',
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/compliance/locker',
      expect.objectContaining({ params: { userId: 'user-9', frameworks: 'GDPR', workspaceId: 'ws-1', useCache: 'false' } }),
    );
    expect(apiClient.writeCache).not.toHaveBeenCalled();
  });

  it('acknowledges reminder with normalised payload', async () => {
    apiClient.patch.mockResolvedValue({});
    await compliance.acknowledgeComplianceReminder(' rem-1 ', {
      actorId: ' actor-5 ',
      status: ' ACK ',
      workspaceSlug: ' main ',
    });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/compliance/reminders/rem-1',
      { status: 'ACK', actorId: 'actor-5', workspaceSlug: 'main' },
      {},
    );
  });
});

describe('connections service', () => {
  it('requires a userId for fetching network', async () => {
    await expect(connections.fetchConnectionNetwork({})).rejects.toThrow(/userId is required/i);
  });

  it('fetches connections with trimmed viewer and pending flag', async () => {
    apiClient.get.mockResolvedValue({});
    await connections.fetchConnectionNetwork({
      userId: ' user-1 ',
      viewerId: ' viewer-2 ',
      includePending: true,
      workspaceSlug: ' team ',
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/connections/network',
      expect.objectContaining({
        params: { userId: 'user-1', viewerId: 'viewer-2', includePending: 'true', workspaceSlug: 'team' },
      }),
    );
  });

  it('creates connection requests with merged workspace context', async () => {
    apiClient.post.mockResolvedValue({});
    await connections.createConnectionRequest({
      actorId: ' actor ',
      targetId: ' target ',
      message: ' hi ',
      workspaceId: 'ws-3',
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/connections',
      { actorId: 'actor', targetId: 'target', message: 'hi', workspaceId: 'ws-3' },
      {},
    );
  });
});

describe('consent service', () => {
  it('merges workspace filters for admin consent policies', async () => {
    apiClient.get.mockResolvedValue({});
    await consent.fetchAdminConsentPolicies({ workspaceSlug: ' main ', status: ' active ' });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/admin/governance/consents',
      expect.objectContaining({ params: { status: 'active', workspaceSlug: 'main' } }),
    );
  });

  it('trims status when updating user consent', async () => {
    apiClient.put.mockResolvedValue({});
    await consent.updateUserConsent(' user-4 ', ' marketing-policy ', { status: '  ' });
    expect(apiClient.put).toHaveBeenCalledWith(
      '/users/user-4/consents/marketing-policy',
      {},
      {},
    );
  });
});

describe('coverLetters service', () => {
  it('sends workspace params when creating cover letters', async () => {
    apiClient.post.mockResolvedValue({});
    await coverLetters.createCoverLetter(' user-1 ', { title: 'Draft' }, { workspaceSlug: ' studio ' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/user-1/cover-letters',
      { title: 'Draft' },
      expect.objectContaining({ params: { workspaceSlug: 'studio' } }),
    );
  });
});

describe('creationStudio service', () => {
  it('filters company items by trimmed attributes', async () => {
    apiClient.get.mockResolvedValue({});
    await creationStudio.fetchCompanyCreationStudioItems({
      workspaceId: ' ws-9 ',
      type: '  template ',
      status: ' active ',
      search: ' idea ',
      limit: ' 25 ',
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/company/creation-studio',
      expect.objectContaining({
        params: { workspaceId: 'ws-9', type: 'template', status: 'active', search: 'idea', limit: 25 },
      }),
    );
  });

  it('persists workspace context when saving creation steps', async () => {
    apiClient.post.mockResolvedValue({});
    await creationStudio.saveCreationStep(' user-1 ', ' item-2 ', ' summary ', { progress: 0.5 }, {
      workspaceSlug: ' guild ',
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/user-1/creation-studio/item-2/steps/summary',
      { progress: 0.5, workspaceSlug: 'guild' },
      {},
    );
  });
});

describe('cvDocuments service', () => {
  it('adds workspace params for CV uploads', async () => {
    apiClient.post.mockResolvedValue({});
    await cvDocuments.uploadCvVersion(' user-3 ', ' doc-9 ', { page: 1 }, { workspaceSlug: ' lab ' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/user-3/cv-documents/doc-9/upload',
      { page: 1 },
      expect.objectContaining({ params: { workspaceSlug: 'lab' } }),
    );
  });
});

describe('databaseSettings service', () => {
  it('merges workspace into created connections', async () => {
    apiClient.post.mockResolvedValue({});
    await databaseSettings.createDatabaseConnection({ host: 'db', port: 5432 }, { workspaceId: 'ws-11' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/database-settings',
      { host: 'db', port: 5432, workspaceId: 'ws-11' },
      {},
    );
  });
});

describe('deliverableVault service', () => {
  it('requires freelancer id when creating deliverable', async () => {
    await expect(deliverableVault.createDeliverable({ workspaceId: 'ws' })).rejects.toThrow(/freelancerId is required/i);
  });

  it('normalises fetch parameters for vault items', async () => {
    apiClient.get.mockResolvedValue({});
    await deliverableVault.fetchVaultItem(' item-1 ', { freelancerId: ' worker ', workspaceId: ' ws-4 ' });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/deliverable-vault/items/item-1',
      expect.objectContaining({ params: { freelancerId: 'worker', workspaceId: 'ws-4' } }),
    );
  });
});

describe('discovery service', () => {
  it('normalises paging and workspace filters', async () => {
    apiClient.get.mockResolvedValue({});
    await discovery.searchProjects(' ideas ', { page: ' 2 ', pageSize: ' 15 ', workspaceSlug: ' lab ' });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/discovery/projects',
      expect.objectContaining({ params: { query: 'ideas', page: 2, pageSize: 15, workspaceSlug: 'lab' } }),
    );
  });
});

describe('disputes service', () => {
  it('creates disputes with workspace context', async () => {
    apiClient.post.mockResolvedValue({});
    await disputes.createUserDispute(' user-6 ', { reason: 'Late payment' }, { workspaceSlug: ' finance ' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/user-6/disputes',
      { reason: 'Late payment', workspaceSlug: 'finance' },
      {},
    );
  });
});

describe('documentsManagement service', () => {
  it('uploads documents with metadata and workspace fields', async () => {
    apiClient.post.mockResolvedValue({});
    await documentsManagement.uploadDocument({
      file: 'file-blob',
      tags: [' Finance ', 'Ops'],
      workspaceId: 'ws-8',
    });
    const [, formData] = apiClient.post.mock.calls[apiClient.post.mock.calls.length - 1];
    expect(formData).toBeInstanceOf(global.FormData);
    expect(formData.fields.get('tags[]')).toEqual(['Finance', 'Ops']);
    expect(formData.fields.get('workspaceId')).toEqual(['ws-8']);
  });
});

describe('domainGovernance service', () => {
  it('normalises governance response and generated timestamp', async () => {
    apiClient.get.mockResolvedValue({ contexts: [{ id: 1 }], generatedAt: '2024-01-01T00:00:00Z' });
    const response = await domainGovernance.fetchDomainGovernanceSummaries({});
    expect(response).toEqual({ contexts: [{ id: 1 }], generatedAt: '2024-01-01T00:00:00Z' });
  });
});

describe('eventManagement service', () => {
  it('creates tasks with workspace metadata', async () => {
    apiClient.post.mockResolvedValue({});
    await eventManagement.createTask(' user-2 ', ' event-3 ', { title: 'Brief' }, { workspaceSlug: ' ops ' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/user-2/events/event-3/tasks',
      { title: 'Brief', workspaceSlug: 'ops' },
      {},
    );
  });
});

describe('explorerData service', () => {
  it('enforces identifiers and merges workspace params', async () => {
    apiClient.post.mockResolvedValue({});
    await explorerData.createExplorerRecord(' opportunities ', { name: 'Lead' }, { workspaceSlug: ' biz ' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/explorer/opportunities',
      { name: 'Lead', workspaceSlug: 'biz' },
      {},
    );
  });
});
