import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import complianceLockerController from '../controllers/complianceLockerController.js';

const router = Router();

router.get('/locker', asyncHandler(complianceLockerController.overview));
router.post('/documents', asyncHandler(complianceLockerController.storeDocument));
router.post('/documents/:documentId/versions', asyncHandler(complianceLockerController.addVersion));
router.patch('/reminders/:reminderId', asyncHandler(complianceLockerController.acknowledgeReminder));

export default router;
