import PropTypes from 'prop-types';
import { useMemo } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  CurrencyPoundIcon,
  SparklesIcon,
  UsersIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

function StatCard({ label, value, delta, icon: Icon }) {
  const trendClass = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-500';
  const trendLabel = delta === null || delta === undefined ? 'Stable' : `${delta > 0 ? '+' : ''}${delta}% vs. last period`;

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        {Icon ? <Icon className="h-6 w-6" /> : null}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900">{value}</p>
        <p className={`text-xs font-medium ${trendClass}`}>{trendLabel}</p>
      </div>
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  delta: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  icon: PropTypes.elementType,
};

StatCard.defaultProps = {
  delta: null,
  icon: undefined,
};

const overlayToneStyles = {
  positive: 'border-emerald-200 bg-emerald-50/70',
  warning: 'border-amber-200 bg-amber-50/70',
  negative: 'border-rose-200 bg-rose-50/70',
  critical: 'border-rose-200 bg-rose-50/70',
  info: 'border-blue-200 bg-blue-50/70',
};

const confidenceLabels = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Exploratory insight',
};

export default function HomeOverviewSection({
  stats,
  conversion,
  bookings,
  explorerPlacement,
  feedback,
  finance,
  analyticsOverlay,
  aiRecommendations,
  onRequestNewBooking,
}) {
  const upcomingSessions = useMemo(() => {
    return (bookings ?? [])
      .filter((booking) => booking.status !== 'Completed' && booking.status !== 'Cancelled')
      .slice(0, 4)
      .map((booking) => ({
        ...booking,
        formattedDate: (() => {
          try {
            return format(new Date(booking.scheduledAt), 'EEE dd MMM • HH:mm');
          } catch (error) {
            return booking.scheduledAt;
          }
        })(),
      }));
  }, [bookings]);

  const financeSummary = finance?.summary ?? {};
  const overlayCards = analyticsOverlay?.cards ?? [];
  const highlightedRecommendations = useMemo(() => (aiRecommendations ?? []).slice(0, 3), [aiRecommendations]);

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Mentorship mission control</p>
          <h2 className="text-2xl font-semibold text-slate-900">Welcome back! Here’s the pulse of your mentorship business.</h2>
          <p className="text-sm text-slate-600">
            Confirm rituals, keep mentees moving, and spot revenue opportunities at a glance. Your Explorer placement updates in
            real-time as you publish packages and availability.
          </p>
          <button
            type="button"
            onClick={onRequestNewBooking}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
          >
            <CalendarIcon className="h-4 w-4" />
            Add mentorship booking
          </button>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Explorer placement</p>
          <p className="mt-2 text-4xl font-semibold text-slate-900">{explorerPlacement?.score ?? 0}</p>
          <p className="text-sm font-medium text-slate-700">{explorerPlacement?.position ?? 'Rising mentor'}</p>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            {(explorerPlacement?.nextActions ?? []).map((action) => (
              <li key={action} className="flex items-start gap-2">
                <SparklesIcon className="mt-0.5 h-3.5 w-3.5 text-accent" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {overlayCards.length ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {overlayCards.map((card) => {
            const toneClass = overlayToneStyles[card.tone] ?? 'border-slate-200 bg-slate-50/70';
            const trend = Number.isFinite(card?.trend) ? Number(card.trend) : null;
            const trendClass = trend == null ? 'text-slate-500' : trend >= 0 ? 'text-emerald-600' : 'text-rose-600';
            return (
              <div key={card.id} className={`flex flex-col gap-3 rounded-3xl border px-5 py-4 shadow-sm ${toneClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{card.label}</p>
                  {trend != null ? (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trendClass}`}>
                      <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
                      {`${trend >= 0 ? '+' : ''}${trend}%`}
                    </span>
                  ) : null}
                </div>
                <p className="text-2xl font-semibold text-slate-900">{card.displayValue ?? card.value ?? '—'}</p>
                {card.deltaLabel ? (
                  <p className="text-xs font-semibold text-slate-500">{card.deltaLabel}</p>
                ) : null}
                <p className="text-xs text-slate-600">{card.insight}</p>
              </div>
            );
          })}
        </div>
      ) : null}

      {highlightedRecommendations.length ? (
        <div className="rounded-3xl border border-accent/30 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI opportunities</p>
              <p className="text-sm text-slate-600">Personalised next steps to lift booking velocity this week.</p>
            </div>
          </div>
          <ul className="mt-4 space-y-4">
            {highlightedRecommendations.map((recommendation) => (
              <li
                key={recommendation.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{recommendation.title}</p>
                  <span className="rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-slate-500">
                    {confidenceLabels[recommendation.confidence] ?? 'AI assist'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{recommendation.summary}</p>
                {recommendation.metricLabel ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-accent">
                    {recommendation.metricLabel}
                  </p>
                ) : null}
                {Array.isArray(recommendation.actions) && recommendation.actions.length ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {recommendation.actions.map((action) => (
                      <span key={action} className="rounded-full bg-white px-3 py-1 font-semibold shadow-sm">
                        {action}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-4">
        <StatCard label="Active mentees" value={stats?.activeMentees ?? 0} delta={stats?.activeMenteesChange} icon={UsersIcon} />
        <StatCard
          label="Upcoming sessions"
          value={stats?.upcomingSessions ?? 0}
          delta={stats?.upcomingSessionsChange}
          icon={CalendarIcon}
        />
        <StatCard label="Avg. rating" value={stats?.avgRating ?? 0} delta={stats?.avgRatingChange} icon={VideoCameraIcon} />
        <StatCard
          label="Monthly revenue"
          value={`£${stats?.monthlyRevenue?.toLocaleString?.() ?? stats?.monthlyRevenue ?? 0}`}
          delta={stats?.monthlyRevenueChange}
          icon={CurrencyPoundIcon}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pipeline health</h3>
                <p className="text-sm text-slate-600">Conversion signals across Explorer and referrals</p>
              </div>
              <span className="text-xs font-medium text-slate-500">Last sync {finance?.summary?.projected ? 'moments ago' : '—'}</span>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              {(conversion ?? []).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm"
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">{item.value}</dd>
                  <dd className={`text-xs ${item.delta > 0 ? 'text-emerald-600' : item.delta < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    {item.delta === null || item.delta === undefined ? 'Stable' : `${item.delta > 0 ? '+' : ''}${item.delta}% vs last`}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming sessions</h3>
              <span className="text-xs font-medium text-slate-500">Syncs with Explorer and calendar integrations</span>
            </div>
            <ul className="mt-4 divide-y divide-slate-200">
              {upcomingSessions.length ? (
                upcomingSessions.map((booking) => (
                  <li key={booking.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{booking.mentee}</p>
                      <p className="text-xs text-slate-500">{booking.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{booking.formattedDate}</p>
                      <p className="text-xs text-slate-500">{booking.package}</p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="py-4 text-sm text-slate-500">No sessions scheduled. Publish availability to unlock bookings.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Finance summary</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <dt>Outstanding invoices</dt>
                <dd className="font-semibold text-slate-900">£{financeSummary.outstandingInvoices?.toLocaleString?.() ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Available balance</dt>
                <dd className="font-semibold text-emerald-600">£{financeSummary.availableBalance?.toLocaleString?.() ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Upcoming payouts</dt>
                <dd className="font-semibold text-slate-900">£{financeSummary.upcomingPayouts?.toLocaleString?.() ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Projected this month</dt>
                <dd className="font-semibold text-slate-900">£{financeSummary.projected?.toLocaleString?.() ?? 0}</dd>
              </div>
            </dl>
            <a
              href="#finance"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
            >
              Open finance workspace
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Latest feedback</h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-700">
              {(feedback ?? []).map((entry) => (
                <li key={entry.id} className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{entry.mentee}</p>
                  <p className="text-xs text-slate-500">Rating: {entry.rating}/5</p>
                  <p className="mt-1 text-sm text-slate-600">{entry.highlight}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

HomeOverviewSection.propTypes = {
  stats: PropTypes.object,
  conversion: PropTypes.arrayOf(PropTypes.object),
  bookings: PropTypes.arrayOf(PropTypes.object),
  explorerPlacement: PropTypes.object,
  feedback: PropTypes.arrayOf(PropTypes.object),
  finance: PropTypes.shape({ summary: PropTypes.object }),
  analyticsOverlay: PropTypes.shape({
    generatedAt: PropTypes.string,
    cards: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        displayValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        insight: PropTypes.string,
        tone: PropTypes.string,
        trend: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        deltaLabel: PropTypes.string,
      }),
    ),
  }),
  aiRecommendations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      summary: PropTypes.string,
      actions: PropTypes.arrayOf(PropTypes.string),
      confidence: PropTypes.string,
      metricLabel: PropTypes.string,
    }),
  ),
  onRequestNewBooking: PropTypes.func,
};

HomeOverviewSection.defaultProps = {
  stats: undefined,
  conversion: undefined,
  bookings: undefined,
  explorerPlacement: undefined,
  feedback: undefined,
  finance: undefined,
  analyticsOverlay: undefined,
  aiRecommendations: undefined,
  onRequestNewBooking: undefined,
};
