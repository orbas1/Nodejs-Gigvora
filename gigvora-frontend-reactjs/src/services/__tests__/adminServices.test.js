import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../apiClient.js', async () => {
  const requestSpy = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  return {
    apiClient: requestSpy,
    default: requestSpy,
  };
});

const { apiClient } = await import('../apiClient.js');
const adminService = await import('../admin.js');
const adminAds = await import('../adminAdsSettings.js');
const adminAgency = await import('../adminAgencyManagement.js');
const adminApi = await import('../adminApi.js');
const adminCalendar = await import('../adminCalendar.js');
const adminCompany = await import('../adminCompanyManagement.js');

beforeEach(() => {
  Object.values(apiClient).forEach((fn) => fn.mockClear());
});

describe('admin services', () => {
  it('fetches admin dashboard with params', async () => {
    await adminService.fetchAdminDashboard({ team: 'ops' }, { headers: { test: true } });
    expect(apiClient.get).toHaveBeenCalledWith('/admin/dashboard', {
      params: { team: 'ops' },
      headers: { test: true },
    });
  });

  it('returns coupons array safely', async () => {
    apiClient.get.mockResolvedValueOnce({ coupons: [{ id: 1 }] });
    const coupons = await adminService.fetchAdCoupons();
    expect(coupons).toEqual([{ id: 1 }]);

    apiClient.get.mockResolvedValueOnce({});
    const emptyCoupons = await adminService.fetchAdCoupons();
    expect(emptyCoupons).toEqual([]);
  });

  it('merges params when fetching coupons', async () => {
    apiClient.get.mockResolvedValueOnce({ coupons: [] });
    await adminService.fetchAdCoupons(
      { page: 2 },
      { params: { limit: 25 }, headers: { Authorization: 'Bearer token' } },
    );

    expect(apiClient.get).toHaveBeenLastCalledWith('/admin/ads/coupons', {
      headers: { Authorization: 'Bearer token' },
      params: { limit: 25, page: 2 },
    });
  });

  it('validates coupon update requires id', async () => {
    await expect(adminService.updateAdCoupon()).rejects.toThrow('couponId is required');
  });

  it('delegates coupon update when id provided', async () => {
    await adminService.updateAdCoupon('abc', { value: 10 });
    expect(apiClient.put).toHaveBeenCalledWith('/admin/ads/coupons/abc', { value: 10 }, {});
  });

  it('updates admin overview with request options', async () => {
    await adminService.updateAdminOverview({ highlight: true }, { headers: { 'x-test': '1' } });
    expect(apiClient.put).toHaveBeenCalledWith('/admin/dashboard/overview', { highlight: true }, {
      headers: { 'x-test': '1' },
    });
  });

  it('saves ads surfaces with validation', async () => {
    await expect(adminAds.saveAdSurface()).rejects.toThrow('surface is required');
    await adminAds.saveAdSurface('homepage', { enabled: true });
    expect(apiClient.put).toHaveBeenCalledWith('/admin/ads/settings/surfaces/homepage', { enabled: true }, {});
  });

  it('validates ad placement removal', async () => {
    await expect(adminAds.deleteAdPlacement()).rejects.toThrow('placementId is required');
  });

  it('requires agency id for updates', () => {
    expect(() => adminAgency.updateAdminAgency()).toThrow('agencyId is required');
  });

  it('updates agency when id supplied', async () => {
    await adminAgency.updateAdminAgency('42', { status: 'active' });
    expect(apiClient.put).toHaveBeenCalledWith('/admin/agencies/42', { status: 'active' }, {});
  });

  it('validates API provider updates', async () => {
    expect(() => adminApi.updateApiProvider()).toThrow('providerId is required');
    await adminApi.updateApiProvider('provider-1', { name: 'Provider' });
    expect(apiClient.put).toHaveBeenCalledWith('/admin/api/providers/provider-1', { name: 'Provider' }, {});
  });

  it('guards API client key operations', async () => {
    expect(() => adminApi.issueApiClientKey()).toThrow('clientId is required');
    await adminApi.issueApiClientKey('client-1', { scopes: ['calendar:view'] });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/api/clients/client-1/keys',
      { scopes: ['calendar:view'] },
      {},
    );

    expect(() => adminApi.revokeApiClientKey()).toThrow('clientId is required');
    expect(() => adminApi.revokeApiClientKey('client-1')).toThrow('keyId is required');
    await adminApi.revokeApiClientKey('client-1', 'key-9');
    expect(apiClient.delete).toHaveBeenCalledWith('/admin/api/clients/client-1/keys/key-9', {});
  });

  it('validates webhook rotation requires clientId', async () => {
    expect(() => adminApi.rotateWebhookSecret()).toThrow('clientId is required');
    await adminApi.rotateWebhookSecret('client-1');
    expect(apiClient.post).toHaveBeenCalledWith('/admin/api/clients/client-1/webhook/rotate', {}, {});
  });

  it('validates client audit fetch requires clientId', async () => {
    expect(() => adminApi.fetchClientAuditEvents()).toThrow('clientId is required');
    await adminApi.fetchClientAuditEvents('client-2', { limit: 10 });
    expect(apiClient.get).toHaveBeenCalledWith('/admin/api/clients/client-2/audit-events', {
      params: { limit: 10 },
    });
  });

  it('validates usage recording', async () => {
    expect(() => adminApi.recordClientUsage()).toThrow('clientId is required');
    await adminApi.recordClientUsage('client-3', { units: 4 });
    expect(apiClient.post).toHaveBeenCalledWith('/admin/api/clients/client-3/usage', { units: 4 }, {});
  });

  it('requires calendar identifiers', async () => {
    await expect(adminCalendar.updateAdminCalendarAccount()).rejects.toThrow('accountId is required');
    await adminCalendar.updateAdminCalendarAccount('acc-1', { timezone: 'UTC' });
    expect(apiClient.put).toHaveBeenCalledWith('/admin/calendar/accounts/acc-1', { timezone: 'UTC' });
  });

  it('requires company identifiers for updates', async () => {
    expect(() => adminCompany.updateAdminCompany()).toThrow('companyId is required');
    await adminCompany.updateAdminCompany('comp-1', { tier: 'pro' });
    expect(apiClient.put).toHaveBeenCalledWith('/admin/companies/comp-1', { tier: 'pro' }, {});
  });
});
