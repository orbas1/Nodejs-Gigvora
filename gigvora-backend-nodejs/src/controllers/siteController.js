import {
  getSiteSettings,
  getSiteNavigation,
  listSitePages,
  getPublishedSitePage,
} from '../services/siteManagementService.js';
import { ValidationError } from '../utils/errors.js';

function parseLimit(value, fallback = 25) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.min(numeric, 200);
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
  const status = req.query?.status ?? 'published';
  const includeDrafts = req.query?.includeDrafts === 'true';
  const limit = parseLimit(req.query?.limit, 50);
  const pages = await listSitePages({ status, includeDrafts, limit });
  res.json({ pages });
}

export async function show(req, res) {
  const { slug } = req.params;
  if (!slug) {
    throw new ValidationError('slug is required');
  }
  const allowDraft = req.query?.preview === 'true';
  const page = await getPublishedSitePage(slug, { allowDraft });
  res.json({ page });
}

export default {
  settings,
  navigation,
  index,
  show,
};
