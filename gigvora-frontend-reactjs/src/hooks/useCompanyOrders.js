import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchCompanyOrdersDashboard,
  createCompanyOrder,
  updateCompanyOrder,
  deleteCompanyOrder,
  createCompanyOrderTimeline,
  updateCompanyOrderTimeline,
  postCompanyOrderMessage,
  createCompanyOrderEscrow,
  updateCompanyOrderEscrow,
  submitCompanyOrderReview,
} from '../services/companyOrders.js';

export function useCompanyOrders({ status, enabled = true } = {}) {
  const cacheKey = useMemo(() => `company:orders:${status ?? 'all'}`, [status]);

  const fetcher = useCallback(({ signal } = {}) => fetchCompanyOrdersDashboard({ status, signal }), [status]);

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled,
    ttl: 1000 * 30,
  });

  const { data, refresh, ...rest } = resource;

  const withRefresh = useCallback(
    async (operation) => {
      const result = await operation();
      await refresh({ force: true });
      return result;
    },
    [refresh],
  );

  const createOrder = useCallback((payload) => withRefresh(() => createCompanyOrder(payload)), [withRefresh]);

  const updateOrder = useCallback(
    (orderId, payload) => withRefresh(() => updateCompanyOrder(orderId, payload)),
    [withRefresh],
  );

  const removeOrder = useCallback((orderId) => withRefresh(() => deleteCompanyOrder(orderId)), [withRefresh]);

  const addTimelineEvent = useCallback(
    (orderId, payload) => withRefresh(() => createCompanyOrderTimeline(orderId, payload)),
    [withRefresh],
  );

  const updateTimelineEvent = useCallback(
    (orderId, eventId, payload) => withRefresh(() => updateCompanyOrderTimeline(orderId, eventId, payload)),
    [withRefresh],
  );

  const postMessage = useCallback(
    (orderId, payload) => withRefresh(() => postCompanyOrderMessage(orderId, payload)),
    [withRefresh],
  );

  const createEscrow = useCallback(
    (orderId, payload) => withRefresh(() => createCompanyOrderEscrow(orderId, payload)),
    [withRefresh],
  );

  const updateEscrow = useCallback(
    (orderId, checkpointId, payload) => withRefresh(() => updateCompanyOrderEscrow(orderId, checkpointId, payload)),
    [withRefresh],
  );

  const submitReview = useCallback(
    (orderId, payload) => withRefresh(() => submitCompanyOrderReview(orderId, payload)),
    [withRefresh],
  );

  return {
    ...rest,
    data,
    refresh,
    summary: data?.summary ?? {},
    metrics: data?.metrics ?? {},
    purchasedGigs: data?.purchasedGigs ?? {},
    permissions: data?.permissions ?? { canManageOrders: true },
    timeline: data?.timeline ?? { upcoming: [], recent: [] },
    chat: data?.chat ?? { recent: [] },
    createOrder,
    updateOrder,
    removeOrder,
    addTimelineEvent,
    updateTimelineEvent,
    postMessage,
    createEscrow,
    updateEscrow,
    submitReview,
  };
}

export default useCompanyOrders;
