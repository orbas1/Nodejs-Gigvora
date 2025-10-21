import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import ComplianceFrameworksPanel from '../../../components/admin/compliance/ComplianceFrameworksPanel.jsx';
import ComplianceAuditSchedulePanel from '../../../components/admin/compliance/ComplianceAuditSchedulePanel.jsx';
import ComplianceObligationBoard from '../../../components/admin/compliance/ComplianceObligationBoard.jsx';
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

const MENU_SECTIONS = [
  {
    label: 'Compliance',
    items: [
      { id: 'compliance-frameworks', name: 'Frameworks', sectionId: 'compliance-frameworks' },
      { id: 'compliance-audits', name: 'Audits', sectionId: 'compliance-audits' },
      { id: 'compliance-obligations', name: 'Obligations', sectionId: 'compliance-obligations' },
      { id: 'compliance-media', name: 'Briefing', sectionId: 'compliance-media' },
    ],
  },
  {
    label: 'Dashboards',
    items: [{ id: 'admin-dashboard', name: 'Admin', href: '/dashboard/admin' }],
  },
];

const DEFAULT_OVERVIEW = {
  frameworks: [],
  audits: [],
  obligations: [],
  metrics: {},
};

const FALLBACK_OVERVIEW = {
  frameworks: [
    {
      id: 'iso27001',
      name: 'ISO 27001',
      owner: 'Security Engineering',
      region: 'Global',
      status: 'active',
      renewalCadenceMonths: 12,
      controls: ['Asset inventory automation', 'Continuous vulnerability scanning', 'Change control approvals'],
      automationCoverage: 82,
      updatedAt: '2024-04-12T08:00:00.000Z',
      type: 'certification',
    },
    {
      id: 'soc2',
      name: 'SOC 2 Type II',
      owner: 'Trust & Compliance',
      region: 'US & UK',
      status: 'active',
      renewalCadenceMonths: 12,
      controls: ['Audit log retention', 'Access reviews every 90 days', 'Backup testing runbook'],
      automationCoverage: 74,
      updatedAt: '2024-03-02T12:00:00.000Z',
      type: 'attestation',
    },
  ],
  audits: [
    {
      id: 'soc2-2024',
      name: 'SOC 2 Yearly Audit',
      frameworkId: 'soc2',
      auditFirm: 'KPMG',
      status: 'scheduled',
      startDate: '2024-07-15T09:00:00Z',
      endDate: '2024-08-02T17:00:00Z',
      scope: 'Core platform, data platform, vendor management, HR controls',
      deliverables: ['SOC 2 report', 'Management letter', 'Evidence diff report'],
    },
    {
      id: 'iso-surveillance',
      name: 'ISO Surveillance Visit',
      frameworkId: 'iso27001',
      auditFirm: 'BSI',
      status: 'in_progress',
      startDate: '2024-05-01T09:00:00Z',
      endDate: '2024-05-03T17:00:00Z',
      scope: 'Annex A controls, disaster recovery, supplier management',
      deliverables: ['Surveillance statement', 'Improvement plan'],
    },
  ],
  obligations: [
    {
      id: 'dpia-ai',
      title: 'AI workflow DPIA refresh',
      owner: 'Privacy Operations',
      dueDate: '2024-06-15T00:00:00Z',
      status: 'backlog',
      frameworkIds: ['gdpr'],
      riskRating: 'high',
      notes: 'Update DPIA for new AI-assisted job matching release.',
    },
    {
      id: 'vendor-review',
      title: 'Vendor risk review: SendGrid',
      owner: 'Vendor Management',
      dueDate: '2024-05-20T00:00:00Z',
      status: 'in_progress',
      frameworkIds: ['iso27001', 'soc2'],
      riskRating: 'medium',
      notes: 'Collect updated subprocessor attestations and penetration test reports.',
    },
    {
      id: 'breach-drill',
      title: 'GDPR breach response drill',
      owner: 'Trust & Safety',
      dueDate: '2024-05-30T00:00:00Z',
      status: 'awaiting_evidence',
      frameworkIds: ['gdpr'],
      riskRating: 'medium',
      notes: 'Upload tabletop report and lessons learned summary.',
    },
  ],
  metrics: {
    automationCoverage: 79,
    frameworksActive: 4,
    controlsAutomated: 123,
    obligationsDueThisWeek: 6,
  },
};

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency'];
const RISK_FILTER_OPTIONS = ['low', 'medium', 'high', 'critical'];

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
  const [overview, setOverview] = useState(DEFAULT_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busyFrameworkId, setBusyFrameworkId] = useState('');
  const [busyAuditId, setBusyAuditId] = useState('');
  const [busyObligationId, setBusyObligationId] = useState('');
  const [creatingFramework, setCreatingFramework] = useState(false);
  const [creatingAudit, setCreatingAudit] = useState(false);
  const [creatingObligation, setCreatingObligation] = useState(false);
  const [obligationFilters, setObligationFilters] = useState({
    search: '',
    frameworkIds: [],
    risks: [],
  });

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchComplianceOverview();
      setOverview({
        frameworks: response?.frameworks ?? [],
        audits: response?.audits ?? [],
        obligations: response?.obligations ?? [],
        metrics: response?.metrics ?? {},
      });
      setStatus('Loaded compliance data from API.');
    } catch (err) {
      console.warn('Failed to load compliance overview, using fallback defaults.', err);
      setError('Using fallback compliance data. Connect the API to sync live records.');
      setOverview(FALLBACK_OVERVIEW);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

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
    return [
      { label: 'Frameworks active', value: overview.metrics?.frameworksActive ?? frameworks.length },
      { label: 'Automation coverage', value: `${overview.metrics?.automationCoverage ?? 72}%` },
      { label: 'Controls automated', value: overview.metrics?.controlsAutomated ?? 118 },
      { label: 'Obligations due this week', value: overview.metrics?.obligationsDueThisWeek ?? 4 },
    ];
  }, [overview.metrics, frameworks.length]);

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
    setStatus('Cleared compliance filters.');
  };

  const handleExportObligations = () => {
    const dataset = filteredObligations.length ? filteredObligations : obligations;
    if (!dataset.length) {
      setStatus('No obligations to export.');
      return;
    }

    const headers = ['ID', 'Title', 'Owner', 'Due date', 'Status', 'Frameworks', 'Risk', 'Notes'];
    const rows = dataset.map((obligation) => [
      obligation.id ?? '',
      obligation.title ?? '',
      obligation.owner ?? '',
      obligation.dueDate ? new Date(obligation.dueDate).toISOString() : '',
      obligation.status ?? '',
      Array.isArray(obligation.frameworkIds) ? obligation.frameworkIds.join('; ') : '',
      obligation.riskRating ?? '',
      obligation.notes ? obligation.notes.replace(/\r|\n/g, ' ') : '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    if (typeof window === 'undefined') {
      console.info('Compliance obligations export:\n', csv);
      setStatus('Obligation export available in console output.');
      return;
    }

    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `gigvora-compliance-obligations-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.rel = 'noopener';
      anchor.click();
      window.URL.revokeObjectURL(url);
      setStatus('Downloaded obligation CSV export.');
    } catch (exportError) {
      console.error('Unable to export obligations', exportError);
      setError('Failed to export obligations.');
    }
  };

  const handleCreateFramework = useCallback(
    async (payload) => {
      setCreatingFramework(true);
      setStatus('Creating framework…');
      try {
        const created = await createComplianceFramework(payload);
        setOverview((current) => ({
          ...current,
          frameworks: mergeItem(current.frameworks, created ?? payload),
        }));
        setStatus('Framework created successfully.');
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
    setStatus('Updating framework…');
    try {
      const updated = await updateComplianceFramework(frameworkId, payload);
      setOverview((current) => ({
        ...current,
        frameworks: mergeItem(current.frameworks, updated ?? { ...payload, id: frameworkId }),
      }));
      setStatus('Framework updated.');
    } catch (err) {
      setError(err?.message || 'Unable to update framework.');
    } finally {
      setBusyFrameworkId('');
    }
  }, []);

  const handleDeleteFramework = useCallback(async (frameworkId) => {
    if (!frameworkId) return;
    setBusyFrameworkId(frameworkId);
    setStatus('Deleting framework…');
    try {
      await deleteComplianceFramework(frameworkId);
      setOverview((current) => ({
        ...current,
        frameworks: (current.frameworks ?? []).filter((framework) => framework.id !== frameworkId),
      }));
      setStatus('Framework removed.');
    } catch (err) {
      setError(err?.message || 'Failed to delete framework.');
    } finally {
      setBusyFrameworkId('');
    }
  }, []);

  const handleCreateAudit = useCallback(
    async (payload) => {
      setCreatingAudit(true);
      setStatus('Scheduling audit…');
      try {
        const created = await createComplianceAudit(payload);
        setOverview((current) => ({
          ...current,
          audits: mergeItem(current.audits, created ?? payload),
        }));
        setStatus('Audit scheduled successfully.');
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
    setStatus('Updating audit…');
    try {
      const updated = await updateComplianceAudit(auditId, payload);
      setOverview((current) => ({
        ...current,
        audits: mergeItem(current.audits, updated ?? { ...payload, id: auditId }),
      }));
      setStatus('Audit updated.');
    } catch (err) {
      setError(err?.message || 'Unable to update audit.');
    } finally {
      setBusyAuditId('');
    }
  }, []);

  const handleDeleteAudit = useCallback(async (auditId) => {
    if (!auditId) return;
    setBusyAuditId(auditId);
    setStatus('Removing audit…');
    try {
      await deleteComplianceAudit(auditId);
      setOverview((current) => ({
        ...current,
        audits: (current.audits ?? []).filter((audit) => audit.id !== auditId),
      }));
      setStatus('Audit deleted.');
    } catch (err) {
      setError(err?.message || 'Failed to delete audit.');
    } finally {
      setBusyAuditId('');
    }
  }, []);

  const handleCreateObligation = useCallback(
    async (payload) => {
      setCreatingObligation(true);
      setStatus('Creating obligation…');
      try {
        const created = await createComplianceObligation(payload);
        setOverview((current) => ({
          ...current,
          obligations: mergeItem(current.obligations, created ?? payload),
        }));
        setStatus('Obligation captured.');
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
    setStatus('Updating obligation…');
    try {
      const updated = await updateComplianceObligation(obligationId, payload);
      setOverview((current) => ({
        ...current,
        obligations: mergeItem(current.obligations, updated ?? { ...payload, id: obligationId }),
      }));
      setStatus('Obligation updated.');
    } catch (err) {
      setError(err?.message || 'Unable to update obligation.');
    } finally {
      setBusyObligationId('');
    }
  }, []);

  const handleDeleteObligation = useCallback(async (obligationId) => {
    if (!obligationId) return;
    setBusyObligationId(obligationId);
    setStatus('Removing obligation…');
    try {
      await deleteComplianceObligation(obligationId);
      setOverview((current) => ({
        ...current,
        obligations: (current.obligations ?? []).filter((obligation) => obligation.id !== obligationId),
      }));
      setStatus('Obligation removed.');
    } catch (err) {
      setError(err?.message || 'Failed to delete obligation.');
    } finally {
      setBusyObligationId('');
    }
  }, []);

  const handleAttachEvidence = useCallback(async (obligationId) => {
    if (!obligationId) return;
    setStatus('Logging compliance evidence…');
    try {
      await logComplianceEvidence(obligationId, {
        message: 'Evidence placeholder logged from UI.',
      });
      setStatus('Evidence logged successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to attach evidence.');
    }
  }, []);

  const sections = useMemo(() => [
    { id: 'compliance-frameworks', title: 'Frameworks' },
    { id: 'compliance-audits', title: 'Audits' },
    { id: 'compliance-obligations', title: 'Obligations' },
    { id: 'compliance-media', title: 'Briefing' },
  ], []);

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Compliance management hub"
      subtitle="Govern frameworks, audits, and evidence with automation-first workflows"
      description="The compliance cockpit operationalises certifications, audits, DPIAs, and evidence lockers with real-time automation coverage and status tracking."
      menuSections={MENU_SECTIONS}
      sections={sections}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="space-y-12">
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Trust & compliance operations</h1>
              <p className="mt-3 text-sm text-slate-600">
                Monitor automation coverage, open obligations, and audit readiness from a single control tower. Connect Jira,
                Slack, and your evidence locker to orchestrate end-to-end workflows.
              </p>
              {error && (
                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
                  {error}
                </p>
              )}
              {status && !error && (
                <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                  {status}
                </p>
              )}
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
        </section>

        <ComplianceFrameworksPanel
          frameworks={frameworks}
          creating={creatingFramework}
          busyFrameworkId={busyFrameworkId}
          onCreate={handleCreateFramework}
          onUpdate={handleUpdateFramework}
          onDelete={handleDeleteFramework}
        />

        <ComplianceAuditSchedulePanel
          audits={audits}
          frameworks={frameworks}
          creating={creatingAudit}
          busyAuditId={busyAuditId}
          onCreate={handleCreateAudit}
          onUpdate={handleUpdateAudit}
          onDelete={handleDeleteAudit}
        />

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Obligation filters</h2>
              <p className="text-sm text-slate-600">Focus the board on specific frameworks or risk bands and export the view.</p>
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
        </section>

        <ComplianceObligationBoard
          obligations={filteredObligations}
          frameworks={frameworks}
          onCreate={handleCreateObligation}
          onUpdate={handleUpdateObligation}
          onAttachEvidence={handleAttachEvidence}
        />

        <section id="compliance-media" className="grid gap-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft lg:grid-cols-2">
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
      </div>
    </DashboardLayout>
  );
}
