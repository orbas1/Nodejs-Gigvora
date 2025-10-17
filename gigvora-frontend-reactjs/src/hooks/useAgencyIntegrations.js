import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAgencyIntegrations,
  createAgencyIntegration,
  updateAgencyIntegration,
  rotateAgencyIntegrationSecret,
  createAgencyIntegrationWebhook,
  updateAgencyIntegrationWebhook,
  deleteAgencyIntegrationWebhook,
  testAgencyIntegrationConnection,
} from '../services/agencyIntegrations.js';

const DEFAULT_STATE = Object.freeze({
  loading: true,
  refreshing: false,
  error: null,
  connectors: [],
  auditLog: [],
  meta: {},
  lastLoadedAt: null,
});

export default function useAgencyIntegrations({ workspaceId: initialWorkspaceId } = {}) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId ?? null);

  const load = useCallback(async (targetWorkspaceId = null, { silent = false } = {}) => {
    const resolvedWorkspaceId = targetWorkspaceId ?? null;
    setState((previous) => ({
      ...previous,
      loading: silent ? previous.loading : true,
      refreshing: silent ? true : previous.refreshing,
      error: null,
    }));

    try {
      const data = await fetchAgencyIntegrations({ workspaceId: resolvedWorkspaceId ?? undefined });
      const nextWorkspaceId = data?.meta?.selectedWorkspaceId ?? resolvedWorkspaceId ?? null;
      setWorkspaceId((current) => (current === nextWorkspaceId ? current : nextWorkspaceId));
      setState((previous) => ({
        ...previous,
        loading: false,
        refreshing: false,
        error: null,
        connectors: Array.isArray(data?.connectors) ? data.connectors : [],
        auditLog: Array.isArray(data?.auditLog) ? data.auditLog : [],
        meta: data?.meta ?? {},
        lastLoadedAt: Date.now(),
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        refreshing: false,
        error: error?.message ?? 'Unable to load agency integrations.',
      }));
      throw error;
    }
  }, []);

  useEffect(() => {
    if (initialWorkspaceId != null) {
      setWorkspaceId(initialWorkspaceId);
    }
  }, [initialWorkspaceId]);

  useEffect(() => {
    load(workspaceId ?? null).catch(() => {});
  }, [workspaceId, load]);

  const currentWorkspaceId = useMemo(() => {
    const selected = state.meta?.selectedWorkspaceId;
    return selected ?? workspaceId ?? null;
  }, [state.meta?.selectedWorkspaceId, workspaceId]);

  const availableWorkspaces = useMemo(
    () => (Array.isArray(state.meta?.availableWorkspaces) ? state.meta.availableWorkspaces : []),
    [state.meta?.availableWorkspaces],
  );

  const availableProviders = useMemo(
    () => (Array.isArray(state.meta?.availableProviders) ? state.meta.availableProviders : []),
    [state.meta?.availableProviders],
  );

  const webhookEventCatalog = useMemo(
    () => (Array.isArray(state.meta?.webhookEventCatalog) ? state.meta.webhookEventCatalog : []),
    [state.meta?.webhookEventCatalog],
  );

  const summary = useMemo(() => state.meta?.summary ?? null, [state.meta?.summary]);

  const selectWorkspace = useCallback((nextWorkspaceId) => {
    if (nextWorkspaceId == null || nextWorkspaceId === '') {
      setWorkspaceId(null);
      return;
    }
    const parsed = Number(nextWorkspaceId);
    setWorkspaceId(Number.isFinite(parsed) ? parsed : null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      await load(currentWorkspaceId ?? null, { silent: true });
    } catch (error) {
      // load already updated error state
    }
  }, [load, currentWorkspaceId]);

  const clearError = useCallback(() => {
    setState((previous) => ({ ...previous, error: null }));
  }, []);

  const handleCreateIntegration = useCallback(
    async (payload) => {
      const effectiveWorkspaceId = payload?.workspaceId ?? currentWorkspaceId;
      if (!effectiveWorkspaceId) {
        throw new Error('workspaceId is required to create an integration');
      }
      try {
        await createAgencyIntegration({ ...payload, workspaceId: effectiveWorkspaceId });
        await load(effectiveWorkspaceId, { silent: true });
      } catch (error) {
        setState((previous) => ({ ...previous, error: error?.message ?? 'Unable to create integration.' }));
        throw error;
      }
    },
    [currentWorkspaceId, load],
  );

  const handleUpdateIntegration = useCallback(
    async (integrationId, payload) => {
      try {
        await updateAgencyIntegration(integrationId, payload ?? {});
        await load(currentWorkspaceId ?? null, { silent: true });
      } catch (error) {
        setState((previous) => ({ ...previous, error: error?.message ?? 'Unable to update integration.' }));
        throw error;
      }
    },
    [currentWorkspaceId, load],
  );

  const handleRotateSecret = useCallback(
    async (integrationId, payload) => {
      try {
        const result = await rotateAgencyIntegrationSecret(integrationId, payload ?? {});
        await load(currentWorkspaceId ?? null, { silent: true });
        return result;
      } catch (error) {
        setState((previous) => ({ ...previous, error: error?.message ?? 'Unable to rotate credentials.' }));
        throw error;
      }
    },
    [currentWorkspaceId, load],
  );

  const handleCreateWebhook = useCallback(
    async (integrationId, payload) => {
      try {
        const webhook = await createAgencyIntegrationWebhook(integrationId, payload ?? {});
        await load(currentWorkspaceId ?? null, { silent: true });
        return webhook;
      } catch (error) {
        setState((previous) => ({ ...previous, error: error?.message ?? 'Unable to create webhook.' }));
        throw error;
      }
    },
    [currentWorkspaceId, load],
  );

  const handleUpdateWebhook = useCallback(
    async (integrationId, webhookId, payload) => {
      try {
        const webhook = await updateAgencyIntegrationWebhook(integrationId, webhookId, payload ?? {});
        await load(currentWorkspaceId ?? null, { silent: true });
        return webhook;
      } catch (error) {
        setState((previous) => ({ ...previous, error: error?.message ?? 'Unable to update webhook.' }));
        throw error;
      }
    },
    [currentWorkspaceId, load],
  );

  const handleDeleteWebhook = useCallback(
    async (integrationId, webhookId) => {
      try {
        const result = await deleteAgencyIntegrationWebhook(integrationId, webhookId);
        await load(currentWorkspaceId ?? null, { silent: true });
        return result;
      } catch (error) {
        setState((previous) => ({ ...previous, error: error?.message ?? 'Unable to delete webhook.' }));
        throw error;
      }
    },
    [currentWorkspaceId, load],
  );

  const handleTestConnection = useCallback(
    async (integrationId) => {
      try {
        const result = await testAgencyIntegrationConnection(integrationId);
        await load(currentWorkspaceId ?? null, { silent: true });
        return result;
      } catch (error) {
        setState((previous) => ({ ...previous, error: error?.message ?? 'Unable to test integration.' }));
        throw error;
      }
    },
    [currentWorkspaceId, load],
  );

  return {
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    connectors: state.connectors,
    auditLog: state.auditLog,
    meta: state.meta,
    summary,
    workspace: state.meta?.workspace ?? null,
    availableWorkspaces,
    availableProviders,
    webhookEventCatalog,
    selectedWorkspaceId: currentWorkspaceId,
    lastLoadedAt: state.lastLoadedAt,
    setWorkspaceId: selectWorkspace,
    refresh,
    clearError,
    createIntegration: handleCreateIntegration,
    updateIntegration: handleUpdateIntegration,
    rotateSecret: handleRotateSecret,
    createWebhook: handleCreateWebhook,
    updateWebhook: handleUpdateWebhook,
    deleteWebhook: handleDeleteWebhook,
    testConnection: handleTestConnection,
  };
}
