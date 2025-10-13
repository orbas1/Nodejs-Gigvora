import {
  BoltIcon,
  ChartPieIcon,
  SignalIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { formatAbsolute } from '../../utils/date.js';
import { classNames } from '../../utils/classNames.js';

const TYPE_ICONS = {
  health: BoltIcon,
  finance: ChartPieIcon,
  engagement: UserGroupIcon,
  risk: SignalIcon,
  custom: BoltIcon,
};

export default function ClientPortalInsightWidgets({ insights = {}, className = '' }) {
  const widgets = Array.isArray(insights.widgets) ? insights.widgets : [];
  const digest = insights.digest ?? {};

  return (
    <section className={classNames('rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Client insight widgets</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Tailored snapshots your client leadership relies on. Configure digest frequency and visibility to keep stakeholders confident.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
          <p className="font-semibold uppercase tracking-wide">Digest configuration</p>
          <p className="mt-1">Frequency: {digest.frequency ?? 'weekly'}</p>
          {digest.recipients?.length ? (
            <p className="mt-1">Recipients: {digest.recipients.join(', ')}</p>
          ) : (
            <p className="mt-1">Recipients: Not configured</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {widgets.length ? (
          widgets.map((widget) => {
            const Icon = TYPE_ICONS[widget.widgetType] ?? BoltIcon;
            const data = widget.data ?? {};
            return (
              <article key={widget.id} className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{widget.widgetType}</p>
                      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
                    </div>
                  </div>
                  {widget.description ? <p className="text-sm text-slate-600">{widget.description}</p> : null}
                  <pre className="whitespace-pre-wrap rounded-2xl bg-white px-3 py-3 text-xs text-slate-600 shadow-inner">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
                <p className="mt-3 text-right text-[11px] uppercase tracking-wide text-slate-400">
                  Updated {formatAbsolute(widget.updatedAt ?? widget.createdAt, { dateStyle: 'medium' })}
                </p>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Add insight widgets so clients see health metrics, financials, or engagement signals at a glance.
          </div>
        )}
      </div>
    </section>
  );
}
