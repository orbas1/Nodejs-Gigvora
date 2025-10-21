import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../DataStatus.jsx';
import useProjectGigManagement from '../../../hooks/useProjectGigManagement.js';
import ProjectGigManagementContainer from '../../projectGigManagement/ProjectGigManagementContainer.jsx';
import ProjectWizard from '../../projectGigManagement/ProjectWizard.jsx';
import GigOrderComposer from '../../projectGigManagement/GigOrderComposer.jsx';

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${formatNumber(value)}`;
  }
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-indigo-100 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500/80">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string,
};

MetricCard.defaultProps = {
  hint: null,
};

export default function UserGigWorkspaceSection({ userId, initialWorkspace }) {
  const gigResource = useProjectGigManagement(userId, { initialData: initialWorkspace });
  const { data, loading, error, reload, actions } = gigResource;

  const [wizardOpen, setWizardOpen] = useState(false);
  const [orderComposerOpen, setOrderComposerOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    if (!errorMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setErrorMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [errorMessage]);

  const summary = data?.summary ?? {};
  const orderStats = data?.purchasedGigs?.stats ?? {};
  const autoMatch = data?.autoMatch ?? {};
  const templates = Array.isArray(data?.templates) ? data.templates : [];
  const boardMetrics = data?.board?.metrics ?? {};
  const lastUpdated = data?.summaryUpdatedAt ?? data?.lastSyncedAt ?? null;
  const fromCache = Boolean(data?.fromCache);

  const activeProjects = summary.activeProjects ?? summary.totalProjects ?? 0;
  const gigsActive = summary.gigsInDelivery ?? orderStats.active ?? 0;
  const valueInPlay = summary.openGigValue ?? summary.budgetInPlay ?? 0;
  const primaryCurrency = summary.currency ?? 'USD';
  const readyCount = autoMatch.readyCount ?? (Array.isArray(autoMatch?.candidates) ? autoMatch.candidates.length : 0);
  const atRiskCount = boardMetrics.atRisk ?? boardMetrics.riskHigh ?? 0;

  const metrics = useMemo(
    () => [
      {
        label: 'Active projects',
        value: formatNumber(activeProjects),
        hint: 'Currently being delivered.',
      },
      {
        label: 'Gigs in delivery',
        value: formatNumber(gigsActive),
        hint: 'Orders mid-flight with partners.',
      },
      {
        label: 'Value in play',
        value: formatCurrency(valueInPlay, primaryCurrency),
        hint: 'Escrow + deliverables awaiting review.',
      },
      {
        label: 'Auto-match ready',
        value: formatNumber(readyCount),
        hint: 'Pre-vetted talent queued for invites.',
      },
      {
        label: 'Risks flagged',
        value: formatNumber(atRiskCount),
        hint: 'Projects requiring mitigation.',
      },
    ],
    [activeProjects, atRiskCount, gigsActive, primaryCurrency, readyCount, valueInPlay],
  );

  const handleProjectSubmit = async (payload) => {
    setErrorMessage(null);
    try {
      await actions.createProject(payload);
      setStatusMessage('Workspace launched successfully.');
    } catch (err) {
      const message = err?.message ?? 'Unable to create project workspace.';
      setErrorMessage(message);
      throw err;
    }
  };

  const handleOrderSubmit = async (payload) => {
    setErrorMessage(null);
    try {
      await actions.createGigOrder(payload);
      setStatusMessage('Gig order created and queued for delivery.');
    } catch (err) {
      const message = err?.message ?? 'Unable to create gig order.';
      setErrorMessage(message);
      throw err;
    }
  };

  return (
    <section
      id="client-gig-workspace"
      className="space-y-6 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Gig workspace</p>
          <h2 className="text-3xl font-semibold text-slate-900">Production-grade gig management</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Launch orders, orchestrate milestones, collaborate on revisions, and settle escrow checkpoints without leaving the
            dashboard.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <DataStatus
            loading={loading}
            error={error}
            lastUpdated={lastUpdated}
            onRefresh={reload}
            fromCache={fromCache}
            statusLabel="Gig workspace sync"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Launch workspace
            </button>
            <button
              type="button"
              onClick={() => setOrderComposerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              New gig order
            </button>
          </div>
        </div>
      </header>

      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-inner">
        <ProjectGigManagementContainer userId={userId} resource={gigResource} />
      </div>

      <ProjectWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleProjectSubmit}
        templates={templates}
      />

      <GigOrderComposer
        open={orderComposerOpen}
        onClose={() => setOrderComposerOpen(false)}
        order={null}
        onSubmit={handleOrderSubmit}
      />
    </section>
  );
}

UserGigWorkspaceSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  initialWorkspace: PropTypes.object,
};

UserGigWorkspaceSection.defaultProps = {
  initialWorkspace: null,
};
