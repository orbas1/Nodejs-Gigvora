import {
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  FunnelIcon,
  MinusCircleIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  SignalIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { InboxProvider, useInbox } from './InboxProvider.jsx';
import ConversationMessage from '../../components/messaging/ConversationMessage.jsx';
import AgoraCallPanel from '../../components/messaging/AgoraCallPanel.jsx';
import { classNames } from '../../utils/classNames.js';

function EmptyState({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center">
      <ChatBubbleLeftIcon className="h-10 w-10 text-slate-300" aria-hidden="true" />
      <p className="text-base font-semibold text-slate-600">{title}</p>
      {subtitle ? <p className="max-w-xs text-sm text-slate-400">{subtitle}</p> : null}
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90"
        >
          <PlusIcon className="h-4 w-4" /> {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function ThreadPreview({ thread, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(thread.id)}
      className={classNames(
        'group w-full rounded-3xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        active
          ? 'border-accent bg-accentSoft shadow-soft'
          : 'border-slate-200 bg-white hover:border-accent/60 hover:shadow-sm',
      )}
      aria-pressed={active}
      aria-label={`Open ${thread.title}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-slate-900">{thread.title}</p>
        <span className="text-[11px] uppercase tracking-wide text-slate-400">{thread.lastActivityLabel}</span>
      </div>
      {thread.participantsLabel ? (
        <p className="mt-1 truncate text-xs text-slate-500">{thread.participantsLabel}</p>
      ) : null}
      {thread.lastMessagePreview ? (
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{thread.lastMessagePreview}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {thread.unread ? (
          <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            New
          </span>
        ) : null}
        {thread.supportCase?.id ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            <ShieldCheckIcon className="h-3 w-3" /> Support
          </span>
        ) : null}
      </div>
    </button>
  );
}

function ThreadColumn() {
  const {
    state: { threads, threadsLoading, threadsError, selectedThreadId, filters, drawers },
    actions: { selectThread, refreshThreads, toggleDrawer, toggleModal, setFilters },
  } = useInbox();

  const filterButtons = useMemo(
    () => [
      { key: 'all', label: 'All' },
      { key: 'unread', label: 'New' },
      { key: 'support', label: 'Help' },
      { key: 'calls', label: 'Calls' },
    ],
    [],
  );

  const activeView = filters.view === 'support' ? 'support' : filters.view === 'calls' ? 'calls' : filters.unreadOnly ? 'unread' : 'all';

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {filterButtons.map((button) => (
            <button
              key={button.key}
              type="button"
              onClick={() =>
                setFilters(
                  button.key === 'all'
                    ? { view: 'all', unreadOnly: false }
                    : button.key === 'unread'
                    ? { view: 'all', unreadOnly: true }
                    : { view: button.key, unreadOnly: false },
                )
              }
              className={classNames(
                'rounded-full px-3 py-1 text-xs font-semibold transition',
                activeView === button.key
                  ? 'bg-accent text-white shadow-soft'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              {button.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleModal('newThread', true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-soft transition hover:bg-accent/90"
            aria-label="New conversation"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => refreshThreads()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-accent hover:text-accent"
            aria-label="Refresh inbox"
          >
            <ArrowPathIcon className={classNames('h-4 w-4', threadsLoading ? 'animate-spin' : '')} />
          </button>
          <button
            type="button"
            onClick={() => toggleDrawer('filters', true)}
            className={classNames(
              'inline-flex h-9 w-9 items-center justify-center rounded-full border text-slate-500 transition hover:border-accent hover:text-accent',
              drawers.filters ? 'border-accent text-accent' : 'border-slate-200',
            )}
            aria-label="Inbox filters"
          >
            <FunnelIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        {threadsError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {threadsError}
          </div>
        ) : null}
        {threadsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className="h-24 animate-pulse rounded-3xl bg-white/60"
              />
            ))}
          </div>
        ) : null}
        {!threadsLoading && threads.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            subtitle="Start a chat to keep everything on record."
            actionLabel="New chat"
            onAction={() => toggleModal('newThread', true)}
          />
        ) : !threadsLoading ? (
          <ul className="flex flex-col gap-3">
            {threads.map((thread) => (
              <li key={thread.id}>
                <ThreadPreview thread={thread} active={thread.id === selectedThreadId} onSelect={selectThread} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function ConversationColumn() {
  const {
    state: {
      selectedThread,
      selectedThreadId,
      messages,
      messagesError,
      messagesLoading,
      composer,
      sending,
      callSession,
      callBusy,
      callError,
      modals,
      drawers,
    },
    actions: {
      setComposer,
      sendMessage,
      toggleModal,
      toggleDrawer,
      beginCall,
      changeThreadState,
      toggleMute,
      escalateCase,
      assignSupportAgent,
      updateSupportStatus,
      createThread,
    },
  } = useInbox();

  if (!selectedThreadId) {
    return (
      <EmptyState
        title="Pick a chat"
        subtitle="Choose a conversation from the list to get going."
        actionLabel="New chat"
        onAction={() => toggleModal('newThread', true)}
      />
    );
  }

  const supportCase = selectedThread?.supportCase;

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between rounded-3xl bg-white px-5 py-4 shadow-soft">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="truncate text-lg font-semibold text-slate-900">{selectedThread?.title ?? 'Conversation'}</p>
            {selectedThread?.unread ? (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                New
              </span>
            ) : null}
            {supportCase?.status ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                {supportCase.status.replace(/_/g, ' ')}
              </span>
            ) : null}
          </div>
          {selectedThread?.participantsLabel ? (
            <p className="mt-1 truncate text-sm text-slate-500">{selectedThread.participantsLabel}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleModal('call', true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-soft transition hover:bg-accent/90"
            aria-label="Start call"
          >
            <PhoneIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => toggleDrawer('support', true)}
            className={classNames(
              'inline-flex h-10 w-10 items-center justify-center rounded-full border text-slate-500 transition hover:border-accent hover:text-accent',
              drawers.support ? 'border-accent text-accent' : 'border-slate-200',
            )}
            aria-label="Support options"
          >
            <ShieldCheckIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => toggleDrawer('details', true)}
            className={classNames(
              'inline-flex h-10 w-10 items-center justify-center rounded-full border text-slate-500 transition hover:border-accent hover:text-accent',
              drawers.details ? 'border-accent text-accent' : 'border-slate-200',
            )}
            aria-label="Thread details"
          >
            <UserGroupIcon className="h-5 w-5" />
          </button>
        </div>
      </header>
      <section className="flex-1 overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {messagesError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">{messagesError}</div>
            ) : null}
            {messagesLoading ? (
              <div className="text-sm text-slate-400">Loading conversation…</div>
            ) : null}
            {!messagesLoading && messages.length === 0 ? (
              <p className="text-sm text-slate-400">No messages yet. Be the first to say hi.</p>
            ) : null}
            {messages.map((message) => (
              <ConversationMessage key={message.id ?? message.createdAt} message={message} />
            ))}
          </div>
          <div className="border-t border-slate-100 px-6 py-4">
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!composer.trim()) {
                  return;
                }
                await sendMessage(composer);
              }}
              className="flex flex-col gap-3"
            >
              <textarea
                name="message"
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                placeholder="Type a message"
                className="h-24 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                required
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await changeThreadState('archived');
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-accent hover:text-accent"
                  >
                    <MinusCircleIcon className="h-4 w-4" /> Archive
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await toggleMute({ until: null });
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-accent hover:text-accent"
                  >
                    <SignalIcon className="h-4 w-4" /> Mute
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
      {callSession ? (
        <div className="rounded-3xl bg-white p-4 shadow-soft">
          <AgoraCallPanel session={callSession} busy={callBusy} error={callError} />
        </div>
      ) : null}
      <SupportActionsDrawer
        open={drawers.support}
        onClose={() => toggleDrawer('support', false)}
        supportCase={supportCase}
        changeThreadState={changeThreadState}
        escalateCase={escalateCase}
        assignSupportAgent={assignSupportAgent}
        updateSupportStatus={updateSupportStatus}
      />
      <ThreadDetailsDrawer
        thread={selectedThread}
        open={drawers.details}
        onClose={() => toggleDrawer('details', false)}
      />
      <CallModal
        open={modals.call}
        busy={callBusy}
        error={callError}
        onClose={() => toggleModal('call', false)}
        onStart={beginCall}
      />
      <NewConversationModal
        open={modals.newThread}
        onClose={() => toggleModal('newThread', false)}
        onCreate={async (payload) => {
          await createThread(payload);
        }}
      />
    </div>
  );
}

function SupportActionsDrawer({
  open,
  onClose,
  supportCase,
  changeThreadState,
  escalateCase,
  assignSupportAgent,
  updateSupportStatus,
}) {
  const statusOptions = useMemo(
    () => ['triage', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'],
    [],
  );
  const priorityOptions = useMemo(() => ['low', 'medium', 'high', 'urgent'], []);

  const [status, setStatus] = useState('triage');
  const [summary, setSummary] = useState('');
  const [priority, setPriority] = useState('medium');
  const [reason, setReason] = useState('');
  const [agentId, setAgentId] = useState('');
  const [notifyAgent, setNotifyAgent] = useState(true);
  const [statusError, setStatusError] = useState('');
  const [escalateError, setEscalateError] = useState('');
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    if (open) {
      setStatus(supportCase?.status ?? 'triage');
      setSummary('');
      setPriority('medium');
      setReason('');
      setAgentId(supportCase?.ownerId ? String(supportCase.ownerId) : '');
      setNotifyAgent(true);
      setStatusError('');
      setEscalateError('');
      setAssignError('');
    }
  }, [open, supportCase]);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="w-screen max-w-md overflow-y-auto bg-white px-6 py-8 shadow-xl">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Support</Dialog.Title>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-accent hover:text-accent"
                >
                  Close
                </button>
              </div>
              <div className="mt-6 space-y-6">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Case summary</p>
                  {supportCase ? (
                    <ul className="mt-2 space-y-1">
                      <li>
                        <span className="font-semibold text-slate-700">ID:</span> {supportCase.id}
                      </li>
                      <li>
                        <span className="font-semibold text-slate-700">Status:</span> {supportCase.status}
                      </li>
                      {supportCase.owner?.name ? (
                        <li>
                          <span className="font-semibold text-slate-700">Owner:</span> {supportCase.owner.name}
                        </li>
                      ) : null}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm">No support case is linked yet.</p>
                  )}
                </div>
                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setStatusError('');
                    try {
                      await updateSupportStatus({ status, resolutionSummary: summary || undefined });
                      onClose();
                    } catch (error) {
                      setStatusError(error?.body?.message ?? error?.message ?? 'Unable to update status.');
                    }
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="Resolution notes"
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  {statusError ? <p className="text-sm text-rose-500">{statusError}</p> : null}
                  <button
                    type="submit"
                    className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-600"
                  >
                    Update
                  </button>
                </form>

                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setEscalateError('');
                    try {
                      await escalateCase({
                        reason: reason || 'Escalated from inbox',
                        priority,
                      });
                      setReason('');
                      onClose();
                    } catch (error) {
                      setEscalateError(error?.body?.message ?? error?.message ?? 'Unable to escalate.');
                    }
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Escalate</p>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Escalation reason"
                    rows={3}
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  {escalateError ? <p className="text-sm text-rose-500">{escalateError}</p> : null}
                  <button
                    type="submit"
                    className="w-full rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-rose-600"
                  >
                    Escalate
                  </button>
                </form>

                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const numericId = Number.parseInt(agentId, 10);
                    if (!Number.isInteger(numericId)) {
                      setAssignError('Enter a numeric agent ID.');
                      return;
                    }
                    setAssignError('');
                    try {
                      await assignSupportAgent({ agentId: numericId, notifyAgent });
                      onClose();
                    } catch (error) {
                      setAssignError(error?.body?.message ?? error?.message ?? 'Unable to assign agent.');
                    }
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assign</p>
                  <input
                    value={agentId}
                    onChange={(event) => setAgentId(event.target.value)}
                    placeholder="Agent ID"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                    required
                  />
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={notifyAgent}
                      onChange={(event) => setNotifyAgent(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                    />
                    Notify agent
                  </label>
                  {assignError ? <p className="text-sm text-rose-500">{assignError}</p> : null}
                  <button
                    type="submit"
                    className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Assign
                  </button>
                </form>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Thread</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await changeThreadState('locked');
                        onClose();
                      }}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-accent hover:text-accent"
                    >
                      Lock
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await changeThreadState('active');
                        onClose();
                      }}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-accent hover:text-accent"
                    >
                      Reopen
                    </button>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

function ThreadDetailsDrawer({ thread, open, onClose }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="w-screen max-w-md bg-white px-6 py-8 shadow-xl">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Details</Dialog.Title>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-accent hover:text-accent"
                >
                  Close
                </button>
              </div>
              {thread ? (
                <div className="mt-6 space-y-6 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{thread.title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Participants</p>
                    <p className="mt-1">{thread.participantsLabel || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Channel</p>
                    <p className="mt-1">{thread.channelType ?? 'direct'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">State</p>
                    <p className="mt-1">{thread.state ?? 'active'}</p>
                  </div>
                  {thread.supportCase ? (
                    <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Support Case</p>
                      <p>ID: {thread.supportCase.id}</p>
                      <p>Status: {thread.supportCase.status}</p>
                      {thread.supportCase.owner ? <p>Owner: {thread.supportCase.owner.name}</p> : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-400">No thread selected.</p>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

function CallModal({ open, onClose, onStart, busy, error }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-200"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="transform transition ease-in duration-150"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold text-slate-900">Start a call</Dialog.Title>
              <p className="mt-2 text-sm text-slate-500">Choose how you want to connect with everyone here.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await onStart({ callType: 'audio' });
                    onClose();
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-6 text-center text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  disabled={busy}
                >
                  Voice
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onStart({ callType: 'video' });
                    onClose();
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-6 text-center text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  disabled={busy}
                >
                  Video
                </button>
              </div>
              {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-accent hover:text-accent"
                >
                  Cancel
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

function NewConversationModal({ open, onClose, onCreate }) {
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormError('');
      setBusy(false);
    }
  }, [open]);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-200"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="transform transition ease-in duration-150"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold text-slate-900">New chat</Dialog.Title>
              <form
                className="mt-6 space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setFormError('');
                  const formData = new FormData(event.currentTarget);
                  const subject = formData.get('subject')?.toString().trim();
                  const participants = formData
                    .get('participants')
                    ?.toString()
                    .split(',')
                    .map((value) => Number.parseInt(value.trim(), 10))
                    .filter((value) => Number.isInteger(value));
                  const body = formData.get('body')?.toString();
                  const channelType = formData.get('channelType')?.toString() || 'direct';
                  const metadataRaw = formData.get('metadata')?.toString().trim();
                  let metadata = {};
                  if (metadataRaw) {
                    try {
                      metadata = JSON.parse(metadataRaw);
                    } catch (error) {
                      setFormError('Metadata must be valid JSON.');
                      return;
                    }
                  }
                  setBusy(true);
                  try {
                    await onCreate({ subject, participants, body, channelType, metadata });
                    onClose();
                  } catch (error) {
                    setFormError(error?.message ?? 'Unable to create conversation.');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label className="block text-sm font-semibold text-slate-700">
                  Subject
                  <input
                    name="subject"
                    type="text"
                    required
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Participant IDs
                  <input
                    name="participants"
                    type="text"
                    placeholder="123, 456"
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Channel
                  <select
                    name="channelType"
                    defaultValue="direct"
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <option value="direct">Direct</option>
                    <option value="project">Project</option>
                    <option value="contract">Contract</option>
                    <option value="group">Group</option>
                    <option value="support">Support</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  First message
                  <textarea
                    name="body"
                    rows={4}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Metadata
                  <textarea
                    name="metadata"
                    rows={3}
                    placeholder='{ "ticket": 42 }'
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </label>
                {formError ? <p className="text-sm text-rose-500">{formError}</p> : null}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-accent hover:text-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

function FilterDrawer() {
  const {
    state: { drawers, filters },
    actions: { toggleDrawer, setFilters },
  } = useInbox();

  return (
    <Transition show={drawers.filters} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={() => toggleDrawer('filters', false)}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="w-screen max-w-md bg-white px-6 py-8 shadow-xl">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Filters</Dialog.Title>
                <button
                  type="button"
                  onClick={() => toggleDrawer('filters', false)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-accent hover:text-accent"
                >
                  Close
                </button>
              </div>
              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Search</p>
                  <input
                    type="search"
                    value={filters.search}
                    onChange={(event) => setFilters({ search: event.target.value })}
                    placeholder="Search"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Channel</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {['all', 'direct', 'project', 'contract', 'group', 'support'].map((channel) => (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => setFilters({ channel })}
                        className={classNames(
                          'rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold transition',
                          filters.channel === channel
                            ? 'border-accent text-accent shadow-soft'
                            : 'text-slate-600 hover:border-accent hover:text-accent',
                        )}
                      >
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setFilters({ search: '', channel: 'all', unreadOnly: false, view: 'all' })}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-accent hover:text-accent"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

function InboxWorkspaceInner() {
  return (
    <div className="flex h-full min-h-[680px] flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold text-slate-900">Inbox</p>
          <p className="mt-1 text-sm text-slate-500">Organize conversations, support, and calls in one full-width view.</p>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[22rem,minmax(0,1fr)] xl:grid-cols-[22rem,minmax(0,1fr)] 2xl:grid-cols-[22rem,1fr]">
        <aside className="h-[calc(100vh-320px)] rounded-3xl bg-slate-50 p-5 shadow-inner">
          <ThreadColumn />
        </aside>
        <main className="h-[calc(100vh-320px)] rounded-3xl bg-slate-50 p-5 shadow-inner">
          <ConversationColumn />
        </main>
      </div>
      <FilterDrawer />
    </div>
  );
}

export default function DashboardInboxWorkspace() {
  return (
    <InboxProvider>
      <InboxWorkspaceInner />
    </InboxProvider>
  );
}
