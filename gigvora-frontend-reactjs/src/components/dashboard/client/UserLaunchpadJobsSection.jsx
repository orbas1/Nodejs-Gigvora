import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  fetchLaunchpadApplications,
  submitTalentApplication,
  submitEmployerBrief,
  recordEmployerPlacement,
  updateLaunchpadApplicationStatus,
} from '../../../services/launchpad.js';

const STATUS_OPTIONS = [
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'completed', label: 'Completed' },
];

const PLACEMENT_TARGETS = [
  { value: 'job', label: 'Job requisition' },
  { value: 'gig', label: 'Gig workspace' },
  { value: 'project', label: 'Project' },
];

const PLACEMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function formatScore(value) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return '—';
  }
  return numeric.toFixed(2);
}

function normalizeApplications(applications) {
  return Array.isArray(applications)
    ? applications.map((application) => ({
        ...application,
        launchpadTitle: application.launchpad?.title ?? 'Experience Launchpad',
        qualificationScore: application.qualificationScore ?? application.readiness?.score ?? null,
        recommendedStatus:
          application.readiness?.recommendedStatus ??
          application.eligibilitySnapshot?.recommendation?.recommendedStatus ??
          application.status,
      }))
    : [];
}

export default function UserLaunchpadJobsSection({ applications, onRefresh }) {
  const initialList = useMemo(() => normalizeApplications(applications), [applications]);
  const [filters, setFilters] = useState({
    launchpadId: initialList.find((app) => app.launchpad?.id)?.launchpad?.id ?? '',
    status: 'all',
    search: '',
  });
  const [workspace, setWorkspace] = useState({ items: initialList, pagination: null, statusBreakdown: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [statusBusy, setStatusBusy] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState('');
  const [statusError, setStatusError] = useState('');

  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createForm, setCreateForm] = useState({
    launchpadId: initialList.find((app) => app.launchpad?.id)?.launchpad?.id ?? '',
    applicantFirstName: '',
    applicantLastName: '',
    applicantEmail: '',
    yearsExperience: '',
    skills: '',
    targetSkills: '',
    portfolioUrl: '',
    availabilityDate: '',
    motivations: '',
  });

  const [employerBusy, setEmployerBusy] = useState(false);
  const [employerFeedback, setEmployerFeedback] = useState('');
  const [employerError, setEmployerError] = useState('');
  const [employerForm, setEmployerForm] = useState({
    launchpadId: initialList.find((app) => app.launchpad?.id)?.launchpad?.id ?? '',
    companyName: '',
    roleTitle: '',
    locations: '',
    headcount: '',
    notes: '',
  });

  const [placementBusy, setPlacementBusy] = useState(false);
  const [placementFeedback, setPlacementFeedback] = useState('');
  const [placementError, setPlacementError] = useState('');
  const [placementForm, setPlacementForm] = useState({
    applicationId: '',
    status: 'active',
    targetType: 'job',
    targetId: '',
    placementDate: '',
    endDate: '',
  });

  const normalizedApplications = useMemo(() => normalizeApplications(workspace.items), [workspace.items]);

  const statusSummary = useMemo(() => {
    const counts = STATUS_OPTIONS.reduce((acc, option) => ({ ...acc, [option.value]: 0 }), {});
    let highestScore = 0;
    normalizedApplications.forEach((application) => {
      counts[application.status] = (counts[application.status] ?? 0) + 1;
      if (Number(application.qualificationScore) > highestScore) {
        highestScore = Number(application.qualificationScore);
      }
    });
    const total = normalizedApplications.length;
    const conversionRate = total
      ? Math.round(
          ((counts.accepted + counts.completed) /
            Math.max(1, counts.screening + counts.interview + counts.accepted + counts.completed)) *
            100,
        )
      : 0;
    return { counts, total, highestScore: highestScore || null, conversionRate };
  }, [normalizedApplications]);

  const fetchWorkspace = useCallback(async () => {
    if (!filters.launchpadId) {
      setWorkspace({ items: initialList, pagination: null, statusBreakdown: null });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchLaunchpadApplications({
        launchpadId: filters.launchpadId,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined,
        includeMatches: true,
        pageSize: 25,
      });
      const items = normalizeApplications(response?.items ?? []);
      setWorkspace({ items, pagination: response?.pagination ?? null, statusBreakdown: response?.statusBreakdown ?? null });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters.launchpadId, filters.search, filters.status, initialList]);

  useEffect(() => {
    if (!filters.launchpadId && initialList.length) {
      const candidate = initialList.find((application) => application.launchpad?.id);
      if (candidate?.launchpad?.id) {
        setFilters((previous) => ({ ...previous, launchpadId: candidate.launchpad.id }));
      }
    }
  }, [filters.launchpadId, initialList]);

  useEffect(() => {
    if (!filters.launchpadId) {
      setWorkspace({ items: initialList, pagination: null, statusBreakdown: null });
    }
  }, [filters.launchpadId, initialList]);

  useEffect(() => {
    if (filters.launchpadId) {
      setCreateForm((previous) => ({ ...previous, launchpadId: previous.launchpadId || filters.launchpadId }));
      setEmployerForm((previous) => ({ ...previous, launchpadId: previous.launchpadId || filters.launchpadId }));
    }
  }, [filters.launchpadId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const handleStatusChange = useCallback(
    async (applicationId, status) => {
      if (!applicationId || !status) {
        return;
      }
      setStatusBusy(true);
      setStatusFeedback('');
      setStatusError('');
      try {
        await updateLaunchpadApplicationStatus(applicationId, { status });
        setWorkspace((previous) => ({
          ...previous,
          items: previous.items.map((item) => (item.id === applicationId ? { ...item, status } : item)),
        }));
        setStatusFeedback('Application status updated.');
        setLastUpdated(new Date());
        await onRefresh?.();
      } catch (err) {
        setStatusError(err?.message ?? 'Unable to update Launchpad application.');
      } finally {
        setStatusBusy(false);
      }
    },
    [onRefresh],
  );

  const handleCreateChange = useCallback((event) => {
    const { name, value } = event.target;
    setCreateForm((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handleCreateSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setCreateBusy(true);
      setCreateError('');
      setCreateSuccess('');
      try {
        const payload = {
          launchpadId: createForm.launchpadId ? Number(createForm.launchpadId) : undefined,
          applicantFirstName: createForm.applicantFirstName.trim() || undefined,
          applicantLastName: createForm.applicantLastName.trim() || undefined,
          applicantEmail: createForm.applicantEmail.trim() || undefined,
          yearsExperience: createForm.yearsExperience ? Number(createForm.yearsExperience) : undefined,
          skills: createForm.skills,
          targetSkills: createForm.targetSkills,
          portfolioUrl: createForm.portfolioUrl.trim() || undefined,
          availabilityDate: createForm.availabilityDate || undefined,
          motivations: createForm.motivations.trim() || undefined,
        };
        await submitTalentApplication(payload);
        setCreateSuccess('Launchpad application submitted for review. Scoring will appear shortly.');
        setCreateForm((previous) => ({
          ...previous,
          applicantFirstName: '',
          applicantLastName: '',
          applicantEmail: '',
          yearsExperience: '',
          skills: '',
          targetSkills: '',
          portfolioUrl: '',
          availabilityDate: '',
          motivations: '',
        }));
        await fetchWorkspace();
        await onRefresh?.();
      } catch (err) {
        setCreateError(err?.message ?? 'Unable to submit Launchpad application.');
      } finally {
        setCreateBusy(false);
      }
    },
    [createForm, fetchWorkspace, onRefresh],
  );

  const handleEmployerChange = useCallback((event) => {
    const { name, value } = event.target;
    setEmployerForm((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handleEmployerSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setEmployerBusy(true);
      setEmployerFeedback('');
      setEmployerError('');
      try {
        const payload = {
          launchpadId: employerForm.launchpadId ? Number(employerForm.launchpadId) : undefined,
          companyName: employerForm.companyName.trim(),
          roleTitle: employerForm.roleTitle.trim(),
          locations: employerForm.locations ? employerForm.locations.split(',').map((entry) => entry.trim()) : [],
          headcount: employerForm.headcount ? Number(employerForm.headcount) : undefined,
          notes: employerForm.notes.trim() || undefined,
        };
        await submitEmployerBrief(payload);
        setEmployerFeedback('Employer brief submitted. The talent team will review and surface matches.');
        setEmployerForm((previous) => ({ ...previous, roleTitle: '', locations: '', headcount: '', notes: '' }));
        await fetchWorkspace();
        await onRefresh?.();
      } catch (err) {
        setEmployerError(err?.message ?? 'Unable to submit employer request.');
      } finally {
        setEmployerBusy(false);
      }
    },
    [employerForm, fetchWorkspace, onRefresh],
  );

  const handlePlacementChange = useCallback((event) => {
    const { name, value } = event.target;
    setPlacementForm((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handlePlacementSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setPlacementBusy(true);
      setPlacementFeedback('');
      setPlacementError('');
      try {
        const payload = {
          applicationId: placementForm.applicationId ? Number(placementForm.applicationId) : undefined,
          status: placementForm.status,
          targetType: placementForm.targetType,
          targetId: placementForm.targetId ? Number(placementForm.targetId) : undefined,
          placementDate: placementForm.placementDate || undefined,
          endDate: placementForm.endDate || undefined,
        };
        await recordEmployerPlacement(payload);
        setPlacementFeedback('Placement recorded. Programme dashboards updated.');
        setPlacementForm((previous) => ({
          ...previous,
          status: 'active',
          targetType: 'job',
          targetId: '',
          placementDate: '',
          endDate: '',
        }));
        await fetchWorkspace();
        await onRefresh?.();
      } catch (err) {
        setPlacementError(err?.message ?? 'Unable to record placement.');
      } finally {
        setPlacementBusy(false);
      }
    },
    [fetchWorkspace, onRefresh, placementForm],
  );

  return (
    <section
      id="user-launchpad-jobs"
      className="space-y-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-500">Experience Launchpad</p>
          <h2 className="text-3xl font-semibold text-slate-900">Cohort applications and programme readiness</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Track candidate momentum, update statuses in real time, and capture employer demand without leaving mission control.
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700 shadow-sm">
          <span>{statusSummary.total} applications in play</span>
          <span>Top score {statusSummary.highestScore != null ? formatScore(statusSummary.highestScore) : '—'}</span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => event.preventDefault()}>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            <span className="font-semibold uppercase tracking-wide">Launchpad ID</span>
            <input
              type="number"
              value={filters.launchpadId}
              onChange={(event) => setFilters((previous) => ({ ...previous, launchpadId: event.target.value }))}
              placeholder="e.g. 12"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              <span className="font-semibold uppercase tracking-wide">Status</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="all">All</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              <span className="font-semibold uppercase tracking-wide">Search</span>
              <input
                type="search"
                value={filters.search}
                onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))}
                placeholder="Name, email, cohort"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
          </div>
          <div className="flex items-end justify-end gap-2">
            <button
              type="button"
              onClick={() => fetchWorkspace()}
              className="rounded-full border border-amber-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-600 transition hover:border-amber-300 hover:text-amber-700"
            >
              Apply filters
            </button>
          </div>
        </form>
        {lastUpdated ? (
          <p className="mt-3 text-xs text-slate-500">Last synced {formatDate(lastUpdated)}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {STATUS_OPTIONS.map((option) => (
          <div key={option.value} className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{option.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{statusSummary.counts[option.value] ?? 0}</p>
          </div>
        ))}
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline conversion</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{statusSummary.conversionRate}%</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Application workspace</h3>
            <p className="text-sm text-slate-500">Click a row to reveal the recommended status and last reviewer notes.</p>
          </div>
          {loading ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Loading…</span>
          ) : null}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
            <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Launchpad</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Recommended</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {normalizedApplications.length ? (
                normalizedApplications.map((application) => (
                  <tr key={application.id} className="transition hover:bg-amber-50/60">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{application.launchpadTitle}</span>
                        <span className="text-xs text-slate-500">#{application.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {application.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {application.recommendedStatus?.replace(/_/g, ' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatScore(application.qualificationScore)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(application.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={application.status}
                          onChange={(event) => handleStatusChange(application.id, event.target.value)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          disabled={statusBusy}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <details className="group">
                          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-amber-600 transition group-open:text-amber-700">
                            Snapshot
                          </summary>
                          <div className="mt-2 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm">
                            <p className="font-semibold">Eligibility summary</p>
                            <p className="mt-1">
                              Matched skills: {application.eligibilitySnapshot?.evaluation?.matchedSkills?.join(', ') || '—'}
                            </p>
                            <p className="mt-1">
                              Missing skills: {application.eligibilitySnapshot?.evaluation?.missingSkills?.join(', ') || '—'}
                            </p>
                            <p className="mt-1">
                              Learning focus: {application.eligibilitySnapshot?.evaluation?.learningAlignedMissing?.join(', ') || '—'}
                            </p>
                          </div>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                    No Launchpad applications yet. Use the form below to submit your first profile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {statusFeedback ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusFeedback}
          </div>
        ) : null}
        {statusError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{statusError}</div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCreateSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-inner">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Submit a Launchpad application</h3>
            <p className="text-sm text-slate-500">
              Provide core details for the Launchpad talent team. We score the application, surface readiness, and notify when interviews are ready.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Launchpad ID</span>
              <input
                type="number"
                name="launchpadId"
                value={createForm.launchpadId}
                onChange={handleCreateChange}
                required
                placeholder="e.g. 12"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">First name</span>
              <input
                type="text"
                name="applicantFirstName"
                value={createForm.applicantFirstName}
                onChange={handleCreateChange}
                required
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Last name</span>
              <input
                type="text"
                name="applicantLastName"
                value={createForm.applicantLastName}
                onChange={handleCreateChange}
                required
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Email</span>
              <input
                type="email"
                name="applicantEmail"
                value={createForm.applicantEmail}
                onChange={handleCreateChange}
                required
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Years experience</span>
              <input
                type="number"
                name="yearsExperience"
                value={createForm.yearsExperience}
                onChange={handleCreateChange}
                step="0.5"
                min="0"
                placeholder="e.g. 4"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Availability date</span>
              <input
                type="date"
                name="availabilityDate"
                value={createForm.availabilityDate}
                onChange={handleCreateChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Signature skills</span>
            <input
              type="text"
              name="skills"
              value={createForm.skills}
              onChange={handleCreateChange}
              required
              placeholder="Product strategy, Analytics storytelling"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Skills to develop</span>
            <input
              type="text"
              name="targetSkills"
              value={createForm.targetSkills}
              onChange={handleCreateChange}
              placeholder="AI product leadership, Venture operations"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Portfolio URL</span>
            <input
              type="url"
              name="portfolioUrl"
              value={createForm.portfolioUrl}
              onChange={handleCreateChange}
              placeholder="https://portfolio.site"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Motivations</span>
            <textarea
              name="motivations"
              value={createForm.motivations}
              onChange={handleCreateChange}
              rows={3}
              placeholder="Tell the Launchpad team why this cohort is a fit."
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          {createBusy ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Submitting application…</p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createBusy}
              className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              Submit application
            </button>
          </div>
          {createSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{createSuccess}</div>
          ) : null}
          {createError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{createError}</div>
          ) : null}
        </form>

        <form onSubmit={handleEmployerSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-inner">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Employer brief</h3>
            <p className="text-sm text-slate-500">Capture demand directly from hiring partners and keep operations in sync.</p>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Launchpad ID</span>
            <input
              type="number"
              name="launchpadId"
              value={employerForm.launchpadId}
              onChange={handleEmployerChange}
              placeholder={filters.launchpadId || 'e.g. 12'}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Company name</span>
            <input
              type="text"
              name="companyName"
              value={employerForm.companyName}
              onChange={handleEmployerChange}
              required
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Role title</span>
            <input
              type="text"
              name="roleTitle"
              value={employerForm.roleTitle}
              onChange={handleEmployerChange}
              required
              placeholder="Launch strategist"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Locations</span>
            <input
              type="text"
              name="locations"
              value={employerForm.locations}
              onChange={handleEmployerChange}
              placeholder="London, Remote EU"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Headcount needed</span>
            <input
              type="number"
              name="headcount"
              value={employerForm.headcount}
              onChange={handleEmployerChange}
              min="1"
              placeholder="3"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Notes</span>
            <textarea
              name="notes"
              value={employerForm.notes}
              onChange={handleEmployerChange}
              rows={3}
              placeholder="Hiring targets, interview panels, compensation range."
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          {employerBusy ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Submitting employer brief…</p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={employerBusy}
              className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              Submit employer brief
            </button>
          </div>
          {employerFeedback ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{employerFeedback}</div>
          ) : null}
          {employerError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{employerError}</div>
          ) : null}
        </form>
      </div>

      <form onSubmit={handlePlacementSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-inner">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">Record placement</h3>
          <p className="text-sm text-slate-500">Keep the Launchpad pipeline aligned with real-world hires.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Application ID</span>
            <input
              type="number"
              name="applicationId"
              value={placementForm.applicationId}
              onChange={handlePlacementChange}
              placeholder={normalizedApplications[0]?.id ?? '1234'}
              required
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Status</span>
            <select
              name="status"
              value={placementForm.status}
              onChange={handlePlacementChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {PLACEMENT_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Target type</span>
            <select
              name="targetType"
              value={placementForm.targetType}
              onChange={handlePlacementChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {PLACEMENT_TARGETS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Target ID</span>
            <input
              type="number"
              name="targetId"
              value={placementForm.targetId}
              onChange={handlePlacementChange}
              placeholder="5678"
              required
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Placement date</span>
            <input
              type="date"
              name="placementDate"
              value={placementForm.placementDate}
              onChange={handlePlacementChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">End date</span>
            <input
              type="date"
              name="endDate"
              value={placementForm.endDate}
              onChange={handlePlacementChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
        </div>
        {placementBusy ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Recording placement…</p>
        ) : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={placementBusy}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            Record placement
          </button>
        </div>
        {placementFeedback ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{placementFeedback}</div>
        ) : null}
        {placementError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{placementError}</div>
        ) : null}
      </form>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error?.message ?? 'Launchpad workspace unavailable. Adjust filters or refresh later.'}
        </div>
      ) : null}
    </section>
  );
}

UserLaunchpadJobsSection.propTypes = {
  applications: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func,
};

UserLaunchpadJobsSection.defaultProps = {
  applications: [],
  onRefresh: null,
};
