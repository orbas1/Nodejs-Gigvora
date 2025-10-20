import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AcademicCapIcon,
  ArrowPathIcon,
  BanknotesIcon,
  BoltIcon,
  BriefcaseIcon,
  InboxStackIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Modal from '../ui/Modal.jsx';
import {
  createProject,
  createGigOrder,
  createEscrowTransaction,
} from '../../services/projectGigManagement.js';
import { createTransferRequest } from '../../services/walletManagement.js';
import { createMentoringSession } from '../../services/userMentoring.js';

const DEFAULT_CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
];

const ACTION_CONFIG = {
  project: {
    id: 'project',
    title: 'Launch a project workspace',
    description: 'Spin up a scoped initiative with budget, collaborators, and timelines.',
    icon: BriefcaseIcon,
    accent: 'bg-sky-500/10 text-sky-700 border border-sky-100',
    submitLabel: 'Launch project',
    successMessage: 'Project created. We will refresh your dashboard momentarily.',
    steps: [
      { id: 'summary', label: 'Summary' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'collaboration', label: 'Collaboration' },
    ],
  },
  'gig-order': {
    id: 'gig-order',
    title: 'Issue a gig order',
    description: 'Commission a vendor with scoped deliverables and payment terms.',
    icon: BoltIcon,
    accent: 'bg-violet-500/10 text-violet-700 border border-violet-100',
    submitLabel: 'Send gig order',
    successMessage: 'Gig order submitted successfully.',
    steps: [
      { id: 'context', label: 'Context' },
      { id: 'commercials', label: 'Commercials' },
      { id: 'handoff', label: 'Handoff' },
    ],
  },
  escrow: {
    id: 'escrow',
    title: 'Fund an escrow milestone',
    description: 'Secure delivery with a funded milestone and release guardrails.',
    icon: ShieldCheckIcon,
    accent: 'bg-emerald-500/10 text-emerald-700 border border-emerald-100',
    submitLabel: 'Fund escrow',
    successMessage: 'Escrow milestone funded.',
    steps: [
      { id: 'link', label: 'Reference' },
      { id: 'funding', label: 'Funding' },
      { id: 'notifications', label: 'Signals' },
    ],
  },
  wallet: {
    id: 'wallet',
    title: 'Schedule a wallet transfer',
    description: 'Move funds across wallets or schedule recurring treasury rules.',
    icon: BanknotesIcon,
    accent: 'bg-amber-500/10 text-amber-700 border border-amber-100',
    submitLabel: 'Schedule transfer',
    successMessage: 'Transfer scheduled.',
    steps: [
      { id: 'source', label: 'Source' },
      { id: 'destination', label: 'Destination' },
      { id: 'review', label: 'Governance' },
    ],
  },
  mentoring: {
    id: 'mentoring',
    title: 'Book a mentor session',
    description: 'Lock in expert support with agenda, meeting link, and materials.',
    icon: AcademicCapIcon,
    accent: 'bg-indigo-500/10 text-indigo-700 border border-indigo-100',
    submitLabel: 'Book session',
    successMessage: 'Mentor session booked.',
    steps: [
      { id: 'mentor', label: 'Mentor' },
      { id: 'session', label: 'Session' },
      { id: 'enablement', label: 'Enablement' },
    ],
  },
};

const INITIAL_VALUES = {
  project: {
    title: '',
    summary: '',
    budget: '',
    currency: 'USD',
    startDate: '',
    dueDate: '',
    templateId: '',
    collaborators: '',
    briefUrl: '',
    kickoffLink: '',
  },
  'gig-order': {
    projectId: '',
    vendorName: '',
    serviceName: '',
    amount: '',
    currency: 'USD',
    dueAt: '',
    notes: '',
    attachments: '',
  },
  escrow: {
    projectId: '',
    milestoneName: '',
    amount: '',
    currency: 'USD',
    accountId: '',
    releaseDate: '',
    releaseRule: '',
    notifyEmails: '',
  },
  wallet: {
    sourceId: '',
    destination: '',
    amount: '',
    currency: 'USD',
    transferDate: '',
    cadence: 'once',
    memo: '',
  },
  mentoring: {
    mentorId: '',
    mentorHandle: '',
    topic: '',
    sessionDate: '',
    sessionDuration: 60,
    meetingLink: '',
    prepNotes: '',
    recordingPreference: 'allow',
  },
};

