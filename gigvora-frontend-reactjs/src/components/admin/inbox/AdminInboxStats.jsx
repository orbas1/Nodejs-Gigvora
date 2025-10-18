function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value ?? 0));
}

function buildCards(metrics = {}, pagination) {
  const states = metrics.states ?? {};
  const support = metrics.supportStatuses ?? {};
  const assignment = metrics.assignment ?? {};
  const total = pagination?.total ?? 0;

  return [
    { label: 'Total', value: formatNumber(total) },
    { label: 'Active', value: formatNumber(states.active ?? 0) },
    { label: 'Waiting', value: formatNumber((support.waiting_on_customer ?? 0) + (support.in_progress ?? 0)) },
    { label: 'Unassigned', value: formatNumber(assignment.unassigned ?? 0) },
  ];
}

export default function AdminInboxStats({ metrics, pagination, lastSyncedAt }) {
  const cards = buildCards(metrics, pagination);
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 gap-3 sm:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-500">
          {lastSyncedAt ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Syncing…'}
        </div>
      </div>
    </section>
  );
}
