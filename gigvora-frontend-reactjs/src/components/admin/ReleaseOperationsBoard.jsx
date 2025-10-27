import { useMemo } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
  CloudArrowUpIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function formatPercent(value, fractionDigits = 1) {
  if (typeof value !== 'number') {
    return '0%';
  }
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

function formatNumber(value, fractionDigits = 0) {
  if (typeof value !== 'number') {
    return '0';
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: fractionDigits }).format(value);
}

function formatDuration(durationMs) {
  if (!durationMs) {
    return '—';
  }
  return `${Math.round(durationMs / 1000)}s`;
}

const STATUS_BADGE = {
  passed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  attention: 'bg-amber-100 text-amber-700 border-amber-200',
  failed: 'bg-rose-100 text-rose-700 border-rose-200',
};

function StatusBadge({ status }) {
  const style = STATUS_BADGE[status] ?? STATUS_BADGE.attention;
  return (
    <span className={classNames('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', style)}>
      {status.toUpperCase()}
    </span>
  );
}

function PipelineCard({ pipeline }) {
  const statusStyle = STATUS_BADGE[pipeline.status] ?? STATUS_BADGE.attention;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{pipeline.label}</p>
          <p className="text-xs text-slate-500">{pipeline.description ?? 'Pipeline coverage and release confidence.'}</p>
        </div>
        <span className={classNames('rounded-full border px-3 py-1 text-xs font-semibold', statusStyle)}>
          {pipeline.status.toUpperCase()}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Coverage</dt>
          <dd className="font-semibold text-slate-900">{formatPercent(pipeline.coverage)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Last duration</dt>
          <dd className="font-semibold text-slate-900">{formatDuration(pipeline.durationMs)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Last run</dt>
          <dd className="font-semibold text-slate-900">{formatDate(pipeline.lastRunAt ?? pipeline.lastRun)}</dd>
        </div>
      </dl>
      {pipeline.blockers?.length ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-700">
          <p className="font-semibold uppercase tracking-wide">Blockers</p>
          <ul className="mt-2 space-y-1">
            {pipeline.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ReleaseHighlightCard({ note }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{note.version}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">{note.codename ?? 'Release'}</p>
        </div>
        <StatusBadge status={note.riskLevel === 'high' ? 'failed' : note.riskLevel === 'medium' ? 'attention' : 'passed'} />
      </div>
      <p className="mt-3 text-sm text-slate-600">{note.summary ?? 'No summary provided.'}</p>
      {note.highlights?.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {note.highlights.slice(0, 3).map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 text-xs text-slate-500">Published {formatDate(note.releasedAt)}</p>
    </div>
  );
}

function CohortCard({ cohort }) {
  const status = cohort.stage === 'ga-ready' ? 'passed' : cohort.blockers?.length ? 'attention' : 'passed';
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{cohort.name}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">Stage · {cohort.stage}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Adoption</dt>
          <dd className="font-semibold text-slate-900">{formatPercent(cohort.adoptionRate ?? 0)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Health</dt>
          <dd className="font-semibold text-slate-900">{formatPercent(cohort.healthScore ?? 0)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Next checkpoint</dt>
          <dd className="font-semibold text-slate-900">{formatDate(cohort.nextCheckpointAt ?? cohort.nextCheckpoint)}</dd>
        </div>
      </dl>
      {cohort.guardrails ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Guardrails</p>
          <p className="mt-1 leading-snug">
            {Object.entries(cohort.guardrails)
              .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1')}: ${formatPercent(value ?? 0)}`)
              .join(' · ')}
          </p>
        </div>
      ) : null}
      {cohort.blockers?.length ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-700">
          <p className="font-semibold uppercase tracking-wide">Blockers</p>
          <ul className="mt-1 space-y-1">
            {cohort.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function ReleaseOperationsBoard({ suite, loading = false, error = '', refreshing = false, onRefresh }) {
  const pipelines = suite?.pipelines?.pipelines ?? [];
  const release = suite?.releases?.latest ?? null;
  const cohorts = suite?.rollouts?.cohorts ?? [];

  const stats = suite?.pipelines?.stats ?? {};

  const summaryCards = useMemo(
    () => [
      {
        title: 'Pipelines',
        value: formatNumber(stats.total ?? pipelines.length),
        description: `${formatNumber(stats.passing ?? 0)} passing · ${formatNumber(stats.attention ?? 0)} attention`,
        icon: BoltIcon,
      },
      {
        title: 'Average coverage',
        value: formatPercent(stats.averageCoverage ?? 0),
        description: 'Combined coverage across orchestrated quality gates.',
        icon: ShieldCheckIcon,
      },
      {
        title: 'Last run at',
        value: formatDate(stats.lastRunAt ?? stats.lastRun),
        description: 'Latest pipeline execution across workspaces.',
        icon: CloudArrowUpIcon,
      },
      {
        title: 'Release approvals',
        value: formatNumber(release?.approvalCount ?? suite?.releases?.stats?.approvalDelta ?? 0),
        description: 'QA and compliance sign-offs logged in this release.',
        icon: ClipboardDocumentListIcon,
      },
    ],
    [stats, pipelines.length, release, suite],
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Release engineering control tower</h2>
          <p className="mt-1 text-sm text-slate-600">
            Track build pipelines, release notes, and cohort rollouts as we graduate enterprise upgrades.
          </p>
          <p className="mt-1 text-xs text-slate-500">Snapshot generated {formatDate(suite?.generatedAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={suite?.pipelines?.stats?.overallStatus ?? 'attention'} />
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            disabled={refreshing}
          >
            <ArrowPathIcon className={classNames('h-4 w-4', refreshing ? 'animate-spin' : '')} /> Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.title} className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <card.icon className="h-5 w-5 text-slate-500" />
                {card.title}
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{card.value}</div>
              <p className="mt-1 text-sm text-slate-600">{card.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Pipelines</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <RocketLaunchIcon className="h-4 w-4" />
              {formatNumber(pipelines.length)} quality gates monitored
            </div>
          </div>
          <div className="space-y-4">
            {pipelines.map((pipeline) => (
              <PipelineCard key={pipeline.id ?? pipeline.label} pipeline={pipeline} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Release notes</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <ClipboardDocumentListIcon className="h-4 w-4" />
              {formatNumber(suite?.releases?.notes?.length ?? 0)} entries logged
            </div>
          </div>
          <div className="space-y-4">
            {suite?.releases?.notes?.slice(0, 3).map((note) => (
              <ReleaseHighlightCard key={note.version} note={note} />
            ))}
            {!suite?.releases?.notes?.length ? (
              <p className="text-sm text-slate-500">No release notes recorded for this window.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Upgrade cohorts</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {cohorts.map((cohort) => (
            <CohortCard key={`${cohort.featureFlag}-${cohort.name}`} cohort={cohort} />
          ))}
          {!cohorts.length ? <p className="text-sm text-slate-500">No active upgrade cohorts.</p> : null}
        </div>
      </div>
    </section>
  );
}
