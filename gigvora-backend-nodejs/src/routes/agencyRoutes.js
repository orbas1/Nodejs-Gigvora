import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

router.get(
  '/profile',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.profile),
);

router.put(
  '/profile',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.updateProfile),
);

router.post(
  '/profile/media',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.createMedia),
);

router.put(
  '/profile/media/:mediaId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.updateMedia),
);

router.delete(
  '/profile/media/:mediaId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.deleteMedia),
);

router.post(
  '/profile/skills',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.createSkill),
);

router.put(
  '/profile/skills/:skillId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.updateSkill),
);

router.delete(
  '/profile/skills/:skillId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.deleteSkill),
);

router.post(
  '/profile/credentials',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.createCredential),
);

router.put(
  '/profile/credentials/:credentialId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.updateCredential),
);

router.delete(
  '/profile/credentials/:credentialId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.deleteCredential),
);

router.post(
  '/profile/experiences',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.createExperience),
);

router.put(
  '/profile/experiences/:experienceId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.updateExperience),
);

router.delete(
  '/profile/experiences/:experienceId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.deleteExperience),
);

router.post(
  '/profile/workforce',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.createWorkforceSegment),
);

router.put(
  '/profile/workforce/:segmentId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.updateWorkforceSegment),
);

router.delete(
  '/profile/workforce/:segmentId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.deleteWorkforceSegment),
);

export default router;

