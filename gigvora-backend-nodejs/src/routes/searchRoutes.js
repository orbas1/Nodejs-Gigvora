import { Router } from 'express';
import * as searchController from '../controllers/searchController.js';
import * as searchSubscriptionController from '../controllers/searchSubscriptionController.js';
import validateRequest from '../middleware/validateRequest.js';
import { authenticateRequest } from '../middleware/authentication.js';
import {
  globalSearchQuerySchema,
  searchCollectionQuerySchema,
  searchOpportunitiesQuerySchema,
  createSubscriptionBodySchema,
  updateSubscriptionBodySchema,
  subscriptionParamsSchema,
} from '../validation/schemas/searchSchemas.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', validateRequest({ query: globalSearchQuerySchema }), asyncHandler(searchController.globalSearch));
router.get(
  '/opportunities',
  validateRequest({ query: searchOpportunitiesQuerySchema }),
  asyncHandler(searchController.searchOpportunities),
);
router.get('/jobs', validateRequest({ query: searchCollectionQuerySchema }), asyncHandler(searchController.searchJobs));
router.get('/gigs', validateRequest({ query: searchCollectionQuerySchema }), asyncHandler(searchController.searchGigs));
router.get('/projects', validateRequest({ query: searchCollectionQuerySchema }), asyncHandler(searchController.searchProjects));
router.get(
  '/volunteering',
  validateRequest({ query: searchCollectionQuerySchema }),
  asyncHandler(searchController.searchVolunteering),
);
router.get(
  '/experience-launchpad',
  validateRequest({ query: searchCollectionQuerySchema }),
  asyncHandler(searchController.searchLaunchpad),
);
router.get(
  '/subscriptions',
  authenticateRequest(),
  asyncHandler(searchSubscriptionController.listSubscriptions),
);
router.post(
  '/subscriptions',
  authenticateRequest(),
  validateRequest({ body: createSubscriptionBodySchema }),
  asyncHandler(searchSubscriptionController.createSubscription),
);
router.patch(
  '/subscriptions/:id',
  authenticateRequest(),
  validateRequest({ params: subscriptionParamsSchema, body: updateSubscriptionBodySchema }),
  asyncHandler(searchSubscriptionController.updateSubscription),
);
router.delete(
  '/subscriptions/:id',
  authenticateRequest(),
  validateRequest({ params: subscriptionParamsSchema }),
  asyncHandler(searchSubscriptionController.deleteSubscription),
);
router.post(
  '/subscriptions/:id/run',
  authenticateRequest(),
  validateRequest({ params: subscriptionParamsSchema }),
  asyncHandler(searchSubscriptionController.runSubscription),
);

export default router;
