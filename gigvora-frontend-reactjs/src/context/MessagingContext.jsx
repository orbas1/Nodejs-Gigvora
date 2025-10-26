import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { io } from 'socket.io-client';
import useSession from '../hooks/useSession.js';
import apiClient from '../services/apiClient.js';
import {
  fetchInbox,
  fetchThreadMessages,
  sendMessage as sendMessageRequest,
  createCallSession,
  markThreadRead,
  updateTypingState,
} from '../services/messaging.js';
import { resolveActorId, sortMessages, sortThreads } from '../utils/messaging.js';
import { canAccessMessaging } from '../constants/access.js';

const CACHE_TTL = 1000 * 60 * 15;
const CACHE_KEY_PREFIX = 'messaging:state:';
const DEFAULT_VISIBLE_COUNT = 30;
const HISTORY_INCREMENT = 20;
export const INBOX_REFRESH_INTERVAL = 60_000;

const defaultValue = {
  hasMessagingAccess: false,
  threads: [],
  loadingThreads: false,
  threadsError: null,
  refreshInbox: async () => {},
  selectedThreadId: null,
  selectedThread: null,
  selectThread: () => {},
  messages: [],
  allMessages: [],
  messagesLoading: false,
  messagesError: null,
  hasMoreHistory: false,
  loadOlderMessages: async () => {},
  composer: '',
  updateComposer: () => {},
  sendMessage: async () => {},
  sending: false,
  typingParticipants: [],
  callSession: null,
  callLoading: false,
  callError: null,
  startCall: async () => {},
  joinCall: () => {},
  closeCall: () => {},
  lastSyncedAt: null,
};

const initialState = {
  threads: [],
  selectedThreadId: null,
  messagesByThread: {},
  composerByThread: {},
  typingByThread: {},
  loadingThreads: false,
  loadingMessages: false,
  sending: false,
  errors: { threads: null, messages: null, call: null },
  callSession: null,
  callLoading: false,
  lastSyncedAt: null,
  offlineHydrated: false,
  viewLimitByThread: {},
};

function determineViewLimit(messageCount, previousLimit) {
  if (!Number.isFinite(messageCount) || messageCount <= 0) {
    return Math.min(DEFAULT_VISIBLE_COUNT, Math.max(messageCount, 0));
  }
  if (Number.isFinite(previousLimit) && previousLimit > 0) {
    return Math.min(messageCount, Math.max(previousLimit, Math.min(DEFAULT_VISIBLE_COUNT, messageCount)));
  }
  return Math.min(messageCount, DEFAULT_VISIBLE_COUNT);
}

