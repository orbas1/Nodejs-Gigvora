import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchFreelancerVolunteeringWorkspace,
  createFreelancerVolunteeringApplication,
  updateFreelancerVolunteeringApplication,
  deleteFreelancerVolunteeringApplication,
  createFreelancerVolunteeringResponse,
  updateFreelancerVolunteeringResponse,
  deleteFreelancerVolunteeringResponse,
  createFreelancerVolunteeringContract,
  updateFreelancerVolunteeringContract,
  deleteFreelancerVolunteeringContract,
  createFreelancerVolunteeringSpend,
  updateFreelancerVolunteeringSpend,
  deleteFreelancerVolunteeringSpend,
} from '../services/volunteering.js';

function normalizeFreelancerId(value) {
  if (!value && value !== 0) {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
}

export default function useVolunteeringManagement({ freelancerId, enabled = true } = {}) {
  const normalizedFreelancerId = useMemo(() => normalizeFreelancerId(freelancerId), [freelancerId]);
  const [workspace, setWorkspace] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState(null);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [lastErrorAt, setLastErrorAt] = useState(null);

  const refresh = useCallback(
    async ({ signal } = {}) => {
      if (!enabled || !normalizedFreelancerId) {
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchFreelancerVolunteeringWorkspace(normalizedFreelancerId, { signal });
        const resolvedWorkspace = payload?.workspace ?? payload ?? null;
        const resolvedMetadata = payload?.metadata ?? payload?.workspace?.metadata ?? null;
        setWorkspace(resolvedWorkspace);
        setMetadata(resolvedMetadata);
        setLastLoadedAt(new Date());
        setLastErrorAt(null);
        return payload;
      } catch (err) {
        if (err?.name === 'AbortError') {
          return null;
        }
        const normalizedError = err instanceof Error ? err : new Error('Unable to load volunteering workspace.');
        setError(normalizedError);
        setLastErrorAt(new Date());
        throw normalizedError;
      } finally {
        setLoading(false);
      }
    },
    [enabled, normalizedFreelancerId],
  );

  useEffect(() => {
    if (!enabled || !normalizedFreelancerId) {
      setWorkspace(null);
      setMetadata(null);
      setError(null);
      setLastLoadedAt(null);
      setLastErrorAt(null);
      return;
    }
    const controller = new AbortController();
    refresh({ signal: controller.signal }).catch((err) => {
      if (err?.name === 'AbortError') {
        return;
      }
      console.error('Failed to load volunteering workspace', err);
    });
    return () => controller.abort();
  }, [enabled, normalizedFreelancerId, refresh]);

  const runMutation = useCallback(
    async (executor) => {
      if (!normalizedFreelancerId) {
        throw new Error('Freelancer context is required for volunteering updates.');
      }
      setMutating(true);
      try {
        const result = await executor();
        await refresh();
        return result;
      } finally {
        setMutating(false);
      }
    },
    [normalizedFreelancerId, refresh],
  );

  const actions = useMemo(
    () => ({
      async createApplication(payload) {
        return runMutation(() =>
          createFreelancerVolunteeringApplication(normalizedFreelancerId, payload),
        );
      },
      async updateApplication(applicationId, payload) {
        return runMutation(() =>
          updateFreelancerVolunteeringApplication(normalizedFreelancerId, applicationId, payload),
        );
      },
      async deleteApplication(applicationId) {
        return runMutation(() =>
          deleteFreelancerVolunteeringApplication(normalizedFreelancerId, applicationId),
        );
      },
      async createResponse(applicationId, payload) {
        return runMutation(() =>
          createFreelancerVolunteeringResponse(normalizedFreelancerId, applicationId, payload),
        );
      },
      async updateResponse(responseId, payload) {
        return runMutation(() =>
          updateFreelancerVolunteeringResponse(normalizedFreelancerId, responseId, payload),
        );
      },
      async deleteResponse(responseId) {
        return runMutation(() =>
          deleteFreelancerVolunteeringResponse(normalizedFreelancerId, responseId),
        );
      },
      async createContract(payload) {
        return runMutation(() =>
          createFreelancerVolunteeringContract(normalizedFreelancerId, payload),
        );
      },
      async updateContract(contractId, payload) {
        return runMutation(() =>
          updateFreelancerVolunteeringContract(normalizedFreelancerId, contractId, payload),
        );
      },
      async deleteContract(contractId) {
        return runMutation(() =>
          deleteFreelancerVolunteeringContract(normalizedFreelancerId, contractId),
        );
      },
      async createSpend(contractId, payload) {
        return runMutation(() =>
          createFreelancerVolunteeringSpend(normalizedFreelancerId, contractId, payload),
        );
      },
      async updateSpend(spendId, payload) {
        return runMutation(() =>
          updateFreelancerVolunteeringSpend(normalizedFreelancerId, spendId, payload),
        );
      },
      async deleteSpend(spendId) {
        return runMutation(() =>
          deleteFreelancerVolunteeringSpend(normalizedFreelancerId, spendId),
        );
      },
    }),
    [normalizedFreelancerId, runMutation],
  );

  return {
    freelancerId: normalizedFreelancerId,
    workspace,
    metadata,
    loading,
    mutating,
    error,
    refresh,
    lastLoadedAt,
    lastErrorAt,
    ...actions,
  };
}
