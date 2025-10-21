import { Router } from 'express';
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

router.get('/:category', listExplorer);
router.post('/:category', createExplorerRecord);
router.get('/:category/:recordId/interactions', listExplorerInteractions);
router.post('/:category/:recordId/interactions', createExplorerInteraction);
router.get('/:category/:recordId/interactions/:interactionId', getExplorerInteraction);
router.put('/:category/:recordId/interactions/:interactionId', updateExplorerInteraction);
router.delete('/:category/:recordId/interactions/:interactionId', deleteExplorerInteraction);
router.get('/:category/:recordId', getExplorerRecord);
router.put('/:category/:recordId', updateExplorerRecord);
router.delete('/:category/:recordId', deleteExplorerRecord);

export default router;