function messagingReducer(state, action) {
  switch (action.type) {
    case 'resetState':
      return { ...initialState };
    case 'hydrate': {
      const threads = sortThreads(action.payload?.threads ?? []);
      const selectedThreadId = action.payload?.selectedThreadId ?? threads[0]?.id ?? null;
      return {
        ...state,
        threads,
        selectedThreadId,
        messagesByThread: action.payload?.messagesByThread ?? {},
        composerByThread: action.payload?.composerByThread ?? {},
        viewLimitByThread: action.payload?.viewLimitByThread ?? {},
        offlineHydrated: true,
      };
    }
    case 'setThreadsLoading':
      return {
        ...state,
        loadingThreads: action.loading,
        errors: { ...state.errors, threads: action.loading ? null : state.errors.threads },
      };
    case 'setThreads': {
      const threads = sortThreads(action.threads ?? []);
      const preferred = action.preferredThreadId ?? state.selectedThreadId;
      const selectedThreadId = preferred && threads.some((thread) => thread.id === preferred)
        ? preferred
        : threads[0]?.id ?? null;
      return {
        ...state,
        threads,
        loadingThreads: false,
        errors: { ...state.errors, threads: null },
        selectedThreadId,
        lastSyncedAt: action.syncedAt ?? new Date().toISOString(),
      };
    }
    case 'setThreadsError':
      return {
        ...state,
        loadingThreads: false,
        errors: { ...state.errors, threads: action.error ?? 'Unable to load inbox threads.' },
      };
    case 'selectThread':
      return {
        ...state,
        selectedThreadId: action.threadId ?? null,
        errors: { ...state.errors, messages: null },
      };
    case 'setMessagesLoading':
      return {
        ...state,
        loadingMessages: action.loading,
        errors: { ...state.errors, messages: action.loading ? null : state.errors.messages },
      };
    case 'setMessages': {
      const sortedMessages = sortMessages(action.messages ?? []);
      const currentLimit = state.viewLimitByThread[action.threadId];
      const limit = determineViewLimit(sortedMessages.length, currentLimit);
      return {
        ...state,
        messagesByThread: { ...state.messagesByThread, [action.threadId]: sortedMessages },
        viewLimitByThread: { ...state.viewLimitByThread, [action.threadId]: limit },
        loadingMessages: false,
        errors: { ...state.errors, messages: null },
      };
    }
    case 'setMessagesError':
      return {
        ...state,
        loadingMessages: false,
        errors: { ...state.errors, messages: action.error ?? 'Unable to load conversation.' },
      };
    case 'appendMessage': {
      const existing = state.messagesByThread[action.threadId] ?? [];
      const updated = sortMessages([
        ...existing.filter((message) => message.id !== action.message.id),
        action.message,
      ]);
      const currentLimit = state.viewLimitByThread[action.threadId];
      const limit = determineViewLimit(updated.length, currentLimit);
      return {
        ...state,
        messagesByThread: { ...state.messagesByThread, [action.threadId]: updated },
        viewLimitByThread: { ...state.viewLimitByThread, [action.threadId]: limit },
      };
    }
    case 'setComposer':
      return {
        ...state,
        composerByThread: { ...state.composerByThread, [action.threadId]: action.value },
      };
    case 'clearComposer': {
      if (!(action.threadId in state.composerByThread)) {
        return state;
      }
      return {
        ...state,
        composerByThread: { ...state.composerByThread, [action.threadId]: '' },
      };
    }
    case 'setSending':
      return { ...state, sending: action.sending };
    case 'acknowledgeThread':
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === action.threadId
            ? {
                ...thread,
                unreadCount: 0,
                unread: false,
                viewerState: { ...(thread.viewerState ?? {}), lastReadAt: action.timestamp },
              }
            : thread,
        ),
      };
    case 'setTypingParticipants':
      return {
        ...state,
        typingByThread: { ...state.typingByThread, [action.threadId]: action.participants ?? [] },
      };
    case 'setCallState':
      return {
        ...state,
        callSession: action.session ?? null,
        callLoading: false,
        errors: { ...state.errors, call: null },
      };
    case 'setCallLoading':
      return { ...state, callLoading: action.loading };
    case 'setCallError':
      return {
        ...state,
        callLoading: false,
        errors: { ...state.errors, call: action.error ?? null },
      };
    case 'extendViewLimit': {
      const current = state.viewLimitByThread[action.threadId] ?? DEFAULT_VISIBLE_COUNT;
      const messages = state.messagesByThread[action.threadId] ?? [];
      const increment = action.increment ?? HISTORY_INCREMENT;
      const limit = Math.min(messages.length, current + increment);
      return {
        ...state,
        viewLimitByThread: { ...state.viewLimitByThread, [action.threadId]: limit },
      };
    }
    case 'setOfflineHydrated':
      return { ...state, offlineHydrated: action.value };
    default:
      return state;
  }
}

function buildCacheKey(actorId) {
  return `${CACHE_KEY_PREFIX}${actorId}`;
}

function readCachedState(actorId) {
  const cached = apiClient.readCache(buildCacheKey(actorId));
  return cached?.data ?? null;
}

function persistState(actorId, payload) {
  if (!actorId) {
    return;
  }
  apiClient.writeCache(buildCacheKey(actorId), payload, CACHE_TTL);
}

export const MessagingContext = createContext(defaultValue);

