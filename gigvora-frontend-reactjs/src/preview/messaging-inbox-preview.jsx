import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import MessagingWorkspace from '../components/messaging/MessagingWorkspace.jsx';

const now = Date.now();

const SAMPLE_THREADS = [
  {
    id: 'archie-white',
    title: 'Archie White',
    role: 'Partnerships Lead',
    company: 'Vecta Search',
    location: 'London, UK',
    meta: 'Partnerships · Vecta Search',
    preview: 'Thanks for connecting. I’m supporting a private equity-backed client…',
    unread: true,
    starred: true,
    lastActivityAt: new Date(now - 12 * 60 * 1000).toISOString(),
    avatarUrl: 'https://i.pravatar.cc/128?img=56',
    participants: [
      { id: 'archie-white', name: 'Archie White', avatarUrl: 'https://i.pravatar.cc/128?img=56' },
      { id: 'you', name: 'You', avatarUrl: 'https://i.pravatar.cc/128?img=1' },
    ],
    messages: [
      {
        id: 'msg-1',
        body: 'Thanks for connecting. I’m supporting a private equity-backed client who needs a chartered corporate admin lead.',
        author: { id: 'archie-white', name: 'Archie White', avatarUrl: 'https://i.pravatar.cc/128?img=56' },
        createdAt: new Date(now - 55 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-2',
        body: 'Your background in family office compliance really stood out. Would you be free this afternoon for a quick intro call?',
        author: { id: 'archie-white', name: 'Archie White', avatarUrl: 'https://i.pravatar.cc/128?img=56' },
        createdAt: new Date(now - 12 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'jamila-thomas',
    title: 'Jamila Thomas',
    role: 'Talent Partner',
    company: 'Blackriver Group',
    location: 'Manchester, UK',
    meta: 'Talent Partner · Blackriver Group',
    preview: 'We just met with the founders and they loved your deck! When could you walk them through the metrics?',
    unread: false,
    starred: false,
    lastActivityAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://i.pravatar.cc/128?img=33',
    participants: [
      { id: 'jamila-thomas', name: 'Jamila Thomas', avatarUrl: 'https://i.pravatar.cc/128?img=33' },
      { id: 'you', name: 'You', avatarUrl: 'https://i.pravatar.cc/128?img=1' },
    ],
    messages: [
      {
        id: 'msg-3',
        body: 'We just met with the founders and they loved your deck! When could you walk them through the metrics?',
        author: { id: 'jamila-thomas', name: 'Jamila Thomas', avatarUrl: 'https://i.pravatar.cc/128?img=33' },
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-4',
        body: 'Amazing! Happy to host a session tomorrow afternoon if that works for them.',
        author: { id: 'you', name: 'You', avatarUrl: 'https://i.pravatar.cc/128?img=1' },
        createdAt: new Date(now - 95 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'muhammad-amjad',
    title: 'Muhammad Amjad',
    role: 'Hiring Lead',
    company: 'Bluecrest Retail',
    location: 'Dubai, UAE',
    meta: 'Hiring Lead · Bluecrest Retail',
    preview: 'The team reviewed your case study and we’d love a follow-up on automation ROI next week.',
    unread: true,
    starred: false,
    lastActivityAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://i.pravatar.cc/128?img=14',
    participants: [
      { id: 'muhammad-amjad', name: 'Muhammad Amjad', avatarUrl: 'https://i.pravatar.cc/128?img=14' },
      { id: 'you', name: 'You', avatarUrl: 'https://i.pravatar.cc/128?img=1' },
    ],
    messages: [
      {
        id: 'msg-5',
        body: 'The team reviewed your case study and we’d love a follow-up on automation ROI next week.',
        author: { id: 'muhammad-amjad', name: 'Muhammad Amjad', avatarUrl: 'https://i.pravatar.cc/128?img=14' },
        createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'bradley-goldberg',
    title: 'Bradley Goldberg',
    role: 'Investor',
    company: 'Northline Ventures',
    location: 'New York, USA',
    meta: 'Investor · Northline Ventures',
    preview: 'Really enjoyed your keynote at FutureWorks. Let’s sync about the AI advisory you mentioned.',
    unread: false,
    starred: true,
    lastActivityAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://i.pravatar.cc/128?img=22',
    participants: [
      { id: 'bradley-goldberg', name: 'Bradley Goldberg', avatarUrl: 'https://i.pravatar.cc/128?img=22' },
      { id: 'you', name: 'You', avatarUrl: 'https://i.pravatar.cc/128?img=1' },
    ],
    messages: [
      {
        id: 'msg-6',
        body: 'Really enjoyed your keynote at FutureWorks. Let’s sync about the AI advisory you mentioned.',
        author: { id: 'bradley-goldberg', name: 'Bradley Goldberg', avatarUrl: 'https://i.pravatar.cc/128?img=22' },
        createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-7',
        body: 'Appreciate it! How does Thursday morning look on your side?',
        author: { id: 'you', name: 'You', avatarUrl: 'https://i.pravatar.cc/128?img=1' },
        createdAt: new Date(now - 25 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

export default function MessagingInboxPreview({ initialThreads }) {
  const seedThreads = useMemo(
    () => (Array.isArray(initialThreads) && initialThreads.length ? initialThreads : SAMPLE_THREADS),
    [initialThreads],
  );
  const [threads, setThreads] = useState(seedThreads);
  const [selectedThreadId, setSelectedThreadId] = useState(seedThreads[0].id);

  const handleSelect = (threadId) => setSelectedThreadId(threadId);

  const handleSend = (threadId, body) =>
    new Promise((resolve) => {
      setThreads((current) =>
        current.map((thread) => {
          if (`${thread.id}` !== `${threadId}`) {
            return thread;
          }

          const message = {
            id: `${threadId}-${Date.now()}`,
            body,
            createdAt: new Date().toISOString(),
            author: { id: 'you', name: 'You', avatarUrl: 'https://i.pravatar.cc/128?img=1' },
          };

          return {
            ...thread,
            unread: false,
            preview: body,
            lastActivityAt: message.createdAt,
            messages: [...(thread.messages ?? []), message],
          };
        }),
      );

      window.setTimeout(resolve, 300);
    });

  return (
    <div className="min-h-screen w-full bg-slate-50 px-6 py-10">
      <MessagingWorkspace
        actorId="you"
        threads={threads}
        onSelectThread={handleSelect}
        selectedThreadId={selectedThreadId}
        onSendMessage={handleSend}
      />
    </div>
  );
}

MessagingInboxPreview.propTypes = {
  initialThreads: PropTypes.arrayOf(PropTypes.object),
};

MessagingInboxPreview.defaultProps = {
  initialThreads: undefined,
};

export const MESSAGING_INBOX_SAMPLE_THREADS = SAMPLE_THREADS;
