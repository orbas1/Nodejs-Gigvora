import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import agencyMentoringController from '../controllers/agencyMentoringController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

router.get(
  '/mentoring/overview',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.overview),
);

router.get(
  '/mentoring/sessions',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.sessionsList),
);

router.post(
  '/mentoring/sessions',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.sessionsCreate),
);

router.patch(
  '/mentoring/sessions/:sessionId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.sessionsUpdate),
);

router.delete(
  '/mentoring/sessions/:sessionId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.sessionsDelete),
);

router.get(
  '/mentoring/purchases',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.purchasesList),
);

router.post(
  '/mentoring/purchases',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.purchasesCreate),
);

router.patch(
  '/mentoring/purchases/:purchaseId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.purchasesUpdate),
);

router.get(
  '/mentoring/favourites',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.favouritesList),
);

router.post(
  '/mentoring/favourites',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.favouritesCreate),
);

router.patch(
  '/mentoring/favourites/:preferenceId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.favouritesUpdate),
);

router.delete(
  '/mentoring/favourites/:preferenceId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.favouritesDelete),
);

router.get(
  '/mentoring/suggestions',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.suggestionsList),
);

export default router;

