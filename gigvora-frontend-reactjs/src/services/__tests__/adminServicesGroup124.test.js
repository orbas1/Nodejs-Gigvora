import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiClientCache = new Map();

vi.mock('../apiClient.js', () => {
  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    readCache: vi.fn((key) => apiClientCache.get(key) ?? null),
    writeCache: vi.fn((key, value) => {
      apiClientCache.set(key, { data: value });
    }),
    removeCache: vi.fn((key) => {
      apiClientCache.delete(key);
    }),
  };
  return { apiClient, default: apiClient };
});

import { apiClient } from '../apiClient.js';
import { resetAdminServiceCaches } from '../adminServiceHelpers.js';
import * as adminFinance from '../adminFinance.js';
import * as adminFreelancers from '../adminFreelancers.js';
import * as adminHub from '../adminHub.js';
import * as adminIdentityVerification from '../adminIdentityVerification.js';
import * as adminJobPosts from '../adminJobPosts.js';
import * as adminMentoring from '../adminMentoring.js';
import * as adminMentors from '../adminMentors.js';
import * as adminMessaging from '../adminMessaging.js';
import * as adminProfiles from '../adminProfiles.js';
import * as adminProjectManagement from '../adminProjectManagement.js';
import * as adminSpeedNetworking from '../adminSpeedNetworking.js';
import * as adminStorage from '../adminStorage.js';
import * as adminTimelines from '../adminTimelines.js';
import * as adminTwoFactor from '../adminTwoFactor.js';
import * as adminUsers from '../adminUsers.js';
import * as adminVolunteering from '../adminVolunteering.js';
import * as adminWallet from '../adminWallet.js';

function seedSession() {
  const store = new Map();
  const localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage },
    configurable: true,
    writable: true,
  });
  localStorage.setItem('gigvora:web:session', JSON.stringify({ roles: ['super-admin'] }));
}

beforeEach(() => {
  apiClientCache.clear();
  vi.clearAllMocks();
  resetAdminServiceCaches();
  seedSession();
});

