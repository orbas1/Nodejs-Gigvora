import {
  getSiteSettings,
  getSiteNavigation,
  listSitePages,
  getPublishedSitePage,
  submitSitePageFeedback,
} from '../services/siteManagementService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

const SITE_MANAGE_PERMISSIONS = new Set(['site:manage', 'cms:manage', 'marketing:site:manage']);
const SITE_MANAGE_ROLES = new Set(['admin', 'platform_admin', 'marketing', 'content', 'editor']);

function clampLimit(value, fallback = 25) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('limit must be a positive integer.');
  }
  return Math.min(numeric, 200);
}

function normalise(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase();
}

function extractIpAddress(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length) {
    const candidate = forwarded.find((value) => typeof value === 'string' && value.trim());
    if (candidate) {
      return candidate.trim();
    }
  }
  if (typeof req.ip === 'string' && req.ip.trim()) {
    return req.ip.trim();
  }
  if (req.socket?.remoteAddress) {
    return `${req.socket.remoteAddress}`.trim();
  }
  if (req.connection?.remoteAddress) {
    return `${req.connection.remoteAddress}`.trim();
  }
  return null;
}

function resolveActorContext(req) {
  const actorId = resolveRequestUserId(req);
  const roles = new Set();
  const primaryRole = normalise(req.user?.type ?? req.user?.role ?? req.headers['x-user-type']);
  if (primaryRole) {
    roles.add(primaryRole);
  }
  if (Array.isArray(req.user?.roles)) {
    req.user.roles.forEach((role) => {
      const normalised = normalise(role);
      if (normalised) {
        roles.add(normalised);
      }
    });
  }
  const headerRoles = typeof req.headers['x-roles'] === 'string' ? req.headers['x-roles'].split(',') : [];
  headerRoles.forEach((role) => {
    const normalised = normalise(role);
    if (normalised) {
      roles.add(normalised);
    }
  });

  return {
    actorId: actorId ?? null,
    roles: Array.from(roles),
    primaryRole: primaryRole ?? null,
    ipAddress: extractIpAddress(req),
    userAgent: req.get?.('user-agent') ?? req.headers['user-agent'] ?? null,
    referer: req.get?.('referer') ?? req.get?.('referrer') ?? req.headers.referer ?? req.headers.referrer,
    source: 'public-site',
  };
}

function ensureSiteManageAccess(req) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication is required for draft site content.');
  }

  const roles = new Set();
  const primaryRole = normalise(req.user?.type ?? req.user?.role);
  if (primaryRole) {
    roles.add(primaryRole);
  }
  if (Array.isArray(req.user?.roles)) {
    req.user.roles.forEach((role) => {
      const normalised = normalise(role);
      if (normalised) {
        roles.add(normalised);
      }
    });
  }

  const permissions = new Set(resolveRequestPermissions(req).map((permission) => normalise(permission)).filter(Boolean));

  const hasRole = Array.from(roles).some((role) => SITE_MANAGE_ROLES.has(role));
  const hasPermission = Array.from(permissions).some((permission) => SITE_MANAGE_PERMISSIONS.has(permission));

  if (!hasRole && !hasPermission) {
    throw new AuthorizationError('Site management privileges are required for draft access.');
  }

  return { actorId };
}

export async function settings(req, res) {
  const settings = await getSiteSettings();
  res.json({ settings });
}

export async function navigation(req, res) {
  const menuKey = req.query?.menuKey ? `${req.query.menuKey}`.trim() : undefined;
  const links = await getSiteNavigation({ menuKey });
  res.json({ links });
}

export async function index(req, res) {
  const status = `${req.query?.status ?? 'published'}`.trim().toLowerCase();
  const includeDrafts = req.query?.includeDrafts === 'true';
  const limit = clampLimit(req.query?.limit, 50);

  if (includeDrafts || status !== 'published') {
    ensureSiteManageAccess(req);
  }

  const pages = await listSitePages({ status, includeDrafts, limit });
  res.json({ pages });
}

export async function show(req, res) {
  const { slug } = req.params;
  if (!slug || !slug.trim()) {
    throw new ValidationError('slug is required');
  }
  const allowDraft = req.query?.preview === 'true';
  if (allowDraft) {
    ensureSiteManageAccess(req);
  }
  const page = await getPublishedSitePage(slug, { allowDraft });
  res.json({ page });
}

export async function feedback(req, res) {
  const { slug } = req.params;
  const feedback = await submitSitePageFeedback(slug, req.body ?? {}, resolveActorContext(req));
  res.status(202).json({ feedback });
}

export default {
  settings,
  navigation,
  index,
  show,
  feedback,
};
