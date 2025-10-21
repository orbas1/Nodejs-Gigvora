import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchAgencyInboxWorkspace,
  saveAgencyInboxPreferences,
  createAgencyInboxSavedReply,
  updateAgencyInboxSavedReply,
  deleteAgencyInboxSavedReply,
  createAgencyInboxRoutingRule,
  updateAgencyInboxRoutingRule,
  deleteAgencyInboxRoutingRule,
  saveAgencyInboxAutomations,
} from '../services/agencyInbox.js';

const FALLBACK_WORKSPACE = Object.freeze({
  workspaceId: null,
  summary: {
    workspaceId: null,
    unreadThreads: 0,
    awaitingReply: 0,
    avgResponseMinutes: null,
    openSupportCases: 0,
    escalationsOpen: 0,
    assignmentsActive: 0,
    autoResponderEnabled: false,
    sentimentScore: null,
    lastUpdated: null,
  },
  preferences: {
    timezone: 'UTC',
    notificationsEmail: true,
    notificationsPush: true,
    autoResponderEnabled: false,
    autoResponderMessage: '',
    escalationKeywords: [],
    defaultSavedReplyId: null,
    inboxName: 'Agency inbox',
    updatedAt: null,
  },
  automations: {
    escalationMatrix: [],
    routing: [],
    talentAlerts: [],
  },
  savedReplies: [],
  routingRules: [],
  activeThreads: [],
  supportCases: [],
  participantDirectory: [],
  lastSyncedAt: null,
});

function buildCacheKey(workspaceId) {
  return `agency:inbox-workspace:${workspaceId ?? 'default'}`;
}

export default function useAgencyInboxWorkspace({ workspaceId, enabled = true } = {}) {
  const cacheKey = useMemo(() => buildCacheKey(workspaceId), [workspaceId]);

  const fetcher = useCallback(
    async ({ signal } = {}) => {
      if (!workspaceId || !enabled) {
        return FALLBACK_WORKSPACE;
      }

      try {
        const response = await fetchAgencyInboxWorkspace({ workspaceId }, { signal });
        if (response && typeof response === 'object') {
          return {
            ...FALLBACK_WORKSPACE,
            workspaceId,
            ...response,
          };
        }
      } catch (error) {
        if (signal?.aborted) {
          throw error;
        }
        console.warn('Failed to load agency inbox workspace', error);
      }

      return {
        ...FALLBACK_WORKSPACE,
        workspaceId,
      };
    },
    [enabled, workspaceId],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled: Boolean(enabled && workspaceId),
    dependencies: [workspaceId ?? 'default'],
    ttl: 1000 * 45,
  });

  const workspace = useMemo(() => {
    if (resource.data && typeof resource.data === 'object') {
      return resource.data;
    }
    return FALLBACK_WORKSPACE;
  }, [resource.data]);

  const refresh = useCallback((options) => resource.refresh(options), [resource]);

  const updatePreferences = useCallback(
    async (payload) => {
      if (!workspaceId) {
        return workspace.preferences;
      }

      const preferences = await saveAgencyInboxPreferences({ workspaceId, ...payload });
      await refresh({ force: true });
      return preferences;
    },
    [refresh, workspace.preferences, workspaceId],
  );

  const addSavedReply = useCallback(
    async (payload) => {
      if (!workspaceId) {
        return null;
      }

      const reply = await createAgencyInboxSavedReply({ workspaceId, ...payload });
      await refresh({ force: true });
      return reply;
    },
    [refresh, workspaceId],
  );

  const editSavedReply = useCallback(
    async (replyId, payload) => {
      if (!workspaceId || !replyId) {
        return null;
      }

      const reply = await updateAgencyInboxSavedReply(replyId, { workspaceId, ...payload });
      await refresh({ force: true });
      return reply;
    },
    [refresh, workspaceId],
  );

  const removeSavedReply = useCallback(
    async (replyId) => {
      if (!workspaceId || !replyId) {
        return false;
      }

      await deleteAgencyInboxSavedReply(replyId, { workspaceId });
      await refresh({ force: true });
      return true;
    },
    [refresh, workspaceId],
  );

  const addRoutingRule = useCallback(
    async (payload) => {
      if (!workspaceId) {
        return null;
      }

      const rule = await createAgencyInboxRoutingRule({ workspaceId, ...payload });
      await refresh({ force: true });
      return rule;
    },
    [refresh, workspaceId],
  );

  const editRoutingRule = useCallback(
    async (ruleId, payload) => {
      if (!workspaceId || !ruleId) {
        return null;
      }

      const rule = await updateAgencyInboxRoutingRule(ruleId, { workspaceId, ...payload });
      await refresh({ force: true });
      return rule;
    },
    [refresh, workspaceId],
  );

  const removeRoutingRule = useCallback(
    async (ruleId) => {
      if (!workspaceId || !ruleId) {
        return false;
      }

      await deleteAgencyInboxRoutingRule(ruleId, { workspaceId });
      await refresh({ force: true });
      return true;
    },
    [refresh, workspaceId],
  );

  const saveAutomations = useCallback(
    async (payload) => {
      if (!workspaceId) {
        return workspace.automations;
      }

      const automations = await saveAgencyInboxAutomations({ workspaceId, ...payload });
      await refresh({ force: true });
      return automations;
    },
    [refresh, workspace.automations, workspaceId],
  );

  return {
    workspace,
    loading: resource.loading,
    error: resource.error,
    fromCache: resource.fromCache,
    lastUpdated: resource.lastUpdated,
    refresh,
    updatePreferences,
    addSavedReply,
    editSavedReply,
    removeSavedReply,
    addRoutingRule,
    editRoutingRule,
    removeRoutingRule,
    saveAutomations,
  };
}
