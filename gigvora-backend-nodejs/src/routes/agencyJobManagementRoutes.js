import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyJobManagementController from '../controllers/agencyJobManagementController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate(), requireRoles('agency', 'agency_admin', 'admin'));

router.get('/metadata', asyncHandler(agencyJobManagementController.metadata));
router.get('/summary', asyncHandler(agencyJobManagementController.summary));

router.get('/jobs', asyncHandler(agencyJobManagementController.index));
router.post('/jobs', asyncHandler(agencyJobManagementController.store));
router.get('/jobs/:jobId', asyncHandler(agencyJobManagementController.show));
router.put('/jobs/:jobId', asyncHandler(agencyJobManagementController.update));
router.post('/jobs/:jobId/favorites', asyncHandler(agencyJobManagementController.favorite));
router.delete(
  '/jobs/:jobId/favorites/:memberId',
  asyncHandler(agencyJobManagementController.unfavorite),
);

router.get('/jobs/:jobId/applications', asyncHandler(agencyJobManagementController.applicationIndex));
router.post('/jobs/:jobId/applications', asyncHandler(agencyJobManagementController.applicationStore));

router.get('/applications/:applicationId', asyncHandler(agencyJobManagementController.applicationShow));
router.put('/applications/:applicationId', asyncHandler(agencyJobManagementController.applicationUpdate));

router.get('/applications/:applicationId/interviews', asyncHandler(agencyJobManagementController.interviewIndex));
router.post('/applications/:applicationId/interviews', asyncHandler(agencyJobManagementController.interviewStore));
router.put('/interviews/:interviewId', asyncHandler(agencyJobManagementController.interviewUpdate));

router.get('/applications/:applicationId/responses', asyncHandler(agencyJobManagementController.responseIndex));
router.post('/applications/:applicationId/responses', asyncHandler(agencyJobManagementController.responseStore));

export default router;
