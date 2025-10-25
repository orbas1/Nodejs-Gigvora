import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownTrayIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import AdminGovernanceLayout from '../../../components/admin/AdminGovernanceLayout.jsx';
import AdminAuditLogDrawer from '../../../components/admin/AdminAuditLogDrawer.jsx';
import useSession from '../../../hooks/useSession.js';
import ComplianceFrameworksPanel from '../../../components/admin/compliance/ComplianceFrameworksPanel.jsx';
import ComplianceAuditSchedulePanel from '../../../components/admin/compliance/ComplianceAuditSchedulePanel.jsx';
import ComplianceObligationBoard from '../../../components/admin/compliance/ComplianceObligationBoard.jsx';
import ComplianceObligationDetailSheet from '../../../components/admin/compliance/ComplianceObligationDetailSheet.jsx';
import ComplianceEvidenceModal from '../../../components/admin/compliance/ComplianceEvidenceModal.jsx';
import {
  fetchComplianceOverview,
  createComplianceFramework,
  updateComplianceFramework,
  deleteComplianceFramework,
  createComplianceAudit,
  updateComplianceAudit,
  deleteComplianceAudit,
  createComplianceObligation,
  updateComplianceObligation,
  deleteComplianceObligation,
  logComplianceEvidence,
} from '../../../services/adminComplianceManagement.js';
import { exportToCsv } from '../../../utils/exportUtils.js';

const MENU_CONFIG = [
  {
    label: 'Compliance',
    items: [
      {
        id: 'compliance-frameworks',
        name: 'Frameworks',
        sectionId: 'compliance-frameworks',
        requiredPermissions: ['admin:compliance', 'admin:trust'],
      },
      {
        id: 'compliance-audits',
        name: 'Audits',
        sectionId: 'compliance-audits',
        requiredPermissions: ['admin:compliance'],
      },
      {
        id: 'compliance-obligations',
        name: 'Obligations',
        sectionId: 'compliance-obligations',
        requiredPermissions: ['admin:compliance'],
      },
      {
        id: 'compliance-media',
        name: 'Briefing',
        sectionId: 'compliance-media',
        requiredPermissions: ['admin:compliance', 'admin:trust'],
      },
    ],
  },
  {
    label: 'Dashboards',
    items: [{ id: 'admin-dashboard', name: 'Admin', href: '/dashboard/admin' }],
  },
];

const SECTION_IDS = {
  frameworks: 'compliance-frameworks',
  audits: 'compliance-audits',
  obligations: 'compliance-obligations',
  briefing: 'compliance-media',
};

const DEFAULT_OVERVIEW = {
  frameworks: [],
  audits: [],
  obligations: [],
  metrics: {},
};

const RISK_FILTER_OPTIONS = ['low', 'medium', 'high', 'critical'];

const COMPLIANCE_CACHE_KEY = 'admin-compliance-overview';

function restoreComplianceCache() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.sessionStorage.getItem(COMPLIANCE_CACHE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch (error) {
    return null;
  }
}

function persistComplianceCache(snapshot) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(COMPLIANCE_CACHE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    // Ignore storage failures.
  }
}

function mergeItem(list = [], item, key = 'id') {
  if (!item) return list;
  const next = Array.isArray(list) ? [...list] : [];
  const index = next.findIndex((entry) => entry?.[key] === item[key]);
  if (index >= 0) {
    next[index] = { ...next[index], ...item };
  } else {
    next.push(item);
  }
  return next;
}

