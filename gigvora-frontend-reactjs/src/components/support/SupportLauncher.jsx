import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  PaperAirplaneIcon,
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  LifebuoyIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import useLocalCollection from '../../hooks/useLocalCollection.js';
import randomId from '../../utils/randomId.js';
import { formatRelativeTime } from '../../utils/date.js';
import useSession from '../../hooks/useSession.js';
import { resolveActorId } from '../../utils/messaging.js';
import { getSupportDeskSnapshot } from '../../services/supportDesk.js';

const GRADIENTS = [
  'from-indigo-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-orange-500',
  'from-sky-500 to-blue-600',
  'from-amber-500 to-yellow-500',
  'from-violet-500 to-fuchsia-500',
];

const FALLBACK_CONTACTS = [
  {
    id: 'contact-helena',
    name: 'Helena Morris',
    role: 'Community success',
    status: 'online',
  },
  {
    id: 'contact-mentor-guild',
    name: 'Mentor Guild Lounge',
    role: 'Group chat',
    status: 'online',
  },
  {
    id: 'contact-ops-pod',
    name: 'Ops pod · Volunteer missions',
    role: 'Squad',
    status: 'away',
  },
  {
    id: 'contact-aria',
    name: 'Aria Bennett',
    role: 'Product lead',
    status: 'offline',
  },
];

const SEED_CONVERSATIONS = FALLBACK_CONTACTS.map((contact, index) => ({
  id: contact.id,
  metadata: contact,
  messages: [
    {
      id: randomId('message'),
      author: contact.name,
      direction: 'incoming',
      body:
        index === 0
          ? 'Hey! I can help you triage anything around memberships, onboarding, or product support. Tap the help centre for guides.'
          : index === 1
            ? 'Welcome to the mentor guild lounge. Share wins, ask for templates, and we will connect you with the right operator.'
            : index === 2
              ? 'Ops pod here – updates on volunteer missions drop here daily. Let us know where you want to deploy next.'
              : 'Need eyes on the latest release? Happy to walk through dashboards or roadmap questions.',
      createdAt: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString(),
    },
  ],
}));

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function hashString(value) {
  if (!value) {
    return 0;
  }
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function computeInitials(name) {
  if (!name) {
    return '?';
  }
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) {
    return '?';
  }
  return parts
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('');
}

function normaliseStatus(status) {
  if (!status) {
    return null;
  }
  const value = `${status}`.toLowerCase();
  if (['online', 'available', 'active', 'present'].includes(value)) {
    return 'online';
  }
  if (['away', 'busy', 'dnd', 'engaged'].includes(value)) {
    return 'away';
  }
  if (['offline', 'unavailable'].includes(value)) {
    return 'offline';
  }
  return null;
}

function mapCaseStatusToPresence(status) {
  const token = status ? `${status}`.trim().toLowerCase() : '';
  if (!token) {
    return 'away';
  }
  if (['online', 'away', 'offline'].includes(token)) {
    return token;
  }
  if (['available', 'active', 'present'].includes(token)) {
    return 'online';
  }
  if (['triage', 'in_progress', 'open', 'assigned', 'escalated'].includes(token)) {
    return 'online';
  }
  if (['waiting_on_customer', 'pending', 'queued', 'paused'].includes(token)) {
    return 'away';
  }
  if (['resolved', 'closed', 'completed'].includes(token)) {
    return 'offline';
  }
  return 'away';
}

