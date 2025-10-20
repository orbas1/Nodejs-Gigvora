import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition, RadioGroup } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  CREATION_STUDIO_TYPES,
  CREATION_STUDIO_STATUSES,
  getCreationType,
} from '../../../constants/creationStudio.js';
import {
  buildInitialState,
  mergeItemToState,
  buildSettingsPayload,
  normaliseTagsInput,
  parseNumberInput,
  parseDateInput,
} from './formState.js';
import {
  createCompanyCreationStudioItem,
  updateCompanyCreationStudioItem,
} from '../../../services/creationStudio.js';

const steps = [
  { id: 'basics', label: 'Basics' },
  { id: 'details', label: 'Details' },
];

function Stepper({ activeStep }) {
  return (
    <ol className="flex items-center gap-3 text-xs font-semibold text-slate-500">
      {steps.map((step, index) => {
        const active = index === activeStep;
        return (
          <li
            key={step.id}
            className={`flex items-center gap-2 rounded-full px-3 py-1 ${
              active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-900">
              {index + 1}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

Stepper.propTypes = {
  activeStep: PropTypes.number.isRequired,
};

function StatusSelector({ value, onChange }) {
  return (
    <RadioGroup value={value} onChange={onChange} className="grid grid-cols-2 gap-2">
      {CREATION_STUDIO_STATUSES.map((status) => (
        <RadioGroup.Option
          key={status.id}
          value={status.id}
          className={({ checked }) =>
            `rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
              checked ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'
            }`
          }
        >
          <RadioGroup.Label>{status.label}</RadioGroup.Label>
        </RadioGroup.Option>
      ))}
    </RadioGroup>
  );
}

StatusSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function Field({ label, children }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

function SettingsFields({ type, settings, onChange }) {
  const typeConfig = useMemo(() => {
    switch (type) {
      case 'job':
        return [
          { name: 'employmentType', label: 'Employment type', placeholder: 'Full-time, contract…' },
          { name: 'seniority', label: 'Seniority', placeholder: 'Mid, senior…' },
          { name: 'hiringManager', label: 'Hiring manager' },
        ];
      case 'project':
      case 'gig':
      case 'volunteer_opportunity':
        return [
          { name: 'deliverables', label: 'Deliverables', type: 'textarea' },
          { name: 'mentorLead', label: 'Lead', placeholder: 'Owner' },
          { name: 'skills', label: 'Skills', placeholder: 'Design, analytics…' },
        ];
      case 'launchpad_job':
      case 'launchpad_project':
        return [
          { name: 'mentorLead', label: 'Mentor lead' },
          { name: 'mentorPods', label: 'Pods', placeholder: 'Pod names or counts' },
          { name: 'skills', label: 'Focus', placeholder: 'Readiness focus' },
        ];
      case 'networking_session':
        return [
          { name: 'sessionFormat', label: 'Format', type: 'select', options: ['virtual', 'hybrid', 'in_person'] },
          { name: 'meetingUrl', label: 'Join link' },
          { name: 'capacity', label: 'Capacity', type: 'number' },
          { name: 'rotationMinutes', label: 'Rotation (minutes)', type: 'number' },
        ];
      case 'blog_post':
        return [
          { name: 'seoTitle', label: 'SEO title' },
          { name: 'seoDescription', label: 'SEO description', type: 'textarea' },
        ];
      case 'group':
        return [
          { name: 'joinPolicy', label: 'Join policy', type: 'select', options: ['request', 'open', 'invite'] },
          { name: 'onboardingQuestion', label: 'Onboarding question', type: 'textarea' },
        ];
      case 'page':
        return [
          { name: 'slug', label: 'Slug', placeholder: 'example-page' },
          { name: 'primaryCta', label: 'Primary CTA' },
          { name: 'heroColor', label: 'Hero color' },
        ];
      case 'ad':
        return [
          { name: 'campaignBudget', label: 'Campaign budget' },
          { name: 'campaignAudience', label: 'Audience', type: 'textarea' },
          { name: 'campaignDuration', label: 'Duration' },
          { name: 'objective', label: 'Objective' },
        ];
      default:
        return [];
    }
  }, [type]);

  if (!typeConfig.length) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {typeConfig.map((field) => {
        const value = settings?.[field.name] ?? '';
        return (
          <Field key={field.name} label={field.label}>
            {field.type === 'textarea' ? (
              <textarea
                value={value}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
            ) : field.type === 'select' ? (
              <select
                value={value}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                <option value="">Select</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            ) : field.type === 'number' ? (
              <input
                type="number"
                value={value}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
            )}
          </Field>
        );
      })}
    </div>
  );
}

SettingsFields.propTypes = {
  type: PropTypes.string.isRequired,
  settings: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

SettingsFields.defaultProps = {
  settings: {},
};

export default function CreationStudioFormDrawer({
  open,
  mode,
  item,
  initialType,
  workspaceId,
  onClose,
  onSaved,
  canManage,
}) {
  const [formState, setFormState] = useState(() => buildInitialState(initialType));
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const availableTypes = useMemo(() => CREATION_STUDIO_TYPES, []);

  useEffect(() => {
    if (open) {
      const nextState = mode === 'edit' ? mergeItemToState(item, initialType) : buildInitialState(initialType);
      setFormState(nextState);
      setActiveStep(0);
      setFeedback(null);
    }
  }, [open, mode, item, initialType]);

  const handleFieldChange = (name, value) => {
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleSettingsChange = (name, value) => {
    setFormState((previous) => ({ ...previous, settings: { ...previous.settings, [name]: value } }));
  };

  const handleTypeChange = (nextType) => {
    setFormState((previous) => {
      const template = buildInitialState(nextType);
      return {
        ...previous,
        ...template,
        type: nextType,
        title: previous.title,
        headline: previous.headline,
        summary: previous.summary,
        content: previous.content,
        category: previous.category,
        location: previous.location,
        targetAudience: previous.targetAudience,
        launchDate: previous.launchDate,
        publishAt: previous.publishAt,
        endDate: previous.endDate,
        imageUrl: previous.imageUrl,
        status: previous.status,
        visibility: previous.visibility,
        tagsText: previous.tagsText,
        budgetAmount: previous.budgetAmount,
        budgetCurrency: previous.budgetCurrency,
        compensationMin: previous.compensationMin,
        compensationMax: previous.compensationMax,
        compensationCurrency: previous.compensationCurrency,
        durationWeeks: previous.durationWeeks,
        commitmentHours: previous.commitmentHours,
        remoteEligible: previous.remoteEligible,
        settings: { ...template.settings },
      };
    });
  };

  const handleSubmit = async () => {
    if (!formState.title.trim()) {
      setFeedback({ type: 'error', message: 'Title is required.' });
      return;
    }
    if (!canManage) {
      setFeedback({ type: 'error', message: 'You do not have permission to save this item.' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        workspaceId: workspaceId ? Number(workspaceId) : undefined,
        type: formState.type,
        title: formState.title,
        headline: formState.headline || undefined,
        summary: formState.summary || undefined,
        content: formState.content || undefined,
        status: formState.status,
        visibility: formState.visibility,
        category: formState.category || undefined,
        location: formState.location || undefined,
        targetAudience: formState.targetAudience || undefined,
        launchDate: parseDateInput(formState.launchDate),
        publishAt: formState.status === 'scheduled' ? parseDateInput(formState.publishAt) : undefined,
        endDate: parseDateInput(formState.endDate),
        imageUrl: formState.imageUrl || undefined,
        tags: normaliseTagsInput(formState.tagsText),
        budgetAmount: parseNumberInput(formState.budgetAmount),
        budgetCurrency: formState.budgetCurrency || undefined,
        compensationMin: parseNumberInput(formState.compensationMin),
        compensationMax: parseNumberInput(formState.compensationMax),
        compensationCurrency: formState.compensationCurrency || undefined,
        durationWeeks: parseNumberInput(formState.durationWeeks, { integer: true }),
        commitmentHours: parseNumberInput(formState.commitmentHours, { integer: true }),
        remoteEligible: !!formState.remoteEligible,
        settings: buildSettingsPayload(formState.type, formState),
      };

      const saved =
        mode === 'edit' && item?.id
          ? await updateCompanyCreationStudioItem(item.id, payload)
          : await createCompanyCreationStudioItem(payload);

      setFeedback({ type: 'success', message: 'Saved.' });
      onSaved?.(saved);
      onClose();
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message ?? 'Unable to save item.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderBasics = () => {
    return (
      <div className="space-y-4">
        {mode === 'create' ? (
          <Field label="Type">
            <select
              value={formState.type}
              onChange={(event) => handleTypeChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              {availableTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{getCreationType(formState.type)?.label}</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input
              value={formState.title}
              onChange={(event) => handleFieldChange('title', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </Field>
          <Field label="Headline">
            <input
              value={formState.headline}
              onChange={(event) => handleFieldChange('headline', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </Field>
        </div>
        <Field label="Summary">
          <textarea
            value={formState.summary}
            onChange={(event) => handleFieldChange('summary', event.target.value)}
            className="h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <StatusSelector value={formState.status} onChange={(value) => handleFieldChange('status', value)} />
          </Field>
          <Field label="Visibility">
            <select
              value={formState.visibility}
              onChange={(event) => handleFieldChange('visibility', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              <option value="private">Private</option>
              <option value="workspace">Workspace</option>
              <option value="public">Public</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Launch">
            <input
              type="datetime-local"
              value={formState.launchDate}
              onChange={(event) => handleFieldChange('launchDate', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </Field>
          <Field label="Publish">
            <input
              type="datetime-local"
              value={formState.publishAt}
              onChange={(event) => handleFieldChange('publishAt', event.target.value)}
              disabled={formState.status !== 'scheduled'}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </Field>
          <Field label="End">
            <input
              type="datetime-local"
              value={formState.endDate}
              onChange={(event) => handleFieldChange('endDate', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location">
            <input
              value={formState.location}
              onChange={(event) => handleFieldChange('location', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </Field>
          <Field label="Target audience">
            <input
              value={formState.targetAudience}
              onChange={(event) => handleFieldChange('targetAudience', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={!!formState.remoteEligible}
            onChange={(event) => handleFieldChange('remoteEligible', event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
          />
          Remote friendly
        </label>
      </div>
    );
  };

  const renderDetails = () => {
    return (
      <div className="space-y-4">
        <Field label="Long description">
          <textarea
            value={formState.content}
            onChange={(event) => handleFieldChange('content', event.target.value)}
            className="h-32 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Budget">
            <div className="flex gap-2">
              <input
                value={formState.budgetAmount}
                onChange={(event) => handleFieldChange('budgetAmount', event.target.value)}
                placeholder="Amount"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
              <input
                value={formState.budgetCurrency}
                onChange={(event) => handleFieldChange('budgetCurrency', event.target.value.toUpperCase())}
                className="w-20 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
            </div>
          </Field>
          <Field label="Compensation range">
            <div className="flex gap-2">
              <input
                value={formState.compensationMin}
                onChange={(event) => handleFieldChange('compensationMin', event.target.value)}
                placeholder="Min"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
              <input
                value={formState.compensationMax}
                onChange={(event) => handleFieldChange('compensationMax', event.target.value)}
                placeholder="Max"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
              <input
                value={formState.compensationCurrency}
                onChange={(event) => handleFieldChange('compensationCurrency', event.target.value.toUpperCase())}
                className="w-20 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
            </div>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Duration (weeks)">
            <input
              value={formState.durationWeeks}
              onChange={(event) => handleFieldChange('durationWeeks', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </Field>
          <Field label="Weekly hours">
            <input
              value={formState.commitmentHours}
              onChange={(event) => handleFieldChange('commitmentHours', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </Field>
        </div>
        <Field label="Tags">
          <input
            value={formState.tagsText}
            onChange={(event) => handleFieldChange('tagsText', event.target.value)}
            placeholder="Comma separated"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
          />
        </Field>
        <Field label="Image URL">
          <input
            value={formState.imageUrl}
            onChange={(event) => handleFieldChange('imageUrl', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
          />
        </Field>
        <SettingsFields type={formState.type} settings={formState.settings} onChange={handleSettingsChange} />
      </div>
    );
  };

  const body = activeStep === 0 ? renderBasics() : renderDetails();

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (submitting ? null : onClose?.())}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-screen max-w-3xl">
                <div className="flex h-full flex-col bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div className="space-y-1">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">
                        {mode === 'edit' ? 'Edit item' : 'New item'}
                      </Dialog.Title>
                      <Stepper activeStep={activeStep} />
                    </div>
                    <button
                      type="button"
                      onClick={() => (submitting ? null : onClose?.())}
                      className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-6">
                      {feedback ? (
                        <div
                          className={`rounded-2xl border px-3 py-2 text-sm ${
                            feedback.type === 'error'
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {feedback.message}
                        </div>
                      ) : null}
                      {body}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep((index) => Math.max(0, index - 1))}
                      disabled={activeStep === 0}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Back
                    </button>
                    {activeStep < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setActiveStep((index) => Math.min(steps.length - 1, index + 1))}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? 'Saving…' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

CreationStudioFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  item: PropTypes.object,
  initialType: PropTypes.string,
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
  canManage: PropTypes.bool,
};

CreationStudioFormDrawer.defaultProps = {
  item: null,
  initialType: 'job',
  workspaceId: undefined,
  onSaved: null,
  canManage: false,
};
