import { apiClient } from './apiClient.js';

export async function fetchAdminDashboard(params = {}, options = {}) {
  const config = { params, ...options };
  return apiClient.get('/admin/dashboard', config);
}

export async function fetchAdCoupons(params = {}) {
  const response = await apiClient.get('/admin/ads/coupons', { params });
  return Array.isArray(response?.coupons) ? response.coupons : [];
}

export async function createAdCoupon(payload = {}) {
  return apiClient.post('/admin/ads/coupons', payload);
}

export async function updateAdCoupon(couponId, payload = {}) {
  if (!couponId) {
    throw new Error('couponId is required');
  }
  return apiClient.put(`/admin/ads/coupons/${couponId}`, payload);
}

export async function updateAdminOverview(payload = {}) {
  return apiClient.put('/admin/dashboard/overview', payload);
}

export default {
  fetchAdminDashboard,
  fetchAdCoupons,
  createAdCoupon,
  updateAdCoupon,
  updateAdminOverview,
};
