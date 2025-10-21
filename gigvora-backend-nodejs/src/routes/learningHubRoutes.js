import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import learningHubController from '../controllers/learningHubController.js';
import authenticate from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  freelancerParamsSchema,
  learningHubOverviewQuerySchema,
  learningHubEnrollmentBodySchema,
  enrollmentParamsSchema,
  learningHubEnrollmentUpdateBodySchema,
  learningHubMentoringSessionBodySchema,
  learningHubDiagnosticBodySchema,
  certificationParamsSchema,
} from '../validation/schemas/learningHubSchemas.js';

const router = Router();

const LEARNING_HUB_ROLES = ['freelancer', 'user', 'mentor', 'agency', 'company', 'admin'];

const requireLearningHubAccess = authenticate({
  roles: LEARNING_HUB_ROLES,
  matchParam: 'freelancerId',
  allowAdminOverride: true,
});

router.get(
  '/freelancers/:freelancerId',
  requireLearningHubAccess,
  validateRequest({ params: freelancerParamsSchema, query: learningHubOverviewQuerySchema }),
  asyncHandler(learningHubController.overview),
);

router.post(
  '/freelancers/:freelancerId/enrollments',
  requireLearningHubAccess,
  validateRequest({ params: freelancerParamsSchema, body: learningHubEnrollmentBodySchema }),
  asyncHandler(learningHubController.createEnrollment),
);

router.patch(
  '/freelancers/:freelancerId/enrollments/:enrollmentId',
  requireLearningHubAccess,
  validateRequest({ params: enrollmentParamsSchema, body: learningHubEnrollmentUpdateBodySchema }),
  asyncHandler(learningHubController.updateEnrollment),
);

router.post(
  '/freelancers/:freelancerId/mentoring-sessions',
  requireLearningHubAccess,
  validateRequest({ params: freelancerParamsSchema, body: learningHubMentoringSessionBodySchema }),
  asyncHandler(learningHubController.createMentoringSession),
);

router.post(
  '/freelancers/:freelancerId/diagnostics',
  requireLearningHubAccess,
  validateRequest({ params: freelancerParamsSchema, body: learningHubDiagnosticBodySchema }),
  asyncHandler(learningHubController.createDiagnostic),
);

router.post(
  '/freelancers/:freelancerId/certifications/:certificationId/acknowledge',
  requireLearningHubAccess,
  validateRequest({ params: certificationParamsSchema }),
  asyncHandler(learningHubController.acknowledgeReminder),
);

export default router;
