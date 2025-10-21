import { describe, it, expect, vi, beforeEach } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
const patch = vi.fn();
const del = vi.fn();
const readCache = vi.fn();
const writeCache = vi.fn();
const removeCache = vi.fn();

class FormDataMock {
  constructor() {
    this.append = vi.fn();
  }
}

global.FormData = FormDataMock;

const apiClientMock = {
  get,
  post,
  put,
  patch,
  delete: del,
  readCache,
  writeCache,
  removeCache,
};

vi.mock('../apiClient.js', () => ({
  apiClient: apiClientMock,
  default: apiClientMock,
}));

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  put.mockReset();
  patch.mockReset();
  del.mockReset();
  readCache.mockReset();
  writeCache.mockReset();
  removeCache.mockReset();
});

describe('profile service', () => {
  it('throws when userId is missing', async () => {
    const { fetchProfile } = await import('../profile.js');
    await expect(fetchProfile('')).rejects.toThrow('userId');
  });

  it('returns cached profile when available and avoids network call', async () => {
    const cachedProfile = { id: 'p-1' };
    readCache.mockReturnValue({ data: cachedProfile, timestamp: new Date() });
    const { fetchProfile } = await import('../profile.js');
    const result = await fetchProfile('42');
    expect(result).toEqual(cachedProfile);
    expect(get).not.toHaveBeenCalled();
  });

  it('writes cache after fetching profile', async () => {
    readCache.mockReturnValue(null);
    get.mockResolvedValue({ id: 'p-2' });
    const { fetchProfile } = await import('../profile.js');
    const result = await fetchProfile('7', { force: true, params: { include: ' activity ' } });
    expect(result).toEqual({ id: 'p-2' });
    expect(get).toHaveBeenCalledWith('/users/7', { params: { include: 'activity', fresh: 'true' } });
    expect(writeCache).toHaveBeenCalledWith(expect.stringContaining('profiles:overview:7'), { id: 'p-2' }, expect.any(Number));
  });

  it('appends fresh query params when forcing refresh and merges request options', async () => {
    readCache.mockReturnValue(null);
    get.mockResolvedValue({ id: 'p-3' });
    const controller = new AbortController();
    const { fetchProfile } = await import('../profile.js');
    await fetchProfile('abc', {
      force: true,
      params: { include: ' stats ', page: 2, tags: [' design ', ''], active: false },
      headers: { 'x-debug': '1' },
      signal: controller.signal,
    });
    expect(get).toHaveBeenCalledWith(
      '/users/abc',
      {
        headers: { 'x-debug': '1' },
        params: { include: 'stats', page: 2, tags: 'design', active: 'false', fresh: 'true' },
        signal: controller.signal,
      },
    );
  });

  it('updates availability using the dedicated endpoint and refreshes the cache', async () => {
    const updated = { id: 'user-42', availability: { status: 'busy' } };
    patch.mockResolvedValue(updated);
    const { updateProfileAvailability } = await import('../profile.js');
    const result = await updateProfileAvailability('user-42', { status: 'busy' }, {
      headers: { 'x-scope': 'profile' },
    });
    expect(patch).toHaveBeenCalledWith(
      '/users/user-42/profile/availability',
      { status: 'busy' },
      { headers: { 'x-scope': 'profile' } },
    );
    expect(writeCache).toHaveBeenCalledWith('profiles:overview:user-42', updated, expect.any(Number));
    expect(result).toEqual(updated);
  });
});

describe('profile hub service', () => {
  it('validates userId before performing requests', async () => {
    const { fetchProfileHub } = await import('../profileHub.js');
    await expect(fetchProfileHub(null)).rejects.toThrow('userId');
  });

  it('uploads avatars using form data payloads', async () => {
    const { uploadProfileAvatar } = await import('../profileHub.js');
    post.mockImplementation(async (path, formData) => {
      expect(path).toBe('/users/123/profile/avatar');
      expect(formData).toBeInstanceOf(FormDataMock);
      expect(formData.append).toHaveBeenCalledWith('avatarUrl', 'https://cdn.example/avatar.png');
      return { id: '123' };
    });
    await uploadProfileAvatar('123', { avatarUrl: 'https://cdn.example/avatar.png' });
  });
});

describe('project gig management service', () => {
  it('rejects missing identifiers', async () => {
    const { updateProject } = await import('../projectGigManagement.js');
    await expect(updateProject('usr-1', '', {})).rejects.toThrow('projectId');
  });

  it('sends well-formed requests for project creation', async () => {
    const { createProject } = await import('../projectGigManagement.js');
    post.mockResolvedValue({ data: { id: 'pg-1' } });
    const payload = { name: 'Campaign', budget: 1000 };
    const result = await createProject('user-9', payload);
    expect(post).toHaveBeenCalledWith('/users/user-9/project-gig-management/projects', payload, undefined);
    expect(result).toEqual({ id: 'pg-1' });
  });
});

