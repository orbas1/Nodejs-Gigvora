import { Router } from 'express';
import * as searchController from '../controllers/searchController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(searchController.globalSearch));
router.get('/jobs', asyncHandler(searchController.searchJobs));
router.get('/gigs', asyncHandler(searchController.searchGigs));
router.get('/projects', asyncHandler(searchController.searchProjects));
router.get('/volunteering', asyncHandler(searchController.searchVolunteering));
router.get('/experience-launchpad', asyncHandler(searchController.searchLaunchpad));

export default router;