function decorateContact(contact) {
  const seed = contact?.id ?? contact?.email ?? contact?.name ?? randomId('contact');
  const gradientIndex = Math.abs(hashString(seed)) % GRADIENTS.length;
  const gradient = GRADIENTS[gradientIndex];
  const initials = contact?.initials ?? computeInitials(contact?.name ?? seed);
  const status =
    normaliseStatus(contact?.status) ??
    normaliseStatus(contact?.availability) ??
    (contact?.isOnline ? 'online' : contact?.isAway ? 'away' : null);

  const caseIds = Array.isArray(contact?.caseIds)
    ? Array.from(new Set(contact.caseIds.filter(Boolean)))
    : [];
  const caseId = contact?.caseId ?? (caseIds.length ? caseIds[0] : null);
  const reason = contact?.reason ?? contact?.metadata?.reason ?? null;
  const priority = contact?.priority ?? contact?.metadata?.priority ?? null;
  const lastActiveAt = contact?.lastActiveAt ?? contact?.lastMessageAt ?? contact?.updatedAt ?? null;

  return {
    id: contact?.id ?? seed,
    name: contact?.name ?? 'Support',
    role: contact?.role ?? contact?.title ?? 'Support specialist',
    status: status ?? 'offline',
    gradient,
    initials,
    email: contact?.email ?? null,
    caseId,
    caseIds,
    threadId: contact?.threadId ?? null,
    reason,
    priority,
    lastActiveAt,
  };
}

function ContactAvatar({ contact }) {
  return (
    <div
      className={classNames(
        'relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-xs font-semibold uppercase text-white shadow-inner',
        `bg-gradient-to-br ${contact.gradient}`,
      )}
      aria-hidden="true"
    >
      {contact.initials}
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) {
    return null;
  }
  const label = status === 'online' ? 'Online' : status === 'away' ? 'Away' : 'Offline';
  const tone =
    status === 'online'
      ? 'text-emerald-600'
      : status === 'away'
        ? 'text-amber-600'
        : 'text-slate-400';
  const dot =
    status === 'online'
      ? 'bg-emerald-400 animate-pulse'
      : status === 'away'
        ? 'bg-amber-400'
        : 'bg-slate-400';
  return (
    <span className={classNames('inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wide', tone)}>
      <span className={classNames('h-2 w-2 rounded-full', dot)} />
      {label}
    </span>
  );
}

function ContactItem({ contact, active, unreadCount, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(contact.id)}
      className={classNames(
        'flex w-full items-center gap-3 rounded-3xl border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        active ? 'border-accent bg-accentSoft/70 shadow-soft' : 'border-slate-200 bg-white hover:border-accent/50 hover:shadow',
      )}
    >
      <ContactAvatar contact={contact} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
        <p className="text-xs text-slate-500">{contact.reason ?? contact.role}</p>
        <StatusBadge status={contact.status} />
      </div>
      {unreadCount ? (
        <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-rose-500 px-2 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
          {unreadCount}
        </span>
      ) : null}
    </button>
  );
}

function MessageBubble({ message }) {
  const outgoing = message.direction === 'outgoing';
  return (
    <div
      className={classNames(
        'max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm',
        outgoing
          ? 'self-end rounded-br-sm bg-accent text-white'
          : 'self-start rounded-bl-sm border border-slate-200 bg-white text-slate-700',
      )}
    >
      <p>{message.body}</p>
      <p className={classNames('mt-1 text-[0.65rem]', outgoing ? 'text-white/80' : 'text-slate-400')}>
        {message.author} · {formatRelativeTime(message.createdAt)}
      </p>
    </div>
  );
}

