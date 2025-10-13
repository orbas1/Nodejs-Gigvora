import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import workspaceTemplateController from '../controllers/workspaceTemplateController.js';

const router = Router();

router.get('/', asyncHandler(workspaceTemplateController.index));
router.get('/:slug', asyncHandler(workspaceTemplateController.show));

export default router;
