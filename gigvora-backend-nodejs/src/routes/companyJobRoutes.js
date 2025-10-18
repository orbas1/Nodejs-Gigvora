import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import controller from '../controllers/companyJobManagementController.js';

const router = Router();

router.get('/operations', asyncHandler(controller.operations));
router.post('/', asyncHandler(controller.createJob));
router.put('/:jobId', asyncHandler(controller.updateJob));
router.put('/:jobId/keywords', asyncHandler(controller.setKeywords));
router.post('/:jobId/favorites', asyncHandler(controller.favoriteJob));
router.delete('/:jobId/favorites/:favoriteId', asyncHandler(controller.unfavoriteJob));
router.post('/:jobId/applications', asyncHandler(controller.createApplicationController));
router.patch('/:jobId/applications/:applicationId', asyncHandler(controller.updateApplicationController));
router.post('/:jobId/interviews', asyncHandler(controller.scheduleInterviewController));
router.patch('/:jobId/interviews/:interviewId', asyncHandler(controller.updateInterviewController));
router.post('/:jobId/responses', asyncHandler(controller.recordResponseController));
router.post('/:jobId/applications/:applicationId/notes', asyncHandler(controller.addNoteController));
router.patch('/:jobId/applications/:applicationId/notes/:noteId', asyncHandler(controller.updateNoteController));

export default router;
