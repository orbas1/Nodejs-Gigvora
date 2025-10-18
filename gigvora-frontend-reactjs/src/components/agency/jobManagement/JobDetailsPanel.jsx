import { useEffect, useMemo, useState } from 'react';
import {
  CalendarIcon,
  ChatBubbleOvalLeftIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  PhoneIcon,
  PlusIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function JobEditForm({ job, metadata, onUpdate, isSubmitting }) {
  const [form, setForm] = useState(() => ({
    status: job?.status ?? 'draft',
    summary: job?.summary ?? '',
    requirements: job?.requirements ?? '',
    responsibilities: job?.responsibilities ?? '',
    location: job?.location ?? '',
    remoteAvailable: Boolean(job?.remoteAvailable ?? true),
    closesAt: job?.closesAt ? job.closesAt.slice(0, 10) : '',
  }));

  useEffect(() => {
    setForm({
      status: job?.status ?? 'draft',
      summary: job?.summary ?? '',
      requirements: job?.requirements ?? '',
      responsibilities: job?.responsibilities ?? '',
      location: job?.location ?? '',
      remoteAvailable: Boolean(job?.remoteAvailable ?? true),
      closesAt: job?.closesAt ? job.closesAt.slice(0, 10) : '',
    });
  }, [job?.id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onUpdate?.({
      ...form,
      closesAt: form.closesAt || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Status
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
          >
            {(metadata?.jobStatuses ?? ['draft']).map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Location
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
            placeholder="Remote first"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Close date
          <input
            type="date"
            name="closesAt"
            value={form.closesAt}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="remoteAvailable"
          checked={Boolean(form.remoteAvailable)}
          onChange={handleChange}
          className="h-4 w-4 rounded border border-slate-300 text-accent focus:ring-accent"
        />
        Remote friendly role
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Summary
        <textarea
          name="summary"
          value={form.summary}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
          placeholder="Why this role exists and what outcomes matter."
        />
      </label>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Responsibilities
          <textarea
            name="responsibilities"
            value={form.responsibilities}
            onChange={handleChange}
            rows={5}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
            placeholder="Key outcomes, cadence, and cross-functional partners."
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Requirements
          <textarea
            name="requirements"
            value={form.requirements}
            onChange={handleChange}
            rows={5}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
            placeholder="Must-have skills, years of experience, and certifications."
          />
        </label>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : 'Save updates'}
        </button>
      </div>
    </form>
  );
}

function ApplicationCard({ application, isSelected, onSelect, onUpdate, metadata, isUpdating }) {
  const [status, setStatus] = useState(application?.status ?? 'new');
  const [stage, setStage] = useState(application?.stage ?? '');

  useEffect(() => {
    setStatus(application?.status ?? 'new');
    setStage(application?.stage ?? '');
  }, [application?.id]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onUpdate?.({ status, stage });
  };

  return (
    <div
      className={classNames(
        'rounded-2xl border border-slate-200 p-4 transition',
        isSelected ? 'border-accent shadow-sm' : 'bg-slate-50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onSelect}
            className="text-left text-sm font-semibold text-slate-900 hover:text-accent"
          >
            {application.candidateName}
          </button>
          <p className="text-xs text-slate-500">{application.candidateEmail || 'No email'}</p>
          <p className="mt-1 text-xs text-slate-500">Applied {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : '—'}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 text-xs text-slate-600">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold"
          >
            {(metadata?.applicationStatuses ?? []).map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <input
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            placeholder="Stage"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={isUpdating}
            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-60"
          >
            Update
          </button>
        </form>
      </div>
      {application.notes ? <p className="mt-2 text-xs text-slate-500">{application.notes}</p> : null}
    </div>
  );
}

function ApplicationList({
  applications,
  metadata,
  selectedApplicationId,
  onSelectApplication,
  onUpdateApplication,
  isUpdating,
}) {
  if (!applications?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        No applications yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          metadata={metadata}
          isSelected={selectedApplicationId === application.id}
          onSelect={() => onSelectApplication?.(application)}
          onUpdate={(payload) => onUpdateApplication?.(application, payload)}
          isUpdating={isUpdating}
        />
      ))}
    </div>
  );
}

function NewApplicationForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    source: '',
    notes: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.candidateName) return;
    onSubmit?.(form);
    setForm({ candidateName: '', candidateEmail: '', candidatePhone: '', source: '', notes: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h4 className="text-sm font-semibold text-slate-900">Add candidate</h4>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Name
          <input
            required
            name="candidateName"
            value={form.candidateName}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Email
          <input
            type="email"
            name="candidateEmail"
            value={form.candidateEmail}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Phone
          <input
            name="candidatePhone"
            value={form.candidatePhone}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Source
          <input
            name="source"
            value={form.source}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="Inbound / referral / outbound"
          />
        </label>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-600">
        Notes
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </label>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !form.candidateName}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add candidate
        </button>
      </div>
    </form>
  );
}

function InterviewList({
  interviews,
  onCreate,
  onUpdate,
  metadata,
  isSubmitting,
}) {
  const [form, setForm] = useState({
    scheduledAt: '',
    mode: metadata?.interviewModes?.[0] ?? 'virtual',
    durationMinutes: 60,
    stage: '',
    interviewerName: '',
    interviewerEmail: '',
    meetingUrl: '',
    location: '',
    agenda: '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.scheduledAt) return;
    onCreate?.({
      ...form,
      durationMinutes: Number(form.durationMinutes) || 60,
    });
    setForm({
      scheduledAt: '',
      mode: metadata?.interviewModes?.[0] ?? 'virtual',
      durationMinutes: 60,
      stage: '',
      interviewerName: '',
      interviewerEmail: '',
      meetingUrl: '',
      location: '',
      agenda: '',
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        {interviews?.length ? (
          interviews.map((interview) => (
            <div key={interview.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{interview.stage || 'Interview'}</p>
                  <p className="text-xs text-slate-500">
                    {interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString() : 'TBD'} •{' '}
                    {interview.mode?.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{interview.interviewerName || interview.interviewerEmail || 'No interviewer assigned'}</p>
                  {interview.agenda ? (
                    <p className="mt-2 text-xs text-slate-500">{interview.agenda}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <select
                    value={interview.status}
                    onChange={(event) => onUpdate?.(interview, { status: event.target.value })}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    {(metadata?.interviewStatuses ?? []).map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  {interview.meetingUrl ? (
                    <a
                      href={interview.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs text-accent hover:border-accent"
                    >
                      <VideoCameraIcon className="h-4 w-4" /> Join
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No interviews yet.
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h4 className="text-sm font-semibold text-slate-900">Schedule interview</h4>
        <div className="mt-3 space-y-3 text-xs text-slate-600">
          <label className="flex flex-col gap-1">
            Date & time
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(event) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            Mode
            <select
              value={form.mode}
              onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              {(metadata?.interviewModes ?? ['virtual']).map((mode) => (
                <option key={mode} value={mode}>
                  {mode.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Duration (minutes)
            <input
              type="number"
              min="15"
              value={form.durationMinutes}
              onChange={(event) => setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            Stage
            <input
              value={form.stage}
              onChange={(event) => setForm((prev) => ({ ...prev, stage: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder="Panel / founder loop"
            />
          </label>
          <label className="flex flex-col gap-1">
            Interviewer name
            <input
              value={form.interviewerName}
              onChange={(event) => setForm((prev) => ({ ...prev, interviewerName: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            Interviewer email
            <input
              type="email"
              value={form.interviewerEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, interviewerEmail: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            Meeting link
            <input
              value={form.meetingUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, meetingUrl: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder="https://"
            />
          </label>
          <label className="flex flex-col gap-1">
            Location / room
            <input
              value={form.location}
              onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            Agenda
            <textarea
              value={form.agenda}
              onChange={(event) => setForm((prev) => ({ ...prev, agenda: event.target.value }))}
              rows={3}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !form.scheduledAt}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CalendarIcon className="h-4 w-4" aria-hidden="true" /> Schedule
          </button>
        </div>
      </form>
    </div>
  );
}

function ResponseComposer({ onSubmit, metadata, isSubmitting }) {
  const [form, setForm] = useState({
    responseType: metadata?.responseTypes?.[0] ?? 'note',
    visibility: metadata?.responseVisibilities?.[0] ?? 'internal',
    subject: '',
    body: '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.body) return;
    onSubmit?.(form);
    setForm({
      responseType: metadata?.responseTypes?.[0] ?? 'note',
      visibility: metadata?.responseVisibilities?.[0] ?? 'internal',
      subject: '',
      body: '',
    });
  };

  const iconForType = (type) => {
    switch (type) {
      case 'email':
        return <EnvelopeIcon className="h-4 w-4" />;
      case 'call':
        return <PhoneIcon className="h-4 w-4" />;
      case 'meeting':
        return <CalendarIcon className="h-4 w-4" />;
      case 'sms':
        return <ChatBubbleOvalLeftIcon className="h-4 w-4" />;
      default:
        return <DocumentArrowDownIcon className="h-4 w-4" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <h4 className="text-sm font-semibold text-slate-900">Log a response</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs text-slate-600">
        <label className="flex flex-col gap-1">
          Type
          <select
            value={form.responseType}
            onChange={(event) => setForm((prev) => ({ ...prev, responseType: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            {(metadata?.responseTypes ?? []).map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Visibility
          <select
            value={form.visibility}
            onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            {(metadata?.responseVisibilities ?? []).map((visibility) => (
              <option key={visibility} value={visibility}>
                {visibility.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Subject
          <input
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-xs text-slate-600">
        Body
        <textarea
          value={form.body}
          onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
          rows={4}
          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          placeholder="Recap the decision, next steps, or feedback."
        />
      </label>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !form.body}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {iconForType(form.responseType)}
          Log response
        </button>
      </div>
    </form>
  );
}

function ResponseTimeline({ responses }) {
  if (!responses?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        No responses captured yet. Log interviews, emails, and calls to keep context centralised.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {responses.map((response) => (
        <li key={response.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              {response.responseType?.replace(/_/g, ' ') ?? 'note'}
            </span>
            <span>{response.createdAt ? new Date(response.createdAt).toLocaleString() : '—'}</span>
          </div>
          {response.subject ? <p className="mt-1 text-sm font-semibold text-slate-900">{response.subject}</p> : null}
          <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{response.body}</p>
        </li>
      ))}
    </ol>
  );
}

export default function JobDetailsPanel({
  job,
  metadata,
  applications,
  interviews,
  responses,
  onUpdateJob,
  onCreateApplication,
  onUpdateApplication,
  onCreateInterview,
  onUpdateInterview,
  onCreateResponse,
  loadingStates = {},
  workspaceId,
  onExpand,
  onCloseFullscreen,
  isFullscreen = false,
}) {
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    if (!applications?.length) {
      setSelectedApplication(null);
      return;
    }
    setSelectedApplication((previous) => {
      if (previous && applications.some((application) => application.id === previous.id)) {
        return applications.find((application) => application.id === previous.id) ?? applications[0];
      }
      return applications[0];
    });
  }, [applications?.map((application) => application.id).join('|')]);

  const interviewsForSelected = useMemo(() => {
    if (!selectedApplication) return interviews ?? [];
    return (interviews ?? []).filter((interview) => interview.applicationId === selectedApplication.id);
  }, [selectedApplication?.id, interviews]);

  const responsesForSelected = useMemo(() => {
    if (!selectedApplication) return responses ?? [];
    return (responses ?? []).filter((response) => response.applicationId === selectedApplication.id);
  }, [selectedApplication?.id, responses]);

  if (!job) {
    return (
      <section
        id="agency-job-detail"
        className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-soft"
      >
        Select a job to view details.
      </section>
    );
  }

  const jobLink = useMemo(() => {
    if (!job?.id) {
      return null;
    }
    const params = new URLSearchParams();
    if (workspaceId) {
      params.set('workspaceId', workspaceId);
    }
    params.set('jobId', String(job.id));
    const query = params.toString();
    return `/dashboard/agency/job-management${query ? `?${query}` : ''}`;
  }, [job?.id, workspaceId]);

  const containerClass = classNames(
    'flex flex-col rounded-3xl border border-slate-200 bg-white shadow-soft',
    isFullscreen ? 'h-full overflow-y-auto p-6' : 'p-6',
  );

  return (
    <section id="agency-job-detail" className={containerClass}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {job.clientName ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{job.clientName}</span>
              ) : null}
              {job.employmentType ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{job.employmentType.replace(/_/g, ' ')}</span>
              ) : null}
              {job.seniority ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{job.seniority.replace(/_/g, ' ')}</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onExpand && !isFullscreen ? (
              <button
                type="button"
                onClick={onExpand}
                className="rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Expand
              </button>
            ) : null}
            {isFullscreen && onCloseFullscreen ? (
              <button
                type="button"
                onClick={onCloseFullscreen}
                className="rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            ) : null}
            {jobLink ? (
              <a
                href={jobLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Window
              </a>
            ) : null}
          </div>
        </div>
        <JobEditForm job={job} metadata={metadata} onUpdate={onUpdateJob} isSubmitting={loadingStates.job} />
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Applications</h4>
              <span className="text-xs text-slate-500">{applications?.length ?? 0} candidates</span>
            </div>
            <ApplicationList
              applications={applications}
              metadata={metadata}
              selectedApplicationId={selectedApplication?.id}
              onSelectApplication={setSelectedApplication}
              onUpdateApplication={(application, payload) =>
                onUpdateApplication?.(application, payload, { selectOnUpdate: true })
              }
              isUpdating={loadingStates.application}
            />
            <NewApplicationForm onSubmit={onCreateApplication} isSubmitting={loadingStates.createApplication} />
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Interviews</h4>
              <InterviewList
                interviews={interviewsForSelected}
                metadata={metadata}
                onCreate={(payload) => onCreateInterview?.(selectedApplication, payload)}
                onUpdate={(interview, payload) => onUpdateInterview?.(interview, payload)}
                isSubmitting={loadingStates.interview}
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Responses & notes</h4>
              <ResponseComposer
                metadata={metadata}
                onSubmit={(payload) => onCreateResponse?.(selectedApplication, payload)}
                isSubmitting={loadingStates.response}
              />
              <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
                <ResponseTimeline responses={responsesForSelected} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
