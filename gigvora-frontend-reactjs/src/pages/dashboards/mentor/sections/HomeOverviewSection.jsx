import PropTypes from 'prop-types';
import { useMemo } from 'react';
import {
  ArrowTopRightOnSquareIcon,
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

export default function HomeOverviewSection({
  stats,
  conversion,
  bookings,
  explorerPlacement,
  feedback,
  finance,
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
  onRequestNewBooking: PropTypes.func,
};

HomeOverviewSection.defaultProps = {
  stats: {},
  conversion: [],
  bookings: [],
  explorerPlacement: {},
  feedback: [],
  finance: { summary: {} },
  onRequestNewBooking: undefined,
};
