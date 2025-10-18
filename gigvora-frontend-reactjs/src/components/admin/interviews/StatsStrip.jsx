const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  if (numeric >= 1000) {
    return numberFormatter.format(Math.round(numeric));
  }
  return numeric.toString();
}

function formatDuration(minutes) {
  const numeric = Number(minutes ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '—';
  }
  if (numeric >= 1440) {
    return `${(numeric / 1440).toFixed(1)} d`;
  }
  if (numeric >= 60) {
    return `${(numeric / 60).toFixed(1)} h`;
  }
  return `${numeric.toFixed(0)} m`;
}

const STAT_CARDS = [
  { key: 'totalRooms', label: 'Rooms' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'awaitingFeedback', label: 'Followups' },
  { key: 'averageSlaMinutes', label: 'Lane SLA', formatter: formatDuration },
  { key: 'totalTemplates', label: 'Panels' },
  { key: 'totalPrepPortals', label: 'Prep' },
];

export default function StatsStrip({ stats = {} }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {STAT_CARDS.map((card) => {
        const value = stats[card.key];
        const formatted = card.formatter ? card.formatter(value) : formatNumber(value);
        return (
          <div key={card.key} className="rounded-3xl bg-slate-900 px-5 py-4 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{formatted}</p>
          </div>
        );
      })}
    </div>
  );
}
