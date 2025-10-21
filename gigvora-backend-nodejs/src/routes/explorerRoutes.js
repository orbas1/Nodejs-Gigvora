import { Router } from 'express';
import {
  createExplorerRecord,
  deleteExplorerRecord,
  getExplorerRecord,
  listExplorer,
  updateExplorerRecord,
} from '../controllers/explorerController.js';

const router = Router();

router.get('/:category', listExplorer);
router.post('/:category', createExplorerRecord);
router.get('/:category/:recordId', getExplorerRecord);
router.put('/:category/:recordId', updateExplorerRecord);
router.delete('/:category/:recordId', deleteExplorerRecord);

export default router;
