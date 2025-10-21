import { Link } from 'react-router-dom';
import useSession from '../../hooks/useSession.js';

const highlights = [
  {
    title: 'Inbox & calls',
    description: 'Start voice or video from any thread without breaking flow.',
    emoji: '✅',
    accent: 'bg-accent',
    halo: 'bg-accent/20',
    label: 'Inbox ready checkmark',
  },
  {
    title: 'Shared files & transcripts',
    description: 'Keep every attachment and AI summary organised alongside the conversation.',
    emoji: '📎',
    accent: 'bg-amber-500',
    halo: 'bg-amber-400/30',
    label: 'Pinned file icon',
  },
  {
    title: 'Community feed reactions',
    description: 'Celebrate wins together with emoji bursts that travel back into the inbox.',
    emoji: '🎉',
    accent: 'bg-rose-500',
    halo: 'bg-rose-400/30',
    label: 'Celebration icon',
  },
];

function AnimatedBadge({ emoji, accent, halo, label }) {
  return (
    <span className="relative inline-flex h-12 w-12 items-center justify-center">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${halo}`} aria-hidden="true" />
      <span
        className={`relative inline-flex h-12 w-12 items-center justify-center rounded-full text-xl text-white shadow-soft ${accent}`}
        aria-hidden="true"
      >
        {emoji}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function CollaborationToolkitSection() {
  const { isAuthenticated } = useSession();

  const inboxCta = isAuthenticated
    ? { to: '/inbox', label: 'Open inbox', description: 'Jump back into your latest conversations.' }
    : {
        to: '/login',
        state: { redirectTo: '/inbox' },
        label: 'Sign in to open inbox',
        description: "We'll take you straight to your workspace after you sign in.",
      };

  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 lg:flex-row lg:items-center lg:gap-24">
        <div className="w-full lg:max-w-xl">
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-accent/20 via-white to-white blur-xl" aria-hidden="true" />
            <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-8 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Unified inbox</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">Product Launch Hub</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">AL</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-600">SK</span>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-soft"
                  >
                    Join call
                  </button>
                </div>
              </header>
              <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-5 px-8 py-10 text-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">JD</div>
                <div>
                  <p className="font-semibold text-slate-900">Jordan Diaz</p>
                  <p className="mt-1 text-slate-600">
                    Mockups uploaded to the shared folder — transcript is ready if you want the highlights.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium">
                      <span className="text-accent">📎</span> pitch-deck-v3.pdf
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium">
                      <span className="text-emerald-500">AI</span> Summary ready
                    </span>
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-600">ME</div>
                <div>
                  <p className="font-semibold text-slate-900">Mia Edwards</p>
                  <p className="mt-1 text-slate-600">
                    Community reactions are rolling in — let’s sync with support to send quick thank you notes.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-500">
                    <span>🎉</span>
                    <span>16 applause</span>
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-600">SK</div>
                <div>
                  <p className="font-semibold text-slate-900">Sahil Kapoor</p>
                  <p className="mt-1 text-slate-600">Going live in 20 minutes — starting a call so we can do final checks together.</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-semibold">
                      <span role="img" aria-label="phone">
                        📞
                      </span>
                      Ringing team
                    </span>
                    <span>00:12</span>
                  </div>
                </div>
              </div>
              <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-8 py-5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  Live collaboration enabled
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-accent">
                  <button type="button" className="inline-flex items-center gap-1 rounded-full border border-accent/20 px-3 py-1">
                    <span aria-hidden="true">✨</span>
                    Share highlight
                  </button>
                  <button type="button" className="inline-flex items-center gap-1 rounded-full border border-accent/20 px-3 py-1">
                    <span aria-hidden="true">🗂️</span>
                    View files
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </div>
        <div className="w-full max-w-xl space-y-12">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              Collaboration toolkit
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Keep every inbox thread ready for the next big moment
            </h2>
            <p className="text-lg text-slate-600">
              Gigvora links your inbox, call stack, and community signals so every follow-up lands right when it matters.
            </p>
          </div>
          <div className="space-y-6">
            {highlights.map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
                <AnimatedBadge emoji={item.emoji} accent={item.accent} halo={item.halo} label={item.label} />
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to={inboxCta.to}
              state={inboxCta.state}
              className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3 text-base font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark"
            >
              {inboxCta.label}
            </Link>
            <Link
              to="/tour/collaboration"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-7 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Explore the tour
            </Link>
          </div>
          {!isAuthenticated && (
            <p className="text-sm text-slate-500">
              {inboxCta.description ?? "Sign in to continue where you left off."}
            </p>
          )}
          {isAuthenticated && (
            <p className="text-sm text-slate-500">{inboxCta.description}</p>
          )}
        </div>
      </div>
    </section>
  );
}
