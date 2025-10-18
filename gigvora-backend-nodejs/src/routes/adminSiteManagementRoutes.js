import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/adminSiteManagementController.js';
import {
  siteSettingsBodySchema,
  sitePageCreateSchema,
  sitePageUpdateSchema,
  siteNavigationCreateSchema,
  siteNavigationUpdateSchema,
} from '../validation/schemas/siteManagementSchemas.js';

const router = Router();

router.get('/', asyncHandler(controller.overview));
router.put('/settings', validateRequest({ body: siteSettingsBodySchema }), asyncHandler(controller.updateSettings));
router.post('/pages', validateRequest({ body: sitePageCreateSchema }), asyncHandler(controller.createPage));
router.put('/pages/:pageId', validateRequest({ body: sitePageUpdateSchema }), asyncHandler(controller.updatePage));
router.delete('/pages/:pageId', asyncHandler(controller.deletePage));
router.post('/navigation', validateRequest({ body: siteNavigationCreateSchema }), asyncHandler(controller.createNavigationLink));
router.put('/navigation/:linkId', validateRequest({ body: siteNavigationUpdateSchema }), asyncHandler(controller.updateNavigationLink));
router.delete('/navigation/:linkId', asyncHandler(controller.deleteNavigationLink));

export default router;