const TRANSFER_CADENCE_OPTIONS = [
  { value: 'once', label: 'One-off transfer' },
  { value: 'weekly', label: 'Weekly automation' },
  { value: 'monthly', label: 'Monthly automation' },
];

function QuickActionStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 shadow-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/90 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

QuickActionStat.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

function Stepper({ steps, activeIndex }) {
  return (
    <ol className="flex flex-wrap gap-3">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isCompleted = index < activeIndex;
        return (
          <li
            key={step.id}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${
              isActive
                ? 'bg-accent/10 text-accent'
                : isCompleted
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                isCompleted ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500'
              }`}
            >
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
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  activeIndex: PropTypes.number.isRequired,
};

function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }
  return <p className="text-sm font-medium text-rose-600">{message}</p>;
}

ErrorMessage.propTypes = {
  message: PropTypes.string,
};

ErrorMessage.defaultProps = {
  message: undefined,
};

function Fieldset({ legend, description, children }) {
  return (
    <fieldset className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-5">
      <legend className="text-sm font-semibold text-slate-900">{legend}</legend>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

Fieldset.propTypes = {
  legend: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node,
};

Fieldset.defaultProps = {
  description: undefined,
  children: null,
};

function Input({ label, required, helper, error, ...rest }) {
  const id = rest.id ?? rest.name;
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <input
        {...rest}
        id={id}
        className={`mt-1 w-full rounded-2xl border px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
          error ? 'border-rose-400' : 'border-slate-200'
        }`}
        required={required}
      />
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
      {error ? <ErrorMessage message={error} /> : null}
    </label>
  );
}

Input.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  helper: PropTypes.string,
  error: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
};

Input.defaultProps = {
  required: false,
  helper: undefined,
  error: undefined,
  id: undefined,
  name: undefined,
};

function TextArea({ label, helper, error, rows = 4, ...rest }) {
  const id = rest.id ?? rest.name;
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <textarea
        {...rest}
        id={id}
        rows={rows}
        className={`mt-1 w-full rounded-2xl border px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
          error ? 'border-rose-400' : 'border-slate-200'
        }`}
      />
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
      {error ? <ErrorMessage message={error} /> : null}
    </label>
  );
}

TextArea.propTypes = {
  label: PropTypes.string.isRequired,
  helper: PropTypes.string,
  error: PropTypes.string,
  rows: PropTypes.number,
};

TextArea.defaultProps = {
  helper: undefined,
  error: undefined,
  rows: 4,
};

function Select({ label, options, helper, error, ...rest }) {
  const id = rest.id ?? rest.name;
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <select
        {...rest}
        id={id}
        className={`mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
          error ? 'border-rose-400' : 'border-slate-200'
        }`}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
      {error ? <ErrorMessage message={error} /> : null}
    </label>
  );
}

Select.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  helper: PropTypes.string,
  error: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
};

Select.defaultProps = {
  options: [],
  helper: undefined,
  error: undefined,
  id: undefined,
  name: undefined,
};

function buildError(message) {
  return message ?? 'This field is required.';
}

function validate(actionId, values) {
  const errors = {};
  if (actionId === 'project') {
    if (!values.title?.trim()) errors.title = buildError('Add a project name.');
    if (!values.summary?.trim()) errors.summary = buildError('Share a short project summary.');
    if (values.budget && Number.isNaN(Number(values.budget))) errors.budget = 'Enter a valid amount.';
    if (values.startDate && Number.isNaN(new Date(values.startDate).getTime())) errors.startDate = 'Pick a valid date.';
    if (values.dueDate && Number.isNaN(new Date(values.dueDate).getTime())) errors.dueDate = 'Pick a valid date.';
  }
  if (actionId === 'gig-order') {
    if (!values.projectId) errors.projectId = buildError('Select a project context.');
    if (!values.vendorName?.trim()) errors.vendorName = buildError('Add the vendor name.');
    if (!values.serviceName?.trim()) errors.serviceName = buildError('Describe the service.');
    if (!values.amount || Number.isNaN(Number(values.amount))) errors.amount = 'Enter a budget amount.';
  }
  if (actionId === 'escrow') {
    if (!values.projectId) errors.projectId = buildError('Link to a project or gig order.');
    if (!values.amount || Number.isNaN(Number(values.amount))) errors.amount = 'Enter the funded amount.';
    if (!values.accountId) errors.accountId = buildError('Choose an escrow account.');
  }
  if (actionId === 'wallet') {
    if (!values.sourceId) errors.sourceId = buildError('Choose a source wallet.');
    if (!values.destination?.trim()) errors.destination = buildError('Enter a destination or beneficiary.');
    if (!values.amount || Number.isNaN(Number(values.amount))) errors.amount = 'Enter a transfer amount.';
  }
  if (actionId === 'mentoring') {
    if (!values.mentorId && !values.mentorHandle?.trim()) {
      errors.mentorId = buildError('Select or reference a mentor.');
    }
    if (!values.topic?.trim()) errors.topic = buildError('Outline the session focus.');
    if (!values.sessionDate) errors.sessionDate = buildError('Pick a session date.');
    if (!values.sessionDuration || Number.isNaN(Number(values.sessionDuration))) {
      errors.sessionDuration = 'Add a duration in minutes.';
    }
  }
  return errors;
}

function buildPayload(actionId, values) {
  switch (actionId) {
    case 'project':
      return {
        title: values.title?.trim(),
        summary: values.summary?.trim(),
        budget: values.budget ? Number(values.budget) : undefined,
        currency: values.currency,
        startsAt: values.startDate || undefined,
        dueAt: values.dueDate || undefined,
        templateId: values.templateId || undefined,
        collaborators: values.collaborators
          ? values.collaborators
              .split(',')
              .map((email) => email.trim())
              .filter(Boolean)
          : [],
        briefUrl: values.briefUrl?.trim() || undefined,
        kickoffLink: values.kickoffLink?.trim() || undefined,
      };
    case 'gig-order':
      return {
        projectId: values.projectId,
        vendorName: values.vendorName?.trim(),
        serviceName: values.serviceName?.trim(),
        amount: Number(values.amount),
        currency: values.currency,
        dueAt: values.dueAt || undefined,
        notes: values.notes?.trim() || undefined,
        attachments: values.attachments?.split(',').map((item) => item.trim()).filter(Boolean) ?? [],
      };
    case 'escrow':
      return {
        projectId: values.projectId,
        milestoneName: values.milestoneName?.trim() || 'Funded milestone',
        amount: Number(values.amount),
        currency: values.currency,
        accountId: values.accountId,
        releaseDate: values.releaseDate || undefined,
        releaseRule: values.releaseRule?.trim() || undefined,
        notifyEmails: values.notifyEmails
          ? values.notifyEmails
              .split(',')
              .map((email) => email.trim())
              .filter(Boolean)
          : [],
      };
    case 'wallet':
      return {
        sourceId: values.sourceId,
        destination: values.destination?.trim(),
        amount: Number(values.amount),
        currency: values.currency,
        transferDate: values.transferDate || undefined,
        cadence: values.cadence,
        memo: values.memo?.trim() || undefined,
      };
    case 'mentoring':
      return {
        mentorId: values.mentorId || undefined,
        mentorHandle: values.mentorHandle?.trim() || undefined,
        topic: values.topic?.trim(),
        sessionDate: values.sessionDate,
        sessionDuration: Number(values.sessionDuration),
        meetingLink: values.meetingLink?.trim() || undefined,
        prepNotes: values.prepNotes?.trim() || undefined,
        recordingPreference: values.recordingPreference,
      };
    default:
      return values;
  }
}

async function submitAction(actionId, userId, payload) {
  switch (actionId) {
    case 'project':
      return createProject(userId, payload);
    case 'gig-order':
      return createGigOrder(userId, payload);
    case 'escrow':
      return createEscrowTransaction(userId, payload);
    case 'wallet':
      return createTransferRequest(userId, payload);
    case 'mentoring':
      return createMentoringSession(userId, payload);
    default:
      throw new Error(`Unsupported action: ${actionId}`);
  }
}

function QuickActionModal({ actionId, open, onClose, onCompleted, context, userId }) {
  const config = actionId ? ACTION_CONFIG[actionId] : null;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(actionId ? INITIAL_VALUES[actionId] : {});
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currencyOptions = context.currencies?.length ? context.currencies : DEFAULT_CURRENCIES;
  const projectOptions = useMemo(() => {
    return (context.projects ?? []).map((project) => ({
      value: String(project.id ?? project.projectId ?? project.slug ?? project.name),
      label: project.name ?? project.title ?? `Project #${project.id ?? project.projectId ?? ''}`,
    }));
  }, [context.projects]);

  const templateOptions = useMemo(() => {
    return (context.projectTemplates ?? []).map((template) => ({
      value: String(template.id ?? template.slug ?? template.name),
      label: template.name ?? template.title ?? 'Template',
    }));
  }, [context.projectTemplates]);

  const escrowOptions = useMemo(() => {
    return (context.escrowAccounts ?? []).map((account) => ({
      value: String(account.id ?? account.accountId ?? account.reference),
      label: account.name ?? account.label ?? account.reference ?? `Account ${account.id}`,
    }));
  }, [context.escrowAccounts]);

  const walletOptions = useMemo(() => {
    return (context.walletAccounts ?? []).map((wallet) => ({
      value: String(wallet.id ?? wallet.accountId ?? wallet.slug ?? wallet.name),
      label: wallet.name ?? wallet.label ?? wallet.accountNumber ?? 'Wallet account',
    }));
  }, [context.walletAccounts]);

  const mentorOptions = useMemo(() => {
    return (context.mentors ?? []).map((mentor) => ({
      value: String(mentor.id ?? mentor.mentorId ?? mentor.handle ?? mentor.email),
      label: mentor.name ?? mentor.fullName ?? mentor.handle ?? mentor.email ?? 'Mentor',
    }));
  }, [context.mentors]);

  useEffect(() => {
    if (!open || !actionId) {
      return;
    }
    setValues((previous) => ({
      ...INITIAL_VALUES[actionId],
      currency: previous.currency ?? INITIAL_VALUES[actionId].currency,
    }));
    setErrors({});
    setFeedback(null);
    setStep(0);
  }, [open, actionId]);

  if (!config) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
  };

  const goNext = () => {
    const validation = validate(actionId, values);
    setErrors(validation);
    if (Object.keys(validation).length === 0) {
      setStep((current) => Math.min(current + 1, config.steps.length - 1));
    }
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validate(actionId, values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const payload = buildPayload(actionId, values);
      await submitAction(actionId, userId, payload);
      setFeedback({ type: 'success', message: config.successMessage });
      setValues(INITIAL_VALUES[actionId]);
      setErrors({});
      onCompleted?.();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'We could not complete that action just now.';
      setFeedback({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    const stepId = config.steps[step]?.id;
    switch (actionId) {
      case 'project':
        if (stepId === 'summary') {
          return (
            <Fieldset legend="Project summary" description="Outline the essentials for your delivery squad.">
              <Input
                label="Project name"
                name="title"
                placeholder="Brand launch operations"
                value={values.title}
                onChange={handleChange}
                error={errors.title}
                required
              />
              <TextArea
                label="Summary"
                name="summary"
                placeholder="Describe the mission, goals, and success metrics."
                value={values.summary}
                onChange={handleChange}
                error={errors.summary}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Budget"
                  name="budget"
                  type="number"
                  min="0"
                  placeholder="25000"
                  value={values.budget}
                  onChange={handleChange}
                  error={errors.budget}
                />
                <Select
                  label="Currency"
                  name="currency"
                  value={values.currency}
                  onChange={handleChange}
                  options={currencyOptions}
                />
              </div>
            </Fieldset>
          );
        }
        if (stepId === 'timeline') {
          return (
            <Fieldset legend="Timeline" description="Set the pacing so collaborators know what to expect.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Kickoff"
                  name="startDate"
                  type="date"
                  value={values.startDate}
                  onChange={handleChange}
                  error={errors.startDate}
                />
                <Input
                  label="Due date"
                  name="dueDate"
                  type="date"
                  value={values.dueDate}
                  onChange={handleChange}
                  error={errors.dueDate}
                />
              </div>
              <Input
                label="Kickoff meeting link"
                name="kickoffLink"
                type="url"
                placeholder="https://meet..."
                value={values.kickoffLink}
                onChange={handleChange}
              />
              <Select
                label="Use a template"
                name="templateId"
                value={values.templateId}
                onChange={handleChange}
                options={templateOptions}
                helper={templateOptions.length ? 'Reuse a proven structure for milestones and tasks.' : 'No templates yet.'}
              />
            </Fieldset>
          );
        }
        return (
          <Fieldset legend="Collaboration" description="Share resources and notify the right collaborators.">
            <Input
              label="Brief URL"
              name="briefUrl"
              type="url"
              placeholder="https://docs..."
              value={values.briefUrl}
              onChange={handleChange}
            />
            <TextArea
              label="Collaborators"
              name="collaborators"
              placeholder="team@gigvora.com, studio@gigvora.com"
              helper="Comma separated emails. Everyone receives a kickoff summary."
              value={values.collaborators}
              onChange={handleChange}
            />
          </Fieldset>
        );
      case 'gig-order':
        if (stepId === 'context') {
          return (
            <Fieldset legend="Context" description="Tie this order back to an active project and vendor.">
              <Select
                label="Project"
                name="projectId"
                value={values.projectId}
                onChange={handleChange}
                options={projectOptions}
                error={errors.projectId}
              />
              <Input
                label="Vendor"
                name="vendorName"
                placeholder="Acme Studio"
                value={values.vendorName}
                onChange={handleChange}
                error={errors.vendorName}
              />
              <Input
                label="Service"
                name="serviceName"
                placeholder="Launch landing page build"
                value={values.serviceName}
                onChange={handleChange}
                error={errors.serviceName}
              />
            </Fieldset>
          );
        }
        if (stepId === 'commercials') {
          return (
            <Fieldset legend="Commercials" description="Clarify the pricing, currency, and deadlines.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Amount"
                  name="amount"
                  type="number"
                  min="0"
                  value={values.amount}
                  onChange={handleChange}
                  error={errors.amount}
                />
                <Select
                  label="Currency"
                  name="currency"
                  value={values.currency}
                  onChange={handleChange}
                  options={currencyOptions}
                />
              </div>
              <Input
                label="Delivery date"
                name="dueAt"
                type="date"
                value={values.dueAt}
                onChange={handleChange}
                error={errors.dueAt}
              />
              <TextArea
                label="Payment notes"
                name="notes"
                placeholder="50% upfront, 50% once accepted"
                value={values.notes}
                onChange={handleChange}
              />
            </Fieldset>
          );
        }
        return (
          <Fieldset legend="Handoff" description="Attach references so fulfilment starts smoothly.">
            <TextArea
              label="Attachments"
              name="attachments"
              placeholder="https://drive..."
              helper="Paste URLs separated by commas."
              value={values.attachments}
              onChange={handleChange}
            />
          </Fieldset>
        );
      case 'escrow':
        if (stepId === 'link') {
          return (
            <Fieldset legend="Reference" description="Point to the project or milestone this escrow protects.">
              <Select
                label="Project"
                name="projectId"
                value={values.projectId}
                onChange={handleChange}
                options={projectOptions}
                error={errors.projectId}
              />
              <Input
                label="Milestone name"
                name="milestoneName"
                placeholder="Launch sprint"
                value={values.milestoneName}
                onChange={handleChange}
              />
            </Fieldset>
          );
        }
        if (stepId === 'funding') {
          return (
            <Fieldset legend="Funding" description="Choose an escrow account and lock in the funded amount.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Amount"
                  name="amount"
                  type="number"
                  min="0"
                  value={values.amount}
                  onChange={handleChange}
                  error={errors.amount}
                />
                <Select
                  label="Currency"
                  name="currency"
                  value={values.currency}
                  onChange={handleChange}
                  options={currencyOptions}
                />
              </div>
              <Select
                label="Escrow account"
                name="accountId"
                value={values.accountId}
                onChange={handleChange}
                options={escrowOptions}
                error={errors.accountId}
              />
              <Input
                label="Planned release"
                name="releaseDate"
                type="date"
                value={values.releaseDate}
                onChange={handleChange}
              />
              <TextArea
                label="Release rule"
                name="releaseRule"
                placeholder="Auto-release once QA approved."
                value={values.releaseRule}
                onChange={handleChange}
              />
            </Fieldset>
          );
        }
        return (
          <Fieldset legend="Signals" description="Let the right stakeholders know funds are secured.">
            <TextArea
              label="Notify"
              name="notifyEmails"
              placeholder="finance@gigvora.com, vendor@gigvora.com"
              helper="Comma separated emails receive instant release updates."
              value={values.notifyEmails}
              onChange={handleChange}
            />
          </Fieldset>
        );
      case 'wallet':
        if (stepId === 'source') {
          return (
            <Fieldset legend="Source" description="Choose the wallet and amount you want to move.">
              <Select
                label="Source wallet"
                name="sourceId"
                value={values.sourceId}
                onChange={handleChange}
                options={walletOptions}
                error={errors.sourceId}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Amount"
                  name="amount"
                  type="number"
                  min="0"
                  value={values.amount}
                  onChange={handleChange}
                  error={errors.amount}
                />
                <Select
                  label="Currency"
                  name="currency"
                  value={values.currency}
                  onChange={handleChange}
                  options={currencyOptions}
                />
              </div>
            </Fieldset>
          );
        }
        if (stepId === 'destination') {
          return (
            <Fieldset legend="Destination" description="Share where the funds are heading and why.">
              <Input
                label="Destination"
                name="destination"
                placeholder="Escrow account / Vendor payout"
                value={values.destination}
                onChange={handleChange}
                error={errors.destination}
              />
              <Input
                label="Transfer date"
                name="transferDate"
                type="date"
                value={values.transferDate}
                onChange={handleChange}
              />
              <Select
                label="Cadence"
                name="cadence"
                value={values.cadence}
                onChange={handleChange}
                options={TRANSFER_CADENCE_OPTIONS}
              />
            </Fieldset>
          );
        }
        return (
          <Fieldset legend="Governance" description="Add treasury notes so reconciliation stays straightforward.">
            <TextArea
              label="Memo"
              name="memo"
              placeholder="Budget re-allocation for Q3 campaign."
              value={values.memo}
              onChange={handleChange}
            />
          </Fieldset>
        );
      case 'mentoring':
        if (stepId === 'mentor') {
          return (
            <Fieldset legend="Mentor" description="Pick an approved mentor or reference someone externally.">
              <Select
                label="Available mentors"
                name="mentorId"
                value={values.mentorId}
                onChange={handleChange}
                options={mentorOptions}
                helper={mentorOptions.length ? 'Select from mentors you have access to.' : 'Invite by handle instead.'}
              />
              <Input
                label="Mentor handle"
                name="mentorHandle"
                placeholder="@growth-mentor"
                value={values.mentorHandle}
                onChange={handleChange}
                error={errors.mentorId}
                helper="Provide a handle if you do not see them in the list."
              />
            </Fieldset>
          );
        }
        if (stepId === 'session') {
          return (
            <Fieldset legend="Session" description="Lock in the timing and purpose of your mentoring slot.">
              <TextArea
                label="Topic"
                name="topic"
                placeholder="Mock launch review and positioning feedback"
                value={values.topic}
                onChange={handleChange}
                error={errors.topic}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Session date"
                  name="sessionDate"
                  type="datetime-local"
                  value={values.sessionDate}
                  onChange={handleChange}
                  error={errors.sessionDate}
                />
                <Input
                  label="Duration (minutes)"
                  name="sessionDuration"
                  type="number"
                  min="15"
                  step="15"
                  value={values.sessionDuration}
                  onChange={handleChange}
                  error={errors.sessionDuration}
                />
              </div>
            </Fieldset>
          );
        }
        return (
          <Fieldset legend="Enablement" description="Share meeting links and expectations ahead of time.">
            <Input
              label="Meeting link"
              name="meetingLink"
              type="url"
              placeholder="https://meet..."
              value={values.meetingLink}
              onChange={handleChange}
            />
            <TextArea
              label="Preparation notes"
              name="prepNotes"
              placeholder="Attach deck links or topics you want to cover."
              value={values.prepNotes}
              onChange={handleChange}
            />
            <Select
              label="Recording preference"
              name="recordingPreference"
              value={values.recordingPreference}
              onChange={handleChange}
              options={[
                { value: 'allow', label: 'Allow recording' },
                { value: 'disallow', label: 'Do not record' },
                { value: 'request', label: 'Request a recording for review' },
              ]}
            />
          </Fieldset>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={config.title}
      description={config.description}
      wide
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Stepper steps={config.steps} activeIndex={step} />
        {feedback ? (
          <div
            className={`rounded-3xl border px-4 py-3 text-sm font-medium ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
        {renderStep()}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">Step {step + 1} of {config.steps.length}</div>
          <div className="flex items-center gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                Cancel
              </button>
            )}
            {step < config.steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  config.submitLabel
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}

QuickActionModal.propTypes = {
  actionId: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onCompleted: PropTypes.func,
  context: PropTypes.shape({
    currencies: PropTypes.array,
    projects: PropTypes.array,
    projectTemplates: PropTypes.array,
    escrowAccounts: PropTypes.array,
    walletAccounts: PropTypes.array,
    mentors: PropTypes.array,
  }),
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

QuickActionModal.defaultProps = {
  actionId: undefined,
  open: false,
  onClose: undefined,
  onCompleted: undefined,
  context: {},
};

function ActivityFeed({ items }) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/50 p-6 text-sm text-slate-500">
        No recent activity yet. Actions you take will appear here.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id ?? item.reference ?? item.title}
          className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 shadow-soft"
        >
          <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
          <div>
            <p className="font-semibold text-slate-900">{item.title ?? item.summary ?? 'Activity'}</p>
            {item.summary ? <p className="text-sm text-slate-500">{item.summary}</p> : null}
            {item.timestamp ? (
              <p className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

ActivityFeed.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
};

ActivityFeed.defaultProps = {
  items: [],
};

export default function UserDashboardQuickActions({ userId, context, metrics, activity, onCompleted }) {
  const [activeAction, setActiveAction] = useState(null);

  const derivedMetrics = useMemo(() => {
    const merged = metrics ?? {};
    const format = (value, fallback = '0') => {
      if (value == null) {
        return fallback;
      }
      if (typeof value === 'number') {
        return value.toLocaleString('en-GB');
      }
      return String(value);
    };
    return [
      {
        icon: BriefcaseIcon,
        label: 'Active projects',
        value: format(merged.projectsActive ?? context.projects?.length ?? 0),
      },
      {
        icon: InboxStackIcon,
        label: 'Open gig orders',
        value: format(merged.gigOrdersOpen ?? context.gigOrders?.length ?? 0),
      },
      {
        icon: ShieldCheckIcon,
        label: 'Escrow in flight',
        value: format(merged.escrowInFlight ?? context.escrowAccounts?.length ?? 0),
      },
      {
        icon: BanknotesIcon,
        label: 'Wallet balance',
        value: merged.walletBalance
          ? `${merged.walletCurrency ?? 'USD'} ${Number(merged.walletBalance).toLocaleString('en-GB')}`
          : format(merged.walletBalance, '0'),
      },
    ];
  }, [metrics, context.projects?.length, context.gigOrders?.length, context.escrowAccounts?.length, metrics?.walletCurrency]);

  const actions = useMemo(() => Object.values(ACTION_CONFIG), []);

  return (
    <section className="rounded-4xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/60 p-6 shadow-soft">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Quick actions</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Launch projects, secure escrow, wire funds, and book mentors without leaving your dashboard.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[32rem]">
          {derivedMetrics.map((stat) => (
            <QuickActionStat key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => setActiveAction(action.id)}
            className={`group flex h-full flex-col justify-between rounded-3xl px-5 py-6 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg ${action.accent}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-500">
                  {action.title.split(' ')[0]}
                </span>
                <h4 className="mt-3 text-lg font-semibold text-slate-900 group-hover:text-slate-800">{action.title}</h4>
                <p className="mt-2 text-sm text-slate-600 group-hover:text-slate-700">{action.description}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-3 text-slate-600">
                <action.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
              Launch flow
              <PlayCircleIcon className="h-5 w-5" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-soft">
          <h4 className="text-lg font-semibold text-slate-900">Operational checklist</h4>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
              Confirm profile readiness before inviting collaborators.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
              Pair every gig order with an escrow milestone to keep payouts safe.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
              Use wallet memos so finance and auditing stay aligned.
            </li>
          </ul>
        </div>
        <div className="lg:col-span-2">
          <h4 className="mb-3 text-lg font-semibold text-slate-900">Latest activity</h4>
          <ActivityFeed items={activity ?? []} />
        </div>
      </div>

      <QuickActionModal
        actionId={activeAction}
        open={Boolean(activeAction)}
        onClose={() => setActiveAction(null)}
        onCompleted={onCompleted}
        context={context}
        userId={userId}
      />
    </section>
  );
}

UserDashboardQuickActions.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  context: PropTypes.shape({
    projects: PropTypes.array,
    projectTemplates: PropTypes.array,
    gigOrders: PropTypes.array,
    escrowAccounts: PropTypes.array,
    walletAccounts: PropTypes.array,
    mentors: PropTypes.array,
    currencies: PropTypes.array,
  }),
  metrics: PropTypes.shape({
    projectsActive: PropTypes.number,
    gigOrdersOpen: PropTypes.number,
    escrowInFlight: PropTypes.number,
    walletBalance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    walletCurrency: PropTypes.string,
  }),
  activity: PropTypes.array,
  onCompleted: PropTypes.func,
};

UserDashboardQuickActions.defaultProps = {
  context: {},
  metrics: undefined,
  activity: undefined,
  onCompleted: undefined,
};
