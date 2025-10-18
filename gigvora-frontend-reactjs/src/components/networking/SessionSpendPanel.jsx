import { useMemo } from 'react';

function formatCurrency(cents, currency = 'USD') {
  if (cents == null) return '—';
  const amount = Number(cents) / 100;
  if (!Number.isFinite(amount)) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount < 100 ? 2 : 0,
  }).format(amount);
}

function formatNumber(value, { fallback = '—' } = {}) {
  if (value == null) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric.toLocaleString();
}

export default function SessionSpendPanel({ summary, sessions = [] }) {
  const paidRows = useMemo(() => {
    return sessions
      .filter((session) => session?.accessType === 'paid')
      .map((session) => {
        const signups = Array.isArray(session?.signups) ? session.signups : [];
        const attendees = signups.filter((signup) => ['checked_in', 'completed'].includes(signup?.status));
        const activeSeats = signups.filter((signup) => signup?.status !== 'removed');
        const priceCents = Number(session?.priceCents) || 0;
        const monetization = session?.monetization ?? {};
        const currency = session?.currency || 'USD';

        return {
          id: session.id,
          title: session.title,
          status: session.status,
          startTime: session.startTime,
          revenue: priceCents * attendees.length,
          purchases: activeSeats.length,
          price: priceCents,
          actualSpend: monetization.actualSpendCents,
          targetSpend: monetization.targetSpendCents,
          currency,
        };
      });
  }, [sessions]);

  const cards = [
    { label: 'Paid sessions', value: formatNumber(summary?.paidSessions) },
    { label: 'Free sessions', value: formatNumber(summary?.freeSessions) },
    { label: 'Revenue', value: formatCurrency(summary?.revenueCents) },
    { label: 'Purchases', value: formatNumber(summary?.purchases) },
    { label: 'Avg price', value: formatCurrency(summary?.averagePriceCents) },
    { label: 'Actual spend', value: formatCurrency(summary?.actualSpendCents) },
    { label: 'Target spend', value: formatCurrency(summary?.targetSpendCents) },
  ];

  return (
    <section id="spend" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Spend</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Purchases</th>
              <th className="px-4 py-3">Spend</th>
              <th className="px-4 py-3">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paidRows.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">{row.title}</span>
                    <span className="text-xs text-slate-500">{row.status?.replace(/_/g, ' ')}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  {formatCurrency(row.revenue, row.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatNumber(row.purchases)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatCurrency(row.actualSpend, row.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatCurrency(row.targetSpend, row.currency)}
                </td>
              </tr>
            ))}
            {!paidRows.length ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                  No paid sessions yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
