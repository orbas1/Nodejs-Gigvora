import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { MentoringDataProvider, useMentoringData } from './MentoringContext.jsx';
import MentoringSessionsPanel from './MentoringSessionsPanel.jsx';
import MentoringPurchasesPanel from './MentoringPurchasesPanel.jsx';
import MentoringMentorsPanel from './MentoringMentorsPanel.jsx';

const SECTION_CONFIG = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'packages', label: 'Packages' },
  { id: 'mentors', label: 'Mentors' },
];

const METRIC_ORDER = [
  { id: 'booked', label: 'Booked' },
  { id: 'finished', label: 'Finished' },
  { id: 'purchased', label: 'Packages' },
  { id: 'spend', label: 'Spend', type: 'currency' },
];

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

function MentoringHeader({ overview, refreshing, onRefresh }) {
  const metrics = overview?.metrics ?? {};
  const currency = overview?.workspace?.defaultCurrency ?? 'USD';
  const refreshedAt = overview?.refreshedAt ? new Date(overview.refreshedAt) : null;
  const refreshedLabel = refreshedAt && !Number.isNaN(refreshedAt.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(refreshedAt)
    : null;

  return (
    <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mentor workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Mentoring desk</h1>
          <p className="mt-3 text-sm text-slate-600">
            Review bookings, track packages, and keep your favourite mentors ready for the next brief.
          </p>
          {refreshedLabel ? (
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">Updated {refreshedLabel}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRIC_ORDER.map((metric) => {
          const rawValue = metrics[metric.id];
          const value = metric.type === 'currency' ? formatCurrency(rawValue, currency) : rawValue ?? '0';
          return (
            <div key={metric.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
            </div>
          );
        })}
      </div>
    </header>
  );
}

MentoringHeader.propTypes = {
  overview: PropTypes.object,
  refreshing: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
};

function MentoringSectionNav({ activeId, onSelect, sections = SECTION_CONFIG }) {
  return (
    <div className="rounded-full border border-slate-200 bg-white p-1 shadow-soft">
      <div className="grid grid-cols-3 gap-1">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              onClick={() => onSelect(section.id)}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

MentoringSectionNav.propTypes = {
  activeId: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
};

function MentoringWorkspaceContent() {
  const {
    state: { loading, error, overview, sessions, purchases, favourites, suggestions, refreshing },
    actions,
  } = useMentoringData();
  const [activeSection, setActiveSection] = useState('sessions');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-52 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-16 animate-pulse rounded-full bg-slate-100" />
        <div className="h-[520px] animate-pulse rounded-3xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <MentoringHeader overview={overview} refreshing={refreshing} onRefresh={actions.refreshOverview} />
      <MentoringSectionNav activeId={activeSection} onSelect={setActiveSection} />
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
      ) : null}
      {activeSection === 'sessions' ? (
        <MentoringSessionsPanel
          sessions={sessions}
          overview={overview}
          purchases={purchases}
          suggestions={suggestions}
          favourites={favourites}
          actions={actions}
        />
      ) : null}
      {activeSection === 'packages' ? (
        <MentoringPurchasesPanel purchases={purchases} overview={overview} actions={actions} />
      ) : null}
      {activeSection === 'mentors' ? (
        <MentoringMentorsPanel
          favourites={favourites}
          suggestions={suggestions}
          actions={actions}
          refreshing={refreshing}
        />
      ) : null}
    </div>
  );
}

export default function MentoringWorkspace({ workspaceId = null, workspaceSlug = null }) {
  const params = useMemo(
    () => ({ workspaceId: workspaceId ?? null, workspaceSlug: workspaceSlug ?? null }),
    [workspaceId, workspaceSlug],
  );

  return (
    <MentoringDataProvider workspaceId={params.workspaceId} workspaceSlug={params.workspaceSlug}>
      <div className="min-h-screen bg-surfaceMuted pb-16">
        <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
          <MentoringWorkspaceContent />
        </div>
      </div>
    </MentoringDataProvider>
  );
}

MentoringWorkspace.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  workspaceSlug: PropTypes.string,
};
