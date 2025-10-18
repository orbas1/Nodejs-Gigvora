import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import {
  getMentoringDashboard,
  createMentoringSession,
  updateMentoringSession,
  recordMentorshipPurchase,
  updateMentorshipPurchase,
  addFavouriteMentor,
  removeFavouriteMentor,
  submitMentorReview,
} from '../controllers/userMentoringController.js';

const router = Router({ mergeParams: true });
const PERMITTED_ROLES = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'];

router.get(
  '/dashboard',
  authenticate({ roles: PERMITTED_ROLES, matchParam: 'userId' }),
  asyncHandler(getMentoringDashboard),
);

router.post(
  '/sessions',
  authenticate({ roles: PERMITTED_ROLES, matchParam: 'userId' }),
  asyncHandler(createMentoringSession),
);

router.patch(
  '/sessions/:sessionId',
  authenticate({ roles: PERMITTED_ROLES, matchParam: 'userId' }),
  asyncHandler(updateMentoringSession),
);

router.post(
  '/purchases',
  authenticate({ roles: PERMITTED_ROLES, matchParam: 'userId' }),
  asyncHandler(recordMentorshipPurchase),
);

router.patch(
  '/purchases/:orderId',
  authenticate({ roles: PERMITTED_ROLES, matchParam: 'userId' }),
  asyncHandler(updateMentorshipPurchase),
);

router.post(
  '/favourites',
  authenticate({ roles: PERMITTED_ROLES, matchParam: 'userId' }),
  asyncHandler(addFavouriteMentor),
);

router.delete(
  '/favourites/:mentorId',
  authenticate({ roles: PERMITTED_ROLES, matchParam: 'userId' }),
  asyncHandler(removeFavouriteMentor),
);

router.post(
  '/reviews',
  authenticate({ roles: PERMITTED_ROLES, matchParam: 'userId' }),
  asyncHandler(submitMentorReview),
);

export default router;
