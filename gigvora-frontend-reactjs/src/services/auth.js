import { apiClient } from './apiClient.js';
import { normaliseEmail } from '../utils/authHelpers.js';

function normaliseCredentials(credentials = {}) {
  if (typeof credentials === 'object' && credentials !== null) {
    return credentials;
  }
  throw new Error('Authentication credentials must be provided as an object.');
}

export async function requestAdminTwoFactor({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required for the admin sign-in challenge.');
  }
  return apiClient.post('/auth/admin/login', { email: normaliseEmail(email), password });
}

export async function verifyTwoFactorCode({ email, code }) {
  if (!email || !code) {
    throw new Error('Email and verification code are required.');
  }
  return apiClient.post('/auth/verify-2fa', { email: normaliseEmail(email), code });
}

export async function registerUser(payload) {
  return apiClient.post('/auth/register', {
    ...payload,
    email: normaliseEmail(payload?.email),
  });
}

export async function registerCompany(payload) {
  return apiClient.post('/auth/register/company', {
    ...payload,
    email: normaliseEmail(payload?.email),
  });
}

export async function registerAgency(payload) {
  return apiClient.post('/auth/register/agency', {
    ...payload,
    email: normaliseEmail(payload?.email),
  });
}

export async function requestPasswordReset(email) {
  if (!email) {
    throw new Error('Email is required to request a password reset.');
  }
  return apiClient.post('/auth/password/forgot', { email: normaliseEmail(email) });
}

export async function verifyPasswordResetToken(token) {
  if (!token) {
    throw new Error('A reset token is required to continue.');
  }
  return apiClient.post('/auth/password/verify', { token });
}

export async function resetPassword({ token, password }) {
  if (!token || !password) {
    throw new Error('Both the reset token and a new password are required.');
  }
  return apiClient.post('/auth/password/reset', { token, password });
}

export async function loginWithPassword({ email, password, scope } = {}) {
  if (!email || !password) {
    throw new Error('Email and password are required to sign in.');
  }
  const endpoint = scope === 'admin' ? '/auth/admin/login' : '/auth/login';
  return apiClient.post(endpoint, { email: normaliseEmail(email), password });
}

export async function adminLogin(credentials) {
  const normalised = normaliseCredentials(credentials);
  return loginWithPassword({ ...normalised, scope: 'admin' });
}

export async function verifyTwoFactor({ email, code, tokenId }) {
  if (!email || !code) {
    throw new Error('Email and verification code are required.');
  }
  return apiClient.post('/auth/verify-2fa', { email: normaliseEmail(email), code, tokenId });
}

export async function resendTwoFactor(tokenId) {
  if (!tokenId) {
    throw new Error('tokenId is required to resend the two-factor code.');
  }
  return apiClient.post('/auth/two-factor/resend', { tokenId });
}

export async function loginWithGoogle(idToken) {
  if (!idToken) {
    throw new Error('A Google ID token is required to continue.');
  }
  return apiClient.post('/auth/login/google', { idToken });
}

const authService = {
  requestAdminTwoFactor,
  verifyTwoFactorCode,
  registerUser,
  registerCompany,
  registerAgency,
  loginWithPassword,
  adminLogin,
  verifyTwoFactor,
  resendTwoFactor,
  loginWithGoogle,
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPassword,
};

export default authService;
