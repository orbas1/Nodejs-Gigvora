import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import PropTypes from 'prop-types';
import useSession from '../hooks/useSession.js';
import { canAccessMessaging } from '../constants/access.js';
import {
  fetchInbox,
  fetchThreadMessages,
  markThreadRead,
  sendMessage as sendMessageRequest,
  createCallSession,
  fetchThreadPresence,
  sendTypingIndicator,
} from '../services/messaging.js';
import { resolveActorId, sortMessages, sortThreadsByActivity } from '../utils/messaging.js';

const MessagingContext = createContext(null);

const CACHE_KEY = 'gigvora.messaging.cache.v1';
const THREAD_PAGE_SIZE = 30;
const MESSAGE_PAGE_SIZE = 100;
const PRESENCE_THROTTLE_MS = 4000;
const TYPING_EMIT_THROTTLE_MS = 2500;
const TYPING_ENTRY_TTL_MS = 6000;

const initialState = {
  threads: [],
  threadsLoading: false,
  threadsAppending: false,
  threadsError: null,
  threadsPage: 1,
  hasMoreThreads: true,
  selectedThreadId: null,
  messagesByThread: {},
  presenceByThread: {},
  composerDrafts: {},
  call: { session: null, loading: false, error: null },
  lastThreadsSyncAt: null,
  offlineHydrated: false,
};

function mergeThreadLists(current, incoming, append) {
  if (!append) {
    return sortThreadsByActivity(incoming);
  }
  const map = new Map();
  current.forEach((thread) => {
    if (thread?.id) {
      map.set(thread.id, thread);
    }
  });
  incoming.forEach((thread) => {
    if (thread?.id) {
      map.set(thread.id, { ...map.get(thread.id), ...thread });
    }
  });
  return sortThreadsByActivity(Array.from(map.values()));
}

function ensureSelectedThreadId(state, threads, preserveSelection) {
  if (!threads.length) {
    return null;
  }
  if (!preserveSelection || !state.selectedThreadId) {
    return threads[0].id ?? null;
  }
  const exists = threads.some((thread) => thread.id === state.selectedThreadId);
  return exists ? state.selectedThreadId : threads[0].id ?? null;
}

function normaliseTypingEntries(entries = []) {
  const now = Date.now();
  const byUser = new Map();
  entries
    .filter(Boolean)
    .forEach((entry) => {
      if (!entry || !entry.userId) {
        return;
      }
      const expiresAt = entry.expiresAt ? new Date(entry.expiresAt).getTime() : now + TYPING_ENTRY_TTL_MS;
      byUser.set(entry.userId, {
        userId: entry.userId,
        name: entry.name ?? entry.displayName ?? entry.email ?? `User ${entry.userId}`,
        expiresAt,
      });
    });
  return Array.from(byUser.values());
}

