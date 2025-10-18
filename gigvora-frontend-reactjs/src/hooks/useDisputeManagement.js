import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchDisputes,
  fetchDispute,
  createDispute,
  updateDispute as updateDisputeCase,
  appendDisputeEvent,
  fetchDisputeSettings,
  updateDisputeSettings as persistDisputeSettings,
  fetchDisputeTemplates,
  createDisputeTemplate as persistDisputeTemplate,
  updateDisputeTemplate as modifyDisputeTemplate,
  deleteDisputeTemplate,
} from '../services/trust.js';

const DEFAULT_FILTERS = Object.freeze({
  status: 'open',
  sort: 'recent',
  page: 1,
  limit: 20,
});

function mergeFilters(base, patch) {
  return { ...base, ...(typeof patch === 'function' ? patch(base) : patch) };
}

export default function useDisputeManagement({ workspaceId, initialFilters } = {}) {
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS, ...(initialFilters ?? {}) }));
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCaseState, setSelectedCaseState] = useState({ loading: false, error: null, data: null });
  const [settingsState, setSettingsState] = useState({ loading: true, error: null, data: null });
  const [templatesState, setTemplatesState] = useState({ loading: true, error: null, data: [] });

  const loadDisputes = useCallback(
    async (overrides = {}) => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const params = { ...filters, ...overrides };
        if (workspaceId != null) {
          params.workspaceId = workspaceId;
        }
        const result = await fetchDisputes(params);
        setState({ loading: false, error: null, data: result });
        return result;
      } catch (error) {
        console.error('Unable to load disputes', error);
        setState((current) => ({ ...current, loading: false, error }));
        throw error;
      }
    },
    [filters, workspaceId],
  );

  useEffect(() => {
    loadDisputes().catch(() => null);
  }, [loadDisputes]);

  const loadSelectedCase = useCallback(
    async (caseId) => {
      if (!caseId) {
        setSelectedCaseState({ loading: false, error: null, data: null });
        return null;
      }
      setSelectedCaseState((current) => ({ ...current, loading: true, error: null }));
      try {
        const result = await fetchDispute(caseId);
        setSelectedCaseState({ loading: false, error: null, data: result.dispute ?? null });
        return result.dispute;
      } catch (error) {
        console.error('Unable to load dispute case', error);
        setSelectedCaseState((current) => ({ ...current, loading: false, error }));
        throw error;
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedCaseId != null) {
      loadSelectedCase(selectedCaseId).catch(() => null);
    }
  }, [selectedCaseId, loadSelectedCase]);

  const loadSettings = useCallback(async () => {
    setSettingsState((current) => ({ ...current, loading: true, error: null }));
    try {
      const params = workspaceId ? { workspaceId } : {};
      const settings = await fetchDisputeSettings(params);
      setSettingsState({ loading: false, error: null, data: settings });
      return settings;
    } catch (error) {
      console.error('Unable to load dispute workflow settings', error);
      setSettingsState((current) => ({ ...current, loading: false, error }));
      throw error;
    }
  }, [workspaceId]);

  useEffect(() => {
    loadSettings().catch(() => null);
  }, [loadSettings]);

  const loadTemplates = useCallback(async () => {
    setTemplatesState((current) => ({ ...current, loading: true, error: null }));
    try {
      const params = workspaceId ? { workspaceId, includeGlobal: true } : {};
      const templates = await fetchDisputeTemplates(params);
      setTemplatesState({ loading: false, error: null, data: templates });
      return templates;
    } catch (error) {
      console.error('Unable to load dispute templates', error);
      setTemplatesState((current) => ({ ...current, loading: false, error }));
      throw error;
    }
  }, [workspaceId]);

  useEffect(() => {
    loadTemplates().catch(() => null);
  }, [loadTemplates]);

  const refresh = useCallback(() => loadDisputes(), [loadDisputes]);

  const selectCase = useCallback((caseId) => {
    setSelectedCaseId(caseId);
  }, []);

  const createDisputeCase = useCallback(
    async (payload) => {
      const dispute = await createDispute(payload);
      await Promise.all([loadDisputes(), loadSelectedCase(dispute?.id)]);
      if (dispute?.id) {
        setSelectedCaseId(dispute.id);
      }
      return dispute;
    },
    [loadDisputes, loadSelectedCase],
  );

  const updateDispute = useCallback(
    async (disputeId, payload) => {
      const dispute = await updateDisputeCase(disputeId, payload);
      await Promise.all([loadDisputes(), loadSelectedCase(disputeId)]);
      return dispute;
    },
    [loadDisputes, loadSelectedCase],
  );

  const addDisputeEvent = useCallback(
    async (disputeId, payload) => {
      const result = await appendDisputeEvent(disputeId, payload);
      await loadSelectedCase(disputeId);
      return result;
    },
    [loadSelectedCase],
  );

  const saveSettings = useCallback(
    async (payload) => {
      const updated = await persistDisputeSettings({ ...(payload ?? {}), workspaceId: payload?.workspaceId ?? workspaceId });
      setSettingsState({ loading: false, error: null, data: updated });
      return updated;
    },
    [workspaceId],
  );

  const createTemplate = useCallback(
    async (payload) => {
      await persistDisputeTemplate({ ...(payload ?? {}), workspaceId: payload?.workspaceId ?? workspaceId });
      return loadTemplates();
    },
    [loadTemplates, workspaceId],
  );

  const updateTemplate = useCallback(
    async (templateId, payload) => {
      await modifyDisputeTemplate(templateId, payload ?? {});
      return loadTemplates();
    },
    [loadTemplates],
  );

  const removeTemplate = useCallback(
    async (templateId) => {
      await deleteDisputeTemplate(templateId);
      return loadTemplates();
    },
    [loadTemplates],
  );

  const derivedFilters = useMemo(() => ({ ...filters, workspaceId }), [filters, workspaceId]);

  const disputes = state.data?.disputes ?? [];
  const summary = state.data?.summary ?? {};
  const pagination = state.data?.pagination ?? {};

  return {
    filters: derivedFilters,
    setFilters: (patch) => setFilters((current) => mergeFilters(current, patch)),
    loading: state.loading,
    error: state.error,
    disputes,
    summary,
    pagination,
    refresh,
    selectedCaseId,
    selectCase,
    selectedCase: selectedCaseState.data,
    selectedCaseLoading: selectedCaseState.loading,
    selectedCaseError: selectedCaseState.error,
    createDispute: createDisputeCase,
    updateDispute,
    addDisputeEvent,
    settings: settingsState.data,
    settingsLoading: settingsState.loading,
    settingsError: settingsState.error,
    saveSettings,
    templates: templatesState.data,
    templatesLoading: templatesState.loading,
    templatesError: templatesState.error,
    createTemplate,
    updateTemplate,
    removeTemplate,
  };
}
