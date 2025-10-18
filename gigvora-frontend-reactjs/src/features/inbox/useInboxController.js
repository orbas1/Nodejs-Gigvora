import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import useSession from '../../hooks/useSession.js';
import {
  fetchInbox,
  fetchThread,
  fetchThreadMessages,
  sendMessage as apiSendMessage,
  createCallSession,
  createThread as apiCreateThread,
  markThreadRead,
  updateThreadState,
  muteThread,
  escalateThread as apiEscalateThread,
  assignSupportAgent as apiAssignSupportAgent,
  updateSupportStatus as apiUpdateSupportStatus,
} from '../../services/messaging.js';
import { resolveActorId } from '../../utils/session.js';
import {
  buildThreadTitle,
  describeLastActivity,
  formatThreadParticipants,
  isThreadUnread,
  sortMessages,
} from '../../utils/messaging.js';

const REFRESH_INTERVAL = 45_000;

const initialState = {
  threads: [],
  threadsLoading: false,
  threadsError: null,
  selectedThreadId: null,
  selectedThread: null,
  messages: [],
  messagesLoading: false,
  messagesError: null,
  composer: '',
  sending: false,
  callSession: null,
  callBusy: false,
  callError: null,
  filters: {
    unreadOnly: false,
    view: 'all',
    channel: 'all',
    search: '',
  },
  modals: {
    newThread: false,
    call: false,
    escalate: false,
    assign: false,
    supportStatus: false,
  },
  drawers: {
    filters: false,
    details: false,
    support: false,
  },
  pendingAction: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_THREADS':
      return {
        ...state,
        threads: action.payload,
      };
    case 'SET_THREADS_LOADING':
      return {
        ...state,
        threadsLoading: action.payload,
      };
    case 'SET_THREADS_ERROR':
      return {
        ...state,
        threadsError: action.payload,
      };
    case 'SET_SELECTED_THREAD':
      return {
        ...state,
        selectedThreadId: action.payload?.id ?? action.payload ?? null,
        selectedThread: action.payload ?? null,
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    case 'SET_MESSAGES_LOADING':
      return {
        ...state,
        messagesLoading: action.payload,
      };
    case 'SET_MESSAGES_ERROR':
      return {
        ...state,
        messagesError: action.payload,
      };
    case 'SET_COMPOSER':
      return {
        ...state,
        composer: action.payload,
      };
    case 'SET_SENDING':
      return {
        ...state,
        sending: action.payload,
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
    case 'TOGGLE_MODAL': {
      const { key, open } = action.payload;
      return {
        ...state,
        modals: {
          ...state.modals,
          [key]: typeof open === 'boolean' ? open : !state.modals[key],
        },
      };
    }
    case 'TOGGLE_DRAWER': {
      const { key, open } = action.payload;
      return {
        ...state,
        drawers: {
          ...state.drawers,
          [key]: typeof open === 'boolean' ? open : !state.drawers[key],
        },
      };
    }
    case 'SET_CALL_SESSION':
      return {
        ...state,
        callSession: action.payload,
      };
    case 'SET_CALL_BUSY':
      return {
        ...state,
        callBusy: action.payload,
      };
    case 'SET_CALL_ERROR':
      return {
        ...state,
        callError: action.payload,
      };
    case 'SET_PENDING_ACTION':
      return {
        ...state,
        pendingAction: action.payload,
      };
    case 'PATCH_THREAD': {
      const nextThreads = state.threads.map((thread) =>
        thread.id === action.payload.id ? { ...thread, ...action.payload.patch } : thread,
      );
      return {
        ...state,
        threads: nextThreads,
        selectedThread:
          state.selectedThread && state.selectedThread.id === action.payload.id
            ? { ...state.selectedThread, ...action.payload.patch }
            : state.selectedThread,
      };
    }
    case 'UPSERT_THREAD': {
      const existingIndex = state.threads.findIndex((thread) => thread.id === action.payload.id);
      let threads;
      if (existingIndex >= 0) {
        threads = [...state.threads];
        threads[existingIndex] = {
          ...threads[existingIndex],
          ...action.payload.data,
        };
      } else {
        threads = [action.payload.data, ...state.threads];
      }
      return {
        ...state,
        threads,
        selectedThread:
          state.selectedThread && state.selectedThread.id === action.payload.id
            ? { ...state.selectedThread, ...action.payload.data }
            : state.selectedThread,
      };
    }
    default:
      return state;
  }
}

function normalizeThread(thread, actorId) {
  if (!thread) {
    return null;
  }
  return {
    ...thread,
    title: buildThreadTitle(thread, actorId),
    participantsLabel: formatThreadParticipants(thread, actorId).join(', '),
    lastActivityLabel: describeLastActivity(thread),
    unread: isThreadUnread(thread),
  };
}

export default function useInboxController() {
  const { session, isAuthenticated } = useSession();
  const actorId = useMemo(() => resolveActorId(session), [session]);
  const [{
    threads,
    threadsLoading,
    threadsError,
    selectedThreadId,
    selectedThread,
    messages,
    messagesLoading,
    messagesError,
    composer,
    sending,
    filters,
    modals,
    drawers,
    callSession,
    callBusy,
    callError,
    pendingAction,
  }, dispatch] = useReducer(reducer, initialState);
  const refreshRef = useRef(null);
  const lastThreadRequestRef = useRef(0);
  const lastMessageRequestRef = useRef(0);

  const hasSession = Boolean(isAuthenticated && actorId);

  const applyFilters = useCallback(
    (rawThreads) => {
      const { unreadOnly, channel, search, view } = filters;
      return rawThreads
        .filter((thread) => {
          if (unreadOnly && !isThreadUnread(thread)) {
            return false;
          }
          if (channel !== 'all' && thread.channelType !== channel) {
            return false;
          }
          if (view === 'support' && !thread?.supportCase?.id) {
            return false;
          }
          if (view === 'calls' && thread?.lastCallAt == null) {
            return false;
          }
          if (search) {
            const haystack = `${thread.subject ?? ''} ${thread.lastMessagePreview ?? ''} ${
              thread.participantsLabel ?? ''
            }`
              .toLowerCase()
              .trim();
            if (!haystack.includes(search.toLowerCase().trim())) {
              return false;
            }
          }
          return true;
        })
        .map((thread) => normalizeThread(thread, actorId));
    },
    [actorId, filters],
  );

  const fetchThreads = useCallback(async () => {
    if (!hasSession) {
      return;
    }
    const requestId = lastThreadRequestRef.current + 1;
    lastThreadRequestRef.current = requestId;
    dispatch({ type: 'SET_THREADS_LOADING', payload: true });
    dispatch({ type: 'SET_THREADS_ERROR', payload: null });
    try {
      const response = await fetchInbox({
        userId: actorId,
        includeParticipants: true,
        includeSupport: true,
        pageSize: 50,
      });
      const data = Array.isArray(response?.data) ? response.data : [];
      if (lastThreadRequestRef.current !== requestId) {
        return;
      }
      const normalized = data.map((thread) => normalizeThread(thread, actorId)).filter(Boolean);
      dispatch({ type: 'SET_THREADS', payload: normalized });
      if (!selectedThreadId && normalized.length) {
        dispatch({ type: 'SET_SELECTED_THREAD', payload: normalized[0] });
      } else if (selectedThreadId) {
        const current = normalized.find((item) => item.id === selectedThreadId);
        if (current) {
          dispatch({ type: 'SET_SELECTED_THREAD', payload: current });
        }
      }
    } catch (error) {
      dispatch({
        type: 'SET_THREADS_ERROR',
        payload: error?.body?.message ?? error?.message ?? 'Unable to load inbox.',
      });
    } finally {
      dispatch({ type: 'SET_THREADS_LOADING', payload: false });
    }
  }, [actorId, hasSession, selectedThreadId]);

  const loadThreadDetails = useCallback(
    async (threadId) => {
      if (!hasSession || !threadId) {
        dispatch({ type: 'SET_SELECTED_THREAD', payload: null });
        return;
      }
      try {
        const response = await fetchThread(threadId, { includeParticipants: true, includeSupport: true });
        const thread = normalizeThread(response?.data ?? response, actorId) ?? null;
        if (thread) {
          dispatch({ type: 'SET_SELECTED_THREAD', payload: thread });
        }
      } catch (error) {
        console.warn('Failed to load thread details', error);
      }
    },
    [actorId, hasSession],
  );

  const loadMessages = useCallback(
    async (threadId) => {
      if (!hasSession || !threadId) {
        dispatch({ type: 'SET_MESSAGES', payload: [] });
        return;
      }
      const requestId = lastMessageRequestRef.current + 1;
      lastMessageRequestRef.current = requestId;
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: true });
      dispatch({ type: 'SET_MESSAGES_ERROR', payload: null });
      try {
        const response = await fetchThreadMessages(threadId, { pageSize: 120 });
        const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        if (lastMessageRequestRef.current !== requestId) {
          return;
        }
        const sorted = sortMessages(data);
        dispatch({ type: 'SET_MESSAGES', payload: sorted });
        await markThreadRead(threadId, { userId: actorId });
        dispatch({
          type: 'PATCH_THREAD',
          payload: { id: threadId, patch: { unread: false, unreadCount: 0 } },
        });
      } catch (error) {
        dispatch({
          type: 'SET_MESSAGES_ERROR',
          payload: error?.body?.message ?? error?.message ?? 'Unable to open conversation.',
        });
      } finally {
        dispatch({ type: 'SET_MESSAGES_LOADING', payload: false });
      }
    },
    [actorId, hasSession],
  );

  const selectThread = useCallback(
    async (threadId) => {
      if (!threadId || !threads.length) {
        return;
      }
      const thread = threads.find((item) => item.id === threadId);
      dispatch({ type: 'SET_SELECTED_THREAD', payload: thread ?? { id: threadId } });
      await loadThreadDetails(threadId);
      await loadMessages(threadId);
    },
    [loadMessages, loadThreadDetails, threads],
  );

  const refreshThreads = useCallback(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (!hasSession) {
      return;
    }
    fetchThreads();
  }, [fetchThreads, hasSession]);

  useEffect(() => {
    if (!hasSession) {
      return () => {};
    }
    refreshRef.current = setInterval(() => {
      fetchThreads();
      if (selectedThreadId) {
        loadMessages(selectedThreadId);
      }
    }, REFRESH_INTERVAL);
    return () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
      }
    };
  }, [fetchThreads, hasSession, loadMessages, selectedThreadId]);

  const sendMessage = useCallback(
    async (body, options = {}) => {
      if (!hasSession || !selectedThreadId || !body?.trim()) {
        return null;
      }
      dispatch({ type: 'SET_SENDING', payload: true });
      dispatch({ type: 'SET_PENDING_ACTION', payload: 'sendMessage' });
      try {
        const response = await apiSendMessage(selectedThreadId, {
          userId: actorId,
          messageType: options.messageType ?? 'text',
          body: body.trim(),
          attachments: options.attachments ?? [],
          metadata: options.metadata ?? {},
        });
        const message = response?.data ?? response;
        dispatch({ type: 'SET_COMPOSER', payload: '' });
        await loadMessages(selectedThreadId);
        await loadThreadDetails(selectedThreadId);
        fetchThreads();
        return message;
      } catch (error) {
        dispatch({ type: 'SET_MESSAGES_ERROR', payload: error?.body?.message ?? error?.message ?? 'Send failed.' });
        throw error;
      } finally {
        dispatch({ type: 'SET_SENDING', payload: false });
        dispatch({ type: 'SET_PENDING_ACTION', payload: null });
      }
    },
    [actorId, fetchThreads, hasSession, loadMessages, loadThreadDetails, selectedThreadId],
  );

  const createThread = useCallback(
    async ({ subject, participants, channelType = 'direct', body, metadata = {} }) => {
      if (!hasSession || !actorId) {
        throw new Error('You need to be signed in to start a conversation.');
      }
      dispatch({ type: 'SET_PENDING_ACTION', payload: 'createThread' });
      try {
        const response = await apiCreateThread({
          userId: actorId,
          subject,
          participantIds: participants,
          channelType,
          metadata,
        });
        const thread = normalizeThread(response?.data ?? response, actorId);
        if (!thread) {
          throw new Error('Unable to create conversation.');
        }
        dispatch({ type: 'UPSERT_THREAD', payload: { id: thread.id, data: thread } });
        dispatch({ type: 'SET_SELECTED_THREAD', payload: thread });
        if (body?.trim()) {
          await apiSendMessage(thread.id, {
            userId: actorId,
            messageType: 'text',
            body: body.trim(),
          });
        }
        await loadMessages(thread.id);
        await loadThreadDetails(thread.id);
        fetchThreads();
        return thread;
      } finally {
        dispatch({ type: 'SET_PENDING_ACTION', payload: null });
      }
    },
    [actorId, fetchThreads, hasSession, loadMessages, loadThreadDetails],
  );

  const beginCall = useCallback(
    async ({ callType = 'video', role = 'host' } = {}) => {
      if (!hasSession || !selectedThreadId) {
        return;
      }
      dispatch({ type: 'SET_CALL_BUSY', payload: true });
      dispatch({ type: 'SET_CALL_ERROR', payload: null });
      try {
        const response = await createCallSession(selectedThreadId, {
          userId: actorId,
          callType,
          role,
        });
        const sessionPayload = response?.data ?? response;
        dispatch({ type: 'SET_CALL_SESSION', payload: sessionPayload });
        return sessionPayload;
      } catch (error) {
        dispatch({ type: 'SET_CALL_ERROR', payload: error?.body?.message ?? error?.message ?? 'Unable to start call.' });
        throw error;
      } finally {
        dispatch({ type: 'SET_CALL_BUSY', payload: false });
      }
    },
    [actorId, hasSession, selectedThreadId],
  );

  const changeThreadState = useCallback(
    async (state) => {
      if (!hasSession || !selectedThreadId) {
        return;
      }
      await updateThreadState(selectedThreadId, { state });
      dispatch({
        type: 'PATCH_THREAD',
        payload: { id: selectedThreadId, patch: { state } },
      });
      fetchThreads();
    },
    [fetchThreads, hasSession, selectedThreadId],
  );

  const toggleMute = useCallback(
    async ({ until } = {}) => {
      if (!hasSession || !selectedThreadId) {
        return;
      }
      await muteThread(selectedThreadId, { userId: actorId, until });
      fetchThreads();
      await loadThreadDetails(selectedThreadId);
    },
    [actorId, fetchThreads, hasSession, loadThreadDetails, selectedThreadId],
  );

  const escalateCase = useCallback(
    async ({ reason, priority = 'medium', metadata = {} }) => {
      if (!hasSession || !selectedThreadId) {
        return;
      }
      await apiEscalateThread(selectedThreadId, {
        userId: actorId,
        reason,
        priority,
        metadata,
      });
      fetchThreads();
      await loadThreadDetails(selectedThreadId);
    },
    [actorId, fetchThreads, hasSession, loadThreadDetails, selectedThreadId],
  );

  const assignSupportAgent = useCallback(
    async ({ agentId, notifyAgent = true }) => {
      if (!hasSession || !selectedThreadId) {
        return;
      }
      await apiAssignSupportAgent(selectedThreadId, {
        userId: actorId,
        agentId,
        notifyAgent,
      });
      fetchThreads();
      await loadThreadDetails(selectedThreadId);
    },
    [actorId, fetchThreads, hasSession, loadThreadDetails, selectedThreadId],
  );

  const updateSupportStatus = useCallback(
    async ({ status, resolutionSummary, metadata = {} }) => {
      if (!hasSession || !selectedThreadId) {
        return;
      }
      await apiUpdateSupportStatus(selectedThreadId, {
        userId: actorId,
        status,
        resolutionSummary,
        metadata,
      });
      fetchThreads();
      await loadThreadDetails(selectedThreadId);
    },
    [actorId, fetchThreads, hasSession, loadThreadDetails, selectedThreadId],
  );

  const filteredThreads = useMemo(() => applyFilters(threads), [applyFilters, threads]);

  return {
    session,
    actorId,
    state: {
      threads: filteredThreads,
      rawThreads: threads,
      threadsLoading,
      threadsError,
      selectedThreadId,
      selectedThread,
      messages,
      messagesLoading,
      messagesError,
      composer,
      sending,
      filters,
      modals,
      drawers,
      callSession,
      callBusy,
      callError,
      pendingAction,
    },
    actions: {
      setComposer: (value) => dispatch({ type: 'SET_COMPOSER', payload: value }),
      toggleModal: (key, open) => dispatch({ type: 'TOGGLE_MODAL', payload: { key, open } }),
      toggleDrawer: (key, open) => dispatch({ type: 'TOGGLE_DRAWER', payload: { key, open } }),
      setFilters: (next) => dispatch({ type: 'SET_FILTERS', payload: next }),
      selectThread,
      refreshThreads,
      sendMessage,
      createThread,
      beginCall,
      changeThreadState,
      toggleMute,
      escalateCase,
      assignSupportAgent,
      updateSupportStatus,
      loadMessages,
      loadThreadDetails,
    },
  };
}
