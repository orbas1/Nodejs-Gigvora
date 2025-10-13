import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import learningHubController from '../controllers/learningHubController.js';

const router = Router();

router.get(
  '/freelancers/:freelancerId',
  asyncHandler(learningHubController.overview),
);

router.post(
  '/freelancers/:freelancerId/enrollments',
  asyncHandler(learningHubController.createEnrollment),
);

router.patch(
  '/freelancers/:freelancerId/enrollments/:enrollmentId',
  asyncHandler(learningHubController.updateEnrollment),
);

router.post(
  '/freelancers/:freelancerId/mentoring-sessions',
  asyncHandler(learningHubController.createMentoringSession),
);

router.post(
  '/freelancers/:freelancerId/diagnostics',
  asyncHandler(learningHubController.createDiagnostic),
);

router.post(
  '/freelancers/:freelancerId/certifications/:certificationId/acknowledge',
  asyncHandler(learningHubController.acknowledgeReminder),
);

export default router;
