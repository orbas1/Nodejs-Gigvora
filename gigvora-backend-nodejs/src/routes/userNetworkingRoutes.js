import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as userNetworkingController from '../controllers/userNetworkingController.js';

const router = Router({ mergeParams: true });

router.get('/overview', asyncHandler(userNetworkingController.getOverview));

router.get('/bookings', asyncHandler(userNetworkingController.listBookings));
router.post('/bookings', asyncHandler(userNetworkingController.createBooking));
router.patch('/bookings/:bookingId', asyncHandler(userNetworkingController.updateBooking));

router.get('/purchases', asyncHandler(userNetworkingController.listPurchases));
router.post('/purchases', asyncHandler(userNetworkingController.createPurchase));
router.patch('/purchases/:orderId', asyncHandler(userNetworkingController.updatePurchase));

router.get('/connections', asyncHandler(userNetworkingController.listConnections));
router.post('/connections', asyncHandler(userNetworkingController.createConnection));
router.patch('/connections/:connectionId', asyncHandler(userNetworkingController.updateConnection));

export default router;
