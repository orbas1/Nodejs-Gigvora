import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, PlusIcon, BoltIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(numeric);
}

function formatPercent(part, total) {
  if (!total || total <= 0) {
    return 0;
  }
  const value = Math.round((part / total) * 100);
  return Number.isFinite(value) ? value : 0;
}

function buildFocusAlerts(recommendedActions = []) {
  const alerts = new Set();
  recommendedActions.forEach((action) => {
    if (!action?.title) return;
    const title = action.title.toLowerCase();
    if (title.includes('response')) {
      alerts.add('replies');
    }
    if (title.includes('interview')) {
      alerts.add('meets');
    }
    if (title.includes('favourite') || title.includes('saved')) {
      alerts.add('saved');
    }
  });
  return alerts;
}

export default function OverviewPanel({
  summary = {},
  statusBreakdown = [],
  recommendedActions = [],
  onCreateApplication,
  onCreateInterview,
  onCreateFavourite,
  onCreateResponse,
}) {
  const totalApplications = summary?.totalApplications ?? 0;
  const focusAlerts = useMemo(() => buildFocusAlerts(recommendedActions), [recommendedActions]);

  const stats = useMemo(
    () => [
      { id: 'active', label: 'Active', value: summary?.activeApplications ?? 0 },
      { id: 'meets', label: 'Interviews', value: summary?.interviewsScheduled ?? 0 },
      { id: 'offers', label: 'Offers', value: summary?.offersNegotiating ?? 0 },
      { id: 'saved', label: 'Saved', value: summary?.favourites ?? 0 },
    ],
    [
      summary?.activeApplications,
      summary?.interviewsScheduled,
      summary?.offersNegotiating,
      summary?.favourites,
    ],
  );

  const quickActions = useMemo(
    () => [
      { id: 'new-app', label: 'New app', onClick: onCreateApplication },
      { id: 'new-meet', label: 'Plan meet', onClick: onCreateInterview },
      { id: 'new-save', label: 'Save role', onClick: onCreateFavourite },
      { id: 'new-reply', label: 'Log reply', onClick: onCreateResponse },
    ],
    [onCreateApplication, onCreateFavourite, onCreateInterview, onCreateResponse],
  );

  const focusCards = useMemo(
    () => [
      {
        id: 'replies',
        label: 'Replies',
        value: summary?.pendingResponses ?? 0,
        action: onCreateResponse,
        cta: 'Reply now',
      },
      {
        id: 'meets',
        label: 'Meets',
        value: summary?.interviewsScheduled ?? 0,
        action: onCreateInterview,
        cta: 'Prep meet',
      },
      {
        id: 'saved',
        label: 'Saved',
        value: summary?.favourites ?? 0,
        action: onCreateApplication,
        cta: 'Promote role',
      },
    ],
    [
      onCreateApplication,
      onCreateInterview,
      onCreateResponse,
      summary?.favourites,
      summary?.interviewsScheduled,
      summary?.pendingResponses,
    ],
  );

  const safeStatusBreakdown = useMemo(
    () =>
      statusBreakdown
        .filter((item) => item && typeof item === 'object' && item.status && Number.isFinite(item.count))
        .map((item) => ({
          status: item.status,
          label: item.label || item.status,
          count: Math.max(0, item.count ?? 0),
        })),
    [statusBreakdown],
  );

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{formatNumber(stat.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Pipeline mix</h3>
            <span className="text-xs text-slate-500">{formatNumber(totalApplications)} total</span>
          </header>
          <ul className="mt-6 space-y-3">
            {safeStatusBreakdown.length === 0 ? (
              <li className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                No active applications yet.
              </li>
            ) : (
              safeStatusBreakdown.map((item) => {
                const percent = formatPercent(item.count, totalApplications || 1);
                return (
                  <li key={item.status} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span className="uppercase tracking-wide">{item.label}</span>
                      <span>{formatNumber(item.count)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${percent}%` }} />
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Quick create</h3>
          <div className="mt-4 grid gap-3" data-testid="overview-quick-actions">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
              >
                <span className="inline-flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                  {action.label}
                </span>
                <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Focus</h3>
          {recommendedActions?.length ? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
              <BoltIcon className="h-4 w-4" aria-hidden="true" />
              {recommendedActions.length} alert{recommendedActions.length > 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {focusCards.map((card) => {
            const highlight = focusAlerts.has(card.id) && card.value > 0;
            return (
              <button
                key={card.id}
                type="button"
                onClick={card.action}
                className={`flex h-full flex-col justify-between rounded-3xl border px-4 py-4 text-left transition ${
                  highlight
                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100'
                    : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-accent/40 hover:bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide">{card.label}</span>
                    {highlight ? <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" /> : null}
                  </div>
                  <span className="text-3xl font-bold">{formatNumber(card.value)}</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide">{card.cta}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

OverviewPanel.propTypes = {
  summary: PropTypes.shape({
    totalApplications: PropTypes.number,
    activeApplications: PropTypes.number,
    interviewsScheduled: PropTypes.number,
    offersNegotiating: PropTypes.number,
    favourites: PropTypes.number,
    pendingResponses: PropTypes.number,
  }),
  statusBreakdown: PropTypes.arrayOf(
    PropTypes.shape({
      status: PropTypes.string.isRequired,
      label: PropTypes.string,
      count: PropTypes.number,
    }),
  ),
  recommendedActions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
    }),
  ),
  onCreateApplication: PropTypes.func.isRequired,
  onCreateInterview: PropTypes.func.isRequired,
  onCreateFavourite: PropTypes.func.isRequired,
  onCreateResponse: PropTypes.func.isRequired,
};

