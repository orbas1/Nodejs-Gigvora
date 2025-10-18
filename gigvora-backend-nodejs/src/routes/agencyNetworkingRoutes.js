import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as agencyNetworkingController from '../controllers/agencyNetworkingController.js';

const router = Router();

router.get('/overview', asyncHandler(agencyNetworkingController.overview));

router.get('/bookings', asyncHandler(agencyNetworkingController.listBookings));
router.post('/bookings', asyncHandler(agencyNetworkingController.createBooking));
router.patch('/bookings/:bookingId', asyncHandler(agencyNetworkingController.updateBooking));

router.get('/purchases', asyncHandler(agencyNetworkingController.listPurchases));
router.post('/purchases', asyncHandler(agencyNetworkingController.createPurchase));
router.patch('/purchases/:orderId', asyncHandler(agencyNetworkingController.updatePurchase));

router.get('/connections', asyncHandler(agencyNetworkingController.listConnections));
router.post('/connections', asyncHandler(agencyNetworkingController.createConnection));
router.patch('/connections/:connectionId', asyncHandler(agencyNetworkingController.updateConnection));

export default router;
