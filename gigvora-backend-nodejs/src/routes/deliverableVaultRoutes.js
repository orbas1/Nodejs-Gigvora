import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import deliverableVaultController from '../controllers/deliverableVaultController.js';

const router = Router();
const DELIVERABLE_ROLES = ['freelancer', 'agency', 'company', 'operations', 'admin'];

router.use(authenticateRequest());
router.use(requireRoles(...DELIVERABLE_ROLES));

router.get('/overview', asyncHandler(deliverableVaultController.getOverview));
router.get('/items/:itemId', asyncHandler(deliverableVaultController.getItem));
router.post('/items', asyncHandler(deliverableVaultController.createItem));
router.patch('/items/:itemId', asyncHandler(deliverableVaultController.updateItem));
router.post('/items/:itemId/versions', asyncHandler(deliverableVaultController.addVersion));
router.post(
  '/items/:itemId/delivery-packages',
  asyncHandler(deliverableVaultController.generatePackage),
);

export default router;
