function formatDate(value) {
  if (!value) return 'Schedule pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Schedule pending';
  }
  return date.toLocaleString();
}

export default function NetworkingSessionShowcase({ showcase, onPreview }) {
  const featured = showcase?.featured ?? null;
  const librarySize = showcase?.librarySize ?? 0;
  const cardsAvailable = showcase?.cardsAvailable ?? 0;
  const highlights = featured?.showcaseConfig?.sessionHighlights ?? featured?.sessionHighlights ?? [];
  const hostTips = featured?.showcaseConfig?.hostTips ?? [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Session showcase</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {featured?.title ?? 'Design your first speed networking experience'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {featured?.description ??
              'Bring candidates, founders, and mentors together with automated rotations, lightweight video, and smart follow-up tooling.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <div>
              <span className="font-medium text-slate-900">{librarySize}</span> sessions in your library
            </div>
            <div>
              <span className="font-medium text-slate-900">{cardsAvailable}</span> digital cards ready to share
            </div>
            {featured?.startTime ? (
              <div>
                <span className="font-medium text-slate-900">{formatDate(featured.startTime)}</span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3">
          <button
            type="button"
            onClick={() => onPreview?.(featured)}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
            disabled={!featured}
          >
            {featured ? 'Open host controls' : 'Plan a session'}
          </button>
          <div className="rounded-2xl border border-blue-100 bg-white/60 p-4 text-xs text-blue-700">
            <p className="font-semibold uppercase tracking-wide text-blue-500">Host tips</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {hostTips.length
                ? hostTips.map((tip) => <li key={tip}>{tip}</li>)
                : [
                    'Welcome attendees in lobby chat five minutes before kickoff.',
                    'Use the broadcast channel between rotations to highlight sponsors or resources.',
                  ].map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(highlights.length ? highlights : ['Timed rotations', 'Digital business cards', 'Post-event CRM sync']).map(
          (highlight) => (
            <div key={highlight} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{highlight}</p>
              <p className="mt-1 text-xs text-slate-600">
                {highlight.includes('rotation')
                  ? 'Keep energy high with automated shuffling every few minutes.'
                  : highlight.includes('card')
                    ? 'Let participants exchange rich Gigvora cards complete with social links and follow-up CTAs.'
                    : 'Connect insights back to recruiting, CRM, and partner workstreams after the session.'}
              </p>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
