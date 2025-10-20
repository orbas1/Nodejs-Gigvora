import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import mentorshipController from '../controllers/mentorshipController.js';

const router = Router();

router.get('/dashboard', asyncHandler(mentorshipController.dashboard));
router.post('/availability', asyncHandler(mentorshipController.saveAvailability));
router.post('/packages', asyncHandler(mentorshipController.savePackages));
router.post('/profile', asyncHandler(mentorshipController.saveProfile));
router.post('/bookings', asyncHandler(mentorshipController.createBooking));
router.put('/bookings/:bookingId', asyncHandler(mentorshipController.updateBooking));
router.delete('/bookings/:bookingId', asyncHandler(mentorshipController.deleteBooking));
router.post('/finance/invoices', asyncHandler(mentorshipController.createInvoice));
router.put('/finance/invoices/:invoiceId', asyncHandler(mentorshipController.updateInvoice));
router.delete('/finance/invoices/:invoiceId', asyncHandler(mentorshipController.deleteInvoice));
router.post('/finance/payouts', asyncHandler(mentorshipController.createPayout));
router.put('/finance/payouts/:payoutId', asyncHandler(mentorshipController.updatePayout));
router.delete('/finance/payouts/:payoutId', asyncHandler(mentorshipController.deletePayout));

export default router;
