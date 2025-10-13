import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import projectController from '../controllers/projectController.js';
import projectBlueprintController from '../controllers/projectBlueprintController.js';
import projectWorkspaceController from '../controllers/projectWorkspaceController.js';

const router = Router();

router.get('/blueprints', asyncHandler(projectBlueprintController.index));
router.post('/', asyncHandler(projectController.store));
router.put('/:projectId/blueprint', asyncHandler(projectBlueprintController.upsert));
router.get('/:projectId/blueprint', asyncHandler(projectBlueprintController.show));
router.patch('/:projectId/auto-assign', asyncHandler(projectController.toggleAutoAssign));
router.patch('/:projectId', asyncHandler(projectController.update));
router.get('/:projectId', asyncHandler(projectController.show));
router.get('/:projectId/events', asyncHandler(projectController.events));
router.get('/:projectId/workspace', asyncHandler(projectWorkspaceController.show));
router.put('/:projectId/workspace/brief', asyncHandler(projectWorkspaceController.updateBrief));
router.patch(
  '/:projectId/workspace/approvals/:approvalId',
  asyncHandler(projectWorkspaceController.updateApproval),
);
router.patch(
  '/:projectId/workspace/conversations/:conversationId',
  asyncHandler(projectWorkspaceController.acknowledgeConversation),
);

export default router;
