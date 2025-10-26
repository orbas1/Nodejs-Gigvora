import {
  getSiteSettings,
  getSiteNavigation,
  listSitePages,
  getPublishedSitePage,
} from '../services/siteManagementService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';
import { resolveRequestRoles } from '../middleware/authorization.js';

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

function collectNavigationRoles(req) {
  const aggregated = new Set(resolveRequestRoles(req));
  if (Array.isArray(req.user?.memberships)) {
    req.user.memberships.forEach((role) => {
      if (typeof role === 'string' && role.trim()) {
        aggregated.add(role.trim().toLowerCase());
      }
    });
  }

  const queryRoles = req.query?.roles;
  if (Array.isArray(queryRoles)) {
    queryRoles.forEach((role) => {
      if (typeof role === 'string' && role.trim()) {
        aggregated.add(role.trim().toLowerCase());
      }
    });
  } else if (typeof queryRoles === 'string') {
    queryRoles
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean)
      .forEach((role) => aggregated.add(role.toLowerCase()));
  }

  aggregated.add('guest');
  return Array.from(aggregated);
}

export async function navigation(req, res) {
  const menuKey = req.query?.menuKey ? `${req.query.menuKey}`.trim() : undefined;
  const format = req.query?.format ? `${req.query.format}`.trim().toLowerCase() : 'flat';
  const actorRoles = collectNavigationRoles(req);
  const navigation = await getSiteNavigation({ menuKey, format, actorRoles });
  res.json({ navigation });
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

export default {
  settings,
  navigation,
  index,
  show,
};
