import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import agencyEscrowController from '../controllers/agencyEscrowController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

router.use(authenticate(), requireRoles('agency', 'agency_admin', 'admin'));

router.get('/escrow/overview', asyncHandler(agencyEscrowController.fetchOverview));
router.get('/escrow/accounts', asyncHandler(agencyEscrowController.fetchAccounts));
router.post('/escrow/accounts', asyncHandler(agencyEscrowController.createAccount));
router.patch('/escrow/accounts/:accountId', asyncHandler(agencyEscrowController.updateAccount));

router.get('/escrow/transactions', asyncHandler(agencyEscrowController.fetchTransactions));
router.post('/escrow/transactions', asyncHandler(agencyEscrowController.createTransaction));
router.patch('/escrow/transactions/:transactionId', asyncHandler(agencyEscrowController.updateTransaction));
router.post('/escrow/transactions/:transactionId/release', asyncHandler(agencyEscrowController.releaseTransaction));
router.post('/escrow/transactions/:transactionId/refund', asyncHandler(agencyEscrowController.refundTransaction));

router.patch('/escrow/settings', asyncHandler(agencyEscrowController.updateSettings));

export default router;

