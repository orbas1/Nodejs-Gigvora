import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import useSession from '../../hooks/useSession.js';
import {
  fetchInbox,
  fetchThreadMessages,
  sendMessage,
  createCallSession,
} from '../../services/messaging.js';
import {
  resolveActorId,
  buildThreadTitle,
  formatThreadParticipants,
  isThreadUnread,
  describeLastActivity,
  sortMessages,
} from '../../utils/messaging.js';
import AgoraCallPanel from './AgoraCallPanel.jsx';
import ConversationMessage from './ConversationMessage.jsx';
import { classNames } from '../../utils/classNames.js';
import { canAccessMessaging } from '../../constants/access.js';

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'flex-1 rounded-full px-3 py-2 text-sm font-semibold transition',
        active ? 'bg-accent text-white shadow-soft' : 'text-slate-600 hover:bg-slate-100',
      )}
    >
      {children}
    </button>
  );
}

function ThreadListItem({ thread, actorId, active, onSelect }) {
  const title = buildThreadTitle(thread, actorId);
  const participants = formatThreadParticipants(thread, actorId);
  const unread = isThreadUnread(thread);
  const lastActivity = describeLastActivity(thread);

  return (
    <button
      type="button"
      onClick={() => onSelect(thread.id)}
      className={classNames(
        'flex w-full flex-col rounded-3xl border px-4 py-3 text-left transition',
        active
          ? 'border-accent bg-accentSoft shadow-soft'
          : unread
          ? 'border-slate-200 bg-white shadow-sm hover:border-accent/60'
          : 'border-slate-200 bg-white hover:border-accent/60',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="text-xs text-slate-400">{lastActivity}</span>
      </div>
      {participants.length ? (
        <p className="mt-1 text-xs text-slate-500">{participants.join(', ')}</p>
      ) : null}
      {thread.lastMessagePreview ? (
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{thread.lastMessagePreview}</p>
      ) : null}
      {unread ? (
        <span className="mt-3 inline-flex w-fit items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Unread
        </span>
      ) : null}
    </button>
  );
}

export default function MessagingDock() {
  const { session, isAuthenticated } = useSession();
  const actorId = resolveActorId(session);
  const canUseMessaging = Boolean(isAuthenticated && actorId && canAccessMessaging(session));

  if (!isAuthenticated) {
    return null;
  }

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('inbox');
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

  const loadInbox = useCallback(async () => {
    if (!canUseMessaging) {
      return;
    }
    setInboxLoading(true);
    setInboxError(null);
    try {
      const response = await fetchInbox({ userId: actorId, includeParticipants: true, pageSize: 20 });
      const data = Array.isArray(response?.data) ? response.data : [];
      setThreads(data);
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
  }, [actorId, canUseMessaging, selectedThreadId]);

  const loadMessages = useCallback(
    async (threadId) => {
      if (!threadId || !canUseMessaging) {
        setMessages([]);
        return;
      }
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const response = await fetchThreadMessages(threadId, { pageSize: 50 });
        const data = Array.isArray(response?.data) ? sortMessages(response.data) : [];
        setMessages(data);
      } catch (err) {
        setMessages([]);
        setMessagesError(err?.body?.message ?? err?.message ?? 'Unable to load this conversation.');
      } finally {
        setMessagesLoading(false);
      }
    },
    [canUseMessaging],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!canUseMessaging) {
      return;
    }
    loadInbox();
  }, [open, canUseMessaging, loadInbox]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedThreadId);
  }, [selectedThreadId, loadMessages]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!composer.trim() || !selectedThreadId || !canUseMessaging) {
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
    [composer, selectedThreadId, canUseMessaging, actorId, loadInbox],
  );

  const startCall = useCallback(
    async (callType, callId) => {
      if (!selectedThreadId || !canUseMessaging) {
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
    [selectedThreadId, canUseMessaging, actorId, loadInbox],
  );

  const handleJoinCall = useCallback(
    (callMetadata) => {
      if (!callMetadata?.id) {
        return;
      }
      startCall(callMetadata?.type ?? 'video', callMetadata.id);
    },
    [startCall],
  );

  const closeCallPanel = useCallback(() => {
    setCallSession(null);
    if (selectedThreadId) {
      loadMessages(selectedThreadId);
    }
  }, [selectedThreadId, loadMessages]);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      {open ? (
        <div className="w-96 max-w-full rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-400/20">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {tab === 'inbox' ? 'Inbox' : 'Support chat'}
              </p>
              <p className="text-xs text-slate-500">
                {tab === 'inbox'
                  ? 'Secure messaging, calls, and files for every workspace.'
                  : 'Switch to the trust centre for ticket analytics and SLAs.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              aria-label="Close messaging"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 py-3">
            <TabButton active={tab === 'inbox'} onClick={() => setTab('inbox')}>
              Inbox
            </TabButton>
            <TabButton active={tab === 'support'} onClick={() => setTab('support')}>
              Support
            </TabButton>
          </div>
          {tab === 'inbox' ? (
            <div className="px-4 pb-4">
              {canUseMessaging ? (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Synced across dashboards for teams and partners.</p>
                  <button
                    type="button"
                    onClick={loadInbox}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                    disabled={inboxLoading}
                  >
                    <ArrowPathIcon className={classNames('h-3.5 w-3.5', inboxLoading ? 'animate-spin' : '')} /> Refresh
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Sign in to view your organisation inbox, start calls, and collaborate in real time.
                </p>
              )}
              <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,0.9fr),minmax(0,1.4fr)]">
                <div className="space-y-3">
                  {inboxError ? (
                    <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-600">{inboxError}</p>
                  ) : null}
                  {inboxLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-20 rounded-3xl bg-slate-100" />
                      ))}
                    </div>
                  ) : threads.length ? (
                    threads.map((thread) => (
                      <ThreadListItem
                        key={thread.id}
                        thread={thread}
                        actorId={actorId}
                        active={thread.id === selectedThreadId}
                        onSelect={setSelectedThreadId}
                      />
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      Start a conversation with collaborators or clients. Threads appear here once you create them.
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
                  {selectedThread ? (
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{buildThreadTitle(selectedThread, actorId)}</p>
                      <p className="text-xs text-slate-500">
                        {formatThreadParticipants(selectedThread, actorId).join(', ') || 'Private notes'}
                      </p>
                    </div>
                  ) : null}
                  {callError ? (
                    <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600">{callError}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCall('video')}
                      disabled={!canUseMessaging || !selectedThreadId || callLoading || Boolean(callSession)}
                      className={classNames(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                        !canUseMessaging || !selectedThreadId || callLoading || Boolean(callSession)
                          ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'border border-accent bg-accent text-white hover:border-accentDark hover:bg-accentDark',
                      )}
                    >
                      <VideoCameraIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} /> Start video
                    </button>
                    <button
                      type="button"
                      onClick={() => startCall('voice')}
                      disabled={!canUseMessaging || !selectedThreadId || callLoading || Boolean(callSession)}
                      className={classNames(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                        !canUseMessaging || !selectedThreadId || callLoading || Boolean(callSession)
                          ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'border border-slate-200 bg-white text-slate-700 hover:border-accent/60 hover:text-accent',
                      )}
                    >
                      <PhoneIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} /> Start voice
                    </button>
                  </div>
                  <div className="h-56 space-y-4 overflow-y-auto pr-2">
                    {messagesError ? (
                      <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600">{messagesError}</p>
                    ) : null}
                    {messagesLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
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
                      <p className="text-sm text-slate-500">
                        {canUseMessaging
                          ? 'Introduce the team, share files, and schedule calls – messages appear here in real time.'
                          : 'Sign in to read and send messages.'}
                      </p>
                    )}
                  </div>
                  {callSession ? <AgoraCallPanel session={callSession} onClose={closeCallPanel} /> : null}
                  <form className="mt-2 space-y-2" onSubmit={handleSend}>
                    <textarea
                      rows={3}
                      value={composer}
                      onChange={(event) => setComposer(event.target.value)}
                      disabled={!canUseMessaging || !selectedThreadId || sending}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder={canUseMessaging ? 'Write your reply…' : 'Sign in to send messages'}
                    />
                    <div className="flex items-center justify-between">
                      {messagesError ? (
                        <span className="text-xs text-rose-500">{messagesError}</span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {selectedThread ? 'Files, reactions, and approvals sync across dashboards.' : 'Select a conversation to reply.'}
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={!canUseMessaging || !selectedThreadId || !composer.trim() || sending}
                        className={classNames(
                          'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-soft transition',
                          !canUseMessaging || !selectedThreadId || !composer.trim() || sending
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-accent text-white hover:bg-accentDark',
                        )}
                      >
                        <PaperAirplaneIcon className={classNames('h-4 w-4', sending ? 'animate-spin' : '')} />
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 px-4 pb-5 text-sm text-slate-600">
              <p>
                Our support specialists respond within minutes during UK and EU hours. Start a thread here or launch the full trust centre.
              </p>
              <button
                type="button"
                onClick={() => window.open('https://support.gigvora.com', '_blank', 'noreferrer')}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Visit support centre
              </button>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest tip</p>
                <p className="mt-2 text-sm text-slate-600">
                  Launch a video or voice call directly from any project thread – the audit log and recordings stay in sync.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-soft transition hover:bg-accentDark"
        aria-label={open ? 'Hide messages' : 'Show messages'}
        title={open ? 'Hide messages' : 'Show messages'}
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
