const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatWindow(window) {
  if (!window) return '—';
  const day = DAYS[Number(window.dayOfWeek) % 7] ?? 'Day';
  const start = window.startTime ?? minutesToTime(window.startTimeMinutes);
  const end = window.endTime ?? minutesToTime(window.endTimeMinutes);
  const zone = window.timezone || window.accountTimezone || 'UTC';
  return `${day} ${start} → ${end} ${zone}`;
}

function minutesToTime(minutes) {
  if (typeof minutes !== 'number') return '';
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const mins = Math.round(minutes % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${mins}`;
}

export default function CalendarAvailabilityPanel({ accounts, availabilityByAccount, onEdit }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Slots</h2>
        </div>
      </div>

      <div className="space-y-4">
        {accounts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-100 px-6 py-10 text-center text-sm text-slate-500">
            Add an account to manage slots
          </div>
        ) : (
          accounts.map((account) => {
            const availability =
              availabilityByAccount?.[account.id] || availabilityByAccount?.[String(account.id)] || {};
            const windows = availability.windows ?? [];
            return (
              <div
                key={account.id}
                className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{account.provider}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{account.displayName || account.accountEmail}</h3>
                    <p className="text-sm text-slate-500">Timezone: {availability.timezone || account.timezone || 'UTC'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEdit(account)}
                    className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Edit slots
                  </button>
                </div>
                <ul className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {windows.length === 0 ? (
                    <li className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      No slots
                    </li>
                  ) : (
                    windows.map((window) => (
                      <li key={window.id ?? `${window.dayOfWeek}-${window.startTime}-${window.startTimeMinutes}`}>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                          {formatWindow(window)}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
