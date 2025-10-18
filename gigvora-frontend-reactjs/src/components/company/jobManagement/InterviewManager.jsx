
import { useMemo, useState } from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }
  return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function InterviewManager({ interviews, applications, onSchedule, onUpdate }) {
  const [formState, setFormState] = useState({
    applicationId: '',
    interviewStage: 'Interview',
    scheduledAt: '',
    durationMinutes: '45',
  });
  const [submitting, setSubmitting] = useState(false);

  const applicationOptions = useMemo(() => {
    return (applications ?? []).map((application) => ({
      id: application.id,
      label: `${application.candidate?.name ?? application.candidateName ?? 'Candidate'} • ${application.jobTitle ?? ''}`.trim(),
    }));
  }, [applications]);

  const upcoming = useMemo(() => {
    return (interviews ?? [])
      .map((interview) => ({
        ...interview,
        scheduledAt: interview.scheduledAt ?? interview.startAt ?? interview.createdAt,
      }))
      .sort((a, b) => new Date(a.scheduledAt ?? 0) - new Date(b.scheduledAt ?? 0));
  }, [interviews]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.applicationId || !formState.scheduledAt) {
      return;
    }
    try {
      setSubmitting(true);
      await onSchedule?.({
        applicationId: formState.applicationId,
        interviewStage: formState.interviewStage,
        scheduledAt: formState.scheduledAt,
        durationMinutes: formState.durationMinutes ? Number(formState.durationMinutes) : null,
      });
      setFormState({ applicationId: '', interviewStage: 'Interview', scheduledAt: '', durationMinutes: '45' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900">Upcoming</h4>
        <ul className="mt-3 space-y-3">
          {upcoming.length ? (
            upcoming.slice(0, 10).map((interview) => (
              <li key={interview.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {interview.application?.applicant?.firstName ?? interview.application?.applicant?.email ?? 'Candidate'}
                    </p>
                    <p className="text-xs text-slate-500">{interview.interviewStage ?? 'Interview'} • {formatDate(interview.scheduledAt)}</p>
                  </div>
                  {onUpdate ? (
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600"
                      onClick={() =>
                        onUpdate?.({
                          id: interview.id,
                          completedAt: new Date().toISOString(),
                          interviewStage: interview.interviewStage,
                        })
                      }
                    >
                      Complete
                    </button>
                  ) : null}
                </div>
                {interview.interviewerRoster?.length ? (
                  <p className="mt-2 text-xs text-slate-500">
                    {interview.interviewerRoster.map((roster) => roster.name ?? roster).join(', ')}
                  </p>
                ) : null}
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-3 py-6 text-sm text-slate-500">No interviews.</li>
          )}
        </ul>
      </div>
      <form className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm" onSubmit={handleSubmit}>
        <h4 className="text-sm font-semibold text-slate-900">Schedule</h4>
        <div className="mt-3 grid gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Candidate
            <select
              name="applicationId"
              value={formState.applicationId}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">Select</option>
              {applicationOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Stage
            <input
              name="interviewStage"
              value={formState.interviewStage}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Stage"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Date & time
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-slate-400" />
              <input
                type="datetime-local"
                name="scheduledAt"
                value={formState.scheduledAt}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Duration (minutes)
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-slate-400" />
              <input
                type="number"
                name="durationMinutes"
                min="15"
                step="5"
                value={formState.durationMinutes}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {submitting ? 'Scheduling…' : 'Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
}
