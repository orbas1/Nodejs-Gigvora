import { apiClient } from './apiClient.js';

function mergeParams(params = {}, options = {}) {
  const optionParams = options.params ?? {};
  return { ...optionParams, ...params };
}

export async function fetchAdminDashboard(params = {}, options = {}) {
  const config = { ...options, params: mergeParams(params, options) };
  return apiClient.get('/admin/dashboard', config);
}

export async function fetchAdCoupons(params = {}, options = {}) {
  const response = await apiClient.get('/admin/ads/coupons', {
    ...options,
    params: mergeParams(params, options),
  });
  return Array.isArray(response?.coupons) ? response.coupons : [];
}

export async function createAdCoupon(payload = {}, options = {}) {
  return apiClient.post('/admin/ads/coupons', payload, options);
}

export async function updateAdCoupon(couponId, payload = {}, options = {}) {
  if (!couponId) {
    throw new Error('couponId is required');
  }
  return apiClient.put(`/admin/ads/coupons/${couponId}`, payload, options);
}

export async function updateAdminOverview(payload = {}, options = {}) {
  return apiClient.put('/admin/dashboard/overview', payload, options);
}

export default {
  fetchAdminDashboard,
  fetchAdCoupons,
  createAdCoupon,
  updateAdCoupon,
  updateAdminOverview,
};
