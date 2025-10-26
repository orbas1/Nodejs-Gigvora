export const DASHBOARD_ROUTES = Object.freeze({
  admin: '/dashboard/admin',
  agency: '/dashboard/agency',
  company: '/dashboard/company',
  freelancer: '/dashboard/freelancer',
  headhunter: '/dashboard/headhunter',
  mentor: '/dashboard/mentor',
  user: '/feed',
});

const REMEMBERED_LOGIN_STORAGE_KEY = 'gigvora:web:auth:remembered-login';

export function resolveLanding(session, fallback = '/feed') {
  if (!session) {
    return fallback;
  }

  const key = session.primaryDashboard ?? session.memberships?.[0];
  return DASHBOARD_ROUTES[key] ?? fallback;
}

export function normaliseEmail(value) {
  if (value == null) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

function getStorage() {
  if (typeof window === 'undefined' || !window?.localStorage) {
    return null;
  }
  return window.localStorage;
}

export function loadRememberedLogin() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(REMEMBERED_LOGIN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.email) {
      return null;
    }
    return {
      email: normaliseEmail(parsed.email),
      savedAt: parsed.savedAt ? Number(parsed.savedAt) : null,
    };
  } catch (error) {
    console.warn('Unable to read remembered login details', error);
    return null;
  }
}

export function saveRememberedLogin(email) {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  const value = normaliseEmail(email);
  if (!value) {
    storage.removeItem(REMEMBERED_LOGIN_STORAGE_KEY);
    return;
  }
  try {
    storage.setItem(
      REMEMBERED_LOGIN_STORAGE_KEY,
      JSON.stringify({ email: value, savedAt: Date.now() }),
    );
  } catch (error) {
    console.warn('Unable to persist remembered login details', error);
  }
}

export function clearRememberedLogin() {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(REMEMBERED_LOGIN_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear remembered login details', error);
  }
}

function getAuthBaseUrl() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, '');
  return apiBase.replace(/\/api$/, '');
}

const SOCIAL_AUTH_ENDPOINTS = Object.freeze({
  login: Object.freeze({
    x: '/auth/x/login',
    linkedin: '/auth/linkedin/login',
    facebook: '/auth/facebook/login',
  }),
  register: Object.freeze({
    x: '/auth/x/register',
    linkedin: '/auth/linkedin/register',
    facebook: '/auth/facebook/register',
  }),
});

export function resolveSocialAuthPath(provider, intent = 'login') {
  const scope = intent === 'register' ? 'register' : 'login';
  return SOCIAL_AUTH_ENDPOINTS[scope]?.[provider] ?? null;
}

export function buildSocialAuthUrl(provider, intent = 'login') {
  const path = resolveSocialAuthPath(provider, intent);
  if (!path) {
    return null;
  }
  return `${getAuthBaseUrl()}${path}`;
}

export function redirectToSocialAuth(provider, intent = 'login') {
  const url = buildSocialAuthUrl(provider, intent);
  if (!url) {
    return null;
  }
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
  return url;
}

export function validateMatchingPasswords(password, confirmPassword) {
  const first = typeof password === 'string' ? password : '';
  const second = typeof confirmPassword === 'string' ? confirmPassword : '';

  if (!first.trim() || !second.trim()) {
    return { valid: false, message: 'Enter and confirm your password to continue.' };
  }

  if (first !== second) {
    return { valid: false, message: 'Passwords do not match.' };
  }

  return { valid: true };
}

export const RESEND_DEFAULT_SECONDS = 60;

export function resolveResendCooldown(challenge) {
  if (!challenge) {
    return 0;
  }
  const value = Number.parseInt(challenge.cooldownSeconds, 10);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return RESEND_DEFAULT_SECONDS;
}
