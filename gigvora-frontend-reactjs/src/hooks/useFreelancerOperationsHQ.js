import { useCallback, useMemo, useState } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchOperationsHq,
  requestOperationsMembership,
  updateOperationsMembership,
  acknowledgeOperationsNotice,
  syncOperationsHq,
} from '../services/freelancerOperations.js';

const CACHE_TTL = 1000 * 30;
const DEFAULT_METRICS = Object.freeze({
  activeWorkflows: 0,
  escalations: 0,
  automationCoverage: 0,
  complianceScore: 0,
  lastSyncedAt: null,
  currency: 'USD',
});
const DEFAULT_COMPLIANCE = Object.freeze({
  outstandingTasks: 0,
  recentApprovals: 0,
  nextReviewAt: null,
});

const REQUEST_STATUS = Object.freeze({
  idle: 'idle',
  submitting: 'submitting',
  success: 'success',
  error: 'error',
});

export default function useFreelancerOperationsHQ({ freelancerId, enabled = true } = {}) {
  const [requestState, setRequestState] = useState({ status: REQUEST_STATUS.idle, error: null });
  const [acknowledgingId, setAcknowledgingId] = useState(null);

  const isEnabled = Boolean(freelancerId) && enabled;
  const cacheKey = freelancerId
    ? `freelancer:operations-hq:${freelancerId}`
    : 'freelancer:operations-hq:pending';

  const fetcher = useCallback(
    ({ signal, force } = {}) => {
      if (!isEnabled) {
        return Promise.resolve(null);
      }
      return fetchOperationsHq(freelancerId, { signal, fresh: Boolean(force) });
    },
    [freelancerId, isEnabled],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled: isEnabled,
    dependencies: [cacheKey],
    ttl: CACHE_TTL,
  });

  const refresh = useCallback((options) => resource.refresh(options), [resource]);

  const operations = resource.data ?? null;
  const memberships = useMemo(
    () => (Array.isArray(operations?.memberships) ? operations.memberships : []),
    [operations?.memberships],
  );
  const workflows = useMemo(
    () => (Array.isArray(operations?.workflows) ? operations.workflows : []),
    [operations?.workflows],
  );
  const notices = useMemo(
    () => (Array.isArray(operations?.notices) ? operations.notices : []),
    [operations?.notices],
  );
  const metrics = useMemo(
    () => ({ ...DEFAULT_METRICS, ...(operations?.metrics ?? {}) }),
    [operations?.metrics],
  );
  const compliance = useMemo(
    () => ({ ...DEFAULT_COMPLIANCE, ...(operations?.compliance ?? {}) }),
    [operations?.compliance],
  );

  const handleMembershipRequest = useCallback(
    async (membershipId, payload = {}) => {
      if (!freelancerId) {
        throw new Error('Freelancer profile required to request membership.');
      }
      setRequestState({ status: REQUEST_STATUS.submitting, error: null });
      try {
        const result = await requestOperationsMembership(freelancerId, membershipId, payload);
        await refresh({ force: true });
        setRequestState({ status: REQUEST_STATUS.success, error: null });
        return result;
      } catch (error) {
        setRequestState({ status: REQUEST_STATUS.error, error });
        throw error;
      }
    },
    [freelancerId, refresh],
  );

  const handleMembershipUpdate = useCallback(
    async (membershipId, payload = {}) => {
      if (!freelancerId) {
        throw new Error('Freelancer profile required to update membership.');
      }
      const result = await updateOperationsMembership(freelancerId, membershipId, payload);
      await refresh({ force: true });
      return result;
    },
    [freelancerId, refresh],
  );

  const handleAcknowledge = useCallback(
    async (noticeId) => {
      if (!freelancerId) {
        return { fallback: true };
      }
      setAcknowledgingId(noticeId);
      try {
        const result = await acknowledgeOperationsNotice(freelancerId, noticeId);
        await refresh({ force: true });
        return { fallback: false, result };
      } finally {
        setAcknowledgingId(null);
      }
    },
    [freelancerId, refresh],
  );

  const handleSync = useCallback(
    async () => {
      if (!freelancerId) {
        return { fallback: true };
      }
      await syncOperationsHq(freelancerId);
      await refresh({ force: true });
      return { fallback: false };
    },
    [freelancerId, refresh],
  );

  return useMemo(
    () => ({
      ...resource,
      operations,
      memberships,
      workflows,
      notices,
      metrics,
      compliance,
      refresh,
      requestMembership: handleMembershipRequest,
      updateMembership: handleMembershipUpdate,
      acknowledgeNotice: handleAcknowledge,
      syncOperations: handleSync,
      requestState,
      acknowledgingId,
    }),
    [
      acknowledgingId,
      handleAcknowledge,
      handleMembershipRequest,
      handleMembershipUpdate,
      handleSync,
      memberships,
      notices,
      operations,
      refresh,
      requestState,
      resource,
      metrics,
      compliance,
      workflows,
    ],
  );
}
