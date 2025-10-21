import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import pipelineController from '../controllers/pipelineController.js';
import { authenticate, requireRoles } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router();

router.use(authenticate());
router.use(requireRoles(['freelancer', 'agency', 'agency_admin', 'company', 'admin']));

const dealParamsSchema = z
  .object({
    dealId: z.coerce.number().int().positive({ message: 'dealId must be a positive integer.' }),
  })
  .strip();

const proposalParamsSchema = z
  .object({
    proposalId: z.coerce.number().int().positive({ message: 'proposalId must be a positive integer.' }),
  })
  .strip();

const followUpParamsSchema = z
  .object({
    followUpId: z.coerce.number().int().positive({ message: 'followUpId must be a positive integer.' }),
  })
  .strip();

const campaignParamsSchema = z
  .object({
    campaignId: z.coerce.number().int().positive({ message: 'campaignId must be a positive integer.' }),
  })
  .strip();

router.get('/dashboard', asyncHandler(pipelineController.dashboard));
router.post('/deals', asyncHandler(pipelineController.storeDeal));
router.patch(
  '/deals/:dealId',
  validateRequest({ params: dealParamsSchema }),
  asyncHandler(pipelineController.updateDeal),
);
router.delete(
  '/deals/:dealId',
  validateRequest({ params: dealParamsSchema }),
  asyncHandler(pipelineController.destroyDeal),
);
router.post('/proposals', asyncHandler(pipelineController.storeProposal));
router.delete(
  '/proposals/:proposalId',
  validateRequest({ params: proposalParamsSchema }),
  asyncHandler(pipelineController.destroyProposal),
);
router.post('/follow-ups', asyncHandler(pipelineController.storeFollowUp));
router.patch(
  '/follow-ups/:followUpId',
  validateRequest({ params: followUpParamsSchema }),
  asyncHandler(pipelineController.updateFollowUp),
);
router.delete(
  '/follow-ups/:followUpId',
  validateRequest({ params: followUpParamsSchema }),
  asyncHandler(pipelineController.destroyFollowUp),
);
router.post('/campaigns', asyncHandler(pipelineController.storeCampaign));
router.delete(
  '/campaigns/:campaignId',
  validateRequest({ params: campaignParamsSchema }),
  asyncHandler(pipelineController.destroyCampaign),
);

export default router;
