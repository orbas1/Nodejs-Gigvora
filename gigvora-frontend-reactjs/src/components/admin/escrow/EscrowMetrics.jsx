const numberFormatter = new Intl.NumberFormat('en-US');

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numberFormatter.format(Math.round(numeric));
}

function formatCurrency(value, currency = 'USD') {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: numeric >= 1000 ? 0 : 2,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export default function EscrowMetrics({ summary = {}, currency = 'USD' }) {
  const cards = [
    {
      label: 'Gross volume',
      value: formatCurrency(summary.grossVolume, currency),
    },
    {
      label: 'Net volume',
      value: formatCurrency(summary.netVolume, currency),
    },
    {
      label: 'Fee capture',
      value: formatCurrency(summary.feeVolume, currency),
    },
    {
      label: 'Balance',
      value: formatCurrency(summary.currentBalance, currency),
    },
    {
      label: 'Pending',
      value: formatCurrency(summary.pendingReleaseTotal, currency),
    },
    {
      label: 'Disputes',
      value: formatNumber(summary.openDisputes),
    },
    {
      label: 'Open flows',
      value: formatNumber(summary.outstandingTransactions),
    },
    {
      label: 'Avg release',
      value: summary.averageReleaseHours ? `${summary.averageReleaseHours.toFixed(1)} hrs` : '—',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
