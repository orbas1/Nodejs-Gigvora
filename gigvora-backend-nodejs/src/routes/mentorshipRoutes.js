import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import mentorshipController from '../controllers/mentorshipController.js';
import authenticate from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  bookingParamsSchema,
  clientParamsSchema,
  eventParamsSchema,
  ticketParamsSchema,
  messageParamsSchema,
  documentParamsSchema,
  transactionParamsSchema,
  invoiceParamsSchema,
  payoutParamsSchema,
  hubUpdateParamsSchema,
  hubActionParamsSchema,
  hubResourceParamsSchema,
  orderParamsSchema,
  campaignParamsSchema,
  widgetParamsSchema,
  creationStudioParamsSchema,
} from '../validation/schemas/mentorWorkspaceSchemas.js';

const router = Router();

const MENTOR_ROLES = ['mentor', 'admin'];

router.use(
  authenticate({
    roles: MENTOR_ROLES,
    allowAdminOverride: true,
  }),
);

router.get('/dashboard', asyncHandler(mentorshipController.dashboard));
router.post('/availability', asyncHandler(mentorshipController.saveAvailability));
router.post('/packages', asyncHandler(mentorshipController.savePackages));
router.post('/profile', asyncHandler(mentorshipController.saveProfile));
router.post('/bookings', asyncHandler(mentorshipController.createBooking));
router.put(
  '/bookings/:bookingId',
  validateRequest({ params: bookingParamsSchema }),
  asyncHandler(mentorshipController.updateBooking),
);
router.delete(
  '/bookings/:bookingId',
  validateRequest({ params: bookingParamsSchema }),
  asyncHandler(mentorshipController.deleteBooking),
);
router.post('/clients', asyncHandler(mentorshipController.createClient));
router.put(
  '/clients/:clientId',
  validateRequest({ params: clientParamsSchema }),
  asyncHandler(mentorshipController.updateClient),
);
router.delete(
  '/clients/:clientId',
  validateRequest({ params: clientParamsSchema }),
  asyncHandler(mentorshipController.deleteClient),
);
router.post('/calendar/events', asyncHandler(mentorshipController.createEvent));
router.put(
  '/calendar/events/:eventId',
  validateRequest({ params: eventParamsSchema }),
  asyncHandler(mentorshipController.updateEvent),
);
router.delete(
  '/calendar/events/:eventId',
  validateRequest({ params: eventParamsSchema }),
  asyncHandler(mentorshipController.deleteEvent),
);
router.post('/support/tickets', asyncHandler(mentorshipController.createSupportTicket));
router.put(
  '/support/tickets/:ticketId',
  validateRequest({ params: ticketParamsSchema }),
  asyncHandler(mentorshipController.updateSupportTicket),
);
router.delete(
  '/support/tickets/:ticketId',
  validateRequest({ params: ticketParamsSchema }),
  asyncHandler(mentorshipController.deleteSupportTicket),
);
router.post('/inbox/messages', asyncHandler(mentorshipController.createMessage));
router.put(
  '/inbox/messages/:messageId',
  validateRequest({ params: messageParamsSchema }),
  asyncHandler(mentorshipController.updateMessage),
);
router.delete(
  '/inbox/messages/:messageId',
  validateRequest({ params: messageParamsSchema }),
  asyncHandler(mentorshipController.deleteMessage),
);
router.put('/verification/status', asyncHandler(mentorshipController.saveVerificationStatus));
router.post('/verification/documents', asyncHandler(mentorshipController.createVerificationDocument));
router.put(
  '/verification/documents/:documentId',
  validateRequest({ params: documentParamsSchema }),
  asyncHandler(mentorshipController.updateVerificationDocument),
);
router.delete(
  '/verification/documents/:documentId',
  validateRequest({ params: documentParamsSchema }),
  asyncHandler(mentorshipController.deleteVerificationDocument),
);
router.post('/wallet/transactions', asyncHandler(mentorshipController.createWalletTransaction));
router.put(
  '/wallet/transactions/:transactionId',
  validateRequest({ params: transactionParamsSchema }),
  asyncHandler(mentorshipController.updateWalletTransaction),
);
router.delete(
  '/wallet/transactions/:transactionId',
  validateRequest({ params: transactionParamsSchema }),
  asyncHandler(mentorshipController.deleteWalletTransaction),
);
router.post('/finance/invoices', asyncHandler(mentorshipController.createInvoice));
router.put(
  '/finance/invoices/:invoiceId',
  validateRequest({ params: invoiceParamsSchema }),
  asyncHandler(mentorshipController.updateInvoice),
);
router.delete(
  '/finance/invoices/:invoiceId',
  validateRequest({ params: invoiceParamsSchema }),
  asyncHandler(mentorshipController.deleteInvoice),
);
router.post('/finance/payouts', asyncHandler(mentorshipController.createPayout));
router.put(
  '/finance/payouts/:payoutId',
  validateRequest({ params: payoutParamsSchema }),
  asyncHandler(mentorshipController.updatePayout),
);
router.delete(
  '/finance/payouts/:payoutId',
  validateRequest({ params: payoutParamsSchema }),
  asyncHandler(mentorshipController.deletePayout),
);

