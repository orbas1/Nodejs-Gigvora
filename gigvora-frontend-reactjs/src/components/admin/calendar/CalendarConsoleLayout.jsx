import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function CalendarConsoleLayout({
  panelConfig,
  activePanel,
  onPanelChange,
  variant = 'dashboard',
  loading,
  busy,
  message,
  error,
  onDismissMessage,
  onDismissError,
  onRefresh,
  children,
}) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col rounded-3xl bg-white shadow-xl">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-8 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Calendar</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || busy}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading || busy ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {variant === 'standalone' ? null : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Console
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <nav className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 md:w-60 md:border-b-0 md:border-r md:px-5">
          <ul className="flex flex-row gap-2 md:flex-col">
            {panelConfig.map((panel) => {
              const isActive = panel.id === activePanel;
              return (
                <li key={panel.id} className="flex-1">
                  <button
                    type="button"
                    onClick={() => onPanelChange(panel.id)}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 md:text-base ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                        : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'
                    }`}
                  >
                    {panel.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="flex-1 overflow-y-auto bg-slate-50 px-6 py-8 md:px-10">
          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{error}</p>
                <button
                  type="button"
                  onClick={onDismissError}
                  className="text-xs font-semibold uppercase tracking-wide text-rose-600"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : null}

          {message ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{message}</p>
                <button
                  type="button"
                  onClick={onDismissMessage}
                  className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-10">{children}</div>
        </section>
      </div>
    </div>
  );
}
