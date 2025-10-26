import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchInboxWorkspace,
  saveInboxPreferences,
  createInboxSavedReply,
  updateInboxSavedReply,
  deleteInboxSavedReply,
  createInboxRoutingRule,
  updateInboxRoutingRule,
  deleteInboxRoutingRule,
  pinInboxThread,
  unpinInboxThread,
  reorderInboxPinnedThreads,
} from '../services/inbox.js';

const FALLBACK_WORKSPACE = Object.freeze({
  userId: null,
  summary: {
    userId: null,
    unreadThreads: 0,
    awaitingReply: 0,
    avgResponseMinutes: null,
    openSupportCases: 0,
    autoResponderEnabled: false,
    lastUpdated: null,
  },
  preferences: {
    id: null,
    userId: null,
    timezone: 'UTC',
    workingHours: {
      timezone: 'UTC',
      availability: {
        monday: { active: true, start: '09:00', end: '17:00' },
        tuesday: { active: true, start: '09:00', end: '17:00' },
        wednesday: { active: true, start: '09:00', end: '17:00' },
        thursday: { active: true, start: '09:00', end: '17:00' },
        friday: { active: true, start: '09:00', end: '16:00' },
        saturday: { active: false, start: '10:00', end: '14:00' },
        sunday: { active: false, start: '10:00', end: '14:00' },
      },
    },
    notificationsEmail: true,
    notificationsPush: true,
    autoArchiveAfterDays: null,
    autoResponderEnabled: false,
    autoResponderMessage: null,
    escalationKeywords: [],
    defaultSavedReplyId: null,
    createdAt: null,
    updatedAt: null,
  },
  savedReplies: [],
  routingRules: [],
  activeThreads: [],
  supportCases: [],
  participantDirectory: [],
  lastSyncedAt: null,
});

function buildCacheKey(userId) {
  return `freelancer:inbox-workspace:${userId ?? 'guest'}`;
}

export default function useFreelancerInboxWorkspace({ userId, enabled = true } = {}) {
  const safeId = userId ?? 'guest';
  const cacheKey = buildCacheKey(safeId);
  const fetcher = useCallback(
    async ({ signal } = {}) => {
      if (!userId || !enabled) {
        return FALLBACK_WORKSPACE;
      }
      try {
        const response = await fetchInboxWorkspace({ userId, signal });
        if (response && typeof response === 'object') {
          return response;
        }
      } catch (error) {
        if (signal?.aborted) {
          throw error;
        }
        console.warn('Failed to load inbox workspace', error);
      }
      return { ...FALLBACK_WORKSPACE, userId };
    },
    [userId, enabled],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled: Boolean(enabled && userId),
    dependencies: [safeId],
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
      if (!userId) {
        return FALLBACK_WORKSPACE.preferences;
      }
      const preferences = await saveInboxPreferences({ userId, ...payload });
      await refresh({ force: true });
      return preferences;
    },
    [refresh, userId],
  );

  const addSavedReply = useCallback(
    async (payload) => {
      if (!userId) return null;
      const reply = await createInboxSavedReply({ userId, ...payload });
      await refresh({ force: true });
      return reply;
    },
    [refresh, userId],
  );

  const editSavedReply = useCallback(
    async (replyId, payload) => {
      if (!userId) return null;
      const reply = await updateInboxSavedReply(replyId, { userId, ...payload });
      await refresh({ force: true });
      return reply;
    },
    [refresh, userId],
  );

  const removeSavedReply = useCallback(
    async (replyId) => {
      if (!userId) return false;
      await deleteInboxSavedReply(replyId, { userId });
      await refresh({ force: true });
      return true;
    },
    [refresh, userId],
  );

  const addRoutingRule = useCallback(
    async (payload) => {
      if (!userId) return null;
      const rule = await createInboxRoutingRule({ userId, ...payload });
      await refresh({ force: true });
      return rule;
    },
    [refresh, userId],
  );

  const editRoutingRule = useCallback(
    async (ruleId, payload) => {
      if (!userId) return null;
      const rule = await updateInboxRoutingRule(ruleId, { userId, ...payload });
      await refresh({ force: true });
      return rule;
    },
    [refresh, userId],
  );

  const removeRoutingRule = useCallback(
    async (ruleId) => {
      if (!userId) return false;
      await deleteInboxRoutingRule(ruleId, { userId });
      await refresh({ force: true });
      return true;
    },
    [refresh, userId],
  );

  const pinThread = useCallback(
    async (threadId) => {
      if (!userId || !threadId) {
        return workspace.preferences.pinnedThreadIds ?? [];
      }
      const response = await pinInboxThread({ userId, threadId });
      await refresh({ force: true });
      return Array.isArray(response?.pinnedThreadIds) ? response.pinnedThreadIds : [];
    },
    [refresh, userId, workspace.preferences.pinnedThreadIds],
  );

  const unpinThread = useCallback(
    async (threadId) => {
      if (!userId || !threadId) {
        return workspace.preferences.pinnedThreadIds ?? [];
      }
      const response = await unpinInboxThread({ userId, threadId });
      await refresh({ force: true });
      return Array.isArray(response?.pinnedThreadIds) ? response.pinnedThreadIds : [];
    },
    [refresh, userId, workspace.preferences.pinnedThreadIds],
  );

  const reorderPinnedThreads = useCallback(
    async (threadIds) => {
      if (!userId) {
        return workspace.preferences.pinnedThreadIds ?? [];
      }
      const response = await reorderInboxPinnedThreads({ userId, threadIds });
      await refresh({ force: true });
      return Array.isArray(response?.pinnedThreadIds) ? response.pinnedThreadIds : [];
    },
    [refresh, userId, workspace.preferences.pinnedThreadIds],
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
    pinThread,
    unpinThread,
    reorderPinnedThreads,
  };
}