router.post('/hub/updates', asyncHandler(mentorshipController.createHubUpdate));
router.put(
  '/hub/updates/:updateId',
  validateRequest({ params: hubUpdateParamsSchema }),
  asyncHandler(mentorshipController.updateHubUpdate),
);
router.delete(
  '/hub/updates/:updateId',
  validateRequest({ params: hubUpdateParamsSchema }),
  asyncHandler(mentorshipController.deleteHubUpdate),
);

router.post('/hub/actions', asyncHandler(mentorshipController.createHubAction));
router.put(
  '/hub/actions/:actionId',
  validateRequest({ params: hubActionParamsSchema }),
  asyncHandler(mentorshipController.updateHubAction),
);
router.delete(
  '/hub/actions/:actionId',
  validateRequest({ params: hubActionParamsSchema }),
  asyncHandler(mentorshipController.deleteHubAction),
);

router.post('/hub/resources', asyncHandler(mentorshipController.createHubResource));
router.put(
  '/hub/resources/:resourceId',
  validateRequest({ params: hubResourceParamsSchema }),
  asyncHandler(mentorshipController.updateHubResource),
);
router.delete(
  '/hub/resources/:resourceId',
  validateRequest({ params: hubResourceParamsSchema }),
  asyncHandler(mentorshipController.deleteHubResource),
);

router.put('/hub/spotlight', asyncHandler(mentorshipController.saveHubSpotlight));

router.post('/orders', asyncHandler(mentorshipController.createOrder));
router.put(
  '/orders/:orderId',
  validateRequest({ params: orderParamsSchema }),
  asyncHandler(mentorshipController.updateOrder),
);
router.delete(
  '/orders/:orderId',
  validateRequest({ params: orderParamsSchema }),
  asyncHandler(mentorshipController.deleteOrder),
);

router.post('/ads/campaigns', asyncHandler(mentorshipController.createAdCampaign));
router.put(
  '/ads/campaigns/:campaignId',
  validateRequest({ params: campaignParamsSchema }),
  asyncHandler(mentorshipController.updateAdCampaign),
);
router.delete(
  '/ads/campaigns/:campaignId',
  validateRequest({ params: campaignParamsSchema }),
  asyncHandler(mentorshipController.deleteAdCampaign),
);

router.post('/metrics/widgets', asyncHandler(mentorshipController.createMetricWidget));
router.put(
  '/metrics/widgets/:widgetId',
  validateRequest({ params: widgetParamsSchema }),
  asyncHandler(mentorshipController.updateMetricWidget),
);
router.delete(
  '/metrics/widgets/:widgetId',
  validateRequest({ params: widgetParamsSchema }),
  asyncHandler(mentorshipController.deleteMetricWidget),
);
router.put('/metrics/reporting', asyncHandler(mentorshipController.saveMetricReporting));

router.put('/settings', asyncHandler(mentorshipController.saveSettings));
router.put('/system/preferences', asyncHandler(mentorshipController.saveSystemPreferences));

router.get('/creation-studio', asyncHandler(mentorshipController.creationStudioWorkspace));
router.post('/creation-studio/items', asyncHandler(mentorshipController.createCreationStudioItem));
router.put(
  '/creation-studio/items/:itemId',
  validateRequest({ params: creationStudioParamsSchema }),
  asyncHandler(mentorshipController.updateCreationStudioItem),
);
router.post(
  '/creation-studio/items/:itemId/publish',
  validateRequest({ params: creationStudioParamsSchema }),
  asyncHandler(mentorshipController.publishCreationStudioItem),
);
router.post(
  '/creation-studio/items/:itemId/share',
  validateRequest({ params: creationStudioParamsSchema }),
  asyncHandler(mentorshipController.shareCreationStudioItem),
);
router.post(
  '/creation-studio/items/:itemId/archive',
  validateRequest({ params: creationStudioParamsSchema }),
  asyncHandler(mentorshipController.archiveCreationStudioItem),
);
router.delete(
  '/creation-studio/items/:itemId',
  validateRequest({ params: creationStudioParamsSchema }),
  asyncHandler(mentorshipController.deleteCreationStudioItem),
);

export default router;
