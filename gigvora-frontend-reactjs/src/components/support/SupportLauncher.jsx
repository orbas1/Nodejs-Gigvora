import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { PaperAirplaneIcon, ChatBubbleBottomCenterTextIcon, XMarkIcon, LifebuoyIcon } from '@heroicons/react/24/outline';
import useLocalCollection from '../../hooks/useLocalCollection.js';
import randomId from '../../utils/randomId.js';
import { formatRelativeTime } from '../../utils/date.js';

const SUPPORT_CONTACTS = [
  {
    id: 'contact-helena',
    name: 'Helena Morris',
    role: 'Community success',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 'contact-mentor-guild',
    name: 'Mentor Guild Lounge',
    role: 'Group chat',
    avatar: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 'contact-ops-pod',
    name: 'Ops pod · Volunteer missions',
    role: 'Squad',
    avatar: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 'contact-aria',
    name: 'Aria Bennett',
    role: 'Product lead',
    avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=80&q=80',
  },
];

const SEED_CONVERSATIONS = SUPPORT_CONTACTS.map((contact, index) => ({
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
      <img src={contact.avatar} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
        <p className="text-xs text-slate-500">{contact.role}</p>
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
  const { items: conversations, updateItem, createItem } = useLocalCollection('support-conversations-v1', {
    seed: SEED_CONVERSATIONS,
  });
  const [open, setOpen] = useState(false);
  const [activeContactId, setActiveContactId] = useState(SUPPORT_CONTACTS[0]?.id ?? null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('chat');

  const activeConversation = useMemo(() => {
    const existing = conversations.find((conversation) => conversation.id === activeContactId);
    if (existing) {
      return existing;
    }
    const contact = SUPPORT_CONTACTS.find((candidate) => candidate.id === activeContactId);
    if (!contact) {
      return null;
    }
    const created = createItem({ id: contact.id, metadata: contact, messages: [] });
    return created;
  }, [activeContactId, conversations, createItem]);

  const filteredContacts = useMemo(() => {
    return SUPPORT_CONTACTS.filter((contact) => {
      const haystack = `${contact.name} ${contact.role}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [search]);

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

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
      {open ? (
        <div className="w-[360px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 py-3 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Gigvora support</p>
              <p className="text-sm font-semibold">How can we help?</p>
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
              onClick={() => setActiveTab('chat')}
              className={classNames(
                'flex-1 px-4 py-3 text-sm font-semibold transition',
                activeTab === 'chat' ? 'text-accent border-b-2 border-accent' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Community chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('help')}
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
                Explore step-by-step guides, onboarding wizards, and release notes in the Gigvora help centre. The help desk is
                powered by Chatwoot and staffed 24/7.
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
                <p className="font-semibold text-slate-700">Chatwoot workspace</p>
                <p className="mt-2">
                  For live agents, ping us via the help centre chat bubble — you will be routed to the right queue instantly.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-[420px] divide-x divide-slate-200">
              <div className="flex w-40 flex-col border-r border-slate-200">
                <div className="p-3">
                  <input
                    type="search"
                    placeholder="Search contacts"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
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
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-1 flex-col">
                <div className="border-b border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">{activeConversation?.metadata?.name ?? 'Support'}</p>
                  <p className="text-xs text-slate-500">{activeConversation?.metadata?.role ?? 'Gigvora crew'}</p>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
                  {(activeConversation?.messages ?? []).map((entry) => (
                    <MessageBubble key={entry.id} message={entry} />
                  ))}
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
            </div>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex items-center gap-3 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:bg-slate-800"
      >
        <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
        Support
      </button>
    </div>
  );
}

SupportLauncher.propTypes = {
  replyDelayMs: PropTypes.number,
};
