import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as adminWalletController from '../controllers/adminWalletController.js';
import validateRequest from '../middleware/validateRequest.js';
import { requireAdmin } from '../middleware/authenticate.js';
import {
  walletAccountListQuerySchema,
  walletAccountCreateSchema,
  walletAccountUpdateSchema,
  walletLedgerQuerySchema,
  walletLedgerEntryCreateSchema,
} from '../validation/schemas/adminSchemas.js';

const router = Router({ mergeParams: true });

router.use(requireAdmin);

router.get(
  '/accounts',
  validateRequest({ query: walletAccountListQuerySchema }),
  asyncHandler(adminWalletController.listAccounts),
);

router.post(
  '/accounts',
  validateRequest({ body: walletAccountCreateSchema }),
  asyncHandler(adminWalletController.createAccount),
);

router.get('/accounts/:accountId', asyncHandler(adminWalletController.getAccount));

router.put(
  '/accounts/:accountId',
  validateRequest({ body: walletAccountUpdateSchema }),
  asyncHandler(adminWalletController.updateAccount),
);

router.get(
  '/accounts/:accountId/ledger',
  validateRequest({ query: walletLedgerQuerySchema }),
  asyncHandler(adminWalletController.listLedgerEntries),
);

router.post(
  '/accounts/:accountId/ledger',
  validateRequest({ body: walletLedgerEntryCreateSchema }),
  asyncHandler(adminWalletController.createLedgerEntry),
);

export default router;
