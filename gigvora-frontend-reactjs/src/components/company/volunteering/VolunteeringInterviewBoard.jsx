import { useMemo, useState } from 'react';
import { FunnelIcon, PlusIcon, VideoCameraIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { INTERVIEW_STATUSES } from './volunteeringOptions.js';

const STATUS_FILTERS = [{ value: 'all', label: 'All' }, ...INTERVIEW_STATUSES];
const TIME_FILTERS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function VolunteeringInterviewBoard({
  interviews = [],
  applications = [],
  busy = false,
  onScheduleInterview,
  onUpdateInterview,
  onDeleteInterview,
  onSelectApplication,
}) {
  const [statusFilter, setStatusFilter] = useState('upcoming');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [form, setForm] = useState({
    applicationId: '',
    scheduledAt: '',
    durationMinutes: 45,
    location: '',
    meetingUrl: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const applicationOptions = useMemo(
    () =>
      applications.map((application) => ({
        value: application.id,
        label: application.candidateName || 'Unnamed candidate',
        subtitle: application.post?.title ?? 'No post assigned',
      })),
    [applications],
  );

  const filteredInterviews = useMemo(() => {
    const now = new Date();
    return interviews.filter((interview) => {
      const matchesStatus =
        statusFilter === 'all' || interview.status === statusFilter || (statusFilter === 'upcoming' && interview.status === 'scheduled');
      const interviewDate = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
      let matchesTime = true;
      if (timeFilter === 'upcoming') {
        matchesTime = interviewDate ? interviewDate >= now : false;
      } else if (timeFilter === 'past') {
        matchesTime = interviewDate ? interviewDate < now : false;
      }
      return matchesStatus && matchesTime;
    });
  }, [interviews, statusFilter, timeFilter]);

  const handleFormChange = (field) => (event) => {
    const value = field === 'durationMinutes' ? Number(event.target.value) : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.applicationId || !form.scheduledAt) {
      setError('Pick a candidate and time.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onScheduleInterview?.(form.applicationId, {
        scheduledAt: form.scheduledAt,
        durationMinutes: form.durationMinutes || undefined,
        location: form.location || undefined,
        meetingUrl: form.meetingUrl || undefined,
      });
      setForm({
        applicationId: '',
        scheduledAt: '',
        durationMinutes: 45,
        location: '',
        meetingUrl: '',
      });
    } catch (submissionError) {
      setError(submissionError?.message || 'Could not schedule interview.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (interviewId, nextStatus) => {
    if (!interviewId || !nextStatus) return;
    try {
      await onUpdateInterview?.(interviewId, { status: nextStatus });
    } catch (updateError) {
      console.error(updateError);
    }
  };

  const handleDelete = async (interviewId) => {
    if (!interviewId) return;
    try {
      await onDeleteInterview?.(interviewId);
    } catch (deleteError) {
      console.error(deleteError);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Interviews</h2>
        <p className="text-sm text-slate-500">Manage schedules and move quickly between conversations.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Schedule</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm text-slate-600">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate</span>
                <select
                  value={form.applicationId}
                  onChange={handleFormChange('applicationId')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="" disabled>
                    Select candidate
                  </option>
                  {applicationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} · {option.subtitle}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</span>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={handleFormChange('scheduledAt')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration (minutes)</span>
                <input
                  type="number"
                  min="15"
                  step="5"
                  value={form.durationMinutes}
                  onChange={handleFormChange('durationMinutes')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</span>
                <input
                  value={form.location}
                  onChange={handleFormChange('location')}
                  placeholder="Office or virtual"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting link</span>
                <input
                  value={form.meetingUrl}
                  onChange={handleFormChange('meetingUrl')}
                  placeholder="https://"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </label>
              {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting || busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                Schedule
              </button>
            </form>
          </div>
        </div>

        <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <label className="inline-flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <select
              value={timeFilter}
              onChange={(event) => setTimeFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {TIME_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[640px] overflow-y-auto pr-1">
            <table className="w-full table-fixed border-separate border-spacing-y-3 text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="rounded-l-2xl bg-slate-50 px-4 py-2">When</th>
                  <th className="bg-slate-50 px-4 py-2">Candidate</th>
                  <th className="bg-slate-50 px-4 py-2">Status</th>
                  <th className="bg-slate-50 px-4 py-2">Location</th>
                  <th className="rounded-r-2xl bg-slate-50 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.length ? (
                  filteredInterviews.map((interview) => {
                    const application = applications.find((item) => item.id === interview.applicationId);
                    const candidateName = application?.candidateName || 'Unnamed candidate';
                    const postTitle = application?.post?.title ?? 'No post assigned';
                    return (
                      <tr key={interview.id} className="rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm">
                        <td className="rounded-l-2xl px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{formatDate(interview.scheduledAt)}</span>
                            <span className="text-xs">{interview.durationMinutes ?? 0} min</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onSelectApplication?.(interview.applicationId)}
                            className="text-left text-sm font-semibold text-blue-600 hover:underline"
                          >
                            {candidateName}
                          </button>
                          <p className="text-xs text-slate-500">{postTitle}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={interview.status}
                            onChange={(event) => handleStatusChange(interview.id, event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                          >
                            {INTERVIEW_STATUSES.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-xs">
                            {interview.location ? (
                              <span className="inline-flex items-center gap-2 text-slate-600">
                                <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                                {interview.location}
                              </span>
                            ) : null}
                            {interview.meetingUrl ? (
                              <a
                                href={interview.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                              >
                                <VideoCameraIcon className="h-4 w-4" aria-hidden="true" />
                                Join call
                              </a>
                            ) : null}
                          </div>
                        </td>
                        <td className="rounded-r-2xl px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(interview.id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-12 text-center text-sm text-slate-500">
                      No interviews match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
