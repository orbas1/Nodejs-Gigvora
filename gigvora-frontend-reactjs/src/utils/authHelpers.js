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
const SOCIAL_OAUTH_STATE_STORAGE_KEY = 'gigvora:web:auth:oauth-state';
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_SCOPES = ['openid', 'profile', 'email'];
const SOCIAL_STATE_TTL_MS = 1000 * 60 * 10; // 10 minutes

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

function getSessionStorage() {
  if (typeof window === 'undefined' || !window?.sessionStorage) {
    return null;
  }
  return window.sessionStorage;
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

function generateOAuthState(provider, intent) {
  const randomBytes = typeof window !== 'undefined' && window.crypto?.getRandomValues
    ? window.crypto.getRandomValues(new Uint8Array(16))
    : Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  const token = Array.from(randomBytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${provider}:${intent}:${token}`;
}

function resolveLinkedInRedirectUri() {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_LINKEDIN_REDIRECT_URI || 'https://app.gigvora.com/auth/callback';
  }
  const configured = import.meta.env.VITE_LINKEDIN_REDIRECT_URI;
  if (configured) {
    return configured;
  }
  const origin = window.location?.origin ?? 'https://app.gigvora.com';
  return `${origin.replace(/\/$/, '')}/auth/callback`;
}

function buildLinkedInAuthorizeUrl({ state, redirectUri }) {
  const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
  if (!clientId) {
    throw new Error('LinkedIn client id is not configured.');
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: LINKEDIN_SCOPES.join(' '),
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

function persistOAuthState(record) {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(SOCIAL_OAUTH_STATE_STORAGE_KEY, JSON.stringify(record));
  } catch (error) {
    console.warn('Unable to persist social OAuth state', error);
  }
}

export function consumeOAuthState(expectedState) {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }
  let record = null;
  try {
    const raw = storage.getItem(SOCIAL_OAUTH_STATE_STORAGE_KEY);
    if (raw) {
      record = JSON.parse(raw);
    }
  } catch (error) {
    console.warn('Unable to parse social OAuth state', error);
  }
  try {
    storage.removeItem(SOCIAL_OAUTH_STATE_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear social OAuth state', error);
  }

  if (!record || record.state !== expectedState) {
    return null;
  }

  if (record.createdAt && Date.now() - Number(record.createdAt) > SOCIAL_STATE_TTL_MS) {
    return null;
  }

  return record;
}

export function redirectToSocialAuth(provider, intent = 'login') {
  const normalizedIntent = intent === 'register' ? 'register' : 'login';
  let url = null;
  let redirectUri = null;
  const state = generateOAuthState(provider, normalizedIntent);

  try {
    if (provider === 'linkedin') {
      redirectUri = resolveLinkedInRedirectUri();
      url = buildLinkedInAuthorizeUrl({ state, redirectUri });
    } else {
      return null;
    }
  } catch (error) {
    console.warn('Unable to prepare social auth redirect', error);
    return null;
  }

  persistOAuthState({
    provider,
    intent: normalizedIntent,
    state,
    redirectUri,
    createdAt: Date.now(),
    baseUrl: getAuthBaseUrl(),
  });

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
