import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';
import * as controller from '../controllers/agencyWalletController.js';

const router = Router();

router.use(authenticate(), requireRoles('agency', 'agency_admin', 'admin', 'finance'));

router.get('/overview', asyncHandler(controller.overview));
router.get('/accounts', asyncHandler(controller.listAccounts));
router.post('/accounts', asyncHandler(controller.createAccount));
router.put('/accounts/:accountId', asyncHandler(controller.updateAccount));
router.get('/accounts/:accountId/ledger', asyncHandler(controller.listLedger));
router.post('/accounts/:accountId/ledger', asyncHandler(controller.createLedger));

router.get('/funding-sources', asyncHandler(controller.listFundingSources));
router.post('/funding-sources', asyncHandler(controller.createFundingSource));
router.put('/funding-sources/:sourceId', asyncHandler(controller.updateFundingSource));

router.get('/payout-requests', asyncHandler(controller.listPayoutRequests));
router.post('/payout-requests', asyncHandler(controller.createPayoutRequest));
router.put('/payout-requests/:requestId', asyncHandler(controller.updatePayoutRequest));

router.get('/settings', asyncHandler(controller.getSettings));
router.put('/settings', asyncHandler(controller.updateSettings));

export default router;
