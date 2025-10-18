import { useEffect, useMemo, useState } from 'react';
import {
  createEmptyForm,
  STATUS_OPTIONS,
  WORKPLACE_OPTIONS,
  EMPLOYMENT_OPTIONS,
  CONTRACT_OPTIONS,
  EXPERIENCE_OPTIONS,
  COMPENSATION_OPTIONS,
  WORKFLOW_OPTIONS,
  APPROVAL_OPTIONS,
  VISIBILITY_OPTIONS,
  PROMOTION_FLAGS,
} from './jobPostFormUtils.js';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="block font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 6, placeholder }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="block font-semibold text-slate-700">{label}</span>
      <textarea
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="block font-semibold text-slate-700">{label}</span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ListEditor({ label, values, onChange, addLabel = 'Add line' }) {
  const handleItemChange = (index, nextValue) => {
    const next = [...(values ?? [])];
    next[index] = nextValue;
    onChange(next);
  };
  const handleAdd = () => {
    onChange([...(values ?? []), '']);
  };
  const handleRemove = (index) => {
    const source = values ?? [];
    const next = source.filter((_, itemIndex) => itemIndex !== index);
    onChange(next.length ? next : ['']);
  };

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs font-semibold uppercase tracking-wide text-indigo-600 hover:text-indigo-500"
        >
          {addLabel}
        </button>
      </div>
      <div className="space-y-2">
        {(values ?? ['']).map((item, index) => (
          <div key={`${label}-${index}`} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(event) => handleItemChange(index, event.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-rose-300 hover:text-rose-500"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttachmentEditor({ attachments, onChange }) {
  const handleItemChange = (index, field, value) => {
    const next = [...(attachments ?? [])];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };
  const handleAdd = () => {
    onChange([...(attachments ?? []), { label: '', url: '', type: '' }]);
  };
  const handleRemove = (index) => {
    const source = attachments ?? [];
    const next = source.filter((_, itemIndex) => itemIndex !== index);
    onChange(next.length ? next : [{ label: '', url: '', type: '' }]);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">Attachments</h4>
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs font-semibold uppercase tracking-wide text-indigo-600 hover:text-indigo-500"
        >
          Add file
        </button>
      </div>
      <div className="space-y-3">
        {(attachments ?? [{ label: '', url: '', type: '' }]).map((attachment, index) => (
          <div key={`attachment-${index}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
            <Input
              label="Label"
              value={attachment.label}
              onChange={(value) => handleItemChange(index, 'label', value)}
            />
            <Input
              label="URL"
              value={attachment.url}
              onChange={(value) => handleItemChange(index, 'url', value)}
            />
            <Input
              label="Type"
              value={attachment.type}
              onChange={(value) => handleItemChange(index, 'type', value)}
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="sm:col-span-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-rose-300 hover:text-rose-500"
            >
              Remove file
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromotionSelector({ value, onChange }) {
  const handleToggle = (key) => {
    onChange({
      ...value,
      [key]: !value?.[key],
    });
  };
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-700">Promotion</h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {PROMOTION_FLAGS.map((flag) => (
          <button
            key={flag.key}
            type="button"
            onClick={() => handleToggle(flag.key)}
            className={classNames(
              'flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition',
              value?.[flag.key]
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-500',
            )}
          >
            {flag.label}
            <span className="text-xs uppercase tracking-wide">{value?.[flag.key] ? 'On' : 'Off'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const STEP_ORDER = ['basics', 'hiring', 'content', 'launch'];

const STEP_LABELS = {
  basics: 'Basics',
  hiring: 'Hiring',
  content: 'Content',
  launch: 'Launch',
};

function Stepper({ currentStep }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {STEP_ORDER.map((step) => (
        <div
          key={step}
          className={classNames(
            'rounded-xl border px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide',
            currentStep === step ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white text-slate-500',
          )}
        >
          {STEP_LABELS[step]}
        </div>
      ))}
    </div>
  );
}

export default function JobPostWizard({ open, mode = 'create', initialForm, onClose, onSubmit, saving = false }) {
  const [form, setForm] = useState(createEmptyForm());
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initialForm ?? createEmptyForm());
      setStepIndex(0);
      setError('');
    }
  }, [open, initialForm]);

  const steps = useMemo(() => STEP_ORDER, []);
  const currentStep = steps[stepIndex] ?? 'basics';
  const isLastStep = stepIndex === steps.length - 1;
  const title = mode === 'edit' ? 'Edit Job' : mode === 'clone' ? 'Clone Job' : 'New Job';

  const updateField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setError('');
      await onSubmit(form);
    } catch (submitError) {
      setError(submitError?.message ?? 'Unable to save job post.');
    }
  };

  const handleNext = () => {
    if (saving) {
      return;
    }
    if (isLastStep) {
      handleSubmit();
      return;
    }
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-slate-900/40 backdrop-blur">
      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">Fill each step and launch when you are ready.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-6 px-6 py-6">
          <Stepper currentStep={currentStep} />

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
          )}

          {currentStep === 'basics' && (
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Title" value={form.title} onChange={(value) => updateField('title', value)} />
              <Input label="Slug" value={form.slug} onChange={(value) => updateField('slug', value)} />
              <Select label="Status" value={form.status} onChange={(value) => updateField('status', value)} options={STATUS_OPTIONS} />
              <Select label="Visibility" value={form.visibility} onChange={(value) => updateField('visibility', value)} options={VISIBILITY_OPTIONS} />
              <Select label="Workflow" value={form.workflowStage} onChange={(value) => updateField('workflowStage', value)} options={WORKFLOW_OPTIONS} />
              <Select label="Approval" value={form.approvalStatus} onChange={(value) => updateField('approvalStatus', value)} options={APPROVAL_OPTIONS} />
              <Input label="Location" value={form.location} onChange={(value) => updateField('location', value)} />
              <Select label="Workplace" value={form.workplaceType} onChange={(value) => updateField('workplaceType', value)} options={WORKPLACE_OPTIONS} />
              <Select label="Employment" value={form.employmentType} onChange={(value) => updateField('employmentType', value)} options={EMPLOYMENT_OPTIONS} />
              <Select label="Contract" value={form.contractType} onChange={(value) => updateField('contractType', value)} options={CONTRACT_OPTIONS} />
              <Select label="Experience" value={form.experienceLevel} onChange={(value) => updateField('experienceLevel', value)} options={EXPERIENCE_OPTIONS} />
              <Select label="Compensation" value={form.compensationType} onChange={(value) => updateField('compensationType', value)} options={COMPENSATION_OPTIONS} />
              <Input label="Salary min" value={form.salaryMin} onChange={(value) => updateField('salaryMin', value)} type="number" />
              <Input label="Salary max" value={form.salaryMax} onChange={(value) => updateField('salaryMax', value)} type="number" />
              <Input label="Currency" value={form.currency} onChange={(value) => updateField('currency', value)} />
            </div>
          )}

          {currentStep === 'hiring' && (
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Department" value={form.department} onChange={(value) => updateField('department', value)} />
              <Input label="Team" value={form.team} onChange={(value) => updateField('team', value)} />
              <Input label="Manager" value={form.hiringManagerName} onChange={(value) => updateField('hiringManagerName', value)} />
              <Input label="Manager email" value={form.hiringManagerEmail} onChange={(value) => updateField('hiringManagerEmail', value)} type="email" />
              <Input label="Recruiter" value={form.recruiterName} onChange={(value) => updateField('recruiterName', value)} />
              <Input label="Recruiter email" value={form.recruiterEmail} onChange={(value) => updateField('recruiterEmail', value)} type="email" />
              <Input label="Apply URL" value={form.applicationUrl} onChange={(value) => updateField('applicationUrl', value)} />
              <Input label="Apply email" value={form.applicationEmail} onChange={(value) => updateField('applicationEmail', value)} type="email" />
              <TextArea label="Apply notes" value={form.applicationInstructions} onChange={(value) => updateField('applicationInstructions', value)} rows={4} />
              <Input label="External reference" value={form.externalReference} onChange={(value) => updateField('externalReference', value)} />
              <Input label="Published at" value={form.publishedAt} onChange={(value) => updateField('publishedAt', value)} type="datetime-local" />
              <Input label="Expires at" value={form.expiresAt} onChange={(value) => updateField('expiresAt', value)} type="datetime-local" />
            </div>
          )}

          {currentStep === 'content' && (
            <div className="space-y-5">
              <TextArea label="Description" value={form.description} onChange={(value) => updateField('description', value)} rows={8} />
              <TextArea label="Tags" value={form.tagsText} onChange={(value) => updateField('tagsText', value)} rows={3} placeholder="Design, Product" />
              <ListEditor label="Requirements" values={form.requirements} onChange={(value) => updateField('requirements', value)} />
              <ListEditor label="Responsibilities" values={form.responsibilities} onChange={(value) => updateField('responsibilities', value)} />
              <ListEditor label="Benefits" values={form.benefits} onChange={(value) => updateField('benefits', value)} />
              <AttachmentEditor attachments={form.attachments} onChange={(value) => updateField('attachments', value)} />
            </div>
          )}

          {currentStep === 'launch' && (
            <div className="grid gap-5 md:grid-cols-2">
              <TextArea label="Approval notes" value={form.approvalNotes} onChange={(value) => updateField('approvalNotes', value)} rows={4} />
              <TextArea label="Archive reason" value={form.archiveReason} onChange={(value) => updateField('archiveReason', value)} rows={4} />
              <PromotionSelector value={form.promotionFlags} onChange={(value) => updateField('promotionFlags', value)} />
              <TextArea
                label="Metadata JSON"
                value={form.metadataJson}
                onChange={(value) => updateField('metadataJson', value)}
                rows={8}
                placeholder={`{
  "key": "value"
}`}
              />
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLastStep ? (saving ? 'Saving…' : 'Save job') : 'Next'}
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
