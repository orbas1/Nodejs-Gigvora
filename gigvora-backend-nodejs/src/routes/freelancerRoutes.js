import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import clientSuccessController from '../controllers/clientSuccessController.js';

const router = Router({ mergeParams: true });

router.get(
  '/:freelancerId/client-success/overview',
  asyncHandler(clientSuccessController.overview),
);

router.post(
  '/:freelancerId/client-success/playbooks',
  asyncHandler(clientSuccessController.storePlaybook),
);

router.put(
  '/:freelancerId/client-success/playbooks/:playbookId',
  asyncHandler(clientSuccessController.updatePlaybook),
);

router.post(
  '/:freelancerId/client-success/playbooks/:playbookId/enrollments',
  asyncHandler(clientSuccessController.enroll),
);

router.post(
  '/:freelancerId/client-success/gigs/:gigId/referrals',
  asyncHandler(clientSuccessController.storeReferral),
);

router.post(
  '/:freelancerId/client-success/gigs/:gigId/affiliate-links',
  asyncHandler(clientSuccessController.storeAffiliateLink),
);

export default router;
