import { useCallback, useEffect, useMemo, useState } from 'react';
import useSession from './useSession.js';
import {
  fetchIntegrationControlTower,
  updateCrmIntegration,
  rotateCrmCredential,
  updateCrmFieldMappings,
  updateCrmRoleAssignments,
  triggerCrmManualSync,
  createCrmIncident,
  resolveCrmIncident,
} from '../services/companyIntegrations.js';

const EMPTY_SUMMARY = Object.freeze({
  total: 0,
  connected: 0,
  requiresAttention: 0,
  openIncidents: 0,
  lastSyncedAt: null,
  environments: {},
});

const INITIAL_STATE = Object.freeze({
  loading: true,
  hydrated: false,
  connectors: [],
  summary: EMPTY_SUMMARY,
  auditLog: [],
  lastSyncedAt: null,
  defaults: {},
  error: null,
});

function groupByCategory(connectors = []) {
  return connectors.reduce((map, connector) => {
    const category = connector?.category ?? 'other';
    if (!map.has(category)) {
      map.set(category, []);
    }
    map.get(category).push(connector);
    return map;
  }, new Map());
}

export default function useIntegrationControlTower({ workspaceId } = {}) {
  const { session } = useSession();
  const [state, setState] = useState(INITIAL_STATE);

  const actor = useMemo(
    () => ({ id: session?.id ?? null, name: session?.name ?? null }),
    [session?.id, session?.name],
  );

  const load = useCallback(
    async (signal) => {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const data = await fetchIntegrationControlTower({ workspaceId, signal });
        setState({
          loading: false,
          hydrated: true,
          connectors: data?.connectors ?? [],
          summary: data?.summary ?? EMPTY_SUMMARY,
          auditLog: data?.auditLog ?? [],
          lastSyncedAt: data?.lastSyncedAt ?? null,
          defaults: data?.defaults ?? {},
          error: null,
        });
      } catch (error) {
        console.error('Failed to load integration control tower data', error);
        setState((previous) => ({ ...previous, loading: false, error }));
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const connectorsByCategory = useMemo(
    () => groupByCategory(state.connectors),
    [state.connectors],
  );

  const refresh = useCallback(() => load(), [load]);

  const safeWorkspaceId = workspaceId ?? null;

  const toggleConnection = useCallback(
    async (providerKey, nextStatus = 'connected') => {
      await updateCrmIntegration(providerKey, {
        status: nextStatus,
        workspaceId: safeWorkspaceId,
        actorId: actor.id,
        actorName: actor.name,
      });
      await load();
    },
    [actor.id, actor.name, load, safeWorkspaceId],
  );

  const updateConnectorSettings = useCallback(
    async (providerKey, updates = {}) => {
      await updateCrmIntegration(providerKey, {
        ...updates,
        workspaceId: safeWorkspaceId,
        actorId: actor.id,
        actorName: actor.name,
      });
      await load();
    },
    [actor.id, actor.name, load, safeWorkspaceId],
  );

  const rotateApiKey = useCallback(
    async (providerKey, secret, { integrationId, credentialType, expiresAt } = {}) => {
      if (!integrationId) {
        return;
      }
      await rotateCrmCredential(integrationId, {
        workspaceId: safeWorkspaceId,
        providerKey,
        secret,
        credentialType,
        expiresAt,
        actorId: actor.id,
        actorName: actor.name,
      });
      await load();
    },
    [actor.id, actor.name, load, safeWorkspaceId],
  );

  const markIncidentResolved = useCallback(
    async (providerKey, incidentId, { integrationId } = {}) => {
      if (!integrationId || !incidentId) {
        return;
      }
      await resolveCrmIncident(integrationId, incidentId, {
        workspaceId: safeWorkspaceId,
        providerKey,
        actorId: actor.id,
        actorName: actor.name,
      });
      await load();
    },
    [actor.id, actor.name, load, safeWorkspaceId],
  );

  const updateFieldMappings = useCallback(
    async (providerKey, mappings, { integrationId } = {}) => {
      if (!integrationId) {
        return;
      }
      await updateCrmFieldMappings(integrationId, {
        workspaceId: safeWorkspaceId,
        providerKey,
        mappings,
        actorId: actor.id,
        actorName: actor.name,
      });
      await load();
    },
    [actor.id, actor.name, load, safeWorkspaceId],
  );

  const updateRoleAssignments = useCallback(
    async (providerKey, assignments, { integrationId } = {}) => {
      if (!integrationId) {
        return;
      }
      await updateCrmRoleAssignments(integrationId, {
        workspaceId: safeWorkspaceId,
        providerKey,
        assignments,
        actorId: actor.id,
        actorName: actor.name,
      });
      await load();
    },
    [actor.id, actor.name, load, safeWorkspaceId],
  );

  const triggerSync = useCallback(
    async (providerKey, { integrationId, trigger = 'manual', notes = null } = {}) => {
      if (!integrationId) {
        return;
      }
      await triggerCrmManualSync(integrationId, {
        workspaceId: safeWorkspaceId,
        providerKey,
        trigger,
        notes,
        actorId: actor.id,
        actorName: actor.name,
      });
      await load();
    },
    [actor.id, actor.name, load, safeWorkspaceId],
  );

  const createIncidentRecord = useCallback(
    async (providerKey, payload = {}, { integrationId } = {}) => {
      if (!integrationId) {
        return;
      }
      await createCrmIncident(integrationId, {
        workspaceId: safeWorkspaceId,
        providerKey,
        severity: payload.severity,
        summary: payload.summary,
        description: payload.description,
        actorId: actor.id,
        actorName: actor.name,
      });
      await load();
    },
    [actor.id, actor.name, load, safeWorkspaceId],
  );

  const addManualAuditEvent = useCallback((entry) => {
    if (!entry) {
      return;
    }
    setState((previous) => ({
      ...previous,
      auditLog: [entry, ...previous.auditLog].slice(0, 30),
    }));
  }, []);

  return {
    loading: state.loading,
    hydrated: state.hydrated,
    connectors: state.connectors,
    connectorsByCategory,
    summary: state.summary,
    auditLog: state.auditLog,
    lastSyncedAt: state.lastSyncedAt,
    defaults: state.defaults,
    error: state.error,
    refresh,
    toggleConnection,
    updateConnectorSettings,
    rotateApiKey,
    markIncidentResolved,
    updateFieldMappings,
    updateRoleAssignments,
    triggerSync,
    createIncidentRecord,
    addManualAuditEvent,
  };
}
