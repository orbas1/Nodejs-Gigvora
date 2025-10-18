import adminWalletService from '../services/adminWalletService.js';
import { ValidationError } from '../utils/errors.js';

function parseAccountId(params = {}) {
  const value = params.accountId ?? params.id;
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('accountId must be a positive integer.');
  }
  return numeric;
}

export async function listAccounts(req, res) {
  const result = await adminWalletService.listWalletAccounts(req.query ?? {});
  res.json(result);
}

export async function getAccount(req, res) {
  const accountId = parseAccountId(req.params);
  const account = await adminWalletService.getWalletAccountById(accountId);
  res.json(account);
}

export async function createAccount(req, res) {
  const account = await adminWalletService.createWalletAccount(req.body ?? {});
  res.status(201).json(account);
}

export async function updateAccount(req, res) {
  const accountId = parseAccountId(req.params);
  const account = await adminWalletService.updateWalletAccount(accountId, req.body ?? {});
  res.json(account);
}

export async function listLedgerEntries(req, res) {
  const accountId = parseAccountId(req.params);
  const result = await adminWalletService.listWalletLedgerEntries(accountId, req.query ?? {});
  res.json(result);
}

export async function createLedgerEntry(req, res) {
  const accountId = parseAccountId(req.params);
  const entry = await adminWalletService.createWalletLedgerEntry(accountId, req.body ?? {}, {
    initiatedById: req.user?.id ?? null,
  });
  res.status(201).json(entry);
}

export default {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  listLedgerEntries,
  createLedgerEntry,
};
