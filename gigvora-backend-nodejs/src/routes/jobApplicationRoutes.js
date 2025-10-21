import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import jobApplicationController from '../controllers/jobApplicationController.js';

const router = Router();

const ALLOWED_ROLES = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin'];

router.use(authenticateRequest());
router.use(requireRoles(...ALLOWED_ROLES));

router.get('/workspace', asyncHandler(jobApplicationController.workspace));
router.post('/', asyncHandler(jobApplicationController.storeApplication));
router.patch('/:applicationId', asyncHandler(jobApplicationController.updateApplication));
router.delete('/:applicationId', asyncHandler(jobApplicationController.removeApplication));

router.post('/:applicationId/interviews', asyncHandler(jobApplicationController.storeInterview));
router.patch('/:applicationId/interviews/:interviewId', asyncHandler(jobApplicationController.updateInterview));
router.delete('/:applicationId/interviews/:interviewId', asyncHandler(jobApplicationController.destroyInterview));

router.post('/favourites', asyncHandler(jobApplicationController.storeFavourite));
router.patch('/favourites/:favouriteId', asyncHandler(jobApplicationController.updateFavourite));
router.delete('/favourites/:favouriteId', asyncHandler(jobApplicationController.destroyFavourite));

router.post('/:applicationId/responses', asyncHandler(jobApplicationController.storeResponse));
router.patch('/:applicationId/responses/:responseId', asyncHandler(jobApplicationController.updateResponse));
router.delete('/:applicationId/responses/:responseId', asyncHandler(jobApplicationController.destroyResponse));

export default router;