describe('projects service', () => {
  it('clamps event limits and forwards request options', async () => {
    const controller = new AbortController();
    get.mockResolvedValue({ events: [] });
    const { fetchProjectEvents } = await import('../projects.js');
    await fetchProjectEvents('  proj-1  ', { limit: 500, signal: controller.signal, headers: { 'x-scope': 'admin' } });
    expect(get).toHaveBeenCalledWith(
      '/projects/proj-1/events',
      { params: { limit: 100 }, headers: { 'x-scope': 'admin' }, signal: controller.signal },
    );
  });

  it('rejects missing conversation identifiers before posting messages', async () => {
    const { createProjectWorkspaceConversationMessage } = await import('../projects.js');
    expect(() => createProjectWorkspaceConversationMessage('proj-1', '   ', { body: 'hi' })).toThrow('conversationId');
  });

  it('encodes identifiers when sending workspace conversation messages', async () => {
    post.mockResolvedValue({});
    const { createProjectWorkspaceConversationMessage } = await import('../projects.js');
    await createProjectWorkspaceConversationMessage('proj 2', 'thread 1', { body: 'hello' }, { headers: { 'x-req': '1' } });
    expect(post).toHaveBeenCalledWith(
      '/projects/proj%202/workspace/conversations/thread%201/messages',
      { body: 'hello' },
      { headers: { 'x-req': '1' } },
    );
  });

  it('normalises delete payloads when removing workspace budgets', async () => {
    del.mockResolvedValue({});
    const { deleteProjectWorkspaceBudget } = await import('../projects.js');
    await deleteProjectWorkspaceBudget('proj-7', 'budget-9', null, { headers: { 'x-trace': '1' } });
    expect(del).toHaveBeenCalledWith(
      '/projects/proj-7/workspace/budgets/budget-9',
      { headers: { 'x-trace': '1' }, body: {} },
    );
  });
});

describe('project operations service', () => {
  it('normalises identifiers before calling the API', async () => {
    const { updateProjectTask } = await import('../projectOperations.js');
    patch.mockResolvedValue({});
    await updateProjectTask('55', '  12  ', { status: 'done' });
    expect(patch).toHaveBeenCalledWith('/projects/55/operations/tasks/12', { status: 'done' });
  });

  it('normalises empty payloads to objects', async () => {
    const { createProjectBudget } = await import('../projectOperations.js');
    post.mockResolvedValue({});
    await createProjectBudget('1', null);
    expect(post).toHaveBeenCalledWith('/projects/1/operations/budgets', {});
  });
});

describe('project workspace service', () => {
  it('builds nested resource paths safely', async () => {
    const { updateTaskAssignment } = await import('../projectWorkspace.js');
    patch.mockResolvedValue({});
    await updateTaskAssignment('77', '900', 'task-1', 'assign-44', { role: 'reviewer' });
    expect(patch).toHaveBeenCalledWith(
      '/users/77/project-workspace/projects/900/tasks/task-1/assignments/assign-44',
      { role: 'reviewer' },
    );
  });
});

describe('project workspace management service', () => {
  it('supports summary updates without a record identifier', async () => {
    const { updateWorkspaceRecord } = await import('../projectWorkspaceManagement.js');
    put.mockResolvedValue({});
    await updateWorkspaceRecord('700', 'summary', null, { notes: 'Updated' });
    expect(put).toHaveBeenCalledWith('/projects/700/workspace/management/summary', { notes: 'Updated' }, {});
  });
});

describe('support desk service', () => {
  it('returns cached snapshot when present', async () => {
    const cached = { tickets: 12 };
    readCache.mockReturnValue({ data: cached, timestamp: new Date() });
    const { getSupportDeskSnapshot } = await import('../supportDesk.js');
    const result = await getSupportDeskSnapshot(88);
    expect(result.fromCache).toBe(true);
    expect(get).not.toHaveBeenCalled();
    expect(result.data).toEqual(cached);
  });
});

describe('trust service', () => {
  it('rejects missing identifiers for escrow updates', async () => {
    const { updateEscrowAccount } = await import('../trust.js');
    await expect(updateEscrowAccount('', {})).rejects.toThrow('accountId');
  });

  it('normalises missing payloads for dispute templates', async () => {
    const { createDisputeTemplate } = await import('../trust.js');
    post.mockResolvedValue({ template: { id: 'tmp' } });
    const template = await createDisputeTemplate(null);
    expect(post).toHaveBeenCalledWith('/trust/disputes/templates', {}, {});
    expect(template).toEqual({ id: 'tmp' });
  });
});

describe('search service', () => {
  it('trims the query and applies safe limits', async () => {
    get.mockResolvedValue({ people: [] });
    const { searchPeople } = await import('../search.js');
    await searchPeople('  alice  ', { limit: 500 });
    expect(get).toHaveBeenCalledWith('/search', { params: { q: 'alice', limit: 50 }, signal: undefined });
  });
});

