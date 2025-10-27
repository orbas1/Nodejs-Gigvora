import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import { fetchSecurityFabricSnapshot } from '../../../services/warRoom.js';
import { classNames } from '../../../utils/classNames.js';

const MENU_SECTIONS = [
  {
    label: 'War room',
    items: [
      { id: 'platform-war-room', name: 'Platform performance', href: '/dashboard/admin/war-room/platform' },
      { id: 'security-fabric', name: 'Security fabric', sectionId: 'security-summary' },
    ],
  },
  {
    label: 'Dashboards',
    items: [{ id: 'admin-dashboard', name: 'Admin', href: '/dashboard/admin' }],
  },
];

const DEFAULT_SNAPSHOT = {
  generatedAt: null,
  fabricScore: 100,
  posture: 'fortified',
  security: { events: [], severityCounts: { critical: 0, high: 0, medium: 0, low: 0, informational: 0 } },
  compliance: {
    frameworks: { total: 0, active: 0, paused: 0, automationCoverage: null, expiringSoon: [] },
    audits: { total: 0, inFlight: 0, dueSoon: [] },
    obligations: { total: 0, active: 0, atRisk: [], highRiskCount: 0 },
  },
  privacy: {
    dpo: { name: null, email: null, phone: null, officeLocation: null, availability: null },
    dataSubjectRequests: { contactEmail: null, escalationEmail: null, slaDays: null, intakeChannels: [], automatedIntake: null },
    breachResponse: { notificationWindowHours: null, onCallContact: null, incidentRunbookUrl: null, tabletopLastRun: null },
    consentFramework: { marketingOptInDefault: null, cookieBannerEnabled: null, cookieRefreshMonths: null },
  },
  focus: { recommendations: [], escalations: [] },
};

const POSTURE_BADGES = {
  fortified: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  steady: 'bg-indigo-100 text-indigo-700 ring-indigo-500/20',
  watch: 'bg-amber-100 text-amber-700 ring-amber-500/20',
  'at-risk': 'bg-rose-100 text-rose-700 ring-rose-500/20',
};

function formatPercent(value, fallback = '—') {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return `${Math.round(value)}%`;
}

