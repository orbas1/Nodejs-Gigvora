import { Router } from 'express';
import {
  getOverview,
  getItem,
  createItem,
  updateItem,
  addVersion,
  generatePackage,
} from '../controllers/deliverableVaultController.js';

const router = Router();

router.get('/overview', getOverview);
router.get('/items/:itemId', getItem);
router.post('/items', createItem);
router.patch('/items/:itemId', updateItem);
router.post('/items/:itemId/versions', addVersion);
router.post('/items/:itemId/delivery-packages', generatePackage);

export default router;
