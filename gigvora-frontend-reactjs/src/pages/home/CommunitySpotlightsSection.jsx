import { communitySpotlights } from '../../content/home/communitySpotlights.js';

export function CommunitySpotlightsSection({ loading, error, items = communitySpotlights }) {
  const spotlights = !loading && !error && items?.length ? items : communitySpotlights;

  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Community moments we&apos;re proud of</h2>
          <p className="mt-4 text-base text-slate-600">Real programmes crafted by members who value thoughtful delivery.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {spotlights.map((spotlight) => (
            <figure key={spotlight.title} className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              {spotlight.image ? (
                <img src={spotlight.image} alt={spotlight.title} className="h-56 w-full object-cover" />
              ) : (
                <div className="flex h-56 items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
                  {loading ? 'Loading highlight…' : 'Community highlight'}
                </div>
              )}
              <figcaption className="space-y-2 p-6 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{spotlight.category}</p>
                <h3 className="text-lg font-semibold text-slate-900">{spotlight.title}</h3>
                <p className="text-sm text-slate-600">{spotlight.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
