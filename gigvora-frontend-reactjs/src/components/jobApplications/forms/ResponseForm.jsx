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

function buildInitialValues(response, applications) {
  const safeApplications = sanitizeApplications(applications);
  if (!response) {
    return {
      applicationId: safeApplications[0]?.id ?? '',
      direction: 'incoming',
      channel: 'email',
      status: 'pending',
      subject: '',
      body: '',
      sentAt: '',
      followUpRequiredAt: '',
    };
  }
  return {
    applicationId: response.applicationId,
    direction: response.direction ?? 'incoming',
    channel: response.channel ?? 'email',
    status: response.status ?? 'pending',
    subject: response.subject ?? '',
    body: response.body ?? '',
    sentAt: toInputDateTime(response.sentAt),
    followUpRequiredAt: toInputDateTime(response.followUpRequiredAt),
  };
}

function validate(values) {
  const errors = {};
  if (!values.applicationId) {
    errors.applicationId = 'Select application';
  }
  if (!values.sentAt) {
    errors.sentAt = 'Add when it happened';
  }
  return errors;
}

function preparePayload(values) {
  return {
    applicationId: Number(values.applicationId),
    direction: values.direction,
    channel: values.channel,
    status: values.status,
    subject: values.subject.trim() || null,
    body: values.body.trim() || null,
    sentAt: values.sentAt ? new Date(values.sentAt).toISOString() : undefined,
    followUpRequiredAt: values.followUpRequiredAt ? new Date(values.followUpRequiredAt).toISOString() : null,
  };
}

export default function ResponseForm({
  mode,
  applications,
  directionOptions,
  channelOptions,
  statusOptions,
  initialResponse,
  busy,
  error,
  onSubmit,
  onCancel,
  onDelete,
}) {
  const [values, setValues] = useState(() => buildInitialValues(initialResponse, applications));
  const [touched, setTouched] = useState({});
  const errors = useMemo(() => validate(values), [values]);
  const showError = (name) => touched[name] && errors[name];
  const safeApplications = useMemo(() => sanitizeApplications(applications), [applications]);
  const hasApplicationOptions = safeApplications.length > 0;

  useEffect(() => {
    setValues(buildInitialValues(initialResponse, applications));
    setTouched({});
  }, [initialResponse, applications]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched((prev) => ({ ...prev, applicationId: true, sentAt: true }));
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    if (!hasApplicationOptions) {
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
                {hasApplicationOptions ? 'Select an application' : 'Create an application to log responses'}
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
            <span className="text-xs text-slate-500">Add an application to capture recruiter replies and follow-ups.</span>
          ) : null}
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Direction</span>
            <select
              name="direction"
              value={values.direction}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {directionOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channel</span>
            <select
              name="channel"
              value={values.channel}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {channelOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
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
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sent</span>
          <input
            type="datetime-local"
            name="sentAt"
            value={values.sentAt}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`rounded-xl border px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              showError('sentAt') ? 'border-rose-300' : 'border-slate-200'
            }`}
          />
          {showError('sentAt') ? <span className="text-xs text-rose-500">{errors.sentAt}</span> : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Follow up</span>
          <input
            type="datetime-local"
            name="followUpRequiredAt"
            value={values.followUpRequiredAt}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</span>
          <input
            name="subject"
            value={values.subject}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Interview invite"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</span>
          <textarea
            name="body"
            rows={5}
            value={values.body}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Copy the reply"
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
          {mode === 'edit' ? 'Save changes' : 'Log'}
        </button>
      </div>
    </form>
  );
}

ResponseForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  applications: PropTypes.arrayOf(PropTypes.object).isRequired,
  directionOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  channelOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  statusOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  initialResponse: PropTypes.object,
  busy: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
};

ResponseForm.defaultProps = {
  initialResponse: null,
  busy: false,
  error: null,
  onDelete: undefined,
};
