import {
  getSiteManagementOverview,
  saveSiteSettings,
  createSitePage,
  updateSitePageById,
  deleteSitePageById,
  createNavigation,
  updateNavigation,
  deleteNavigation,
} from '../services/siteManagementService.js';
import { ValidationError } from '../utils/errors.js';

export async function overview(req, res) {
  const snapshot = await getSiteManagementOverview();
  res.json(snapshot);
}

export async function updateSettings(req, res) {
  const result = await saveSiteSettings(req.body ?? {});
  res.json(result);
}

export async function createPage(req, res) {
  const page = await createSitePage(req.body ?? {});
  res.status(201).json({ page });
}

export async function updatePage(req, res) {
  const { pageId } = req.params;
  const id = Number.parseInt(pageId, 10);
  if (Number.isNaN(id)) {
    throw new ValidationError('Valid pageId is required.');
  }
  const page = await updateSitePageById(id, req.body ?? {});
  res.json({ page });
}

export async function deletePage(req, res) {
  const { pageId } = req.params;
  const id = Number.parseInt(pageId, 10);
  if (Number.isNaN(id)) {
    throw new ValidationError('Valid pageId is required.');
  }
  await deleteSitePageById(id);
  res.status(204).send();
}

export async function createNavigationLink(req, res) {
  const link = await createNavigation(req.body ?? {});
  res.status(201).json({ link });
}

export async function updateNavigationLink(req, res) {
  const { linkId } = req.params;
  const id = Number.parseInt(linkId, 10);
  if (Number.isNaN(id)) {
    throw new ValidationError('Valid linkId is required.');
  }
  const link = await updateNavigation(id, req.body ?? {});
  res.json({ link });
}

export async function deleteNavigationLink(req, res) {
  const { linkId } = req.params;
  const id = Number.parseInt(linkId, 10);
  if (Number.isNaN(id)) {
    throw new ValidationError('Valid linkId is required.');
  }
  await deleteNavigation(id);
  res.status(204).send();
}

export default {
  overview,
  updateSettings,
  createPage,
  updatePage,
  deletePage,
  createNavigationLink,
  updateNavigationLink,
  deleteNavigationLink,
};
