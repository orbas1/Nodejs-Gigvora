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

const { apiClient } = await import('../apiClient.js');
const serviceHelpers = await import('../serviceHelpers.js');
const companySettings = await import('../companySettings.js');
const companySystemPreferences = await import('../companySystemPreferences.js');
const companyTimeline = await import('../companyTimeline.js');
const companyVolunteering = await import('../companyVolunteering.js');
const companyWallets = await import('../companyWallets.js');

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
    expect(apiClient.delete).not.toHaveBeenCalled();
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