function formatDays(value) {
  if (value == null) {
    return '—';
  }
  if (value > 30) {
    return `${Math.round(value / 30)} mo`;
  }
  return `${value} d`;
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminSecurityFabricPage() {
  const [snapshot, setSnapshot] = useState(DEFAULT_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const sections = useMemo(
    () => [
      {
        id: 'security-summary',
        name: 'Security fabric',
        description: 'Blend runtime security alerts, compliance posture, and privacy governance in one console.',
      },
      {
        id: 'compliance',
        name: 'Compliance readiness',
        description: 'Framework renewals, audit cadences, and obligations approaching deadlines.',
      },
      {
        id: 'privacy-office',
        name: 'Privacy operations',
        description: 'DPO contact details, data subject request SLAs, and breach response readiness.',
      },
      {
        id: 'security-focus',
        name: 'Focus & escalations',
        description: 'Recommended actions and escalations to fortify Gigvora’s trust fabric.',
      },
    ],
    [],
  );

  const loadSnapshot = useCallback(
    async ({ signal, silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        const data = await fetchSecurityFabricSnapshot({ limit: 15, signal });
        setSnapshot((previous) => ({ ...previous, ...data }));
        setError('');
      } catch (err) {
        console.error('Failed to load security fabric snapshot', err);
        setError('Unable to refresh the security fabric snapshot. Try again shortly.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadSnapshot({ signal: controller.signal }).catch(() => {});
    const interval = setInterval(() => {
      loadSnapshot({ silent: true }).catch(() => {});
    }, 120_000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [loadSnapshot]);

  const postureBadgeClass = POSTURE_BADGES[snapshot.posture] ?? POSTURE_BADGES.steady;

  const severityOrder = ['critical', 'high', 'medium', 'low', 'informational'];
  const severityPalette = {
    critical: 'bg-rose-100 text-rose-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-700',
    informational: 'bg-slate-50 text-slate-500',
  };

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Security, privacy & compliance fabric"
      subtitle="Keep Gigvora’s trust fabric fortified with live security telemetry, audit readiness, and privacy governance"
      description="Security operations, compliance leaders, and privacy officers share a unified view of escalations, obligations, and response readiness."
      menuSections={MENU_SECTIONS}
      sections={sections}
    >
      <div className="space-y-12">
        {error ? (
          <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</p>
        ) : null}

        <section id="security-summary" className="space-y-6">
          <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Fabric score</p>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-slate-900">{Math.round(snapshot.fabricScore)}</span>
                  <span
                    className={classNames(
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset capitalize',
                      postureBadgeClass,
                    )}
                  >
                    {snapshot.posture}
                  </span>
                </div>
                <p className="mt-3 max-w-xl text-sm text-slate-600">
                  Score blends security incident load, compliance risk, and privacy readiness. Use it during trust reviews and executive stand-ups.
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600 sm:grid-cols-4">
                  {severityOrder.map((severity) => (
                    <div key={severity}>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">{severity}</dt>
                      <dd className="mt-2 text-lg font-semibold text-slate-900">
                        {snapshot.security.severityCounts[severity] ?? 0}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button
                  type="button"
                  onClick={() => loadSnapshot()}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  disabled={refreshing}
                >
                  <ArrowPathIcon className={classNames('h-5 w-5', refreshing ? 'animate-spin' : '')} />
                  {refreshing ? 'Refreshing…' : loading ? 'Loading snapshot' : 'Refresh snapshot'}
                </button>
                <p className="text-xs text-slate-500">Generated {formatDate(snapshot.generatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Recent security signals</h2>
                  <p className="text-sm text-slate-600">Critical and high events require on-call acknowledgement before hand-off.</p>
                </div>
                <ShieldExclamationIcon className="h-6 w-6 text-rose-500" />
              </div>
              <div className="mt-6 space-y-3 text-sm text-slate-700">
                {snapshot.security.events.length > 0 ? (
                  snapshot.security.events.map((event) => (
                    <div
                      key={event.id ?? event.eventType}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 shadow-inner"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{event.eventType}</p>
                        <span
                          className={classNames(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                            severityPalette[event.level] ?? severityPalette.low,
                          )}
                        >
                          {event.level}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{event.message}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{formatDate(event.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No security events in this window.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft" id="compliance">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Compliance readiness</h2>
                  <p className="text-sm text-slate-600">
                    Framework renewals, audit runway, and obligations nearing deadlines keep compliance on track.
                  </p>
                </div>
                <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-500" />
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Active frameworks</dt>
                  <dd className="mt-2 text-xl font-semibold text-slate-900">{snapshot.compliance.frameworks.active}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Automation coverage</dt>
                  <dd className="mt-2 text-xl font-semibold text-slate-900">
                    {snapshot.compliance.frameworks.automationCoverage != null
                      ? formatPercent(snapshot.compliance.frameworks.automationCoverage)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Audits in flight</dt>
                  <dd className="mt-2 text-xl font-semibold text-slate-900">{snapshot.compliance.audits.inFlight}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Obligations at risk</dt>
                  <dd className="mt-2 text-xl font-semibold text-rose-600">{snapshot.compliance.obligations.atRisk.length}</dd>
                </div>
              </dl>
              <div className="mt-6 grid gap-3 text-xs text-slate-600">
                {snapshot.compliance.frameworks.expiringSoon.map((framework) => (
                  <div key={framework.id} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-700">
                    <p className="font-semibold">{framework.name}</p>
                    <p>Renewal in {formatDays(framework.daysUntilRenewal)}</p>
                  </div>
                ))}
                {snapshot.compliance.audits.dueSoon.map((audit) => (
                  <div key={audit.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-slate-900">{audit.name}</p>
                    <p className="text-slate-500">Starts in {formatDays(audit.daysUntilStart)}</p>
                  </div>
                ))}
                {snapshot.compliance.obligations.atRisk.map((obligation) => (
                  <div key={obligation.id} className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-700">
                    <p className="font-semibold">{obligation.title}</p>
                    <p>
                      {obligation.owner ? `${obligation.owner} · ` : ''}due in {formatDays(obligation.daysRemaining)} · {obligation.riskRating}
                    </p>
                  </div>
                ))}
                {snapshot.compliance.frameworks.expiringSoon.length === 0 &&
                snapshot.compliance.audits.dueSoon.length === 0 &&
                snapshot.compliance.obligations.atRisk.length === 0 ? (
                  <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    No urgent compliance deadlines this cycle.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section id="privacy-office" className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Privacy office</h2>
                <p className="text-sm text-slate-600">Ensure the DPO and privacy operations team remain responsive.</p>
              </div>
              <ShieldCheckIcon className="h-6 w-6 text-emerald-500" />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">DPO</dt>
                <dd className="mt-2 text-sm font-semibold text-slate-900">{snapshot.privacy.dpo.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Contact</dt>
                <dd className="mt-2 text-sm text-slate-900">{snapshot.privacy.dpo.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Availability</dt>
                <dd className="mt-2 text-sm text-slate-900">{snapshot.privacy.dpo.availability ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Office</dt>
                <dd className="mt-2 text-sm text-slate-900">{snapshot.privacy.dpo.officeLocation ?? '—'}</dd>
              </div>
            </dl>
            <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-slate-900">DSR SLA</p>
                <p>{snapshot.privacy.dataSubjectRequests.slaDays ?? '—'} days</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-slate-900">Intake channels</p>
                <p>{snapshot.privacy.dataSubjectRequests.intakeChannels.join(', ') || '—'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Breach response</h2>
                <p className="text-sm text-slate-600">Tabletop cadence and escalation contacts keep the breach plan ready.</p>
              </div>
              <LockClosedIcon className="h-6 w-6 text-indigo-500" />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Notification window</dt>
                <dd className="mt-2 text-sm font-semibold text-slate-900">
                  {snapshot.privacy.breachResponse.notificationWindowHours ?? '—'} hrs
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Tabletop last run</dt>
                <dd className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(snapshot.privacy.breachResponse.tabletopLastRun)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">On-call contact</dt>
                <dd className="mt-2 text-sm text-slate-900">{snapshot.privacy.breachResponse.onCallContact ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Consent banner</dt>
                <dd className="mt-2 text-sm text-slate-900">
                  {snapshot.privacy.consentFramework.cookieBannerEnabled === false ? 'Disabled' : 'Enabled'}
                </dd>
              </div>
            </dl>
            {snapshot.privacy.breachResponse.incidentRunbookUrl ? (
              <a
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                href={snapshot.privacy.breachResponse.incidentRunbookUrl}
                target="_blank"
                rel="noreferrer"
              >
                <CheckBadgeIcon className="h-4 w-4" />
                View breach runbook
              </a>
            ) : null}
          </div>
        </section>

        <section id="security-focus" className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recommended actions</h2>
                <p className="text-sm text-slate-600">Align squads on the most impactful next steps.</p>
              </div>
              <ShieldCheckIcon className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-700">
              {snapshot.focus.recommendations.length > 0 ? (
                snapshot.focus.recommendations.map((recommendation, index) => (
                  <p key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    {recommendation}
                  </p>
                ))
              ) : (
                <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">No recommendations — keep monitoring cadence.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Escalations</h2>
                <p className="text-sm text-slate-600">Highlight issues requiring exec or steering committee attention.</p>
              </div>
              <ShieldExclamationIcon className="h-6 w-6 text-rose-500" />
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-700">
              {snapshot.focus.escalations.length > 0 ? (
                snapshot.focus.escalations.map((escalation) => (
                  <div
                    key={escalation.id}
                    className={classNames(
                      'rounded-2xl border px-4 py-3 shadow-inner',
                      severityPalette[escalation.severity] ?? severityPalette.medium,
                    )}
                  >
                    <p className="font-semibold capitalize">{escalation.label}</p>
                    <p className="text-xs opacity-80">{escalation.detail}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  No escalations flagged. Keep runbooks warm and continue monitoring.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
