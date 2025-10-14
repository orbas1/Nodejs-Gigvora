import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchTrustOverview,
  releaseEscrow,
} from '../services/trust.js';
import useSession from '../hooks/useSession.js';
import AccessRestricted from '../components/AccessRestricted.jsx';
import { hasFinanceOperationsAccess } from '../utils/permissions.js';

function formatCurrency(amount = 0, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.parseFloat(amount ?? 0));
  } catch (error) {
    return `${currency} ${Number.parseFloat(amount ?? 0).toFixed(2)}`;
  }
}

const statusCopy = {
  in_escrow: {
    title: 'Funds In Escrow',
    description: 'Amounts currently ring-fenced pending milestone or acceptance review.',
  },
  released: {
    title: 'Released To Talent',
    description: 'Funds successfully released to providers after milestone approval.',
  },
  refunded: {
    title: 'Refunded To Payers',
    description: 'Amounts refunded following mediation, arbitration, or cancellation.',
  },
  disputed: {
    title: 'Under Dispute',
    description: 'Transactions escalated for mediation with payouts paused.',
  },
};

const bucketCopy = {
  '0-3_days': 'Releases due in the next 72 hours',
  '4-7_days': 'Releases due within a week',
  '8-14_days': 'Upcoming in the next fortnight',
  '15+_days': 'Long-tail scheduled payouts',
};

