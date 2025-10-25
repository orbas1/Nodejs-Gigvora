import PropTypes from 'prop-types';
import { CalendarIcon, CurrencyPoundIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { describeTimeSince, formatAbsolute } from '../../../../utils/date.js';

const toneStyles = {
  session: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  invoice: 'border-sky-200 bg-sky-50 text-sky-700',
  payout: 'border-violet-200 bg-violet-50 text-violet-700',
  action: 'border-amber-200 bg-amber-50 text-amber-700',
};

const toneIcons = {
  session: CalendarIcon,
  invoice: CurrencyPoundIcon,
  payout: ClockIcon,
  action: ExclamationTriangleIcon,
};

function TimelineItem({ item }) {
  const Icon = toneIcons[item.tone] ?? CalendarIcon;
  const style = toneStyles[item.tone] ?? toneStyles.session;

  return (
    <li className="relative pl-6">
      <span className="absolute left-0 top-2 flex h-3 w-3 -translate-x-1/2 rounded-full bg-accent" aria-hidden="true" />
      <article className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatAbsolute(item.at, { timeStyle: 'short' })}</p>
            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
            {item.subtitle ? <p className="text-xs text-slate-500">{item.subtitle}</p> : null}
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}>
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </span>
        </div>
        {item.summary ? <p className="mt-3 text-xs text-slate-600">{item.summary}</p> : null}
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {describeTimeSince(item.at)}
        </p>
      </article>
    </li>
  );
}

TimelineItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    at: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    label: PropTypes.string.isRequired,
    summary: PropTypes.string,
    tone: PropTypes.oneOf(['session', 'invoice', 'payout', 'action']),
  }).isRequired,
};

export default function EngagementTimeline({ items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Engagement timeline</p>
        <h2 className="text-xl font-semibold text-slate-900">Upcoming sessions, finance touchpoints, and follow-ups.</h2>
        <p className="text-sm text-slate-600">Prioritise support, finance, and booking rituals without leaving the dashboard.</p>
      </header>
      <ol className="relative space-y-4 border-l border-slate-200 pl-3">
        {items.map((item) => (
          <TimelineItem key={item.id} item={item} />
        ))}
      </ol>
    </section>
  );
}

EngagementTimeline.propTypes = {
  items: PropTypes.arrayOf(TimelineItem.propTypes.item).isRequired,
};
