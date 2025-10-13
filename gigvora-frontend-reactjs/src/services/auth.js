import { apiClient } from './apiClient.js';

export function requestAdminTwoFactor({ email, password }) {
  return apiClient.post('/auth/admin/login', { email, password });
}

export function verifyTwoFactorCode({ email, code }) {
  return apiClient.post('/auth/verify-2fa', { email, code });
}

export default {
  requestAdminTwoFactor,
  verifyTwoFactorCode,
};
