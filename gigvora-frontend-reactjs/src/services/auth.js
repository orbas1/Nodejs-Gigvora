import apiClient from './apiClient.js';

export async function registerUser(payload) {
  return apiClient.post('/auth/register', payload);
}

export async function registerCompany(payload) {
  return apiClient.post('/auth/register/company', payload);
}

export async function registerAgency(payload) {
  return apiClient.post('/auth/register/agency', payload);
}

export async function loginWithPassword({ email, password, scope } = {}) {
  const endpoint = scope === 'admin' ? '/auth/admin/login' : '/auth/login';
  return apiClient.post(endpoint, { email, password });
}

export async function verifyTwoFactor({ email, code, tokenId }) {
  return apiClient.post('/auth/verify-2fa', { email, code, tokenId });
}

export async function resendTwoFactor(tokenId) {
  return apiClient.post('/auth/two-factor/resend', { tokenId });
}

export async function loginWithGoogle(idToken) {
  return apiClient.post('/auth/login/google', { idToken });
}

export default {
  registerUser,
  registerCompany,
  registerAgency,
  loginWithPassword,
  verifyTwoFactor,
  resendTwoFactor,
  loginWithGoogle,
};
