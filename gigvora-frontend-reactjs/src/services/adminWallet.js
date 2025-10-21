import { apiClient } from './apiClient.js';
import {
  assertAdminAccess,
  buildAdminCacheKey,
  createRequestOptions,
  encodeIdentifier,
  fetchWithCache,
  invalidateCacheByTag,
  normaliseIdentifier,
  sanitiseQueryParams,
} from './adminServiceHelpers.js';

const WALLET_ROLES = ['super-admin', 'platform-admin', 'finance-admin', 'operations-admin', 'wallet-admin'];
const CACHE_TAGS = {
  accounts: 'admin:wallets:accounts',
  account: (identifier) => `admin:wallets:account:${identifier}`,
  ledger: (identifier) => `admin:wallets:account:${identifier}:ledger`,
};

function buildAccountListParams(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    ownerId: params.ownerId ?? params.owner_id,
    search: params.search,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

function buildLedgerParams(params = {}) {
  return sanitiseQueryParams({
    type: params.type,
    from: params.from,
    to: params.to,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

function accountCache(accountId) {
  const identifier = normaliseIdentifier(accountId, { label: 'accountId' });
  return {
    key: buildAdminCacheKey('admin:wallets:account', { accountId: identifier }),
    tag: CACHE_TAGS.account(identifier),
    identifier,
  };
}

async function performAccountMutation(accountId, request) {
  const response = await request();
  const tags = [CACHE_TAGS.accounts];
  if (accountId) {
    const identifier = normaliseIdentifier(accountId, { label: 'accountId' });
    tags.push(CACHE_TAGS.account(identifier), CACHE_TAGS.ledger(identifier));
  }
  invalidateCacheByTag(tags);
  return response;
}

export function fetchWalletAccounts(params = {}, options = {}) {
  assertAdminAccess(WALLET_ROLES);
  const cleanedParams = buildAccountListParams(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:wallets:accounts', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/wallets/accounts', createRequestOptions(requestOptions, cleanedParams)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.accounts,
    },
  );
}

export function fetchWalletAccount(accountId, options = {}) {
  assertAdminAccess(WALLET_ROLES);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const { key, tag } = accountCache(accountId);
  const identifier = encodeIdentifier(accountId, { label: 'accountId' });

  return fetchWithCache(
    key,
    () =>
      apiClient.get(`/admin/wallets/accounts/${identifier}`, createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag,
    },
  );
}

export function createWalletAccount(payload = {}, options = {}) {
  assertAdminAccess(WALLET_ROLES);
  return performAccountMutation(null, () =>
    apiClient.post('/admin/wallets/accounts', payload, options),
  );
}

export function updateWalletAccount(accountId, payload = {}, options = {}) {
  assertAdminAccess(WALLET_ROLES);
  const identifier = encodeIdentifier(accountId, { label: 'accountId' });
  return performAccountMutation(accountId, () =>
    apiClient.put(`/admin/wallets/accounts/${identifier}`, payload, options),
  );
}

export function fetchWalletLedger(accountId, params = {}, options = {}) {
  assertAdminAccess(WALLET_ROLES);
  const cleanedParams = buildLedgerParams(params);
  const { forceRefresh = false, cacheTtl = 30000, ...requestOptions } = options ?? {};
  const { identifier } = accountCache(accountId);
  const cacheKey = buildAdminCacheKey('admin:wallets:ledger', {
    accountId: identifier,
    ...cleanedParams,
  });

  return fetchWithCache(
    cacheKey,
    () =>
      apiClient.get(
        `/admin/wallets/accounts/${encodeIdentifier(accountId, { label: 'accountId' })}/ledger`,
        createRequestOptions(requestOptions, cleanedParams),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.ledger(identifier),
    },
  );
}

export function createWalletLedgerEntry(accountId, payload = {}, options = {}) {
  assertAdminAccess(WALLET_ROLES);
  const identifier = encodeIdentifier(accountId, { label: 'accountId' });
  return performAccountMutation(accountId, () =>
    apiClient.post(`/admin/wallets/accounts/${identifier}/ledger`, payload, options),
  );
}

export default {
  fetchWalletAccounts,
  fetchWalletAccount,
  createWalletAccount,
  updateWalletAccount,
  fetchWalletLedger,
  createWalletLedgerEntry,
};
