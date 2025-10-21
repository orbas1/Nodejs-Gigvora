import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { requireAdmin } from '../middleware/authenticate.js';
import {
  pageSettingsBodySchema,
  pageSettingsQuerySchema,
  pageSettingsParamsSchema,
} from '../validation/schemas/adminSchemas.js';

const router = Router();

router.use(requireAdmin);

router.get(
  '/',
  validateRequest({ query: pageSettingsQuerySchema }),
  asyncHandler(adminController.fetchPageSettings),
);

router.post(
  '/',
  validateRequest({ body: pageSettingsBodySchema }),
  asyncHandler(adminController.createAdminPageSetting),
);

router.put(
  '/:pageId',
  validateRequest({ body: pageSettingsBodySchema, params: pageSettingsParamsSchema }),
  asyncHandler(adminController.persistPageSetting),
);

router.delete(
  '/:pageId',
  validateRequest({ params: pageSettingsParamsSchema }),
  asyncHandler(adminController.removePageSetting),
);

export default router;
