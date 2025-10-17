import { Router } from 'express';
import {
  createEscrowAccount,
  updateEscrowAccount,
  initiateEscrow,
  updateEscrowTransaction,
  releaseEscrow,
  refundEscrow,
  createDispute,
  appendDisputeEvent,
  listDisputes,
  getDispute,
  updateDispute,
  getTrustOverview,
} from '../controllers/trustController.js';

const router = Router();

router.get('/overview', getTrustOverview);
router.post('/escrow/accounts', createEscrowAccount);
router.patch('/escrow/accounts/:accountId', updateEscrowAccount);
router.post('/escrow/transactions', initiateEscrow);
router.patch('/escrow/transactions/:transactionId', updateEscrowTransaction);
router.post('/escrow/transactions/:transactionId/release', releaseEscrow);
router.post('/escrow/transactions/:transactionId/refund', refundEscrow);
router.post('/disputes', createDispute);
router.post('/disputes/:disputeId/events', appendDisputeEvent);
router.get('/disputes', listDisputes);
router.get('/disputes/:disputeId', getDispute);
router.patch('/disputes/:disputeId', updateDispute);

export default router;
