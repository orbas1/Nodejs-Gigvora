import { useEffect, useMemo, useState } from 'react';
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';
import { fetchAdminConsentPolicies } from '../../services/consent.js';
import DataStatus from '../DataStatus.jsx';
import formatDate from '../../utils/formatDate.js';
import formatDateTime from '../../utils/formatDateTime.js';

const AUDIENCE_LABELS = {
  user: 'Members',
  provider: 'Providers',
  company: 'Companies',
  admin: 'Administrators',
};

const REGION_LABELS = {
  global: 'Global',
  eu: 'European Union',
  us: 'United States',
  uk: 'United Kingdom',
  apac: 'Asia Pacific',
};

function describePolicy(policy) {
  if (!policy) return 'Unconfigured';
  const parts = [];
  parts.push(AUDIENCE_LABELS[policy.audience] ?? policy.audience);
  parts.push(REGION_LABELS[policy.region] ?? policy.region.toUpperCase());
  if (policy.required) {
    parts.push('Required');
  } else {
    parts.push('Optional');
  }
  return parts.join(' • ');
}

function PolicyRow({ policy }) {
  const activeVersion = policy.versions?.find((version) => version.id === policy.activeVersionId);
  const effectiveDate = activeVersion?.effectiveAt ? formatDate(activeVersion.effectiveAt) : '—';
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm sm:grid-cols-5 sm:items-center">
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold text-slate-900">{policy.title}</p>
        <p className="mt-1 text-xs text-slate-500">{describePolicy(policy)}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Legal basis</p>
        <p className="mt-1 text-sm text-slate-700">{policy.legalBasis}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Retention</p>
        <p className="mt-1 text-sm text-slate-700">
          {policy.retentionPeriodDays ? `${policy.retentionPeriodDays} days` : 'Policy default'}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active version</p>
        <p className="mt-1 text-sm font-medium text-slate-900">v{activeVersion?.version ?? '—'}</p>
        <p className="text-xs text-slate-500">Effective {effectiveDate}</p>
      </div>
    </div>
  );
}

export default function ConsentGovernancePanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchAdminConsentPolicies({ includeInactive: true });
        if (!cancelled) {
          setPolicies(response.policies ?? []);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message ?? 'Unable to load consent policies');
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const requiredPolicies = policies.filter((policy) => policy.required);
    const optionalPolicies = policies.filter((policy) => !policy.required);
    const stalePolicies = policies.filter((policy) =>
      policy.versions?.every((version) => !version.effectiveAt || new Date(version.effectiveAt) > new Date()),
    );
    const lastUpdatedPolicy = policies.reduce((latest, policy) => {
      const updatedAt = policy.updatedAt ? new Date(policy.updatedAt).getTime() : 0;
      if (!latest || updatedAt > latest.updatedAt) {
        return { title: policy.title, updatedAt };
      }
      return latest;
    }, null);

    return {
      total: policies.length,
      required: requiredPolicies.length,
      optional: optionalPolicies.length,
      stale: stalePolicies.length,
      lastUpdated:
        lastUpdatedPolicy && Number.isFinite(lastUpdatedPolicy.updatedAt)
          ? { ...lastUpdatedPolicy, formatted: formatDateTime(new Date(lastUpdatedPolicy.updatedAt)) }
          : null,
    };
  }, [policies]);

  return (
    <section
      id="admin-domain-governance"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-indigo-100/40 sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Consent & governance</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Track GDPR and consent assets to ensure legal bases, withdrawal flows, and retention rules remain audit ready across
            Gigvora surfaces.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-500" /> {summary.total} active policies
          </div>
          {summary.lastUpdated && (
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Last updated {summary.lastUpdated.formatted}
            </p>
          )}
        </div>
      </div>

      <DataStatus
        loading={loading}
        error={error}
        empty={!loading && !error && !policies.length}
        emptyLabel="Publish consent policies to activate withdrawal logging and transparency reporting."
      />

      {!loading && !error && Boolean(policies.length) && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Required policies</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">{summary.required}</p>
              <p className="text-xs text-emerald-700">Must be accepted before onboarding completes.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Optional consents</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.optional}</p>
              <p className="text-xs text-slate-600">Enable marketing and analytics enhancements.</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-700">
                <ShieldExclamationIcon className="h-5 w-5" />
                <p className="text-xs font-semibold uppercase tracking-wide">Policies needing attention</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-amber-900">{summary.stale}</p>
              <p className="text-xs text-amber-700">
                Review policies without effective versions or upcoming activation dates.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {policies.map((policy) => (
              <PolicyRow key={policy.id} policy={policy} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
