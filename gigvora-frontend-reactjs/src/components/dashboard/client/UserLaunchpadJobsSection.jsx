import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  submitTalentApplication,
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
  return `${numeric.toFixed(2)}`;
}

function normalizeApplications(applications) {
  return Array.isArray(applications)
    ? applications.map((application) => ({
        ...application,
        launchpadTitle: application.launchpad?.title ?? 'Experience Launchpad',
        recommendedStatus:
          application.eligibilitySnapshot?.recommendation?.recommendedStatus ?? application.status,
        qualificationScore:
          application.eligibilitySnapshot?.recommendation?.qualificationScore ?? application.qualificationScore ?? null,
      }))
    : [];
}

export default function UserLaunchpadJobsSection({ applications, onRefresh }) {
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createForm, setCreateForm] = useState({
    launchpadId: '',
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

  const normalizedApplications = useMemo(() => normalizeApplications(applications), [applications]);

  const statusSummary = useMemo(() => {
    const counts = STATUS_OPTIONS.reduce((acc, option) => ({ ...acc, [option.value]: 0 }), {});
    let highestScore = 0;
    normalizedApplications.forEach((application) => {
      counts[application.status] = (counts[application.status] ?? 0) + 1;
      if (application.qualificationScore && application.qualificationScore > highestScore) {
        highestScore = application.qualificationScore;
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

  const handleStatusChange = useCallback(
    async (applicationId, status) => {
      if (!applicationId || !status) {
        return;
      }
      setStatusBusy(true);
      setStatusError('');
      setStatusMessage('');
      try {
        await updateLaunchpadApplicationStatus(applicationId, { status });
        setStatusMessage('Application status updated.');
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
        const response = await submitTalentApplication(payload);
        setCreateSuccess('Launchpad application submitted. You will receive an eligibility score shortly.');
        setCreateForm({
          launchpadId: createForm.launchpadId,
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
        await onRefresh?.(response);
      } catch (err) {
        setCreateError(err?.message ?? 'Unable to submit Launchpad application.');
      } finally {
        setCreateBusy(false);
      }
    },
    [createForm, onRefresh],
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
            Track applications into Launchpad fellowships, align statuses with programme managers, and spin up new submissions
            without leaving mission control.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700 shadow-sm">
          {statusSummary.total} applications in play
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {STATUS_OPTIONS.map((option) => (
          <div key={option.value} className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{option.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {statusSummary.counts[option.value] ?? 0}
            </p>
          </div>
        ))}
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top score</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statusSummary.highestScore != null ? formatScore(statusSummary.highestScore) : '—'}
          </p>
        </div>
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
          {statusBusy ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Saving…</span>
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
                      {application.recommendedStatus.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {formatScore(application.qualificationScore)}
                    </td>
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
                              Learning focus: {
                                application.eligibilitySnapshot?.evaluation?.learningAlignedMissing?.join(', ') || '—'
                              }
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
        {statusMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}
        {statusError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{statusError}</div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Submit a Launchpad application</h3>
          <p className="text-sm text-slate-500">
            Provide core details for the Launchpad talent team. We will score the application and notify you when interviews are
            ready to schedule.
          </p>
        </div>
        <form onSubmit={handleCreateSubmit} className="mt-6 space-y-5">
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
              placeholder="Service design, Product analytics"
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
              placeholder="https://portfolio.example.com"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Motivations</span>
            <textarea
              name="motivations"
              value={createForm.motivations}
              onChange={handleCreateChange}
              rows={4}
              placeholder="Outline the impact you want to deliver through the Launchpad."
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          {createError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{createError}</div>
          ) : null}
          {createSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {createSuccess}
            </div>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={createBusy}
            >
              {createBusy ? 'Submitting…' : 'Submit application'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

UserLaunchpadJobsSection.propTypes = {
  applications: PropTypes.array,
  onRefresh: PropTypes.func,
};

UserLaunchpadJobsSection.defaultProps = {
  applications: [],
  onRefresh: null,
};
