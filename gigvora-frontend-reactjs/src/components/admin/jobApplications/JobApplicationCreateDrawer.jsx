import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const STEP_ORDER = ['candidate', 'role', 'workflow'];

const DEFAULT_FORM = Object.freeze({
  candidateName: '',
  candidateEmail: '',
  candidatePhone: '',
  resumeUrl: '',
  coverLetter: '',
  portfolioUrl: '',
  linkedinUrl: '',
  githubUrl: '',
  jobTitle: '',
  jobId: '',
  jobLocation: '',
  employmentType: '',
  salaryExpectation: '',
  currency: 'USD',
  status: '',
  stage: '',
  priority: '',
  source: '',
  score: '',
  tags: '',
  skills: '',
  assignedRecruiterId: '',
  assignedRecruiterName: '',
  assignedTeam: '',
  availabilityDate: '',
  initialNote: '',
  noteVisibility: 'internal',
  initialDocumentName: '',
  initialDocumentUrl: '',
  initialDocumentType: '',
  initialDocumentSize: '',
  interviewDate: '',
  interviewDuration: '',
  interviewType: 'video',
  interviewStatus: 'scheduled',
  interviewLocation: '',
  interviewMeetingLink: '',
  interviewInterviewerName: '',
  interviewInterviewerEmail: '',
  interviewNotes: '',
});