function normaliseReceipts(entries = []) {
  return entries
    .filter(Boolean)
    .map((entry) => ({
      userId: entry.userId,
      lastReadAt: entry.lastReadAt ?? entry.seenAt ?? null,
      lastReadMessageId: entry.lastReadMessageId ?? entry.messageId ?? null,
      name: entry.name ?? entry.displayName ?? entry.email ?? (entry.userId ? `User ${entry.userId}` : 'Unknown'),
    }));
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return { ...initialState, offlineHydrated: true };
    case 'HYDRATE_CACHE': {
      const {
        threads = [],
        messagesByThread = {},
        selectedThreadId = null,
        composerDrafts = {},
        hasMoreThreads = true,
        threadsPage = 1,
        lastThreadsSyncAt = null,
      } = action.payload ?? {};
      const hydratedThreads = sortThreadsByActivity(threads);
      const hydratedMessages = Object.fromEntries(
        Object.entries(messagesByThread).map(([threadId, entry]) => [
          threadId,
          {
            items: sortMessages(entry?.items ?? []),
            loading: false,
            error: null,
            page: entry?.page ?? 1,
            hasMore: entry?.hasMore ?? true,
            lastLoadedAt: entry?.lastLoadedAt ?? null,
          },
        ]),
      );
      const nextSelected = hydratedThreads.some((thread) => thread.id === selectedThreadId)
        ? selectedThreadId
        : hydratedThreads[0]?.id ?? null;
      return {
        ...state,
        threads: hydratedThreads,
        hasMoreThreads,
        threadsPage,
        selectedThreadId: nextSelected,
        messagesByThread: { ...state.messagesByThread, ...hydratedMessages },
        composerDrafts: composerDrafts ?? {},
        lastThreadsSyncAt,
        offlineHydrated: true,
      };
    }
    case 'THREADS_LOADING':
      return {
        ...state,
        threadsLoading: !action.payload.append,
        threadsAppending: Boolean(action.payload.append),
        threadsError: null,
      };
    case 'THREADS_SUCCESS': {
      const { threads, append, page, hasMore, preserveSelection } = action.payload;
      const merged = mergeThreadLists(state.threads, threads, append);
      const selectedThreadId = ensureSelectedThreadId(state, merged, preserveSelection);
      return {
        ...state,
        threads: merged,
        threadsLoading: false,
        threadsAppending: false,
        threadsError: null,
        threadsPage: page,
        hasMoreThreads: hasMore,
        selectedThreadId,
        lastThreadsSyncAt: Date.now(),
      };
    }
    case 'THREADS_FAILURE':
      return {
        ...state,
        threadsLoading: false,
        threadsAppending: false,
        threadsError: action.payload,
      };
    case 'SELECT_THREAD':
      return {
        ...state,
        selectedThreadId: action.payload ?? null,
      };
    case 'MESSAGES_LOADING': {
      const { threadId } = action.payload;
      const previous = state.messagesByThread[threadId] ?? {};
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: {
            ...previous,
            loading: true,
            error: null,
          },
        },
      };
    }
    case 'MESSAGES_SUCCESS': {
      const { threadId, messages, page, hasMore } = action.payload;
      const previous = state.messagesByThread[threadId] ?? {};
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: {
            ...previous,
            items: sortMessages(messages),
            loading: false,
            error: null,
            page,
            hasMore,
            lastLoadedAt: Date.now(),
          },
        },
      };
    }
    case 'MESSAGES_FAILURE': {
      const { threadId, error } = action.payload;
      const previous = state.messagesByThread[threadId] ?? {};
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: {
            ...previous,
            loading: false,
            error,
          },
        },
      };
    }
    case 'UPSERT_MESSAGE': {
      const { threadId, message } = action.payload;
      const threadMessages = state.messagesByThread[threadId]?.items ?? [];
      const existingIndex = threadMessages.findIndex((item) => item.id === message.id);
      const nextMessages = existingIndex === -1
        ? [...threadMessages, message]
        : threadMessages.map((item, index) => (index === existingIndex ? { ...item, ...message } : item));
      const updatedThreads = state.threads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              lastMessageAt: message.createdAt ?? thread.lastMessageAt,
              lastMessagePreview: message.body ?? thread.lastMessagePreview,
              unreadCount: 0,
              viewerState: {
                ...(thread.viewerState ?? {}),
                lastReadAt: new Date().toISOString(),
              },
            }
          : thread,
      );
      return {
        ...state,
        threads: sortThreadsByActivity(updatedThreads),
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: {
            ...(state.messagesByThread[threadId] ?? {}),
            items: sortMessages(nextMessages),
            error: null,
          },
        },
      };
    }
    case 'THREAD_MARK_READ': {
      const { threadId, timestamp } = action.payload;
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                unreadCount: 0,
                viewerState: { ...(thread.viewerState ?? {}), lastReadAt: timestamp },
              }
            : thread,
        ),
      };
    }
    case 'SET_TYPING': {
      const { threadId, typing } = action.payload;
      const existing = state.presenceByThread[threadId] ?? {};
      return {
        ...state,
        presenceByThread: {
          ...state.presenceByThread,
          [threadId]: {
            ...existing,
            typing: normaliseTypingEntries(typing),
          },
        },
      };
    }
    case 'SET_RECEIPTS': {
      const { threadId, receipts } = action.payload;
      const existing = state.presenceByThread[threadId] ?? {};
      return {
        ...state,
        presenceByThread: {
          ...state.presenceByThread,
          [threadId]: {
            ...existing,
            receipts: normaliseReceipts(receipts),
          },
        },
      };
    }
    case 'PRUNE_TYPING': {
      const { now } = action.payload;
      const nextPresence = { ...state.presenceByThread };
      Object.entries(nextPresence).forEach(([threadId, entry]) => {
        if (!entry?.typing?.length) {
          return;
        }
        const filtered = entry.typing.filter((item) => item.expiresAt > now);
        nextPresence[threadId] = { ...entry, typing: filtered };
      });
      return {
        ...state,
        presenceByThread: nextPresence,
      };
    }
    case 'SET_COMPOSER_DRAFT': {
      const { threadId, value } = action.payload;
      if (!threadId) {
        return state;
      }
      return {
        ...state,
        composerDrafts: {
          ...state.composerDrafts,
          [threadId]: value,
        },
      };
    }
    case 'CLEAR_COMPOSER_DRAFT': {
      const { threadId } = action.payload;
      if (!threadId) {
        return state;
      }
      const nextDrafts = { ...state.composerDrafts };
      delete nextDrafts[threadId];
      return {
        ...state,
        composerDrafts: nextDrafts,
      };
    }
    case 'CALL_START':
      return {
        ...state,
        call: { session: null, loading: true, error: null },
      };
    case 'CALL_SUCCESS':
      return {
        ...state,
        call: { session: action.payload ?? null, loading: false, error: null },
      };
    case 'CALL_FAILURE':
      return {
        ...state,
        call: { session: null, loading: false, error: action.payload ?? 'Unable to start call.' },
      };
    case 'CALL_CLEAR':
      return {
        ...state,
        call: { session: null, loading: false, error: null },
      };
    default:
      return state;
  }
}

