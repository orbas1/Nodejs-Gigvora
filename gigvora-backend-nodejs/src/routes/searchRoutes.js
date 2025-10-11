import { Router } from 'express';
import * as searchController from '../controllers/searchController.js';
import * as searchSubscriptionController from '../controllers/searchSubscriptionController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(searchController.globalSearch));
router.get('/opportunities', asyncHandler(searchController.searchOpportunities));
router.get('/jobs', asyncHandler(searchController.searchJobs));
router.get('/gigs', asyncHandler(searchController.searchGigs));
router.get('/projects', asyncHandler(searchController.searchProjects));
router.get('/volunteering', asyncHandler(searchController.searchVolunteering));
router.get('/experience-launchpad', asyncHandler(searchController.searchLaunchpad));
router.get('/subscriptions', asyncHandler(searchSubscriptionController.listSubscriptions));
router.post('/subscriptions', asyncHandler(searchSubscriptionController.createSubscription));
router.patch('/subscriptions/:id', asyncHandler(searchSubscriptionController.updateSubscription));
router.delete('/subscriptions/:id', asyncHandler(searchSubscriptionController.deleteSubscription));

export default router;