function StepPill({ step, index, activeStep, complete }) {
  const isActive = activeStep === step;
  return (
    <div
      className={`flex flex-1 items-center gap-2 rounded-3xl px-3 py-2 text-sm font-semibold transition ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-400/40'
          : complete
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      {complete ? <CheckCircleIcon className="h-4 w-4" /> : <span className="text-xs">{index + 1}</span>}
      <span className="capitalize">{step}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, required, autoComplete }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options = [], placeholder }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
      >
        <option value="">{placeholder ?? 'Select'}</option>
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {(option.label ?? option).toString().replace(/_/g, ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function JobApplicationCreateDrawer({ open, onClose, onSubmit, busy, error, facets = {} }) {
  const [currentStep, setCurrentStep] = useState('candidate');
  const [formState, setFormState] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (open) {
      setCurrentStep('candidate');
      setFormState(DEFAULT_FORM);
    }
  }, [open]);

  const recruiterOptions = useMemo(() => facets.recruiters ?? [], [facets.recruiters]);

  const handleChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const goNext = () => {
    const index = STEP_ORDER.indexOf(currentStep);
    const next = STEP_ORDER[index + 1] ?? currentStep;
    setCurrentStep(next);
  };

  const goBack = () => {
    const index = STEP_ORDER.indexOf(currentStep);
    const previous = STEP_ORDER[index - 1] ?? currentStep;
    setCurrentStep(previous);
  };

  const handleSubmit = (event) => {
    event?.preventDefault();
    if (busy) return;

    const payload = {
      candidateName: formState.candidateName.trim(),
      candidateEmail: formState.candidateEmail.trim(),
      candidatePhone: formState.candidatePhone.trim() || undefined,
      resumeUrl: formState.resumeUrl.trim() || undefined,
      coverLetter: formState.coverLetter.trim() || undefined,
      portfolioUrl: formState.portfolioUrl.trim() || undefined,
      linkedinUrl: formState.linkedinUrl.trim() || undefined,
      githubUrl: formState.githubUrl.trim() || undefined,
      jobTitle: formState.jobTitle.trim(),
      jobId: formState.jobId.trim() || undefined,
      jobLocation: formState.jobLocation.trim() || undefined,
      employmentType: formState.employmentType.trim() || undefined,
      salaryExpectation: formState.salaryExpectation ? Number(formState.salaryExpectation) : undefined,
      currency: formState.currency || 'USD',
      status: formState.status || undefined,
      stage: formState.stage || undefined,
      priority: formState.priority || undefined,
      source: formState.source || undefined,
      score: formState.score ? Number(formState.score) : undefined,
      tags: parseList(formState.tags),
      skills: parseList(formState.skills),
      assignedRecruiterId: formState.assignedRecruiterId ? Number(formState.assignedRecruiterId) : undefined,
      assignedRecruiterName: formState.assignedRecruiterName.trim() || undefined,
      assignedTeam: formState.assignedTeam.trim() || undefined,
      availabilityDate: formState.availabilityDate || undefined,
    };

    if (formState.initialNote.trim()) {
      payload.notes = [
        {
          body: formState.initialNote.trim(),
          visibility: formState.noteVisibility || 'internal',
        },
      ];
    }

    if (formState.initialDocumentName.trim() && formState.initialDocumentUrl.trim()) {
      payload.documents = [
        {
          fileName: formState.initialDocumentName.trim(),
          fileUrl: formState.initialDocumentUrl.trim(),
          fileType: formState.initialDocumentType.trim() || undefined,
          sizeBytes: formState.initialDocumentSize ? Number(formState.initialDocumentSize) : undefined,
        },
      ];
    }

    if (formState.interviewDate) {
      payload.interviews = [
        {
          scheduledAt: formState.interviewDate,
          durationMinutes: formState.interviewDuration ? Number(formState.interviewDuration) : undefined,
          type: formState.interviewType || 'video',
          status: formState.interviewStatus || 'scheduled',
          location: formState.interviewLocation.trim() || undefined,
          meetingLink: formState.interviewMeetingLink.trim() || undefined,
          interviewerName: formState.interviewInterviewerName.trim() || undefined,
          interviewerEmail: formState.interviewInterviewerEmail.trim() || undefined,
          notes: formState.interviewNotes.trim() || undefined,
        },
      ];
    }

    onSubmit(payload);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-4xl transform overflow-hidden rounded-3xl bg-slate-50 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                      <UserPlusIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">New application</Dialog.Title>
                      <p className="text-sm text-slate-500">Three quick steps to log a candidate.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={busy}
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6 px-6 py-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {STEP_ORDER.map((step, index) => (
                      <StepPill
                        key={step}
                        step={step}
                        index={index}
                        activeStep={currentStep}
                        complete={STEP_ORDER.indexOf(currentStep) > index}
                      />
                    ))}
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {currentStep === 'candidate' ? (
                      <Section title="Candidate">
                        <InputField
                          label="Name"
                          value={formState.candidateName}
                          onChange={(value) => handleChange('candidateName', value)}
                          required
                          placeholder="Jane Doe"
                        />
                        <InputField
                          label="Email"
                          type="email"
                          value={formState.candidateEmail}
                          onChange={(value) => handleChange('candidateEmail', value)}
                          required
                          placeholder="jane@gigvora.com"
                          autoComplete="email"
                        />
                        <InputField
                          label="Phone"
                          value={formState.candidatePhone}
                          onChange={(value) => handleChange('candidatePhone', value)}
                          placeholder="+1 555 555 5555"
                          autoComplete="tel"
                        />
                        <InputField
                          label="Resume link"
                          value={formState.resumeUrl}
                          onChange={(value) => handleChange('resumeUrl', value)}
                          placeholder="https://..."
                        />
                        <InputField
                          label="Portfolio"
                          value={formState.portfolioUrl}
                          onChange={(value) => handleChange('portfolioUrl', value)}
                          placeholder="https://..."
                        />
                        <InputField
                          label="LinkedIn"
                          value={formState.linkedinUrl}
                          onChange={(value) => handleChange('linkedinUrl', value)}
                          placeholder="https://linkedin.com/in/..."
                        />
                        <InputField
                          label="GitHub"
                          value={formState.githubUrl}
                          onChange={(value) => handleChange('githubUrl', value)}
                          placeholder="https://github.com/..."
                        />
                        <label className="sm:col-span-2 flex flex-col gap-1 text-sm text-slate-600">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cover letter</span>
                          <textarea
                            value={formState.coverLetter}
                            onChange={(event) => handleChange('coverLetter', event.target.value)}
                            rows={4}
                            placeholder="Paste the candidate introduction"
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                          />
                        </label>
                      </Section>
                    ) : null}

                    {currentStep === 'role' ? (
                      <Section title="Role">
                        <InputField
                          label="Job title"
                          value={formState.jobTitle}
                          onChange={(value) => handleChange('jobTitle', value)}
                          required
                          placeholder="Product Designer"
                        />
                        <InputField
                          label="Requisition ID"
                          value={formState.jobId}
                          onChange={(value) => handleChange('jobId', value)}
                          placeholder="REQ-123"
                        />
                        <InputField
                          label="Location"
                          value={formState.jobLocation}
                          onChange={(value) => handleChange('jobLocation', value)}
                          placeholder="Remote"
                        />
                        <InputField
                          label="Employment type"
                          value={formState.employmentType}
                          onChange={(value) => handleChange('employmentType', value)}
                          placeholder="Full-time"
                        />
                        <InputField
                          label="Salary"
                          type="number"
                          value={formState.salaryExpectation}
                          onChange={(value) => handleChange('salaryExpectation', value)}
                          placeholder="90000"
                        />
                        <InputField
                          label="Currency"
                          value={formState.currency}
                          onChange={(value) => handleChange('currency', value)}
                          placeholder="USD"
                        />
                        <InputField
                          label="Tags"
                          value={formState.tags}
                          onChange={(value) => handleChange('tags', value)}
                          placeholder="design, figma, ux"
                        />
                        <InputField
                          label="Skills"
                          value={formState.skills}
                          onChange={(value) => handleChange('skills', value)}
                          placeholder="research, prototyping"
                        />
                      </Section>
                    ) : null}

                    {currentStep === 'workflow' ? (
                      <div className="space-y-6">
                        <Section title="Workflow">
                          <SelectField
                            label="Stage"
                            value={formState.stage}
                            onChange={(value) => handleChange('stage', value)}
                            options={(facets.stages ?? []).map((stage) => ({ value: stage, label: stage }))}
                            placeholder="Select stage"
                          />
                          <SelectField
                            label="Status"
                            value={formState.status}
                            onChange={(value) => handleChange('status', value)}
                            options={(facets.statuses ?? []).map((status) => ({ value: status, label: status }))}
                            placeholder="Select status"
                          />
                          <SelectField
                            label="Priority"
                            value={formState.priority}
                            onChange={(value) => handleChange('priority', value)}
                            options={(facets.priorities ?? []).map((priority) => ({ value: priority, label: priority }))}
                            placeholder="Select priority"
                          />
                          <SelectField
                            label="Source"
                            value={formState.source}
                            onChange={(value) => handleChange('source', value)}
                            options={(facets.sources ?? []).map((source) => ({ value: source, label: source }))}
                            placeholder="Select source"
                          />
                          <InputField
                            label="Score"
                            type="number"
                            value={formState.score}
                            onChange={(value) => handleChange('score', value)}
                            placeholder="0 - 100"
                          />
                          <SelectField
                            label="Recruiter"
                            value={formState.assignedRecruiterId}
                            onChange={(value) => handleChange('assignedRecruiterId', value)}
                            options={recruiterOptions.map((recruiter) => ({ value: recruiter.id, label: recruiter.name }))}
                            placeholder="Assign recruiter"
                          />
                          <InputField
                            label="Recruiter name override"
                            value={formState.assignedRecruiterName}
                            onChange={(value) => handleChange('assignedRecruiterName', value)}
                            placeholder="Optional"
                          />
                          <InputField
                            label="Team"
                            value={formState.assignedTeam}
                            onChange={(value) => handleChange('assignedTeam', value)}
                            placeholder="People Ops"
                          />
                          <InputField
                            label="Available from"
                            type="date"
                            value={formState.availabilityDate}
                            onChange={(value) => handleChange('availabilityDate', value)}
                          />
                        </Section>

                        <Section title="First note">
                          <label className="sm:col-span-2 flex flex-col gap-2 text-sm text-slate-600">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Note</span>
                            <textarea
                              rows={4}
                              value={formState.initialNote}
                              onChange={(event) => handleChange('initialNote', event.target.value)}
                              placeholder="Share context with the team"
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                            />
                          </label>
                          <SelectField
                            label="Visibility"
                            value={formState.noteVisibility}
                            onChange={(value) => handleChange('noteVisibility', value)}
                            options={[{ value: 'internal', label: 'internal' }, { value: 'shared', label: 'shared' }]}
                          />
                        </Section>

                        <Section title="Initial file">
                          <InputField
                            label="File name"
                            value={formState.initialDocumentName}
                            onChange={(value) => handleChange('initialDocumentName', value)}
                            placeholder="Resume.pdf"
                          />
                          <InputField
                            label="File link"
                            value={formState.initialDocumentUrl}
                            onChange={(value) => handleChange('initialDocumentUrl', value)}
                            placeholder="https://..."
                          />
                          <InputField
                            label="File type"
                            value={formState.initialDocumentType}
                            onChange={(value) => handleChange('initialDocumentType', value)}
                            placeholder="application/pdf"
                          />
                          <InputField
                            label="File size (bytes)"
                            type="number"
                            value={formState.initialDocumentSize}
                            onChange={(value) => handleChange('initialDocumentSize', value)}
                            placeholder="Optional"
                          />
                        </Section>

                        <Section title="First interview">
                          <InputField
                            label="Date"
                            type="datetime-local"
                            value={formState.interviewDate}
                            onChange={(value) => handleChange('interviewDate', value)}
                          />
                          <InputField
                            label="Duration (minutes)"
                            type="number"
                            value={formState.interviewDuration}
                            onChange={(value) => handleChange('interviewDuration', value)}
                            placeholder="45"
                          />
                          <SelectField
                            label="Type"
                            value={formState.interviewType}
                            onChange={(value) => handleChange('interviewType', value)}
                            options={(facets.interviewTypes ?? []).map((type) => ({ value: type, label: type }))}
                          />
                          <SelectField
                            label="Status"
                            value={formState.interviewStatus}
                            onChange={(value) => handleChange('interviewStatus', value)}
                            options={(facets.interviewStatuses ?? []).map((status) => ({ value: status, label: status }))}
                          />
                          <InputField
                            label="Location"
                            value={formState.interviewLocation}
                            onChange={(value) => handleChange('interviewLocation', value)}
                            placeholder="Zoom"
                          />
                          <InputField
                            label="Meeting link"
                            value={formState.interviewMeetingLink}
                            onChange={(value) => handleChange('interviewMeetingLink', value)}
                            placeholder="https://..."
                          />
                          <InputField
                            label="Interviewer"
                            value={formState.interviewInterviewerName}
                            onChange={(value) => handleChange('interviewInterviewerName', value)}
                            placeholder="Avery Lee"
                          />
                          <InputField
                            label="Interviewer email"
                            type="email"
                            value={formState.interviewInterviewerEmail}
                            onChange={(value) => handleChange('interviewInterviewerEmail', value)}
                            placeholder="avery@gigvora.com"
                          />
                          <label className="sm:col-span-2 flex flex-col gap-2 text-sm text-slate-600">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                            <textarea
                              rows={3}
                              value={formState.interviewNotes}
                              onChange={(event) => handleChange('interviewNotes', event.target.value)}
                              placeholder="Prep guidance for this interview"
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                            />
                          </label>
                        </Section>
                      </div>
                    ) : null}

                    {error ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
                    ) : null}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={goBack}
                          disabled={currentStep === 'candidate' || busy}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={goNext}
                          disabled={currentStep === 'workflow' || busy}
                          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Next
                          <ChevronRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-400/40 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ClipboardDocumentListIcon className="h-4 w-4" />}
                        Create application
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
