import { Link } from 'react-router-dom';
import { ArrowRightIcon, UsersIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

export function HomeHeroSection({ headline, subheading, loading, error }) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:flex lg:items-center lg:gap-16">
        <div className="max-w-2xl space-y-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            Professional community
          </span>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {error ? 'Stay tuned for what is next.' : headline}
            </h1>
            <p className="text-lg text-slate-600 sm:text-xl">
              {loading && !subheading ? 'Gathering the latest programmes…' : subheading}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3 text-base font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark"
            >
              Create your free account
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-8 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              How it works
              <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="mt-16 w-full max-w-md lg:mt-0">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-1 shadow-xl">
            <div className="space-y-6 rounded-[1.85rem] bg-white p-8 text-slate-900">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Weekly snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Community health report</h2>
                <p className="mt-3 text-sm text-slate-500">
                  Key insights from the latest portfolio of engagements across product, marketing, and operations.
                </p>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <UsersIcon className="h-6 w-6 text-accent" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Community concierge</p>
                    <p className="text-xs text-slate-500">Dedicated partner for hiring, onboarding, and retention.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-accent" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Signals you can trust</p>
                    <p className="text-xs text-slate-500">Every update ties back to documented deliverables.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
