import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

function toInputDateTime(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function sanitizeApplications(applications) {
  return Array.isArray(applications) ? applications.filter((application) => application && application.id != null) : [];
}

function buildInitialValues(interview, applications) {
  const safeApplications = sanitizeApplications(applications);
  if (!interview) {
    return {
      applicationId: safeApplications[0]?.id ?? '',
      scheduledAt: '',
      status: 'scheduled',
      type: 'phone',
      interviewerName: '',
      location: '',
      meetingUrl: '',
      durationMinutes: '',
      notes: '',
    };
  }
  return {
    applicationId: interview.applicationId,
    scheduledAt: toInputDateTime(interview.scheduledAt),
    status: interview.status ?? 'scheduled',
    type: interview.type ?? 'phone',
    interviewerName: interview.interviewerName ?? '',
    location: interview.location ?? '',
    meetingUrl: interview.meetingUrl ?? '',
    durationMinutes: interview.durationMinutes ?? '',
    notes: interview.notes ?? '',
  };
}

function validate(values) {
  const errors = {};
  if (!values.applicationId) {
    errors.applicationId = 'Select application';
  }
  if (!values.scheduledAt) {
    errors.scheduledAt = 'Add a time';
  }
  return errors;
}

function preparePayload(values) {
  return {
    applicationId: Number(values.applicationId),
    scheduledAt: new Date(values.scheduledAt).toISOString(),
    status: values.status,
    type: values.type,
    interviewerName: values.interviewerName.trim() || null,
    location: values.location.trim() || null,
    meetingUrl: values.meetingUrl.trim() || null,
    durationMinutes: values.durationMinutes === '' ? null : Number(values.durationMinutes),
    notes: values.notes.trim() || null,
  };
}

export default function InterviewForm({
  mode,
  applications,
  initialInterview,
  statusOptions,
  typeOptions,
  busy,
  error,
  onSubmit,
  onCancel,
  onDelete,
}) {
  const [values, setValues] = useState(() => buildInitialValues(initialInterview, applications));
  const [touched, setTouched] = useState({});
  const errors = useMemo(() => validate(values), [values]);
  const showError = (name) => touched[name] && errors[name];
  const safeApplications = useMemo(() => sanitizeApplications(applications), [applications]);
  const hasApplicationOptions = safeApplications.length > 0;

  useEffect(() => {
    setValues(buildInitialValues(initialInterview, applications));
    setTouched({});
  }, [initialInterview, applications]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'durationMinutes') {
      const cleaned = value === '' ? '' : value.replace(/[^0-9]/g, '');
      setValues((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched((prev) => ({ ...prev, applicationId: true, scheduledAt: true }));
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit(preparePayload(values));
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application</span>
          <select
            name="applicationId"
            value={values.applicationId}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={mode === 'edit'}
            className={`rounded-xl border px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              showError('applicationId') ? 'border-rose-300' : 'border-slate-200'
            }`}
          >
            {mode === 'create' ? (
              <option value="" disabled={!hasApplicationOptions}>
                {hasApplicationOptions ? 'Select an application' : 'Create an application to schedule an interview'}
              </option>
            ) : null}
            {safeApplications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.detail?.title ?? 'Opportunity'} — {application.detail?.companyName ?? 'Company'}
              </option>
            ))}
          </select>
          {showError('applicationId') ? <span className="text-xs text-rose-500">{errors.applicationId}</span> : null}
          {!hasApplicationOptions ? (
            <span className="text-xs text-slate-500">Add an application from the job hub to enable scheduling.</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled</span>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={values.scheduledAt}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`rounded-xl border px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              showError('scheduledAt') ? 'border-rose-300' : 'border-slate-200'
            }`}
          />
          {showError('scheduledAt') ? <span className="text-xs text-rose-500">{errors.scheduledAt}</span> : null}
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <select
              name="status"
              value={values.status}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
            <select
              name="type"
              value={values.type}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interviewer</span>
            <input
              name="interviewerName"
              value={values.interviewerName}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Jane Doe"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</span>
            <input
              name="location"
              value={values.location}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Zoom"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Link</span>
            <input
              name="meetingUrl"
              value={values.meetingUrl}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="https://"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration (min)</span>
            <input
              name="durationMinutes"
              value={values.durationMinutes}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="45"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
          <textarea
            name="notes"
            rows={4}
            value={values.notes}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Prep topics"
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">{error.message ?? 'Unable to save right now.'}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {mode === 'edit' && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              Delete
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
        <button
          type="submit"
          disabled={busy || !hasApplicationOptions}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {mode === 'edit' ? 'Save changes' : 'Schedule'}
        </button>
      </div>
    </form>
  );
}

InterviewForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  applications: PropTypes.arrayOf(PropTypes.object).isRequired,
  initialInterview: PropTypes.object,
  statusOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  typeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  busy: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
};

InterviewForm.defaultProps = {
  initialInterview: null,
  busy: false,
  error: null,
  onDelete: undefined,
};
