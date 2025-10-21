import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import workspaceTemplateController from '../controllers/workspaceTemplateController.js';
import { workspaceTemplateSlugParamsSchema } from '../validation/schemas/workspaceTemplateSchemas.js';

const router = Router();

router.get('/', asyncHandler(workspaceTemplateController.index));
router.get(
  '/:slug',
  validateRequest({ params: workspaceTemplateSlugParamsSchema }),
  asyncHandler(workspaceTemplateController.show),
);

export default router;
