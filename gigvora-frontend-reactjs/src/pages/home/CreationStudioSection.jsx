import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { creationStudioHighlights } from '../../content/home/creationStudioHighlights.js';

export function CreationStudioSection({ loading, error, highlights = creationStudioHighlights }) {
  const items = !loading && !error && highlights?.length ? highlights : creationStudioHighlights;

  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24">
      <div className="mx-auto max-w-6xl px-6 text-white">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
              Creation Studio
            </span>
            <h2 className="text-3xl font-semibold sm:text-4xl">Ship opportunities with production-ready wizards</h2>
            <p className="text-base text-white/80">
              From CVs and cover letters to gigs, projects, and volunteering drives, our studio keeps every launch compliant,
              collaborative, and on schedule.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/creation-studio"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-soft transition hover:-translate-y-0.5"
              >
                Explore the studio
                <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/feed"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
              >
                See live launches
                <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {items.map((highlight) => (
              <article
                key={highlight.title}
                className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.35)]"
              >
                {highlight.icon ? <highlight.icon className="h-8 w-8 text-accent" aria-hidden="true" /> : null}
                <h3 className="mt-4 text-lg font-semibold text-white">{highlight.title}</h3>
                <p className="mt-2 text-sm text-white/80">{highlight.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