function persistCache(state) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const cache = {
      threads: state.threads.slice(0, 40),
      selectedThreadId: state.selectedThreadId,
      hasMoreThreads: state.hasMoreThreads,
      threadsPage: state.threadsPage,
      composerDrafts: state.composerDrafts,
      lastThreadsSyncAt: state.lastThreadsSyncAt,
      messagesByThread: Object.fromEntries(
        Object.entries(state.messagesByThread).map(([threadId, entry]) => [
          threadId,
          {
            items: (entry?.items ?? []).slice(-80),
            page: entry?.page ?? 1,
            hasMore: entry?.hasMore ?? true,
            lastLoadedAt: entry?.lastLoadedAt ?? null,
          },
        ]),
      ),
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to persist messaging cache', error);
  }
}

export function MessagingProvider({ children }) {
  const { session, isAuthenticated } = useSession();
  const actorId = resolveActorId(session);
  const canUseMessaging = Boolean(isAuthenticated && actorId && canAccessMessaging(session));
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  const initialisedRef = useRef(false);
  const presenceFetchRef = useRef(new Map());
  const typingEmitRef = useRef(new Map());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const refreshPresence = useCallback(
    async (threadId, { force = false } = {}) => {
      if (!canUseMessaging || !threadId) {
        return;
      }
      const now = Date.now();
      const lastFetched = presenceFetchRef.current.get(threadId) ?? 0;
      if (!force && now - lastFetched < PRESENCE_THROTTLE_MS) {
        return;
      }
      presenceFetchRef.current.set(threadId, now);
      try {
        const response = await fetchThreadPresence(threadId);
        const typing = Array.isArray(response?.typing) ? response.typing : [];
        const receipts = Array.isArray(response?.receipts) ? response.receipts : [];
        dispatch({ type: 'SET_TYPING', payload: { threadId, typing } });
        dispatch({ type: 'SET_RECEIPTS', payload: { threadId, receipts } });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Unable to refresh messaging presence', error);
      }
    },
    [canUseMessaging],
  );

  const loadThreads = useCallback(
    async ({ append = false, page, preserveSelection = true, silent = false } = {}) => {
      if (!canUseMessaging) {
        return;
      }
      const currentPage = stateRef.current.threadsPage ?? 1;
      const nextPage = page ?? (append ? currentPage + 1 : 1);
      if (!silent) {
        dispatch({ type: 'THREADS_LOADING', payload: { append } });
      }
      try {
        const response = await fetchInbox({
          userId: actorId,
          includeParticipants: true,
          includeSupport: true,
          page: nextPage,
          pageSize: THREAD_PAGE_SIZE,
        });
        const payload = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.threads)
            ? response.threads
            : [];
        const hasMore = Boolean(response?.meta?.hasMore ?? (payload.length === THREAD_PAGE_SIZE));
        dispatch({
          type: 'THREADS_SUCCESS',
          payload: { threads: payload, append, page: nextPage, hasMore, preserveSelection },
        });
      } catch (error) {
        dispatch({
          type: 'THREADS_FAILURE',
          payload: error?.body?.message ?? error?.message ?? 'Unable to load inbox threads.',
        });
      }
    },
    [actorId, canUseMessaging],
  );

  const loadMessages = useCallback(
    async (threadId, { page = 1, includeSystem = false } = {}) => {
      if (!canUseMessaging || !threadId) {
        return;
      }
      dispatch({ type: 'MESSAGES_LOADING', payload: { threadId } });
      try {
        const response = await fetchThreadMessages(threadId, {
          page,
          pageSize: MESSAGE_PAGE_SIZE,
          includeSystem,
        });
        const payload = Array.isArray(response?.data) ? response.data : [];
        dispatch({ type: 'MESSAGES_SUCCESS', payload: { threadId, messages: payload, page, hasMore: false } });
        const timestamp = new Date().toISOString();
        dispatch({ type: 'THREAD_MARK_READ', payload: { threadId, timestamp } });
        await markThreadRead(threadId, { userId: actorId });
        await refreshPresence(threadId, { force: true });
      } catch (error) {
        dispatch({
          type: 'MESSAGES_FAILURE',
          payload: { threadId, error: error?.body?.message ?? error?.message ?? 'Unable to load conversation.' },
        });
      }
    },
    [actorId, canUseMessaging, refreshPresence],
  );

  const sendMessage = useCallback(
    async (threadId, { body, messageType = 'text', attachments, metadata } = {}) => {
      if (!canUseMessaging || !threadId || !body?.trim()) {
        return null;
      }
      const trimmed = body.trim();
      const response = await sendMessageRequest(threadId, {
        userId: actorId,
        body: trimmed,
        messageType,
        attachments,
        metadata,
      });
      dispatch({ type: 'UPSERT_MESSAGE', payload: { threadId, message: response } });
      dispatch({ type: 'CLEAR_COMPOSER_DRAFT', payload: { threadId } });
      await refreshPresence(threadId, { force: true });
      return response;
    },
    [actorId, canUseMessaging, refreshPresence],
  );

  const startCall = useCallback(
    async (threadId, { callType = 'video', callId } = {}) => {
      if (!canUseMessaging || !threadId) {
        return null;
      }
      dispatch({ type: 'CALL_START' });
      try {
        const response = await createCallSession(threadId, {
          userId: actorId,
          callType,
          callId,
        });
        if (response?.message) {
          dispatch({ type: 'UPSERT_MESSAGE', payload: { threadId, message: response.message } });
        }
        dispatch({ type: 'CALL_SUCCESS', payload: response });
        await refreshPresence(threadId, { force: true });
        return response;
      } catch (error) {
        const message = error?.body?.message ?? error?.message ?? 'Unable to start call.';
        dispatch({ type: 'CALL_FAILURE', payload: message });
        return null;
      }
    },
    [actorId, canUseMessaging, refreshPresence],
  );

  const closeCall = useCallback(() => {
    dispatch({ type: 'CALL_CLEAR' });
  }, []);

  const selectThread = useCallback((threadId) => {
    dispatch({ type: 'SELECT_THREAD', payload: threadId });
  }, []);

  const setComposerDraft = useCallback((threadId, value) => {
    dispatch({ type: 'SET_COMPOSER_DRAFT', payload: { threadId, value } });
  }, []);

  const notifyTyping = useCallback(
    async (threadId) => {
      if (!canUseMessaging || !threadId) {
        return;
      }
      const now = Date.now();
      const lastEmit = typingEmitRef.current.get(threadId) ?? 0;
      const existingTyping = stateRef.current.presenceByThread[threadId]?.typing ?? [];
      const selfEntry = { userId: actorId, name: session?.name ?? 'You', expiresAt: now + TYPING_ENTRY_TTL_MS };
      dispatch({ type: 'SET_TYPING', payload: { threadId, typing: [...existingTyping, selfEntry] } });
      if (now - lastEmit < TYPING_EMIT_THROTTLE_MS) {
        return;
      }
      typingEmitRef.current.set(threadId, now);
      try {
        await sendTypingIndicator(threadId, { userId: actorId, expiresIn: TYPING_ENTRY_TTL_MS });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to emit typing indicator', error);
      }
    },
    [actorId, canUseMessaging, session?.name],
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !canUseMessaging || state.offlineHydrated) {
      return;
    }
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) {
        dispatch({ type: 'HYDRATE_CACHE', payload: {} });
        return;
      }
      const parsed = JSON.parse(raw);
      dispatch({ type: 'HYDRATE_CACHE', payload: parsed });
    } catch (error) {
      dispatch({ type: 'HYDRATE_CACHE', payload: {} });
    }
  }, [canUseMessaging, state.offlineHydrated]);

  useEffect(() => {
    if (!canUseMessaging) {
      dispatch({ type: 'RESET' });
      initialisedRef.current = false;
      return;
    }
    if (!initialisedRef.current) {
      initialisedRef.current = true;
      void loadThreads({ append: false, preserveSelection: true, silent: false });
    }
  }, [canUseMessaging, loadThreads]);

  useEffect(() => {
    if (!canUseMessaging || !state.offlineHydrated) {
      return;
    }
    persistCache(state);
  }, [canUseMessaging, state]);

  useEffect(() => {
    if (!canUseMessaging || !state.selectedThreadId) {
      return;
    }
    void loadMessages(state.selectedThreadId, { page: 1 });
  }, [canUseMessaging, loadMessages, state.selectedThreadId]);

  useEffect(() => {
    if (!canUseMessaging) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      void loadThreads({ append: false, preserveSelection: true, silent: true });
      if (stateRef.current.selectedThreadId) {
        void refreshPresence(stateRef.current.selectedThreadId, { force: false });
      }
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [canUseMessaging, loadThreads, refreshPresence]);

  useEffect(() => {
    if (!canUseMessaging) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      dispatch({ type: 'PRUNE_TYPING', payload: { now: Date.now() } });
    }, 2000);
    return () => window.clearInterval(interval);
  }, [canUseMessaging]);

  const value = useMemo(
    () => ({
      state,
      canUseMessaging,
      actorId,
      loadThreads,
      loadMessages,
      refreshPresence,
      sendMessage,
      startCall,
      closeCall,
      selectThread,
      setComposerDraft,
      notifyTyping,
    }),
    [
      state,
      canUseMessaging,
      actorId,
      loadThreads,
      loadMessages,
      refreshPresence,
      sendMessage,
      startCall,
      closeCall,
      selectThread,
      setComposerDraft,
      notifyTyping,
    ],
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}

MessagingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useMessagingStore() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessagingStore must be used within a MessagingProvider');
  }
  const {
    state,
    canUseMessaging,
    actorId,
    loadThreads,
    loadMessages,
    refreshPresence,
    sendMessage,
    startCall,
    closeCall,
    selectThread,
    setComposerDraft,
    notifyTyping,
  } = context;

  const { selectedThreadId } = state;
  const messagesState = selectedThreadId ? state.messagesByThread[selectedThreadId] ?? {} : {};
  const presenceState = selectedThreadId ? state.presenceByThread[selectedThreadId] ?? {} : {};

  return {
    threads: state.threads,
    threadsLoading: state.threadsLoading,
    threadsAppending: state.threadsAppending,
    threadsError: state.threadsError,
    threadsPage: state.threadsPage,
    hasMoreThreads: state.hasMoreThreads,
    selectedThreadId,
    messages: messagesState.items ?? [],
    messagesLoading: messagesState.loading ?? false,
    messagesError: messagesState.error ?? null,
    callState: state.call,
    typingParticipants: presenceState.typing ?? [],
    readReceipts: presenceState.receipts ?? [],
    composerDraft: selectedThreadId ? state.composerDrafts[selectedThreadId] ?? '' : '',
    composerDrafts: state.composerDrafts,
    canUseMessaging,
    actorId,
    lastThreadsSyncAt: state.lastThreadsSyncAt,
    loadThreads,
    loadMessages,
    refreshPresence,
    sendMessage,
    startCall,
    closeCall,
    selectThread,
    setComposerDraft,
    notifyTyping,
  };
}

export default MessagingContext;
