import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import pipelineController from '../controllers/pipelineController.js';
import { authenticate, requireRoles } from '../middleware/authentication.js';

const router = Router();

router.use(authenticate());
router.use(requireRoles(['freelancer']));

router.get('/dashboard', asyncHandler(pipelineController.dashboard));
router.post('/deals', asyncHandler(pipelineController.storeDeal));
router.patch('/deals/:dealId', asyncHandler(pipelineController.updateDeal));
router.post('/proposals', asyncHandler(pipelineController.storeProposal));
router.post('/follow-ups', asyncHandler(pipelineController.storeFollowUp));
router.patch('/follow-ups/:followUpId', asyncHandler(pipelineController.updateFollowUp));
router.post('/campaigns', asyncHandler(pipelineController.storeCampaign));

export default router;
