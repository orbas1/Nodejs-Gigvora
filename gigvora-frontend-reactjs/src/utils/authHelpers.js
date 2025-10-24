const DASHBOARD_ROUTES = Object.freeze({
  admin: '/dashboard/admin',
  agency: '/dashboard/agency',
  company: '/dashboard/company',
  freelancer: '/dashboard/freelancer',
  headhunter: '/dashboard/headhunter',
  mentor: '/dashboard/mentor',
  user: '/feed',
});

export function resolveLanding(session) {
  if (!session) {
    return '/feed';
  }
  const key = session.primaryDashboard ?? session.memberships?.[0];
  return DASHBOARD_ROUTES[key] ?? '/feed';
}

export function formatVerificationExpiry(timestamp, locale = 'en-US') {
  if (!timestamp) return null;
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (error) {
    console.warn('Unable to format verification expiry', error);
    return null;
  }
}

function normaliseBaseUrl(url) {
  if (!url) {
    return 'http://localhost:4000';
  }
  return `${url}`.replace(/\/$/, '');
}

export function getAuthBaseUrl() {
  const apiBase = normaliseBaseUrl(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api');
  return apiBase.replace(/\/api$/, '');
}

const SOCIAL_ROUTES = {
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
};

export function resolveSocialRoute(provider, intent = 'login') {
  if (!provider) {
    return null;
  }
  const target = SOCIAL_ROUTES[intent] ?? SOCIAL_ROUTES.login;
  return target?.[provider] ?? null;
}

export function redirectToSocialProvider(provider, intent = 'login') {
  const route = resolveSocialRoute(provider, intent);
  if (!route) {
    throw new Error(`Unsupported social auth provider: ${provider}`);
  }
  const baseUrl = getAuthBaseUrl();
  window.location.href = `${baseUrl}${route}`;
}

export function getProviderLabel(provider) {
  if (provider === 'x') {
    return 'X';
  }
  if (!provider) {
    return '';
  }
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function normaliseEmail(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
}

export const RESEND_COOLDOWN_SECONDS = 30;

export { DASHBOARD_ROUTES };

export default {
  DASHBOARD_ROUTES,
  resolveLanding,
  formatVerificationExpiry,
  redirectToSocialProvider,
  resolveSocialRoute,
  getProviderLabel,
  normaliseEmail,
  getAuthBaseUrl,
  RESEND_COOLDOWN_SECONDS,
};
