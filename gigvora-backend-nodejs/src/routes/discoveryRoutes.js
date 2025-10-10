import { Router } from 'express';
import * as discoveryController from '../controllers/discoveryController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/snapshot', asyncHandler(discoveryController.snapshot));
router.get('/jobs', asyncHandler(discoveryController.jobs));
router.get('/gigs', asyncHandler(discoveryController.gigs));
router.get('/projects', asyncHandler(discoveryController.projects));
router.get('/launchpads', asyncHandler(discoveryController.launchpads));
router.get('/volunteering', asyncHandler(discoveryController.volunteering));

export default router;