describe('adminFinance service', () => {
  it('caches dashboard responses', async () => {
    apiClient.get.mockResolvedValueOnce({ total: 10 });
    const first = await adminFinance.fetchFinanceDashboard({ lookbackDays: 30 });
    expect(first).toEqual({ total: 10 });
    await adminFinance.fetchFinanceDashboard({ lookbackDays: 30 });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates cache after fee rule changes', async () => {
    apiClient.get.mockResolvedValueOnce({ total: 10 });
    await adminFinance.fetchFinanceDashboard();
    apiClient.post.mockResolvedValue({ id: 1 });
    await adminFinance.createFeeRule({ name: 'Rule' });
    expect(apiClient.post).toHaveBeenCalledWith('/admin/finance/fee-rules', { name: 'Rule' }, {});
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminFreelancers service', () => {
  it('caches list results', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminFreelancers.listAdminFreelancers({ search: 'a' });
    await adminFreelancers.listAdminFreelancers({ search: 'a' });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches on update', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminFreelancers.listAdminFreelancers();
    apiClient.put.mockResolvedValue({});
    await adminFreelancers.updateAdminFreelancer(123, { status: 'active' });
    expect(apiClient.put).toHaveBeenCalledWith('/admin/freelancers/123', { status: 'active' }, {});
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminHub service', () => {
  it('caches overview calls', async () => {
    apiClient.get.mockResolvedValueOnce({ status: 'ok' });
    await adminHub.fetchAdminHubOverview({ lookbackDays: 7 });
    await adminHub.fetchAdminHubOverview({ lookbackDays: 7 });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('clears cache on sync trigger', async () => {
    apiClient.get.mockResolvedValueOnce({ status: 'ok' });
    await adminHub.fetchAdminHubOverview();
    apiClient.post.mockResolvedValue({});
    await adminHub.triggerAdminHubSync();
    expect(apiClient.post).toHaveBeenCalledWith('/admin/hub/sync', {}, {});
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminIdentityVerification service', () => {
  it('reuses cached request listings', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminIdentityVerification.fetchIdentityVerifications({ status: 'pending' });
    await adminIdentityVerification.fetchIdentityVerifications({ status: 'pending' });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches on event creation', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminIdentityVerification.fetchIdentityVerifications();
    apiClient.post.mockResolvedValue({});
    await adminIdentityVerification.createIdentityVerificationEvent(5, { type: 'note' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/verification/identity/requests/5/events',
      { type: 'note' },
      {},
    );
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminJobPosts service', () => {
  it('normalises list responses with caching', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [{ id: 1 }] });
    const first = await adminJobPosts.fetchAdminJobPosts({ page: 1 });
    expect(first.results).toHaveLength(1);
    await adminJobPosts.fetchAdminJobPosts({ page: 1 });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches after delete', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminJobPosts.fetchAdminJobPosts();
    apiClient.delete.mockResolvedValue({});
    await adminJobPosts.deleteAdminJobPost(99);
    expect(apiClient.delete).toHaveBeenCalledWith('/admin/jobs/posts/99', {
      params: { hardDelete: 'false' },
    });
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminMentoring service', () => {
  it('caches session listings', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminMentoring.fetchAdminMentoringSessions({ status: 'open' });
    await adminMentoring.fetchAdminMentoringSessions({ status: 'open' });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches on action creation', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminMentoring.fetchAdminMentoringSessions();
    apiClient.post.mockResolvedValue({});
    await adminMentoring.createAdminMentoringAction(1, { title: 'Review' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/mentoring/sessions/1/actions',
      { title: 'Review' },
      {},
    );
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminMentors service', () => {
  it('caches mentor listings', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminMentors.listAdminMentors({ status: 'active' });
    await adminMentors.listAdminMentors({ status: 'active' });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches when archiving a mentor', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminMentors.listAdminMentors();
    apiClient.delete.mockResolvedValue({});
    await adminMentors.archiveAdminMentor(3);
    expect(apiClient.delete).toHaveBeenCalledWith('/admin/mentors/3', {});
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminMessaging service', () => {
  it('caches inbox queries', async () => {
    apiClient.get.mockResolvedValueOnce({ threads: [] });
    await adminMessaging.fetchAdminInbox({ status: 'open' });
    await adminMessaging.fetchAdminInbox({ status: 'open' });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches after assigning support agent', async () => {
    apiClient.get.mockResolvedValueOnce({ threads: [] });
    await adminMessaging.fetchAdminInbox();
    apiClient.post.mockResolvedValue({});
    await adminMessaging.assignAdminSupportAgent(10, { agentId: 5 });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/messaging/threads/10/assign',
      { agentId: 5 },
      {},
    );
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminProfiles service', () => {
  it('caches profile listings', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminProfiles.fetchAdminProfiles({ search: 'smith' });
    await adminProfiles.fetchAdminProfiles({ search: 'smith' });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches when adding a note', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminProfiles.fetchAdminProfiles();
    apiClient.post.mockResolvedValue({});
    await adminProfiles.createAdminProfileNote(7, { body: 'Note' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/profiles/7/notes',
      { body: 'Note' },
      {},
    );
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminProjectManagement service', () => {
  it('caches project summary responses', async () => {
    apiClient.get.mockResolvedValueOnce({ total: 2 });
    await adminProjectManagement.fetchProjectSummary();
    await adminProjectManagement.fetchProjectSummary();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches on milestone creation', async () => {
    apiClient.get.mockResolvedValueOnce({ total: 2 });
    await adminProjectManagement.fetchProjectSummary();
    apiClient.post.mockResolvedValue({});
    await adminProjectManagement.createMilestone(4, { name: 'Kickoff' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/project-management/projects/4/milestones',
      { name: 'Kickoff' },
      {},
    );
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminSpeedNetworking service', () => {
  it('caches session listings', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminSpeedNetworking.fetchAdminSpeedNetworkingSessions({ status: 'open' });
    await adminSpeedNetworking.fetchAdminSpeedNetworkingSessions({ status: 'open' });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches after participant update', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminSpeedNetworking.fetchAdminSpeedNetworkingSessions();
    apiClient.patch.mockResolvedValue({});
    await adminSpeedNetworking.updateAdminSpeedNetworkingParticipant(8, 2, { status: 'confirmed' });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/admin/speed-networking/sessions/8/participants/2',
      { status: 'confirmed' },
      {},
    );
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminStorage service', () => {
  it('caches storage overview', async () => {
    apiClient.get.mockResolvedValueOnce({ usage: 42 });
    await adminStorage.fetchStorageOverview();
    await adminStorage.fetchStorageOverview();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches after location update', async () => {
    apiClient.get.mockResolvedValueOnce({ usage: 42 });
    await adminStorage.fetchStorageOverview();
    apiClient.put.mockResolvedValue({});
    await adminStorage.updateStorageLocation('loc-1', { active: true });
    expect(apiClient.put).toHaveBeenCalledWith(
      '/admin/storage/locations/loc-1',
      { active: true },
      {},
    );
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminTimelines service', () => {
  it('caches timeline detail', async () => {
    apiClient.get.mockResolvedValueOnce({ id: 1 });
    await adminTimelines.fetchAdminTimeline(1);
    await adminTimelines.fetchAdminTimeline(1);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches after reordering events', async () => {
    apiClient.get.mockResolvedValueOnce({ id: 1 });
    await adminTimelines.fetchAdminTimeline(1);
    apiClient.post.mockResolvedValue({});
    await adminTimelines.reorderAdminTimelineEvents(1, [3, 2, 1]);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/timelines/1/events/reorder',
      { order: [3, 2, 1] },
      {},
    );
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminTwoFactor service', () => {
  it('caches overview data', async () => {
    apiClient.get.mockResolvedValueOnce({ policies: [] });
    await adminTwoFactor.fetchTwoFactorOverview({ status: 'active' });
    await adminTwoFactor.fetchTwoFactorOverview({ status: 'active' });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches after deleting a policy', async () => {
    apiClient.get.mockResolvedValueOnce({ policies: [] });
    await adminTwoFactor.fetchTwoFactorOverview();
    apiClient.delete.mockResolvedValue({});
    await adminTwoFactor.deleteTwoFactorPolicy(6);
    expect(apiClient.delete).toHaveBeenCalledWith('/admin/security/two-factor/policies/6', {});
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminUsers service', () => {
  it('caches directory calls', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminUsers.fetchDirectory({ status: 'active' });
    await adminUsers.fetchDirectory({ status: 'active' });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches after updating roles', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminUsers.fetchDirectory();
    apiClient.put.mockResolvedValue({});
    await adminUsers.updateRoles(9, ['admin']);
    expect(apiClient.put).toHaveBeenCalledWith('/admin/users/9/roles', { roles: ['admin'] }, {});
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminVolunteering service', () => {
  it('caches program listings', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminVolunteering.fetchVolunteerPrograms({ status: 'draft' });
    await adminVolunteering.fetchVolunteerPrograms({ status: 'draft' });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches after deleting an assignment', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminVolunteering.fetchVolunteerPrograms();
    apiClient.delete.mockResolvedValue({});
    await adminVolunteering.deleteVolunteerAssignment(2, 3, 4);
    expect(apiClient.delete).toHaveBeenCalledWith(
      '/admin/volunteering/roles/2/shifts/3/assignments/4',
      {},
    );
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});

describe('adminWallet service', () => {
  it('caches wallet account listings', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminWallet.fetchWalletAccounts({ status: 'active' });
    await adminWallet.fetchWalletAccounts({ status: 'active' });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates caches after ledger entry creation', async () => {
    apiClient.get.mockResolvedValueOnce({ results: [] });
    await adminWallet.fetchWalletAccounts();
    apiClient.post.mockResolvedValue({});
    await adminWallet.createWalletLedgerEntry(5, { amount: 10 });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/wallets/accounts/5/ledger',
      { amount: 10 },
      {},
    );
    expect(apiClient.removeCache).toHaveBeenCalled();
  });
});
