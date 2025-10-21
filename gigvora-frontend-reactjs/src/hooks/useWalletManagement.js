import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchWalletManagement,
  createFundingSource,
  updateFundingSource,
  createTransferRule,
  updateTransferRule,
  deleteTransferRule,
  createTransferRequest,
  updateTransferRequest,
} from '../services/walletManagement.js';

export default function useWalletManagement(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ensureUserContext = useCallback(() => {
    if (!userId) {
      throw new Error('userId is required to manage wallet resources.');
    }
  }, [userId]);

  const load = useCallback(
    async ({ refresh = false } = {}) => {
      if (!userId) {
        setData(null);
        setLoading(false);
        setError(new Error('userId is required to load wallet management.'));
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const snapshot = await fetchWalletManagement(userId, { refresh });
        setData(snapshot);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError(new Error('userId is required to load wallet management.'));
      return;
    }
    load();
  }, [userId, load]);

  const actions = useMemo(
    () => ({
      async refresh() {
        ensureUserContext();
        await load({ refresh: true });
      },
      async createFundingSource(payload) {
        ensureUserContext();
        await createFundingSource(userId, payload);
        await load({ refresh: true });
      },
      async updateFundingSource(fundingSourceId, payload) {
        ensureUserContext();
        await updateFundingSource(userId, fundingSourceId, payload);
        await load({ refresh: true });
      },
      async createTransferRule(payload) {
        ensureUserContext();
        await createTransferRule(userId, payload);
        await load({ refresh: true });
      },
      async updateTransferRule(ruleId, payload) {
        ensureUserContext();
        await updateTransferRule(userId, ruleId, payload);
        await load({ refresh: true });
      },
      async deleteTransferRule(ruleId) {
        ensureUserContext();
        await deleteTransferRule(userId, ruleId);
        await load({ refresh: true });
      },
      async createTransferRequest(payload) {
        ensureUserContext();
        await createTransferRequest(userId, payload);
        await load({ refresh: true });
      },
      async updateTransferRequest(transferId, payload) {
        ensureUserContext();
        await updateTransferRequest(userId, transferId, payload);
        await load({ refresh: true });
      },
    }),
    [ensureUserContext, userId, load],
  );

  return { data, loading, error, actions, reload: load };
}
