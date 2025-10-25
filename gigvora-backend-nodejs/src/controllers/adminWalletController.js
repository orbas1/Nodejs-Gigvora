import {
  createWalletAccount,
  createWalletLedgerEntry,
  getWalletAccountById,
  listWalletAccounts,
  listWalletLedgerEntries,
  updateWalletAccount,
} from '../services/adminWalletService.js';
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
  const result = await listWalletAccounts(req.query ?? {});
  res.json(result);
}

export async function getAccount(req, res) {
  const accountId = parseAccountId(req.params);
  const account = await getWalletAccountById(accountId);
  res.json(account);
}

export async function createAccount(req, res) {
  const account = await createWalletAccount(req.body ?? {});
  res.status(201).json(account);
}

export async function updateAccount(req, res) {
  const accountId = parseAccountId(req.params);
  const account = await updateWalletAccount(accountId, req.body ?? {});
  res.json(account);
}

export async function listLedgerEntries(req, res) {
  const accountId = parseAccountId(req.params);
  const result = await listWalletLedgerEntries(accountId, req.query ?? {});
  res.json(result);
}

export async function createLedgerEntry(req, res) {
  const accountId = parseAccountId(req.params);
  const entry = await createWalletLedgerEntry(accountId, req.body ?? {}, {
    initiatedById: req.user?.id ?? null,
  });
  res.status(201).json(entry);
}
