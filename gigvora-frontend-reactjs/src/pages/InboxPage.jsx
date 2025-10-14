import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import {
  fetchInbox,
  fetchThreadMessages,
  sendMessage,
  createCallSession,
  markThreadRead,
} from '../services/messaging.js';
import { resolveActorId } from '../utils/session.js';
import {
  buildThreadTitle,
  formatThreadParticipants,
  isThreadUnread,
  describeLastActivity,
  sortMessages,
} from '../utils/messaging.js';
import ConversationMessage from '../components/messaging/ConversationMessage.jsx';
import AgoraCallPanel from '../components/messaging/AgoraCallPanel.jsx';
import { classNames } from '../utils/classNames.js';
import { canAccessMessaging, getMessagingMemberships, MESSAGING_ALLOWED_MEMBERSHIPS } from '../constants/access.js';
import { DASHBOARD_LINKS } from '../constants/dashboardLinks.js';

const INBOX_REFRESH_INTERVAL = 60_000;

function sortThreads(threads = []) {
  return [...threads].sort((a, b) => {
    const aTime = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

function formatMembershipLabel(key) {
  return DASHBOARD_LINKS[key]?.label ?? key.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function ThreadCard({ thread, actorId, onSelect, selected }) {
  const title = buildThreadTitle(thread, actorId);
  const participants = formatThreadParticipants(thread, actorId);
  const unread = isThreadUnread(thread);
  const activity = describeLastActivity(thread);

  return (
    <button
      type="button"
      onClick={() => onSelect(thread.id)}
      className={classNames(
        'w-full rounded-3xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected
          ? 'border-accent bg-accentSoft shadow-soft'
          : unread
          ? 'border-slate-200 bg-white shadow-sm hover:border-accent/60'
          : 'border-slate-200 bg-white hover:border-accent/60',
      )}
      aria-pressed={selected}
      aria-label={`Open conversation ${title}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="text-xs text-slate-400">{activity}</span>
      </div>
      {participants.length ? (
        <p className="mt-1 text-xs text-slate-500">{participants.join(', ')}</p>
      ) : null}
      {thread.lastMessagePreview ? (
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{thread.lastMessagePreview}</p>
      ) : null}
      {unread ? (
        <span className="mt-3 inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Unread
        </span>
      ) : null}
    </button>
  );
}

export default function InboxPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const actorId = resolveActorId(session);
  const inboxRequestRef = useRef(0);
  const messageRequestRef = useRef(0);

  const messagingMemberships = useMemo(() => getMessagingMemberships(session), [session]);
  const allowedMembershipLabels = useMemo(
    () => messagingMemberships.map((membership) => formatMembershipLabel(membership)),
    [messagingMemberships],
  );
  const allowedRoleCatalog = useMemo(
    () => MESSAGING_ALLOWED_MEMBERSHIPS.map((membership) => formatMembershipLabel(membership)),
    [],
  );
  const hasMessagingAccess = useMemo(() => canAccessMessaging(session), [session]);

  const [threads, setThreads] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [callSession, setCallSession] = useState(null);
  const [callLoading, setCallLoading] = useState(false);
  const [callError, setCallError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const loadInbox = useCallback(async () => {
    if (!isAuthenticated || !actorId || !hasMessagingAccess) {
      return;
    }
    const requestId = inboxRequestRef.current + 1;
    inboxRequestRef.current = requestId;
    setInboxLoading(true);
    setInboxError(null);
    try {
      const response = await fetchInbox({ userId: actorId, includeParticipants: true, pageSize: 30 });
      const data = Array.isArray(response?.data) ? response.data : [];
      if (inboxRequestRef.current !== requestId) {
        return;
      }
      setThreads(sortThreads(data));
      if (!selectedThreadId && data.length) {
        setSelectedThreadId(data[0].id);
      } else if (selectedThreadId) {
        const exists = data.some((thread) => thread.id === selectedThreadId);
        if (!exists && data.length) {
          setSelectedThreadId(data[0].id);
        }
      }
    } catch (err) {
      setInboxError(err?.body?.message ?? err?.message ?? 'Unable to load inbox threads.');
    } finally {
      setInboxLoading(false);
    }
  }, [actorId, hasMessagingAccess, inboxRequestRef, isAuthenticated, selectedThreadId]);

  const updateThreadViewerState = useCallback((threadId) => {
    const now = new Date().toISOString();
    setThreads((previous) =>
      previous.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              unreadCount: 0,
              viewerState: { ...(thread.viewerState ?? {}), lastReadAt: now },
            }
          : thread,
      ),
    );
  }, []);

  const loadMessages = useCallback(
    async (threadId) => {
      if (!isAuthenticated || !actorId || !threadId || !hasMessagingAccess) {
        setMessages([]);
        return;
      }
      const requestId = messageRequestRef.current + 1;
      messageRequestRef.current = requestId;
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const response = await fetchThreadMessages(threadId, { pageSize: 100 });
        const data = Array.isArray(response?.data) ? sortMessages(response.data) : [];
        if (messageRequestRef.current !== requestId) {
          return;
        }
        setMessages(data);
        updateThreadViewerState(threadId);
        await markThreadRead(threadId, { userId: actorId });
      } catch (err) {
        setMessages([]);
        setMessagesError(err?.body?.message ?? err?.message ?? 'Unable to load conversation.');
      } finally {
        setMessagesLoading(false);
      }
    },
    [actorId, hasMessagingAccess, isAuthenticated, messageRequestRef, updateThreadViewerState],
  );

  useEffect(() => {
    if (!isAuthenticated || !actorId || !hasMessagingAccess) {
      return;
    }
    loadInbox();
  }, [isAuthenticated, actorId, hasMessagingAccess, loadInbox]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedThreadId);
  }, [selectedThreadId, loadMessages]);

  useEffect(() => {
    if (!isAuthenticated || !actorId || !hasMessagingAccess) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      loadInbox();
      if (selectedThreadId) {
        loadMessages(selectedThreadId);
      }
    }, INBOX_REFRESH_INTERVAL);
    return () => window.clearInterval(interval);
  }, [actorId, hasMessagingAccess, isAuthenticated, loadInbox, loadMessages, selectedThreadId]);

  if (isAuthenticated && !hasMessagingAccess) {
    return (
      <section className="relative overflow-hidden py-20">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]"
          aria-hidden="true"
        />
        <div className="absolute -left-12 bottom-6 h-72 w-72 rounded-full bg-emerald-200/40 blur-[120px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6">
          <PageHeader
            eyebrow="Messaging"
            title="Inbox access pending"
            description="Your account doesn’t currently have an active messaging workspace. Update your memberships or contact Gigvora support to enable secure communications."
            actions={
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent"
              >
                Manage memberships
              </button>
            }
          />
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">Workspaces with messaging enabled</h2>
            <p className="mt-2 text-sm text-slate-600">
              Messaging is available to team, talent, and partner roles. Ask an administrator to add one of the roles below to your account.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {allowedRoleCatalog.length ? (
                allowedRoleCatalog.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">Messaging roles are configured by workspace administrators.</span>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/feed')}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Return to feed
              </button>
              <a
                href="mailto:support@gigvora.com"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!composer.trim() || !selectedThreadId || !actorId || !hasMessagingAccess) {
        return;
      }
      setSending(true);
      setMessagesError(null);
      try {
        const message = await sendMessage(selectedThreadId, {
          userId: actorId,
          messageType: 'text',
          body: composer.trim(),
        });
        setComposer('');
        setMessages((prev) => sortMessages([...prev, message]));
        await loadInbox();
      } catch (err) {
        setMessagesError(err?.body?.message ?? err?.message ?? 'Unable to send message.');
      } finally {
        setSending(false);
      }
    },
    [composer, selectedThreadId, actorId, hasMessagingAccess, loadInbox],
  );

  const startCall = useCallback(
    async (callType, callId) => {
      if (!selectedThreadId || !actorId || !hasMessagingAccess) {
        return;
      }
      setCallLoading(true);
      setCallError(null);
      try {
        const response = await createCallSession(selectedThreadId, {
          userId: actorId,
          callType,
          callId,
        });
        setCallSession(response);
        if (response?.message) {
          setMessages((prev) => {
            const exists = prev.some((message) => message.id === response.message.id);
            if (exists) {
              return prev.map((message) => (message.id === response.message.id ? response.message : message));
            }
            return sortMessages([...prev, response.message]);
          });
        }
        await loadInbox();
      } catch (err) {
        setCallError(err?.body?.message ?? err?.message ?? 'Unable to start call.');
      } finally {
        setCallLoading(false);
      }
    },
    [selectedThreadId, actorId, hasMessagingAccess, loadInbox],
  );

  const handleJoinCall = useCallback(
    (callMetadata) => {
      if (!callMetadata?.id || !hasMessagingAccess) {
        return;
      }
      startCall(callMetadata?.type ?? 'video', callMetadata.id);
    },
    [hasMessagingAccess, startCall],
  );

  const closeCallPanel = useCallback(() => {
    setCallSession(null);
    if (selectedThreadId && hasMessagingAccess) {
      loadMessages(selectedThreadId);
    }
  }, [hasMessagingAccess, selectedThreadId, loadMessages]);

  useEffect(() => {
    if (!isAuthenticated || !actorId || !hasMessagingAccess) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      loadInbox();
      if (selectedThreadId) {
        loadMessages(selectedThreadId);
      }
    }, INBOX_REFRESH_INTERVAL);
    return () => window.clearInterval(interval);
  }, [actorId, hasMessagingAccess, isAuthenticated, loadInbox, loadMessages, selectedThreadId]);

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -left-12 bottom-6 h-72 w-72 rounded-full bg-emerald-200/40 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Messaging"
          title="Centralised inbox"
          description="Secure messaging, enterprise-grade calling, and approvals across every workspace."
          actions={
            <button
              type="button"
              onClick={loadInbox}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" /> Refresh inbox
            </button>
          }
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(260px,0.8fr),minmax(0,2fr)]">
          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{session?.name ?? 'Gigvora member'}</p>
              <p className="text-xs text-slate-500">Inbox syncs across dashboards, client portals, and partner workspaces.</p>
              {allowedMembershipLabels.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {allowedMembershipLabels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Threads</p>
                <button
                  type="button"
                  onClick={loadInbox}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                  disabled={inboxLoading}
                >
                  <ArrowPathIcon className={classNames('h-4 w-4', inboxLoading ? 'animate-spin' : '')} /> Sync
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {inboxError ? (
                  <p className="rounded-3xl bg-rose-50 px-4 py-3 text-xs text-rose-600" role="alert">
                    {inboxError}
                  </p>
                ) : null}
                {inboxLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-20 rounded-3xl bg-slate-100" />
                    ))}
                  </div>
                ) : threads.length ? (
                  threads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      actorId={actorId}
                      selected={selectedThreadId === thread.id}
                      onSelect={setSelectedThreadId}
                    />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No conversations yet. Start a thread from any project or invite collaborators to connect.
                  </div>
                )}
              </div>
            </div>
          </aside>
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            {selectedThread ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{buildThreadTitle(selectedThread, actorId)}</p>
                  <p className="text-xs text-slate-500">{formatThreadParticipants(selectedThread, actorId).join(', ')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startCall('video')}
                    disabled={!actorId || callLoading || Boolean(callSession)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                      !actorId || callLoading || Boolean(callSession)
                        ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border border-accent bg-accent text-white hover:border-accentDark hover:bg-accentDark',
                    )}
                  >
                    <VideoCameraIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} /> Start video
                  </button>
                  <button
                    type="button"
                    onClick={() => startCall('voice')}
                    disabled={!actorId || callLoading || Boolean(callSession)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                      !actorId || callLoading || Boolean(callSession)
                        ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-accent/60 hover:text-accent',
                    )}
                  >
                    <PhoneIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} /> Start voice
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a conversation to view history, share documents, and launch calls.</p>
            )}
            {callError ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
                {callError}
              </p>
            ) : null}
            <div className="max-h-[32rem] space-y-4 overflow-y-auto pr-2">
              {messagesError ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
                  {messagesError}
                </p>
              ) : null}
              {messagesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-16 rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : messages.length ? (
                messages.map((message) => (
                  <ConversationMessage
                    key={message.id}
                    message={message}
                    actorId={actorId}
                    onJoinCall={handleJoinCall}
                    joiningCall={callLoading}
                    activeCallId={callSession?.callId ?? null}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">No messages yet. Share agendas, approvals, and updates to kick things off.</p>
              )}
            </div>
            {callSession ? <AgoraCallPanel session={callSession} onClose={closeCallPanel} /> : null}
            <form className="space-y-3" onSubmit={handleSend}>
              <textarea
                rows={4}
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                disabled={!selectedThreadId || sending}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder={selectedThreadId ? 'Write your reply…' : 'Select a conversation to reply.'}
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!selectedThreadId || !composer.trim() || sending}
                  className={classNames(
                    'inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition',
                    !selectedThreadId || !composer.trim() || sending ? 'cursor-not-allowed opacity-60' : 'hover:bg-accentDark',
                  )}
                >
                  Send message
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                  onClick={() => loadInbox()}
                >
                  Share to team
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
