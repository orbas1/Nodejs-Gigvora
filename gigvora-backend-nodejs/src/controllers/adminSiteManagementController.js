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
import { extractAdminActor, stampPayloadWithActor, coercePositiveInteger } from '../utils/adminRequestContext.js';
import logger from '../utils/logger.js';

export async function overview(req, res) {
  const snapshot = await getSiteManagementOverview();
  res.json(snapshot);
}

export async function updateSettings(req, res) {
  const actor = extractAdminActor(req);
  const result = await saveSiteSettings(stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }));
  logger.info({ actor: actor.reference }, 'Site management settings updated');
  res.json(result);
}

export async function createPage(req, res) {
  const actor = extractAdminActor(req);
  const page = await createSitePage(stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true }));
  logger.info({ actor: actor.reference, pageId: page?.id }, 'Site management page created');
  res.status(201).json({ page });
}

export async function updatePage(req, res) {
  const id = coercePositiveInteger(req.params?.pageId, 'pageId');
  const actor = extractAdminActor(req);
  const page = await updateSitePageById(id, stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }));
  logger.info({ actor: actor.reference, pageId: id }, 'Site management page updated');
  res.json({ page });
}

export async function deletePage(req, res) {
  const id = coercePositiveInteger(req.params?.pageId, 'pageId');
  await deleteSitePageById(id);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, pageId: id }, 'Site management page deleted');
  res.status(204).send();
}

export async function createNavigationLink(req, res) {
  const actor = extractAdminActor(req);
  const link = await createNavigation(stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true }));
  logger.info({ actor: actor.reference, navigationId: link?.id }, 'Site navigation link created');
  res.status(201).json({ link });
}

export async function updateNavigationLink(req, res) {
  const id = coercePositiveInteger(req.params?.linkId, 'linkId');
  const actor = extractAdminActor(req);
  const link = await updateNavigation(id, stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }));
  logger.info({ actor: actor.reference, navigationId: id }, 'Site navigation link updated');
  res.json({ link });
}

export async function deleteNavigationLink(req, res) {
  const id = coercePositiveInteger(req.params?.linkId, 'linkId');
  await deleteNavigation(id);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, navigationId: id }, 'Site navigation link deleted');
  res.status(204).send();
}