export default function AdminComplianceManagementPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(DEFAULT_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('Syncing compliance controls and obligations.');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [busyFrameworkId, setBusyFrameworkId] = useState('');
  const [busyAuditId, setBusyAuditId] = useState('');
  const [busyObligationId, setBusyObligationId] = useState('');
  const [creatingFramework, setCreatingFramework] = useState(false);
  const [creatingAudit, setCreatingAudit] = useState(false);
  const [creatingObligation, setCreatingObligation] = useState(false);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState(null);
  const [evidenceModal, setEvidenceModal] = useState({ open: false, obligation: null });
  const [obligationFilters, setObligationFilters] = useState({
    search: '',
    frameworkIds: [],
    risks: [],
  });

  const loadOverview = useCallback(
    async ({ signal } = {}) => {
      setLoading(true);
      setError('');
      try {
        const response = await fetchComplianceOverview({ signal });
        const snapshot = {
          frameworks: response?.frameworks ?? [],
          audits: response?.audits ?? [],
          obligations: response?.obligations ?? [],
          metrics: response?.metrics ?? {},
        };
        setOverview(snapshot);
        const now = new Date();
        setLastUpdated(now);
        setStatusMessage('Compliance overview synced from API.');
        setFromCache(false);
        return snapshot;
      } catch (err) {
        console.error('Failed to load compliance overview.', err);
        setError('Unable to load compliance overview. Please retry.');
        setOverview(DEFAULT_OVERVIEW);
        setStatusMessage('Unable to refresh compliance overview. Showing cached values when available.');
        setFromCache(true);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const cached = restoreComplianceCache();
    if (cached) {
      setOverview(cached.overview ?? DEFAULT_OVERVIEW);
      if (cached.lastUpdated) {
        const cachedDate = new Date(cached.lastUpdated);
        if (!Number.isNaN(cachedDate.getTime())) {
          setLastUpdated(cachedDate);
        }
      }
      setStatusMessage('Loaded cached compliance snapshot while refreshing live data.');
      setFromCache(true);
    }
    const controller = new AbortController();
    loadOverview({ signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [loadOverview]);

  const refreshOverview = useCallback(() => {
    loadOverview().catch(() => {});
  }, [loadOverview]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshOverview();
    }, 120000);
    return () => clearInterval(interval);
  }, [refreshOverview]);

  useEffect(() => {
    if (fromCache) {
      return;
    }
    if (!overview) {
      return;
    }
    const hasData =
      (Array.isArray(overview.frameworks) && overview.frameworks.length > 0) ||
      (Array.isArray(overview.audits) && overview.audits.length > 0) ||
      (Array.isArray(overview.obligations) && overview.obligations.length > 0);
    if (!hasData) {
      return;
    }
    persistComplianceCache({
      overview,
      lastUpdated: lastUpdated instanceof Date ? lastUpdated.toISOString() : lastUpdated,
    });
  }, [fromCache, overview, lastUpdated]);

  const frameworks = overview.frameworks ?? [];
  const audits = overview.audits ?? [];
  const obligations = overview.obligations ?? [];

  const filteredObligations = useMemo(() => {
    return obligations.filter((obligation) => {
      if (obligationFilters.frameworkIds.length) {
        const frameworksForObligation = Array.isArray(obligation.frameworkIds) ? obligation.frameworkIds : [];
        const hasFrameworkMatch = frameworksForObligation.some((frameworkId) =>
          obligationFilters.frameworkIds.includes(frameworkId),
        );
        if (!hasFrameworkMatch) {
          return false;
        }
      }

      if (obligationFilters.risks.length) {
        const risk = `${obligation.riskRating ?? ''}`.toLowerCase();
        if (!obligationFilters.risks.includes(risk)) {
          return false;
        }
      }

      if (obligationFilters.search.trim()) {
        const haystack = [obligation.title, obligation.owner, obligation.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(obligationFilters.search.trim().toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [obligationFilters.frameworkIds, obligationFilters.risks, obligationFilters.search, obligations]);

  const metrics = useMemo(() => {
    const metricsSnapshot = overview.metrics ?? {};
    const activeFrameworks = Array.isArray(frameworks)
      ? frameworks.filter((framework) => framework.status === 'active').length
      : 0;
    const automationCoverageValue = Number.isFinite(metricsSnapshot.automationCoverage)
      ? Number(metricsSnapshot.automationCoverage)
      : null;
    const controlsCount = Number.isFinite(metricsSnapshot.controlsAutomated)
      ? Number(metricsSnapshot.controlsAutomated)
      : frameworks.reduce((total, framework) => total + (framework.controls?.length ?? 0), 0);
    const obligationsDue = Number.isFinite(metricsSnapshot.obligationsDueThisWeek)
      ? Number(metricsSnapshot.obligationsDueThisWeek)
      : 0;
    const auditsInFlight = Number.isFinite(metricsSnapshot.auditsInFlight)
      ? Number(metricsSnapshot.auditsInFlight)
      : audits.filter((audit) => ['scheduled', 'in_progress'].includes(audit.status)).length;

    return [
      { label: 'Frameworks active', value: metricsSnapshot.frameworksActive ?? activeFrameworks },
      {
        label: 'Automation coverage',
        value: automationCoverageValue == null ? '—' : `${Math.round(automationCoverageValue)}%`,
      },
      { label: 'Controls automated', value: controlsCount },
      { label: 'Obligations due this week', value: obligationsDue },
      { label: 'Audits in flight', value: auditsInFlight },
    ];
  }, [audits, frameworks, overview.metrics]);

  const obligationFilterSummary = useMemo(() => {
    const frameworkSummary = obligationFilters.frameworkIds.length
      ? `Framework filters: ${obligationFilters.frameworkIds.join(', ')}`
      : 'All frameworks';
    const riskSummary = obligationFilters.risks.length
      ? `Risk bands: ${obligationFilters.risks.join(', ')}`
      : 'All risk bands';
    const searchSummary = obligationFilters.search ? `Search: “${obligationFilters.search}”` : null;
    return [frameworkSummary, riskSummary, searchSummary].filter(Boolean).join(' • ');
  }, [obligationFilters.frameworkIds, obligationFilters.risks, obligationFilters.search]);

  const handleFrameworkFilterChange = (event) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setObligationFilters((current) => ({ ...current, frameworkIds: values }));
  };

  const handleRiskToggle = (risk) => {
    setObligationFilters((current) => {
      const next = new Set(current.risks ?? []);
      if (next.has(risk)) {
        next.delete(risk);
      } else {
        next.add(risk);
      }
      return { ...current, risks: Array.from(next) };
    });
  };

  const handleSearchFilterChange = (event) => {
    const value = event.target.value;
    setObligationFilters((current) => ({ ...current, search: value }));
  };

  const handleResetFilters = () => {
    setObligationFilters({ search: '', frameworkIds: [], risks: [] });
    setStatusMessage('Cleared compliance filters.');
  };

  const handleExportObligations = useCallback(() => {
    const dataset = filteredObligations.length ? filteredObligations : obligations;
    if (!dataset.length) {
      setStatusMessage('No obligations to export.');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    exportToCsv({
      filename: `gigvora-compliance-obligations-${timestamp}.csv`,
      headers: [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'owner', label: 'Owner' },
        { key: 'dueDate', label: 'Due date' },
        { key: 'status', label: 'Status' },
        { key: 'frameworks', label: 'Frameworks' },
        { key: 'risk', label: 'Risk' },
        { key: 'notes', label: 'Notes' },
      ],
      rows: dataset.map((obligation) => ({
        id: obligation.id ?? '',
        title: obligation.title ?? '',
        owner: obligation.owner ?? '',
        dueDate: obligation.dueDate ?? '',
        status: obligation.status ?? '',
        frameworks: Array.isArray(obligation.frameworkIds) ? obligation.frameworkIds.join('; ') : '',
        risk: obligation.riskRating ?? '',
        notes: obligation.notes ? obligation.notes.replace(/\r|\n/g, ' ') : '',
      })),
    });
    setStatusMessage('Downloaded obligation CSV export.');
  }, [filteredObligations, obligations]);

  const handleCreateFramework = useCallback(
    async (payload) => {
      setCreatingFramework(true);
      setStatusMessage('Creating framework…');
      try {
        const created = await createComplianceFramework(payload);
        setOverview((current) => ({
          ...current,
          frameworks: mergeItem(current.frameworks, created ?? payload),
        }));
        setStatusMessage('Framework created successfully.');
      } catch (err) {
        setError(err?.message || 'Failed to create framework.');
        throw err;
      } finally {
        setCreatingFramework(false);
      }
    },
    [],
  );

  const handleUpdateFramework = useCallback(async (frameworkId, payload) => {
    if (!frameworkId) return;
    setBusyFrameworkId(frameworkId);
    setStatusMessage('Updating framework…');
    try {
      const updated = await updateComplianceFramework(frameworkId, payload);
      setOverview((current) => ({
        ...current,
        frameworks: mergeItem(current.frameworks, updated ?? { ...payload, id: frameworkId }),
      }));
      setStatusMessage('Framework updated.');
    } catch (err) {
      setError(err?.message || 'Unable to update framework.');
    } finally {
      setBusyFrameworkId('');
    }
  }, []);

  const handleDeleteFramework = useCallback(async (frameworkId) => {
    if (!frameworkId) return;
    setBusyFrameworkId(frameworkId);
    setStatusMessage('Deleting framework…');
    try {
      await deleteComplianceFramework(frameworkId);
      setOverview((current) => ({
        ...current,
        frameworks: (current.frameworks ?? []).filter((framework) => framework.id !== frameworkId),
      }));
      setStatusMessage('Framework removed.');
    } catch (err) {
      setError(err?.message || 'Failed to delete framework.');
    } finally {
      setBusyFrameworkId('');
    }
  }, []);

  const handleCreateAudit = useCallback(
    async (payload) => {
      setCreatingAudit(true);
      setStatusMessage('Scheduling audit…');
      try {
        const created = await createComplianceAudit(payload);
        setOverview((current) => ({
          ...current,
          audits: mergeItem(current.audits, created ?? payload),
        }));
        setStatusMessage('Audit scheduled successfully.');
      } catch (err) {
        setError(err?.message || 'Failed to schedule audit.');
        throw err;
      } finally {
        setCreatingAudit(false);
      }
    },
    [],
  );

  const handleUpdateAudit = useCallback(async (auditId, payload) => {
    if (!auditId) return;
    setBusyAuditId(auditId);
    setStatusMessage('Updating audit…');
    try {
      const updated = await updateComplianceAudit(auditId, payload);
      setOverview((current) => ({
        ...current,
        audits: mergeItem(current.audits, updated ?? { ...payload, id: auditId }),
      }));
      setStatusMessage('Audit updated.');
    } catch (err) {
      setError(err?.message || 'Unable to update audit.');
    } finally {
      setBusyAuditId('');
    }
  }, []);

  const handleDeleteAudit = useCallback(async (auditId) => {
    if (!auditId) return;
    setBusyAuditId(auditId);
    setStatusMessage('Removing audit…');
    try {
      await deleteComplianceAudit(auditId);
      setOverview((current) => ({
        ...current,
        audits: (current.audits ?? []).filter((audit) => audit.id !== auditId),
      }));
      setStatusMessage('Audit deleted.');
    } catch (err) {
      setError(err?.message || 'Failed to delete audit.');
    } finally {
      setBusyAuditId('');
    }
  }, []);

  const handleCreateObligation = useCallback(
    async (payload) => {
      setCreatingObligation(true);
      setStatusMessage('Creating obligation…');
      try {
        const created = await createComplianceObligation(payload);
        setOverview((current) => ({
          ...current,
          obligations: mergeItem(current.obligations, created ?? payload),
        }));
        setStatusMessage('Obligation captured.');
      } catch (err) {
        setError(err?.message || 'Failed to create obligation.');
        throw err;
      } finally {
        setCreatingObligation(false);
      }
    },
    [],
  );

  const handleUpdateObligation = useCallback(async (obligationId, payload) => {
    if (!obligationId) return;
    setBusyObligationId(obligationId);
    setStatusMessage('Updating obligation…');
    try {
      const updated = await updateComplianceObligation(obligationId, payload);
      setOverview((current) => ({
        ...current,
        obligations: mergeItem(current.obligations, updated ?? { ...payload, id: obligationId }),
      }));
      setStatusMessage('Obligation updated.');
    } catch (err) {
      setError(err?.message || 'Unable to update obligation.');
    } finally {
      setBusyObligationId('');
    }
  }, []);

  const handleDeleteObligation = useCallback(async (obligationId) => {
    if (!obligationId) return;
    setBusyObligationId(obligationId);
    setStatusMessage('Removing obligation…');
    try {
      await deleteComplianceObligation(obligationId);
      setOverview((current) => ({
        ...current,
        obligations: (current.obligations ?? []).filter((obligation) => obligation.id !== obligationId),
      }));
      setStatusMessage('Obligation removed.');
    } catch (err) {
      setError(err?.message || 'Failed to delete obligation.');
    } finally {
      setBusyObligationId('');
    }
  }, []);

  const handleOpenObligationDetail = useCallback((obligation) => {
    if (!obligation) {
      return;
    }
    setSelectedObligation(obligation);
  }, []);

  const handleCloseObligationDetail = useCallback(() => {
    setSelectedObligation(null);
  }, []);

  const handleAttachEvidence = useCallback((obligation) => {
    if (!obligation || !obligation.id) {
      setError('Select a valid obligation before attaching evidence.');
      return;
    }
    setError('');
    setEvidenceModal({ open: true, obligation });
  }, []);

  const handleCloseEvidenceModal = useCallback(() => {
    setEvidenceModal({ open: false, obligation: null });
  }, []);

  const handleSubmitEvidence = useCallback(
    async ({ description, fileUrl, source, submittedAt }) => {
      if (!evidenceModal.obligation?.id) {
        return;
      }
      setSubmittingEvidence(true);
      setStatusMessage('Submitting compliance evidence…');
      try {
        const payload = {
          description,
          fileUrl: fileUrl || undefined,
          source: source || 'manual_upload',
          submittedAt: submittedAt || new Date().toISOString(),
        };
        await logComplianceEvidence(evidenceModal.obligation.id, payload);
        setStatusMessage('Evidence logged successfully and ready for auditor review.');
        setEvidenceModal({ open: false, obligation: null });
        refreshOverview();
      } catch (err) {
        console.error('Failed to log compliance evidence.', err);
        setError(err?.message || 'Failed to attach evidence.');
      } finally {
        setSubmittingEvidence(false);
      }
    },
    [evidenceModal.obligation, refreshOverview],
  );

  const handleShareHighlights = useCallback(async () => {
    const snapshot = overview.metrics ?? {};
    const now = new Date();
    const activeFrameworks = snapshot.frameworksActive ?? frameworks.filter((fw) => fw.status === 'active').length;
    const automationValue = Number.isFinite(snapshot.automationCoverage)
      ? `${Math.round(snapshot.automationCoverage)}%`
      : 'n/a';
    const obligationsDue = snapshot.obligationsDueThisWeek ?? 0;
    const auditsInFlight = snapshot.auditsInFlight ?? audits.filter((audit) => ['scheduled', 'in_progress'].includes(audit.status)).length;
    const lines = [
      `Compliance highlights (${now.toISOString()})`,
      `• Active frameworks: ${activeFrameworks}`,
      `• Automation coverage: ${automationValue}`,
      `• Obligations due this week: ${obligationsDue}`,
      `• Audits in flight: ${auditsInFlight}`,
    ];
    const summary = lines.join('\n');
    if (typeof navigator === 'undefined' || !navigator?.clipboard) {
      setError('Clipboard access is not available in this environment.');
      return;
    }
    try {
      await navigator.clipboard.writeText(summary);
      setStatusMessage('Compliance highlights copied for broadcast.');
    } catch (err) {
      console.error('Failed to copy compliance highlights.', err);
      setError('Unable to copy compliance highlights. Please copy manually.');
    }
  }, [audits, frameworks, overview.metrics]);

  const sections = useMemo(() => [
    { id: SECTION_IDS.frameworks, title: 'Frameworks' },
    { id: SECTION_IDS.audits, title: 'Audits' },
    { id: SECTION_IDS.obligations, title: 'Obligations' },
    { id: SECTION_IDS.briefing, title: 'Briefing' },
  ], []);

  const statusContent = useMemo(
    () => (
      <div className="space-y-1 text-sm text-slate-600">
        <p>{statusMessage}</p>
        <p className="text-xs text-slate-500">{obligationFilterSummary}</p>
        <p className="text-xs text-slate-500">
          {frameworks.length} frameworks • {audits.length} audits • {obligations.length} obligations
        </p>
      </div>
    ),
    [audits.length, frameworks.length, obligationFilterSummary, obligations.length, statusMessage],
  );

  const headerActions = useMemo(
    () => [
      {
        label: 'Export obligations CSV',
        onClick: handleExportObligations,
        variant: 'secondary',
        icon: ArrowDownTrayIcon,
        disabled: !(filteredObligations.length || obligations.length),
        title: 'Download the current obligation board',
      },
      {
        label: 'Open compliance audit log',
        onClick: () => setAuditDrawerOpen(true),
        variant: 'primary',
        icon: ClipboardDocumentCheckIcon,
      },
    ],
    [filteredObligations.length, handleExportObligations, obligations.length],
  );

  const auditLogEntries = useMemo(() => {
    const frameworkEntries = (frameworks ?? []).map((framework) => ({
      id: `framework-${framework.id}`,
      title: `Framework ${framework.name}`,
      description: `${framework.status ?? 'active'} • Owner: ${framework.owner ?? 'Unassigned'}`,
      actor: framework.owner ?? 'Trust & Compliance',
      timestamp: framework.updatedAt ?? framework.createdAt ?? new Date().toISOString(),
      metadata: {
        region: framework.region,
        renewalCadenceMonths: framework.renewalCadenceMonths,
        controls: Array.isArray(framework.controls) ? framework.controls.join(', ') : framework.controls,
      },
    }));

    const auditEntries = (audits ?? []).map((audit) => ({
      id: `audit-${audit.id}`,
      title: `Audit ${audit.name}`,
      description: `Status: ${audit.status ?? 'scheduled'} • Firm: ${audit.auditFirm ?? 'TBC'}`,
      actor: audit.auditFirm ?? 'Audit partner',
      timestamp: audit.startDate ?? audit.createdAt ?? new Date().toISOString(),
      metadata: {
        frameworkId: audit.frameworkId,
        scope: audit.scope,
        deliverables: Array.isArray(audit.deliverables) ? audit.deliverables.join(', ') : audit.deliverables,
      },
    }));

    const obligationEntries = (obligations ?? []).map((obligation) => ({
      id: `obligation-${obligation.id}`,
      title: `Obligation ${obligation.title}`,
      description: `Owner: ${obligation.owner ?? 'Unassigned'} • Status: ${obligation.status ?? 'backlog'}`,
      actor: obligation.owner ?? 'Obligation owner',
      timestamp: obligation.updatedAt ?? obligation.dueDate ?? new Date().toISOString(),
      metadata: {
        risk: obligation.riskRating,
        frameworkIds: obligation.frameworkIds,
      },
    }));

    return [...frameworkEntries, ...auditEntries, ...obligationEntries];
  }, [audits, frameworks, obligations]);

  const handleNavigate = useCallback((href) => navigate(href), [navigate]);
  const handleRefresh = useCallback(() => refreshOverview(), [refreshOverview]);

  return (
    <>
      <AdminGovernanceLayout
        session={session}
        title="Compliance management hub"
        subtitle="Govern frameworks, audits, and evidence with automation-first workflows"
        description="The compliance cockpit operationalises certifications, audits, DPIAs, and evidence lockers with real-time automation coverage and status tracking."
        menuConfig={MENU_CONFIG}
        sections={sections}
        statusLabel={fromCache ? 'Offline snapshot' : 'Compliance data'}
        fromCache={fromCache}
        statusChildren={statusContent}
        lastUpdated={lastUpdated}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        headerActions={headerActions}
        onNavigate={handleNavigate}
      >
        <section id={SECTION_IDS.frameworks} className="space-y-12">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">Trust & compliance operations</h1>
                <p className="mt-3 text-sm text-slate-600">
                  Monitor automation coverage, open obligations, and audit readiness from a single control tower. Connect Jira,
                  Slack, and your evidence locker to orchestrate end-to-end workflows.
                </p>
                {error ? (
                  <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
                    {error}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-900/90 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Key metrics</p>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-white/20 bg-white/10 p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">{metric.label}</dt>
                      <dd className="mt-2 text-lg font-semibold text-white">{metric.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>

          <ComplianceFrameworksPanel
            frameworks={frameworks}
            creating={creatingFramework}
            busyFrameworkId={busyFrameworkId}
            onCreate={handleCreateFramework}
            onUpdate={handleUpdateFramework}
            onDelete={handleDeleteFramework}
          />
        </section>

        <section id={SECTION_IDS.audits} className="space-y-8">
          <ComplianceAuditSchedulePanel
            audits={audits}
            frameworks={frameworks}
            creating={creatingAudit}
            busyAuditId={busyAuditId}
            onCreate={handleCreateAudit}
            onUpdate={handleUpdateAudit}
            onDelete={handleDeleteAudit}
          />
        </section>

        <section id={SECTION_IDS.obligations} className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Obligation filters</h2>
                <p className="text-sm text-slate-600">
                  Focus the board on specific frameworks or risk bands and export the view.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={handleExportObligations}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Reset filters
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Frameworks</span>
                <select
                  multiple
                  value={obligationFilters.frameworkIds}
                  onChange={handleFrameworkFilterChange}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {frameworks.map((framework) => (
                    <option key={framework.id} value={framework.id}>
                      {framework.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner or keyword</span>
                <input
                  type="search"
                  placeholder="Search owner, obligation, or note"
                  value={obligationFilters.search}
                  onChange={handleSearchFilterChange}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <div className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk bands</span>
              <div className="flex flex-wrap gap-2">
                {RISK_FILTER_OPTIONS.map((risk) => {
                  const active = obligationFilters.risks.includes(risk);
                  return (
                    <button
                      key={risk}
                      type="button"
                      onClick={() => handleRiskToggle(risk)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                        active
                          ? 'border-accent bg-accent text-white shadow-soft'
                          : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {risk}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <ComplianceObligationBoard
            obligations={filteredObligations}
            frameworks={frameworks}
            onCreate={handleCreateObligation}
            onUpdate={handleUpdateObligation}
            onAttachEvidence={handleAttachEvidence}
            onSelectObligation={handleOpenObligationDetail}
            onShareHighlights={handleShareHighlights}
          />
        </section>

        <section id={SECTION_IDS.briefing} className="grid gap-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Executive briefing</h2>
            <p className="text-sm text-slate-600">
              Share this quick rundown with leadership ahead of board meetings or investor updates. The video captures live
              automation coverage, outstanding obligations, and upcoming audits in under three minutes.
            </p>
            <ul className="list-inside list-disc text-sm text-slate-600">
              <li>Automation coverage trends by framework</li>
              <li>Audit schedule for the next 90 days</li>
              <li>Top 5 obligations requiring executive support</li>
            </ul>
          </div>
          <div className="aspect-video overflow-hidden rounded-3xl border border-slate-200 shadow-soft">
            <iframe
              title="Compliance briefing"
              src="https://player.vimeo.com/video/76979871?title=0&byline=0&portrait=0"
              allow="autoplay; fullscreen; picture-in-picture"
              className="h-full w-full"
            />
          </div>
        </section>
      </AdminGovernanceLayout>

      <AdminAuditLogDrawer
        open={auditDrawerOpen}
        onClose={() => setAuditDrawerOpen(false)}
        logs={auditLogEntries}
        loading={loading}
        title="Compliance audit log"
        description="Review every framework change, audit schedule update, and obligation adjustment recorded across the compliance hub."
        emptyState="No compliance events recorded yet."
      />
      <ComplianceObligationDetailSheet
        open={Boolean(selectedObligation)}
        obligation={selectedObligation}
        frameworks={frameworks}
        onClose={handleCloseObligationDetail}
      />
      <ComplianceEvidenceModal
        open={evidenceModal.open}
        obligation={evidenceModal.obligation}
        submitting={submittingEvidence}
        onClose={handleCloseEvidenceModal}
        onSubmit={handleSubmitEvidence}
      />
    </>
  );
}
