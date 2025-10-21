import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import * as userNetworkingController from '../controllers/userNetworkingController.js';
import authenticate from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router({ mergeParams: true });

const USER_NETWORKING_ROLES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'admin'];

const requireNetworkingAccess = authenticate({
  roles: USER_NETWORKING_ROLES,
  matchParam: 'userId',
  allowAdminOverride: true,
});

const bookingParamsSchema = z
  .object({
    bookingId: z.coerce.number().int().positive({ message: 'bookingId must be a positive integer.' }),
  })
  .strip();

const orderParamsSchema = z
  .object({
    orderId: z.coerce.number().int().positive({ message: 'orderId must be a positive integer.' }),
  })
  .strip();

const connectionParamsSchema = z
  .object({
    connectionId: z.coerce.number().int().positive({ message: 'connectionId must be a positive integer.' }),
  })
  .strip();

router.get('/overview', requireNetworkingAccess, asyncHandler(userNetworkingController.getOverview));

router.get('/bookings', requireNetworkingAccess, asyncHandler(userNetworkingController.listBookings));
router.post('/bookings', requireNetworkingAccess, asyncHandler(userNetworkingController.createBooking));
router.patch(
  '/bookings/:bookingId',
  requireNetworkingAccess,
  validateRequest({ params: bookingParamsSchema }),
  asyncHandler(userNetworkingController.updateBooking),
);

router.get('/purchases', requireNetworkingAccess, asyncHandler(userNetworkingController.listPurchases));
router.post('/purchases', requireNetworkingAccess, asyncHandler(userNetworkingController.createPurchase));
router.patch(
  '/purchases/:orderId',
  requireNetworkingAccess,
  validateRequest({ params: orderParamsSchema }),
  asyncHandler(userNetworkingController.updatePurchase),
);

router.get('/connections', requireNetworkingAccess, asyncHandler(userNetworkingController.listConnections));
router.post('/connections', requireNetworkingAccess, asyncHandler(userNetworkingController.createConnection));
router.patch(
  '/connections/:connectionId',
  requireNetworkingAccess,
  validateRequest({ params: connectionParamsSchema }),
  asyncHandler(userNetworkingController.updateConnection),
);

export default router;
