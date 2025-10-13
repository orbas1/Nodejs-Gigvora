import { useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftRightIcon,
  LifebuoyIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const SAMPLE_THREADS = [
  {
    id: 'msg-1',
    sender: 'Gigvora Talent Concierge',
    preview: 'We have three product designers shortlisted for your Berlin brief. Ready to review?',
    timestamp: '2m ago',
  },
  {
    id: 'msg-2',
    sender: 'Nova Labs',
    preview: 'Approved the new milestone. Finance release scheduled for Friday.',
    timestamp: '18m ago',
  },
  {
    id: 'msg-3',
    sender: 'Atlas Studio',
    preview: 'Shared a revised scope for the experience launchpad pilot.',
    timestamp: '1h ago',
  },
];

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
        active ? 'bg-accent text-white shadow-soft' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

export default function MessagingDock() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('inbox');

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      {open ? (
        <div className="w-80 rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-400/20">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">{tab === 'inbox' ? 'Inbox' : 'Support chat'}</p>
              <p className="text-xs text-slate-500">
                {tab === 'inbox'
                  ? 'Messages sync across dashboards so nothing gets missed.'
                  : 'Switch to the dedicated support centre for full history.'}
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
            <div className="max-h-64 overflow-y-auto px-4 pb-4">
              <ul className="space-y-3">
                {SAMPLE_THREADS.map((thread) => (
                  <li key={thread.id} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:border-accent/50 hover:bg-slate-50">
                    <p className="font-semibold text-slate-800">{thread.sender}</p>
                    <p className="mt-1 text-sm text-slate-600">{thread.preview}</p>
                    <p className="mt-2 text-xs text-slate-400">{thread.timestamp}</p>
                  </li>
                ))}
              </ul>
              <a
                href="/inbox"
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-accent/30 bg-accentSoft px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-white"
              >
                Open full inbox
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="space-y-4 px-4 pb-5 text-sm text-slate-600">
              <p>
                Our support specialists respond within minutes during UK and EU hours. Start a thread here or launch the full trust &
                support centre.
              </p>
              <button
                type="button"
                onClick={() => window.open('https://support.gigvora.com', '_blank', 'noreferrer')}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                <LifebuoyIcon className="h-5 w-5" /> Visit support centre
              </button>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest tip</p>
                <p className="mt-2 text-sm text-slate-600">
                  Use Explorer alerts to monitor new jobs, gigs, and Launchpad cohorts without leaving this workspace.
                </p>
              </div>
            </div>
          )}
          <div className="border-t border-slate-200 px-4 py-3">
            <form
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2"
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                type="text"
                placeholder={tab === 'inbox' ? 'Reply…' : 'Ask a question…'}
                className="flex-1 border-none text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <button type="submit" className="rounded-full bg-accent p-2 text-white transition hover:bg-accentDark" aria-label="Send">
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="flex items-center gap-3 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5" />
        Messages
      </button>
    </div>
  );
}
