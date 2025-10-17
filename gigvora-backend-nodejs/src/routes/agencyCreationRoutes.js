import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';
import controller from '../controllers/agencyCreationController.js';

const router = Router();

router.use(authenticate(), requireRoles('agency', 'agency_admin', 'admin'));

router.get('/', asyncHandler(controller.overview));
router.get('/snapshot', asyncHandler(controller.snapshot));
router.post('/items', asyncHandler(controller.store));
router.put('/items/:itemId', asyncHandler(controller.update));
router.delete('/items/:itemId', asyncHandler(controller.destroy));

export default router;
