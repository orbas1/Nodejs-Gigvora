import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import projectController from '../controllers/projectController.js';

const router = Router();

router.post('/', asyncHandler(projectController.store));
router.patch('/:projectId/auto-assign', asyncHandler(projectController.toggleAutoAssign));
router.patch('/:projectId', asyncHandler(projectController.update));
router.get('/:projectId', asyncHandler(projectController.show));
router.get('/:projectId/events', asyncHandler(projectController.events));

export default router;
