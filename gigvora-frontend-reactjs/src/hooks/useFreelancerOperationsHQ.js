import { useCallback, useMemo, useState } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchOperationsHq,
  requestOperationsMembership,
  updateOperationsMembership,
  acknowledgeOperationsNotice,
  syncOperationsHq,
} from '../services/freelancerOperations.js';

const FALLBACK_OPERATIONS = Object.freeze({
  memberships: [
    {
      id: 'ops-core',
      name: 'Operations core',
      status: 'active',
      role: 'Operations lead',
      description: 'Full access to finance, compliance, and delivery orchestration.',
      lastReviewedAt: new Date().toISOString(),
    },
    {
      id: 'ops-compliance',
      name: 'Compliance guild',
      status: 'invited',
      role: 'Contributor',
      description: 'Collaborate on due diligence packs and document controls.',
      lastReviewedAt: null,
    },
    {
      id: 'ops-network',
      name: 'Growth network',
      status: 'available',
      role: 'Pending',
      description: 'Access co-selling pods, referrals, and partner briefs.',
      lastReviewedAt: null,
    },
  ],
  workflows: [
    {
      id: 'gig-onboarding',
      title: 'Gig onboarding',
      status: 'tracking',
      completion: 72,
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      blockers: ['Awaiting client briefing sign-off'],
    },
    {
      id: 'reg-audit',
      title: 'Regulatory audit pack',
      status: 'at-risk',
      completion: 38,
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      blockers: ['Need updated ID documents'],
    },
  ],
  notices: [
    {
      id: 'notice-kyc',
      tone: 'warning',
      title: 'Verify client KYC',
      message: 'Upload a verified address document to keep payouts uninterrupted.',
      createdAt: new Date().toISOString(),
      acknowledged: false,
    },
  ],
  metrics: {
    activeWorkflows: 3,
    escalations: 0,
    automationCoverage: 64,
    complianceScore: 92,
    lastSyncedAt: new Date().toISOString(),
  },
  compliance: {
    outstandingTasks: 2,
    recentApprovals: 5,
    nextReviewAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
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

  const safeId = freelancerId ?? 'demo-operations';

  const fetcher = useCallback(
    ({ signal, force } = {}) => {
      if (!freelancerId || !enabled) {
        return Promise.resolve(FALLBACK_OPERATIONS);
      }
      return fetchOperationsHq(freelancerId, { signal, fresh: Boolean(force) });
    },
    [enabled, freelancerId],
  );

  const resource = useCachedResource(`freelancer:operations-hq:${safeId}`, fetcher, {
    enabled,
    dependencies: [safeId],
    ttl: 1000 * 30,
  });

  const operations = resource.data ?? FALLBACK_OPERATIONS;
  const memberships = useMemo(
    () => operations.memberships ?? [],
    [operations.memberships],
  );
  const workflows = useMemo(
    () => operations.workflows ?? [],
    [operations.workflows],
  );
  const notices = useMemo(
    () => operations.notices ?? [],
    [operations.notices],
  );
  const metrics = operations.metrics ?? FALLBACK_OPERATIONS.metrics;
  const compliance = operations.compliance ?? FALLBACK_OPERATIONS.compliance;

  const refresh = useCallback((options) => resource.refresh(options), [resource]);

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
      compliance,
      handleAcknowledge,
      handleMembershipRequest,
      handleMembershipUpdate,
      handleSync,
      memberships,
      metrics,
      notices,
      operations,
      refresh,
      requestState,
      resource,
      workflows,
    ],
  );
}
