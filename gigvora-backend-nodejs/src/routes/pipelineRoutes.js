import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import pipelineController from '../controllers/pipelineController.js';
import { authenticate, requireRoles } from '../middleware/authentication.js';

const router = Router();

router.use(authenticate());
router.use(requireRoles(['freelancer', 'agency', 'agency_admin', 'company', 'admin']));

router.get('/dashboard', asyncHandler(pipelineController.dashboard));
router.post('/deals', asyncHandler(pipelineController.storeDeal));
router.patch('/deals/:dealId', asyncHandler(pipelineController.updateDeal));
router.delete('/deals/:dealId', asyncHandler(pipelineController.destroyDeal));
router.post('/proposals', asyncHandler(pipelineController.storeProposal));
router.delete('/proposals/:proposalId', asyncHandler(pipelineController.destroyProposal));
router.post('/follow-ups', asyncHandler(pipelineController.storeFollowUp));
router.patch('/follow-ups/:followUpId', asyncHandler(pipelineController.updateFollowUp));
router.delete('/follow-ups/:followUpId', asyncHandler(pipelineController.destroyFollowUp));
router.post('/campaigns', asyncHandler(pipelineController.storeCampaign));
router.delete('/campaigns/:campaignId', asyncHandler(pipelineController.destroyCampaign));

export default router;
