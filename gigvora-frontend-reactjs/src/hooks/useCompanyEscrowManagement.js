import { useCallback, useMemo } from 'react';
import { useCachedResource } from './useCachedResource.js';
import {
  buildCompanyEscrowCacheKey,
  fetchCompanyEscrowOverview,
  createEscrowAccount,
  updateEscrowAccount,
  initiateEscrowTransaction,
  releaseEscrowTransaction,
  refundEscrowTransaction,
  updateEscrowAutomationSettings,
} from '../services/companyEscrow.js';

export function useCompanyEscrowManagement({ workspaceId, workspaceSlug, lookbackDays = 30, enabled = true } = {}) {
  const cacheKey = useMemo(
    () => buildCompanyEscrowCacheKey({ workspaceId, workspaceSlug, lookbackDays }),
    [workspaceId, workspaceSlug, lookbackDays],
  );

  const resource = useCachedResource(
    cacheKey,
    ({ signal, force }) =>
      fetchCompanyEscrowOverview({ workspaceId, workspaceSlug, lookbackDays, signal, forceRefresh: force }),
    { ttl: 1000 * 45, dependencies: [workspaceId, workspaceSlug, lookbackDays], enabled },
  );

  const createAccountHandler = useCallback(
    async (payload) => {
      const result = await createEscrowAccount({ ...payload, workspaceId, workspaceSlug });
      await resource.refresh({ force: true });
      return result;
    },
    [resource, workspaceId, workspaceSlug],
  );

  const updateAccountHandler = useCallback(
    async (accountId, payload) => {
      const result = await updateEscrowAccount(accountId, { ...payload, workspaceId, workspaceSlug });
      await resource.refresh({ force: true });
      return result;
    },
    [resource, workspaceId, workspaceSlug],
  );

  const initiateTransactionHandler = useCallback(
    async (payload) => {
      const result = await initiateEscrowTransaction({ ...payload, workspaceId, workspaceSlug });
      await resource.refresh({ force: true });
      return result;
    },
    [resource, workspaceId, workspaceSlug],
  );

  const releaseTransactionHandler = useCallback(
    async (transactionId, payload) => {
      const result = await releaseEscrowTransaction(transactionId, { ...payload, workspaceId, workspaceSlug });
      await resource.refresh({ force: true });
      return result;
    },
    [resource, workspaceId, workspaceSlug],
  );

  const refundTransactionHandler = useCallback(
    async (transactionId, payload) => {
      const result = await refundEscrowTransaction(transactionId, { ...payload, workspaceId, workspaceSlug });
      await resource.refresh({ force: true });
      return result;
    },
    [resource, workspaceId, workspaceSlug],
  );

  const updateAutomationHandler = useCallback(
    async (payload) => {
      const result = await updateEscrowAutomationSettings({ ...payload, workspaceId, workspaceSlug });
      await resource.refresh({ force: true });
      return result;
    },
    [resource, workspaceId, workspaceSlug],
  );

  return {
    ...resource,
    createAccount: createAccountHandler,
    updateAccount: updateAccountHandler,
    initiateTransaction: initiateTransactionHandler,
    releaseTransaction: releaseTransactionHandler,
    refundTransaction: refundTransactionHandler,
    updateAutomation: updateAutomationHandler,
  };
}

export default useCompanyEscrowManagement;