describe('admin configuration services', () => {
  it('validates SEO payload objects', async () => {
    const { updateSeoSettings } = await import('../seoSettings.js');
    await expect(updateSeoSettings(null)).rejects.toThrow('payload');
  });

  it('validates system settings payload objects', async () => {
    const { updateSystemSettings } = await import('../systemSettings.js');
    await expect(updateSystemSettings(null)).rejects.toThrow('payload');
  });

  it('validates site navigation updates', async () => {
    const { updateNavigationLink } = await import('../siteManagement.js');
    await expect(updateNavigationLink('', {})).rejects.toThrow('linkId');
  });
});

describe('public site service', () => {
  it('encodes slugs when fetching site pages', async () => {
    get.mockResolvedValue({ page: { slug: 'hello-world' } });
    const { fetchSitePage } = await import('../publicSite.js');
    await fetchSitePage(' hello world ');
    expect(get).toHaveBeenCalledWith('/site/pages/hello%20world', { params: {}, signal: undefined });
  });
});

describe('reputation service', () => {
  it('normalises review query parameters', async () => {
    const controller = new AbortController();
    get.mockResolvedValue({ reviews: [] });
    const { fetchFreelancerReviews } = await import('../reputation.js');
    await fetchFreelancerReviews(
      '  freelancer-5  ',
      { tags: [' top ', ''], limit: 999 },
      { signal: controller.signal },
    );
    expect(get).toHaveBeenCalledWith(
      '/reputation/freelancers/freelancer-5/reviews',
      { params: { tags: 'top', limit: 100 }, signal: controller.signal },
    );
  });

  it('validates payload objects when creating badges', async () => {
    const { createBadge } = await import('../reputation.js');
    await expect(createBadge('freelancer-1', 'invalid')).rejects.toThrow('Payload must be an object.');
  });

  it('encodes identifiers for reference verification', async () => {
    post.mockResolvedValue({});
    const { verifyReference } = await import('../reputation.js');
    await verifyReference('freelancer-3', 'ref 44', { status: 'verified' }, { headers: { 'x-test': '1' } });
    expect(post).toHaveBeenCalledWith(
      '/reputation/freelancers/freelancer-3/references/ref%2044/verify',
      { status: 'verified' },
      { headers: { 'x-test': '1' } },
    );
  });
});

describe('runtime telemetry service', () => {
  it('sanitises query parameters and honours abort signals', async () => {
    const controller = new AbortController();
    get.mockResolvedValue({});
    const { fetchRuntimeHealth } = await import('../runtimeTelemetry.js');
    await fetchRuntimeHealth({ limit: 500, search: '  latency  ', page: -2 }, { signal: controller.signal });
    expect(get).toHaveBeenCalledWith(
      '/admin/runtime/health',
      { params: { limit: 200, search: 'latency', page: 0 }, signal: controller.signal },
    );
  });
});

describe('security service', () => {
  it('rejects empty alert identifiers for acknowledgement', async () => {
    const { acknowledgeSecurityAlert } = await import('../security.js');
    await expect(acknowledgeSecurityAlert('   ')).rejects.toThrow('alert identifier');
  });

  it('enforces object payloads when triggering sweeps', async () => {
    const { triggerThreatSweep } = await import('../security.js');
    await expect(triggerThreatSweep('invalid')).rejects.toThrow('object');
  });
});

describe('rbac service', () => {
  it('normalises audit event query parameters', async () => {
    const controller = new AbortController();
    get.mockResolvedValue({ total: 10, limit: 10, offset: 0, events: [] });
    const { fetchRbacAuditEvents } = await import('../rbac.js');
    await fetchRbacAuditEvents({ limit: 999, roles: [' admin ', ''], page: -1 }, { signal: controller.signal });
    expect(get).toHaveBeenCalledWith(
      '/admin/governance/rbac/audit-events',
      { params: { limit: 200, roles: 'admin', page: 0 }, signal: controller.signal },
    );
  });

  it('trims decision payload identifiers and normalises roles', async () => {
    post.mockResolvedValue({ decision: 'allow' });
    const { simulateRbacDecision } = await import('../rbac.js');
    await simulateRbacDecision(
      {
        resource: ' projects ',
        action: 'view',
        subject: '   ',
        roles: [' owner ', null, ''],
        context: { region: 'us' },
      },
      { headers: { 'x-id': 'test' } },
    );
    expect(post).toHaveBeenCalledWith(
      '/admin/governance/rbac/simulate',
      { resource: 'projects', action: 'view', roles: ['owner'], context: { region: 'us' } },
      { headers: { 'x-id': 'test' } },
    );
  });
});

describe('user service', () => {
  it('encodes user identifiers and forwards headers', async () => {
    const controller = new AbortController();
    get.mockResolvedValue({ id: 'user-1' });
    const { fetchUser } = await import('../user.js');
    await fetchUser(' user/1 ', { signal: controller.signal, headers: { 'x-app': 'gigvora' } });
    expect(get).toHaveBeenCalledWith(
      '/users/user%2F1',
      { headers: { 'x-app': 'gigvora' }, signal: controller.signal },
    );
  });

  it('rejects non-object payloads for account updates', async () => {
    const { updateUserAccount } = await import('../user.js');
    await expect(updateUserAccount('user-1', null)).rejects.toThrow('object');
  });
});
