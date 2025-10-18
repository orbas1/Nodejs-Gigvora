import { useCallback, useMemo, useState } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchFreelancerEscrowOverview,
  createFreelancerEscrowAccount,
  updateFreelancerEscrowAccount,
  createFreelancerEscrowTransaction,
  releaseFreelancerEscrowTransaction,
  refundFreelancerEscrowTransaction,
  openFreelancerEscrowDispute,
  appendFreelancerEscrowDisputeEvent,
} from '../services/freelancerEscrow.js';
const DEFAULT_OVERVIEW = {
  metrics: {
    totalAccounts: 0,
    grossVolume: 0,
    netVolume: 0,
    outstanding: 0,
    released: 0,
    refunded: 0,
    disputedCount: 0,
    averageReleaseDays: null,
    longestReleaseDays: null,
  },
  accounts: [],
  transactions: [],
  releaseQueue: [],
  disputes: [],
  activityLog: [],
};

function normaliseOverview(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_OVERVIEW };
  }

  return {
    metrics: { ...DEFAULT_OVERVIEW.metrics, ...(raw.metrics ?? {}) },
    accounts: Array.isArray(raw.accounts) ? raw.accounts : [],
    transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    releaseQueue: Array.isArray(raw.releaseQueue) ? raw.releaseQueue : [],
    disputes: Array.isArray(raw.disputes) ? raw.disputes : [],
    activityLog: Array.isArray(raw.activityLog) ? raw.activityLog : [],
  };
}

export default function useFreelancerEscrow({ freelancerId, enabled = true, status } = {}) {
  const cacheKey = freelancerId ? `freelancer:escrow:${freelancerId}` : 'freelancer:escrow:demo';

  const fetcher = useCallback(
    async ({ signal } = {}) => {
      if (!freelancerId) {
        return normaliseOverview(DEFAULT_OVERVIEW);
      }
      const payload = await fetchFreelancerEscrowOverview(
        freelancerId,
        status ? { status } : {},
        { signal },
      );
      return normaliseOverview(payload);
    },
    [freelancerId, status],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [cacheKey, status],
    ttl: 1000 * 45,
  });

  const [actionState, setActionState] = useState({ action: null, status: 'idle', error: null });

  const overview = useMemo(() => normaliseOverview(resource.data), [resource.data]);

  const refresh = resource.refresh;

  const runAction = useCallback(
    async (actionName, executor) => {
      setActionState({ action: actionName, status: 'pending', error: null });
      try {
        const result = await executor();
        await refresh({ force: true });
        setActionState({ action: actionName, status: 'success', error: null });
        return result;
      } catch (error) {
        setActionState({ action: actionName, status: 'error', error });
        throw error;
      }
    },
    [refresh],
  );

  const createAccount = useCallback(
    (payload) => {
      if (!freelancerId) {
        return Promise.reject(new Error('Freelancer context required to create an escrow account.'));
      }
      return runAction('createAccount', () => createFreelancerEscrowAccount(freelancerId, payload));
    },
    [freelancerId, runAction],
  );

  const updateAccount = useCallback(
    (accountId, payload) => {
      if (!freelancerId) {
        return Promise.reject(new Error('Freelancer context required to update an escrow account.'));
      }
      return runAction('updateAccount', () => updateFreelancerEscrowAccount(freelancerId, accountId, payload));
    },
    [freelancerId, runAction],
  );

  const createTransaction = useCallback(
    (payload) => {
      if (!freelancerId) {
        return Promise.reject(new Error('Freelancer context required to create an escrow transaction.'));
      }
      return runAction('createTransaction', () => createFreelancerEscrowTransaction(freelancerId, payload));
    },
    [freelancerId, runAction],
  );

  const releaseTransaction = useCallback(
    (transactionId, payload = {}) => {
      if (!freelancerId) {
        return Promise.reject(new Error('Freelancer context required to release escrow funds.'));
      }
      return runAction('releaseTransaction', () =>
        releaseFreelancerEscrowTransaction(freelancerId, transactionId, payload),
      );
    },
    [freelancerId, runAction],
  );

  const refundTransaction = useCallback(
    (transactionId, payload = {}) => {
      if (!freelancerId) {
        return Promise.reject(new Error('Freelancer context required to refund escrow funds.'));
      }
      return runAction('refundTransaction', () =>
        refundFreelancerEscrowTransaction(freelancerId, transactionId, payload),
      );
    },
    [freelancerId, runAction],
  );

  const openDispute = useCallback(
    (transactionId, payload = {}) => {
      if (!freelancerId) {
        return Promise.reject(new Error('Freelancer context required to open a dispute.'));
      }
      return runAction('openDispute', () => openFreelancerEscrowDispute(freelancerId, transactionId, payload));
    },
    [freelancerId, runAction],
  );

  const appendDisputeEvent = useCallback(
    (disputeId, payload = {}) => {
      if (!freelancerId) {
        return Promise.reject(new Error('Freelancer context required to append a dispute event.'));
      }
      return runAction('appendDisputeEvent', () =>
        appendFreelancerEscrowDisputeEvent(freelancerId, disputeId, payload),
      );
    },
    [freelancerId, runAction],
  );

  return {
    overview,
    accounts: overview.accounts,
    transactions: overview.transactions,
    releaseQueue: overview.releaseQueue,
    disputes: overview.disputes,
    activityLog: overview.activityLog,
    metrics: overview.metrics,
    loading: resource.loading,
    error: resource.error,
    fromCache: resource.fromCache,
    lastUpdated: resource.lastUpdated,
    refresh,
    actionState,
    createAccount,
    updateAccount,
    createTransaction,
    releaseTransaction,
    refundTransaction,
    openDispute,
    appendDisputeEvent,
  };
}
