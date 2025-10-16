import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';
import { fetchRbacMatrix } from '../../services/rbac.js';
import formatDate from '../../utils/formatDate.js';
import formatDateTime from '../../utils/formatDateTime.js';

const SEVERITY_BADGES = {
  critical: 'border-rose-200 bg-rose-100 text-rose-700',
  high: 'border-amber-200 bg-amber-100 text-amber-700',
  medium: 'border-blue-200 bg-blue-100 text-blue-700',
  low: 'border-emerald-200 bg-emerald-100 text-emerald-700',
};

function GuardrailCard({ guardrail }) {
  const badgeClass = SEVERITY_BADGES[guardrail.severity] ?? SEVERITY_BADGES.medium;
  return (
    <div className={`rounded-2xl border bg-white/80 p-4 shadow-sm transition hover:shadow-md ${badgeClass}`}>
      <div className="flex items-center gap-3">
        <ShieldExclamationIcon className="h-5 w-5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{guardrail.label}</p>
          <p className="text-xs text-slate-600">{guardrail.description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-500">
        <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-600">
          Severity: {guardrail.severity}
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-600">
          Coverage: {guardrail.coverage.join(', ')}
        </span>
      </div>
    </div>
  );
}

function PersonaGrant({ grant }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{grant.resource}</p>
          <p className="text-xs text-slate-500">{grant.policyKey}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          {grant.actions.join(', ')}
        </span>
      </div>
      {grant.constraints?.length ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {grant.constraints.map((constraint) => (
            <li key={constraint} className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
              <span>{constraint}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function PersonaCard({ persona }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-indigo-100/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{persona.label}</p>
          <p className="text-xs text-slate-600">{persona.description}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
          {persona.grants.length} grants
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-500">
        {persona.defaultChannels?.map((channel) => (
          <span key={channel} className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
            {channel}
          </span>
        ))}
        {persona.escalationTarget ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
            Escalates to {persona.escalationTarget}
          </span>
        ) : null}
      </div>
      <ul className="mt-4 space-y-3">
        {persona.grants.slice(0, 3).map((grant) => (
          <PersonaGrant key={`${grant.policyKey}-${grant.resource}`} grant={grant} />
        ))}
      </ul>
    </article>
  );
}

function ResourceRow({ resource }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm sm:grid-cols-4">
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold text-slate-900">{resource.label}</p>
        <p className="text-xs text-slate-600">{resource.description}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</p>
        <p className="mt-1 text-sm text-slate-700">{resource.owner}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Surfaces</p>
        <p className="mt-1 text-sm text-slate-700">{resource.surfaces?.join(', ')}</p>
      </div>
    </div>
  );
}

export default function RbacMatrixPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchRbacMatrix();
      setMatrix(payload);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load RBAC policy matrix.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    if (!matrix) {
      return {
        personaCount: 0,
        guardrailCount: 0,
        resourceCount: 0,
        reviewCadenceDays: null,
        publishedAt: null,
      };
    }
    return {
      personaCount: matrix.personas.length,
      guardrailCount: matrix.guardrails.length,
      resourceCount: matrix.resources.length,
      reviewCadenceDays: matrix.reviewCadenceDays,
      publishedAt: matrix.publishedAt,
    };
  }, [matrix]);

  const nextReviewAt = useMemo(() => {
    if (!summary.publishedAt || !summary.reviewCadenceDays) {
      return null;
    }
    const publishedAtDate = new Date(summary.publishedAt);
    if (Number.isNaN(publishedAtDate.getTime())) {
      return null;
    }
    return new Date(publishedAtDate.getTime() + summary.reviewCadenceDays * 24 * 60 * 60 * 1000);
  }, [summary.publishedAt, summary.reviewCadenceDays]);

  return (
    <section
      id="admin-rbac-governance"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-indigo-100/40 sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">RBAC guardrails & access matrix</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Review persona-level access, guardrails, and resource ownership to confirm production operations stay within the
            security envelope agreed with enterprise customers.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" /> {summary.personaCount} personas mapped
          </div>
          {summary.publishedAt ? (
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Published {formatDate(summary.publishedAt)}
            </p>
          ) : null}
        </div>
      </div>

      <DataStatus
        loading={loading}
        error={error}
        onRefresh={load}
        lastUpdated={lastUpdated}
        statusLabel="Matrix snapshot"
      />

      {!loading && !error && matrix ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Guardrails</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">{summary.guardrailCount}</p>
              <p className="text-xs text-emerald-700">Security controls enforced across privileged personas.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Critical resources</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.resourceCount}</p>
              <p className="text-xs text-slate-600">Operational and security surfaces governed by this matrix.</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Review cadence</p>
              <p className="mt-2 text-2xl font-semibold text-amber-900">
                {summary.reviewCadenceDays ? `${summary.reviewCadenceDays} days` : 'Scheduled'}
              </p>
              <p className="text-xs text-amber-700">Compliance reviews required before cadence lapses.</p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Next review</p>
              <p className="mt-2 text-2xl font-semibold text-indigo-900">
                {nextReviewAt ? formatDateTime(nextReviewAt) : 'Pending scheduling'}
              </p>
              <p className="text-xs text-indigo-700">Confirm matrix remains aligned with regulator controls.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {matrix.personas.slice(0, 4).map((persona) => (
              <PersonaCard key={persona.key} persona={persona} />
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <ArrowPathIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Guardrails</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {matrix.guardrails.map((guardrail) => (
                <GuardrailCard key={guardrail.key} guardrail={guardrail} />
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Governed resources</h3>
            </div>
            <div className="space-y-3">
              {matrix.resources.map((resource) => (
                <ResourceRow key={resource.key} resource={resource} />
              ))}
            </div>
          </div>
        </>
      ) : null}

      {!loading && !error && !matrix && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
          RBAC metadata has not been published yet. Capture the approved persona matrix in the governance registry to unlock
          guardrail visibility for operations and compliance.
        </div>
      )}
    </section>
  );
}
