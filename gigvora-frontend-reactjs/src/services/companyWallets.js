import { apiClient } from './apiClient.js';
import {
  buildParams,
  buildRequestOptions,
  optionalString,
  requireIdentifier,
  resolveSignal,
} from './serviceHelpers.js';

function normaliseWorkspace(context = {}) {
  return {
    workspaceId: optionalString(context.workspaceId),
    workspaceSlug: optionalString(context.workspaceSlug),
  };
}

function createOptions(context = {}, additional = {}) {
  const workspaceParams = buildParams(normaliseWorkspace(context));
  const extraParams = buildParams(additional.params ?? {});
  return buildRequestOptions({
    params: { ...workspaceParams, ...extraParams },
    signal: resolveSignal(context.signal, additional.signal),
  });
}

export async function fetchCompanyWallets(
  { workspaceId, workspaceSlug, includeInactive = false, signal } = {},
  options = {},
) {
  const requestOptions = createOptions(
    { workspaceId, workspaceSlug, signal },
    { params: { includeInactive: includeInactive ? true : undefined }, signal: options.signal },
  );
  return apiClient.get('/company/wallets', requestOptions);
}

export async function fetchCompanyWalletDetail(walletId, { workspaceId, workspaceSlug, signal } = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const requestOptions = createOptions({ workspaceId, workspaceSlug, signal }, { signal: options.signal });
  return apiClient.get(`/company/wallets/${walletIdentifier}`, requestOptions);
}

export async function createCompanyWallet(payload = {}, context = {}, options = {}) {
  const requestOptions = createOptions(context, options);
  return apiClient.post('/company/wallets', payload ?? {}, requestOptions);
}

export async function updateCompanyWallet(walletId, payload = {}, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const requestOptions = createOptions(context, options);
  return apiClient.patch(`/company/wallets/${walletIdentifier}`, payload ?? {}, requestOptions);
}

export async function createWalletTransaction(walletId, payload = {}, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const requestOptions = createOptions(context, options);
  return apiClient.post(`/company/wallets/${walletIdentifier}/transactions`, payload ?? {}, requestOptions);
}

export async function fetchWalletTransactions(
  walletId,
  { workspaceId, workspaceSlug, type, status, category, dateFrom, dateTo, limit, offset, signal } = {},
  options = {},
) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const requestOptions = createOptions(
    { workspaceId, workspaceSlug, signal },
    {
      params: {
        type: optionalString(type),
        status: optionalString(status),
        category: optionalString(category),
        dateFrom: optionalString(dateFrom),
        dateTo: optionalString(dateTo),
        limit,
        offset,
      },
      signal: options.signal,
    },
  );
  return apiClient.get(`/company/wallets/${walletIdentifier}/transactions`, requestOptions);
}

export async function createWalletFundingSource(walletId, payload = {}, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const requestOptions = createOptions(context, options);
  return apiClient.post(`/company/wallets/${walletIdentifier}/funding-sources`, payload ?? {}, requestOptions);
}

export async function updateWalletFundingSource(walletId, sourceId, payload = {}, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const sourceIdentifier = requireIdentifier(sourceId, 'sourceId');
  const requestOptions = createOptions(context, options);
  return apiClient.patch(
    `/company/wallets/${walletIdentifier}/funding-sources/${sourceIdentifier}`,
    payload ?? {},
    requestOptions,
  );
}

export async function createWalletPayoutMethod(walletId, payload = {}, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const requestOptions = createOptions(context, options);
  return apiClient.post(`/company/wallets/${walletIdentifier}/payout-methods`, payload ?? {}, requestOptions);
}

export async function updateWalletPayoutMethod(walletId, methodId, payload = {}, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const methodIdentifier = requireIdentifier(methodId, 'methodId');
  const requestOptions = createOptions(context, options);
  return apiClient.patch(
    `/company/wallets/${walletIdentifier}/payout-methods/${methodIdentifier}`,
    payload ?? {},
    requestOptions,
  );
}

export async function createWalletSpendingPolicy(walletId, payload = {}, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const requestOptions = createOptions(context, options);
  return apiClient.post(`/company/wallets/${walletIdentifier}/policies`, payload ?? {}, requestOptions);
}

export async function updateWalletSpendingPolicy(walletId, policyId, payload = {}, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const policyIdentifier = requireIdentifier(policyId, 'policyId');
  const requestOptions = createOptions(context, options);
  return apiClient.patch(
    `/company/wallets/${walletIdentifier}/policies/${policyIdentifier}`,
    payload ?? {},
    requestOptions,
  );
}

export async function retireWalletSpendingPolicy(walletId, policyId, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const policyIdentifier = requireIdentifier(policyId, 'policyId');
  const requestOptions = createOptions(context, options);
  return apiClient.delete(`/company/wallets/${walletIdentifier}/policies/${policyIdentifier}`, requestOptions);
}

export async function addWalletMember(walletId, payload = {}, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const requestOptions = createOptions(context, options);
  return apiClient.post(`/company/wallets/${walletIdentifier}/members`, payload ?? {}, requestOptions);
}

export async function updateWalletMember(walletId, memberId, payload = {}, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const memberIdentifier = requireIdentifier(memberId, 'memberId');
  const requestOptions = createOptions(context, options);
  return apiClient.patch(
    `/company/wallets/${walletIdentifier}/members/${memberIdentifier}`,
    payload ?? {},
    requestOptions,
  );
}

export async function removeWalletMember(walletId, memberId, context = {}, options = {}) {
  const walletIdentifier = requireIdentifier(walletId, 'walletId');
  const memberIdentifier = requireIdentifier(memberId, 'memberId');
  const requestOptions = createOptions(context, options);
  return apiClient.delete(`/company/wallets/${walletIdentifier}/members/${memberIdentifier}`, requestOptions);
}

export default {
  fetchCompanyWallets,
  fetchCompanyWalletDetail,
  createCompanyWallet,
  updateCompanyWallet,
  createWalletTransaction,
  fetchWalletTransactions,
  createWalletFundingSource,
  updateWalletFundingSource,
  createWalletPayoutMethod,
  updateWalletPayoutMethod,
  createWalletSpendingPolicy,
  updateWalletSpendingPolicy,
  retireWalletSpendingPolicy,
  addWalletMember,
  updateWalletMember,
  removeWalletMember,
};
