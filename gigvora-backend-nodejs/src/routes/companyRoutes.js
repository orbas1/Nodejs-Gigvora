import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import companyController from '../controllers/companyController.js';
import companyInboxController from '../controllers/companyInboxController.js';

const router = Router();

router.get('/dashboard', asyncHandler(companyController.dashboard));
router.get('/inbox/overview', asyncHandler(companyInboxController.overview));
router.get('/inbox/threads', asyncHandler(companyInboxController.listThreads));
router.get('/inbox/threads/:threadId', asyncHandler(companyInboxController.threadDetail));
router.post('/inbox/threads/:threadId/labels', asyncHandler(companyInboxController.updateThreadLabels));
router.get('/inbox/labels', asyncHandler(companyInboxController.listLabels));
router.post('/inbox/labels', asyncHandler(companyInboxController.createLabel));
router.patch('/inbox/labels/:labelId', asyncHandler(companyInboxController.updateLabel));
router.delete('/inbox/labels/:labelId', asyncHandler(companyInboxController.deleteLabel));
router.get('/inbox/members', asyncHandler(companyInboxController.members));

export default router;

