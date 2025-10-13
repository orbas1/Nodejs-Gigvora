import MentorDashboardInsights from '../../../../components/mentor/MentorDashboardInsights.jsx';

export default function OverviewSection({ dashboard, loading, error, onRefresh }) {
  return (
    <div className="space-y-10">
      <MentorDashboardInsights dashboard={dashboard} loading={loading} error={error} onRefresh={onRefresh} />
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Recent feedback</h3>
        <p className="mt-1 text-sm text-slate-500">
          High-signal notes from mentees help you tune your programmes and promotion copy.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(dashboard?.feedback ?? []).map((entry) => (
            <article key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{entry.mentee}</p>
              <p className="mt-2 text-slate-700">{entry.highlight}</p>
              <p className="mt-3 text-xs text-slate-400">Rating {entry.rating}/5</p>
            </article>
          ))}
          {!dashboard?.feedback?.length ? (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No feedback yet. Collect quotes after each session to increase conversion in Explorer.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