export function MessagingProvider({ children }) {
  const { session, isAuthenticated } = useSession();
  const actorId = useMemo(() => resolveActorId(session), [session]);
  const hasMessagingAccess = useMemo(() => canAccessMessaging(session), [session]);
  const [state, dispatch] = useReducer(messagingReducer, initialState);

  const threadsRequestRef = useRef(0);
  const messageRequestRef = useRef(new Map());
  const typingTimersRef = useRef(new Map());
  const socketRef = useRef(null);
  const actorTrackerRef = useRef(null);
  const previousThreadIdRef = useRef(null);
  const selectedThreadIdRef = useRef(null);
  previousThreadIdRef.current = state.selectedThreadId;
  selectedThreadIdRef.current = state.selectedThreadId;

  const realtimeBaseUrl = useMemo(() => {
    const base = apiClient.API_BASE_URL || '';
    try {
      const url = new URL(base);
      url.pathname = '/';
      return url.toString().replace(/\/$/, '');
    } catch (error) {
      return base.replace(/\/api\/?$/, '');
    }
  }, []);

  const emitTypingUpdate = useCallback(
    async (threadId, typing) => {
      if (!threadId || !actorId || !hasMessagingAccess) {
        return;
      }
      try {
        await updateTypingState(threadId, {
          userId: actorId,
          typing,
          displayName: session?.name ?? undefined,
        });
      } catch (error) {
        // Swallow typing errors to avoid interrupting the composer experience.
      }
    },
    [actorId, hasMessagingAccess, session?.name],
  );

  const stopTyping = useCallback(
    (threadId, immediate = false) => {
      if (!threadId) {
        return;
      }
      const timers = typingTimersRef.current;
      const entry = timers.get(threadId);
      if (entry?.timeoutId) {
        window.clearTimeout(entry.timeoutId);
      }
      if (entry?.active || immediate) {
        emitTypingUpdate(threadId, false);
      }
      timers.set(threadId, { active: false, timeoutId: null });
    },
    [emitTypingUpdate],
  );

  const scheduleTypingTimeout = useCallback(
    (threadId) => {
      const timers = typingTimersRef.current;
      const entry = timers.get(threadId) ?? { active: false, timeoutId: null };
      if (entry.timeoutId) {
        window.clearTimeout(entry.timeoutId);
      }
      const timeoutId = window.setTimeout(() => {
        emitTypingUpdate(threadId, false);
        timers.set(threadId, { active: false, timeoutId: null });
      }, 3000);
      timers.set(threadId, { ...entry, timeoutId, active: true });
    },
    [emitTypingUpdate],
  );

  const startTyping = useCallback(
    (threadId) => {
      if (!threadId || !actorId || !hasMessagingAccess) {
        return;
      }
      const timers = typingTimersRef.current;
      const entry = timers.get(threadId) ?? { active: false, timeoutId: null };
      if (!entry.active) {
        emitTypingUpdate(threadId, true);
      }
      scheduleTypingTimeout(threadId);
    },
    [actorId, hasMessagingAccess, emitTypingUpdate, scheduleTypingTimeout],
  );

  const refreshInbox = useCallback(
    async ({ silent = false } = {}) => {
      if (!isAuthenticated || !actorId || !hasMessagingAccess) {
        return;
      }
      const requestId = threadsRequestRef.current + 1;
      threadsRequestRef.current = requestId;
      if (!silent) {
        dispatch({ type: 'setThreadsLoading', loading: true });
      }
      try {
        const response = await fetchInbox({
          userId: actorId,
          includeParticipants: true,
          pageSize: 40,
        });
        const data = Array.isArray(response?.data) ? response.data : [];
        if (threadsRequestRef.current !== requestId) {
          return;
        }
        dispatch({ type: 'setThreads', threads: data });
      } catch (error) {
        if (threadsRequestRef.current !== requestId) {
          return;
        }
        const message = error?.body?.message ?? error?.message ?? 'Unable to load inbox threads.';
        dispatch({ type: 'setThreadsError', error: message });
      } finally {
        if (!silent && threadsRequestRef.current === requestId) {
          dispatch({ type: 'setThreadsLoading', loading: false });
        }
      }
    },
    [actorId, hasMessagingAccess, isAuthenticated],
  );

  const loadMessages = useCallback(
    async (threadId, { silent = false } = {}) => {
      if (!isAuthenticated || !actorId || !hasMessagingAccess || !threadId) {
        return;
      }
      const requestMap = messageRequestRef.current;
      const previous = requestMap.get(threadId) ?? 0;
      const requestId = previous + 1;
      requestMap.set(threadId, requestId);
      if (!silent) {
        dispatch({ type: 'setMessagesLoading', loading: true });
      }
      try {
        const response = await fetchThreadMessages(threadId, { pageSize: 100 });
        const data = Array.isArray(response?.data) ? response.data : [];
        if (messageRequestRef.current.get(threadId) !== requestId) {
          return;
        }
        dispatch({ type: 'setMessages', threadId, messages: data });
        const timestamp = new Date().toISOString();
        dispatch({ type: 'acknowledgeThread', threadId, timestamp });
        try {
          await markThreadRead(threadId, { userId: actorId });
        } catch (error) {
          // Ignore read receipt persistence errors to keep UI responsive.
        }
      } catch (error) {
        if (messageRequestRef.current.get(threadId) !== requestId) {
          return;
        }
        const message = error?.body?.message ?? error?.message ?? 'Unable to load conversation.';
        dispatch({ type: 'setMessagesError', error: message });
      } finally {
        if (!silent && messageRequestRef.current.get(threadId) === requestId) {
          dispatch({ type: 'setMessagesLoading', loading: false });
        }
      }
    },
    [actorId, hasMessagingAccess, isAuthenticated],
  );

  const sendMessage = useCallback(
    async (threadId, payload) => {
      if (!threadId || !actorId || !hasMessagingAccess || !isAuthenticated) {
        return null;
      }
      const composerPayload =
        typeof payload === 'string'
          ? { body: payload }
          : payload && typeof payload === 'object'
            ? payload
            : {};
      const text = typeof composerPayload.body === 'string' ? composerPayload.body.trim() : '';
      const attachments = Array.isArray(composerPayload.attachments) ? composerPayload.attachments : [];
      if (!text && attachments.length === 0) {
        return null;
      }
      const messageType = composerPayload.messageType ?? 'text';
      const metadata = composerPayload.metadata ?? {};
      dispatch({ type: 'setSending', sending: true });
      dispatch({ type: 'setMessagesError', error: null });
      try {
        const message = await sendMessageRequest(threadId, {
          userId: actorId,
          messageType,
          body: text,
          attachments,
          metadata,
        });
        dispatch({ type: 'appendMessage', threadId, message });
        dispatch({ type: 'clearComposer', threadId });
        stopTyping(threadId, true);
        await refreshInbox({ silent: true });
        try {
          await markThreadRead(threadId, { userId: actorId });
        } catch (error) {
          // Ignore read persistence failures.
        }
        return message;
      } catch (error) {
        const message = error?.body?.message ?? error?.message ?? 'Unable to send message.';
        dispatch({ type: 'setMessagesError', error: message });
        throw error;
      } finally {
        dispatch({ type: 'setSending', sending: false });
      }
    },
    [actorId, hasMessagingAccess, isAuthenticated, refreshInbox, stopTyping],
  );

  const startCall = useCallback(
    async (threadId, callType = 'video', callId) => {
      if (!threadId || !actorId || !hasMessagingAccess || !isAuthenticated) {
        return null;
      }
      dispatch({ type: 'setCallLoading', loading: true });
      dispatch({ type: 'setCallError', error: null });
      try {
        const response = await createCallSession(threadId, {
          userId: actorId,
          callType,
          callId,
        });
        dispatch({ type: 'setCallState', session: response });
        if (response?.message) {
          dispatch({ type: 'appendMessage', threadId, message: response.message });
        }
        await refreshInbox({ silent: true });
        return response;
      } catch (error) {
        const message = error?.body?.message ?? error?.message ?? 'Unable to start call.';
        dispatch({ type: 'setCallError', error: message });
        throw error;
      }
    },
    [actorId, hasMessagingAccess, isAuthenticated, refreshInbox],
  );

  const selectThread = useCallback(
    (threadId) => {
      const previous = previousThreadIdRef.current;
      if (previous && previous !== threadId) {
        stopTyping(previous, true);
      }
      dispatch({ type: 'selectThread', threadId });
    },
    [stopTyping],
  );

  const updateComposer = useCallback(
    (threadId, value) => {
      dispatch({ type: 'setComposer', threadId, value });
      if (!threadId) {
        return;
      }
      if (value && value.trim()) {
        startTyping(threadId);
      } else {
        stopTyping(threadId);
      }
    },
    [startTyping, stopTyping],
  );

  const loadOlderMessages = useCallback(
    async (threadId) => {
      if (!threadId) {
        return;
      }
      dispatch({ type: 'extendViewLimit', threadId, increment: HISTORY_INCREMENT });
    },
    [],
  );

  const closeCall = useCallback(
    (threadId) => {
      dispatch({ type: 'setCallState', session: null });
      if (threadId) {
        loadMessages(threadId, { silent: true });
      }
    },
    [loadMessages],
  );

  useEffect(() => {
    if (!actorId || !hasMessagingAccess || !isAuthenticated) {
      if (actorTrackerRef.current !== null) {
        actorTrackerRef.current = null;
        dispatch({ type: 'resetState' });
      }
      return;
    }
    if (actorTrackerRef.current === actorId) {
      return;
    }
    actorTrackerRef.current = actorId;
    dispatch({ type: 'resetState' });
    const cached = readCachedState(actorId);
    if (cached) {
      dispatch({ type: 'hydrate', payload: cached });
    } else {
      dispatch({ type: 'setOfflineHydrated', value: true });
    }
    refreshInbox();
  }, [actorId, hasMessagingAccess, isAuthenticated, refreshInbox]);

  const selectedThreadId = state.selectedThreadId;
  const selectedThread = useMemo(
    () => state.threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [state.threads, selectedThreadId],
  );
  const allMessages = state.messagesByThread[selectedThreadId] ?? [];
  const viewLimit = state.viewLimitByThread[selectedThreadId] ?? determineViewLimit(allMessages.length, null);
  const visibleMessages = useMemo(() => {
    const start = Math.max(0, allMessages.length - viewLimit);
    return allMessages.slice(start);
  }, [allMessages, viewLimit]);
  const hasMoreHistory = allMessages.length > viewLimit;
  const composer = state.composerByThread[selectedThreadId] ?? '';
  const typingParticipants = state.typingByThread[selectedThreadId] ?? [];

  useEffect(() => {
    if (!selectedThreadId || !hasMessagingAccess || !isAuthenticated) {
      return;
    }
    const hasCached = allMessages.length > 0;
    loadMessages(selectedThreadId, { silent: hasCached });
  }, [selectedThreadId, hasMessagingAccess, isAuthenticated, loadMessages, allMessages.length]);

  useEffect(() => {
    if (!isAuthenticated || !actorId || !hasMessagingAccess) {
      return () => {};
    }
    const interval = window.setInterval(() => {
      refreshInbox({ silent: true });
      if (selectedThreadId) {
        loadMessages(selectedThreadId, { silent: true });
      }
    }, INBOX_REFRESH_INTERVAL);
    return () => window.clearInterval(interval);
  }, [actorId, hasMessagingAccess, isAuthenticated, refreshInbox, loadMessages, selectedThreadId]);

  useEffect(() => {
    if (!realtimeBaseUrl || !actorId || !hasMessagingAccess || !isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return () => {};
    }
    const authPayload = {
      token: apiClient.getAccessToken?.() ?? undefined,
      'x-user-id': actorId,
    };
    if (Array.isArray(session?.memberships) && session.memberships.length) {
      authPayload['x-roles'] = session.memberships.join(',');
    }
    const socket = io(realtimeBaseUrl, {
      transports: ['websocket'],
      auth: authPayload,
      withCredentials: true,
    });
    socketRef.current = socket;
    const handleTypingEvent = (event) => {
      const threadId = event?.payload?.threadId ?? event?.threadId;
      if (!threadId) {
        return;
      }
      const participants = event?.payload?.participants ?? [];
      dispatch({ type: 'setTypingParticipants', threadId, participants });
    };
    const handleDisconnect = () => {
      const currentThreadId = selectedThreadIdRef.current;
      if (currentThreadId) {
        dispatch({ type: 'setTypingParticipants', threadId: currentThreadId, participants: [] });
      }
    };
    socket.on('messaging:thread:typing', handleTypingEvent);
    socket.on('disconnect', handleDisconnect);
    return () => {
      socket.off('messaging:thread:typing', handleTypingEvent);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [actorId, hasMessagingAccess, isAuthenticated, realtimeBaseUrl, session?.memberships]);

  useEffect(() => {
    if (!actorId || !hasMessagingAccess || !state.offlineHydrated) {
      return;
    }
    persistState(actorId, {
      version: 1,
      threads: state.threads,
      messagesByThread: state.messagesByThread,
      selectedThreadId: state.selectedThreadId,
      composerByThread: state.composerByThread,
      viewLimitByThread: state.viewLimitByThread,
    });
  }, [actorId, hasMessagingAccess, state.offlineHydrated, state.threads, state.messagesByThread, state.selectedThreadId, state.composerByThread, state.viewLimitByThread]);

  useEffect(() => () => {
    typingTimersRef.current.forEach((entry) => {
      if (entry?.timeoutId) {
        window.clearTimeout(entry.timeoutId);
      }
    });
    typingTimersRef.current.clear();
  }, []);

  const sendMessageForSelectedThread = useCallback(
    async (body) => {
      if (!selectedThreadId) {
        return null;
      }
      return sendMessage(selectedThreadId, body);
    },
    [selectedThreadId, sendMessage],
  );

  const updateComposerForSelectedThread = useCallback(
    (value) => {
      if (!selectedThreadId) {
        return;
      }
      updateComposer(selectedThreadId, value);
    },
    [selectedThreadId, updateComposer],
  );

  const loadOlderMessagesForSelectedThread = useCallback(async () => {
    if (!selectedThreadId) {
      return;
    }
    await loadOlderMessages(selectedThreadId);
  }, [selectedThreadId, loadOlderMessages]);

  const startCallForSelectedThread = useCallback(
    (callType, callId) => {
      if (!selectedThreadId) {
        return null;
      }
      return startCall(selectedThreadId, callType, callId);
    },
    [selectedThreadId, startCall],
  );

  const joinCall = useCallback(
    (callMetadata) => {
      if (!callMetadata?.id || !selectedThreadId) {
        return null;
      }
      return startCall(selectedThreadId, callMetadata?.type ?? 'video', callMetadata.id);
    },
    [selectedThreadId, startCall],
  );

  const closeCallForSelectedThread = useCallback(() => {
    if (!selectedThreadId) {
      dispatch({ type: 'setCallState', session: null });
      return;
    }
    closeCall(selectedThreadId);
  }, [selectedThreadId, closeCall]);

  const contextValue = useMemo(
    () => ({
      hasMessagingAccess: Boolean(hasMessagingAccess && isAuthenticated),
      threads: state.threads,
      loadingThreads: state.loadingThreads,
      threadsError: state.errors.threads,
      refreshInbox,
      selectedThreadId,
      selectedThread,
      selectThread,
      messages: visibleMessages,
      allMessages,
      messagesLoading: state.loadingMessages,
      messagesError: state.errors.messages,
      hasMoreHistory,
      loadOlderMessages: loadOlderMessagesForSelectedThread,
      composer,
      updateComposer: updateComposerForSelectedThread,
      sendMessage: sendMessageForSelectedThread,
      sending: state.sending,
      typingParticipants,
      callSession: state.callSession,
      callLoading: state.callLoading,
      callError: state.errors.call,
      startCall: startCallForSelectedThread,
      joinCall,
      closeCall: closeCallForSelectedThread,
      lastSyncedAt: state.lastSyncedAt,
    }),
    [
      hasMessagingAccess,
      isAuthenticated,
      state.threads,
      state.loadingThreads,
      state.errors.threads,
      refreshInbox,
      selectedThreadId,
      selectedThread,
      selectThread,
      visibleMessages,
      allMessages,
      state.loadingMessages,
      state.errors.messages,
      hasMoreHistory,
      loadOlderMessagesForSelectedThread,
      composer,
      updateComposerForSelectedThread,
      sendMessageForSelectedThread,
      state.sending,
      typingParticipants,
      state.callSession,
      state.callLoading,
      state.errors.call,
      startCallForSelectedThread,
      joinCall,
      closeCallForSelectedThread,
      state.lastSyncedAt,
    ],
  );

  return <MessagingContext.Provider value={contextValue}>{children}</MessagingContext.Provider>;
}

export function useMessagingContext() {
  return useContext(MessagingContext);
}
