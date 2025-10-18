const SUMMARY_CONFIG = [
  { key: 'totalSessions', label: 'Sessions', tone: 'primary' },
  { key: 'upcomingSessions', label: 'Upcoming', tone: 'neutral' },
  { key: 'completedSessions', label: 'Completed', tone: 'neutral' },
  { key: 'activePackages', label: 'Packages', tone: 'neutral' },
  { key: 'totalSpend', label: 'Spend', tone: 'primary', format: ({ value, currencyFormatter }) => currencyFormatter(value) },
  { key: 'sessionsRemaining', label: 'Credits left', tone: 'neutral' },
];

export default function MentoringSummaryBar({ summary, currencyFormatter }) {
  const safeSummary = summary ?? {};
  const formatCurrency = typeof currencyFormatter === 'function' ? currencyFormatter : (value) => value ?? '—';

  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6" role="grid">
      {SUMMARY_CONFIG.map((item) => {
        const value = safeSummary[item.key];
        const displayValue =
          typeof item.format === 'function'
            ? item.format({ value, currencyFormatter: formatCurrency })
            : value ?? '—';

        const cardClass = [
          'rounded-2xl border p-4 shadow-sm transition focus-within:ring-2 focus-within:ring-accent/70 focus:outline-none',
          item.tone === 'primary' ? 'border-accent/40 bg-white text-slate-900' : 'border-slate-200 bg-slate-50/70 text-slate-900',
        ].join(' ');

        return (
          <div key={item.key} role="gridcell" className={cardClass} tabIndex={0}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {displayValue === undefined || displayValue === null || displayValue === '' ? '—' : displayValue}
            </p>
          </div>
        );
      })}
    </div>
  );
}
