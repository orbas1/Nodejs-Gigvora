import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import projectController from '../controllers/projectController.js';
import projectBlueprintController from '../controllers/projectBlueprintController.js';

const router = Router();

router.get('/blueprints', asyncHandler(projectBlueprintController.index));
router.post('/', asyncHandler(projectController.store));
router.put('/:projectId/blueprint', asyncHandler(projectBlueprintController.upsert));
router.get('/:projectId/blueprint', asyncHandler(projectBlueprintController.show));
router.patch('/:projectId/auto-assign', asyncHandler(projectController.toggleAutoAssign));
router.patch('/:projectId', asyncHandler(projectController.update));
router.get('/:projectId', asyncHandler(projectController.show));
router.get('/:projectId/events', asyncHandler(projectController.events));

export default router;
