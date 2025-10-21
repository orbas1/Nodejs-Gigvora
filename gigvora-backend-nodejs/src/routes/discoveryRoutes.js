import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest } from '../middleware/authentication.js';
import { requireMembership } from '../middleware/authorization.js';
import * as discoveryController from '../controllers/discoveryController.js';

const router = Router();

router.use(authenticateRequest({ optional: true }));

router.get('/snapshot', asyncHandler(discoveryController.snapshot));
router.get('/jobs', asyncHandler(discoveryController.jobs));
router.get('/gigs', asyncHandler(discoveryController.gigs));
router.get('/projects', asyncHandler(discoveryController.projects));
router.get('/launchpads', asyncHandler(discoveryController.launchpads));
router.get(
  '/volunteering',
  authenticateRequest(),
  requireMembership(['volunteer', 'mentor', 'admin'], { allowAdmin: true }),
  asyncHandler(discoveryController.volunteering),
);

export default router;