export default function SupportLauncher({ replyDelayMs = 1200 }) {
  const { session, isAuthenticated } = useSession();
  const actorId = resolveActorId(session);
  const { items: conversations, updateItem, createItem } = useLocalCollection('support-conversations-v1', {
    seed: SEED_CONVERSATIONS,
  });
  const [supportState, setSupportState] = useState({
    loading: false,
    error: null,
    contacts: FALLBACK_CONTACTS.map((contact) => decorateContact(contact)),
    knowledgeBase: [],
    metrics: null,
    cases: [],
    lastUpdated: null,
  });
  const [open, setOpen] = useState(false);
  const [activeContactId, setActiveContactId] = useState(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [panelView, setPanelView] = useState('list');
  const conversationMapRef = useRef(new Map());
  const pendingRequestRef = useRef(null);

  const loadSupportSnapshot = useCallback(
    async ({ forceRefresh = false } = {}) => {
      if (!isAuthenticated || !actorId) {
        return;
      }
      if (pendingRequestRef.current) {
        pendingRequestRef.current.abort();
      }
      const controller = new AbortController();
      pendingRequestRef.current = controller;

      setSupportState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const result = await getSupportDeskSnapshot(actorId, {
          forceRefresh,
          signal: controller.signal,
        });
        const snapshot = result?.data ?? {};
        const contactsSource =
          snapshot?.contacts ?? snapshot?.agents ?? snapshot?.supportContacts ?? snapshot?.team ?? [];
        const initialContacts = Array.isArray(contactsSource) ? contactsSource : [];
        const contactMap = new Map();
        const appendContact = (contact) => {
          if (!contact) {
            return;
          }
          const identifier = contact.id ?? contact.email ?? contact.threadId ?? null;
          if (!identifier) {
            return;
          }
          const existing = contactMap.get(identifier);
          const mergedCaseIds = new Set([...(existing?.caseIds ?? []), contact.caseId, ...(contact.caseIds ?? [])].filter(Boolean));
          contactMap.set(identifier, {
            ...existing,
            ...contact,
            id: identifier,
            caseIds: mergedCaseIds.size ? Array.from(mergedCaseIds) : existing?.caseIds ?? [],
            lastActiveAt: contact.lastActiveAt ?? contact.lastMessageAt ?? contact.updatedAt ?? existing?.lastActiveAt ?? null,
          });
        };

        initialContacts.forEach((contact) => appendContact(contact));

        const supportCases = Array.isArray(snapshot?.supportCases) ? snapshot.supportCases : [];
        const caseConversations = [];

        supportCases.forEach((supportCase) => {
          const contactId = supportCase.threadId ? `support-case-${supportCase.threadId}` : `support-case-${supportCase.id}`;
          const assignedAgent = supportCase.assignedAgent ?? null;
          const nameFromAgent = assignedAgent
            ? assignedAgent.name ??
              [assignedAgent.firstName, assignedAgent.lastName].filter(Boolean).join(' ').trim()
            : null;
          const contactName = nameFromAgent || supportCase.reason || 'Support desk';
          appendContact({
            id: contactId,
            name: contactName,
            role: assignedAgent ? 'Support specialist' : 'Support desk',
            status: mapCaseStatusToPresence(supportCase.status),
            caseId: supportCase.id ?? null,
            threadId: supportCase.threadId ?? null,
            email: assignedAgent?.email ?? null,
            reason: supportCase.reason ?? null,
            priority: supportCase.priority ?? null,
            caseIds: [supportCase.id].filter(Boolean),
          });

          const transcript = Array.isArray(supportCase.transcript) ? supportCase.transcript : [];
          const messages = transcript
            .map((entry) => {
              const senderId = entry.sender?.id ?? entry.senderId ?? null;
              const actorMatches = actorId && senderId != null && `${senderId}` === `${actorId}`;
              const outgoing = entry.sender?.isFreelancer || actorMatches;
              const author = outgoing
                ? 'You'
                : entry.sender?.name || nameFromAgent || 'Support specialist';
              const createdAt = entry.createdAt ?? entry.deliveredAt ?? new Date().toISOString();
              const body = entry.body ?? entry.metadata?.note ?? '';
              const trimmed = `${body}`.trim();
              if (!trimmed) {
                return null;
              }
              return {
                id: entry.id ?? randomId('support-message'),
                author,
                direction: outgoing ? 'outgoing' : 'incoming',
                body: trimmed,
                createdAt,
              };
            })
            .filter(Boolean)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          caseConversations.push({
            id: contactId,
            metadata: {
              contactId,
              caseId: supportCase.id ?? null,
              threadId: supportCase.threadId ?? null,
              status: supportCase.status ?? null,
              priority: supportCase.priority ?? null,
              reason: supportCase.reason ?? null,
            },
            messages,
          });
        });

        if (!contactMap.has('support-desk')) {
          appendContact({
            id: 'support-desk',
            name: 'Support command centre',
            role: 'Operations desk',
            status: snapshot?.metrics?.openSupportCases > 0 ? 'online' : 'away',
            lastActiveAt: snapshot?.metrics?.refreshedAt ?? new Date().toISOString(),
          });
        }

        caseConversations.forEach((conversation) => {
          const existing = conversationMapRef.current.get(conversation.id);
          if (existing) {
            updateItem(conversation.id, (current) => {
              const existingMessages = new Map(
                (current.messages ?? []).map((message) => [message.id, message]),
              );
              conversation.messages.forEach((message) => {
                if (existingMessages.has(message.id)) {
                  existingMessages.set(message.id, {
                    ...existingMessages.get(message.id),
                    ...message,
                  });
                } else {
                  existingMessages.set(message.id, message);
                }
              });
              const mergedMessages = Array.from(existingMessages.values()).sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
              );
              return {
                ...current,
                metadata: { ...(current.metadata ?? {}), ...conversation.metadata },
                messages: mergedMessages,
              };
            });
          } else {
            const created = createItem({
              id: conversation.id,
              metadata: conversation.metadata,
              messages: conversation.messages,
            });
            conversationMapRef.current.set(created.id, created);
          }
        });

        const knowledgeBase = Array.isArray(snapshot?.knowledgeBase) ? snapshot.knowledgeBase : [];
        const decoratedContacts = contactMap.size
          ? Array.from(contactMap.values())
              .map((contact) => decorateContact(contact))
              .sort((a, b) => {
                const statusRank = { online: 0, away: 1, offline: 2 };
                const rankA = statusRank[a.status] ?? 3;
                const rankB = statusRank[b.status] ?? 3;
                if (rankA !== rankB) {
                  return rankA - rankB;
                }
                const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
                const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
                if (timeA !== timeB) {
                  return timeB - timeA;
                }
                return (a.name ?? '').localeCompare(b.name ?? '');
              })
          : FALLBACK_CONTACTS.map((contact) => decorateContact(contact));

        if (!controller.signal.aborted) {
          setSupportState({
            loading: false,
            error: null,
            contacts: decoratedContacts,
            knowledgeBase,
            metrics: snapshot?.metrics ?? null,
            cases: supportCases,
            lastUpdated: result?.cachedAt ? new Date(result.cachedAt) : new Date(),
          });
        }
      } catch (error) {
        if (!pendingRequestRef.current || pendingRequestRef.current === controller) {
          if (controller.signal.aborted || error?.name === 'AbortError') {
            return;
          }
          const fallbackContacts = FALLBACK_CONTACTS.map((contact) => decorateContact(contact));
          setSupportState({
            loading: false,
            error: error?.message ?? 'Unable to load support snapshot.',
            contacts: fallbackContacts,
            knowledgeBase: [],
            metrics: null,
            cases: [],
            lastUpdated: null,
          });
        }
      } finally {
        if (pendingRequestRef.current === controller) {
          pendingRequestRef.current = null;
        }
      }
    },
    [actorId, isAuthenticated],
  );

  useEffect(() => {
    if (!open) {
      setPanelView('list');
    }
  }, [open]);

  useEffect(() => {
    if (!isAuthenticated || !actorId) {
      return;
    }
    loadSupportSnapshot();
  }, [actorId, isAuthenticated, loadSupportSnapshot]);

  useEffect(
    () => () => {
      if (pendingRequestRef.current) {
        pendingRequestRef.current.abort();
        pendingRequestRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    conversationMapRef.current = new Map(
      conversations.map((conversation) => [conversation.id, conversation]),
    );
  }, [conversations]);

  useEffect(() => {
    if (!supportState.contacts.length) {
      return;
    }
    const updates = supportState.contacts.map((contact) => ({ id: contact.id, metadata: contact }));
    // upsert contact metadata without disturbing existing conversation history
    conversations.forEach((conversation) => {
      const match = updates.find((candidate) => candidate.id === conversation.id);
      if (match) {
        const existingMetadata = conversation.metadata ?? {};
        const nextMetadata = { ...existingMetadata, ...(match.metadata ?? {}) };
        const hasDifference = Object.keys(match.metadata ?? {}).some(
          (key) => existingMetadata[key] !== match.metadata[key],
        );
        if (hasDifference) {
          updateItem(conversation.id, (existing) => ({ ...existing, metadata: nextMetadata }));
        }
      }
    });
    updates.forEach((contact) => {
      const exists = conversations.some((conversation) => conversation.id === contact.id);
      if (!exists) {
        createItem({ id: contact.id, metadata: contact.metadata ?? contact, messages: [] });
      }
    });
  }, [supportState.contacts, conversations, createItem, updateItem]);

  const activeConversation = useMemo(() => {
    const existing = conversations.find((conversation) => conversation.id === activeContactId);
    if (existing) {
      return existing;
    }
    const contact = supportState.contacts.find((candidate) => candidate.id === activeContactId);
    if (!contact) {
      return null;
    }
    const created = createItem({ id: contact.id, metadata: contact, messages: [] });
    conversationMapRef.current.set(created.id, created);
    return created;
  }, [activeContactId, conversations, createItem, supportState.contacts]);

  const filteredContacts = useMemo(() => {
    const needle = search.toLowerCase().trim();
    if (!needle) {
      return supportState.contacts;
    }
    return supportState.contacts.filter((contact) => {
      const haystack = `${contact.name ?? ''} ${contact.role ?? ''} ${contact.reason ?? ''} ${contact.status ?? ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [search, supportState.contacts]);

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!activeConversation || !message.trim()) {
      return;
    }
    const payload = {
      id: randomId('support-message'),
      author: 'You',
      direction: 'outgoing',
      body: message.trim(),
      createdAt: new Date().toISOString(),
    };
    updateItem(activeConversation.id, (existing) => ({
      ...existing,
      messages: [...(existing.messages ?? []), payload],
    }));
    setMessage('');
    setTimeout(() => {
      updateItem(activeConversation.id, (existing) => ({
        ...existing,
        messages: [
          ...(existing.messages ?? []),
          {
            id: randomId('support-reply'),
            author: existing.metadata?.name ?? 'Support',
            direction: 'incoming',
            body: 'Thanks for the ping — we will follow up shortly or you can jump into the help centre for instant guides.',
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    }, Math.max(0, replyDelayMs));
  };

  const headerLabel = activeTab === 'help' ? 'Gigvora support' : 'Inbox';
  const headerSubtitle = activeTab === 'help' ? 'How can we help?' : 'Messages & updates';

  const knowledgeBase = supportState.knowledgeBase.slice(0, 3);
  const activeMetadata = activeConversation?.metadata ?? {};
  const activeContact = activeConversation
    ? supportState.contacts.find((contact) => contact.id === activeConversation.id)
    : null;
  const headerStatusSource = activeMetadata.status ?? activeContact?.status ?? null;
  const headerStatus = headerStatusSource ? mapCaseStatusToPresence(headerStatusSource) : null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4 max-sm:inset-0 max-sm:bottom-0 max-sm:right-0 max-sm:p-4">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 -z-[1] bg-slate-900/30 backdrop-blur-sm sm:hidden"
          aria-label="Close support overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}
      {open ? (
        <div className="w-[360px] max-w-[min(100vw-2rem,420px)] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl max-sm:mx-auto max-sm:h-full max-sm:w-full max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:bg-white max-sm:shadow-none">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 py-3 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{headerLabel}</p>
              <p className="text-sm font-semibold">{headerSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            >
              <XMarkIcon className="h-5 w-5" />
              <span className="sr-only">Close support panel</span>
            </button>
          </div>
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('chat');
                setPanelView(activeContactId ? 'conversation' : 'list');
              }}
              className={classNames(
                'flex-1 px-4 py-3 text-sm font-semibold transition',
                activeTab === 'chat' ? 'text-accent border-b-2 border-accent' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Inbox
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('help');
                setPanelView('list');
              }}
              className={classNames(
                'flex-1 px-4 py-3 text-sm font-semibold transition',
                activeTab === 'help' ? 'text-accent border-b-2 border-accent' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Help centre
            </button>
          </div>

          {activeTab === 'help' ? (
            <div className="space-y-4 px-4 py-5 text-sm text-slate-600">
              <p>
                Explore step-by-step guides, onboarding wizards, and release notes in the Gigvora help centre. Live agents take
                over as soon as you launch a conversation.
              </p>
              <a
                href="https://support.edulure.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                <LifebuoyIcon className="h-4 w-4" /> Visit help centre ↗
              </a>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Human support coverage</p>
                <p className="mt-2">
                  Our live desk routes every ticket to the right team instantly — operations, finance, and community each watch
                  their own queue 24/7.
                </p>
                {supportState.error ? (
                  <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-[0.7rem] font-semibold text-rose-600">
                    {supportState.error}
                  </p>
                ) : null}
                {supportState.loading ? (
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="h-4 w-full rounded-full bg-slate-200" />
                    ))}
                  </div>
                ) : null}
                {!supportState.loading && knowledgeBase.length ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                      Knowledge base spotlights
                    </p>
                    <ul className="space-y-2 text-[0.7rem]">
                      {knowledgeBase.map((article) => (
                        <li
                          key={article.id ?? article.slug ?? article.title}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-600"
                        >
                          <p className="font-semibold text-slate-800">{article.title}</p>
                          {article.summary ? <p className="mt-1 text-[0.65rem] text-slate-500">{article.summary}</p> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex h-[420px] flex-col">
              {panelView === 'list' ? (
                <div className="flex h-full flex-col">
                  <div className="p-3">
                    <input
                      type="search"
                      placeholder="Search conversations"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
                    {filteredContacts.length === 0 ? (
                      <p className="px-2 text-xs text-slate-500">No conversations yet. Start one to connect with the team.</p>
                    ) : null}
                    {filteredContacts.map((contact) => {
                      const conversation = conversations.find((entry) => entry.id === contact.id);
                      const unread = conversation?.messages?.filter((msg) => msg.direction === 'incoming').length ?? 0;
                      return (
                        <ContactItem
                          key={contact.id}
                          contact={contact}
                          unreadCount={unread}
                          active={contact.id === activeContactId}
                          onSelect={(id) => {
                            setActiveContactId(id);
                            setMessage('');
                            setPanelView('conversation');
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-3 border-b border-slate-200 p-3">
                    <button
                      type="button"
                      onClick={() => setPanelView('list')}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      <span className="sr-only">Back to conversation list</span>
                    </button>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{activeConversation?.metadata?.name ?? 'Support'}</p>
                      <p className="text-xs text-slate-500">
                        {activeConversation?.metadata?.reason ?? activeConversation?.metadata?.role ?? 'Gigvora crew'}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge status={headerStatus} />
                        {activeConversation?.metadata?.priority ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-[2px] text-[0.6rem] font-semibold uppercase tracking-wide text-slate-600">
                            {activeConversation.metadata.priority}
                          </span>
                        ) : null}
                        {activeConversation?.metadata?.caseId ? (
                          <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-[2px] text-[0.6rem] font-semibold uppercase tracking-wide text-accent">
                            Case #{activeConversation.metadata.caseId}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
                    {(activeConversation?.messages ?? []).map((entry) => (
                      <MessageBubble key={entry.id} message={entry} />
                    ))}
                    {(activeConversation?.messages ?? []).length === 0 ? (
                      <p className="text-center text-xs text-slate-500">Start the conversation with a message.</p>
                    ) : null}
                  </div>
                  <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-inner">
                      <input
                        type="text"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Write a message"
                        className="flex-1 border-none bg-transparent text-sm text-slate-700 focus:outline-none"
                      />
                      <button
                        type="submit"
                        aria-label="Send message"
                        className="inline-flex items-center justify-center rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-accentDark"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl transition hover:bg-slate-800"
      >
        <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />
        <span className="sr-only">Toggle support inbox</span>
      </button>
    </div>
  );
}

SupportLauncher.propTypes = {
  replyDelayMs: PropTypes.number,
};
