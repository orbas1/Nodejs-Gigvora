import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAgencyAiControl,
  updateAgencyAiSettings,
  createAgencyBidTemplate,
  updateAgencyBidTemplate,
  deleteAgencyBidTemplate,
} from '../services/agencyAi.js';

const INITIAL_STATE = {
  data: null,
  loading: true,
  error: null,
};

export default function useAgencyAiControl({ workspaceId, workspaceSlug } = {}) {
  const [state, setState] = useState(INITIAL_STATE);
  const [savingSettings, setSavingSettings] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);

  const refresh = useCallback(
    async ({ signal, quiet = false } = {}) => {
      if (!quiet) {
        setState((previous) => ({ ...previous, loading: true, error: null }));
      }
      try {
        const payload = await fetchAgencyAiControl({ workspaceId, workspaceSlug }, { signal });
        setState({ data: payload, loading: false, error: null });
        return payload;
      } catch (error) {
        if (error.name === 'AbortError') {
          return null;
        }
        setState((previous) => ({ ...previous, loading: false, error }));
        throw error;
      }
    },
    [workspaceId, workspaceSlug],
  );

  useEffect(() => {
    const controller = new AbortController();
    refresh({ signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [refresh]);

  const selectedWorkspace = state.data?.workspace ?? null;
  const effectiveWorkspaceId = workspaceId ?? selectedWorkspace?.id ?? null;
  const effectiveWorkspaceSlug = workspaceSlug ?? selectedWorkspace?.slug ?? null;

  const ensureWorkspaceContext = useCallback(() => {
    if (!effectiveWorkspaceId && !effectiveWorkspaceSlug) {
      throw new Error('A workspace is required to manage automation settings.');
    }
  }, [effectiveWorkspaceId, effectiveWorkspaceSlug]);

  const saveSettings = useCallback(
    async (updates) => {
      ensureWorkspaceContext();
      setSavingSettings(true);
      try {
        const payload = await updateAgencyAiSettings({
          workspaceId: effectiveWorkspaceId,
          workspaceSlug: effectiveWorkspaceSlug,
          ...updates,
        });
        setState({ data: payload, loading: false, error: null });
        return payload;
      } catch (error) {
        setState((previous) => ({ ...previous, error }));
        throw error;
      } finally {
        setSavingSettings(false);
      }
    },
    [ensureWorkspaceContext, effectiveWorkspaceId, effectiveWorkspaceSlug],
  );

  const addTemplate = useCallback(
    async (templatePayload) => {
      ensureWorkspaceContext();
      setTemplateBusy(true);
      try {
        const template = await createAgencyBidTemplate({
          workspaceId: effectiveWorkspaceId,
          workspaceSlug: effectiveWorkspaceSlug,
          ...templatePayload,
        });
        await refresh({ quiet: true });
        return template;
      } catch (error) {
        setState((previous) => ({ ...previous, error }));
        throw error;
      } finally {
        setTemplateBusy(false);
      }
    },
    [ensureWorkspaceContext, effectiveWorkspaceId, effectiveWorkspaceSlug, refresh],
  );

  const editTemplate = useCallback(
    async (templateId, templatePayload) => {
      ensureWorkspaceContext();
      setTemplateBusy(true);
      try {
        const template = await updateAgencyBidTemplate(templateId, {
          workspaceId: effectiveWorkspaceId,
          workspaceSlug: effectiveWorkspaceSlug,
          ...templatePayload,
        });
        await refresh({ quiet: true });
        return template;
      } catch (error) {
        setState((previous) => ({ ...previous, error }));
        throw error;
      } finally {
        setTemplateBusy(false);
      }
    },
    [ensureWorkspaceContext, effectiveWorkspaceId, effectiveWorkspaceSlug, refresh],
  );

  const removeTemplate = useCallback(
    async (templateId) => {
      ensureWorkspaceContext();
      setTemplateBusy(true);
      try {
        await deleteAgencyBidTemplate(templateId, {
          workspaceId: effectiveWorkspaceId,
          workspaceSlug: effectiveWorkspaceSlug,
        });
        await refresh({ quiet: true });
      } catch (error) {
        setState((previous) => ({ ...previous, error }));
        throw error;
      } finally {
        setTemplateBusy(false);
      }
    },
    [ensureWorkspaceContext, effectiveWorkspaceId, effectiveWorkspaceSlug, refresh],
  );

  const value = useMemo(
    () => ({
      data: state.data,
      loading: state.loading,
      error: state.error,
      refresh,
      savingSettings,
      templateBusy,
      saveSettings,
      addTemplate,
      editTemplate,
      removeTemplate,
    }),
    [state, refresh, savingSettings, templateBusy, saveSettings, addTemplate, editTemplate, removeTemplate],
  );

  return value;
}
