import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import {
  createExplorerRecord,
  deleteExplorerRecord,
  getExplorerRecord,
  listExplorer,
  updateExplorerRecord,
} from '../controllers/explorerController.js';
import {
  createExplorerInteraction,
  deleteExplorerInteraction,
  getExplorerInteraction,
  listExplorerInteractions,
  updateExplorerInteraction,
} from '../controllers/explorerEngagementController.js';

const router = Router();
const EXPLORER_ROLES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'admin'];

router.use(authenticateRequest());
router.use(requireRoles(...EXPLORER_ROLES));

router.get('/:category', asyncHandler(listExplorer));
router.post('/:category', asyncHandler(createExplorerRecord));
router.get('/:category/:recordId/interactions', asyncHandler(listExplorerInteractions));
router.post('/:category/:recordId/interactions', asyncHandler(createExplorerInteraction));
router.get(
  '/:category/:recordId/interactions/:interactionId',
  asyncHandler(getExplorerInteraction),
);
router.put(
  '/:category/:recordId/interactions/:interactionId',
  asyncHandler(updateExplorerInteraction),
);
router.delete(
  '/:category/:recordId/interactions/:interactionId',
  asyncHandler(deleteExplorerInteraction),
);
router.get('/:category/:recordId', asyncHandler(getExplorerRecord));
router.put('/:category/:recordId', asyncHandler(updateExplorerRecord));
router.delete('/:category/:recordId', asyncHandler(deleteExplorerRecord));

export default router;
