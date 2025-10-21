import { Link } from 'react-router-dom';

export function MarketplaceLaunchesSection({
  loading,
  error,
  communityStats = [],
  trendingCreations = [],
}) {
  const hasCreations = !loading && !error && trendingCreations.length > 0;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-3">
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Live marketplace launches</h2>
            <p className="text-base text-slate-600">
              New gigs, projects, volunteering missions, and mentorship offers are published every hour. Explore a curated
              snapshot and jump straight into opportunities that match your goals.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {communityStats.map((stat) => (
              <div
                key={stat.label}
                className="min-w-[10rem] flex-1 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 text-left shadow-sm"
              >
                <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {!hasCreations ? (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center text-sm text-slate-500">
              {error ? 'Unable to load the latest launches. Please try again soon.' : 'Stay tuned—new opportunities are being prepared in the Creation Studio right now.'}
            </div>
          ) : null}
          {hasCreations
            ? trendingCreations.map((item) => (
                <article
                  key={item.id ?? item.slug ?? item.title}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {item.type}
                    </span>
                    <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600">
                      {item.summary ?? item.description ?? 'Explore the full brief inside the Creation Studio.'}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                    <span>{item.ownerName ?? item.authorName ?? 'Gigvora member'}</span>
                    {item.publishedAt ? <span>{new Date(item.publishedAt).toLocaleDateString()}</span> : null}
                  </div>
                  <Link
                    to={item.deepLink ?? `/creation-studio?item=${encodeURIComponent(item.id ?? '')}`}
                    className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Review opportunity
                  </Link>
                </article>
              ))
            : null}
        </div>
      </div>
    </section>
  );
}
