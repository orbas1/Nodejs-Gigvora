import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  ChartPieIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

function formatNumber(value, precision = 1) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return numeric.toFixed(precision);
}

function formatPercent(value, precision = 1) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return `${numeric.toFixed(precision)}%`;
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function riskTone(risk) {
  switch ((risk ?? '').toLowerCase()) {
    case 'critical':
    case 'high':
    case 'blocked':
      return 'bg-rose-500/10 text-rose-600 ring-rose-200';
    case 'elevated':
    case 'medium':
    case 'at_risk':
      return 'bg-amber-500/10 text-amber-600 ring-amber-200';
    default:
      return 'bg-emerald-500/10 text-emerald-600 ring-emerald-200';
  }
}

function statusLabel(status) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'on_track' || normalized === 'stable') {
    return 'On track';
  }
  if (normalized === 'at_risk' || normalized === 'delayed') {
    return 'At risk';
  }
  if (normalized === 'blocked') {
    return 'Blocked';
  }
  if (normalized === 'rolling') {
    return 'Rolling';
  }
  if (normalized === 'complete') {
    return 'Complete';
  }
  if (normalized === 'planning') {
    return 'Planning';
  }
  return normalized ? normalized.replace(/_/g, ' ') : 'Unknown';
}

function AdminEnterprise360Panel({ snapshot }) {
  if (!snapshot) {
    return null;
  }

  const summary = snapshot.summary ?? {};
  const continuity = snapshot.continuity ?? {};
  const governance = snapshot.governance ?? {};
  const tracks = Array.isArray(snapshot.tracks) ? snapshot.tracks : [];
  const initiatives = Array.isArray(snapshot.initiatives) ? snapshot.initiatives : [];
  const mobilePlatforms = Array.isArray(continuity.platforms)
    ? continuity.platforms
    : tracks.filter((track) => {
        const key = `${track.platformKey ?? ''}`.toLowerCase();
        const name = `${track.platformName ?? ''}`.toLowerCase();
        return (
          key.includes('ios') ||
          key.includes('android') ||
          key.includes('mobile') ||
          key.includes('tablet') ||
          name.includes('ios') ||
          name.includes('android') ||
          name.includes('mobile') ||
          name.includes('tablet')
        );
      });

  const blockers = tracks.flatMap((track) =>
    (track.blockers ?? []).map((blocker) => ({
      ...blocker,
      platformKey: track.platformKey,
      platformName: track.platformName,
    })),
  );

  const atRiskInitiatives = initiatives.filter((initiative) =>
    ['at_risk', 'blocked'].includes((initiative.status ?? '').toLowerCase()),
  );

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-lg shadow-blue-100/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-600">
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            Enterprise 360 snapshot
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Cross-platform continuity &amp; executive readiness</h2>
          <p className="max-w-2xl text-sm text-slate-500">
            Monitor parity, mobile readiness, and governance programmes in one glance so every surface—web, iOS, Android, and tablet pilots—ships in lockstep with transformation initiatives.
          </p>
        </div>
        <div className="grid w-full max-w-xl gap-3 text-xs text-slate-500 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-slate-400">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              Parity score
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(summary.parityScore)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-slate-400">
              <DevicePhoneMobileIcon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
              Mobile readiness
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(summary.mobileReadinessScore)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-slate-400">
              <ArrowTrendingUpIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
              Release cadence
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {summary.releaseVelocityWeeks ? `${formatNumber(summary.releaseVelocityWeeks)} w` : '—'}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-slate-400">
              <ClockIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Next release window
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(summary.nextReleaseWindow)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Mobile continuity</h3>
                <p className="text-sm text-slate-500">Shared design tokens and release trains keep the mobile fleet aligned with the admin web shell.</p>
              </div>
              <span
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset',
                  riskTone(continuity.riskLevel ?? summary.mobileContinuityRisk),
                )}
              >
                {statusLabel(continuity.riskLevel ?? summary.mobileContinuityRisk)}
              </span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {mobilePlatforms.length === 0 ? (
                <p className="text-sm text-slate-500">No mobile tracks detected in the snapshot.</p>
              ) : (
                mobilePlatforms.map((platform) => (
                  <div key={platform.platformKey ?? platform.platformName} className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{platform.platformName ?? platform.platformKey}</p>
                        <p className="text-sm font-semibold text-slate-900">{statusLabel(platform.status)}</p>
                      </div>
                      <DevicePhoneMobileIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
                    </div>
                    <dl className="mt-3 space-y-2 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <dt>Parity</dt>
                        <dd className="font-semibold text-slate-900">{formatNumber(platform.parityScore)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Readiness</dt>
                        <dd className="font-semibold text-slate-900">{formatNumber(platform.mobileReadiness)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Next window</dt>
                        <dd className="font-semibold text-slate-900">{formatDate(platform.nextReleaseWindow)}</dd>
                      </div>
                    </dl>
                    {Array.isArray(platform.blockers) && platform.blockers.length ? (
                      <div className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-600">
                        <p className="font-semibold uppercase tracking-wide">Blockers</p>
                        <ul className="mt-1 space-y-1">
                          {platform.blockers.slice(0, 2).map((blocker, index) => (
                            <li key={`${platform.platformKey}-blocker-${index}`}>
                              • {blocker.summary ?? blocker.code}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Transformation initiatives</h3>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                {initiatives.length} programmes
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {initiatives.length === 0 ? (
                <p className="text-sm text-slate-500">No governance programmes registered.</p>
              ) : (
                initiatives.map((initiative) => (
                  <div key={initiative.initiativeKey ?? initiative.title} className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{initiative.sponsorTeam ?? 'Core programme'}</p>
                        <p className="text-sm font-semibold text-slate-900">{initiative.title}</p>
                        <p className="text-xs text-slate-500">Owner: {initiative.executiveOwner ?? 'Unassigned'}</p>
                      </div>
                      <span className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset', riskTone(initiative.status))}>
                        {statusLabel(initiative.status)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span className="font-semibold text-slate-900">{formatPercent(initiative.progressPercent)}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-white/60">
                        <div
                          className={clsx('h-2 rounded-full',
                            ['blocked', 'at_risk'].includes((initiative.status ?? '').toLowerCase())
                              ? 'bg-rose-500'
                              : (initiative.status ?? '').toLowerCase() === 'on_track'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500')}
                          style={{ width: `${Math.min(100, Math.max(0, Number(initiative.progressPercent ?? 0)))}%` }}
                        />
                      </div>
                      <div className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          Next milestone {formatDate(initiative.nextMilestoneAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          <ChartPieIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          Outcome: {initiative.outcomeMetric ?? 'TBD'}
                        </div>
                      </div>
                      {initiative.narrative ? (
                        <p className="mt-2 text-xs text-slate-500">{initiative.narrative}</p>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Governance cadence</h3>
            <dl className="mt-3 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                <dt>Cadence</dt>
                <dd className="font-semibold text-slate-900">{governance.cadence ?? 'Not set'}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                <dt>Next steering</dt>
                <dd className="font-semibold text-slate-900">{formatDate(governance.nextSteeringDate)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                <dt>At-risk initiatives</dt>
                <dd className="font-semibold text-rose-600">{governance.atRiskCount ?? summary.atRiskInitiativeCount ?? 0}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Executive sponsors</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {(governance.executiveOwners ?? []).length
                    ? governance.executiveOwners.join(', ')
                    : 'Not assigned'}
                </dd>
              </div>
            </dl>
            <div className="mt-3 rounded-2xl bg-slate-900 px-3 py-3 text-xs text-white">
              <p className="font-semibold uppercase tracking-wide text-emerald-200">Last review</p>
              <p className="mt-1 text-sm font-semibold">{formatDate(governance.lastReviewedAt)}</p>
              <p className="mt-1 text-xs text-slate-200">
                Keep the steering committee aligned with refreshed telemetry and pre-read exports.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Active blockers</h3>
            {blockers.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No blockers reported across release tracks.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {blockers.slice(0, 4).map((blocker, index) => (
                  <li key={`${blocker.platformKey}-${blocker.code}-${index}`} className="rounded-3xl border border-rose-100 bg-rose-50 px-3 py-3 text-rose-700 shadow-sm">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                      <span className="font-semibold">{blocker.platformName ?? blocker.platformKey}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                        <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                        {statusLabel(blocker.severity)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{blocker.summary ?? blocker.code}</p>
                    <p className="text-xs text-rose-600">Owner: {blocker.owner ?? 'Unassigned'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">At-risk initiatives</h3>
            {atRiskInitiatives.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No initiatives flagged as at-risk.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {atRiskInitiatives.map((initiative) => (
                  <li key={initiative.initiativeKey} className="rounded-3xl border border-amber-100 bg-amber-50 px-3 py-2">
                    <p className="font-semibold text-amber-700">{initiative.title}</p>
                    <p className="text-xs text-amber-600">Owner: {initiative.executiveOwner ?? 'Unassigned'}</p>
                    <p className="text-xs text-amber-600">Next milestone {formatDate(initiative.nextMilestoneAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

AdminEnterprise360Panel.propTypes = {
  snapshot: PropTypes.shape({
    summary: PropTypes.shape({
      parityScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      mobileReadinessScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      releaseVelocityWeeks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      nextReleaseWindow: PropTypes.string,
      mobileContinuityRisk: PropTypes.string,
      atRiskInitiativeCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    continuity: PropTypes.shape({
      riskLevel: PropTypes.string,
      averageParity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      averageReadiness: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      platforms: PropTypes.arrayOf(
        PropTypes.shape({
          platformKey: PropTypes.string,
          platformName: PropTypes.string,
          parityScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
          mobileReadiness: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
          nextReleaseWindow: PropTypes.string,
          status: PropTypes.string,
          blockers: PropTypes.arrayOf(
            PropTypes.shape({
              code: PropTypes.string,
              summary: PropTypes.string,
              severity: PropTypes.string,
              owner: PropTypes.string,
            }),
          ),
        }),
      ),
    }),
    governance: PropTypes.shape({
      cadence: PropTypes.string,
      nextSteeringDate: PropTypes.string,
      lastReviewedAt: PropTypes.string,
      atRiskCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      executiveOwners: PropTypes.arrayOf(PropTypes.string),
    }),
    tracks: PropTypes.arrayOf(
      PropTypes.shape({
        platformKey: PropTypes.string,
        platformName: PropTypes.string,
        status: PropTypes.string,
        parityScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        mobileReadiness: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        nextReleaseWindow: PropTypes.string,
        blockers: PropTypes.array,
      }),
    ),
    initiatives: PropTypes.arrayOf(
      PropTypes.shape({
        initiativeKey: PropTypes.string,
        title: PropTypes.string,
        executiveOwner: PropTypes.string,
        sponsorTeam: PropTypes.string,
        status: PropTypes.string,
        progressPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        nextMilestoneAt: PropTypes.string,
        outcomeMetric: PropTypes.string,
        narrative: PropTypes.string,
      }),
    ),
  }),
};

AdminEnterprise360Panel.defaultProps = {
  snapshot: null,
};

export default AdminEnterprise360Panel;
