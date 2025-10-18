import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchVolunteeringDashboard,
  createVolunteeringPost,
  updateVolunteeringPost,
  deleteVolunteeringPost,
  createVolunteeringApplication,
  updateVolunteeringApplication,
  deleteVolunteeringApplication,
  createVolunteeringResponse,
  updateVolunteeringResponse,
  deleteVolunteeringResponse,
  createVolunteeringInterview,
  updateVolunteeringInterview,
  deleteVolunteeringInterview,
  createVolunteeringContract,
  updateVolunteeringContract,
  addVolunteeringSpend,
  updateVolunteeringSpend,
  deleteVolunteeringSpend,
} from '../services/companyVolunteering.js';

function buildCacheKey(workspaceId, workspaceSlug, lookbackDays) {
  const identifier = workspaceId ?? workspaceSlug ?? 'default';
  return `company:volunteering:${identifier}:${lookbackDays ?? '90'}`;
}

export function useCompanyVolunteeringManagement({ workspaceId, workspaceSlug, lookbackDays = 90, enabled = true } = {}) {
  const cacheKey = useMemo(
    () => buildCacheKey(workspaceId ?? null, workspaceSlug ?? null, lookbackDays ?? 90),
    [workspaceId, workspaceSlug, lookbackDays],
  );

  const fetcher = useCallback(
    ({ signal } = {}) =>
      fetchVolunteeringDashboard({ workspaceId, workspaceSlug, lookbackDays, signal }),
    [workspaceId, workspaceSlug, lookbackDays],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [workspaceId, workspaceSlug, lookbackDays],
    ttl: 1000 * 30,
  });

  const { data, refresh, ...rest } = resource;
  const resolvedWorkspaceId = workspaceId ?? data?.workspace?.id ?? undefined;

  const withRefresh = useCallback(
    async (operation) => {
      const result = await operation();
      await refresh({ force: true });
      return result;
    },
    [refresh],
  );

  const createPost = useCallback(
    (payload) =>
      withRefresh(() =>
        createVolunteeringPost({ ...payload, workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const updatePost = useCallback(
    (postId, payload) =>
      withRefresh(() =>
        updateVolunteeringPost(postId, { ...payload, workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const removePost = useCallback(
    (postId) =>
      withRefresh(() => deleteVolunteeringPost(postId, { workspaceId: resolvedWorkspaceId, workspaceSlug })),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const createApplication = useCallback(
    (postId, payload) =>
      withRefresh(() =>
        createVolunteeringApplication(postId, { ...payload, workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const updateApplication = useCallback(
    (applicationId, payload) =>
      withRefresh(() =>
        updateVolunteeringApplication(applicationId, {
          ...payload,
          workspaceId: resolvedWorkspaceId,
          workspaceSlug,
        }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const removeApplication = useCallback(
    (applicationId) =>
      withRefresh(() =>
        deleteVolunteeringApplication(applicationId, { workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const createResponse = useCallback(
    (applicationId, payload) =>
      withRefresh(() =>
        createVolunteeringResponse(applicationId, { ...payload, workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const updateResponse = useCallback(
    (responseId, payload) =>
      withRefresh(() =>
        updateVolunteeringResponse(responseId, { ...payload, workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const removeResponse = useCallback(
    (responseId) =>
      withRefresh(() =>
        deleteVolunteeringResponse(responseId, { workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const scheduleInterview = useCallback(
    (applicationId, payload) =>
      withRefresh(() =>
        createVolunteeringInterview(applicationId, {
          ...payload,
          workspaceId: resolvedWorkspaceId,
          workspaceSlug,
        }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const updateInterview = useCallback(
    (interviewId, payload) =>
      withRefresh(() =>
        updateVolunteeringInterview(interviewId, {
          ...payload,
          workspaceId: resolvedWorkspaceId,
          workspaceSlug,
        }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const removeInterview = useCallback(
    (interviewId) =>
      withRefresh(() =>
        deleteVolunteeringInterview(interviewId, { workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const createContract = useCallback(
    (applicationId, payload) =>
      withRefresh(() =>
        createVolunteeringContract(applicationId, {
          ...payload,
          workspaceId: resolvedWorkspaceId,
          workspaceSlug,
        }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const updateContract = useCallback(
    (contractId, payload) =>
      withRefresh(() =>
        updateVolunteeringContract(contractId, {
          ...payload,
          workspaceId: resolvedWorkspaceId,
          workspaceSlug,
        }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const addSpend = useCallback(
    (contractId, payload) =>
      withRefresh(() =>
        addVolunteeringSpend(contractId, {
          ...payload,
          workspaceId: resolvedWorkspaceId,
          workspaceSlug,
        }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const updateSpend = useCallback(
    (spendId, payload) =>
      withRefresh(() =>
        updateVolunteeringSpend(spendId, {
          ...payload,
          workspaceId: resolvedWorkspaceId,
          workspaceSlug,
        }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const removeSpend = useCallback(
    (spendId) =>
      withRefresh(() =>
        deleteVolunteeringSpend(spendId, { workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  return {
    ...rest,
    data,
    refresh,
    workspaceId: resolvedWorkspaceId,
    workspaceSlug,
    posts: data?.posts ?? [],
    summary: data?.summary ?? null,
    totals: data?.totals ?? null,
    permissions: data?.permissions ?? {},
    createPost,
    updatePost,
    removePost,
    createApplication,
    updateApplication,
    removeApplication,
    createResponse,
    updateResponse,
    removeResponse,
    scheduleInterview,
    updateInterview,
    removeInterview,
    createContract,
    updateContract,
    addSpend,
    updateSpend,
    removeSpend,
  };
}

export default useCompanyVolunteeringManagement;
