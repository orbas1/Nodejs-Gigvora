import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/adminJobApplicationController.js';
import {
  jobApplicationCreateSchema,
  jobApplicationDocumentCreateSchema,
  jobApplicationDocumentUpdateSchema,
  jobApplicationInterviewCreateSchema,
  jobApplicationInterviewUpdateSchema,
  jobApplicationListQuerySchema,
  jobApplicationNoteCreateSchema,
  jobApplicationNoteUpdateSchema,
  jobApplicationUpdateSchema,
} from '../validation/schemas/adminJobApplicationSchemas.js';

const router = Router();

router.get('/', validateRequest({ query: jobApplicationListQuerySchema }), asyncHandler(controller.listJobApplications));
router.post('/', validateRequest({ body: jobApplicationCreateSchema }), asyncHandler(controller.createJobApplication));

router.get('/:applicationId', asyncHandler(controller.getJobApplication));
router.put(
  '/:applicationId',
  validateRequest({ body: jobApplicationUpdateSchema }),
  asyncHandler(controller.updateJobApplication),
);
router.delete('/:applicationId', asyncHandler(controller.deleteJobApplication));

router.post(
  '/:applicationId/notes',
  validateRequest({ body: jobApplicationNoteCreateSchema }),
  asyncHandler(controller.createJobApplicationNote),
);
router.put(
  '/:applicationId/notes/:noteId',
  validateRequest({ body: jobApplicationNoteUpdateSchema }),
  asyncHandler(controller.updateJobApplicationNote),
);
router.delete('/:applicationId/notes/:noteId', asyncHandler(controller.deleteJobApplicationNote));

router.post(
  '/:applicationId/interviews',
  validateRequest({ body: jobApplicationInterviewCreateSchema }),
  asyncHandler(controller.createJobApplicationInterview),
);
router.put(
  '/:applicationId/interviews/:interviewId',
  validateRequest({ body: jobApplicationInterviewUpdateSchema }),
  asyncHandler(controller.updateJobApplicationInterview),
);
router.delete('/:applicationId/interviews/:interviewId', asyncHandler(controller.deleteJobApplicationInterview));

router.post(
  '/:applicationId/documents',
  validateRequest({ body: jobApplicationDocumentCreateSchema }),
  asyncHandler(controller.createJobApplicationDocument),
);
router.put(
  '/:applicationId/documents/:documentId',
  validateRequest({ body: jobApplicationDocumentUpdateSchema }),
  asyncHandler(controller.updateJobApplicationDocument),
);
router.delete('/:applicationId/documents/:documentId', asyncHandler(controller.deleteJobApplicationDocument));

export default router;
