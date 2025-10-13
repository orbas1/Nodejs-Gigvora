import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';

const MOCK_THREADS = [
  {
    id: 'thread-1',
    subject: 'Design sprint sign-off',
    participants: ['Nova Labs', 'You'],
    snippet: 'The revised scope is ready for the experience launchpad cohort.',
    updatedAt: '5 minutes ago',
    unread: true,
  },
  {
    id: 'thread-2',
    subject: 'Talent shortlist',
    participants: ['Gigvora Talent Concierge'],
    snippet: 'Here are three profiles ready for interview. Let us know who to fast-track.',
    updatedAt: '34 minutes ago',
    unread: false,
  },
  {
    id: 'thread-3',
    subject: 'Volunteer mission kickoff',
    participants: ['Better Futures Collective'],
    snippet: 'Welcome aboard! Sharing the kickoff deck and onboarding steps.',
    updatedAt: '1 hour ago',
    unread: false,
  },
];

function ThreadCard({ thread, onSelect, selected }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(thread)}
      className={`w-full rounded-3xl border px-5 py-4 text-left transition ${
        selected
          ? 'border-accent bg-accentSoft shadow-soft'
          : thread.unread
          ? 'border-slate-200 bg-white shadow-sm hover:border-accent/60'
          : 'border-slate-200 bg-white hover:border-accent/60'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{thread.subject}</p>
        <span className="text-xs text-slate-400">{thread.updatedAt}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{thread.participants.join(', ')}</p>
      <p className="mt-2 text-sm text-slate-600">{thread.snippet}</p>
      {thread.unread ? (
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
  const [query, setQuery] = useState('');
  const [selectedThread, setSelectedThread] = useState(MOCK_THREADS[0]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const filteredThreads = useMemo(() => {
    if (!query.trim()) {
      return MOCK_THREADS;
    }
    const lower = query.toLowerCase();
    return MOCK_THREADS.filter(
      (thread) =>
        thread.subject.toLowerCase().includes(lower) ||
        thread.participants.some((participant) => participant.toLowerCase().includes(lower)),
    );
  }, [query]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -left-12 bottom-6 h-72 w-72 rounded-full bg-emerald-200/40 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Messaging"
          title="Centralised inbox"
          description="All conversations across jobs, gigs, projects, volunteering missions, and Experience Launchpad cohorts live here."
          actions={
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" /> New message
            </button>
          }
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(260px,0.8fr),minmax(0,2fr)]">
          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{session?.name ?? 'Gigvora member'}</p>
              <p className="text-xs text-slate-500">Inbox is mirrored on dashboards so the team stays aligned.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search conversations"
                  className="flex-1 border-none bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                <FunnelIcon className="h-4 w-4" /> Filters & labels
              </button>
            </div>
            <div className="space-y-3">
              {filteredThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  selected={selectedThread?.id === thread.id}
                  onSelect={setSelectedThread}
                />
              ))}
            </div>
          </aside>
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div>
              <p className="text-sm font-semibold text-slate-900">{selectedThread?.subject}</p>
              <p className="text-xs text-slate-500">{selectedThread?.participants.join(', ')}</p>
            </div>
            <div className="space-y-4 text-sm text-slate-600">
              <p>
                Conversations sync here from every dashboard, including freelancers, companies, agencies, and Experience Launchpad cohorts.
                Keep everything in one place while the messaging bubble gives you quick replies on any page.
              </p>
              <p>
                Attach launchpad decks, project roadmaps, gig briefs, and volunteer mission updates right from this inbox. Draft replies collaborate with your team before sending.
              </p>
            </div>
            <form className="space-y-3">
              <textarea
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Write your reply…"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                >
                  Send reply
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
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
