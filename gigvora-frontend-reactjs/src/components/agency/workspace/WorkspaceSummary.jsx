function formatCurrency(value, currency = 'USD') {
  if (value == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch (error) {
    return `${currency} ${value}`;
  }
}

function formatNumber(value) {
  if (value == null) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(value);
}

export default function WorkspaceSummary({ summary }) {
  if (!summary) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Budget in play</p>
        <p className="mt-3 text-2xl font-semibold text-slate-900">
          {formatCurrency(summary.budget?.planned ?? 0)}
        </p>
        <p className="mt-2 text-xs text-slate-500">{formatCurrency(summary.budget?.actual ?? 0)} actual so far</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Tasks</p>
        <p className="mt-3 text-2xl font-semibold text-slate-900">
          {formatNumber(summary.tasks?.completed ?? 0)} / {formatNumber(summary.tasks?.total ?? 0)} done
        </p>
        <p className="mt-2 text-xs text-slate-500">{formatNumber(summary.tasks?.active ?? 0)} in motion</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Hours captured</p>
        <p className="mt-3 text-2xl font-semibold text-slate-900">{formatNumber(summary.time?.totalHours ?? 0)}h</p>
        <p className="mt-2 text-xs text-slate-500">Across billable and internal time entries</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Collaboration</p>
        <p className="mt-3 text-2xl font-semibold text-slate-900">
          {formatNumber(summary.collaboration?.invitesAccepted ?? 0)} / {formatNumber(summary.collaboration?.invitesSent ?? 0)}
        </p>
        <p className="mt-2 text-xs text-slate-500">Invites accepted</p>
      </div>
    </div>
  );
}
