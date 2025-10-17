import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useSession from '../../../../hooks/useSession.js';
import { fetchDisputeDashboard } from '../../../../services/freelancerDisputes.js';
import SectionShell from '../SectionShell.jsx';

const METRICS = [
  { id: 'open', label: 'Open', field: 'openCases' },
  { id: 'client', label: 'Client', field: 'awaitingCustomer' },
  { id: 'urgent', label: 'Urgent', field: 'urgentCases' },
  { id: 'due', label: 'Due <72h', field: 'dueWithin72h' },
];

export default function DisputeManagementSection() {
  const { session } = useSession();
  const freelancerId = session?.id ?? null;
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    if (!freelancerId) {
      return () => {
        active = false;
      };
    }
    setLoading(true);
    fetchDisputeDashboard(freelancerId, { limit: 5 })
      .then((data) => {
        if (!active) {
          return;
        }
        setSummary(data.summary ?? null);
        setError(null);
      })
      .catch((cause) => {
        if (!active) {
          return;
        }
        setError(cause instanceof Error ? cause : new Error('Unable to load disputes'));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [freelancerId]);

  return (
    <SectionShell
      id="dispute-management"
      title="Disputes"
      description="Keep an eye on the case load and jump into the dedicated board."
      actions={
        <Link
          to="/dashboard/freelancer/disputes"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Open board
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? METRICS.map((metric) => (
              <div key={metric.id} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))
          : METRICS.map((metric) => (
              <div key={metric.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{summary?.[metric.field] ?? 0}</p>
              </div>
            ))}
      </div>
      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {error.message || 'Unable to load dispute metrics.'}
        </p>
      ) : null}
    </SectionShell>
  );
}
