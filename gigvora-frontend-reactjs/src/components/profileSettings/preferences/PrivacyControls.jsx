import PropTypes from 'prop-types';
import { useMemo } from 'react';
import {
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import formatDateTime from '../../../utils/formatDateTime.js';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const PRESET_OPTIONS = [
  {
    key: 'recommended',
    label: 'Recommended',
    description: 'Balanced visibility with marketing muted and trust-critical updates enabled.',
    badge: 'Productivity boost',
  },
  {
    key: 'private',
    label: 'Private mode',
    description: 'Lock down marketing and community outreach while preserving compliance notices only.',
    badge: 'Stealth',
  },
  {
    key: 'open',
    label: 'Open network',
    description: 'Allow discovery programmes and marketing spotlights to grow your reputation.',
    badge: 'Growth',
  },
];

function ConsentRow({ entry, pending, expanded, onToggle, onToggleHistory }) {
  const policy = entry.policy;
  const consent = entry.consent ?? {};
  const enabled = consent.status === 'granted';
  const lastUpdated = consent.grantedAt ?? consent.withdrawnAt ?? policy.updatedAt;
  const audience = policy.audience ? policy.audience.toUpperCase() : 'GLOBAL';
  const region = policy.region ? policy.region.toUpperCase() : 'ALL REGIONS';
  const legalBasis = policy.legalBasis ?? 'Legitimate interest';

  return (
    <article
      className={classNames(
        'space-y-4 rounded-3xl border bg-white p-5 shadow-sm transition',
        enabled ? 'border-emerald-200/80' : 'border-slate-200/80',
        pending ? 'opacity-70' : 'opacity-100',
      )}
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{policy.title}</h3>
            {policy.required ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                <LockClosedIcon className="h-3.5 w-3.5" /> Required
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-600">{policy.description ?? 'No description provided.'}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <button
            type="button"
            onClick={() => onToggle?.(!enabled)}
            disabled={pending || policy.required}
            className={classNames(
              'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition',
              enabled
                ? 'border-emerald-300 bg-emerald-500/10 text-emerald-700'
                : 'border-slate-300 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:text-emerald-600',
              pending || policy.required ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            )}
            aria-pressed={enabled}
            aria-label={enabled ? 'ON' : 'OFF'}
          >
            {enabled ? 'Granted' : 'Withdrawn'}
          </button>
          <button
            type="button"
            onClick={onToggleHistory}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-700"
          >
            <InformationCircleIcon className="h-4 w-4" /> {expanded ? 'Hide history' : 'View history'}
          </button>
        </div>
      </header>
      <dl className="grid gap-3 text-xs text-slate-500 md:grid-cols-3">
        <div>
          <dt className="font-semibold uppercase tracking-wide">Audience</dt>
          <dd>{audience}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide">Region</dt>
          <dd>{region}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide">Legal basis</dt>
          <dd>{legalBasis}</dd>
        </div>
      </dl>
      <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="h-4 w-4" /> Updated {lastUpdated ? formatDateTime(lastUpdated) : '—'}
        </span>
        <span className="inline-flex items-center gap-1">
          {enabled ? <ShieldCheckIcon className="h-4 w-4 text-emerald-500" /> : <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />}
          {enabled ? 'Active consent' : 'Disabled'}
        </span>
      </footer>
      {expanded && Array.isArray(entry.auditTrail) && entry.auditTrail.length ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audit trail</p>
          <ul className="mt-2 space-y-2 text-xs text-slate-600">
            {entry.auditTrail.map((event) => (
              <li key={event.id ?? event.timestamp} className="flex items-start justify-between gap-3">
                <span className="font-medium text-slate-700">{event.action ?? event.status ?? 'Updated'}</span>
                <span className="text-slate-500">{event.timestamp ? formatDateTime(event.timestamp) : '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

ConsentRow.propTypes = {
  entry: PropTypes.shape({
    policy: PropTypes.object.isRequired,
    consent: PropTypes.object,
    auditTrail: PropTypes.array,
  }).isRequired,
  pending: PropTypes.bool,
  expanded: PropTypes.bool,
  onToggle: PropTypes.func,
  onToggleHistory: PropTypes.func,
};

ConsentRow.defaultProps = {
  pending: false,
  expanded: false,
  onToggle: null,
  onToggleHistory: null,
};

export default function PrivacyControls({
  summary,
  consentRows,
  pending,
  expanded,
  onPreferenceChange,
  onToggleHistory,
  preset,
  onApplyPreset,
  presetApplying,
  preview,
  trustSignals,
  latestExport,
  onRequestExport,
  exportPending,
  exportError,
}) {
  const activePreset = preset ?? 'custom';
  const privacyScore = summary.total ? Math.round((summary.granted / summary.total) * 100) : 100;

  const groupedConsents = useMemo(() => {
    if (!Array.isArray(consentRows)) {
      return [];
    }
    return consentRows.reduce((groups, entry) => {
      const policy = entry.policy ?? {};
      const category = policy.category ?? policy.area ?? policy.group ?? 'general';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category).push(entry);
      return groups;
    }, new Map());
  }, [consentRows]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-inner">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Privacy centre</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Consent & visibility controls</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Decide how Gigvora surfaces your data, marketing, and trust signals. These controls align with GDPR, CCPA, and enterprise compliance requirements.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              <ShieldCheckIcon className="h-4 w-4" /> {summary.granted} / {summary.total} granted
            </span>
            <span
              className={classNames(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1',
                summary.outstandingRequired
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700',
              )}
            >
              <ExclamationTriangleIcon className="h-4 w-4" />
              {summary.outstandingRequired
                ? `${summary.outstandingRequired} required pending`
                : 'All required granted'}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              <CheckCircleIcon className="h-4 w-4" /> Privacy score {privacyScore}
            </span>
          </div>
        </div>
        {Array.isArray(trustSignals) && trustSignals.length ? (
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {trustSignals.map((signal) => (
              <span key={signal} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
                <ClipboardDocumentCheckIcon className="h-4 w-4" /> {signal}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {PRESET_OPTIONS.map((option) => {
              const active = activePreset === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onApplyPreset?.(option.key)}
                  disabled={presetApplying && !active}
                  className={classNames(
                    'flex h-full flex-col justify-between rounded-3xl border p-4 text-left shadow-sm transition',
                    active
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-emerald-200 hover:bg-white',
                    presetApplying && !active ? 'cursor-wait opacity-60' : 'cursor-pointer',
                  )}
                >
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-current px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                      <UsersIcon className="h-4 w-4" /> {option.badge}
                    </span>
                    <p className="mt-3 text-base font-semibold">{option.label}</p>
                    <p className="mt-2 text-sm opacity-80">{option.description}</p>
                  </div>
                  {active ? (
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-600">Active preset</p>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="space-y-5">
            {[...groupedConsents.entries()].map(([category, entries]) => (
              <section key={category} className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">{category.replace(/_/g, ' ')}</h3>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {entries.filter((entry) => entry.consent?.status === 'granted').length} of {entries.length} enabled
                  </span>
                </div>
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <ConsentRow
                      key={entry.policy.id}
                      entry={entry}
                      pending={Boolean(pending?.[entry.policy.code])}
                      expanded={Boolean(expanded?.[entry.policy.code])}
                      onToggle={(shouldGrant) => onPreferenceChange?.(entry.policy.code, shouldGrant)}
                      onToggleHistory={() => onToggleHistory?.(entry.policy.code)}
                    />
                  ))}
                </div>
              </section>
            ))}
            {!groupedConsents.size ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                Privacy preferences will appear once policies are published for your account.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-soft">
            <h3 className="text-base font-semibold text-slate-900">Visibility preview</h3>
            <p className="text-sm text-slate-600">{preview.summary}</p>
            <ul className="space-y-2 text-xs text-slate-500">
              {preview.highlights?.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <ShieldCheckIcon className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-soft">
            <h3 className="text-base font-semibold text-slate-900">Data downloads</h3>
            <p className="text-sm text-slate-600">
              Export your invoices, conversations, and attachments. Archives remain available for seven days.
            </p>
            <button
              type="button"
              onClick={onRequestExport}
              disabled={exportPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <DocumentArrowDownIcon className="h-4 w-4" /> Request export
            </button>
            {latestExport ? (
              <p className="text-xs text-slate-500">
                Last export {latestExport.completedAt ? `completed ${formatDateTime(latestExport.completedAt)}` : 'pending'} • Requested {latestExport.requestedAt ? formatDateTime(latestExport.requestedAt) : '—'}
              </p>
            ) : (
              <p className="text-xs text-slate-500">No export history yet.</p>
            )}
            {exportError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{exportError}</p>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

PrivacyControls.propTypes = {
  summary: PropTypes.shape({
    granted: PropTypes.number,
    total: PropTypes.number,
    outstandingRequired: PropTypes.number,
  }).isRequired,
  consentRows: PropTypes.arrayOf(PropTypes.object).isRequired,
  pending: PropTypes.object,
  expanded: PropTypes.object,
  onPreferenceChange: PropTypes.func,
  onToggleHistory: PropTypes.func,
  preset: PropTypes.string,
  onApplyPreset: PropTypes.func,
  presetApplying: PropTypes.bool,
  preview: PropTypes.shape({
    summary: PropTypes.string,
    highlights: PropTypes.arrayOf(PropTypes.string),
  }),
  trustSignals: PropTypes.arrayOf(PropTypes.string),
  latestExport: PropTypes.object,
  onRequestExport: PropTypes.func,
  exportPending: PropTypes.bool,
  exportError: PropTypes.string,
};

PrivacyControls.defaultProps = {
  pending: null,
  expanded: null,
  onPreferenceChange: null,
  onToggleHistory: null,
  preset: 'custom',
  onApplyPreset: null,
  presetApplying: false,
  preview: { summary: 'Only verified collaborators can view your full profile footprint.', highlights: [] },
  trustSignals: null,
  latestExport: null,
  onRequestExport: null,
  exportPending: false,
  exportError: '',
};
