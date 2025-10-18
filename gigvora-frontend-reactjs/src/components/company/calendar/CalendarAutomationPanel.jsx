export default function CalendarAutomationPanel({ state, onConfigure }) {
  const items = [
    {
      key: 'digest',
      label: 'Email',
      status: state?.digest?.enabled ? 'On' : 'Off',
      detail: state?.digest?.frequency ? `Every ${state.digest.frequency}` : 'Not scheduled',
    },
    {
      key: 'slack',
      label: 'Slack',
      status: state?.slack?.enabled ? 'On' : 'Off',
      detail: state?.slack?.channel ?? 'No channel',
    },
  ];

  return (
    <section id="calendar-automation" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Automation</h2>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              <p className="text-xs text-slate-500">{item.detail}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  item.status === 'On' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {item.status}
              </span>
              <button
                type="button"
                onClick={() => onConfigure?.(item.key)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
              >
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
