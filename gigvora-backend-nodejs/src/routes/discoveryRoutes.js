import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest } from '../middleware/authentication.js';
import { requireMembership } from '../middleware/authorization.js';
import * as discoveryController from '../controllers/discoveryController.js';

const router = Router();

router.use(authenticateRequest({ optional: true }));

router.get('/snapshot', asyncHandler(discoveryController.snapshot));
router.get('/experience', asyncHandler(discoveryController.experience));
router.get('/jobs', asyncHandler(discoveryController.jobs));
router.get('/gigs', asyncHandler(discoveryController.gigs));
router.get('/projects', asyncHandler(discoveryController.projects));
router.get('/launchpads', asyncHandler(discoveryController.launchpads));
router.get('/mentors', asyncHandler(discoveryController.mentors));
router.get(
  '/volunteering',
  authenticateRequest(),
  requireMembership(['volunteer', 'mentor', 'admin'], { allowAdmin: true }),
  asyncHandler(discoveryController.volunteering),
);
router.post(
  '/suggestions/:suggestionId/follow',
  authenticateRequest(),
  asyncHandler(discoveryController.followSuggestion),
);
router.post(
  '/suggestions/:suggestionId/save',
  authenticateRequest(),
  asyncHandler(discoveryController.saveSuggestion),
);
router.post(
  '/suggestions/:suggestionId/dismiss',
  authenticateRequest(),
  asyncHandler(discoveryController.dismissSuggestion),
);
router.post('/suggestions/:suggestionId/view', asyncHandler(discoveryController.trackSuggestionView));
router.post(
  '/suggestions/:suggestionId/share',
  asyncHandler(discoveryController.trackSuggestionShare),
);

export default router;
