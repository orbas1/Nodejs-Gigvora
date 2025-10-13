import { apiClient } from './apiClient.js';

export async function adminLogin({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }
  return apiClient.post('/auth/admin/login', { email, password });
}

export async function verifyTwoFactor({ email, code }) {
  if (!email || !code) {
    throw new Error('Email and verification code are required.');
  }
  return apiClient.post('/auth/verify-2fa', { email, code });
}

export default {
  adminLogin,
  verifyTwoFactor,
};
