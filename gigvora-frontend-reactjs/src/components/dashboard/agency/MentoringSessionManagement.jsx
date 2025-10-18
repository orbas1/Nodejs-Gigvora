import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { fetchAgencyMentoringOverview } from '../../../services/agencyMentoring.js';

const METRIC_KEYS = [
  { id: 'booked', label: 'Booked' },
  { id: 'finished', label: 'Finished' },
  { id: 'purchased', label: 'Packages' },
  { id: 'spend', label: 'Spend', type: 'currency' },
];

function toQuery(workspaceId, workspaceSlug) {
  return {
    ...(workspaceId ? { workspaceId } : {}),
    ...(workspaceSlug ? { workspaceSlug } : {}),
  };
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(0)}`;
  }
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    const dayFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
    const timeFormatter = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });
    return `${dayFormatter.format(date)} · ${timeFormatter.format(date)}`;
  } catch (error) {
    return value;
  }
}

export default function MentoringSessionManagement({ workspaceId = null, workspaceSlug = null }) {
  const query = useMemo(() => toQuery(workspaceId, workspaceSlug), [workspaceId, workspaceSlug]);
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const data = await fetchAgencyMentoringOverview(query);
        if (!cancelled) {
          setState({ loading: false, error: null, data });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: error?.message || 'Unable to load mentoring overview.',
            data: null,
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const { loading, error, data } = state;
  const metrics = data?.metrics ?? {};
  const currency = data?.workspace?.defaultCurrency ?? 'USD';
  const upcoming = (data?.upcomingSessions ?? []).slice(0, 2);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mentor desk</p>
          <h2 className="text-2xl font-semibold text-slate-900">Mentoring</h2>
        </div>
        <Link
          to="/dashboard/agency/mentoring"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-300 hover:bg-slate-800"
        >
          Open workspace
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="h-24 animate-pulse rounded-3xl bg-slate-100"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {METRIC_KEYS.map((metric) => {
              const rawValue = metrics[metric.id];
              const displayValue = metric.type === 'currency' ? formatCurrency(rawValue, currency) : rawValue ?? '0';
              return (
                <div key={metric.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{displayValue}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Next sessions</p>
              <ul className="mt-3 space-y-3">
                {upcoming.length ? (
                  upcoming.map((session) => (
                    <li key={session.id} className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {session.mentorName || session.mentor?.name || 'Mentor'}
                      </p>
                      <p className="text-xs text-slate-500">{formatDateTime(session.scheduledAt)}</p>
                      <p className="text-xs text-slate-400">{session.clientName || 'Client pending'}</p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No sessions scheduled.
                  </li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Favourites</p>
              <ul className="mt-3 space-y-3">
                {(data?.favouriteMentors ?? []).slice(0, 3).map((mentor) => (
                  <li key={mentor.id} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{mentor.mentorName || mentor.mentor?.name || 'Mentor'}</p>
                      {mentor.preferenceLevel ? (
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{mentor.preferenceLevel}</p>
                      ) : null}
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Favourite</span>
                  </li>
                ))}
                {(data?.favouriteMentors ?? []).length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    Pin mentors you trust so the team can rebook quickly.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

MentoringSessionManagement.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  workspaceSlug: PropTypes.string,
};
