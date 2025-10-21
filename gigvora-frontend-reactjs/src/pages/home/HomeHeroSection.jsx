import { useEffect, useState } from 'react';
import { ArrowUpRightIcon, RocketLaunchIcon, SparklesIcon, UsersIcon } from '@heroicons/react/24/outline';

const DEFAULT_HEADLINE =
  'Freelancers, employers, agencies, mentors, volunteers, new grads & career changers, clients, and job seekers move forward together.';

const DEFAULT_SUBHEADING =
  'Gigvora syncs live briefs, launchpads, and mentoring so every contributor sees the same plan and ships at the same pace.';

const FALLBACK_KEYWORDS = [
  'Product strategy gig kicked off · Lisbon',
  'Mentorship session going live · Design Ops',
  'Launchpad demo uploaded · Creation Studio',
  'Volunteering mission matched · Impact hub',
  'Growth marketing brief approved · Remote',
  'Portfolio review starting · Career changers',
  'UX research sprint recruiting · Explorer',
  'Community co-build in progress · Web3',
];

function normaliseKeywords(keywords) {
  if (!Array.isArray(keywords)) {
    return [];
  }

  return keywords
    .map((keyword) => {
      if (!keyword) return null;
      if (typeof keyword === 'string') return keyword;
      if (typeof keyword === 'object') {
        return keyword.label ?? keyword.title ?? keyword.keyword ?? keyword.name ?? null;
      }
      return null;
    })
    .filter(Boolean);
}

export function HomeHeroSection({
  headline,
  subheading,
  keywords,
  loading = false,
  error = null,
  onClaimWorkspace,
  onBrowseOpportunities,
}) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updatePreference = (event) => {
      setReduceMotion(event.matches);
    };

    // Initialise with the current preference
    setReduceMotion(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference);
      return () => mediaQuery.removeEventListener('change', updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  const displayHeadline = error ? 'Stay tuned for what is next.' : headline ?? DEFAULT_HEADLINE;
  const displaySubheading =
    loading && !subheading
      ? 'Gathering the latest programmes…'
      : subheading ?? DEFAULT_SUBHEADING;

  const resolvedKeywords = normaliseKeywords(keywords);
  const tickerItems = resolvedKeywords.length ? resolvedKeywords : FALLBACK_KEYWORDS;
  const doubledTickerItems = [...tickerItems, ...tickerItems];
  const tickerRenderList = reduceMotion ? tickerItems : doubledTickerItems;

  const handleClaimWorkspace = () => {
    if (typeof onClaimWorkspace === 'function') {
      onClaimWorkspace();
    }
  };

  const handleBrowseOpportunities = () => {
    if (typeof onBrowseOpportunities === 'function') {
      onBrowseOpportunities();
    }
  };

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-[-10%] h-72 w-72 rounded-full bg-accent/40 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[28rem] w-[28rem] rounded-full bg-accentDark/30 blur-3xl" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" aria-hidden="true" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:flex lg:items-center lg:gap-16">
        <div className="mx-auto max-w-2xl space-y-10 text-center lg:mx-0 lg:text-left">
          <div className="space-y-6">
            <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent lg:mx-0">
              Community OS
            </span>
            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {displayHeadline}
            </h1>
            <p className="text-pretty text-base text-slate-200 sm:text-xl">{displaySubheading}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
            <button
              type="button"
              onClick={handleClaimWorkspace}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-8 py-3 text-base font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark sm:w-auto"
            >
              Claim your workspace
              <ArrowUpRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleBrowseOpportunities}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-8 py-3 text-base font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:w-auto"
            >
              Browse live opportunities
              <ArrowUpRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="relative mt-8 h-auto min-h-[3.25rem] overflow-hidden rounded-full border border-white/10 bg-white/5 sm:mt-10 sm:h-14">
            <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent" aria-hidden="true" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-slate-950 via-slate-950/50 to-transparent" aria-hidden="true" />
            <div
              className={
                reduceMotion
                  ? 'flex h-full flex-wrap items-center justify-center gap-3 px-6 py-3'
                  : 'flex h-full min-w-max items-center gap-6 animate-marquee'
              }
              aria-hidden={reduceMotion ? undefined : true}
            >
              {tickerRenderList.map((item, index) => (
                <span
                  key={`ticker-primary-${index}`}
                  className="inline-flex min-w-max items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-1.5 text-sm font-medium text-white/90"
                >
                  <UsersIcon className="h-4 w-4" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 w-full max-w-lg px-2 sm:px-0 lg:mt-0 lg:max-w-none">
          <div className="relative mx-auto max-w-md space-y-6 lg:ml-auto lg:mr-0">
            <div className="absolute -top-12 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-accent/40 blur-2xl" aria-hidden="true" />

            <div className="rounded-[2rem] bg-white/95 p-8 text-slate-900 shadow-2xl ring-1 ring-white/60 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <SparklesIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Creation Studio draft</p>
                  <p className="text-xs text-slate-500">Campaign kickoff • 78% ready</p>
                </div>
              </div>
              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">Storyboard deck</span>
                  <span className="text-xs text-slate-400">Last edit 3m ago</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-100/80 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Launchpad sync</span>
                  <span className="text-xs font-medium text-slate-600">Mentor feedback pending</span>
                </div>
                <p>
                  Notes stream: <span className="font-medium text-slate-900">Prototype v3 ready for review</span>
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                {['AG', 'JT', 'LK'].map((initials) => (
                  <span
                    key={initials}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent via-accentDark to-slate-900 text-sm font-semibold text-white shadow-soft"
                  >
                    {initials}
                  </span>
                ))}
                <span className="rounded-full border border-slate-200/60 px-3 py-1 text-xs font-medium text-slate-500">
                  +5 mentors watching
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-7 text-white shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Explorer opportunity card</p>
                  <p className="text-xs text-slate-300">UX research mission • Volunteering</p>
                </div>
                <RocketLaunchIcon className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>

              <div className="mt-6 space-y-4 text-sm text-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-base font-semibold text-white">
                    CJ
                  </span>
                  <div>
                    <p className="font-medium text-white">Casey · product mentor</p>
                    <p className="text-xs text-slate-300">Hosting live portfolio review, 12 seats remaining</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 text-xs text-slate-200">
                  Next session: Today · 18:30 UTC · collaborative whiteboard with volunteers & clients.
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">Community ticker</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  Join mission
                  <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