export default function TrustCenterPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const financeAccess = hasFinanceOperationsAccess(session);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [releaseProcessing, setReleaseProcessing] = useState({});
  const [successBanner, setSuccessBanner] = useState('');

  const totals = useMemo(() => overview?.totalsByStatus ?? {}, [overview]);
  const disputesByStage = useMemo(() => overview?.disputesByStage ?? {}, [overview]);
  const releaseQueue = useMemo(() => overview?.releaseQueue ?? [], [overview]);
  const disputeQueue = useMemo(() => overview?.disputeQueue ?? [], [overview]);
  const releaseAgingBuckets = useMemo(() => overview?.releaseAgingBuckets ?? {}, [overview]);
  const currency = overview?.activeAccounts?.[0]?.currencyCode ?? 'USD';

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadOverview() {
      if (!financeAccess) {
        setOverview(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetchTrustOverview({ signal: controller.signal });
        if (isMounted) {
          setOverview(response);
        }
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          setError(err.message || 'Failed to load trust overview');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [financeAccess]);

  async function refreshOverview() {
    if (!financeAccess) {
      return;
    }
    try {
      const response = await fetchTrustOverview();
      setOverview(response);
    } catch (err) {
      setError(err.message || 'Failed to refresh trust overview');
    }
  }

  async function handleRelease(transaction) {
    if (!financeAccess) {
      return;
    }
    setReleaseProcessing((prev) => ({ ...prev, [transaction.id]: true }));
    setError(null);
    setSuccessBanner('');
    try {
      await releaseEscrow(transaction.id, {
        actorId: transaction.initiatedById,
        notes: 'Released via Trust Center dashboard',
      });
      setSuccessBanner(`Escrow ${transaction.reference} released successfully.`);
      await refreshOverview();
    } catch (err) {
      setError(err.message || 'Failed to release escrow.');
    } finally {
      setReleaseProcessing((prev) => ({ ...prev, [transaction.id]: false }));
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <AccessRestricted
          tone="sky"
          badge="Trust & compliance"
          title="Sign in to open the trust centre"
          description="Use your workspace account to manage escrow releases, disputes, and evidence."
          actionLabel="Go to login"
          onAction={() => navigate('/login')}
        />
      </div>
    );
  }

  if (!financeAccess) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <AccessRestricted
          title="Finance permissions required"
          description="Finance, company, or agency admins can review escrow and disputes here. Ask your workspace owner to enable access."
          badge="Restricted"
          actionLabel="Contact support"
          actionHref="mailto:support@gigvora.com?subject=Trust%20centre%20access"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-6">
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-10 text-center shadow-soft">
          <p className="text-base font-semibold text-slate-600">Loading trust & compliance telemetry…</p>
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-6">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-10 text-center shadow-soft">
          <p className="text-lg font-semibold text-rose-700">{error}</p>
          <button
            type="button"
            onClick={refreshOverview}
            className="mt-4 inline-flex rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            Retry sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent/80">Trust & Compliance</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Operations Control Tower
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            Monitor escrow health, dispute velocity, and evidence pipelines in one place. Metrics refresh near real-time to keep finance, compliance, and support aligned.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          {successBanner && (
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-soft">
              {successBanner}
            </div>
          )}
          {error && overview && (
            <div className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-soft">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={refreshOverview}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft transition hover:border-accent/50 hover:text-accent"
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" /> Refresh metrics
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-4">
        {Object.entries(statusCopy).map(([status, copy]) => {
          const metrics = totals[status] ?? { count: 0, total: 0 };
          return (
            <article
              key={status}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft transition hover:-translate-y-1 hover:border-accent/60"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-50/60 via-white to-white opacity-0 transition group-hover:opacity-100" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{copy.title}</h2>
              <p className="mt-3 text-3xl font-black text-slate-900">
                {formatCurrency(metrics.total, currency)}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">{metrics.count} transaction(s)</p>
              <p className="mt-4 text-sm text-slate-600">{copy.description}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-[1.7fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Upcoming releases</h2>
              <p className="mt-1 text-sm text-slate-500">
                Prioritise payouts with visibility into net amounts, milestones, and target release dates.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {releaseQueue.length} awaiting action
            </span>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Reference</th>
                  <th className="px-3 py-2 font-semibold">Milestone</th>
                  <th className="px-3 py-2 font-semibold">Scheduled</th>
                  <th className="px-3 py-2 font-semibold">Net Amount</th>
                  <th className="px-3 py-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {releaseQueue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                      No payouts pending release. Escrow queues are healthy.
                    </td>
                  </tr>
                )}
                {releaseQueue.map((transaction) => (
                  <tr key={transaction.id} className="transition hover:bg-slate-50">
                    <td className="px-3 py-3 font-semibold text-slate-800">{transaction.reference}</td>
                    <td className="px-3 py-3 text-slate-600">{transaction.milestoneLabel ?? '—'}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {transaction.scheduledReleaseAt
                        ? new Date(transaction.scheduledReleaseAt).toLocaleString()
                        : 'Ready now'}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-800">
                      {formatCurrency(transaction.netAmount ?? transaction.amount, transaction.currencyCode ?? currency)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        disabled={Boolean(releaseProcessing[transaction.id])}
                        onClick={() => handleRelease(transaction)}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                      >
                        {releaseProcessing[transaction.id] ? 'Releasing…' : 'Release now'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {Object.entries(releaseAgingBuckets).map(([bucket, count]) => (
              <div key={bucket} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{bucket.replace('_', ' ')}</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{count}</p>
                <p className="mt-1 text-xs text-slate-500">{bucketCopy[bucket] ?? 'Scheduled payouts'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">Dispute workload</h2>
            <p className="mt-2 text-sm text-slate-500">Track caseload distribution across mediation stages.</p>
            <dl className="mt-4 space-y-3">
              {Object.entries(disputesByStage).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <dt className="text-sm font-semibold capitalize text-slate-600">{stage}</dt>
                  <dd className="text-lg font-bold text-slate-900">{count}</dd>
                </div>
              ))}
              {Object.keys(disputesByStage).length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No disputes in flight — compliance queues are clear.
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 text-white shadow-soft">
            <h2 className="text-lg font-semibold">Cloudflare R2 evidence health</h2>
            <p className="mt-2 text-sm text-slate-200">
              Evidence uploads are stored in R2 with one-hour signed URLs. Use dispute events to attach additional artefacts or
              escalate to mediation.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-100">
              <li className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" /> Signed URL generation active
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" /> Evidence retention backed by lifecycle policies
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" /> Dispute events capture actor metadata for audit
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Active disputes</h2>
            <p className="mt-1 text-sm text-slate-500">Review the latest escalations and ensure timers stay compliant.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            {disputeQueue.length} open cases
          </span>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {disputeQueue.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-8 text-sm text-slate-500">
              No active disputes. Keep monitoring release queues and compliance dashboards.
            </div>
          )}
          {disputeQueue.map((dispute) => (
            <article key={dispute.id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Case #{dispute.id}</p>
                  <h3 className="text-lg font-bold text-slate-900">{dispute.reasonCode.replace(/_/g, ' ')}</h3>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-700">
                  {dispute.stage}
                </span>
              </div>
              <p className="text-sm text-slate-600">{dispute.summary}</p>
              <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div>
                  <dt className="font-semibold text-slate-600">Opened</dt>
                  <dd>{new Date(dispute.openedAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">Priority</dt>
                  <dd className="capitalize">{dispute.priority}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">Customer deadline</dt>
                  <dd>{dispute.customerDeadlineAt ? new Date(dispute.customerDeadlineAt).toLocaleString() : 'Pending'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">Provider deadline</dt>
                  <dd>{dispute.providerDeadlineAt ? new Date(dispute.providerDeadlineAt).toLocaleString() : 'Pending'}</dd>
                </div>
                {dispute.transaction && (
                  <div className="col-span-2 mt-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-700">Escrow transaction {dispute.transaction.reference}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Amount held: {formatCurrency(dispute.transaction.amount, dispute.transaction.currencyCode ?? currency)} ·
                      Status: {dispute.transaction.status}
                    </p>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
